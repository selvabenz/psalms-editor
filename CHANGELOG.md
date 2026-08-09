# Changelog

## v0.1.1
- Fixed startup initialization bug that prevented Psalm 1 source text from rendering.
- Made localStorage persistence non-fatal when opening directly from `file://`.
- Updated exported annotation filename to v0.1.1.

# Changelog

## v0.1 — Psalm 1 prototype

- Added read-only Psalm 1 source layer for Tamil IRV, UHB v2.1.32, ESV, and existing Hebrew–Tamil alignment.
- Added Hebrew morphology/alignment inspector.
- Added token selection and `a/b/c/d/e` component annotations.
- Added parallel group editor with type, confidence, notes, review/approval.
- Added structure outline editor with nesting and translation-significance notes.
- Added local persistence, undo/redo, JSON import/export, approval workflow, and source provenance hashes.
- Added optional draft Psalm 1 starter example.
- Added source rebuild script and JSON schema.

### Known limitation
The line scaffold is Tamil-marker/alignment-derived. A dedicated Hebrew colon segmentation editor is the next data-model milestone.
