# Psalms Editor

**Psalms Editor** is a local-first annotation application for building a Hebrew-grounded **structure and parallelism resource for the Tamil IRV Psalms**.

The editor keeps Scripture source texts read-only and stores scholarly analysis in a separate annotation layer. The long-term goal is to create a reviewable, reusable dataset for Psalms 1–150 that can support translators, reviewers, consultants, researchers, and a future read-only Selah.

> **Current status:** v0.5 retains schema v0.4 annotations for Psalms 1–150, bundles read-only TAHOT Hebrew, accepts ordinary USFM/SFM sources, and imports Rose Cookies 0.1 packages containing one Tamil Scripture stream with coordinated Tags, Word Alignment, and Kichadi layers.

---

## Purpose

Psalms Editor is designed to help a translation or scholarly team create and maintain structured annotations for:

- Hebrew poetic-line / colon segmentation
- Hebrew–Tamil word and phrase alignment
- poetic parallelism groups
- corresponding components such as `a / b / c / d / e`
- Psalm-level literary structure
- translator and reviewer notes
- confidence, review, approval, correction, and revision history
- validation of the annotation dataset before approval or publication

The application is **not a Bible-text editor**. It does not change the Hebrew, Tamil, or English Bible source text. It creates a separate scholarly layer that can be reviewed, corrected, exported, and reused.

### Read-only source resources

The project is designed around these source layers:

- **TAHOT** — bundled read-only Hebrew Psalms from STEP Bible, including token IDs, lemma, Strong's, morphology, gloss, text-type, and variant metadata
- **USFM/SFM Scripture sources** — user-imported read-only content in Tamil, English, or any other language
- **Rose Cookies** — one immutable Tamil IRV token stream with Tagged metadata, complete Hebrew↔Tamil Word Alignment units, and Kichadi semantic units
- **Hebrew–Tamil alignment data** — existing alignment information that can be imported, checked, and extended

All annotation work belongs to the Psalms Editor dataset, not to the Scripture source files.

---

## Philosophy

Psalms Editor follows several core principles.

### Hebrew is the structural anchor

The poetic structure of the Psalm is established from the Hebrew text first. Tamil and English are then mapped to that Hebrew analysis rather than being used independently to reconstruct the original structure.

### Scripture text remains immutable

Bundled TAHOT Hebrew, imported USFM/SFM sources, and Rose Cookies Scripture/layers are read-only resources. Segmentation, parallelism, structure, notes, and human Kichadi review overlays are stored separately.

### Human review remains authoritative

Software and future AI assistance may propose analyses, but they should not silently determine the scholarly result. A human reviewer must be able to accept, modify, reject, dispute, or reopen an annotation.

### Approval is reversible

Approved annotations are not permanently locked. If an approved component, group, structure, or other annotation needs correction, the editor should preserve the earlier revision and return the changed annotation to review.

### Uncertainty should be visible

Poetic analysis is sometimes disputed. The dataset should preserve confidence levels, reviewer notes, alternative judgments, and unresolved questions instead of forcing false certainty.

### Data should outlive the interface

The annotation dataset is more important than any particular screen design. Data should remain portable, inspectable, versionable, and exportable independently of the current UI.

---

## Who is the end user?

Psalms Editor is primarily intended for:

- Tamil Bible translators
- translation reviewers and checkers
- Hebrew consultants
- exegetical and translation consultants
- Scripture-engagement or linguistic researchers working with Psalms
- project administrators maintaining the Psalms annotation dataset

It can also support developers who are building downstream tools such as a read-only **Selah**.

### What are users expected to know?

A normal annotation user does **not** need programming knowledge.

Users should ideally be comfortable with:

- Bible references and Psalm structure
- reading Tamil
- basic concepts of Hebrew poetry and parallelism
- selecting words and phrases for alignment
- distinguishing observation from interpretation
- reviewing and documenting scholarly decisions

Knowledge of Biblical Hebrew is strongly recommended for users making final segmentation, parallelism, or structural decisions. Morphology, lemma, gloss, alignment, and English Bible information are intended to assist the reviewer, not replace Hebrew competence.

Repository maintainers should additionally be comfortable with Git/GitHub and basic static-web deployment.

---

## Workflow

The recommended annotation workflow is:

1. **Open the Psalm** and confirm that the Hebrew, Tamil IRV, English Bible, and available alignment data are present.
2. **Review Hebrew segmentation** and establish the poetic cola / lines without editing the bundled TAHOT source text.
3. **Map Tamil expressions** to the relevant Hebrew units using many-to-many alignment where necessary.
4. **Create parallel groups** from two or more poetic segments.
5. **Classify the relationship**, for example:
   - Synonymous
   - Antithetic
   - Complementary / Synthetic
   - Climactic / Staircase
   - Comparative / Emblematic
   - Consequential
   - Repetition
   - Other
   - Uncertain
6. **Assign corresponding components** such as `a / b / c / d / e` to the Hebrew and Tamil expressions that correspond across the parallel lines.
7. **Add larger literary structure**, such as sections, strophes, stanzas, refrains, inclusios, chiasms, acrostics, contrasts, or comparisons.
8. **Add translation significance or reviewer notes** where the structure matters for Tamil translation or checking.
9. **Review and correct annotations**. Approved annotations may be reopened when necessary.
10. **Run validation** to identify invalid references, unattached components, duplicates, conflicts, overlap problems, incomplete segmentation, or structure issues.
11. **Resolve errors and review warnings**.
12. **Approve the Psalm** only after the annotation dataset is internally consistent.
13. **Export the annotation JSON** for version control, review, research, or use in a read-only Selah.

Use **Import annotations** to select one or multiple schema v0.4 JSON files for Psalms 1–150. Each Psalm is kept in a separate local workspace and can be reopened from the Psalm selector. When a matching Scripture source bundle is unavailable, the editor shows annotation token references and any Tamil/English projection text supplied in the file.

Use **Add USFM/SFM** to add a read-only Psalms translation in any language. Supply a language code, name, source label, text direction, and one or more Psalms USFM/SFM files. The importer reads `\id PSA`, `\c`, `\v`, poetry and paragraph continuation markers, Psalm titles, and character styles while removing notes and cross-references from displayed Scripture text. Imported languages are stored separately from annotation JSON and can be removed from Source information without changing annotations.

### Rose Cookies

Open **Source information → Import Rose Cookies** and choose a `.rose.zip` package. The import is transactional: the manifest schema, required files, safe ZIP paths, byte sizes, SHA-256 hashes, BCVWP identities, TAHOT/Tamil references, Kichadi realization rules, and any already-loaded Tamil IRV text are validated before persistent state changes.

After import, use the compact controls above the Workbench:

- **Text** shows the one immutable Tamil Scripture stream.
- **Tags** exposes lexical/source metadata when a Tamil token is selected.
- **Word Align** highlights every member of the selected complete alignment unit.
- **Kichadi** highlights semantic relationships, preserves split realizations, identifies support words, and provides a separate revision-safe human review overlay.

Word Align and Kichadi can be enabled together. Resources are stored in IndexedDB and only the active Psalm is loaded into memory. Source information can export the preserved translationCore aligned USFM, preserved semantic USFM, or a rebuilt Rose Cookies package with recalculated integrity hashes. Reviewed exports retain the imported package hash and add review provenance.

The project-owned interchange specification is [docs/ROSE-COOKIES-FORMAT.md](docs/ROSE-COOKIES-FORMAT.md). A Rose Cookies package does not by itself grant Scripture redistribution rights.

---

## Result

### What you can expect

When a Psalm has been fully reviewed, Psalms Editor should produce a structured annotation dataset containing, as appropriate:

- stable Psalm, verse, segment, token, group, component, and structure references
- Hebrew poetic segmentation
- Hebrew–Tamil alignment relationships
- classified parallelism groups
- `a / b / c / d / e` corresponding elements
- literary structure annotations
- translator/reviewer notes
- confidence and review status
- revision history for corrected annotations
- validation results
- portable JSON output

The approved dataset can later support a read-only visual resource that displays Tamil IRV alongside Hebrew structure, parallelism, alignment, and explanatory information.

### What you cannot expect

Psalms Editor does **not** guarantee:

- an automatic or infallible interpretation of Hebrew poetry
- a single undisputed structure for every Psalm
- automatic replacement of a Hebrew scholar, translator, or consultant
- that every Hebrew word will have a one-to-one Tamil equivalent
- that every Psalm will use the same parallelism pattern
- that AI suggestions, if added, are correct without review
- automatic permission to redistribute any Scripture source text
- modification or correction of bundled TAHOT or imported USFM/SFM source files

The editor records and manages scholarly judgments; it does not turn interpretive decisions into unquestionable facts.

---

## Methodology

Psalms Editor uses a layered methodology.

### 1. Source layer

Keep TAHOT, imported translations, and source alignment data read-only. Preserve source identity and provenance wherever possible.

### 2. Segmentation layer

Identify Hebrew poetic cola / lines as annotation units without changing verse numbering or Scripture text.

### 3. Alignment layer

Map Hebrew words or phrases to Tamil words or phrases. The model must support:

- one Hebrew word → multiple Tamil words
- multiple Hebrew words → one Tamil expression
- phrase-to-phrase relationships
- implicit or grammatically supplied material when it needs to be documented

### 4. Parallelism layer

Group related poetic segments and classify their relationship. Confidence and reviewer notes should be stored with the group.

### 5. Component layer

Identify corresponding semantic or grammatical elements across the parallel lines using labels such as `a`, `b`, `c`, and so on.

### 6. Structure layer

Describe larger literary organization separately from line-level parallelism. Structures may be nested and may include relationships such as A–B–C–C′–B′–A′.

### 7. Review layer

Use explicit statuses such as:

- `UNREVIEWED`
- `AI_PROPOSED`
- `HUMAN_MODIFIED`
- `HUMAN_APPROVED`
- `HUMAN_REJECTED`
- `NEEDS_DISCUSSION`

Previously approved work remains correctable through revision-safe editing.

### 8. Validation layer

Before final approval, validate internal references and look for issues such as:

- duplicate IDs
- broken token or segment references
- components not assigned to a parallel group
- duplicate or conflicting component annotations
- unintended segment overlap between groups
- incomplete Hebrew segmentation coverage
- invalid structure parent relationships

### 9. Publication layer

Export approved annotation data separately from Scripture sources. A future Selah can consume the approved dataset without exposing editing functions.

---

## Design philosophy

The software itself is developed around these engineering principles:

- **Local-first:** normal annotation work should be possible without sending Scripture or annotation data to an external service.
- **Read-only Scripture:** annotations never overwrite the source Bible files.
- **Data-first:** the JSON annotation model is treated as a core project asset.
- **Auditable:** important scholarly changes should have status, notes, and revision history.
- **Reversible:** mistakes can be corrected even after approval.
- **Incremental:** the data model is tested on representative Psalms before scaling to Psalms 1–150.
- **Validation before approval:** internal inconsistencies should be surfaced rather than silently accepted.
- **Language-aware:** Hebrew RTL and Tamil Unicode must be handled correctly.
- **Human-in-the-loop:** future AI features should make proposals, not unreviewed final decisions.

---

## How to run locally

Psalms Editor v0.5 is a static browser application using HTML, CSS, and JavaScript.

### What do I need to preinstall?

#### Required

- A modern web browser such as Chrome, Edge, Firefox, or Safari
- The extracted Psalms Editor release folder

#### Recommended

- **Python 3** — used by the included local-server scripts for more consistent browser behavior

#### Optional for repository development

- Git
- A GitHub account
- A code editor such as Visual Studio Code

**Node.js and npm are not required to run the v0.5 application locally.** ZIP and SHA-256 support are bundled or supplied by the browser; no CDN is used at runtime.

### Option 1 — open directly

1. Extract the Psalms Editor release ZIP.
2. Open the project folder.
3. Open `index.html` in a modern browser.

For routine work, running through a local web server is recommended because browsers can apply additional restrictions to pages opened through `file://`.

### Option 2 — recommended local server

#### Windows

Double-click:

```text
run-local.bat
```

The script starts a local Python web server. Open:

```text
http://localhost:8765
```

#### macOS / Linux

From the project directory:

```bash
chmod +x run-local.sh
./run-local.sh
```

Then open:

```text
http://localhost:8765
```

### Manual Python method

From the project root:

```bash
python3 -m http.server 8765
```

On Windows, depending on your Python installation, you can also use:

```powershell
py -m http.server 8765
```

Then visit `http://localhost:8765` in your browser.

---

## How to deploy on Vercel

The current Psalms Editor build is a static HTML/CSS/JavaScript site, so it does not require a build step on Vercel.

> **Important:** Do not publish Scripture source files unless you have the right to redistribute them. This especially applies to any locally supplied English Bible or other licensed resource. For a public deployment, keep restricted Scripture resources out of the public repository or replace them with resources whose redistribution terms permit publication.

### Recommended: GitHub → Vercel

1. Create a GitHub repository for Psalms Editor.
2. Put the application files in the repository. The directory deployed by Vercel should contain `index.html`, `app.js`, `styles.css`, and the required public data/assets.
3. Commit and push the repository to GitHub.
4. Sign in to Vercel.
5. Choose **Add New → Project**.
6. Connect GitHub if it is not already connected.
7. Import the Psalms Editor repository.
8. Set **Framework Preset** to **Other** for the current static build.
9. If the app is inside a subdirectory, set that directory as the **Root Directory**. Otherwise leave the repository root selected.
10. No build command is required for the current static application.
11. Deploy the project.

After the Git repository is connected, Vercel can automatically create new deployments when changes are pushed to the connected repository.

Official Vercel documentation:

- [Deploying to Vercel](https://vercel.com/docs/deployments)
- [Deploying Git repositories](https://vercel.com/docs/git)
- [Configuring a build](https://vercel.com/docs/builds/configure-a-build)

### Public-deployment recommendation

For a public-facing deployment, consider separating the project into two layers:

```text
Psalms Editor
├── private/local editor
│   ├── licensed Scripture sources
│   ├── draft annotations
│   └── reviewer workflow
│
└── public Selah / approved-data build
    ├── redistribution-safe text/data
    └── approved annotation JSON
```

The Editor contains the working scholarly environment. The public deployment should expose only data and Scripture content that are appropriate for publication.

---

## Repository structure

A typical repository may look like this:

```text
psalms-editor/
├── index.html
├── app.js
├── styles.css
├── resource-db.js
├── rose-cookies-manager.js
├── source-manager.js
├── vendor/
│   └── zip-reader.js
├── data/
├── docs/
│   └── ROSE-COOKIES-FORMAT.md
├── schema/
│   ├── annotation.schema.json
│   └── rose-cookies.schema.json
├── sample/
├── tests/
├── tools/
├── run-local.bat
├── run-local.sh
├── TEST-REPORT.md
├── RELEASE-NOTES.md
└── README.md
```

---

## Data and distribution

The Psalms Editor source code, annotation data, and Scripture source texts should be treated as separate concerns.

Before publishing or redistributing a repository, verify the license and redistribution permissions of every included Bible text, lexical resource, alignment dataset, and other third-party resource.

The safest public-release model is to publish the editor code and permitted annotation data while keeping restricted source resources local or separately supplied by authorized users.

---

## Project direction

The long-term objective is to build a reviewed Hebrew-grounded dataset for the entire Psalter and use that dataset to support a **Selah** where translators and readers can examine:

- Psalm structure
- poetic parallelism
- corresponding components
- Hebrew–Tamil relationships
- relevant linguistic information
- translation significance

The Editor creates and reviews the data. The Selah presents approved data without changing it.
