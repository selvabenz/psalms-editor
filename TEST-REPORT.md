# v0.3 Test Report

Date: 2026-09-18

## Automated checks passed

### Static / integrity suite — 25/25 passed

- JavaScript syntax (`node --check`).
- Every static DOM ID referenced by the application exists.
- Psalm 1 source bundle includes UHB verses 1–6 and the 15 initial scaffold segments.
- Read-only source payloads (Hebrew, Tamil display text, ESV display text, Hebrew–Tamil alignment, scaffold lines) are object-for-object unchanged from v0.1.1.
- Source SHA-256 provenance records are unchanged.
- v0.3 annotation schema parses and reports the correct schema version.
- The exact uploaded v0.1.1 migration sample contains the expected 5 groups, 22 components and 6 structures.
- Required v0.3 implementation hooks exist for canonical token IDs, provenance, projections, unique IDs, migration, duplicate/conflict/unattached validation, Hebrew coverage validation, revision restore and segment assignment.

Run with:

```sh
python tests/static_integrity_test.py
```

### Runtime startup + migration/workflow smoke suite — 29/29 passed

The actual `data/psalm1.js` and `app.js` are executed in a deterministic DOM harness. The suite verifies:

- app startup completes without a JavaScript runtime exception;
- all six Psalm 1 verse cards are created;
- v0.3 JSON is rendered;
- the exact uploaded v0.1.1 Psalm 1 JSON imports through the application's bound Import control;
- migration preserves 5 groups, 22 components and 6 structures;
- duplicate legacy structure IDs are repaired to six unique IDs;
- migration does not create self-parent structures;
- migration report opens and validation issues are surfaced;
- existing v0.2 exports migrate to v0.3 base records, projections, and canonical token IDs;
- new parallel groups receive collision-safe IDs (`P006` in the test case);
- new components receive collision-safe IDs (`C023` in the test case);
- new components automatically attach to the active parallel group;
- editing an approved component resets the edited revision to **Needs discussion**;
- the previous approved component revision is preserved;
- corrected label/token selections are stored;
- new structures receive collision-safe IDs (`S007` after migration);
- deleting a parallel group preserves its component records and leaves them unassigned for review;
- Hebrew segmentation token assignment can resolve a duplicate segment assignment.

Run with:

```sh
node tests/runtime_smoke_test.js
```

## Migration fixture

`sample/PSA001.annotations.v0.3.migrated-preview.json` is the v0.3 migration output produced from the v0.1.1 Psalm 1 annotations during the runtime workflow test.

## Browser-engine note

A Chromium headless visual/E2E launch was attempted in this container, but the installed Chromium process does not complete headless startup even on `about:blank`, so a real-browser automated visual test is not counted as passed. The application has no network/runtime dependencies and retains the v0.1.1 local-file architecture. A short visual check in the user's normal browser is still recommended before a long annotation session.

No software can be guaranteed to be completely bug-free; this report records the checks actually run for this build.
