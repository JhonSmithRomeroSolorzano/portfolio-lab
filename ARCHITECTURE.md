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
    canvas/                        Coalesced environmental size/theme invalidation
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

The dependency guard recursively discovers `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, and `.cjs` source modules in the maintained roots. A temporary nested-tree regression exercises discovery and forbidden-edge inspection together; adding another source format requires extending both discovery and its fixture. This is dependency-policy coverage, not a claim that every format is compiled or bundled by the application toolchain.

The same AST inspection also feeds an eager dependency-cycle guard over `src`, `server`, and `scripts`. Static runtime imports/re-exports, import-equals declarations, and syntactically module-level literal `require` calls form its edges. Whole-statement type-only declarations and declaration files do not; inline type specifiers still leave a runtime edge under the current `verbatimModuleSyntax` setting. Dynamic `import()` (including awaited imports), function-local requires, and instance-field requires are classified separately and excluded from this eager graph, but remain subject to the layer policy. This is syntactic classification, not execution-order analysis: it does not follow call sites, including immediately invoked functions, or prove that deferred loading is cycle-safe. Module-level conditional requires are conservatively included.

The cycle resolver uses TypeScript's relative bundler resolution against the discovered source map only, without reading packages or executing modules. Declaration files cannot mask runtime JavaScript targets. Non-source assets, external packages, and authoring dependencies outside the maintained roots are graph boundaries; unresolved eager source imports inside those roots fail instead of silently removing an edge. Sorted traversal reports deterministic closed cycle paths, not every possible simple cycle. Fixtures cover self-imports, longer/barrel/CommonJS cycles, all discovered formats, type/deferred exclusions, and acyclic diamonds. Configuration assertions pin the current verbatim, alias-free bundler assumptions: changing module resolution, aliases, or loading mechanisms requires extending the guard and its fixtures. No graph helper enters the application or build output.

## Responsibilities and extension points

- **Single responsibility:** models calculate outcomes; game controllers own playback/state; components render controls and feedback. Browser subscriptions live in small shared hooks. Cache Rescue's arena only renders a supplied snapshot.
- **Open/closed:** the typed playground catalog drives both entry cards and lazy mounting. Aliases are configuration passed to the loader. Adding a piece does not require adding feature-specific branches to that loader.
- **Small contracts:** components receive the data/callbacks they use; optional loaders return a React component. Pure models accept plain typed inputs. The puzzle storage adapter accepts a minimal storage interface, so tests can simulate corrupt or unavailable storage.
- **Dependency inversion:** feature policy stays outside browser subscription utilities, and the API/CLI depend on pure models. No abstract base classes or dependency-injection container are needed for this app. Substitutability is relevant at these contracts, not a reason to introduce inheritance.
- **KISS and DRY:** keep each game distinct. Share browser lifecycle and common UI primitives, not one configurable animation engine for every experience. Career facts are authored once and reused by the page and résumé downloads.

Cache Rescue memoizes its unshared reference-read count by the current authored
challenge settings, independently of the displayed strategy. Playback still derives
live counts from the displayed run and current time on every render. This is a local
allocation optimization, not a global challenge cache or a measured speedup; React
may discard the memo without changing correctness. An in-memory browser fixture
instruments the actual hook's model calls to check reuse during renders, strategy
changes, resets, motion changes and playback, and recalculation on challenge changes.
That test-only instrumentation never enters the application build and does not
promise permanent caching across remounts or React cache eviction.

Cache Rescue rejects noninteger or out-of-range challenge indices at the reset
boundary before changing any state. Challenge selection shares that boundary;
invalid calls preserve prediction feedback and live playback rather than
coercing/clamping an index or reaching the model with missing settings. Browser
fixtures exercise both callers during invalid-prediction feedback and playback,
including nonfinite values and valid first/last challenge changes.

Cache Rescue's playback effect owns one pending animation frame while running.
Pause, reset, challenge/strategy changes, navigation away, effective-motion changes,
completion and unmount release that frame through effect cleanup. Returning to the
experience does not restart it; explicit resume retains the current modeled time,
while replay after completion starts from zero. A clock-controlled actual-hook
fixture counts scheduled, delivered, canceled and pending frames across repeated
transitions and checks unchanged snapshots during stopped periods. It wraps the
clock's frame APIs without invoking canceled callbacks or entering the app build.
These checks cover frame ownership and model consistency, not physical background
behavior, real-device performance or a newly reproduced visitor-facing defect.

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

Triangle scans narrow the padded rectangle to a conservative interval on each
pixel row. Edge crossings only propose bounds: the original signed-distance
equation must reject the last excluded pixel before a bound is accepted. Its
monotonicity across a row then excludes the rest of that side; nonfinite crossings
fall back to the previous interval, and horizontal edges do not impose an X bound.
The inner coverage, nearest-edge depth, top-left fill, fringe order and blend
equations are unchanged. A frozen rectangle-scan reference checks exact static and
moving depth and pixel buffers across seeded/clipped/narrow triangles, all boundary
masks, different scales, both submission orders and actual rotor/reverser faces.

Each raster also owns three projected vertices, one mutable triangle bounds/plane
buffer, and three edge records. Synchronous scans overwrite these fixed-size
buffers instead of allocating them per face. `triangle(vertices, out)` preserves
the original arithmetic and winding; omitting `out` retains the allocating API.
Scratch results must not be retained as mesh faces. Seeded equivalence tests check
bounds/planes, winding, unchanged input, degenerate rejection, and buffer identity;
the existing pixel/ray tests and composite fingerprints cover rendering behavior.

The seven hub meshes are angle/deployment-invariant in this illustration, so their
read-only faces are constructed once. Each `engineFaces` call still builds moving
blades and a fresh sorted draw list, placing cached hubs in the same rotor/source
order before the stable sort. They are still painted and depth-tested every frame;
this is construction reuse, not baked visibility or skipped occlusion. An allocating
mesh reference checks every face, boundary, shade and ordering across poses.

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
Original allocating formulas run on each platform and compare geometry, colors, alpha,
zero speed, partial reversal, palette changes and sort order, while fixed composite
hashes verify the drawing. Scratch storage is bounded by the largest active pose,
not by elapsed frames, and belongs to the renderer's normal disposal lifetime.

Reverse thrust is an independent feature-local mode: the domain owns rigid tangential-hinge outer doors/blocker flaps and continuous forward-directed bypass exit curves. Core routes and nonnegative rotor-speed mappings are unchanged. The fixed SVG/depth mesh excludes the reverser opening; moving stowed panels close it in both canvas and SVG-only views. Running deployment eases in the renderer and crossfades routes after the doors open; paused/reduced-motion mode changes settle immediately without enabling playback or resetting the rotor phase. Guide caches include deployment, and lazy fallback caches are bounded to the two modes. Reset restores forward thrust. Intermediate-pose depth tests, 21-position transformed-prism clearances, real airflow pixel probes, and an acute-tip antialiasing regression cover the new boundary. This is a conceptual cold-stream landing illustration, not certified aircraft geometry or an operating/interlock model. Decorative dots are omitted from static artwork.

Both door sets hinge on the fixed aft rim; circumferential blocker edge clearance prevents intermediate-pose intersections. The authoring sweep uses the kit's fixed-pose sink/support query, with a known-overlap rejection fixture, rather than its equal-offset-skipping flight routine. Nearby fixed geometry is the anchored boundary of the independently audited full scene. Unit checks run the actual sweep; no per-frame audit or skill code enters the browser. Reverser faces cache only the latest settled pose; air-route guide caches remain keyed by deployment, and reverse flow fades in only above 85% opening. Retargeting and retraction keep the current pose and the forward rotor clock.

`REVERSER` is the single source for the opening and moving panels' axial/radial dimensions; the blocker offset and thickness derive from it, rather than repeating independent dimensions in authoring and runtime. `jet-engine/feedback.ts` owns the pure presentation policy for loading, failure, off, motion, fallback, and thrust-selection messages. It stays in the feature, not the domain, so UI wording does not leak into the geometry model; React only displays its result. Small readonly inputs and explicit renderer methods are sufficient contracts—no inheritance or dependency-injection framework is needed.

Engine artwork recovery follows the currently selected theme image. A successful
load clears an earlier artwork failure only after verifying completion, nonzero
natural size, and the current source URL. Switching back to a valid palette can
therefore restore the drawing without reloading the page. It preserves speed,
thrust, manual pause, reduced motion, and the canvas-free SVG fallback; loading
an image does not itself request playback.

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

Theme synchronization accepts only matching-key or clear events from local storage; session-storage events from same-origin frames and events without a matching storage area cannot change the visit's appearance. If accessing local storage is denied, the listener leaves the current choice intact. Native browser regressions cover iframe session-storage set/remove/clear isolation, legitimate cross-tab local-storage set/remove/clear synchronization, and keyboard toggling in both themes at desktop/mobile widths. The control's existing system preference, hydration, and visit-local fallback behavior are unchanged.

In forced-color mode, pressed-button and current-navigation controls map their
shared selected fill/text tokens to the system `Highlight`/`HighlightText` pair.
Scoping the tokens to selected lab buttons and current links leaves artwork colors
and ordinary Matrix themes unchanged. Those controls alone opt out of automatic
forced-color adjustment, since its Canvas text backplate can obscure HighlightText;
their explicit fill, text and focus outline still use the visitor's system colors.
Other content retains native adjustment, and focus stays independent of selection.
Browser checks exercise keyboard selection and nested
labels across the six labs with pressed controls, plus current-link navigation.
Chromium provides forced-palette painting coverage; WebKit checks the active media
rule and resolved system colors, not a Windows High Contrast environment. Human
high-contrast and screen-reader validation remain separate.

The generic `useMediaQuery` hook keeps one lazily created MediaQueryList in a memoized source for the current hook/query. Subscription and snapshot reads use that same object; query changes replace the source, and React releases the old listener on replacement or unmount. There is no global query cache or cross-component subscription registry. Store creation does not access the browser, and the unchanged false server/hydration snapshot keeps prerendering safe. A Node server-render test rejects browser-global access. A browser-only fixture bundles the actual hook and installed React in memory, outside `dist`, to test controlled cross-instance lag, rerenders, query changes, cleanup, and hydration; native production-page tests separately exercise system appearance changes and persisted keyboard choices. The controlled lag is an external-store contract fixture, not proof of a native-browser failure.

React's effective-motion subscription and snapshot use one lazily created browser
source, including the same underlying MediaQueryList. Creating a fresh query per
snapshot can disagree with the subscribed instance during notification and miss a
React update. Lazy creation avoids browser access during prerendering; per-subscriber
cleanup is unchanged. A deterministic cross-instance-lag fixture covers a stuck
Loom Play control, and native rapid-transition tests attach query/root/control
diagnostics for future failures. This contract regression models an event-ordering
hazard; it is not proof of the cause of a particular historical Linux WebKit failure.

`shared/motion/motion-preference.ts` owns the effective motion policy: device reduction OR the site's saved reduction. A small MediaQuery-like source combines device changes, same-document preference events, and validated local-storage events; React's `useReducedMotion`/`useMotionPreference` snapshots and the imperative navigation/reveal observers consume that same source. The HTML motion bootstrap restores the choice before paint, and the root's `data-motion` attribute gates CSS effects. Root attributes retain a visit-local choice if storage is denied. Subscriptions remove their device/window listeners on cleanup. The UI uses a native disclosure and radio group; it cannot enable animation against a device preference. Playback controllers retain their existing manual-pause intent or explicit-replay policy.

The portfolio's `useStackFlow` owns the stack map's nine-step request tour, with one cleaned-up interval rather than React updates per frame. SVG stroke animation moves packets along the same paths used for connections; node activity and the readout come from that step list. `useStackConnections` measures actual card edges with a cleaned-up resize observer, keeping packet travel visible in the gaps after reflow or text zoom instead of hiding most of it behind cards. Without ResizeObserver, a cleaned-up window resize listener remeasures those same edges after viewport reflow; it does not poll or substitute for element-size observation during unrelated layout changes. The readout reserves all labels' intrinsic heights, independently of the selected experience panel. A feature-local intersection observer, document-visibility listener, reduced-motion subscription, and keyboard-focus state gate automatic playback; returning starts a new request so the CSS packet and step clock stay aligned. Keyboard and pointer input update that focus gate even when the same node retains focus, so switching input methods neither leaves the tour running during keyboard exploration nor permanently pauses pointer use. Native key actions are not cancelled. Motion Studio and Cache Rescue retain explicit replay; Jet Engine, Gravity Loom, and Signal Sculpture opt into viewport autoplay. Selected details use a neutral border and textual marker, active processing uses green, and infrastructure has a persistent tint/dashed border. Node text and fill switch together; only shadow changes transition, avoiding transient low-contrast labels in either direction. The caption stays in normal flow so larger text can wrap without covering cards. CSS suppresses decorative motion under reduced motion, including before hydration. No network request or new graphics dependency is involved.

Each game has an independent download placeholder and runtime error boundary. An import failure offers a reload; a render/effect failure offers a local remount. Navigation and career content remain usable. Error boundaries do not catch arbitrary event-handler or asynchronous callback errors; expected storage and Web Animation cancellation failures are handled where those operations run.

The deferred loader releases its five landing-input subscriptions together after the first interruption, on a rejected download, or on unmount; a successful uninterrupted landing keeps them until interaction so late-layout alignment can still be relinquished. Its pending-promise guard prevents late content mounting after unmount. Browser-only in-memory fixtures exercise the actual loader/boundary and installed React, without entering `dist`: controlled downloads check listener ownership and late resolution; repeated render/effect failures check cleanup of established listeners, observer targets, intervals, and frames before local remount. These checks verify cleanup returned by successfully established effects, not exception safety inside partially completed setup or arbitrary asynchronous callbacks. Native delayed-download journeys separately verify unchanged focus, scroll, and query strings after navigation away at desktop/mobile widths in both themes. Download failure still offers a page reload; no cache-busting import retry, router, or new loading framework is introduced.

Motion settings closes on outside pointer input even when that target cannot
receive focus. Its document listener is released on unmount; pointer dismissal
leaves focus to the native action. Focus departure and Escape remain separate
paths, with Escape returning focus to the summary. Internal radio clicks never
count as outside input, including WebKit's non-focusing pointer behavior.

Motion Studio owns both Web Animations as one run. Missing support, a synchronous
creation/start failure, or rejection of the active run releases every created
animation and shows explicitly labelled static end states. Partial setup observes
cancellation rejections before cleanup. Replay, tuning, interruption, and unmount
invalidate the run first, so a stale completion/rejection cannot replace newer
feedback. A fresh explicit Play retries the API; no failure loop or extra clock is
introduced. Controlled browser failures cover either lane failing, unexpected
cancellation, successful recovery, and an older cancelled run settling after replay.

Motion Studio validates curve indices and supported duration values before
interrupting animation. Curve indices must be integers within the authored list;
duration uses the same 600–1800ms bounds and 100ms step as the range control,
defined once alongside the curves. Refused actions preserve playback handles and
completion feedback; reselecting the current setting remains a no-op. An in-memory
actual-hook fixture pauses real native animations, awaits their ready promises and
finishes them explicitly to check cancellation/completion without short-clock
races. It also covers reduced motion, unmount cleanup and all valid slider steps;
the fixture does not enter the application build.

Native completion belongs to the current pair of lane animations, checked by
array identity before updating feedback or releasing handles. Canceling pending
animations rejects their completion promises, but canceling already-finished
animations cannot revoke a queued fulfillment callback. Replay or setting changes
must therefore invalidate ownership as well as cancel handles. Browser regressions
finish and supersede within one task, before queued callbacks can run, and check
that replay remains active or changed settings remain ready; only the replacement
run may report completion. Pending-cancellation cases cover the rejection path
separately. These checks preserve the existing guard rather than establish a new
visitor-facing defect.

Motion Studio keeps its native recipe disclosure mounted while curve and duration
change. Only the copy controls are keyed to the generated CSS, so feedback resets
for each recipe and an outstanding clipboard request cannot update the replacement
controls or move focus to them. Clipboard denial selects the current CSS for manual
copying only while the copy button still owns focus; a delayed denial after
navigation preserves the destination's focus and scroll position. The fallback
message remains usable without implying the CSS was selected. Browser checks cover
live tuning, keyboard copying, late success/failure, and navigation away at desktop
and mobile widths.

Contact and recipe copy buttons retain keyboard focus while a clipboard request is
pending. They expose `aria-disabled` and refuse repeat activation in the click
handler instead of natively disabling a focused button, which sends focus to the
document body before an asynchronous permission result. Contact still uses native
`disabled` before hydration. Success retains focus; denial selects the manual-copy
field only if its button still owns focus. Moving to another task or replacing the
recipe keeps the existing focus-protection policy. Browser regressions hold the
clipboard promise open, check repeated activation, and verify success/denial at
mobile and desktop widths; no polling, clipboard timeout, or new shared state is
introduced.

Clipboard keyboard journeys assert that the control is enabled before sending
Enter: Playwright's `press()` does not perform an enabled-state check, and the
prerendered Contact button already has its final label while still disabled.
Held-entry browser cases exercise that startup state and verify successful native
keyboard activation after hydration at desktop/mobile widths. Pending-copy,
focus, viewport, duplicate-request and denial assertions keep their existing
deadlines and retry policy.

Lab feedback uses the existing status/alert regions rather than a separate announcer. Motion Studio updates its atomic status with a static-completion message after a reduced-motion run; choosing another curve restores its ready explanation without moving focus. Cache Rescue's playback controller reports whether a launch was accepted. It checks the number input's native `badInput` state as well as the stored numeric value, so unfinished edits such as `-` or `1e` cannot masquerade as an omitted prediction. Native input events clear correction feedback even when deleting an unfinished edit leaves the exposed value unchanged. Reset, challenge changes, and strategy changes clear the native edit buffer alongside React state; a genuinely empty prediction remains optional. A refused prediction opens the native disclosure and focuses/centers its input after the error text commits, so scrolling uses the updated geometry; native focus alone can leave a partially visible field clipped. That correction scroll is immediate and action-scoped, without timers or a global scroll-policy change. Repeated identical errors reopen/focus from the action handler because they may not trigger another commit. The input description combines existing help with the current inline error. Correcting the value clears that association, and successful playback does not redirect focus. Next-challenge activation focuses the launch control with native scrolling enabled, rather than leaving keyboard focus offscreen. Keyboard/browser checks cover computed names/descriptions, status updates, invalid/disabled/pressed states, correction, resets, and next-step focus/viewport visibility in both themes at desktop/mobile widths. These checks and automated accessibility scans do not establish actual spoken announcements or replace the outstanding human screen-reader review.

`ExperienceNavigation` provides one native collection-return link per lab rather than Previous/Next cards: all experiences remain visible in the same document. The link lives outside deferred downloads/error boundaries, so wayfinding works during failures and without JavaScript. Visible link text supplies its accessible name without an ARIA override. The chooser's `#collection` target accepts focus without entering the Tab order; query/history handling and direct-entry alignment remain native/existing app responsibilities. No routing dependency or extra catalog is introduced.

Algorithm Garden describes each node's parent and left-to-right children through
`aria-describedby`, derived from the same authored tree as the drawing and traversal
model. Referenced hidden text exposes the connections without adding visual labels
or duplicate reading stops. Node names, visit order, focus and native button
activation remain unchanged; this is a group of game buttons, not an ARIA tree
widget. Browser checks cover descriptions across all three shapes, both traversal
modes, visited nodes and reset, without claiming human screen-reader validation.

Native lab sliders retain their numeric model values and keyboard behavior while
`aria-valuetext` supplies the visible units: seconds for Motion Studio, percentages
for engine speed and Loom strength. Duration keeps a stable control name; visual
value labels are hidden from accessibility tools where the slider already supplies
that value. Browser checks cover keyboard bounds/steps, presets, reset and recipe
agreement. They check exposed semantics, not actual screen-reader speech.

Intersection observation enhances loading/playback but is not required. Collection anchors (`#lab`, `#collection`, and legacy `#signal-lab`) do not request an individual experience: Jet Engine loads when its placeholder approaches within the existing 300px viewport margin, on explicit load, or through `#jet-engine`/legacy `#pin-lock` entry. Without IntersectionObserver, the existing eager fallback keeps every experience usable. Reduced motion, page visibility, and (where appropriate) navigation/offscreen changes interrupt playback. Effects release listeners, observers, and animation frames on cleanup.

`usePlaybackInterruption` observes one target for Cache Rescue and Motion Studio.
Like `useViewportPlayback`, it uses the final entry in a delivered intersection
batch: an earlier offscreen transition must not stop a now-visible experience.
An empty batch does nothing; a final offscreen entry still stops once, and re-entry
does not restart these explicit-playback experiences. An in-memory actual-hook
fixture checks both batch orders without relying on scroll timing or feature clocks.
When IntersectionObserver is unavailable, the hook checks the target's viewport
bounds on setup, passive window scroll, and resize. This fallback only stops
playback; returning onscreen still requires explicit replay. Both listeners are
removed on cleanup, and no fallback listeners are installed without a target or
alongside an available observer. Browser fixtures exercise real scroll/resize
exits, explicit replay, and listener restoration after unmount.

Playback observers use thresholds `[0, Number.EPSILON]` and require a positive
intersection ratio. The [Intersection Observer contract](https://www.w3.org/TR/intersection-observer/#dom-intersectionobserverentry-isintersecting)
allows `isIntersecting` to remain true when rectangles only touch at an edge;
a zero-only threshold does not report the transition between that contact and
visible area. The near-zero positive threshold covers that boundary for automatic
canvas playback, the stack-map flow, and explicit-playback interruption, without
waiting for a percentage of a large drawing. Native Chromium/WebKit hook fixtures
exercise initial edge contact, one-pixel entry, exit through a one-pixel sliver,
and re-entry. Automatic playback resumes; explicit playback stays stopped until
replayed. Existing batch ordering, hidden-tab, reduced-motion, manual-pause and
fallback-listener policies remain unchanged; no scroll polling is added.

The three canvas experiences share `shared/canvas/observe-canvas.ts` for environmental
invalidation only. ResizeObserver, window resize, and theme notifications coalesce
into one frame; unchanged logical size, capped pixel ratio, and theme do not clear
or redraw paused pixels. Initialization stays synchronous, real changes preserve
the existing 2× Loom/Sculpture and 1.5× Engine resolution caps, and disposal cancels pending invalidation as well
as observers/listeners. Explicit controls and animation clocks are not debounced.
Engine still owns palette/guide invalidation and creates a new raster only when
backing dimensions change; artwork-loading policy remains in its feature.

Canvas observation setup also owns cleanup before it can return a disposer. If
subscription, initial measurement, or the synchronous first redraw throws, it
disconnects established observers, removes its resize listener, cancels queued
invalidation, and rethrows the original error to the caller. Late deliveries cannot
restart a failed observer. Controlled setup-failure tests cover those boundaries;
a browser fixture exercises repeated first-paint failures and recovery through the
actual Sculpture component and experiment boundary, with and without ResizeObserver.
This does not catch later asynchronous drawing errors or establish exception safety
for resources allocated separately by a renderer.

Without ResizeObserver, the same mutation observer also watches the drawing
target's `hidden` attribute. Sculpture and Loom initially hide their canvas or
host until allocation succeeds; revealing it must remeasure the visible bounds
instead of leaving the initial 1×1 buffer until a window resize. This fallback
uses the existing coalesced frame and cleanup, with no polling or subtree-wide
observation. The ResizeObserver-backed path is unchanged. Browser regressions
disable ResizeObserver before startup and require correctly sized, nonempty
drawings at mobile/desktop widths in reduced/full motion, without a synthetic
resize or theme change to repair initialization.

Signal Sculpture's pixel tests wait for a visible canvas with backing dimensions
matching its current logical size and capped device-pixel ratio before taking a
baseline. React's playback attribute alone does not establish resize readiness:
the initially hidden canvas can still have a 1×1 backing store. A browser-only
regression holds its initial ResizeObserver delivery to verify that readiness
waits, then releases it. Hidden-document checks retain exact frozen-pixel equality;
they model visibility events, not physical-device app switching.

Gravity Loom retains its simulation and a stable, empty React-owned drawing host
across environmental changes. Its feature-local `paint-surface.ts` owns the visible
canvas children of that host, renewing the context only when the atomically cached
thread colors/opacity mode change. Canvas attributes persist, but pixels/context
state are not copied. The new child is connected before drawing so WebKit resolves
numeric label fonts; the previous child is removed and its backing dimensions zeroed
after that synchronous paint. One canvas is retained, with transient overlap only at
palette boundaries. Animation draws directly, without a second raster or image copy.
`observeCanvasEnvironment` observes the stable host and coalesces the same size/theme/
DPR notifications used by `observeCanvas`; stage focus and pointer capture stay on
React-owned nodes. Explicit model/control revisions skip unchanged paints without
command hashing or per-frame canvas creation. Allocation denial stops playback,
releases observation/storage, and enables the existing SVG fallback. Trail bounds,
particle counts, resolution caps, and playback intent are unchanged.

Loom's canvas path projects X/Y as scalars and traverses its dense renderer-owned
trails with indexed loops, avoiding a temporary point for each path vertex and
per-trail tracing callbacks. One reusable tracer writes the path. The normal
point-returning projection remains a fresh object for UI/pointer callers; both use
the same coordinate formulas. No paths are batched or simplified, and both strokes,
heads, attractor markers, simulation steps and trail histories keep their existing
order and values. Seeded scalar/point equivalence checks and an independent
allocating draw-command reference cover
static/live geometry, palette changes and held-point Weave movement.

The canvas-invalidation browser test retains exact pixel equality after restoring
the original viewport and theme; it has no image-difference tolerance. A failed
restoration attaches the original and restored canvas PNGs plus backing/logical
dimensions, last paint size, transform, pixel ratio, theme, and motion state to the
existing CI report. These are test-only diagnostics, not an application readiness
API or a claimed fix for intermittent WebKit raster differences. Diagnostic
capture failures cannot replace the original assertion failure.

For an uninterrupted, focused direct entry, `DeferredExperiment` observes the containing main element's size and coalesces landing alignment into animation frames. This covers layout changes from neighboring lazy imports and WebKit's deferred focus adjustment. Alignment checks the current hash, focus, and existing input-interruption flag before scrolling; its observer disconnects once that ownership is lost or the effect cleans up. Pointer movement, like wheel, touch, pointer press, and keyboard input, releases landing ownership: hovering a mounted control must not let a late neighboring import scroll it out from under the pointer while its section still has anchor focus. The same passive listener lifecycle handles every interruption. Controlled late-download browser coverage checks hover colors and unchanged scroll position across the resize/alignment boundary, alongside uninterrupted heading preservation. Without resize observation, one deferred alignment still runs. It does not intercept normal scrolling or move focus.

The Connection puzzle leaves Alt/Ctrl/Meta-modified navigation keys to the browser instead of consuming them as board movement. Unmodified arrows and Home/End retain the roving tab stop, and native Space/Enter activation still rotates a tile. Browser checks verify unconsumed modifier events and ordinary tile navigation; they do not emulate operating-system shortcuts.

The Connection puzzle's feature-local `route-transitions.ts` owns pure visit transitions: moves, per-puzzle bounded Undo, hints, completion records, save-result feedback, and reconciliation of validated snapshots. Its inputs are plain state/actions and storage results; it imports neither React nor browser runtime APIs. `useRouteProgress` is the browser shell: it loads/writes saves, subscribes to storage/focus events, and supplies those inputs to the transition layer. Storage/focus events refresh boards without changing the current selection; reads before writes guard against delayed notifications. The last observed save remains separate from unsaved play so quota failures do not reset the session. Transition tests use frozen inputs to check action sequences and reconciliation without a browser; existing browser tests retain coverage of actual storage, focus, and delayed notifications. The stored version and serialization are unchanged. This is best-effort synchronization of localStorage snapshots, not an atomic transaction across simultaneous tabs; progress is never shared between hosting origins.

Listener ownership and progress consistency use separate effects. Storage/focus
subscriptions depend only on the stable refresh callback, so accepted puzzle
actions do not renew them. A separate effect still refreshes on mount and progress
changes, after subscriptions are installed; pre-action reads and storage/focus
refreshes retain their existing policy. An in-memory actual-hook browser fixture
counts listener additions/removals through moves, hints, Undo, selection, reset,
unmount and remount, and checks denied/corrupt reads, quota recovery and cross-tab
conflicts. This is lifecycle cleanup, not a measured performance improvement.

Puzzle state contracts are read-only at every exposed level: progress/loaded snapshots, board tiles and metadata, completion records, visit hints/notices, and both Undo-history array levels. Transition actions are also read-only; updates use replacement objects/arrays and may share unchanged snapshots. Parsing keeps local construction arrays mutable but exposes only the read-only result. [Compile-only contracts](tests/route-snapshots.types.ts), included in the normal strict type check, reject direct and nested writes and verify that caller-owned readonly inputs remain accepted; unused `@ts-expect-error` directives fail if protection is weakened. These types prevent accidental writes through typed consumers, not mutation through casts, JavaScript, or pre-existing mutable aliases. There is no production deep-freezing, new state framework, or save-format change; frozen-input runtime tests remain a separate purity check.

`routeTransition` also checks numeric action boundaries at runtime: selection requires an integer within the authored puzzle catalog, and a turn requires an integer within the selected board's tiles. Rejected indices return `null` before creating a new visit or changing history, hints, counters, or records; the browser shell already treats that result as a no-op without persistence IO. The transition still requires a validated visit and a typed action, not arbitrary untrusted JSON. Save parsing remains the state-validation boundary. Frozen-state tests cover non-finite, fractional, negative, and out-of-range indices for every puzzle, as well as all valid selection/tile indices.

Persistence reads never repair malformed/unsupported saves or retry refused writes automatically. Explicit play may replace an unreadable save; a denied read or quota failure keeps the visit playable. When reads recover with unchanged checkpoint content, stale read warnings clear only if the current local boards and records also match that content; unsaved differences keep their warning and Undo state until explicit saving or reconciliation with an external update. Selection remains visit-local during refresh. Browser tests cover initial corrupt saves, read recovery without writes, quota recovery/reload, and delayed conflicts after unsaved work; adapter tests separately retain rejected bytes and model the two-read/two-write race. Read-before-write detection catches already-visible external changes, not truly simultaneous writes: localStorage snapshots remain last-writer-wins with no automatic merge or atomic compare-and-swap.

CSS belongs to the relevant feature, with global tokens/base elements and app layout kept separate. The Matrix palette, translucent reading surfaces, and paired processing fill/text colors live in shared tokens. App owns `MatrixBackdrop` and its imperative canvas renderer: cached half-width glyphs change in place while independently phased bright fronts travel downward with fading tails. There is no corridor, human geometry, graphics library, or per-frame React work. The pure rain model owns deterministic lighting and boundary envelopes. Geometry is measured from the actual header, introduction, stack map, experience, contact, and collection; scroll/size changes coalesce into a frame, moderating interior brightness without erasing the rain, with narrow luminous edges. Column parameters, glyph identities/rates, and mask arrays are cached; drawing uses an atlas rather than per-frame text rasterization. The grid is capped at 160×110 cells, backing pixel ratio at 1.25, and draw cadence at 20Hz (not a promised device frame rate). The shared canvas observer handles resize/theme invalidation. Playback starts automatically after hydration; readiness, the effective reduced-motion source, and document visibility gate it. There is no manual rain-pause state or separate playback button; the existing site motion settings remain available. Cleanup releases every observer, listener and frame. Static SVG remains before hydration, without JavaScript, or when canvas is unavailable. The viewport-sized layer is fixed behind the entire page, ignores pointer input, and is hidden from assistive technology. The navigation is a horizontal dock, sticky on desktop and on mobile after hydration; scroll padding accounts for the dock. See [presentation](README.md#résumé-and-presentation) for the visual direction. Retired dashboard styles are outside the public bundle. Game styles remain eager, while JavaScript stays lazy. Native dynamic imports are used without Vite module preloading: preloading a shared optional dependency caused failed-download recovery to remain broken in WebKit. Browser tests cover both aborted downloads and HTTP 503, plus runtime render/effect failures.

Reading-region envelopes retain a nonzero 0.20–0.24 interior lighting weight; overlapping regions use the minimum weight rather than multiplying away the field. The exterior weight and luminous-edge falloff are unchanged. This adjusts the existing measured mask, not reading-surface opacity, glyph density, palette, animation cadence, or the name's separate reinforced illumination pass. The no-JavaScript/canvas-free static SVG is unchanged. Unit tests bound the interior reduction and preserve exterior/overlap behavior; browser tests verify that glyphs still change behind the summary while shared 70% surfaces and the completed name remain intact.

At mobile widths, the hydrated dock is sticky with a 12px top inset and a matching 100px document scroll-padding allowance. The menu is an opaque absolutely positioned dropdown, capped to the small viewport height minus 100px (with a `vh` fallback), with internal scrolling and contained overscroll. Opening it does not resize the header or shift content; focus uses `preventScroll`, and reopening resets only the menu's internal scroll. The existing dismissal/listener lifecycle is unchanged. Unhydrated, no-JavaScript, and failed-startup links stay in normal document flow. No new scroll listener, React state, or second navigation is added. Browser tests cover deep-page reachability, unchanged reading position on open/dismiss, unobscured keyboard destinations, and dropdown scrolling at 200% text and short landscape sizes in both themes.

Wayfinding failures attach before/after viewport and document-space content
coordinates, document height, font status and focus state. Deterministic
scroll-only/content-only probes check those diagnostics and the original strict
tolerance. These snapshots distinguish coordinate changes, not the browser's
internal cause; no native-focus instrumentation or settling delay hides a jump.

Keyboard-visible focus anywhere in the dock—not just its destination links—switches document scrolling to immediate mode. This includes Menu, appearance, and motion controls, so focusing a sticky control cannot leave a smooth focus-scroll competing with the next native anchor navigation. Pointer journeys retain smooth scrolling unless reduced motion is enabled. Browser regressions check the resolved scroll policy for each dock control before navigating from a live lab to Experience.

At mobile widths, focus in the hydrated dock's pinned control row temporarily
removes the document's top scroll-padding allowance. Those controls are already
visible above the 100px destination inset; applying it to native Tab focus can
scroll the reading surface unnecessarily. Dropdown links and section destinations
retain the 100px allowance, restored as soon as focus leaves the control row.
No scroll restoration, key interception or timers are used. Browser regressions
cross deferred focus adjustment before comparing unchanged scroll/content
coordinates, verify all row controls remain unobscured at phone/landscape widths
and 100%/200% text in both themes, and check subsequent section landing clearance.

Main-navigation activation hands focus to the destination with `preventScroll`
before the browser's anchor default action, for desktop as well as the open
mobile menu. Pointer activation marks that focused section until blur: WebKit
can match `:focus-visible` even for this programmatic pointer handoff, so the
section's keyboard-only immediate-scroll selector excludes that marker. Keyboard
activation clears the marker, and blur removes it through a deduplicated one-shot
listener. The focusable legacy `#about` descendant participates in the same
keyboard-visible immediate-scroll policy as section destinations, including when
Back restores its focus before another keyboard journey. Reduced motion still
overrides smooth scrolling. Native anchors retain
scrolling, query strings, and history; no click cancellation, scripted scroll,
arrival timer, or browser-specific routing branch is added. Browser tests inspect
focus and scroll policy before the native default action, actual collection
arrival, marker cleanup, keyboard focus rings, and Back navigation.

Section entrances fade from 35% opacity without translating content. Their 560ms
duration, bounded stagger, easing, focus cancellation, and reduced-motion policy
are unchanged. Keeping their geometry still avoids the interrupted native smooth
journeys reproduced with translated entrances in Linux WebKit. Unit coverage
asserts the exact keyframes and timing; browser journeys exercise actual arrival,
history, and keyboard follow-up without animation overrides or in-flight logging.

Decorative arrival pulses and section entrances handle animation-construction
failures at their own boundary. A rejected pulse cannot abort active-section,
reading-progress, or timeline updates, and a rejected entrance cannot discard
other entries in the observer batch. Content retains its normal CSS, failed
entrances are not retried, and later supported animations still work. Controlled
failure tests cover these recovery paths separately from ordinary navigation
journeys; keyframes, focus/scroll policy, and reduced-motion behavior are unchanged.

Failed navigation tests attach final geometry, focus, URL hash, and scroll policy
only after the original assertion fails. A missing/closed page or unavailable
snapshot must not replace that original failure. Diagnostic probes that wrapped
browser methods or measured during travel affected reproduction; their experiments
remain in Git history rather than the maintained regression suite. Viewport
assertions, deadlines, and retries are unchanged.

The stack tour, like viewport autoplay, uses the latest entry in each batch for its
single observed drawing. An earlier visible entry must not retain the interval when
the final entry is offscreen. The lifecycle browser regression injects that ordering
and checks both interval release and resumption. Test-only resource accounting lives
under `e2e/helpers/`, outside the application bundle; its scope and memory-measurement
limitations are documented in [the lifecycle audit](README.md#automated-lifecycle-stability-audit).

### Collection previews

The rain renderer retains each cell's last quantized light and glyph identity. A tick clears/repaints only changed cells; resize/theme invalidation clears the canvas and cell cache, while layout-mask changes naturally invalidate affected cells. This preserves the same density, highlights, per-cell mutation rates, and 20Hz draw cap without repeatedly copying every faint glyph. A browser draw-call budget checks steady-frame reuse in addition to playback/fallback behavior.

Engine control easing uses elapsed wall time with a 250ms safety cap, so spool/reverser convergence no longer discards all elapsed time beyond 50ms on slow frames. Reverser movement also caps each rendered change at 0.24 to avoid abrupt retargeting jumps. Rotation and airflow travel retain the smaller 50ms visual catch-up cap, and pause/resume clears the frame timestamp. Unit tests compare 10–60fps easing (allowing the reverser step guard's small convergence difference) and bound long interruptions; browser thresholds remain unchanged.

The pre-paint bootstrap marks navigation startup as pending. At mobile widths, CSS hides the closed, not-yet-hydrated menu as well as the hydrated closed menu, preventing a large content shift. A capture-phase error handler clears the startup marker if a module download fails or an uncaught script exception occurs before window load, restoring native links. It first checks the header's hydration readiness so unrelated errors cannot reopen a healthy menu; the handler is removed at window load. Without JavaScript the marker is never set. Browser tests hold the entry request to compare content positions across hydration and cover blocked entry, throwing entry, and no-JavaScript fallbacks. Unit tests execute the actual bootstrap to check error classification, healthy-menu isolation, and listener cleanup.

Selected lab controls use the shared accent fill and paired foreground, including Engine presets/reverse/playback. Artwork palettes are independent of that control convention: Gravity Loom owns theme-specific amber/blue/teal thread tokens in its feature CSS and caches their resolved values during canvas invalidation. Marker-pixel tests resolve the marker token instead of assuming the UI accent is also the artwork color.

The catalog owns each card's engineering descriptor; the original playful copy and stable lazy loader remain separate. `PlaygroundSection` uses decorative, dimensioned, lazy `<img>` elements from `public/lab-previews/`, not mounted lab components. Cards therefore work before hydration and without JavaScript, and do not start extra renderers. The optional `scripts/build-lab-previews.ts` captures the actual seven stages from an explicitly started loopback production preview in reduced motion and dark theme, with padding derived from the shared paper token. It resizes them to 480×300 WebP stills; ordinary builds consume the checked-in assets without launching a browser. Capture output can vary with browser/platform, so regeneration requires visual review rather than a claim of byte-identical reproduction. Authoring and unit checks cap each image at 20 KiB and the group at 120 KiB. Release manifests include WebP hashes. See [the product workflow](README.md#labs--play).

Lab CSS consumes shared surface/text/focus and paired selected-state tokens rather than independent blue, purple, or amber panel themes. Lab shells use a 70% paper surface and drawing grounds a 20% paper layer; controls and puzzle tiles keep solid fills. Implementation notes and return links have their own reading surface instead of bare text over rain. Semantic lab tokens retain distinct inactive wires, work/warning, secondary comparison, and trace-highlight roles. Loom and Sculpture cache their resolved canvas colors during the existing size/theme invalidation callback, not per frame. Engine metal and hot/cold airflow keep their physical palette. Stack-map activity uses a separate muted solid fill with normal ink and a narrow accent edge; it does not change the shared button-selection palette. The header and content share one width rule at each breakpoint; the header contains only unnumbered section links and appearance/motion/menu controls.

Shared surface roles live in `tokens.css`: `--surface-panel` (70% reading/lab panels), `--surface-stage` (20% drawing grounds), and opaque `--surface-control`/`--surface-overlay` (controls and navigation/settings). Existing reading/lab aliases resolve to those roles instead of independent alpha values. `--ui-radius` is zero for interface frames, buttons, badges, previews, and form fields at all sizes; semantic diagram circles remain feature-owned. Feature CSS keeps geometry and state ownership, while collection CSS supplies a shared inactive-control hover treatment and native-select chevrons without a new component framework. Primary actions pair `--flow-fill` with `--flow-ink`, including contact links; keyboard focus retains the shared 3px outline. Programmatic lab-anchor focus has no browser-default blue container outline, without suppressing interactive focus rings. The introduction paints one continuous panel instead of child text backgrounds. Surface-language browser tests check resolved corners, panel/control roles, hover, primary colors, and keyboard focus in both themes at desktop/mobile sizes; existing contrast, reduced-motion, fallback, and stable-map tests remain separate.

`NameEntrance` supplies static name geometry to the existing background renderer, not another rain simulation. Real text spans reserve the final layout and expose a stable full-name accessible label. After fonts are ready, `name-rain-stencil.ts` measures exact glyph positions/baselines and creates an alpha bitmap plus a summed-area coverage map. The shared `rain-name.ts` registration contract hands this geometry to the app layer without a feature-to-app import. The background samples the stencil against its existing bounded grid and progressively illuminates those cells over 4.6 seconds. Its lighting pass reuses the exact atlas glyph, position, size, clock, mutation rate, and falling front of each background cell; a clipped bloom makes the coarse grid readable without inventing a denser second field. The assembled light uses one 6px shadow-blur pass and two composites of that same clipped buffer to reinforce weak strokes, rather than per-glyph filters or solid text. The offscreen lighting buffer is compositing only—there is one visible rain canvas and one animation loop. A CSS mask cuts only the lettering out of the existing 70% introduction surface so those background highlights remain legible; all surrounding reading surfaces and their opacity stay unchanged. The pure shared model owns reveal timing and constant-time stencil coverage, not a separate movement model. Reading/navigation interruptions finish only the reveal; the background's existing motion/visibility gates own all animation and preserve its 20Hz cadence, 1.25 DPR cap, and glyph-grid limits. Scroll/resize measurement updates viewport alignment without restarting the entrance; slow fonts skip a late reveal. Cleanup unregisters geometry, restores the plain heading/surface, and releases bitmap, lighting buffer, observers, timer, and listeners. Reduced motion retains a still highlighted name; unavailable canvas/CSS masking and no JavaScript retain the plain-text fallback. A forced-colors media query disables name-stencil registration and uses `CanvasText`; CSS immediately restores letter ink and removes the cutout during preference changes, while a cleaned-up change listener refreshes registration without replaying the entrance. Browser tests verify a single visible canvas, no heading canvas, a shared clock, one assembled glow pass, high-contrast transitions without layout changes, and pixel-identical unrelated background regions when the name's brightness changes.

## Runtime and build boundaries

The batch replay CLI still buffers its input within the 1 MiB byte limit before
output begins; input acquisition is not streaming. `iterateBatch` validates that
limit immediately, then scans physical lines and parses/simulates each nonblank
row only when pulled. It does not split all lines or collect a result array.
`replayBatch` retains the existing eager array API by collecting that iterator.
Order, CRLF handling, physical line numbers and per-row errors are unchanged.

The small `scripts/write-lines.ts` adapter owns and ends the output stream through
Node's promise-based pipeline, honoring backpressure. The CLI counts rows and
invalid scenarios as they are consumed, but prints the completion summary only
after successful output completion. Input or output failures, including a consumer
closing its pipe early (`EPIPE`), still produce a concise diagnostic and exit 2
without a completion summary; valid output retains exit 0 or exit 1 for invalid
scenarios. Deterministic fixtures check lazy parsing, early iterator closure,
blocked/failed output and first/final asynchronous write failures. Subprocess
tests cover closed pipes and complete NDJSON delivery to a delayed consumer.
This bounds result production by output demand rather than total batch results;
it is not a measured speedup or a claim of zero stream buffering.

[The browser entry](src/main.tsx) hydrates the prerendered [App](src/app/App.tsx), or mounts it into an empty root in development. App composes the career content and optional experiences. The retired dashboard is outside this entry graph; its retained API and CLI use maintained domain models independently of the public page.

[Profile data](src/features/portfolio/data/profile.ts) and [technology data](src/features/portfolio/data/technology-stack.ts) supply both the portfolio and [résumé generator](scripts/build-resume.ts). PDFKit is confined to generation scripts; generated downloads in `public/resume/` enter the static build without adding PDFKit to the browser bundle.

The website introduction, plain-text résumé, and PDF introduction all use `professionalProfile.summary`; résumé data references it directly instead of maintaining separate copy. The PDF retains its curated headline. Tests check shared summary equality and its presence in the rendered PDF, text export, and portfolio. AI tooling is defined in technology data for the applicable stack layers and the text export's technology list. These labels describe the development workflow; the illustrative request-flow model remains independent.

`scripts/resume-document.ts` builds the fuller plain-text groups; `scripts/resume-pdf.ts` measures and renders the reference-proportioned one-page PDF with PDFKit. The page uses a custom 595.28pt width and the supplied 1323:1783 aspect ratio, rather than the earlier A4 draft. Vertical positions use a reference grid while font sizes remain natural, not stretched. Role-owned `resumeSummary` copy and explicit résumé location/date labels come from confirmed facts, not inferred employer relationships or geography. PDF-specific headline/introduction and the reference's self-rating values live in `resume-data.ts`; no scores are synthesized for new skills or languages. The fixed reference layout uses a 280pt work column at x=25 and a wider sidebar at x=333, an edge-to-edge ruled single-row contact strip with square marks, italic 7.6pt role descriptions, numeric date lines with right-aligned locations, and filled/hollow rating circles. Secondary study and certifications stay in the fuller website/text export; the PDF name links to that profile. Every text block is measured with the same face, width, and line gap used to draw it; overflow in a reserved region or contact cell fails generation instead of auto-shrinking, clipping, or adding a page. Returned layout/circle records support geometry, source-rating, bounds, and collision tests; actual PDF page objects, font embedding, and URI annotations are also checked. Lato Regular/Italic/Bold TTFs are vendored under `scripts/assets/resume-fonts/` with the OFL and pinned source in `SOURCE.txt`. Fonts and PDFKit stay build-only; they do not enter browser assets or add runtime network requests. See [download behavior](README.md#résumé-downloads).

The PDF's curated skills use thirteen single-line rows, ordered AI → languages → frontend libraries/frameworks → Node.js → databases → Git → Docker → Linux. Jhon explicitly confirmed AI at five dots and Next.js, Remix, TypeScript, and Linux at four. The headline follows the same order but omits Remix as requested, alongside Go and Python; Go claims have been removed from shared career data and Python is qualified as scripting. AI tools and agent workflows remain in work experience and the full text export, not extra skill rows. The renderer rejects more than thirteen rows. Existing supplied dots are reused for retained reference skills. Contact text and square marks are independently centered between the strip's two rules using measured heights; the full technology groups still supply the website and plain-text download.

[Vite](vite.config.ts) uses `base: "./"` so relative asset/download URLs work on both GitHub Pages project paths and root hosting. The [Pages workflow](.github/workflows/deploy.yml) and [Sites manifest](.openai/hosting.json) publish `dist/` only; neither deploys the Node API. The `/local-api` proxy exists only in Vite development, not in the built preview or hosted page. See [optional local API](#optional-local-api) for runtime details.

The build-only `src/app/prerender.tsx` entry renders App through React DOM's server renderer. `scripts/prerender.ts` is the explicit script-to-app exception enforced by the dependency test. It fills the built HTML root; the browser hydrates it (or uses a new root in development). Browser-only controls use a shared hydration readiness snapshot, and the pre-paint theme bootstrap remains authoritative until hydration. The server renderer never enters the client bundle.

Production build order is deliberate: strict application/test and isolated-domain type checks → résumé generation → Vite output → prerendered HTML → release manifest → asset budgets. Hashing before prerendering would record the wrong HTML. The manifest fingerprints the built static assets, including both résumé downloads, and records the source commit; deployment verification checks those bytes, not the optional Node service. PDF generation metadata may differ between builds, so verify the exact tested CI artifact's PDF rather than substituting a local rebuild or using the text export as a proxy. A subprocess/HTTP regression exercises the real manifest builder and rejects changed or missing PDF bytes while the source, remote manifest, and text export remain unchanged. Browser and sequential Lighthouse gates run against the finished build, with deployment integrity checked after publication.

Playwright owns its preview process in local runs and CI; it never silently reuses an existing server. `PLAYWRIGHT_PORT` defaults to 4173 and is validated as a decimal TCP port (1–65535) before interpolation. One normalized value drives the loopback base/readiness URLs and the strict-port preview command. A busy port aborts before journeys and leaves the unrelated server alone. Configuration/subprocess tests exercise default and overridden ports, invalid input, and real occupied-port rejection in local/CI modes without launching browsers. This guards server ownership, not whether local `dist/` was freshly built; the [documented local build step](README.md#run-locally) remains required. Browser validation never rebuilds the shared CI artifact, and workflow tests also reject implicit browser-test lifecycle hooks. Runtime application behavior and browser assertion/retry budgets are unchanged.

Vite 8 and React plugin 6 are upgraded together because the plugin requires Vite 8. The build uses Rolldown/Oxc and explicitly retains the previous ES2020, Edge 88, Firefox 78, Chrome 87, and Safari 14 transformation targets. These targets control generated syntax, not a claim of full application support on those browsers. Native optional imports, relative asset paths, and all asset/performance budgets remain unchanged.

TypeScript 6.0 is compatible with the installed typescript-eslint 8.73 tooling. The main type-check configuration explicitly includes Node types for scripts and tests because TypeScript 6 no longer includes ambient type packages by default; the isolated domain configuration retains `types: []` and its DOM-free library. Node type definitions and the supported runtime now share the Node 26 major. Tooling and the optional API require Node 26.13+ within that major, and preparation, browser/performance validation, and deployment verification all pin Node 26.13.0. This is an intentional runtime migration, not just a declaration update: Node 22/24 support is retired so newer declarations cannot silently expand the API contract beyond supported runtimes. The browser artifact remains static; the Playwright container pins browser binaries and OS libraries independently of the explicitly selected Node runtime.

ESLint applies recommended JavaScript rules to first-party `.js`, `.mjs`, and `.cjs` files, alongside the existing TypeScript and React-hook rules. Explicit readonly Node globals are scoped to tooling under `scripts/` and the ESLint configuration, not application/domain code. Serialized browser callbacks in the Node profiling tools access browser objects through `globalThis`, matching the existing engine profiler. Vendor, archive, and generated-output exclusions remain unchanged. Configuration tests check the actual resolved rules, rejected fixtures, supported globals, and exclusions; linting does not add JavaScript type checking or execute optional profiling captures.

Lint tooling resolves patched minimatch through its upstream-declared ranges: ESLint 10.15 and config-array 0.23.6 require `^11.0.5`, and typescript-estree 8.73 requires `^11.0.1`. The lockfile deduplicates these consumers and the existing glob dependency to 11.0.9. The temporary `minimatch@^10` → `11.0.4` override for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) is no longer needed; no consumer is forced across a declared major boundary. These are development dependencies and do not enter the browser bundle. Lint configuration/ignore tests and real nested/brace-glob discovery retain coverage of this project's usage. Dependency updates still require a clean install, full audit, those lint checks, and the release gates; upstream ranges do not replace validation. Node/TypeScript baselines, lint rules, and audit thresholds remain unchanged.

The workflow separates preparation (`prepare`), isolated validation (`validate` matrix), the required aggregate check (`build`), artifact publication (`deploy`), and post-publication integrity (`verify`). Preparation audits dependencies and runs the code/build gates once, then uploads immutable `production-dist`. Chromium, WebKit, and performance each download that artifact on separate runners; no consumer rebuilds it. Download digest mismatches fail validation. The performance runner takes its three samples sequentially without browser-test contention. Matrix fail-fast is disabled to preserve sibling diagnostics. The aggregate check uses `always()` and explicitly rejects every dependency result except success, including skipped/cancelled jobs, before packaging the same artifact for Pages on main. Only publication receives Pages/OIDC write permissions; it runs no dependency installation or repository scripts. Main-run concurrency includes verification, preventing a newer workflow deployment from replacing the page while the previous source is being checked. Verification failure marks the workflow failed but does not automatically roll back the already-published site. Operational gates, diagnostics, and GitHub protection settings are documented in [README](README.md#deployment).

The verify job also downloads that run's `production-dist` with digest-mismatch errors enabled; it never rebuilds. `verifyRelease` requires the trusted artifact's parsed manifest, compares the remote source and complete file/hash set against it before requesting assets, then hashes each trusted asset path. A coherently altered remote manifest/build cannot replace this reference merely by claiming the same source SHA. The CLI loads `dist/release.json` by default (or a local `--manifest` path), checks its source against the checkout/CI source, and fails closed when the reference is absent or invalid. Multiple hosts must independently match the same trusted manifest. Tokens remain stdin-only and origin-scoped, and all fetches reject redirects. On the existing private Sites origin only, HTML normalization permits the precisely captured origin-aware provider loader immediately before the closing body, with only its request ID and encoded timestamp varying. The unverified legacy prefix/substring heuristic is removed: legacy-looking scripts, appended code, and unknown loader formats fail rather than being ignored. Tests cover both prior verifier gaps, source/hash/file-set mismatches, missing references, CLI behavior, credential scope, redirects, and recognized versus altered provider loaders. This exception does not authorize private preview publication or an audience change.

Preparation and validation use the same pinned browser container as their execution environment, not as an application deployment target. It supplies browser binaries and OS libraries; the lockfile supplies JavaScript dependencies. Their Playwright versions/digests must agree, enforced by [the release-toolchain check](tests/release-toolchain.test.ts). Workflow contract tests also check suite coverage, artifact handoff, and the actual aggregate shell guard across successful, failed, skipped, cancelled, and missing dependency results. These source-level checks do not replace executing the workflow on GitHub.

Playwright dependency updates include both container pins in the same review, including patch releases: a runner patch can also roll its browser executables. Resolve the matching Noble tag through the [Microsoft Container Registry](https://mcr.microsoft.com/v2/playwright/tags/list), hash the returned manifest/index bytes, and compare that hash with its `Docker-Content-Digest` header before pinning the digest. Review upstream browser and runner behavior changes, then run the code/build, browser, and performance gates against the updated environment. A dependency-only bot PR that leaves either image behind is incomplete; the version guard must continue to reject it.

Connection progress uses schema version 2 under the existing storage key, preserving version 1 boards through migration. Attempt rotations are monotonic across Undo, hint assistance is sticky until reset, and best scores are updated by a pure domain function on connection completion. Migrated attempts have unknown rotation history and cannot create a record. Personal records use the same best-effort cross-tab synchronization as boards.

Signal Sculpture's pure domain geometry supplies stable particle identities and deterministic morphing. Its feature-local canvas renderer owns projection and an imperative animation clock; React owns controls and announcements, not per-frame state. Drawing resolution is capped at 2× device pixel ratio and the point count is chosen at mount (720 for small screens, 1,800 otherwise). Resize and theme changes redraw paused artwork. A static SVG replaces unavailable canvas. The shared `useViewportPlayback` hook starts its clock in view and suspends it offscreen or in hidden tabs without clearing playback intent. Manual Pause and Reset clear that intent; reduced motion also settles the current form without pointer influence. The pure view projection applies bounded yaw/pitch after object rotation, with a small depth-independent pan to keep pointer feedback perceptible at different angles. Time-based exponential easing runs inside the existing frame loop. Pointer exit targets the neutral view; pause freezes the current drawing and clears the target for a smooth return on resume. Reset and reduced motion clear both view and target. No graphics library or build configuration change is needed.

Gravity Loom uses a separate pure field model: softened attraction, tangential swirl, damping, a speed cap, and reflected safety boundaries. Its fixed 1/60-second steps illustrate kinetic art, not physical orbits. The feature-local renderer caps frame catch-up, keeps at most 90 points per thread, and uses 48 mobile/96 desktop threads with drawing resolution capped at 2×. Live configuration edits preserve particles, velocities, and histories; only Reset rebuilds them. Initial previews retain their final velocities and positions so Play does not jump back to seeds. Held points receive a stronger radial pull, briefly retained after release or a keyboard nudge. Pointer capture owns drag continuation; coordinates update the renderer through a ref and commit to React on release, avoiding control-tree renders on every pointer move. Native movement controls and focused-field arrow keys provide non-drag alternatives. Interruption clears the gesture and capture as well as playback. Reduced motion instead rebuilds deterministic static drawings on input, and SVG covers unavailable canvas. Resize/theme subscriptions and animation frames are released on cleanup. Gravity Loom shares `useViewportPlayback` with Jet Engine. Its effect also observes individual visibility/motion signals to release a captured gesture during interruptions even when the reduced-motion drawing is already static. Pause, Reset, Escape, and pointer cancellation clear playback intent; drag/steering or Play enables it. Frame updates stay in the feature renderer.

Each depth-sorted Sculpture particle paints its translucent halo, then its core,
separately. Combining particles into a single filled path changes overlap
compositing and is not an equivalent optimization. A cached unit-circle path can
preserve pixels, but transform/save/restore overhead outweighed its benefit in the
focused local readback experiment; native arcs remain. That software-rendering
observation is not a hardware GPU or application FPS guarantee.

Sculpture projection uses a renderer-owned fixed-size record pool (one per point,
plus a source-order and sorted array). Each draw recomputes the exact pulse and
projection into those records, restoring source order before the stable depth sort
so ties cannot inherit the preceding frame's order. No previous positions are
reused or quantized. `projectSculpturePoint` accepts an optional caller-owned output;
without it, the allocating domain API still returns a fresh result. Independent
original formulas verify coordinates/order, while the unchanged halo/core drawing
derives the same radii, alpha and color from depth and point identity.

Loom trail histories still append ordinary points and discard the oldest past the
bound. Focused allocation/GC sampling did not establish a worthwhile GC reduction
from pooling those points; allocation counts alone are not a reason to add a ring
buffer or change the pure, allocating field model.

The active Loom gesture retains its initial pointer-to-point offset, so grabbing a handle off-center does not reposition it. Cancellation is scoped to that gesture's pointer ID; a secondary pointer cannot cancel the primary grab. Space ignores auto-repeat while arrows retain repeated movement. Position descriptions are shared by the visible fine-control readout and the single atomic status, updating on user commands/releases rather than animation frames.

Loom's Add attractor and Remove last buttons retain keyboard focus at the four-point
and empty-field limits. They expose `aria-disabled` with the existing disabled
appearance; their handlers refuse out-of-bounds actions before changing points,
selection or feedback. Native disabling at these limits dropped the focused button
to the document. Tab still advances normally, and the opposite action re-enables
the control without changing manual pause or reduced-motion behavior. Browser
regressions cover both limits, repeated activation and recovery at mobile/desktop
widths in both themes; they do not replace human assistive-technology review.

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
