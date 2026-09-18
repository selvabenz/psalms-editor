#!/usr/bin/env python3
"""Build the browser-ready Psalm TAHOT bundle from Selah corpus JSON files."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def compact_word(word: dict) -> dict:
    return {
        "id": word["id"],
        "text": word.get("display") or word.get("text") or "",
        "raw": word.get("raw") or word.get("text") or "",
        "lemma": word.get("lemma") or "",
        "strong": word.get("dstrongs") or word.get("strongs") or "",
        "morph": word.get("morphology") or "",
        "gloss": word.get("gloss") or "",
        "textType": word.get("textType") or "",
        "variants": word.get("variants") or [],
    }


def build(corpus_dir: Path) -> dict:
    files = sorted(corpus_dir.glob("PSA*.corpus.json"))
    if not files:
        raise SystemExit(f"No PSA*.corpus.json files found in {corpus_dir}")

    psalms: dict[str, dict] = {}
    editions: list[dict] = []
    verse_count = token_count = 0

    for path in files:
        corpus = json.loads(path.read_text(encoding="utf-8"))
        psalm = int(corpus["psalm"])
        if str(psalm) in psalms:
            raise SystemExit(f"Duplicate Psalm {psalm}: {path}")
        editions.append(corpus.get("sourceEdition") or {})
        verses: dict[str, dict] = {}
        for verse in corpus.get("verses", []):
            verse_id = str(verse["verse"])
            words = [compact_word(word) for word in verse.get("tokens", {}).get("he", [])]
            token_pattern = re.compile(rf"^PSA\.{psalm}\.{re.escape(verse_id)}\.H\d{{3}}$")
            ids = [word["id"] for word in words]
            if len(ids) != len(set(ids)) or any(not token_pattern.match(token_id) for token_id in ids):
                raise SystemExit(f"Invalid or duplicate token IDs in {path}, verse {verse_id}")
            verses[verse_id] = {
                "text": verse.get("texts", {}).get("he", ""),
                "kind": verse.get("kind", "verse"),
                "words": words,
            }
            verse_count += 1
            token_count += len(words)
        psalms[str(psalm)] = verses

    expected_psalms = {str(number) for number in range(1, 151)}
    missing = sorted(expected_psalms - set(psalms), key=int)
    extra = sorted(set(psalms) - expected_psalms, key=int)
    if missing or extra:
        raise SystemExit(f"Expected Psalms 1-150; missing={missing}, extra={extra}")

    hashes = {edition.get("sha256") for edition in editions}
    if len(hashes) != 1:
        raise SystemExit(f"Corpus files do not share one TAHOT source hash: {sorted(hashes)}")
    exemplar = editions[0]
    return {
        "meta": {
            "id": "TAHOT",
            "label": "TAHOT — Translators Amalgamated Hebrew OT",
            "language": "Hebrew",
            "code": "he",
            "direction": "rtl",
            "sha256": exemplar.get("sha256", ""),
            "retrieved": exemplar.get("retrieved", ""),
            "source": exemplar.get("source", "https://github.com/STEPBible/STEPBible-Data"),
            "license": "CC BY 4.0",
            "attribution": "Hebrew text and tagging data © STEP Bible, CC BY 4.0.",
            "verseCount": verse_count,
            "tokenCount": token_count,
        },
        "psalms": psalms,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("corpus_dir", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    bundle = build(args.corpus_dir)
    encoded = json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(f"window.TAHOT_PSALMS={encoded};\n", encoding="utf-8")
    meta = bundle["meta"]
    print(
        f"Wrote {args.output}: 150 Psalms, {meta['verseCount']} verses, "
        f"{meta['tokenCount']} tokens, {args.output.stat().st_size} bytes"
    )


if __name__ == "__main__":
    main()
