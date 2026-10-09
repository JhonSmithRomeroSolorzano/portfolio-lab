# Jhon Smith Romero · Portfolio Lab

Jhon Smith Romero’s engineering workspace: explore my stack, inspect a working systems experiment, and read my experience.

**[Explore the portfolio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/)** · **[Case study](CASE_STUDY.md)** · **[GitHub profile](https://github.com/JhonSmithRomeroSolorzano)** · **[Roadmap](ROADMAP.md)**

## Résumé and presentation

The [résumé section](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#resume) includes selected employment, education, and certifications verified against [my LinkedIn profile](https://www.linkedin.com/in/jhonsmithr) on October 6, 2026. Dates are preserved as listed, including overlapping roles; descriptions do not imply unverified employer relationships or outcomes. Public professional content lives in `src/profile.ts`.

I directly confirmed the descriptions of my current Antecursor role and my Athletify work. At Antecursor, I participate in feature design and implementation across databases, backend services, and frontend interfaces, with Azure and GitHub Actions. At Athletify, my contribution focused on React/TypeScript interfaces, Figma implementation, and some Next.js work. Its [official company profile](https://www.linkedin.com/company/athletifyofficial) supplies the sports-management product context; it does not establish additional libraries or personal backend responsibilities.

The portfolio uses a custom workspace composition: a compact identity rail and a connected stack map with selectable Frontend, Backend, Data, and Infrastructure layers. The map explains verified experience and leads to the lab and résumé contributions. It is authored in React, CSS, and SVG for this project.

The public page has four sections: Workbench, Résumé, Contact, and Labs & play. Development status and roadmap promotion stay in the repository. Experience and contact precede the collection in document and menu order; the introduction links directly to experience.

Workbench combines my introduction, engineering background, LinkedIn portrait, prominent senior full-stack role, and organized technology overview. The former About section and its repeated skill cards have been merged into this opening section; existing `#about` links still reach the introduction. Languages and testing span the stack; the four areas distinguish UI libraries, components and styling, frameworks and Figma design handoff, APIs and real-time communication, databases and caching, containers, CI/CD, and cloud platforms. The compact overview shows languages and testing; the interactive map holds the categorized technology details. Experience uses the full content width, with role details beside contributions and education underneath. Downloads retain the complete skills list from `src/technology-stack.ts`. Next.js is labeled as some experience.

Technology details were confirmed directly by me on October 6, 2026. NoSQL is my strongest database experience, alongside SQL; cloud experience includes Azure and some AWS work. Testing lists Jest, Playwright, and Mocha, with integration and end-to-end testing. The portrait is stored locally in `public/jhon-smith-romero.jpg`, so it does not depend on an expiring LinkedIn image URL. Résumé and Contact are available in the main menu; duplicate links were removed from the introduction.

Professional projects appear inside their corresponding Experience entries, with my contributions emphasized beneath a brief product description and public link. I confirmed [Nimrod](https://nimrod.io/) belongs to both Antecursor roles: the earlier entry describes interfaces, services, maintenance, and refactoring; the current entry covers feature design and implementation across the stack, Azure, and GitHub Actions. Athletify focuses on React/TypeScript frontend features and translating Figma designs into product interfaces. Next.js remains qualified as some experience. These contribution lists replace duplicate role bullets and use the responsibilities already verified for each period. Project data lives with each role in `src/profile.ts`; additional claims require confirmation.

The portfolio uses uppercase JSR branding, a warm neutral light theme, and a navy dark theme. A single light/dark toggle follows the device until the visitor chooses an appearance, then remembers that choice. There is no separate System button; existing automatic preferences remain supported. Blocked browser storage leaves the control usable for the current visit.

The JSR mark reverses its tile and lettering colors with the theme. The browser favicon follows the same choice, including a saved preference before the application renders.

Section entrances use progressive enhancement: content stays visible without animation support. Reduced-motion preferences disable entrances and smooth scrolling; keyboard focus cancels an active entrance.

Navigation has a sliding section indicator that follows reading position and points directly to a clicked destination during smooth scrolling. A brief blue sweep marks section arrivals, a thin top line shows reading progress, and the experience timeline fills as its entries pass through the viewport. Links retain native URL/history and keyboard behavior. Wheel, touch, and scrolling keys release a pending destination; reduced-motion preferences keep the current-section indicator while disabling decorative motion. Scroll work is coalesced into animation frames and section geometry updates when content or the viewport resizes.

Anchor destinations accept focus without entering the Tab order. Keyboard navigation uses an immediate scroll so WebKit's focus adjustment cannot interrupt a smooth anchor journey; pointer navigation retains smooth scrolling. Both paths keep the animated menu and arrival feedback unless reduced motion is preferred.

## Labs & play

The final section is a collection of three independent interactive pieces, with direct anchors and generous space between them. Signal Lab keeps its navy systems workspace. The connection puzzle uses a warm board-game style; Motion Studio has a violet canvas. The main scroll indicator and reading progress continue to follow the collection as one section. Existing `#lab` links and Signal Lab query settings still work.

- **Connection puzzle** (`#connection-game`): rotate a 4×4 board to carry a signal from the top-left inlet to the bottom-right outlet. Three authored puzzles have verified solutions. Click or Space rotates; arrow keys move around the board. Undo retains the latest 100 turns; reset restores the current puzzle. Optional hints describe one tile along a possible solution without rotating it. Completing a connection offers the next puzzle, with keyboard focus placed on its first tile. Each puzzle remembers its board and turn count on this site in this browser; choosing another puzzle preserves both. Undo history lasts for the visit, including while switching puzzles. Reset affects only the selected puzzle. Invalid saves fall back to a fresh board with a notice; unavailable storage keeps play working for the visit. No account or clock is required.
- **Motion Studio** (`#motion-studio`): compare any of four timing curves against a steady reference using two simultaneous lanes with a shared clock, distance, and duration. A solid marker follows the selected curve; an outlined marker shows the reference, also drawn as a dashed line on the timing graph. Playback is explicit. Nothing starts automatically. Changing controls cancels playback; a hidden tab or live reduced-motion change cancels it too. Reduced motion shows both end states without animation.

Expanded Signal Lab makes every surrounding collection piece inert while retaining its focus trap and Escape restoration. Puzzle progress is saved locally after each interaction, including an immediate reload. Saves are versioned, bounded, and validated against each tile’s possible rotations; connection results are recomputed. Saves are local to the current site, are not synced across devices, and simultaneous tabs use the last write. Motion settings remain visit-only. Neither piece changes existing experiment links.

### Signal Lab

Change incoming traffic, toggle a warm read cache, and slow down or disconnect the database. The interface shows how these choices affect successful requests, database demand, and mean response time.

This is an original, browser-only simulation, not a connection to live infrastructure. Every number follows the documented model in [`src/simulation.ts`](src/simulation.ts). The diagram shows a conceptual architecture; the public demo does not run an API, Redis, or a database. An optional [local Node HTTP API](server/README.md) exposes the same model with input validation and integration tests.

The lab opens with one working demo. **More experiments** reveals the chooser, discovery, sharing, and guided investigations; hiding these tools retains the selected demo and all settings. Direct links still open their selected experiment. Use **Choose a lab** to switch between frontend, backend, data, and workspace tools; settings remain available during the visit. Shared traffic controls appear only for tools that use that workload. The workspace and long tables have bounded, keyboard-scrollable viewports.

The six independent frontend/reliability/data experiments also preserve their own settings in versioned links: async search, debounce/throttle, circuit breakers, rate limiting, cache eviction, and concurrent writes. **Link to this lab** includes the selected setup; results are recomputed, never trusted from a URL. Configuration changes survive immediate reload, and switching tools keeps the other experiments’ in-memory settings. Invalid, oversized, partial, duplicate, or unsupported setup links show a warning and do not apply partial values. Older independent tools still open at their defaults.

Open **Follow an investigation** for three guided paths: keep an async interface correct, protect a recovering service, or resolve competing writes. Each step loads a known setup, asks a question, and offers optional evidence. These paths connect engineering decisions; their independent models do not simulate one combined production system.

Use **Browse experiments** to search by behavior and filter by area. The six event-based labs offer explicit playback, pause, pace selection, and manual event stepping. Playback stops when leaving the lab, changing inputs, hiding the tab, reaching the end, or enabling reduced motion. Playback is a reading aid; its pace does not represent simulated time. Nothing starts automatically.

### Explore the tools

- Compare a captured baseline with your current setup.
- Save up to eight named experiments in this browser, or move them between browsers with JSON snapshots.
- Adjust exact traffic, read-cache hit rate, database pool size, and write share.
- Sweep traffic, inspect every sample, and generate a CSV.
- Follow a modeled request or explore the separate TTL and queue timelines.
- Run the same model through the optional local API or NDJSON batch CLI.

The [engineering walkthrough](CASE_STUDY.md) explains the formulas, architecture, limits, and a five-minute review path.

### Compare, save, and inspect

Capture a baseline in **Compare two setups**, change the workload, and restore the baseline whenever needed. Baselines persist in this browser; blocked storage falls back to the current visit. Export a readable Markdown report or versioned JSON containing both setups, or copy a comparison link that opens both. Results are always recalculated. Shared links omit unrelated URL parameters.

The experiment library supports rename, update, undo removal, cross-tab synchronization, and portable JSON backups. Imports retain existing saves, skip equivalent named setups, and reject overflow before changing the library. Browser storage has last-write-wins semantics across simultaneous tabs; backups are the portable copy.

The cache timeline compares fixed TTL, invalidation on update, and stale-while-revalidate. It separates blocking reads from background fetches and exports every read as CSV. Queue profiles hold 64 arrivals constant while varying burst shape, and optional recovery continues until accepted work drains. A separate event-based scheduler shows per-request timing and optional deadlines; the retry experiment shows exponential backoff, a shared budget, and seeded jitter. Every experiment states its assumptions. Wide tables accept keyboard focus and horizontal arrow-key scrolling.

### Verify through HTTP

The **Verify with the local API** panel explains how to run the optional service. In local development, choose the API mode and explicitly send a setup; the client checks agreement with the browser model, supports cancellation, and shows HTTP timing separately from simulated latency. Published builds do not access localhost. See the [local workflow](server/README.md#browser-client-local-development).

### Share an experiment

The address bar reflects your settings. Use **Copy experiment link** to share a URL that opens the same scenario at the lab. If clipboard access is unavailable, select and copy the fallback link. Shared links include only experiment settings, excluding unrelated query parameters.

For example, [`?traffic=300&cache=off&database=slow#lab`](https://jhonsmithromerosolorzano.github.io/portfolio-lab/?traffic=300&cache=off&database=slow#lab) opens 300 requests per second with no cache and a slow database. Invalid or repeated fields use their default values. **Reset the experiment** restores defaults and clears the experiment parameters.

### Model assumptions

- API overhead: 12 ms per request.
- Warm cache: adjustable hit rate (80% by default); hits complete in 8 ms when enabled.
- Database: adjustable pool of 1–32 connections (8 by default), 80 ms per read normally, 400 ms when slow.
- Capacity: `connections × 1000 / latencyMs` requests per second.
- Adjustable write share (0% by default); writes bypass cache and use the same database latency as reads.
- Requests over capacity or to an offline database time out after 1,000 ms.
- Mean response time includes both successes and timeouts.

The main steady-state model excludes queues, retries, expiry, and network variability. A separate **cache expiry** experiment models one read per second, a version update at 5s, and a fixed TTL with no invalidation. A separate **bounded queue** experiment shows FIFO service, burst absorption, and reject-new overflow. These simplifications are deliberate and visible in the demo. The model illustrates trade-offs, not production performance.

## Run locally

Use Node.js 22.12+ (Node 24 LTS recommended).

```sh
npm ci
npm run dev
```

```sh
npm test       # behavior and boundary tests for the model
npm run build # strict TypeScript check and production build
npm run preview
# Optional local browser regression run after building:
npx playwright install chromium webkit
npm run test:browser
```

### Résumé downloads

The Experience section offers a two-page PDF and a plain-text résumé. Both are generated from the same verified profile, technology groups, and role contributions displayed on the site. Links to public profiles and projects remain clickable in the PDF; overlapping employment periods and qualified experience are preserved.

`npm run dev` generates these assets before starting, and `npm run build` regenerates them before Vite packages the site. After editing profile data while the dev server is running, use `npm run build:resume` to refresh the downloads. Generated files in `public/resume/` are ignored by Git. PDFKit runs only during generation and is not shipped in the browser bundle. The generator keeps each role together and rejects content that would overflow a page.

## Project structure

```text
src/App.tsx            Portfolio and interactive controls
src/styles.css        Responsive layout and visual system
src/simulation.ts     Pure, typed simulation model
tests/                Model behavior tests
public/               Static assets
.github/workflows/    Validation and GitHub Pages deployment
```

The app uses React, TypeScript, and Vite. Relative asset paths support both GitHub Pages project URLs and root hosting. It has keyboard-operable controls, a skip link, live metric announcements, and reduced-motion support. Typography loads from Google Fonts with local fallbacks.

## About me

I'm Jhon Smith Romero, a systems and telecommunications engineer with more than seven years in software development. My experience includes JavaScript, TypeScript, React, Material UI, Mithril.js, Tailwind CSS, Node.js, Express, REST APIs, WebSockets, NoSQL, SQL, Redis, Docker, GitHub Actions, Azure, and some AWS work. I use Jest, Playwright, and Mocha for testing, including integration and end-to-end tests. NoSQL is my strongest area of database experience.

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
