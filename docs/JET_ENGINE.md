# Jet Engine · Anatomy Hero

## Concept and scope

A cutaway aircraft turbofan replaces Pin & bolt, following the user's request for
an obvious speed-to-airflow interaction and richer animation. One engine-speed
control drives the fan, compressor and turbine rotation, air tracer speed and
density, heated-core emphasis, and exhaust reach. Idle, Cruise, and Full power are
shortcuts to the same control. The drawing animates when it enters view and
suspends offscreen or in hidden tabs. Returning resumes it unless the visitor
used Pause, Reset, or zero speed. Play and speed changes can restart it;
reduced-motion preferences always keep the composition still.

**Reverse thrust** is a separate pressed-state button, not a negative speed.
It deploys a simplified cold-stream door/blocker assembly: blue bypass routes turn
outward and forward, while the intake, rotor direction, and orange core exhaust
retain their normal direction. It preserves the chosen speed and manual-pause
intent. Paused/reduced-motion and SVG-only views immediately show the selected
configuration without a clock; running views ease deployment and crossfade the
air routes only after 85% deployment clears the outer doors. Closing or rapidly
retargeting continues from the current pose rather than snapping to an endpoint.
Reset restores forward thrust at 35%, paused.
An engine at zero speed stays off even with its reverser selected.

This illustrates the [cold-stream blocker principle](https://patents.google.com/patent/US9447749B2/en)
and [separate fan/core airflow](https://www.grc.nasa.gov/WWW/K-12/airplane/turbfan.html),
not a particular aircraft, certified door geometry, deployment speed/interlock,
braking-force measurement, or operating procedure. No negative RPM is modeled.

This is an Anatomy **Hero**, with an under-wing pylon, sectioned nacelle, exposed core, multiple
blade rows, and continuous air streams. It is an educational visual model, not
real operating data, an engine design, or a thermodynamic simulation. Rotation
is deliberately slowed. Orange indicates heated core air, not an afterburner.
Most illustrated routes bypass the core; their counts are artwork, not a claimed
mass-flow or bypass ratio. The shared pure model owns all visual speed mappings.

## Parts list before geometry

- Aircraft attachment: a swept wing section with an airfoil-shaped cross-section,
  four skin panels, flap-line seams, a pylon fairing, two access
  panels, and a three-piece curved attachment saddle. The wing is cropped; the
  figure does not depict a complete aircraft or a particular certified installation.
- Nacelle: intake lip, aft lip, rear and front cutaway shells, three external
  fastening bands, and clean exposed cut edges without decorative dot textures.
- Core: sectioned compressor casing, combustor casing and liner,
  turbine casing, core nozzle, three closed shoulder collars between different
  casing diameters, and twelve radial supports joining the nacelle.
- Shaft: three exposed shaft sections, two solid couplings, spinner nose, and six stationary guide vanes.
- Moving assemblies: eighteen swept fan blades, four ten-blade compressor
  rows, two ten-blade turbine rows, and their hubs. Each blade's faces are
  re-projected and shaded in the same world camera as the Anatomy artwork.
- Reverser: thirty sectioned outer door panels and thirty inner blocker flaps,
  with tangential hinges on the retained aft rim. The blockers have circumferential
  edge clearance so they do not intersect as they fold into the smaller duct radius.
  The fixed nacelle has an aft opening at these panels;
  the stowed moving geometry closes it rather than painting over a solid wall.
- Air: cool intake streams, a cool bypass annulus, heated core streams, and a
  softly fading mixed exhaust. These are tracers, not physical solid parts.

## Rendering boundaries

Anatomy authors one complete static SVG per theme, in the measured global painter's
order. Each convex casing panel is an independent audited draw item; panels are
not hidden inside a group with an unchecked internal order. Wing seams and access
panel outlines paint with their actual host rather than on a universal
foreground overlay. Guide vanes are fixed parts, not duplicate canvas geometry.
The existing `engine-back-*` asset names now contain that complete base scene;
they no longer mean a back-only layer. The former front SVG assets are removed.

The cropped wing is the audit's explicitly fixed support boundary, not an implied
floor under the engine. Its flat underside contacts the pylon, which contacts the
curved saddle above the retained nacelle. The saddle steps around the nacelle band
rather than intersecting it. There are no test-stand feet or engine pedestals.
The three core collars close the former four-unit axial gaps without closing the
intentional longitudinal cutaway or eliminating blade-tip clearance. Matching-color
0.3px surface strokes seal antialiasing cracks between tangent SVG facets; they
do not alter the geometry or substitute for measured depth order. Empty paths are
omitted, retaining the original art budget with nine-degree-or-finer casing panels.
The fixed projection is fitted around the actual wing/engine and full reverser
envelope, not asymmetric exhaust endpoints. It remains the same through opening
and closing; opacity-based browser bounds and geometry bounds check centering.
The two mode explanations share an intrinsic-height grid above the drawing, with
only the active text exposed. Reserved On/Off width and description height keep
the stage from jumping when the selected mode changes.

The generator also exports indexed visibility triangles from those same recorded
prisms, annular sectors, and turned profiles. Screen positions use Anatomy's exact
0.1-pixel path rounding, and camera depth uses 0.001-world-unit precision. Integer
deltas compress the data in the existing lazy engine bundle. Legacy layer labels
in the diagnostic groups are used only to reproduce the old bug, never to render.

A feature-local 2D canvas maintains a cached fixed-surface depth buffer, then
establishes moving-metal depth per pixel. Air streaks, guide streams, tracer heads,
and exhaust all test that same nearest depth; they cannot paint through nearer
metal. Sloped faces and lines use interpolated planes/depth, not their average
depth. Concave swept caps use ear clipping rather than a triangle fan. Antialiased
fringes and technical outlines preserve smooth edges; border samples use the
nearest physical edge rather than extrapolating a steep surface plane. Fixed
guide coverage is cached only at settled speed and deployment, then retested against
moving blades/doors on every frame. Reverser panels use rigid axis-angle transforms
from the pure model, not a negative rotor clock. The same moving depth hides air
behind doors and blocker flaps. There is no graphics library or WebGL/GPU requirement.

The SVG-only fallback uses the same planes. It subtracts nearer opaque polygons
from blade faces and clips individual air-line intervals, so disabling canvas
does not restore the old foreground/background layering error. This alternative
is calculated lazily only when canvas is unavailable, not on the normal motion
path. It remains static and does not claim animated playback.

React owns controls and announcements, never per-frame updates. Pixel ratio,
frame catch-up, observer/listener cleanup, viewport autoplay, and manual pause
intent retain their existing policies. Reduced motion uses a depth-correct still.
Small screens enlarge the registered SVG and canvas together inside a clipped
stage without horizontal page scrolling. Intrinsic image dimensions reserve the
stage before downloads finish, avoiding registration or control-layout shifts.
Playback waits for the selected theme's complete base image, so isolated moving
blades never appear while casing art is still downloading or changing theme.

The static audit proves the fixed draw order. Separate pixel/ray tests cover
rotating geometry across the full shared fan/core pattern period, including
surfaces incorrectly hidden by the old front SVG and blades incorrectly drawn
through the old back SVG, plus intermediate and fully deployed reverser poses.
The authoring audit separately checks the true transformed reverser prisms against
the fixed scene and each other over 21 deployment positions, including physical
support at the aft rim. It uses fixed-pose sink/support queries—not the flight
checker that skips equal-offset pairs—and first proves the query rejects a known
overlap. The test suite runs this audit as well as reproducibility validation.
Nearby fixed members are anchored boundaries of the separately audited full scene,
avoiding repeated distant fixed/fixed checks without omitting any reverser contacts.
Moving rotor clearances
retain their radial/axial bounds. A regression prevents acute moving tips from growing
long antialiasing miters beyond their physical corners.

## Provenance and regeneration

Anatomy remains installed at `.opencode/skills/anatomy`, unchanged from
[`wheresryan22/anatomy`](https://github.com/wheresryan22/anatomy) commit
`e9488296a44211c42701ff71705b7901470ec78f`, under its included MIT license.
The engine design, model, canvas renderer, and portfolio controls are original.

```sh
npm run build:engine
npm run build:engine -- --check
npm run build:engine -- --audit
```

The generator writes two complete theme-specific SVG assets, visibility geometry,
and projection data. The
projection JSON uses eight decimal places to avoid platform-dependent trailing
bits in trigonometric results. This is far below a screen pixel; regeneration
still compares every generated file exactly and reports the differing filename.
The selected theme loads one image only when the experience is mounted; theme changes
select the matching image. Both theme images together retain the 80 KiB compressed
source-art regression limit; visibility data is counted in the existing JavaScript budgets.
Ordinary builds
do not regenerate the figure and do not ship the skill kit. The earlier lock and
its assets are removed; the existing six other experiences remain unchanged.
