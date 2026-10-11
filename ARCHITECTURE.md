# Architecture

The portfolio is a small React application with four optional games. Its architecture separates reasons to change without adding a framework, service container, or inheritance hierarchy.

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
      connection-puzzle/           UI, browser persistence adapter, CSS
      motion-studio/               Playback controller, curves, UI, CSS
      algorithm-garden/            UI and CSS
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
tests/                            Unit, integration, dependency-direction checks
e2e/                              Production Chromium and WebKit journeys
```

## Dependency direction

`main → app → features → shared/domain`. Features may use their own modules, shared utilities, and pure models; the portfolio and playground do not import each other. Shared code cannot import features or app code. Domain modules import only domain modules and compile with ES2022 types, without React, DOM, or Node globals.

The Node API imports the simulation domain. The résumé generator imports verified `features/portfolio/data` without importing presentation components. The archive may use maintained modules, but maintained application/server/scripts code must never depend on the archive. Tests can import either side to retain coverage of historical portable formats and adapters.

`tests/architecture.test.ts` checks static imports, re-exports, and literal lazy imports against those directions. `tsconfig.domain.json` independently prevents browser/server APIs from leaking into pure models. Strict TypeScript also checks tests, browser journeys, and retained reference source.

## Responsibilities and extension points

- **Single responsibility:** models calculate outcomes; game controllers own playback/state; components render controls and feedback. Browser subscriptions live in small shared hooks. Cache Rescue's arena only renders a supplied snapshot.
- **Open/closed:** the typed playground catalog drives both entry cards and lazy mounting. Aliases are configuration passed to the loader. Adding a piece does not require adding feature-specific branches to that loader.
- **Small contracts:** components receive the data/callbacks they use; optional loaders return a React component. Pure models accept plain typed inputs. The puzzle storage adapter accepts a minimal storage interface, so tests can simulate corrupt or unavailable storage.
- **Dependency inversion:** feature policy stays outside browser subscription utilities, and the API/CLI depend on pure models. No abstract base classes or dependency-injection container are needed for this app. Substitutability is relevant at these contracts, not a reason to introduce inheritance.
- **KISS and DRY:** keep each game distinct. Share browser lifecycle and common UI primitives, not one configurable animation engine for every experience. Career facts are authored once and reused by the page and résumé downloads.

## Failure boundaries and styling

Each game has an independent download placeholder and runtime error boundary. An import failure offers a reload; a render/effect failure offers a local remount. Navigation and career content remain usable. Error boundaries do not catch arbitrary event-handler or asynchronous callback errors; expected storage and Web Animation cancellation failures are handled where those operations run.

Intersection observation enhances loading/playback but is not required. Reduced motion, page visibility, and (where appropriate) navigation/offscreen changes interrupt playback. Effects release listeners, observers, and animation frames on cleanup.

CSS belongs to the relevant feature, with global tokens/base elements and app layout kept separate. Retired dashboard styles are outside the public bundle. Game styles remain eager, while JavaScript stays lazy. Native dynamic imports are used without Vite module preloading: preloading a shared optional dependency caused failed-download recovery to remain broken in WebKit. Browser tests cover both aborted downloads and HTTP 503, plus runtime render/effect failures.

## Quality gates

Run `npm run check` for ESLint (TypeScript and core React Hooks rules), read-only Prettier validation, strict app/test/domain type checks, unit/integration tests, résumé generation, and the production build. Run `npm run test:browser` after that build. GitHub Actions requires both before Pages deployment.

`npm run format` explicitly rewrites formatting; `format:check` never changes files. Generated/build/test artifacts are ignored. Archived UI is excluded from lint evolution, but remains type-checked and its behavioral tests run. A human screen-reader audit and verified career outcomes remain separate follow-ups, not claims established by automated checks.
