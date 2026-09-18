# Changelog
## 0.5.0 — 2026-09-18
- Added Rose Cookies (`rose-cookies` v0.1.0) import and export without changing annotation schema v0.4.
- Added locally bundled ZIP reading/writing, manifest-schema validation, ZIP path safety, byte-size checks, and SHA-256 integrity verification.
- Added transactional IndexedDB persistence with active-Psalm indexes for Scripture tokens, Word Alignment, Kichadi units, support words, compatibility files, and review overlays.
- Added one immutable Tamil IRV display with `Text | Tags | Word Align | Kichadi` controls.
- Preserved complete one-to-many, many-to-one, many-to-many, discontiguous, split, implicit, and not-located relationships.
- Added revision-safe Kichadi human review without mutating imported semantic resources or auto-approving AI proposals.
- Added byte-identical translationCore aligned-USFM and semantic-USFM compatibility exports while unchanged.
- Added reviewed derivative export with recalculated integrity metadata and source-package provenance.
- Added token-level conflict reporting when a loaded Tamil IRV source differs from incoming Rose Cookies Scripture.
- Enabled Word Alignment by default and separated relationship inspection from annotation-token selection.
- Added grouped Hebrew↔Tamil phrase visualization with stable references in the inspector.
- Preserved schema v0.4 annotations, earlier migrations, TAHOT, ordinary USFM/SFM, local-first operation, and all existing workflows.

## 0.4.0 — 2026-09-18
- Added schema v0.4 support for annotation files from Psalms 1–150.
- Added separate local storage and selection for each Psalm.
- Added multi-file annotation import and Psalm-aware export names.
- Added annotation-only review views when Scripture source text is not bundled.
- Bundled read-only STEP Bible TAHOT Hebrew text and token metadata for Psalms 1–150.
- Added reusable USFM/SFM import for read-only Scripture content in any language and text direction.

## 0.3.0 — 2026-09-18
- Adopted the unified v0.3 annotation schema and canonical token IDs.
- Added source revision metadata, provenance, projections, PASA review states, and schema-shaped validation output.
- Added v0.2 migration support, parallelism types, and component labels through `i`.

## 0.2.0 — 2026-08-09
- Hebrew-first segmentation editor.
- Active parallel-group/component workflow.
- Revision-safe component editing after approval.
- Component manager and revision restoration.
- Editable parallel groups and structures.
- Unique-ID generation.
- v0.1.x migration with duplicate structure-ID repair.
- Validation panel and approval gate.
- Parallel group deletion preserves components as unassigned.
