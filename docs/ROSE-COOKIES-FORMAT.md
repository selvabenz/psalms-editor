# Rose Cookies Format Specification

**Identifier:** `rose-cookies`  
**Specification version:** `0.1.0`  
**Package extension:** `.rose.zip`  
**Root manifest:** `rose-cookies.json`

Rose Cookies is the Psalms Editor project's local-first interchange format. It keeps one immutable Scripture token stream together with attached linguistic layers without duplicating or silently correcting Scripture.

## Package profile

A package is an ordinary ZIP archive with this logical layout:

```text
rose-cookies.json
layers/scripture/*.tagged.SFM
layers/scripture/*.tokens.json
layers/word-alignment/*.word-alignment.json
layers/kichadi/*.kichadi.json
compatibility/*.aligned.usfm
compatibility/*.semantic.usfm
provenance/*
reports/*
schema/*
docs/*
```

The root manifest declares the package identity, canonical layers, compatibility resources, import policy, and a byte size plus SHA-256 digest for every integrity-controlled file. A Psalms Editor import is transactional: every blocking check completes before the active IndexedDB package pointer changes.

## Shared identity

The Psalms profile uses twelve-character BCVWP references:

```text
BBCCCVVVWWWP
```

- `BB`: Bible book number (`19` for Psalms)
- `CCC`: Psalm number
- `VVV`: verse; `000` identifies a title or superscription
- `WWW`: word position
- `P`: word part

The source document is `TAHOT`; the target document is `IRVTam-PSA`. Layers attach only through these references, never through Tamil spelling.

## Canonical layers

### Scripture and Tags

The token index is the canonical, immutable Tamil stream. It may carry Strong's numbers, Hebrew lemma, morphology, source references, English gloss/reference, cross-verse metadata, and addition/unlinked flags. The tagged SFM remains a preserved package ingredient.

### Word Alignment

The `rose-cookies-word-alignment` layer stores complete source and target reference arrays. One-to-one, one-to-many, many-to-one, many-to-many, and discontiguous units remain grouped and must not be expanded into artificial token pairs.

### Kichadi

The `rose-cookies-kichadi` layer stores semantic units and their separate realizations. Split spans remain separate. Implicit and not-located markers have no fabricated target references. Support words are distinct from lexical alignment and use these categories:

- `GRAMMATICALLY_REQUIRED`
- `EXPLICITATION_SUPPORTED`
- `CONTEXT_SUPPORTED`
- `POSSIBLY_UNSUPPORTED`
- `UNCERTAIN`

Imported resources are immutable. Human review is a separate overlay keyed by semantic unit and optional realization identity. The review vocabulary is `AI_PROPOSED`, `HUMAN_MODIFIED`, `HUMAN_APPROVED`, `HUMAN_REJECTED`, and `NEEDS_DISCUSSION`. Editing an approved review preserves its prior revision and returns it to `NEEDS_DISCUSSION`.

## Import safety

A conforming importer must reject:

- a missing root manifest, wrong format, or unsupported version;
- absolute, traversal, backslash, NUL, or duplicate normalized ZIP paths;
- a missing required or integrity-declared file;
- byte-size or SHA-256 mismatch;
- invalid or duplicate BCVWP token identities;
- layer references to nonexistent source or target tokens;
- malformed split spans or fabricated implicit/not-located targets;
- Scripture conflicts with an already loaded copy of the same target text;
- stale human review attached to changed immutable resources.

## Storage and export

Large resources belong in IndexedDB and are queried by active Psalm. Existing annotation JSON can remain in local storage. Original aligned and semantic compatibility files remain byte-identical until a user intentionally creates a derivative. Exported packages recalculate sizes and SHA-256 values. Reviewed exports identify the original package hash and include review provenance without mutating the preserved imported source.

Rose Cookies does not grant rights to redistribute the Scripture or source data contained in a package. Implementations preserve supplied rights and provenance metadata.
