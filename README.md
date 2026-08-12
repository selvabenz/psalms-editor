# Psalms Editor

**Psalms Editor** is a local-first annotation tool for building a Hebrew-grounded structure and parallelism dataset for the **Tamil IRV Psalms**.

> **Current version:** v0.1 — Psalm 1 prototype

## Purpose

Psalms Editor helps Bible translators, consultants, Hebrew specialists, and reviewers analyze how Hebrew poetic structure is represented in Tamil.

The Scripture sources remain **read-only**. Alignment, structure, notes, and review decisions are stored separately as annotation data.

### Intended users

* Bible translators and consultants
* Biblical Hebrew specialists
* Tamil reviewers
* Exegetes and researchers

Users should understand basic Psalm structure, Hebrew poetry, and translation review. Biblical Hebrew knowledge is especially important for approving poetic segmentation and parallelism.

## Workflow

1. Load the read-only sources:

   * UHB v2.1.32
   * Tamil IRV
   * ESV
   * Hebrew–Tamil alignment data
2. Open a Psalm.
3. Verify Hebrew poetic lines / cola.
4. Review Hebrew–Tamil alignment.
5. Create parallel groups.
6. Mark corresponding elements (`a`, `b`, `c`, etc.).
7. Annotate larger Psalm structure.
8. Add translation-significance notes.
9. Review and approve annotations.
10. Export the dataset as JSON.

## Result

### What you can expect

Psalms Editor is designed to produce data that is:

* Hebrew-grounded
* Tamil-aware
* human-reviewed
* traceable
* portable
* separate from Scripture source files
* reusable in a future Tamil Psalms Explorer

### What you cannot expect

Psalms Editor is not:

* an automatic authority on Hebrew poetry
* a replacement for qualified translators or consultants
* a replacement for Paratext or translationCore
* a Scripture editing tool
* a guarantee that every structural interpretation is undisputed

v0.1 is a **research prototype**, not a completed scholarly dataset for the entire Psalter.

## Methodology

The project follows a Hebrew-first approach:

```text
Hebrew source
    ↓
Poetic segmentation
    ↓
Parallelism
    ↓
Component correspondence
    ↓
Hebrew–Tamil alignment
    ↓
Translation significance
```

The main annotation layers are:

* source text
* alignment
* poetic segmentation
* parallelism
* component correspondence
* Psalm structure
* translator notes
* review and approval

AI-assisted analysis may be added later, but AI suggestions should remain proposals until reviewed by a human.

## Principles

1. **Source integrity** — Scripture texts remain read-only.
2. **Hebrew priority** — Hebrew is the structural anchor.
3. **Translation sensitivity** — Tamil may legitimately restructure Hebrew expressions.
4. **No forced 1:1 alignment** — phrase-level and many-to-many alignment are supported.
5. **Human review** — important decisions require human approval.
6. **Traceability** — annotations should preserve status, confidence, reviewer, and revision.
7. **Reversibility** — annotations should be correctable.
8. **Portable data** — JSON is the main exchange format.
9. **Local-first** — core work can remain on the user's computer.

## Run Locally

### Requirements

* A modern browser
* Extracted Psalms Editor files

No database server is required for v0.1.

### Using Python 3

From the project folder:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

### Using Node.js

```bash
npx serve .
```

Open the local URL shown in the terminal.

Export annotation JSON regularly. Do not rely only on browser storage for long-term backup.

## Deploy on Vercel

> Before public deployment, confirm that you have permission to redistribute every Scripture source in the repository. Do not publicly deploy restricted resources such as the ESV unless your license permits it.

### From GitHub

1. Push Psalms Editor to GitHub.
2. In Vercel choose **Add New → Project**.
3. Import the repository.
4. For the current static v0.1 build use:

   * **Framework Preset:** Other
   * **Build Command:** leave blank
   * **Output Directory:** `.`
5. Deploy.

### Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

For production:

```bash
vercel --prod
```
::: 
