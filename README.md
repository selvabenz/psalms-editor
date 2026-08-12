# Psalms Editor — v0.2

Psalm 1 development build for a Hebrew-grounded Tamil IRV Psalms structure and parallelism dataset.

## v0.2 additions

- Hebrew-first **Segmentation** editor: assign/move UHB tokens between poetic segments without modifying Scripture.
- Proper **parallel group** creation and an active-group workflow. New a/b/c/d/e components attach to the active group automatically.
- **Component Manager** with Edit, Review, Approve, Reopen, Delete and revision history.
- **Approved components remain correctable**. Editing an approved component stores its prior revision and moves the edited revision to **Needs review**.
- Editable/reopenable parallel groups and structure units.
- Collision-safe unique IDs for groups, components and structures.
- v0.1.x import/migration. Duplicate legacy structure IDs are repaired without deleting content; ambiguous duplicate-ID parent references are cleared and reported.
- **Validation** for invalid references, duplicate/conflicting components, unassigned components, segment overlap across groups, Hebrew segmentation coverage and structure-parent integrity.
- Deleting a parallel group preserves its components as unassigned annotations instead of deleting them.
- Psalm approval is blocked by validation errors; warnings require explicit confirmation.

## Read-only policy

UHB v2.1.32, Tamil IRV, English and the supplied Hebrew–Tamil alignment are loaded as read-only source data. All work is saved separately as annotation JSON.

## Opening

Extract the ZIP and open `index.html`. For a local server, use `run-local.bat` on Windows or `./run-local.sh` on macOS/Linux, then open `http://localhost:8765`.

## Migrating your Psalm 1 v0.1.1 JSON

Use **Import annotations** and choose your `PSA001.annotations.v0.1.1.json`. v0.2 preserves your 5 groups, 22 components and 6 structures, repairs technical ID issues, and opens a migration report. Then open **Validation**.

## Recommended workflow

1. Review/fix Hebrew segmentation in **Segmentation**.
2. Select 2+ segments and create a parallel group.
3. Activate that group in Workbench.
4. Select corresponding Hebrew/Tamil words and assign a/b/c/d/e.
5. Use **Components** to edit/review/approve.
6. Build the Psalm-level outline in **Structure**.
7. Resolve **Validation** errors/warnings before final approval/export.

## Correcting an approved component

Open **Components → Edit**, correct token selection/label/group/note, and **Save changes**. The previous approved revision is preserved, and the new revision becomes **Needs review**. History can restore an earlier component revision as a new reviewable revision.

## Scope

v0.2 remains a Psalm 1 prototype. Do not scale to Psalms 2–150 until this workflow is reviewed on representative Psalms.
