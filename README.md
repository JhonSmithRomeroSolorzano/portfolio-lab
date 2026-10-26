# Jhon Smith Romero · Portfolio Lab

Jhon Smith Romero’s engineering workspace: explore my stack, inspect a working systems experiment, and read my experience.

**[Explore the portfolio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/)** · **[Technical design](ARCHITECTURE.md)** · **[GitHub profile](https://github.com/JhonSmithRomeroSolorzano)**

## Documentation map

| Guide                           | Owns                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [README](README.md)             | Product behavior, setup, contributing, release status, human review, and next steps.                      |
| [Architecture](ARCHITECTURE.md) | Source boundaries, technical decisions, engine model/authoring, optional API, and retained systems model. |
| [Agent guide](AGENTS.md)        | Agent preparation, verification, content safeguards, and delivery rules.                                  |

These are the only three maintained first-party Markdown guides. Cross-link to
the owner rather than adding overlapping files. Bundled third-party skill guides
and licenses remain upstream resources, not additional project guides.

## Current status and next steps

The latest verified application release recorded here is [PR #17](https://github.com/JhonSmithRomeroSolorzano/portfolio-lab/pull/17),
merged as `eb1499b` and published to GitHub Pages on October 24, 2026 (UTC).
Protected Linux checks passed: 185 code tests, 293 browser passes and one existing
platform-specific skip, with no retries. The public verifier confirmed the source
and all 25 listed asset hashes. Local simulated mobile medians were LCP 2.13s,
CLS 0, and TBT 3.5ms; these are not real-user guarantees. The private Sites preview
was not republished and its audience is unchanged.

Current priorities:

- Complete the first-time visitor, physical-phone, and screen-reader sessions in [human review](#human-review); all remain outstanding.
- Add contact details and concrete professional outcomes only when Jhon supplies verified information.
- Refine existing experiences from reproducible visitor findings or user feedback; do not expand the catalog or restore retired UI without a request.
- Update the private preview only when requested and authorized, separately from Pages publication.

The [dated implementation history](https://github.com/JhonSmithRomeroSolorzano/portfolio-lab/blob/2421e577b6fe33b49f222d200a4af6683e81aa1c/ROADMAP.md)
and [detailed release review](https://github.com/JhonSmithRomeroSolorzano/portfolio-lab/blob/2421e577b6fe33b49f222d200a4af6683e81aa1c/docs/RELEASE_REVIEW.md)
remain in Git. Their counts and old “Next” statements describe those revisions,
not today's backlog. This consolidation changes documentation, not application behavior.

## Résumé and presentation

The [résumé section](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#resume) includes selected employment, education, and certifications verified against [my LinkedIn profile](https://www.linkedin.com/in/jhonsmithr) on October 6, 2026. Dates are preserved as listed, including overlapping roles; descriptions do not imply unverified employer relationships or outcomes. Public professional content lives in `src/features/portfolio/data/profile.ts`.

I directly confirmed the descriptions of my current Antecursor role and my Athletify work. At Antecursor, I participate in feature design and implementation across databases, backend services, and frontend interfaces, with Azure and GitHub Actions. At Athletify, my contribution focused on React/TypeScript interfaces, Figma implementation, and some Next.js work. Its [official company profile](https://www.linkedin.com/company/athletifyofficial) supplies the sports-management product context; it does not establish additional libraries or personal backend responsibilities.

The portfolio uses a custom workspace composition: a compact identity rail and a connected stack map with selectable Frontend, Backend, Data, and Infrastructure layers. The map explains verified experience and leads to the collection and résumé contributions. Its detail panels reserve the tallest intrinsic height, so switching layers does not shift the page. Inactive panels are hidden and inert; the layout still grows with text and viewport changes. It is authored in React, CSS, and SVG for this project.

The map also illustrates a web request round trip: the browser prepares a request, a packet travels to backend validation, a data lookup returns a result, and the backend sends a response for the browser to render. Blue follows the currently processing step, not the selected detail panel; the selected layer has a neutral border and a “Details” marker, paired with “Viewing…” in its panel. The separate “FLOW” readout describes request activity. Card text and fill switch together so processing transitions remain legible, and supporting map text starts at 12px at the default text size. Infrastructure uses a subtle tint and dashed border to distinguish its hosting role, not another request hop. The calm tour runs automatically while visible, without playback buttons. It pauses offscreen, in hidden tabs, or during keyboard exploration, and starts a new request when those interruptions end. Reduced motion keeps a static explanation. This is an illustration, not live traffic; selecting layers never follows or changes with the animation.

The public page has four sections: Overview, Résumé, Contact, and Labs & play. Development status and roadmap promotion stay in the repository. Experience and contact precede the collection in document and menu order; the introduction links directly to experience.

Overview combines my introduction, engineering background, LinkedIn portrait, prominent senior full-stack role, and organized technology overview. The former About section and its repeated skill cards have been merged into this opening section; existing `#about` links still reach the introduction. Languages and testing span the stack; the four areas distinguish UI libraries, components and styling, frameworks and Figma design handoff, APIs and real-time communication, databases and caching, containers, CI/CD, and cloud platforms. The compact overview shows languages and testing; the interactive map holds the categorized technology details. Experience uses the full content width, with role details beside contributions and education underneath. Downloads retain the complete skills list from `src/features/portfolio/data/technology-stack.ts`. Next.js is labeled as some experience.

Technology details were confirmed directly by me on October 6, 2026, with Linux and PM2 added from my direct confirmation on October 17. Infrastructure distinguishes operating systems (Linux), process management (PM2), containers, CI/CD, and cloud platforms. NoSQL is my strongest database experience, alongside SQL; cloud experience includes Azure and some AWS work. Testing lists Jest, Playwright, and Mocha, with integration and end-to-end testing. The portrait is stored locally in `public/jhon-smith-romero.jpg`, so it does not depend on an expiring LinkedIn image URL. Résumé and Contact are available in the main menu; duplicate links were removed from the introduction.

Professional projects appear inside their corresponding Experience entries, with my contributions emphasized beneath a brief product description and public link. I confirmed [Nimrod](https://nimrod.io/) belongs to both Antecursor roles: the earlier entry describes interfaces, services, maintenance, and refactoring; the current entry covers feature design and implementation across the stack, Azure, and GitHub Actions. Athletify focuses on React/TypeScript frontend features and translating Figma designs into product interfaces. Next.js remains qualified as some experience. These contribution lists replace duplicate role bullets and use the responsibilities already verified for each period. Project data lives with each role in `src/features/portfolio/data/profile.ts`; additional claims require confirmation.

The portfolio uses uppercase JSR branding, a warm neutral light theme, and a navy dark theme. A single light/dark toggle follows the device until the visitor chooses an appearance, then remembers that choice. There is no separate System button; existing automatic preferences remain supported. Blocked browser storage leaves the control usable for the current visit.

The JSR mark reverses its tile and lettering colors with the theme. The browser favicon follows the same choice, including a saved preference before the application renders.

Section entrances use progressive enhancement: content stays visible without animation support. Reduced-motion preferences disable entrances and smooth scrolling; keyboard focus cancels an active entrance.

**Motion settings** in the identity rail/header offers Follow device or Reduce animation. The site can reduce motion, never override a device's reduced-motion preference. The choice applies to the stack map, navigation/reveal effects, and all labs, and is restored before the first paint. It persists and synchronizes between tabs on the same site; blocked storage leaves it usable for the current visit. Switching back to Follow device does not undo a lab's manual Pause or Reset. The separate light/dark toggle is unchanged. On narrow phones both settings controls use labeled, keyboard-accessible icons; the motion disclosure closes with Escape or when keyboard focus moves outside it.

Navigation has a sliding section indicator that follows reading position and points directly to a clicked destination during smooth scrolling. A brief blue sweep marks section arrivals, a thin top line shows reading progress, and the experience timeline fills as its entries pass through the viewport. Links retain native URL/history and keyboard behavior. Wheel, touch, and scrolling keys release a pending destination; reduced-motion preferences keep the current-section indicator while disabling decorative motion. Scroll work is coalesced into animation frames and section geometry updates when content or the viewport resizes.

Anchor destinations accept focus without entering the Tab order. Keyboard navigation uses an immediate scroll so WebKit's focus adjustment cannot interrupt a smooth anchor journey; pointer navigation retains smooth scrolling. Both paths keep the animated menu and arrival feedback unless reduced motion is preferred.

Each experience entry includes a short role summary alongside its detailed contributions. These summaries use the responsibilities already confirmed for that employer and period, and appear in both résumé downloads. They do not add unverified project outcomes or metrics. Optional direct contact fields remain unpublished until exact details are supplied; LinkedIn remains available.

## Labs & play

The collection has **seven peer experiences**, reached through illustrated cards and direct anchors. Each has its own visual identity and a short interaction. There is no multi-lab dropdown, expanded dashboard, or nested catalog. Experience and contact stay above the collection.

Each experience ends with native Previous/Next links and Back to collection, following the same catalog order without wrapping the first/last boundaries. `#collection` reaches the focusable chooser; existing `#lab` and experience anchors remain unchanged. These links preserve query context, support browser history and keyboard focus, and remain available without JavaScript.

- **[Jet Engine](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#jet-engine)**: change engine speed and watch an under-wing cutaway turbofan respond. A pylon attaches it to a cropped wing section; the intentional open side exposes its internals, while collars close the joints between core housings. The intake fan and six inner blade rows turn faster while air tracers speed up, become denser, and extend farther behind the engine. Blue shows cool intake/bypass air; orange shows heated core air. Idle, Cruise, and Full power presets use the same control. The engine starts as its drawing enters view and suspends offscreen or in hidden tabs. Returning resumes it unless the visitor used Pause, Reset, or set speed to zero; Play or a speed change can restart it. Reduced motion redraws a still composition; canvas denial retains SVG parts and speed-dependent air paths. Four short stage descriptions explain the route without a puzzle. This is a slowed visual illustration, not real engine operating data or a thermodynamic simulation. Built using Anatomy; [design and provenance](ARCHITECTURE.md#jet-engine-model-and-authoring). The former local `#pin-lock` entry redirects here without removing query context.

- **[Gravity Loom](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#gravity-loom)**: drag a glowing attractor with mouse or touch to pull the existing threads in real time. Dragging empty space moves the selected point; a stronger held-point pull makes the response perceptible without teleporting particles or clearing trails. The field starts as it enters view. Dragging, arrow-key steering, and movement buttons can also resume it after a pause. Space plays/pauses the focused field and Escape stops it. Native direction buttons and named positions provide alternatives to dragging. Add up to four attractors, choose Orbit or counter-rotating Weave, and adjust strength without restarting the scene. Only Reset rebuilds the live artwork; reduced motion updates static drawings without animated playback, and SVG retains controls without canvas. Offscreen and hidden-tab interruptions release any drag and suspend playback; returning resumes it unless the visitor used Pause, Reset, Escape, or cancelled a drag. Reduced motion always keeps it still. The model is kinetic artwork, not orbital physics. Mobile uses 48 threads and wider screens 96, with bounded trail histories and no graphics dependency.

- **[Signal Sculpture](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#signal-sculpture)**: a particle-built JSR monogram transforms into a ribbon or orbital sculpture. The sculpture starts as its drawing enters view. Play/Pause, Pulse, and Reset controls work with keyboard and touch; mouse movement adds a gently eased tilt and shift, then returns smoothly to center when the pointer leaves. Shapes change instantly while paused or with reduced motion. Offscreen and hidden-tab interruptions suspend playback; returning resumes it unless the visitor used Pause or Reset. Reduced motion keeps it still. A lightweight canvas renderer uses 720 points on small screens and 1,800 otherwise, with a static SVG fallback if canvas is unavailable. No graphics dependency is added.

- **[Motion Studio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#motion-studio)**: compare four timing curves against a steady reference using the same distance, duration, and clock. Pick a curve, then explicitly play both lanes. Reduced motion shows the end states. Control changes, hidden tabs, motion-preference changes, navigation away, and scrolling the experience out of view cancel playback. Returning waits for an explicit replay.

- **[Connection puzzle](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#connection-game)**: rotate a 4×4 board to connect its inlet and outlet. Three authored puzzles include hints, undo, reset, keyboard navigation, and validated browser-local progress. Click or Space rotates; arrow keys move between tiles. Open tabs on the same site share saved boards while keeping their selected puzzle and keyboard focus. External changes clear only the affected boards' Undo history and hints; a stale action loads the latest save before asking you to try again. Saves are local to the current site, with honest feedback when storage is unavailable. There is no clock or account.

- **[Cache Rescue](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#cache-rescue)**: choose independent reads or a shared fetch, send the crowd, and try to deliver every reply with one database read. Three challenges compare a simultaneous rush, overlapping arrivals, and a sparse stream. Dots move between the crowd, database, shared waiting, and delivered replies. Results explain why sharing avoids duplicate work—or why sparse arrivals need only one read either way. Playback starts only on request, supports pause/resume/reset, and stops when leaving the view, navigating elsewhere, hiding the tab, or changing motion preferences. Reduced motion shows a static result. The deterministic model covers one expired key and one coordinator, fixed successful fetches, unlimited parallel reads, and immediate cache hits. It is an illustration, not a production measurement. The concept follows the user's [visual cache-stampede inspiration](https://www.facebook.com/reel/2912294019139465/); the code and artwork are original.

- **[Algorithm Garden](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#algorithm-garden)**: light up one of three authored trees in breadth-first or pre-order depth-first order. Try a node, recover from a wrong turn, or ask for a hint. Numbered nodes, a traversal trail, and announced feedback explain each move. It works with keyboard or pointer, without a timer. Progress lasts for the visit.

The seven pieces download independently as they approach the viewport or when followed directly. Failed downloads offer reload recovery; runtime render/effect errors are isolated to the affected experience and offer a local retry. Both keep the résumé usable. Their styles load with the page. Native dynamic imports avoid a WebKit recovery issue triggered by module preloading shared optional dependencies. `#lab` reaches the collection; old `#signal-lab` anchors also reach it. Old dashboard query parameters no longer configure the public experiences.

Direct experience links retain their landing while nearby content finishes loading. Wheel, touch, pointer, and keyboard input release that adjustment; browsing away never pulls the visitor back to a pending experience.

Jet Engine's **Reverse thrust** control deploys a simplified cold-stream reverser:
blue bypass air turns forward through open doors while the fan keeps its normal
rotation and orange core exhaust still exits rearward. The control preserves speed
and Pause intent, works in reduced-motion and SVG-only views, and resets to forward
thrust. It illustrates a landing principle—not negative RPM, a braking measurement,
or a particular aircraft's operating procedure. Static decorative dots are removed.

### Earlier systems experiments

The original Signal Lab dashboard is retired from the public portfolio. Its presentation and browser adapters live in `archive/signal-lab/`; pure models remain in `src/domain/`. The optional API, CLI, and unit/integration coverage are retained. Browser tests cover the seven current experiences rather than the removed dashboard. See the [retained systems model](ARCHITECTURE.md#retained-systems-model) for assumptions and the [optional local API](ARCHITECTURE.md#optional-local-api) for runnable HTTP experiments.

## Run locally

Use Node.js 22.19+ (Node 24 LTS recommended).

```sh
npm ci
npm run dev
```

```sh
npm run check # lint, format check, strict types, tests, and production build
npm run preview
# Optional local browser regression run after building:
npx playwright install chromium webkit
npm run test:browser
```

### OpenCode UI/UX skill

[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) is installed locally under `.opencode/skills/`, including its bundled companion design skills. It uses Python 3 for local searches and adds no application dependency. From this repository root, install the same version with:

```sh
npm exec --yes --ignore-scripts --package=ui-ux-pro-max-cli@2.15.0 -- uipro init --ai opencode
```

Open this repository in OpenCode and mention `@ui-ux-pro-max` in a UI task. If it is missing from an already-open session, restart OpenCode. Project-specific usage rules live in [AGENTS.md](AGENTS.md#uiux-skill).

The companion skills are upstream reference material, not an application setup requirement. Some examples use Claude-specific `.claude/skills/` paths, tool names, or optional AI/image-generation skills that are not installed here. Resolve bundled resources under `.opencode/skills/<name>/`, check tool/prerequisite availability before running a workflow, and do not install Tailwind/shadcn or external generation tools just because a companion example uses them. The portfolio keeps its existing CSS/SVG stack; UI UX Pro Max's local searches and Anatomy's engine authoring are the verified project workflows.

### Anatomy skill

[Anatomy](https://github.com/wheresryan22/anatomy) is installed for this project at `.opencode/skills/anatomy`, with its MIT license, kit, references, scripts, and examples. Mention `@anatomy` for a detailed interactive isometric figure; restart OpenCode if a running session does not discover it. The pinned upstream revision and illustration design are recorded in [Architecture](ARCHITECTURE.md#jet-engine-model-and-authoring). Installation adds no application dependency.

`npm run build:engine` regenerates the fixed-scene SVGs and projection/visibility data; `npm run build:engine -- --check` verifies them without writing. `npm run build:engine -- --audit` checks the fixed draw items and reverser support/intersections at 21 positions. The unit suite also runs audit/reproducibility verification. The kit is authoring/test-only, not part of the browser or `npm run build`; [Architecture](ARCHITECTURE.md#jet-engine-model-and-authoring) owns the rendering details. Other projects can use the upstream [installation instructions](https://github.com/wheresryan22/anatomy#install).

### Résumé downloads

The Experience section offers a two-page PDF and a plain-text résumé. Both are generated from the same verified profile, technology groups, and role contributions displayed on the site. Links to public profiles and projects remain clickable in the PDF; overlapping employment periods and qualified experience are preserved.

`npm run dev` generates these assets before starting, and `npm run build` regenerates them before Vite packages the site. After editing profile data while the dev server is running, use `npm run build:resume` to refresh the downloads. Generated files in `public/resume/` are ignored by Git. PDFKit runs only during generation and is not shipped in the browser bundle. The generator keeps each role together and rejects content that would overflow a page.

## Project structure

```text
src/app/                  Page composition and navigation
src/features/portfolio/   Career content and verified résumé data
src/features/playground/  Seven independently loaded experiences
src/domain/               Pure models shared with the API/CLI
src/shared/               UI primitives, browser hooks, theme, base styles
archive/signal-lab/        Retired dashboard reference (not bundled)
server/                   Optional local HTTP adapter
scripts/                  Résumé generator and batch CLI
tests/                   Unit/integration and architecture checks
e2e/                     Chromium and WebKit journeys
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for dependency direction, responsibilities, styling ownership, and enforced boundaries. `npm test` also validates local documentation links/anchors, documented npm script names, and bundled skill entrypoints; it does not validate external URLs or run every third-party skill workflow.

The app uses React, TypeScript, and Vite. Relative asset paths support both GitHub Pages project URLs and root hosting. It has keyboard-operable controls, a skip link, live metric announcements, and reduced-motion support. Typography is served locally with system fallbacks.

## About me

I'm Jhon Smith Romero, a systems and telecommunications engineer with more than seven years in software development. My experience includes JavaScript, TypeScript, React, Material UI, Mithril.js, Tailwind CSS, Node.js, Express, REST APIs, WebSockets, NoSQL, SQL, Redis, Linux, PM2, Docker, GitHub Actions, Azure, and some AWS work. I use Jest, Playwright, and Mocha for testing, including integration and end-to-end tests. NoSQL is my strongest area of database experience.

This repository contains original portfolio work. It does not contain employer code or client data. Features are developed with AI assistance and reviewed through tests, builds, and documented checks.

## Contributing

1. Read the [current priorities](#current-status-and-next-steps) and [Architecture](ARCHITECTURE.md); choose a bounded improvement in the requested scope.
2. Keep verified career facts and model limitations intact. Use [AGENTS](AGENTS.md) for agent-specific workflow and safeguards.
3. Keep behavior tests beside the change and run `npm run check` before committing. It includes lint, read-only formatting, strict types, unit/integration tests, résumé generation, production build, and budgets. Use targeted formatting rather than rewriting unrelated files. Tests use Node's runner with `tsx`, not Jest.
4. For code/build changes, build first, run `npm run test:browser`, and inspect desktop/mobile, themes, keyboard, and reduced motion. Docs-only changes need link/path/command validation and the normal check, not new UI journeys or a browser rerun.
5. Review the diff, preserve unrelated edits, and commit a coherent change. Submit a branch/PR through [the protected release gates](#deployment); never bypass protection, force-push, backdate, or manufacture activity.

The local source includes original portfolio work and vendored third-party tools
with their own licenses. Neither consolidation nor publication authorizes private
interview material, employer code, unverified contact details, or hosting audience changes.

## Deployment

GitHub Actions validates pull requests and deploys passing changes on `main` to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**. The `.openai/hosting.json` manifest also supports an owner-private Sites preview.

The `build` check gates release on a high/critical dependency audit (including development tooling), the existing code/build checks, Chromium/WebKit journeys, and mobile performance budgets. `main` requires that GitHub Actions check against an up-to-date branch, including for admins; force-pushes and branch deletion are disabled. Submit changes through a branch/PR so validation can run before they reach `main`. These protection settings live on GitHub, not in the workflow YAML.

Actions are pinned to upstream commit SHAs, with weekly npm and Actions update PRs configured in [Dependabot](.github/dependabot.yml); automated security updates are also enabled in GitHub settings. Vite and its React plugin share a dedicated update group, including major versions, so their peer requirements can be reviewed together. Updates are not automatically merged. Do not suppress audit failures or use forced dependency upgrades without reviewing the advisory and compatibility.

CI retains HTML/JSON browser reports, failed-attempt traces/screenshots, and available Lighthouse reports for 14 days in `validation-diagnostics-<run>-<attempt>`, even when validation fails. The existing single CI retry remains; inspect flaky cases in the report even if the retry passes. Superseded PR runs may be cancelled, but main runs finish deployment and verification before another main run starts. Jobs have bounded timeouts. Only the deploy job has Pages/OIDC write permissions; dependency installation and deployed-asset verification run in read-only jobs. No gates use `continue-on-error`.

Successful Lighthouse samples are retained as `lighthouse-run-1.json` through
`lighthouse-run-3.json`, plus the latest HTML report. Moving each completed JSON
avoids uploading a duplicate of the final sample. Failed/incomplete reports keep
their original name and remain covered by the diagnostic upload. Raw browser
outputs are retained alongside the HTML report: attachment copies overlap, but raw
failure context and report links must remain useful independently.

Release jobs explicitly use `ubuntu-24.04`; OS upgrades require a reviewed workflow change rather than following `ubuntu-latest`. Validation runs inside the [official Playwright image](https://playwright.dev/docs/docker), pinned by version and immutable digest. Its preinstalled browsers and Linux libraries avoid repeated Ubuntu package downloads, which previously timed out before browser validation. Node 24 is still selected explicitly, and `npm ci` installs the project's dependencies. Update the image tag/digest together with `@playwright/test`; a toolchain check rejects version mismatches. The full Chromium/WebKit and Lighthouse gates remain within the existing 20-minute build limit. Publication and verification use separate jobs outside this browser container.

## Batch experiments

Replay scenarios without a browser or running API:

```sh
npm run replay -- examples/scenarios.ndjson
# Direct command keeps stdout free of npm's script banner:
node --import tsx scripts/replay.ts examples/scenarios.ndjson > results.ndjson
```

The CLI accepts a file path or stdin, with one scenario per line and a 1 MiB input limit. It emits one JSON result per nonblank line, preserving source line numbers. Invalid rows produce structured errors while later rows continue. Exit codes: 0 all valid, 1 invalid scenarios, 2 input/read errors. A human-readable summary goes to stderr.

### Portfolio audits and sharing

The public recruiter URL is <https://jhonsmithromerosolorzano.github.io/portfolio-lab/>. Static canonical, Open Graph, and large-card metadata point to that address. `public/social-preview.svg` is the editable source for the 1200×630 JPEG sharing image. The Sites preview keeps its existing audience.

Cache Rescue, the connection puzzle, Motion Studio, Algorithm Garden, Signal Sculpture, Gravity Loom, and Jet Engine use separate JavaScript bundles. They load near the viewport, on direct anchor entry, or through the explicit load control. A failed download keeps the career content available and offers a reload to the affected experience. Jet Engine loads one complete fixed-art SVG for the selected theme; its compact visibility data stays in the optional engine bundle, not the initial entry. Missing art pauses the experience and offers a reload.

`npm run test:browser` includes axe accessibility scans for both themes, keyboard journeys, 320px reflow, 200% default text-size checks, direct links, and failed-download recovery. Challenge and traversal controls keep their visible labels consistent with their accessible names, including after selection. Automated scans and accessibility-tree inspection do not replace a human screen-reader assessment.

The mobile recruiter journey covers both résumé downloads and contact navigation. Resource links have at least 44px-high hit areas, contact copy uses the normal 16px body size, and the contact action wraps with enlarged text. Gravity Loom preserves the grab offset when selecting the edge of a point, ignores Space key repeats, and supplies changing position feedback for keyboard moves. [Human review](#human-review) remains separate from automated/emulated checks.

Gravity Loom's points can travel across the full rectangular field, leaving a 24px margin to keep the handles visible. Trails, pointer input, and the canvas-free illustration share the same width/height mapping, including after resizing; there is no separate center-square drag boundary.

For a repeatable Lighthouse report, build the site, start `npm run preview -- --port 4175`, then run `npm run audit:performance -- http://127.0.0.1:4175/`. The script uses the installed Playwright Chromium browser (or `CHROME_PATH` when provided) and writes HTML/JSON reports under ignored `artifacts/`. It uses Lighthouse's mobile simulation defaults. Run it without concurrent browser tests; local lab scores are not real-user measurements or guarantees for the hosted site.

The IBM Plex Latin font files are served locally from `public/fonts/` under the included SIL Open Font License. They are the same Google Fonts distributions used by the original stylesheet; local delivery removes the external stylesheet from the first render path.

The build prerenders the same React page into HTML, then hydrates its controls in the browser. Career content, native section links, and résumé downloads remain available with JavaScript disabled or blocked. Optional games keep honest loading placeholders and do not download during prerendering.

### Deployment integrity

Every build writes `release.json` with its source commit and SHA-256 asset hashes. The Pages workflow automatically verifies the public release after deployment:

```sh
npm run verify:deployment -- https://jhonsmithromerosolorzano.github.io/portfolio-lab/
```

The expected source defaults to the checked-out commit, or `GITHUB_SHA` in CI. The private Sites preview is published separately; the Pages workflow neither republishes it nor changes its audience. To compare both hosts after separately publishing the same validated build, run `npm run verify:deployment -- <public-url> <private-preview-url> --private-stdin`; supply `{ "token": "..." }` through stdin only using the authorized Sites access token. The verifier scopes that header to the existing private preview and rejects redirects. Never put tokens in arguments, files, or logs. PDFs have variable generation metadata, so the manifest covers their shared plain-text source export instead.

### Performance gates

Production builds enforce compressed entry JS (100 KiB), all JS (140 KiB), CSS (16 KiB), and HTML (20 KiB) limits, plus 90 KiB of fonts and a 40 KiB portrait. `npm run audit:ci` starts an isolated preview on port 4175 and takes three mobile Lighthouse samples sequentially; median LCP must stay within 4 seconds, CLS within 0.1, and total blocking time within 350 ms. CI runs it after browser tests to avoid competing browser load. Reports stay in ignored `artifacts/`; these are regression budgets for simulated conditions, not real-user speed guarantees.

The audit uses Chromium's `--no-sandbox` launch flag only for the loopback preview on Linux GitHub Actions runners. Audits of hosted URLs and local development retain the browser's default sandbox. Deployment verification requests the canonical directory URL for `index.html`, avoiding Sites' index redirect; all actual redirects remain rejected. For the private Sites origin only, comparison removes the recognized Cloudflare challenge script appended before the closing body. All portfolio content and application scripts must still match their hashes.

### Engine animation profiling

Loading scores do not measure animation smoothness. After a fresh build, start
`npm run preview -- --port 4183`, then run the following sequentially, without
other browser/performance workloads:

```sh
npm run profile:engine -- http://127.0.0.1:4183/ baseline
# Make and rebuild an optimization, then compare against the saved baseline:
npm run profile:engine -- http://127.0.0.1:4183/ optimized baseline
```

The optional Chromium profiler takes three timing samples per thrust mode at
390px/3× DPR/4× simulated CPU slowdown and 1440px/2× DPR/unthrottled. It records
engine draw times, frame cadence, whole-page CPU/heap sampling, idle paint checks,
bundle sizes, source hashes, and twelve fixed composite-frame fingerprints in
ignored `artifacts/engine-performance/`. The optional reference label rejects
changed composite fingerprints. Heap allocation samples include collected objects;
they are estimates, not retained-memory measurements or proof of a leak. Hidden
policy testing uses a synthetic visibility event, not a physical background-tab test.

Engine and runtime profiling share `scripts/browser-profiling.mjs`: build-manifest
validation, bounded frame sampling, percentile calculations, and sampler cleanup.
Allocation reports include sampled bytes per observed engine draw so a faster run
is not mistaken for an allocation regression just because it drew more frames.
These remain whole-page sampling estimates, not exact per-tracer allocations.
Frame buffers cap at 10,000 samples and report overflow; CPU/heap samplers stop even
when measurement fails. Once capture starts, errors preserve a failed/partial JSON
report rather than silently presenting incomplete measurements as successful.
Completed or failed frame windows release page-side timing arrays immediately;
returned samples remain available to the caller without keeping another idle-page
reference until the next recording.

The October 24 cleanup reduced total JS gzip from 137,202 to 133,224 bytes and the
engine chunk from 32,402 to 28,428 bytes. Standalone timing repeats were variable,
so a separate sequential baseline/optimized/optimized/baseline check used the
original `8eb039d` build and the final candidate in the same Chromium process.
Four timing windows per version/mode showed mobile forward/reverse draw P50 near
40.7/46.5ms → 26.4/28.8ms, roughly 23/21 → 35/33 FPS. Whole-page allocation sampling
also fell. Twelve composite stills remained identical in both themes/sizes, and
all idle policies painted zero frames. These are local simulated observations,
not portable FPS guarantees or a new CI timing threshold. Quality, route density,
and resolution caps are unchanged.

Motion Studio's “Take this motion with you” panel exports matching curve/duration CSS and example markup, including a reduced-motion end state. Clipboard denial selects the visible CSS for manual copying; changing the settings clears obsolete copy feedback.

Algorithm Garden offers three authored trees: Balanced branches, Deep roots, and Open canopy. Both traversal modes use the selected tree's topology; choosing a different tree starts a new walk, while reselecting the current tree preserves progress.

Garden's optional traversal explanation displays the live queue front or stack top, the last visited node, and its newly added children. The same pure step model drives play order and the explanation so they cannot drift apart.

Cache Rescue includes an optional prediction before each round. A whole-number guess is locked when playback starts and compared with the model's actual database reads after completion. Resetting or changing the scenario clears the guess; playing without a prediction remains available.

Connection puzzle records completed attempts and separate best rotation counts with and without hints. Rotation counts and hint assistance survive Undo, reloads, and tab synchronization; Start again resets the attempt while keeping records. Earlier saved boards migrate without losing moves, but cannot establish a best until restarted because their rotation/hint history was not recorded. Clearing browser storage removes records. No score is sent to a server.

Each experience has an optional “How I built…” note covering its implementation decision, tradeoff, verification, and source code. The notes describe this repository's original code; they do not introduce employer claims. Their source links share one repository constant with the footer.

## Human review

**Not yet completed:** first-time visitor observation, physical-phone review, and
human screen-reader listening. Passing axe, browser emulation, release checks, or
DOM inspection does not complete these sessions.

- **Visitor:** use a willing first-time visitor and neutral goals: find experience, download a résumé, contact the developer, reduce animation, navigate between labs, steer a different Loom point, and redirect the engine's air without reversing the fan. Do not coach; record consented, anonymized findings, not guessed motives, success rates, or private conversations.
- **Physical phone:** record the actual device/browser; test portrait/landscape, both themes, and 200% text. Check all four Loom corners, off-center grabbing, secondary-pointer cancellation, drag-versus-page-scroll, tab/app interruption, and native non-drag controls. Check motion settings, Escape/focus behavior, neighbor/history links, engine speed/zero/reverse/Pause/Reset, stable framing, and respect for manual pauses.
- **Screen reader:** preferably use the participant's usual tools (for example VoiceOver/Safari or NVDA/Firefox/Chrome). Record actual versions and what was heard. Check skip/headings/navigation, career dates/qualifications, downloads/contact, motion settings, and neighbor links. Verify native movement controls rather than assuming browse-mode arrows reach custom handlers. Listen to positions, slider values, pressed/disabled states, only the active reverse explanation, and honest static/error feedback—never particle-frame announcements.

For each finding retain environment, task, observed/expected behavior, reproduction,
severity, fix/test reference, and remaining limitations. Publish only approved
sanitized summaries; keep participant identities, recordings, and raw notes private.

### Physical iPhone performance session

This requires a real iPhone and user-approved setup; Playwright WebKit is not iOS
Safari evidence. Record the phone model, iOS/Safari and Mac Safari versions, tested
release (`release.json`), orientation, theme, Reduce Motion/Low Power Mode, brightness,
charging state, and whether the phone is already warm. Keep other workloads quiet.

1. Follow WebKit's [Web Inspector setup](https://webkit.org/web-inspector/enabling-web-inspector/): enable Web Inspector under Safari's Advanced settings on the phone (Safari may be under Settings → Apps), enable developer features in Mac Safari's Advanced settings, connect the phone, and approve Trust only if you intend to trust that Mac. Select the phone's portfolio tab from Safari's Develop menu. Do not install tools, change device settings, or publish a preview just for this test without approval.
2. Open the public portfolio in iPhone Safari. Warm up each of Jet Engine, Gravity Loom, and Signal Sculpture for ten seconds. For the engine, compare full-power forward and fully deployed reverse. Use three separate 20-second recordings per case in [Timelines](https://webkit.org/web-inspector/timelines-tab/), inspecting Frames, JavaScript/Rendering, and CPU activity. Repeat portrait/landscape and both themes. Record stalls and control response; frame-rate reference lines are not measured average FPS. Do a separate unrecorded visual pass because inspection adds overhead.
3. Record ten-second intervals after Pause, scrolling to Résumé, and device/site motion reduction. There should be no sustained renderer work after transitions settle. Actually switch apps/lock and return; don't substitute synthetic visibility events. Manual Pause must survive the return. Test the overview's stack tour stopping offscreen too.
4. In a separate memory recording, warm all seven experiences, then repeat six navigation/resize/theme/motion cycles, ending at Résumé. Compare equivalent idle checkpoints in Memory/JavaScript Allocations where supported; inspect retainers for growing detached objects. Keep memory recording separate from frame timing because it adds overhead. Export sanitized recordings privately for analysis, not into this public repository.
5. Keep any energy assessment separate: short CPU traces or a battery-percent change cannot establish battery cost. If doing a longer manual check, use consistent brightness, power mode, network, charging and thermal conditions with a same-duration idle control; report duration, observations, and uncertainty rather than a fabricated drain rate.

Until device details and actual recordings/observations are available, this session
remains pending. Desktop timings and automated lifecycle checks do not complete it.

### Automated lifecycle stability audit

After `npm run build`, run:

```sh
npm run test:browser -- e2e/lifecycle-stability.spec.ts --workers=1 --output=artifacts/lifecycle-audit
# Optional longer Chromium memory soak, run separately from other browser work:
LIFECYCLE_CYCLES=60 npm run test:browser -- e2e/lifecycle-stability.spec.ts --project=chromium --grep 'warm lifecycle' --workers=1 --output=artifacts/lifecycle-soak
```

The default six measured cycles follow two warmup cycles at each width (390/1440px).
They visit all seven experiences, exercise engine reversal and explicit-run labs,
switch themes, resize to landscape and back, change motion preferences, and return
to the same idle Résumé checkpoint. Reports live in each test's output directory
and are attached to browser reports. The audit fails on growing tracked persistent
subscriptions/observer targets or intervals, pending idle frames, continuing idle
canvas work, or page errors. One-shot reveal targets may legitimately decrease.
An intentional-retention fixture verifies the counters detect resources and cleanup;
a batched-intersection regression verifies the stack tour stops its interval.

Chromium additionally records forced-GC JS heap, backing storage, DOM and listener
counters as diagnostic trends, not brittle cross-machine memory thresholds. WebKit
has no equivalent heap measurement in this audit. Instrumentation uses weak target/
observer keys and no DOM-node reports, but still adds overhead; it is not an FPS
benchmark or proof that the page is leak-free. It does not measure GPU/native process
memory, one-shot timeouts, DOM property handlers, or arbitrary detached-object
retainers by default. Set `LIFECYCLE_HEAP_SNAPSHOTS=1` for optional Chromium warm/final
heap snapshots in the test output directory; these can be large and must stay private
and ignored. Persistent window/document/media listeners are tracked; once/AbortSignal
listeners are reported as a coverage gap rather than emulated. Investigate persistent
heap growth with native heap snapshots before calling it a leak or claiming a fix.
Snapshot chunks are written directly to disk, avoiding a complete in-memory string
array and joined copy in the test runner; this does not reduce the browser's own
snapshot-generation overhead.

### DevTools mobile runtime and theme-cache audits

Without a physical phone, use this separately from other browser workloads:

```sh
npm run profile:runtime -- http://127.0.0.1:4173/ mobile-devtools
npm run test:browser -- e2e/theme-cache.spec.ts --workers=1 --output=artifacts/theme-cache-audit
```

Build first and start `npm run preview -- --port 4173` for the profiler. The runtime
audit uses Chromium DevTools Protocol with touch/3× DPR, 4× simulated CPU slowdown,
390×844 and 844×390 viewports, and both themes. It checks Jet Engine (including
reverse), Gravity Loom, and Signal Sculpture, then Pause, reduced motion, and
offscreen states. Short 1.5-second windows record frame/canvas activity and renderer
ScriptDuration/TaskDuration deltas; those are not OS CPU percentages or battery
measurements. Sampled profiles are retained for portrait/light, with forced-GC heap
usage at the final reduced-motion checkpoint. Reports stay in ignored
`artifacts/runtime-diagnostics/`; no results are sent to a service.

Chromium mobile emulation is neither iPhone hardware nor Safari. The script attempts
native page switching without redefining `document.hidden`, but automation may keep
both pages visible. In that case it explicitly records native hidden CPU as unsupported,
not as a pass. `RUNTIME_HEADFUL=1` permits another browser-level check where a desktop
window is available; it still must observe `visibilityState === "hidden"` to claim
that measurement. Physical-device/app-switching, native hiding when unsupported,
and energy/thermal checks remain pending. Other automated visibility-policy tests
use synthetic events and are a different layer of evidence.

Inspect the browser's GPU feature status before interpreting painting costs. A
focused local landscape trace reported software canvas rasterization/compositing
and SwiftShader, not hardware GPU rendering. Loom and Sculpture spent most traced
time in native path/arc painting despite short JavaScript callbacks; Engine was
instead dominated by JavaScript rasterization. Landscape increased backing-canvas
area, and a fresh mount above 600px selected the existing larger thread/point
counts. These observations explain why callback duration alone understates frame
cost; they do not isolate each factor or establish a phone/GPU bottleneck. Inclusive
trace events overlap and must not be summed as exclusive CPU percentages. Compare
separate untraced frame windows, since tracing itself changes cadence. No quality,
density, resolution, or compositing-layer policy was changed from this evidence.

The theme-cache journey warms both SVGs, switches eight more times and revisits the
engine. It checks successful image loading, two stable asset URLs and transferred
bytes using same-origin Resource Timing. Chromium additionally summarizes image-
decode-related trace events (not exclusive decode time or proof of decoded/GPU
retention). HTTP-cache hits do not imply zero decoding. Local preview cache results
do not establish CDN behavior or justify eagerly retaining decoded images.
