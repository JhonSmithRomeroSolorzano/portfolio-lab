# Architecture

The portfolio is a small React application with six optional experiences. Its architecture separates reasons to change without adding a framework, service container, or inheritance hierarchy.

This document owns technical structure, dependency contracts, and design rationale. For agent workflow, verification commands, content safeguards, and delivery instructions, see [AGENTS.md](AGENTS.md).

## Source map

```text
src/
  main.tsx                         Browser entry and eager styles
  app/                             Page composition, navigation, reading motion
  features/
    portfolio/                     Overview, résumé, contact, stack map
      data/                        Verified profile and shared résumé data
    playground/
      catalog.ts                   Cards, anchors, labels, stable lazy loaders
      DeferredExperiment.tsx       Download/visibility/anchor lifecycle
      ExperimentBoundary.tsx       Per-experience runtime failure recovery
      cache-rescue/                Controller, arena, UI, challenge definitions, CSS
      connection-puzzle/           Progress controller, browser persistence adapter, UI, CSS
      motion-studio/               Playback controller, curves, UI, CSS
      algorithm-garden/            UI and CSS
      signal-sculpture/            Controls, canvas renderer, CSS
      gravity-loom/                Field controls, trail renderer, CSS
  domain/
    playground/                    Pure cache/puzzle/traversal models
    simulation/                    Maintained systems models used by API and CLI
  shared/
    hooks/                         Browser media queries and playback interruption
    ui/                            Arrow and theme control
    theme/                         Theme preference policy
    styles/                        Tokens, base elements, shared primitives
archive/signal-lab/                 Retired dashboard UI and browser adapters
server/                            Optional loopback HTTP adapter
scripts/                           Résumé generation, batch CLI, performance audit
tests/                             Unit, integration, dependency-direction checks
e2e/                               Production Chromium and WebKit journeys
```

## Dependency direction

`main → app → features → shared/domain`. Features may use their own modules, shared utilities, and pure models; the portfolio and playground do not import each other. Shared code cannot import features or app code. Domain modules import only domain modules and compile with ES2022 types, without React, DOM, or Node globals.

The Node API imports the simulation domain. The résumé generator imports verified `features/portfolio/data` without importing presentation components. The archive may use maintained modules, but maintained application/server/scripts code must never depend on the archive. Tests can import either side to retain coverage of historical portable formats and adapters.

[Dependency tests](tests/architecture.test.ts) check static imports, re-exports, and literal lazy imports against those directions. The [domain TypeScript configuration](tsconfig.domain.json) independently prevents browser/server APIs from leaking into pure models. The [main TypeScript configuration](tsconfig.json) also checks tests, browser journeys, and retained reference source. Archived UI is excluded from lint evolution, but remains type-checked and its behavioral tests run.

## Responsibilities and extension points

- **Single responsibility:** models calculate outcomes; game controllers own playback/state; components render controls and feedback. Browser subscriptions live in small shared hooks. Cache Rescue's arena only renders a supplied snapshot.
- **Open/closed:** the typed playground catalog drives both entry cards and lazy mounting. Aliases are configuration passed to the loader. Adding a piece does not require adding feature-specific branches to that loader.
- **Small contracts:** components receive the data/callbacks they use; optional loaders return a React component. Pure models accept plain typed inputs. The puzzle storage adapter accepts a minimal storage interface, so tests can simulate corrupt or unavailable storage.
- **Dependency inversion:** feature policy stays outside browser subscription utilities, and the API/CLI depend on pure models. No abstract base classes or dependency-injection container are needed for this app. Substitutability is relevant at these contracts, not a reason to introduce inheritance.
- **KISS and DRY:** keep each game distinct. Share browser lifecycle and common UI primitives, not one configurable animation engine for every experience. Career facts are authored once and reused by the page and résumé downloads.

## Failure boundaries and styling

Each game has an independent download placeholder and runtime error boundary. An import failure offers a reload; a render/effect failure offers a local remount. Navigation and career content remain usable. Error boundaries do not catch arbitrary event-handler or asynchronous callback errors; expected storage and Web Animation cancellation failures are handled where those operations run.

Intersection observation enhances loading/playback but is not required. Reduced motion, page visibility, and (where appropriate) navigation/offscreen changes interrupt playback. Effects release listeners, observers, and animation frames on cleanup.

The Connection puzzle's feature controller owns progress, visit-local Undo/hints, and reconciliation of validated browser saves. Storage/focus events refresh boards without changing the current selection; reads before writes guard against delayed notifications. The last observed save remains separate from unsaved play so quota failures do not reset the session. This is best-effort synchronization of localStorage snapshots, not an atomic transaction across simultaneous tabs; progress is never shared between hosting origins.

CSS belongs to the relevant feature, with global tokens/base elements and app layout kept separate. Retired dashboard styles are outside the public bundle. Game styles remain eager, while JavaScript stays lazy. Native dynamic imports are used without Vite module preloading: preloading a shared optional dependency caused failed-download recovery to remain broken in WebKit. Browser tests cover both aborted downloads and HTTP 503, plus runtime render/effect failures.

## Runtime and build boundaries

[The browser entry](src/main.tsx) mounts [App](src/app/App.tsx), which composes the career content and optional experiences. The retired dashboard is outside this entry graph; its retained API and CLI use maintained domain models independently of the public page.

[Profile data](src/features/portfolio/data/profile.ts) and [technology data](src/features/portfolio/data/technology-stack.ts) supply both the portfolio and [résumé generator](scripts/build-resume.ts). PDFKit is confined to generation scripts; generated downloads in `public/resume/` enter the static build without adding PDFKit to the browser bundle.

[Vite](vite.config.ts) uses `base: "./"` so relative asset/download URLs work on both GitHub Pages project paths and root hosting. The [Pages workflow](.github/workflows/deploy.yml) and [Sites manifest](.openai/hosting.json) publish `dist/` only; neither deploys the Node API. The `/local-api` proxy exists only in Vite development, not in the built preview or hosted page. Optional API runtime details live in [server/README.md](server/README.md).

The build-only `src/app/prerender.tsx` entry renders App through React DOM's server renderer. `scripts/prerender.ts` is the explicit script-to-app exception enforced by the dependency test. It fills the built HTML root; the browser hydrates it (or uses a new root in development). Browser-only controls use a shared hydration readiness snapshot, and the pre-paint theme bootstrap remains authoritative until hydration. The server renderer never enters the client bundle.

Connection progress uses schema version 2 under the existing storage key, preserving version 1 boards through migration. Attempt rotations are monotonic across Undo, hint assistance is sticky until reset, and best scores are updated by a pure domain function on connection completion. Migrated attempts have unknown rotation history and cannot create a record. Personal records use the same best-effort cross-tab synchronization as boards.

Signal Sculpture's pure domain geometry supplies stable particle identities and deterministic morphing. Its feature-local canvas renderer owns projection and an imperative animation clock; React owns controls and announcements, not per-frame state. Drawing resolution is capped at 2× device pixel ratio and the point count is chosen at mount (720 for small screens, 1,800 otherwise). Resize and theme changes redraw paused artwork. A static SVG replaces unavailable canvas. The shared playback interruption hook cancels motion, while reduced motion also settles the current form without pointer influence. No graphics library or build configuration change is needed.

Gravity Loom uses a separate pure field model: softened attraction, tangential swirl, damping, a speed cap, and reflected safety boundaries. Its fixed 1/60-second steps illustrate kinetic art, not physical orbits. The feature-local renderer caps frame catch-up, keeps at most 90 points per thread, and uses 48 mobile/96 desktop threads with drawing resolution capped at 2×. Live configuration edits preserve particles, velocities, and histories; only Reset rebuilds them. Initial previews retain their final velocities and positions so Play does not jump back to seeds. Held points receive a stronger radial pull, briefly retained after release or a keyboard nudge. Pointer capture owns drag continuation; coordinates update the renderer through a ref and commit to React on release, avoiding control-tree renders on every pointer move. Native movement controls and focused-field arrow keys provide non-drag alternatives. Interruption clears the gesture and capture as well as playback. Reduced motion instead rebuilds deterministic static drawings on input, and SVG covers unavailable canvas. Resize/theme subscriptions and animation frames are released on cleanup. Playback interruption reuses the existing shared hook, not Signal Sculpture's renderer.

The active Loom gesture retains its initial pointer-to-point offset, so grabbing a handle off-center does not reposition it. Cancellation is scoped to that gesture's pointer ID; a secondary pointer cannot cancel the primary grab. Space ignores auto-repeat while arrows retain repeated movement. Position descriptions are shared by the visible fine-control readout and the single atomic status, updating on user commands/releases rather than animation frames.
