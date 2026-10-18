# Jhon Smith Romero · Portfolio Lab

Jhon Smith Romero’s engineering workspace: explore my stack, inspect a working systems experiment, and read my experience.

**[Explore the portfolio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/)** · **[Case study](CASE_STUDY.md)** · **[GitHub profile](https://github.com/JhonSmithRomeroSolorzano)** · **[Roadmap](ROADMAP.md)**

## Résumé and presentation

The [résumé section](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#resume) includes selected employment, education, and certifications verified against [my LinkedIn profile](https://www.linkedin.com/in/jhonsmithr) on October 6, 2026. Dates are preserved as listed, including overlapping roles; descriptions do not imply unverified employer relationships or outcomes. Public professional content lives in `src/features/portfolio/data/profile.ts`.

I directly confirmed the descriptions of my current Antecursor role and my Athletify work. At Antecursor, I participate in feature design and implementation across databases, backend services, and frontend interfaces, with Azure and GitHub Actions. At Athletify, my contribution focused on React/TypeScript interfaces, Figma implementation, and some Next.js work. Its [official company profile](https://www.linkedin.com/company/athletifyofficial) supplies the sports-management product context; it does not establish additional libraries or personal backend responsibilities.

The portfolio uses a custom workspace composition: a compact identity rail and a connected stack map with selectable Frontend, Backend, Data, and Infrastructure layers. The map explains verified experience and leads to the collection and résumé contributions. Its detail panels reserve the tallest intrinsic height, so switching layers does not shift the page. Inactive panels are hidden and inert; the layout still grows with text and viewport changes. It is authored in React, CSS, and SVG for this project.

The map also illustrates a web request round trip: the browser prepares a request, a packet travels to backend validation, a data lookup returns a result, and the backend sends a response for the browser to render. Blue follows the currently processing step, not the selected detail panel; the selected layer has a neutral border. Infrastructure uses a subtle tint and dashed border to distinguish its hosting role, not another request hop. The calm tour runs automatically while visible, without playback buttons. It pauses offscreen, in hidden tabs, or during keyboard exploration, and starts a new request when those interruptions end. Reduced motion keeps a static explanation. This is an illustration, not live traffic; selecting layers never follows or changes with the animation.

The public page has four sections: Overview, Résumé, Contact, and Labs & play. Development status and roadmap promotion stay in the repository. Experience and contact precede the collection in document and menu order; the introduction links directly to experience.

Overview combines my introduction, engineering background, LinkedIn portrait, prominent senior full-stack role, and organized technology overview. The former About section and its repeated skill cards have been merged into this opening section; existing `#about` links still reach the introduction. Languages and testing span the stack; the four areas distinguish UI libraries, components and styling, frameworks and Figma design handoff, APIs and real-time communication, databases and caching, containers, CI/CD, and cloud platforms. The compact overview shows languages and testing; the interactive map holds the categorized technology details. Experience uses the full content width, with role details beside contributions and education underneath. Downloads retain the complete skills list from `src/features/portfolio/data/technology-stack.ts`. Next.js is labeled as some experience.

Technology details were confirmed directly by me on October 6, 2026, with Linux and PM2 added from my direct confirmation on October 17. Infrastructure distinguishes operating systems (Linux), process management (PM2), containers, CI/CD, and cloud platforms. NoSQL is my strongest database experience, alongside SQL; cloud experience includes Azure and some AWS work. Testing lists Jest, Playwright, and Mocha, with integration and end-to-end testing. The portrait is stored locally in `public/jhon-smith-romero.jpg`, so it does not depend on an expiring LinkedIn image URL. Résumé and Contact are available in the main menu; duplicate links were removed from the introduction.

Professional projects appear inside their corresponding Experience entries, with my contributions emphasized beneath a brief product description and public link. I confirmed [Nimrod](https://nimrod.io/) belongs to both Antecursor roles: the earlier entry describes interfaces, services, maintenance, and refactoring; the current entry covers feature design and implementation across the stack, Azure, and GitHub Actions. Athletify focuses on React/TypeScript frontend features and translating Figma designs into product interfaces. Next.js remains qualified as some experience. These contribution lists replace duplicate role bullets and use the responsibilities already verified for each period. Project data lives with each role in `src/features/portfolio/data/profile.ts`; additional claims require confirmation.

The portfolio uses uppercase JSR branding, a warm neutral light theme, and a navy dark theme. A single light/dark toggle follows the device until the visitor chooses an appearance, then remembers that choice. There is no separate System button; existing automatic preferences remain supported. Blocked browser storage leaves the control usable for the current visit.

The JSR mark reverses its tile and lettering colors with the theme. The browser favicon follows the same choice, including a saved preference before the application renders.

Section entrances use progressive enhancement: content stays visible without animation support. Reduced-motion preferences disable entrances and smooth scrolling; keyboard focus cancels an active entrance.

Navigation has a sliding section indicator that follows reading position and points directly to a clicked destination during smooth scrolling. A brief blue sweep marks section arrivals, a thin top line shows reading progress, and the experience timeline fills as its entries pass through the viewport. Links retain native URL/history and keyboard behavior. Wheel, touch, and scrolling keys release a pending destination; reduced-motion preferences keep the current-section indicator while disabling decorative motion. Scroll work is coalesced into animation frames and section geometry updates when content or the viewport resizes.

Anchor destinations accept focus without entering the Tab order. Keyboard navigation uses an immediate scroll so WebKit's focus adjustment cannot interrupt a smooth anchor journey; pointer navigation retains smooth scrolling. Both paths keep the animated menu and arrival feedback unless reduced motion is preferred.

Each experience entry includes a short role summary alongside its detailed contributions. These summaries use the responsibilities already confirmed for that employer and period, and appear in both résumé downloads. They do not add unverified project outcomes or metrics. Optional direct contact fields remain unpublished until exact details are supplied; LinkedIn remains available.

## Labs & play

The collection has **seven peer experiences**, reached through illustrated cards and direct anchors. Each has its own visual identity and a short interaction. There is no multi-lab dropdown, expanded dashboard, or nested catalog. Experience and contact stay above the collection.

- **[Jet Engine](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#jet-engine)**: change engine speed and watch a cutaway turbofan respond. The intake fan and six inner blade rows turn faster while air tracers speed up, become denser, and extend farther behind the engine. Blue shows cool intake/bypass air; orange shows heated core air. Idle, Cruise, and Full power presets use the same control. Speed changes explicitly start playback; Pause, Reset, navigation, offscreen changes, hidden tabs, and motion preferences stop it. Reduced motion redraws a still composition; canvas denial retains SVG parts and speed-dependent air paths. Four short stage descriptions explain the route without a puzzle. This is a slowed visual illustration, not real engine operating data or a thermodynamic simulation. Built using Anatomy; [design and provenance](docs/JET_ENGINE.md). The former local `#pin-lock` entry redirects here without removing query context.

- **[Gravity Loom](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#gravity-loom)**: drag a glowing attractor with mouse or touch to pull the existing threads in real time. Dragging empty space moves the selected point; a stronger held-point pull makes the response perceptible without teleporting particles or clearing trails. Dragging, arrow-key steering, and movement buttons explicitly start playback; hover and scrolling do not. Space plays/pauses the focused field and Escape stops it. Native direction buttons and named positions provide alternatives to dragging. Add up to four attractors, choose Orbit or counter-rotating Weave, and adjust strength without restarting the scene. Only Reset rebuilds the live artwork; reduced motion updates static drawings without animated playback, and SVG retains controls without canvas. Playback stops on navigation, offscreen changes, hidden tabs, or motion-preference changes. The model is kinetic artwork, not orbital physics. Mobile uses 48 threads and wider screens 96, with bounded trail histories and no graphics dependency.

- **[Signal Sculpture](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#signal-sculpture)**: a particle-built JSR monogram transforms into a ribbon or orbital sculpture. Explicit Play/Pause, Pulse, and Reset controls work with keyboard and touch; mouse perspective is optional. Shapes change instantly while paused or with reduced motion. Playback stops offscreen, on navigation, when the tab is hidden, or when motion preferences change; returning never autoplays. A lightweight canvas renderer uses 720 points on small screens and 1,800 otherwise, with a static SVG fallback if canvas is unavailable. No graphics dependency is added.

- **[Motion Studio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#motion-studio)**: compare four timing curves against a steady reference using the same distance, duration, and clock. Pick a curve, then explicitly play both lanes. Reduced motion shows the end states. Control changes, hidden tabs, motion-preference changes, navigation away, and scrolling the experience out of view cancel playback. Returning waits for an explicit replay.

- **[Connection puzzle](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#connection-game)**: rotate a 4×4 board to connect its inlet and outlet. Three authored puzzles include hints, undo, reset, keyboard navigation, and validated browser-local progress. Click or Space rotates; arrow keys move between tiles. Open tabs on the same site share saved boards while keeping their selected puzzle and keyboard focus. External changes clear only the affected boards' Undo history and hints; a stale action loads the latest save before asking you to try again. Saves are local to the current site, with honest feedback when storage is unavailable. There is no clock or account.

- **[Cache Rescue](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#cache-rescue)**: choose independent reads or a shared fetch, send the crowd, and try to deliver every reply with one database read. Three challenges compare a simultaneous rush, overlapping arrivals, and a sparse stream. Dots move between the crowd, database, shared waiting, and delivered replies. Results explain why sharing avoids duplicate work—or why sparse arrivals need only one read either way. Playback starts only on request, supports pause/resume/reset, and stops when leaving the view, navigating elsewhere, hiding the tab, or changing motion preferences. Reduced motion shows a static result. The deterministic model covers one expired key and one coordinator, fixed successful fetches, unlimited parallel reads, and immediate cache hits. It is an illustration, not a production measurement. The concept follows the user's [visual cache-stampede inspiration](https://www.facebook.com/reel/2912294019139465/); the code and artwork are original.

- **[Algorithm Garden](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#algorithm-garden)**: light up one of three authored trees in breadth-first or pre-order depth-first order. Try a node, recover from a wrong turn, or ask for a hint. Numbered nodes, a traversal trail, and announced feedback explain each move. It works with keyboard or pointer, without a timer. Progress lasts for the visit.

The seven pieces download independently as they approach the viewport or when followed directly. Failed downloads offer reload recovery; runtime render/effect errors are isolated to the affected experience and offer a local retry. Both keep the résumé usable. Their styles load with the page. Native dynamic imports avoid a WebKit recovery issue triggered by module preloading shared optional dependencies. `#lab` reaches the collection; old `#signal-lab` anchors also reach it. Old dashboard query parameters no longer configure the public experiences.

Direct experience links retain their landing while nearby content finishes loading. Wheel, touch, pointer, and keyboard input release that adjustment; browsing away never pulls the visitor back to a pending experience.

### Earlier systems experiments

The original Signal Lab dashboard is retired from the public portfolio. Its presentation and browser adapters live in `archive/signal-lab/`; pure models remain in `src/domain/`. The optional API, CLI, and unit/integration coverage are retained. Browser tests now cover the seven current experiences rather than the removed dashboard workflows. The [case study](CASE_STUDY.md) documents that earlier model and its assumptions; the [optional local Node API](server/README.md) and batch CLI can still run it.

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

### Anatomy skill

[Anatomy](https://github.com/wheresryan22/anatomy) is installed for this project at `.opencode/skills/anatomy`, with its MIT license, kit, references, scripts, and examples. Mention `@anatomy` for a detailed interactive isometric figure; restart OpenCode if a running session does not discover it. The pinned upstream revision and illustration design are recorded in [the Jet Engine notes](docs/JET_ENGINE.md). Installation adds no application dependency.

`npm run build:engine` regenerates Jet Engine's checked-in SVG assets and projection data; `npm run build:engine -- --check` verifies them without writing, and `npm run build:engine -- --audit` checks the recorded static geometry. The kit runs only in this authoring step, not in the browser or ordinary production builds. Other projects can use the upstream [installation instructions](https://github.com/wheresryan22/anatomy#install).

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

See [ARCHITECTURE.md](ARCHITECTURE.md) for dependency direction, responsibilities, styling ownership, and enforced boundaries.

The app uses React, TypeScript, and Vite. Relative asset paths support both GitHub Pages project URLs and root hosting. It has keyboard-operable controls, a skip link, live metric announcements, and reduced-motion support. Typography is served locally with system fallbacks.

## About me

I'm Jhon Smith Romero, a systems and telecommunications engineer with more than seven years in software development. My experience includes JavaScript, TypeScript, React, Material UI, Mithril.js, Tailwind CSS, Node.js, Express, REST APIs, WebSockets, NoSQL, SQL, Redis, Linux, PM2, Docker, GitHub Actions, Azure, and some AWS work. I use Jest, Playwright, and Mocha for testing, including integration and end-to-end tests. NoSQL is my strongest area of database experience.

This repository contains original portfolio work. It does not contain employer code or client data. Features are developed with AI assistance and reviewed through tests, builds, and documented checks.

## Development approach

Each change should add something useful: a feature, a fix, a meaningful test, or an explanation of a real engineering decision. See [ROADMAP.md](ROADMAP.md) for the next milestone and [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## Deployment

GitHub Actions validates pull requests and deploys passing changes on `main` to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**. The `.openai/hosting.json` manifest also supports an owner-private Sites preview.

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

Cache Rescue, the connection puzzle, Motion Studio, Algorithm Garden, Signal Sculpture, Gravity Loom, and Jet Engine use separate JavaScript bundles. They load near the viewport, on direct anchor entry, or through the explicit load control. A failed download keeps the career content available and offers a reload to the affected experience. Jet Engine's fixed artwork uses theme-specific SVG assets loaded with that experience, not geometry embedded in the entry JavaScript. Missing casing art pauses the experience and offers an explicit reload.

`npm run test:browser` includes axe accessibility scans for both themes, keyboard journeys, 320px reflow, 200% default text-size checks, direct links, and failed-download recovery. Automated scans and accessibility-tree inspection do not replace a human screen-reader assessment.

The mobile recruiter journey covers both résumé downloads and contact navigation. Resource links have at least 44px-high hit areas, contact copy uses the normal 16px body size, and the contact action wraps with enlarged text. Gravity Loom preserves the grab offset when selecting the edge of a point, ignores Space key repeats, and supplies changing position feedback for keyboard moves. The [visitor and accessibility review guide](docs/USABILITY_REVIEW.md) separates these automated checks from the first-time visitor, physical-device, and screen-reader listening sessions that still need human participation.

Gravity Loom's points can travel across the full rectangular field, leaving a 24px margin to keep the handles visible. Trails, pointer input, and the canvas-free illustration share the same width/height mapping, including after resizing; there is no separate center-square drag boundary.

For a repeatable Lighthouse report, build the site, start `npm run preview -- --port 4175`, then run `npm run audit:performance -- http://127.0.0.1:4175/`. The script uses the installed Playwright Chromium browser (or `CHROME_PATH` when provided) and writes HTML/JSON reports under ignored `artifacts/`. It uses Lighthouse's mobile simulation defaults. Run it without concurrent browser tests; local lab scores are not real-user measurements or guarantees for the hosted site.

The IBM Plex Latin font files are served locally from `public/fonts/` under the included SIL Open Font License. They are the same Google Fonts distributions used by the original stylesheet; local delivery removes the external stylesheet from the first render path.

The build prerenders the same React page into HTML, then hydrates its controls in the browser. Career content, native section links, and résumé downloads remain available with JavaScript disabled or blocked. Optional games keep honest loading placeholders and do not download during prerendering.

### Deployment integrity

Every build writes `release.json` with its source commit and SHA-256 asset hashes. The Pages workflow verifies the served commit and every listed asset after deployment. Run `npm run verify:deployment -- <public-url> <private-preview-url> --private-stdin` to compare both hosts after publication; supply `{ "token": "..." }` through stdin only using the authorized Sites access token. The verifier scopes that header to the existing private preview and rejects redirects. Never put tokens in arguments, files, or logs. PDFs have variable generation metadata, so the manifest covers their shared plain-text source export instead. This check runs after both publishes; it does not automatically deploy the private preview or change its audience.

### Performance gates

Production builds enforce compressed entry JS (100 KiB), all JS (140 KiB), CSS (16 KiB), and HTML (20 KiB) limits, plus 90 KiB of fonts and a 40 KiB portrait. `npm run audit:ci` starts an isolated preview on port 4175 and takes three mobile Lighthouse samples sequentially; median LCP must stay within 4 seconds, CLS within 0.1, and total blocking time within 350 ms. CI runs it after browser tests to avoid competing browser load. Reports stay in ignored `artifacts/`; these are regression budgets for simulated conditions, not real-user speed guarantees.

The audit uses Chromium's `--no-sandbox` launch flag only for the loopback preview on Linux GitHub Actions runners. Audits of hosted URLs and local development retain the browser's default sandbox. Deployment verification requests the canonical directory URL for `index.html`, avoiding Sites' index redirect; all actual redirects remain rejected. For the private Sites origin only, comparison removes the recognized Cloudflare challenge script appended before the closing body. All portfolio content and application scripts must still match their hashes.

Motion Studio's “Take this motion with you” panel exports matching curve/duration CSS and example markup, including a reduced-motion end state. Clipboard denial selects the visible CSS for manual copying; changing the settings clears obsolete copy feedback.

Algorithm Garden offers three authored trees: Balanced branches, Deep roots, and Open canopy. Both traversal modes use the selected tree's topology; choosing a different tree starts a new walk, while reselecting the current tree preserves progress.

Garden's optional traversal explanation displays the live queue front or stack top, the last visited node, and its newly added children. The same pure step model drives play order and the explanation so they cannot drift apart.

Cache Rescue includes an optional prediction before each round. A whole-number guess is locked when playback starts and compared with the model's actual database reads after completion. Resetting or changing the scenario clears the guess; playing without a prediction remains available.

Connection puzzle records completed attempts and separate best rotation counts with and without hints. Rotation counts and hint assistance survive Undo, reloads, and tab synchronization; Start again resets the attempt while keeping records. Earlier saved boards migrate without losing moves, but cannot establish a best until restarted because their rotation/hint history was not recorded. Clearing browser storage removes records. No score is sent to a server.

Each experience has an optional “How I built…” note covering its implementation decision, tradeoff, verification, and source code. The notes describe this repository's original code; they do not introduce employer claims. Their source links share one repository constant with the footer.
