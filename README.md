# Jhon Smith Romero · Portfolio Lab

My professional portfolio, with a few things you can play with.

I'm a Senior Full-Stack Engineer and Systems and Telecommunications Engineer with
9+ years of experience. This site brings together my work, technology stack,
résumé, and seven small interactive experiences built with React and TypeScript.

**[Visit the portfolio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/)** ·
**[Experience & résumé](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#resume)** ·
**[Contact](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#contact)** ·
**[GitHub](https://github.com/JhonSmithRomeroSolorzano)**

Looking for something specific? Jump to [local setup](#run-locally),
[the labs](#labs--play), [contributing](#contributing), or
[technical documentation](#documentation-map).

## Current status and next steps

See the [main deployment workflow](https://github.com/JhonSmithRomeroSolorzano/portfolio-lab/actions/workflows/deploy.yml?query=branch%3Amain)
for current validation and publication status. The public site's
[release manifest](https://jhonsmithromerosolorzano.github.io/portfolio-lab/release.json)
identifies the deployed source commit and fingerprinted assets.

A merged PR is not necessarily published: main's validation, deployment, and public
asset verification must finish successfully. See [Deployment](#deployment) for the
release gates. Automated checks do not replace the human reviews below or establish
real-device performance guarantees.

Next priorities:

- Complete the [first-time visitor, physical-phone, and screen-reader reviews](#human-review).
- Refine the existing experiences using reproducible findings, rather than adding
  more labs without a reason.
- Keep career details accurate. Email and phone are already available on the site;
  new responsibilities, outcomes, or metrics need my confirmation.
- Review dependency updates against the supported runtime and current checks.

The owner-private preview has a separate publication step. Keep its audience
unchanged and verify its delivered files against the same trusted CI artifact as
the public site; a successful public deployment does not establish private-preview
parity. See [Deployment](#deployment) for that verification workflow.

## Résumé and presentation

The page is organized around **Overview → Experience → Contact → Labs & play**.
Experience comes before experiments, and professional projects appear within their
corresponding roles rather than in a separate project catalog. Existing `#resume`
links still reach Experience; `#about` still reaches Overview.

The overview introduces my role, core technologies, and engineering background.
An interactive stack map explains Frontend, Backend, Data, and Infrastructure and
illustrates a web request's round trip. Selecting details does not follow the
animation or shift the surrounding page. The illustration is not live traffic.

The visual direction combines Matrix-inspired rain with calm reading surfaces:
mineral green in light mode and a near-black phosphor palette in dark mode.
There is one light/dark toggle and a separate **Motion settings** control. The site
can reduce animation, but never override a device's reduced-motion preference.
Navigation, keyboard controls, readable static views, and failure recovery are part
of the product—not optional extras. Core career content and downloads remain
available without JavaScript.

### Résumé downloads

Experience includes a one-page PDF and a fuller plain-text résumé. Both use the
verified content in [profile.ts](src/features/portfolio/data/profile.ts); PDF-specific
copy and owner-supplied self-ratings live in
[resume-data.ts](src/features/portfolio/data/resume-data.ts).

- All eight employment periods are retained, including overlapping dates.
- Project descriptions distinguish product context from my own contributions.
- AI Agent Workflows means coordinating coding agents while retaining ownership
  of requirements, decisions, and validation—not training AI models.
- Skills keep their qualifications, including some AWS experience. No Go experience
  or unverified professional metrics are claimed.

Contact offers native email/phone links and **Copy contact details** for visitors
who prefer to use another app. Copying uses the same verified facts as the résumé;
when clipboard access is unavailable, a selectable text field provides a manual
fallback. The native links remain usable without JavaScript.

`npm run dev` and `npm run build` generate the downloads. If profile content changes
while the dev server is running, use `npm run build:resume` to refresh them.
Generated files under `public/resume/` are ignored by Git. The PDF generator rejects
overflow rather than silently shrinking or clipping content.

See [résumé generation](ARCHITECTURE.md#runtime-and-build-boundaries) for layout,
font, content-source, and build details. The PDF has selectable text and links;
that is not a claim of PDF/UA tagging or human screen-reader verification.

## Labs & play

Each lab has its own drawing and a short interaction. Open one from the illustrated
collection or use a direct link:

| Experience                                                                                     | Try this                                                                           |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Jet Engine](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#jet-engine)             | Change speed and deploy reverse thrust in an under-wing turbofan cutaway.          |
| [Gravity Loom](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#gravity-loom)         | Drag glowing attractors to steer existing threads; switch between Orbit and Weave. |
| [Signal Sculpture](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#signal-sculpture) | Transform a particle-built JSR monogram into a ribbon or orbital sculpture.        |
| [Motion Studio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#motion-studio)       | Compare timing curves against a shared reference, then copy the matching CSS.      |
| [Connection puzzle](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#connection-game) | Rotate tiles to connect an inlet and outlet, with hints, undo, and local progress. |
| [Cache Rescue](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#cache-rescue)         | Compare independent reads with a shared fetch during a cache stampede.             |
| [Algorithm Garden](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#algorithm-garden) | Learn breadth-first and depth-first traversal through an interactive tree.         |

Jet Engine, Gravity Loom, and Signal Sculpture start when their drawings enter
view. They suspend offscreen or in hidden tabs and respect manual Pause/Reset
intent. Motion Studio and Cache Rescue wait for an explicit run. Reduced motion
keeps useful static explanations; canvas-based labs also have SVG fallbacks.

Gravity Loom supports mouse, touch, arrow-key steering, and native movement
buttons. Space plays/pauses the focused field; Escape stops it. Points can reach
the full rectangular field, with a small handle margin. Moving points or changing
flow preserves live trails; Reset rebuilds the scene. Reduced motion uses static
previews instead of running the clock.

Jet Engine's reverse thrust redirects the cold bypass stream while the fan keeps
turning forward and the core exhaust still exits rearward. These models are visual
illustrations, not certified engine geometry, orbital physics, or measurements of
running production systems. Each lab explains its own assumptions.

Labs load independently as they approach the viewport. The collection uses static
previews, not seven background animations. Failed downloads offer recovery without
breaking the résumé. Each experience has a native **Back to labs** link.

<details>
<summary>Regenerate collection previews after an intentional visual change</summary>

Build and start a production preview:

```sh
npm run build
npm run preview -- --port 4191 --strictPort
```

In another terminal:

```sh
npm run build:lab-previews -- http://127.0.0.1:4191/
```

Inspect all seven generated images before committing. This is an optional authoring
step, not part of ordinary builds. See [preview authoring](ARCHITECTURE.md#collection-previews).

</details>

## Run locally

Use **Node.js 26.13 or newer within the Node 26 release line**. CI uses Node 26.13.0;
Node 22 and 24 are no longer supported for this repository's tooling and optional API.
The public portfolio remains a static site and does not require a Node runtime to visit.

```sh
npm ci
npm run dev
```

The app uses React, TypeScript, Vite, CSS, SVG, and Canvas. No database or separately
running API is needed for the public portfolio or its normal tests. Fonts are
served locally; PDFKit is build-only and is not shipped to the browser.

### Everyday commands

| Command                | Purpose                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `npm run check`        | Lint, formatting validation, code tests, strict types, production build, and asset budgets. |
| `npm run build`        | Generate résumé assets and the production site in `dist/`.                                  |
| `npm run preview`      | Serve the production build locally.                                                         |
| `npm test`             | Run Node's unit/integration tests through `tsx`, not Jest.                                  |
| `npm run build:resume` | Refresh PDF and text downloads after profile edits.                                         |

For browser tests, build first and install the supported browsers:

```sh
npm run build
npx playwright install chromium webkit
npm run test:browser
```

The browser suite owns a production preview on port 4173, not the dev server.
It never reuses an existing server: if the port is occupied, the run fails instead
of silently testing another checkout. Existing processes are left untouched.
For example, a focused run is:

```sh
npm run test:browser -- e2e/loom-context-lifecycle.spec.ts --project=webkit
```

For another worktree or an occupied default port, choose an unused port:

```sh
PLAYWRIGHT_PORT=4199 npm run test:browser -- e2e/cache-rescue.spec.ts --project=webkit
```

`PLAYWRIGHT_PORT` accepts decimal integers from 1 to 65535 and applies to both
the loopback test URL and preview command. Browser tests do not rebuild `dist/`:
build locally first, as above. CI tests its downloaded production artifact without
rebuilding it.

## Project structure

```text
src/app/                  Page layout, navigation, and background
src/features/portfolio/   Verified career content and résumé data
src/features/playground/  Seven independently loaded experiences
src/domain/               Pure models shared with the API and CLI
src/shared/               Hooks, canvas lifecycle, motion, theme, and styles
server/                   Optional local HTTP API
scripts/                  Résumé/artwork generation, CLI, and audits
tests/                    Unit, integration, documentation, and boundary checks
e2e/                      Production Chromium and WebKit journeys
archive/signal-lab/        Retired dashboard reference; not bundled
```

## Documentation map

| Guide                              | Read it for                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| **README**                         | What the portfolio does, local setup, contributing, release status, and human review.             |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Source boundaries, renderer design, build responsibilities, API contracts, and model assumptions. |
| [AGENTS.md](AGENTS.md)             | Agent workflow, verification, content safeguards, and publication rules.                          |

These are the three maintained first-party guides. Third-party skill guides and
licenses remain with their bundled resources. Detailed implementation history,
superseded designs, and dated performance observations remain in Git rather than
being presented as today's product or backlog.

## Contributing

1. Start with the [current priorities](#current-status-and-next-steps) and
   [Architecture](ARCHITECTURE.md). Keep improvements bounded to the requested work.
2. Preserve verified career facts and simulation assumptions. Never add private
   conversations, client data, credentials, employer source code, or invented outcomes.
3. Keep tests with behavior changes and run `npm run check` before committing.
   Format intentionally; avoid rewriting unrelated files or upstream skill resources.
4. For code/build changes, build and run browser tests, then inspect desktop/mobile,
   both themes, keyboard interaction, and reduced motion. Documentation-only changes
   need the normal check and link/path/command validation, not a new browser run.
5. Review the diff and preserve unrelated work. Publish a branch/PR through the
   [release gates](#deployment); do not push directly to protected `main` or bypass checks.

## Deployment

GitHub Pages uses **GitHub Actions**. Merging a passing, up-to-date PR into `main`
starts the normal validation and release workflow:

**Prepare → Validate → Required build check → Deploy → Verify public assets**

Preparation audits dependencies and builds once. Isolated native Linux runners
then test Chromium, WebKit, and mobile loading performance against that same
production artifact. Publication never rebuilds it. The required `build` check
rejects failed, skipped, or cancelled validation; protection also applies to admins.

Every build writes `release.json` with its source commit and SHA-256 asset hashes.
After deployment, the workflow downloads the same tested `production-dist` artifact
and compares the public manifest and assets against that trusted build, without rebuilding.

To repeat the check, use the matching release checkout and download that run's
`production-dist` artifact into `dist/` first (CI retains it for one day):

```sh
npm run verify:deployment -- https://jhonsmithromerosolorzano.github.io/portfolio-lab/
```

The verifier requires a trusted local manifest at `dist/release.json`. To use an
independently retained copy elsewhere, pass `--manifest /path/to/release.json`
alongside the URL. Never obtain this reference from the deployed site being checked.
A locally generated manifest can check a local build, but does not establish equality
with the CI-tested artifact. Missing, invalid, wrong-source, or different file/hash
sets fail verification; the verifier does not fall back to the remote manifest.

The expected source defaults to the checked-out commit, or `GITHUB_SHA` in CI;
both trusted and public manifests must match it.
A failed verification is a failed release check; it does not automatically roll
back a site that was already published. Inspect the evidence instead of rerunning
a failed gate merely to obtain green.

Diagnostics are retained for 14 days under
`validation-diagnostics-<suite>-<run>-<attempt>`. Inspect first-attempt failures even
when the existing CI retry passes. Dependency updates are reviewed, not automatically
merged. The private Sites preview is separately authorized; Pages publication does
not republish it or change its audience. Never put preview credentials in arguments,
repository files, or logs.

### Performance gates

Build budgets limit compressed entry JS to 100 KiB, all JS to 140 KiB, CSS to 16 KiB,
and HTML to 20 KiB, plus 90 KiB of fonts and a 40 KiB retained portrait asset. CI takes
three sequential mobile Lighthouse samples: median LCP must be at most 4 seconds,
CLS 0.1, and total blocking time 350 ms. These are simulated regression budgets,
not real-user speed guarantees. See [the budget implementation](scripts/performance-budget.ts).

After building, `npm run audit:ci` starts its own preview on port 4175 and runs the
three samples. Run it separately from browser tests and profiling workloads.

## Human review

**Still outstanding:** first-time visitor observation, physical-phone review,
and human screen-reader listening. Automated accessibility scans, desktop WebKit,
screenshots, and release checks do not complete these sessions.

- **First-time visitor:** ask someone unfamiliar with the site to find experience,
  download a résumé, contact me, reduce animation, and try a lab. Observe without coaching.
- **Physical phone:** check portrait/landscape, both themes, 200% text, touch dragging
  versus page scrolling, native controls, app switching, and preservation of manual pauses.
- **Screen reader:** listen with the participant's usual tools. Check navigation,
  career details, downloads/contact, control names/states, motion settings, and feedback.

Record the actual device/tools, task, observed and expected behavior, reproduction,
and limitations. Keep identities, recordings, and raw notes private; publish only
approved, anonymized findings.

<details>
<summary>Physical iPhone performance session</summary>

A real iPhone and approved setup are required. Follow WebKit's
[Web Inspector setup](https://webkit.org/web-inspector/enabling-web-inspector/).
Record the phone/iOS/Safari/Mac versions, tested `release.json`, orientation, theme,
motion and power settings, charging state, brightness, and thermal condition.

Warm the three animated drawings for ten seconds, then take three separate
20-second timing recordings per case; include engine forward/reverse, both themes,
and orientations. Check Pause, offscreen, and reduced-motion idle periods separately.
Actually switch apps/lock and return; synthetic visibility events are not a substitute.

Keep memory recording separate from timing. After warming all seven experiences,
compare equivalent idle checkpoints through six navigation/resize/theme/motion cycles.
Investigate growing retained objects rather than inferring a leak from one snapshot.
Energy/thermal checks need consistent conditions and an idle control; short CPU traces
or a battery-percent change cannot establish battery cost. Retain sanitized recordings
privately and note inspection overhead.

</details>

### Automated lifecycle stability audit

After a fresh build:

```sh
npm run test:browser -- e2e/lifecycle-stability.spec.ts --workers=1 --output=artifacts/lifecycle-audit
```

This checks repeated journeys at phone/desktop widths for growing tracked listeners,
observer targets, intervals, pending frames, idle painting, and page errors. It is
not proof of zero leaks, native GPU memory usage, physical background behavior,
battery cost, or animation smoothness. [Lifecycle implementation and limitations](ARCHITECTURE.md#failure-boundaries-and-styling).

## Optional tools

### Batch experiments

The earlier Signal Lab dashboard is retired, but its pure systems models, CLI,
optional API, and code tests remain available:

```sh
npm run replay -- examples/scenarios.ndjson
# Optional HTTP adapter; not required by the public app or ordinary tests:
npm run api
```

The CLI accepts a path or stdin and reports invalid rows without discarding valid
ones. See the [retained systems model](ARCHITECTURE.md#retained-systems-model),
[local API setup](ARCHITECTURE.md#optional-local-api), and [OpenAPI contract](server/openapi.json).

<details>
<summary>Artwork and performance authoring</summary>

- `npm run build:engine` regenerates Anatomy-derived engine artwork and visibility
  data. Use `npm run build:engine -- --check` for reproducibility or `--audit` for
  geometry checks. Ordinary builds do not regenerate this artwork.
- For detailed animation timing, build and start a loopback production preview.
  `npm run profile:engine -- http://127.0.0.1:4183/ baseline` records an engine
  reference; after an intentional change/rebuild, use a new label and the reference
  label to compare. Start that preview on port 4183 first.
- `npm run profile:runtime -- http://127.0.0.1:4173/ mobile-devtools` records simulated
  mobile runtime/idle behavior against a preview started on port 4173.
- `npm run test:browser -- e2e/theme-cache.spec.ts --workers=1` checks artwork reuse.
  Optional longer lifecycle soaks use `LIFECYCLE_CYCLES=60`; Chromium heap snapshots
  use `LIFECYCLE_HEAP_SNAPSHOTS=1` and must stay private and ignored.

Run these sequentially, not alongside other browser workloads. Reports belong in
ignored `artifacts/`; inspect the current run's timestamps/status and listed raw
files rather than assuming an old file proves success. Profilers have bounded
capture and cleanup, preserve partial failures, and do not publish data to a service.
Software canvas/SwiftShader results are not hardware GPU or iPhone measurements.
See [engine design and provenance](ARCHITECTURE.md#jet-engine-model-and-authoring)
and [profiling code](scripts/browser-profiling.mjs) for implementation details.

</details>

<details>
<summary>Optional agent skills</summary>

### OpenCode UI/UX skill

[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) is bundled in
`.opencode/skills/`. It adds no application dependency. To reinstall the pinned CLI
version from the repository root:

```sh
npm exec --yes --ignore-scripts --package=ui-ux-pro-max-cli@2.15.0 -- uipro init --ai opencode
```

Mention `@ui-ux-pro-max` in OpenCode for interface work; restart the session if the
skill is not discovered. Follow [the repository's skill workflow](AGENTS.md#uiux-skill).
Companion skills are optional references, not permission to add frameworks or
replace this project's React/TypeScript/Vite, CSS, and SVG approach. Keep vendor
resources unchanged unless intentionally updating them.

### Anatomy skill

[Anatomy](https://github.com/wheresryan22/anatomy) is bundled under
`.opencode/skills/anatomy` with its MIT license. Mention `@anatomy` for isometric
figure authoring. Its kit is authoring/test-only, not a browser dependency.
[Architecture](ARCHITECTURE.md#jet-engine-model-and-authoring) records the pinned
upstream revision and this project's artwork provenance.

</details>
