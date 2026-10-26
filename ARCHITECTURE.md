# Architecture

The portfolio is a small React application with seven optional experiences. Its architecture separates reasons to change without adding a framework, service container, or inheritance hierarchy.

This is the current technical design, not a release checklist or historical case
study. Use [the documentation map](README.md#documentation-map) for document owners
and [README's current priorities](README.md#current-status-and-next-steps) for active work.

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
      jet-engine/                  Speed/thrust controls, depth-tested canvas, SVG base/fallback, CSS
  domain/
    playground/                    Pure cache/puzzle/traversal models
    simulation/                    Maintained systems models used by API and CLI
  shared/
    hooks/                         Browser media queries and playback interruption
    motion/                        Effective device/site motion preference and subscriptions
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

The authoring-only `scripts/build-jet-engine.mjs` has explicit dependency exceptions for Anatomy's `iso-kit.mjs`, `lathe.mjs`, and `audit.mjs`. It records the actual fixed prisms, individual convex casing panels, and turned profiles, solves the global static draw order, and writes a complete fixed-scene SVG per theme plus projection/visibility metadata. Surface marks belong to their hosts. Indexed visibility triangles come from those same recorded surfaces and are delta-encoded in the existing lazy bundle; no skill code enters the app. Diagnostic item names, group ranges, and legacy layer labels live separately in `scripts/fixtures/engine-audit.json`, used only by authoring/tests. Unit and build guards prevent audit metadata leaking back into the runtime payload. Ordinary builds do not run the authoring tool. See [engine model and authoring](#jet-engine-model-and-authoring).

The engine's fixed structural boundary is a cropped wing section, with a contacting pylon and curved saddle rather than a floor stand. Three sectioned shoulder collars seal the core's differing casing diameters, leaving the intentional cutaway open. Subpixel matching-color SVG surface strokes close raster cracks between tangent panels, not physical gaps or depth-order mistakes. Reframing regenerates the one shared projection; browser visibility probes use physical points rather than obsolete screen coordinates.

The shared projection centers the wing/engine and complete reverser sweep, not the asymmetric airflow endpoints, and does not reframe during mode transitions. Opaque composite pixels and geometry bounds verify centering. The Reverse thrust control sits above the drawing so its explanation does not push the mobile Play control too far below the actual viewport-playback target. Both explanation variants share the tallest intrinsic grid height; only the active paragraph owns the described-by ID and is exposed to accessibility tools. Reserved On/Off width prevents a text-wrap/stage-position jump.

[Dependency tests](tests/architecture.test.ts) check static imports, re-exports, literal lazy imports, CommonJS imports, and import types against those directions. Nonliteral module loads are rejected. The [policy](tests/helpers/architecture.ts) explicitly covers app composition and the browser entry as well as lower layers; fixture tests exercise forbidden edges, not just the currently valid source tree. Browser modules may import React, but Node dependencies, PDFKit, skill code, and the server renderer cannot enter their graph. Only `scripts/prerender.ts` may import the build-only prerender entry. The [domain TypeScript configuration](tsconfig.domain.json) independently prevents browser/server APIs from leaking into pure models. The [main TypeScript configuration](tsconfig.json) also checks tests, browser journeys, and retained reference source. Archived UI is excluded from lint evolution, but remains type-checked and its behavioral tests run.

These checks validate explicit source imports under the current relative-import configuration, not arbitrary runtime code execution or third-party transitive dependencies. Introducing aliases or another module-loading mechanism requires updating the checker and its rejection fixtures. [Documentation tests](tests/documentation.test.ts) separately check first-party local Markdown links/anchors, npm script names, and vendored skill metadata/resources; they do not rewrite upstream skills or claim external documentation is current.

## Responsibilities and extension points

- **Single responsibility:** models calculate outcomes; game controllers own playback/state; components render controls and feedback. Browser subscriptions live in small shared hooks. Cache Rescue's arena only renders a supplied snapshot.
- **Open/closed:** the typed playground catalog drives both entry cards and lazy mounting. Aliases are configuration passed to the loader. Adding a piece does not require adding feature-specific branches to that loader.
- **Small contracts:** components receive the data/callbacks they use; optional loaders return a React component. Pure models accept plain typed inputs. The puzzle storage adapter accepts a minimal storage interface, so tests can simulate corrupt or unavailable storage.
- **Dependency inversion:** feature policy stays outside browser subscription utilities, and the API/CLI depend on pure models. No abstract base classes or dependency-injection container are needed for this app. Substitutability is relevant at these contracts, not a reason to introduce inheritance.
- **KISS and DRY:** keep each game distinct. Share browser lifecycle and common UI primitives, not one configurable animation engine for every experience. Career facts are authored once and reused by the page and résumé downloads.

Jet Engine replaces the earlier lock. Its pure model maps a normalized speed setting to deliberately slowed rotation, tracer flow/density, heat, and exhaust reach; these are visual parameters, not operating data. Its imperative 2D canvas uses a cached static depth buffer and per-pixel moving-face depth above the complete SVG base. Every air segment/head and exhaust patch tests the same nearest opaque depth; interpolated depth planes replace the old average-depth sort and unconditional foreground image. Concave blade caps use ear clipping. Settled guide samples are cached but retested against current moving depth. The SVG-only fallback clips faces and line intervals against the same geometry and is computed only when needed. Static audit, pixel/ray probes over a full fan/core pattern period, and browser composite samples cover different boundaries rather than claiming that a fixed-parts audit proves the mixed render.

Metal triangles are scanned once: opaque interiors establish depth immediately,
while partial-coverage edge samples enter a reusable numeric buffer. `finishMetal`
retests only those queued samples against final opaque depth, preserving their
original blend order before outlines and air render. The hot pixel loop dispatches
static depth, metal, and volume work directly rather than invoking a visitor
callback at every covered pixel. `begin`/`finishMetal` clear queue length, so fringes
cannot repeat or bleed between frames; regression tests cover foreground and
occluded fringes in either surface submission order, including epsilon-tied opaque
updates. Edge samples must not be discarded against intermediate depth. No triangle density, tracer
density, antialiasing policy, or resolution cap was reduced for this optimization.

Line rasterization intersects each pixel row with a conservative bounding interval
of the same capsule, rather than scanning its entire diagonal rectangle. Coverage,
depth interpolation, compositing order, widths and alpha are unchanged. A full-image
reference test compares collected samples and moving-depth composition over seeded
horizontal/vertical/diagonal/zero-length/clipped segments at several scales. Settled
air guides already cache static-visible samples and retest moving depth; moving
tracers are not cached or quantized. Exhaust triangles and their fade function cache
only the latest spool setting. Rotor angle and reverser deployment do not change
that core-exhaust shape; palette and raster changes still use current color/depth.

Moving tracers reuse a renderer-owned pool: at most two modes × 22 slots per route
(up to 36 routes). World/projected point and color buffers retain their identities;
each frame recomputes exact curves and restores stream/slot order before the stable
depth sort. No previous-frame positions are reused or quantized. `writeAirPoint`
explicitly writes to a caller-owned tuple; `airPoint` still allocates a fresh result
and preserves the pure API. Projection output buffers avoid temporary XY tuples.
Golden model samples and an allocating reference compare geometry, colors, alpha,
zero speed, partial reversal, palette changes and sort order, while fixed composite
hashes verify the drawing. Scratch storage is bounded by the largest active pose,
not by elapsed frames, and belongs to the renderer's normal disposal lifetime.

Reverse thrust is an independent feature-local mode: the domain owns rigid tangential-hinge outer doors/blocker flaps and continuous forward-directed bypass exit curves. Core routes and nonnegative rotor-speed mappings are unchanged. The fixed SVG/depth mesh excludes the reverser opening; moving stowed panels close it in both canvas and SVG-only views. Running deployment eases in the renderer and crossfades routes after the doors open; paused/reduced-motion mode changes settle immediately without enabling playback or resetting the rotor phase. Guide caches include deployment, and lazy fallback caches are bounded to the two modes. Reset restores forward thrust. Intermediate-pose depth tests, 21-position transformed-prism clearances, real airflow pixel probes, and an acute-tip antialiasing regression cover the new boundary. This is a conceptual cold-stream landing illustration, not certified aircraft geometry or an operating/interlock model. Decorative dots are omitted from static artwork.

Both door sets hinge on the fixed aft rim; circumferential blocker edge clearance prevents intermediate-pose intersections. The authoring sweep uses the kit's fixed-pose sink/support query, with a known-overlap rejection fixture, rather than its equal-offset-skipping flight routine. Nearby fixed geometry is the anchored boundary of the independently audited full scene. Unit checks run the actual sweep; no per-frame audit or skill code enters the browser. Reverser faces cache only the latest settled pose; air-route guide caches remain keyed by deployment, and reverse flow fades in only above 85% opening. Retargeting and retraction keep the current pose and the forward rotor clock.

`REVERSER` is the single source for the opening and moving panels' axial/radial dimensions; the blocker offset and thickness derive from it, rather than repeating independent dimensions in authoring and runtime. `jet-engine/feedback.ts` owns the pure presentation policy for loading, failure, off, motion, fallback, and thrust-selection messages. It stays in the feature, not the domain, so UI wording does not leak into the geometry model; React only displays its result. Small readonly inputs and explicit renderer methods are sufficient contracts—no inheritance or dependency-injection framework is needed.

React owns engine settings and playback, not per-frame updates. The opt-in shared `useViewportPlayback` gates playback on the drawing’s actual intersection, document visibility, renderer availability, and reduced motion. Its separate requested-playback state starts enabled; Pause, Reset, and zero speed disable it until an explicit Play or speed change. Offscreen/hidden interruptions preserve that intent. When intersection changes arrive in a batch, the latest entry owns viewport state. The hook cleans up its observer and listeners and uses geometry checks on scroll/resize without IntersectionObserver. Reduced motion redraws a still at the selected setting. Canvas denial retains depth-clipped SVG blade faces and air routes; missing art stops playback and offers a reload. Pixel ratio remains capped at 1.5 and frame catch-up at 50ms, with observers/listeners/frames released on cleanup. Static SVG sizes and visibility data stay within their existing art/JavaScript budgets. Cache Rescue retains its original request map.

### Jet Engine model and authoring

The centered illustration hangs from a cropped wing and pylon; the longitudinal
cutaway intentionally exposes the internals. Three collars close the core's axial
joints. It has eighteen fan blades, four ten-blade compressor rows, two ten-blade
turbine rows, their hubs, and six stationary guide vanes. Thirty outer reverser
panels and thirty narrower blocker flaps hinge on the aft rim. Clearances, paths,
counts, and colors are illustration choices—not a particular aircraft, operating
procedure, measured speed, mass-flow/bypass ratio, or thermodynamic simulation.
Orange means heated core air, not an afterburner.

The static base is not a standalone complete engine: moving rotors/doors are
composited above it in canvas or the SVG-only fallback. The generator writes
`engine-back-{light,dark}.svg`, `engine-art.json`, and `engine-depth.json`. Screen
positions share the kit's 0.1px rounding; depth uses 0.001 world units. Projection
metadata uses eight decimals to avoid platform-dependent trailing bits. Both theme
SVG sources together have an 80 KiB compressed regression budget; visibility data
counts toward the normal JavaScript budget. Theme changes select one base image.

```sh
npm run build:engine
npm run build:engine -- --check
npm run build:engine -- --audit
```

The unit suite runs the audit and reproducibility check; ordinary `npm run build`
does not regenerate art. The fixed-item audit, 21-position reverser support/sink
sweep, rotating pixel/ray probes, and static line-end checks cover different
boundaries. Review desktop/mobile and 4× junctions in both themes and opening/
closing sequences with confirmed deployment/rotor readouts when changing geometry.

[Anatomy](https://github.com/wheresryan22/anatomy) is vendored unchanged under
`.opencode/skills/anatomy` at revision
`e9488296a44211c42701ff71705b7901470ec78f`, with its included MIT license. The engine
design, pure model, canvas renderer, and portfolio controls are first-party work;
the kit is not. The conceptual reverser follows the
[cold-stream blocker principle](https://patents.google.com/patent/US9447749B2/en)
and [separate fan/core airflow](https://www.grc.nasa.gov/WWW/K-12/airplane/turbfan.html).

## Failure boundaries and styling

React's effective-motion subscription and snapshot use one lazily created browser
source, including the same underlying MediaQueryList. Creating a fresh query per
snapshot can disagree with the subscribed instance during notification and miss a
React update. Lazy creation avoids browser access during prerendering; per-subscriber
cleanup is unchanged. A deterministic cross-instance-lag fixture covers a stuck
Loom Play control, and native rapid-transition tests attach query/root/control
diagnostics for future failures. This contract regression models an event-ordering
hazard; it is not proof of the cause of a particular historical Linux WebKit failure.

`shared/motion/motion-preference.ts` owns the effective motion policy: device reduction OR the site's saved reduction. A small MediaQuery-like source combines device changes, same-document preference events, and validated local-storage events; React's `useReducedMotion`/`useMotionPreference` snapshots and the imperative navigation/reveal observers consume that same source. The HTML motion bootstrap restores the choice before paint, and the root's `data-motion` attribute gates CSS effects. Root attributes retain a visit-local choice if storage is denied. Subscriptions remove their device/window listeners on cleanup. The UI uses a native disclosure and radio group; it cannot enable animation against a device preference. Playback controllers retain their existing manual-pause intent or explicit-replay policy.

The portfolio's `useStackFlow` owns the stack map's nine-step request tour, with one cleaned-up interval rather than React updates per frame. SVG stroke animation moves packets along the same paths used for connections; node activity and the readout come from that step list. `useStackConnections` measures actual card edges with a cleaned-up resize observer, keeping packet travel visible in the gaps after reflow or text zoom instead of hiding most of it behind cards. The readout reserves all labels' intrinsic heights, independently of the selected experience panel. A feature-local intersection observer, document-visibility listener, reduced-motion subscription, and keyboard-focus state gate automatic playback; returning starts a new request so the CSS packet and step clock stay aligned. Motion Studio and Cache Rescue retain explicit replay; Jet Engine, Gravity Loom, and Signal Sculpture opt into viewport autoplay. Selected details use a neutral border and textual marker, active processing uses blue, and infrastructure has a persistent tint/dashed border. Node text and fill switch together; only shadow changes transition, avoiding transient white-on-light labels in either direction. The caption stays in normal flow so larger text can wrap without covering cards. CSS suppresses decorative motion under reduced motion, including before hydration. No network request or new graphics dependency is involved.

Each game has an independent download placeholder and runtime error boundary. An import failure offers a reload; a render/effect failure offers a local remount. Navigation and career content remain usable. Error boundaries do not catch arbitrary event-handler or asynchronous callback errors; expected storage and Web Animation cancellation failures are handled where those operations run.

`ExperienceNavigation` receives neighbors from the same typed catalog that renders the collection. Its native anchors live outside deferred downloads/error boundaries, so wayfinding works during failures and without JavaScript. Visible link text supplies their accessible names without an ARIA override. The chooser's `#collection` target accepts focus without entering the Tab order; query/history handling and direct-entry alignment remain native/existing app responsibilities. No routing dependency or extra catalog is introduced.

Intersection observation enhances loading/playback but is not required. Reduced motion, page visibility, and (where appropriate) navigation/offscreen changes interrupt playback. Effects release listeners, observers, and animation frames on cleanup.

For an uninterrupted, focused direct entry, `DeferredExperiment` observes the containing main element's size and coalesces landing alignment into animation frames. This covers layout changes from neighboring lazy imports and WebKit's deferred focus adjustment. Alignment checks the current hash, focus, and existing input-interruption flag before scrolling; its observer disconnects once that ownership is lost or the effect cleans up. Without resize observation, one deferred alignment still runs. It does not intercept normal scrolling or move focus.

The Connection puzzle's feature controller owns progress, visit-local Undo/hints, and reconciliation of validated browser saves. Storage/focus events refresh boards without changing the current selection; reads before writes guard against delayed notifications. The last observed save remains separate from unsaved play so quota failures do not reset the session. This is best-effort synchronization of localStorage snapshots, not an atomic transaction across simultaneous tabs; progress is never shared between hosting origins.

CSS belongs to the relevant feature, with global tokens/base elements and app layout kept separate. Retired dashboard styles are outside the public bundle. Game styles remain eager, while JavaScript stays lazy. Native dynamic imports are used without Vite module preloading: preloading a shared optional dependency caused failed-download recovery to remain broken in WebKit. Browser tests cover both aborted downloads and HTTP 503, plus runtime render/effect failures.

The stack tour, like viewport autoplay, uses the latest entry in each batch for its
single observed drawing. An earlier visible entry must not retain the interval when
the final entry is offscreen. The lifecycle browser regression injects that ordering
and checks both interval release and resumption. Test-only resource accounting lives
under `e2e/helpers/`, outside the application bundle; its scope and memory-measurement
limitations are documented in [the lifecycle audit](README.md#automated-lifecycle-stability-audit).

## Runtime and build boundaries

[The browser entry](src/main.tsx) hydrates the prerendered [App](src/app/App.tsx), or mounts it into an empty root in development. App composes the career content and optional experiences. The retired dashboard is outside this entry graph; its retained API and CLI use maintained domain models independently of the public page.

[Profile data](src/features/portfolio/data/profile.ts) and [technology data](src/features/portfolio/data/technology-stack.ts) supply both the portfolio and [résumé generator](scripts/build-resume.ts). PDFKit is confined to generation scripts; generated downloads in `public/resume/` enter the static build without adding PDFKit to the browser bundle.

[Vite](vite.config.ts) uses `base: "./"` so relative asset/download URLs work on both GitHub Pages project paths and root hosting. The [Pages workflow](.github/workflows/deploy.yml) and [Sites manifest](.openai/hosting.json) publish `dist/` only; neither deploys the Node API. The `/local-api` proxy exists only in Vite development, not in the built preview or hosted page. See [optional local API](#optional-local-api) for runtime details.

The build-only `src/app/prerender.tsx` entry renders App through React DOM's server renderer. `scripts/prerender.ts` is the explicit script-to-app exception enforced by the dependency test. It fills the built HTML root; the browser hydrates it (or uses a new root in development). Browser-only controls use a shared hydration readiness snapshot, and the pre-paint theme bootstrap remains authoritative until hydration. The server renderer never enters the client bundle.

Production build order is deliberate: strict application/test and isolated-domain type checks → résumé generation → Vite output → prerendered HTML → release manifest → asset budgets. Hashing before prerendering would record the wrong HTML. The manifest fingerprints the built static assets and records the source commit; deployment verification checks those bytes, not the optional Node service. Browser and sequential Lighthouse gates run against the finished build, with deployment integrity checked after publication.

Vite 8 and React plugin 6 are upgraded together because the plugin requires Vite 8. The build uses Rolldown/Oxc and explicitly retains the previous ES2020, Edge 88, Firefox 78, Chrome 87, and Safari 14 transformation targets. These targets control generated syntax, not a claim of full application support on those browsers. Native optional imports, relative asset paths, and all asset/performance budgets remain unchanged.

TypeScript 6.0 is compatible with the installed typescript-eslint 8.72 tooling. The main type-check configuration explicitly includes Node types for scripts and tests because TypeScript 6 no longer includes ambient type packages by default; the isolated domain configuration retains `types: []` and its DOM-free library. Node type definitions remain on the Node 24 major used by CI.

The workflow separates validation (`build`), artifact publication (`deploy`), and post-publication integrity (`verify`). Only publication receives Pages/OIDC write permissions; it runs no dependency installation or repository scripts. The same validated `dist/` artifact is deployed without rebuilding. Main-run concurrency includes verification, preventing a newer workflow deployment from replacing the page while the previous source is being checked. Verification failure marks the workflow failed but does not automatically roll back the already-published site. Operational gates, diagnostics, and GitHub protection settings are documented in [README](README.md#deployment).

The validation job uses a pinned browser container as its execution environment, not as an application deployment target. It supplies browser binaries and OS libraries; the lockfile supplies JavaScript dependencies. Their Playwright versions must agree, enforced by [the release-toolchain check](tests/release-toolchain.test.ts). Browser tests and the sequential performance audit share this environment and the same finished static build.

Connection progress uses schema version 2 under the existing storage key, preserving version 1 boards through migration. Attempt rotations are monotonic across Undo, hint assistance is sticky until reset, and best scores are updated by a pure domain function on connection completion. Migrated attempts have unknown rotation history and cannot create a record. Personal records use the same best-effort cross-tab synchronization as boards.

Signal Sculpture's pure domain geometry supplies stable particle identities and deterministic morphing. Its feature-local canvas renderer owns projection and an imperative animation clock; React owns controls and announcements, not per-frame state. Drawing resolution is capped at 2× device pixel ratio and the point count is chosen at mount (720 for small screens, 1,800 otherwise). Resize and theme changes redraw paused artwork. A static SVG replaces unavailable canvas. The shared `useViewportPlayback` hook starts its clock in view and suspends it offscreen or in hidden tabs without clearing playback intent. Manual Pause and Reset clear that intent; reduced motion also settles the current form without pointer influence. The pure view projection applies bounded yaw/pitch after object rotation, with a small depth-independent pan to keep pointer feedback perceptible at different angles. Time-based exponential easing runs inside the existing frame loop. Pointer exit targets the neutral view; pause freezes the current drawing and clears the target for a smooth return on resume. Reset and reduced motion clear both view and target. No graphics library or build configuration change is needed.

Gravity Loom uses a separate pure field model: softened attraction, tangential swirl, damping, a speed cap, and reflected safety boundaries. Its fixed 1/60-second steps illustrate kinetic art, not physical orbits. The feature-local renderer caps frame catch-up, keeps at most 90 points per thread, and uses 48 mobile/96 desktop threads with drawing resolution capped at 2×. Live configuration edits preserve particles, velocities, and histories; only Reset rebuilds them. Initial previews retain their final velocities and positions so Play does not jump back to seeds. Held points receive a stronger radial pull, briefly retained after release or a keyboard nudge. Pointer capture owns drag continuation; coordinates update the renderer through a ref and commit to React on release, avoiding control-tree renders on every pointer move. Native movement controls and focused-field arrow keys provide non-drag alternatives. Interruption clears the gesture and capture as well as playback. Reduced motion instead rebuilds deterministic static drawings on input, and SVG covers unavailable canvas. Resize/theme subscriptions and animation frames are released on cleanup. Gravity Loom shares `useViewportPlayback` with Jet Engine. Its effect also observes individual visibility/motion signals to release a captured gesture during interruptions even when the reduced-motion drawing is already static. Pause, Reset, Escape, and pointer cancellation clear playback intent; drag/steering or Play enables it. Frame updates stay in the feature renderer.

The active Loom gesture retains its initial pointer-to-point offset, so grabbing a handle off-center does not reposition it. Cancellation is scoped to that gesture's pointer ID; a secondary pointer cannot cancel the primary grab. Space ignores auto-repeat while arrows retain repeated movement. Position descriptions are shared by the visible fine-control readout and the single atomic status, updating on user commands/releases rather than animation frames.

Flow and strength settings affect future Loom simulation steps. In normal motion mode, changing only these settings preserves the canvas pixels until the next frame; it does not repaint identical paused paths. Attractor changes and reduced-motion settings still redraw immediately. This also avoids small rasterization differences on repeated WebKit paints without relaxing pixel-stability checks.

Loom's feature-local `viewport.ts` maps normalized coordinates independently across the rectangle's width and height, with a 24px handle inset (reduced only for very small fields). Canvas painting, pointer conversion/hit testing, and the resized SVG fallback share that mapping. Pointer conversion excludes the stage border. Attractors and particles are bounded to ±1 on each axis, with soft steering near the outer edge rather than a central square, so edge-positioned handles remain useful to the live field. Resizing preserves normalized positions and trajectory history; SVG observes its container only while canvas is unavailable.

## Optional local API

From the repository root, start `npm run api`. In a second terminal:

```sh
curl http://127.0.0.1:3001/health
curl -X POST http://127.0.0.1:3001/v1/simulate \
  -H 'Content-Type: application/json' \
  -d '{"requestsPerSecond":120,"cacheEnabled":true,"database":"normal"}'
```

The [launcher](server/start.ts) binds to loopback on port 3001 (`PORT` overrides it)
and allows five seconds for shutdown on SIGINT/SIGTERM. There is no Redis/database,
authentication, CORS permission, or public service hosting. A public API needs a
separate hosting/security design. [OpenAPI](server/openapi.json) owns the full
machine-readable contract; `GET /openapi.json` serves the same document.

- `GET /health` returns process/model readiness, without probing external services.
- `POST /v1/simulate` requires integer `requestsPerSecond` (1–600), boolean `cacheEnabled`, and `database` (`normal`, `slow`, `offline`). Optional integer fields are `cacheHitPercent` (0–100), `databaseConnections` (1–32), and `writePercent` (0–100); unknown fields fail validation. Success returns `model`, `scenario`, `result`, and an explicit simulation `notice`.
- JSON errors cover malformed input (400), unknown routes (404), wrong methods (405), bodies over 16 KiB (413), unsupported media (415), invalid scenarios (422), and exhausted request budgets (429). Responses are `no-store`; request/header timeouts are five seconds.
- All simulation POSTs, including invalid ones, share 60 requests per fixed 60-second process window. Health/contract reads do not consume it. Headers expose limit/remaining and a whole-second `Retry-After` on rejection; restarting resets this teaching budget, not a distributed limiter.
- Responses get fresh `X-Request-Id` values; incoming IDs are ignored. Completion logs contain only generated ID, UTC timestamp, normalized route, method, status, and duration—not bodies, queries, cookies, headers, or client addresses. Optional logger failures cannot change responses.

Integration tests use ephemeral loopback ports and compare OpenAPI with actual
responses. The retained archived client sends only explicit snapshots, omits
credentials, rejects redirects, bounds replies to 64 KiB, validates model/settings/
results, cancels obsolete work, and distinguishes transport timing from simulated
latency. Its old controls are not mounted in the current app. The development-only
proxy is not a production API connection. Use the HTTP commands above or the
[batch CLI](README.md#batch-experiments) to run the maintained model.

## Retained systems model

The Signal Lab dashboard was retired on October 10, 2026. Its UI, styles, and
browser adapters remain in `archive/signal-lab/` as reference, not another active
application layer. The archive may import maintained models/shared primitives;
active `src/`, `server/`, and `scripts/` must not import it. Tests retain portable
format and adapter coverage; no archived styles enter the public bundle.

The [pure steady-state model](src/domain/simulation/simulation.ts) shares input
validation with the API and CLI. Offered work is conserved: cache hits + served
database work + failed work = offered load. Database capacity is
`connections × 1000 / database latency` while online. Defaults of 120 req/s,
80% read-cache hits, zero writes, and eight 80ms connections give 100 req/s database
capacity and 34.4ms mean modeled response time, including failures where applicable.
This is not p95/p99, a running service, or a performance claim; fractional rates
represent steady-state averages rather than fractional requests.

Separate models keep their own assumptions: TTL hits do not renew expiry;
background refresh retains the version captured when fetching starts. The bounded
queue conserves completed/rejected/waiting work and never resurrects rejections.
The FIFO scheduler prioritizes completions/old queued work at ties and succeeds
exactly at a deadline; retry experiments use bounded budgets, exponential backoff,
and seeded jitter, excluding network latency/capacity. Async search, debounce/
throttle, circuit breaking, rate windows, eviction, and concurrent writes remain
independent illustrations rather than one combined production system.

The [original detailed case study](https://github.com/JhonSmithRomeroSolorzano/portfolio-lab/blob/2421e577b6fe33b49f222d200a4af6683e81aa1c/CASE_STUDY.md)
is preserved at its dated Git revision. These first-party models/examples are
original portfolio work; vendored skills/kits retain upstream licenses and
provenance. No employer code, client data, or private interview material is included.
