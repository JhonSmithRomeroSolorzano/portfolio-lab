# Jhon Smith Romero · Portfolio Lab

Jhon Smith Romero’s engineering workspace: explore my stack, inspect a working systems experiment, and read my experience.

**[Explore the portfolio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/)** · **[Case study](CASE_STUDY.md)** · **[GitHub profile](https://github.com/JhonSmithRomeroSolorzano)** · **[Roadmap](ROADMAP.md)**

## Résumé and presentation

The [résumé section](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#resume) includes selected employment, education, and certifications verified against [my LinkedIn profile](https://www.linkedin.com/in/jhonsmithr) on October 6, 2026. Dates are preserved as listed, including overlapping roles; descriptions do not imply unverified employer relationships or outcomes. Public professional content lives in `src/profile.ts`.

I directly confirmed the descriptions of my current Antecursor role and my Athletify work. At Antecursor, I participate in feature design and implementation across databases, backend services, and frontend interfaces, with Azure and GitHub Actions. At Athletify, my contribution focused on React/TypeScript interfaces, Figma implementation, and some Next.js work. Its [official company profile](https://www.linkedin.com/company/athletifyofficial) supplies the sports-management product context; it does not establish additional libraries or personal backend responsibilities.

The portfolio uses a custom workspace composition: a compact identity rail and a connected stack map with selectable Frontend, Backend, Data, and Infrastructure layers. The map explains verified experience and leads to the collection and résumé contributions. Its detail panels reserve the tallest intrinsic height, so switching layers does not shift the page. Inactive panels are hidden and inert; the layout still grows with text and viewport changes. It is authored in React, CSS, and SVG for this project.

The public page has four sections: Overview, Résumé, Contact, and Labs & play. Development status and roadmap promotion stay in the repository. Experience and contact precede the collection in document and menu order; the introduction links directly to experience.

Overview combines my introduction, engineering background, LinkedIn portrait, prominent senior full-stack role, and organized technology overview. The former About section and its repeated skill cards have been merged into this opening section; existing `#about` links still reach the introduction. Languages and testing span the stack; the four areas distinguish UI libraries, components and styling, frameworks and Figma design handoff, APIs and real-time communication, databases and caching, containers, CI/CD, and cloud platforms. The compact overview shows languages and testing; the interactive map holds the categorized technology details. Experience uses the full content width, with role details beside contributions and education underneath. Downloads retain the complete skills list from `src/technology-stack.ts`. Next.js is labeled as some experience.

Technology details were confirmed directly by me on October 6, 2026. NoSQL is my strongest database experience, alongside SQL; cloud experience includes Azure and some AWS work. Testing lists Jest, Playwright, and Mocha, with integration and end-to-end testing. The portrait is stored locally in `public/jhon-smith-romero.jpg`, so it does not depend on an expiring LinkedIn image URL. Résumé and Contact are available in the main menu; duplicate links were removed from the introduction.

Professional projects appear inside their corresponding Experience entries, with my contributions emphasized beneath a brief product description and public link. I confirmed [Nimrod](https://nimrod.io/) belongs to both Antecursor roles: the earlier entry describes interfaces, services, maintenance, and refactoring; the current entry covers feature design and implementation across the stack, Azure, and GitHub Actions. Athletify focuses on React/TypeScript frontend features and translating Figma designs into product interfaces. Next.js remains qualified as some experience. These contribution lists replace duplicate role bullets and use the responsibilities already verified for each period. Project data lives with each role in `src/profile.ts`; additional claims require confirmation.

The portfolio uses uppercase JSR branding, a warm neutral light theme, and a navy dark theme. A single light/dark toggle follows the device until the visitor chooses an appearance, then remembers that choice. There is no separate System button; existing automatic preferences remain supported. Blocked browser storage leaves the control usable for the current visit.

The JSR mark reverses its tile and lettering colors with the theme. The browser favicon follows the same choice, including a saved preference before the application renders.

Section entrances use progressive enhancement: content stays visible without animation support. Reduced-motion preferences disable entrances and smooth scrolling; keyboard focus cancels an active entrance.

Navigation has a sliding section indicator that follows reading position and points directly to a clicked destination during smooth scrolling. A brief blue sweep marks section arrivals, a thin top line shows reading progress, and the experience timeline fills as its entries pass through the viewport. Links retain native URL/history and keyboard behavior. Wheel, touch, and scrolling keys release a pending destination; reduced-motion preferences keep the current-section indicator while disabling decorative motion. Scroll work is coalesced into animation frames and section geometry updates when content or the viewport resizes.

Anchor destinations accept focus without entering the Tab order. Keyboard navigation uses an immediate scroll so WebKit's focus adjustment cannot interrupt a smooth anchor journey; pointer navigation retains smooth scrolling. Both paths keep the animated menu and arrival feedback unless reduced motion is preferred.

## Labs & play

The collection has **four peer experiences**, reached through illustrated cards and direct anchors. Each has its own visual identity and a short interaction. There is no multi-lab dropdown, expanded dashboard, or nested catalog. Experience and contact stay above the collection.

- **[Cache Rescue](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#cache-rescue)**: choose independent reads or a shared fetch, send the crowd, and try to deliver every reply with one database read. Three challenges compare a simultaneous rush, overlapping arrivals, and a sparse stream. Dots move between the crowd, database, shared waiting, and delivered replies. Results explain why sharing avoids duplicate work—or why sparse arrivals need only one read either way. Playback starts only on request, supports pause/resume/reset, and stops when leaving the view, navigating elsewhere, hiding the tab, or changing motion preferences. Reduced motion shows a static result. The deterministic model covers one expired key and one coordinator, fixed successful fetches, unlimited parallel reads, and immediate cache hits. It is an illustration, not a production measurement. The concept follows the user's [visual cache-stampede inspiration](https://www.facebook.com/reel/2912294019139465/); the code and artwork are original.
- **[Connection puzzle](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#connection-game)**: rotate a 4×4 board to connect its inlet and outlet. Three authored puzzles include hints, undo, reset, keyboard navigation, and validated browser-local progress. Click or Space rotates; arrow keys move between tiles. Saves are local to the current site, with honest feedback when storage is unavailable. There is no clock or account.
- **[Motion Studio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#motion-studio)**: compare four timing curves against a steady reference using the same distance, duration, and clock. Pick a curve, then explicitly play both lanes. Reduced motion shows the end states. Control changes, hidden tabs, and motion-preference changes cancel playback.
- **[Algorithm Garden](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#algorithm-garden)**: light up a seven-node tree in breadth-first or pre-order depth-first order. Try a node, recover from a wrong turn, or ask for a hint. Numbered nodes, a traversal trail, and announced feedback explain each move. It works with keyboard or pointer, without a timer. Progress lasts for the visit.

The four pieces download independently as they approach the viewport or when followed directly. Failed downloads leave the résumé usable and offer reload recovery. Their styles load with the page to retain reliable recovery in WebKit. `#lab` reaches the collection; old `#signal-lab` anchors also reach it. Old dashboard query parameters no longer configure the public experiences.

### Earlier systems experiments

The original Signal Lab dashboard is retired from the public portfolio. Its source modules, deterministic models, API, CLI, and unit/integration coverage remain in the repository as engineering reference. Browser tests now cover the four current experiences rather than the removed dashboard workflows. The [case study](CASE_STUDY.md) documents that earlier model and its assumptions; the [optional local Node API](server/README.md) and batch CLI can still run it.

## Run locally

Use Node.js 22.19+ (Node 24 LTS recommended).

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

The app uses React, TypeScript, and Vite. Relative asset paths support both GitHub Pages project URLs and root hosting. It has keyboard-operable controls, a skip link, live metric announcements, and reduced-motion support. Typography is served locally with system fallbacks.

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

### Portfolio audits and sharing

The public recruiter URL is <https://jhonsmithromerosolorzano.github.io/portfolio-lab/>. Static canonical, Open Graph, and large-card metadata point to that address. `public/social-preview.svg` is the editable source for the 1200×630 JPEG sharing image. The Sites preview keeps its existing audience.

Cache Rescue, the connection puzzle, Motion Studio, and Algorithm Garden use separate JavaScript bundles. They load near the viewport, on direct anchor entry, or through the explicit load control. A failed download keeps the career content available and offers a reload to the affected experience.

`npm run test:browser` includes axe accessibility scans for both themes, keyboard journeys, 320px reflow, 200% default text-size checks, direct links, and failed-download recovery. Automated scans and accessibility-tree inspection do not replace a human screen-reader assessment.

For a repeatable Lighthouse report, build the site, start `npm run preview -- --port 4175`, then run `npm run audit:performance -- http://127.0.0.1:4175/`. The script uses the installed Playwright Chromium browser (or `CHROME_PATH` when provided) and writes HTML/JSON reports under ignored `artifacts/`. It uses Lighthouse's mobile simulation defaults. Run it without concurrent browser tests; local lab scores are not real-user measurements or guarantees for the hosted site.

The IBM Plex Latin font files are served locally from `public/fonts/` under the included SIL Open Font License. They are the same Google Fonts distributions used by the original stylesheet; local delivery removes the external stylesheet from the first render path.
