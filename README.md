# Tamil Psalms Structure & Parallelism Editor — v0.1.1

A local-first, browser-based prototype for building a Hebrew-grounded structure and parallelism dataset for Tamil IRV Psalms.

## What v0.1.1 includes

- Psalm 1 from the user-supplied Tamil IRV, UHB v2.1.32, ESV, and Hebrew–Tamil alignment sources.
- Scripture sources are read-only inside the editor; annotations are kept in a separate state object.
- UHB Hebrew token inspector with lemma, Strong's identifier, morphology, and existing Tamil alignment.
- Tamil alignment-token inspector with linked Hebrew information.
- Draft working-line scaffold for Psalm 1 (annotation scaffold only; not a scholarly final segmentation).
- Parallel-group creation with type, confidence, notes, review and approval.
- `a/b/c/d/e` correspondence components over selected Hebrew/Tamil tokens.
- Psalm structure units with nested parent, type, line range, translation-significance note, review and approval.
- Undo/redo, browser localStorage persistence, JSON import/export, source SHA-256 provenance, and “Approve all reviewed”.
- Optional Psalm 1 starter example, explicitly marked **Draft**.

## Run it

### Simplest
Open `index.html` in a modern browser. The data file is loaded as JavaScript, so no server is required.

### Local server (recommended)
On macOS/Linux:

```bash
./run-local.sh
```

On Windows, double-click `run-local.bat` (Python must be installed).

Then open `http://localhost:8765`.

## Data safety

The application does not write into any Scripture source. Browser edits are saved under the localStorage key `tamil-psalms-editor-v0.1-psalm1`. Use **Export annotations** to save a portable JSON file.

The `data/psalm1.js` file is a parsed snapshot generated from the supplied sources and contains provenance hashes. Rebuilding source data is done by `tools/build_psalm.py`.

## Rebuild Psalm 1 from source files

```bash
python3 tools/build_psalm.py \
  --tamil /path/to/TamilIRV.SFM \
  --esv /path/to/ESV_Psalms.SFM \
  --alignment /path/to/Hebrew-Tamil-alignment.usfm \
  --uhb /path/to/UHB/psa/1.json \
  --chapter 1 \
  --out data/psalm1.js
```

## Important v0.1 limitation

The “working-line scaffold” is currently derived from the Tamil poetic-line markers and existing alignment. It is intentionally labelled a **draft scaffold**. The next milestone should add a dedicated Hebrew colon/line segmentation editor so Hebrew segmentation becomes the authoritative structural layer before scaling to Psalms 1–150.

## ESV distribution note

The ESV text in this prototype comes from the user-supplied local file. Before publishing a public GitHub Pages build that contains ESV text, confirm that the intended redistribution is permitted. The public Explorer can alternatively make the English layer optional or use a distributable English source.


## v0.1.1 fix

Fixed a JavaScript initialization-order bug that caused the Workbench source text area to remain blank when opening `index.html`. Also made localStorage saving non-fatal in browsers that restrict storage for `file://` pages.
