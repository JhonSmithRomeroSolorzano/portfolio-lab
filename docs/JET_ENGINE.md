# Jet Engine · Anatomy Hero

## Concept and scope

A cutaway aircraft turbofan replaces Pin & bolt, following the user's request for
an obvious speed-to-airflow interaction and richer animation. One engine-speed
control drives the fan, compressor and turbine rotation, air tracer speed and
density, heated-core emphasis, and exhaust reach. Idle, Cruise, and Full power are
shortcuts to the same control. Changing speed starts the animation explicitly;
Pause freezes it, and returning from an interruption never autoplays.

This is an Anatomy **Hero**, with a sectioned nacelle, exposed core, multiple
blade rows, and continuous air streams. It is an educational visual model, not
real operating data, an engine design, or a thermodynamic simulation. Rotation
is deliberately slowed. Orange indicates heated core air, not an afterburner.
Most illustrated routes bypass the core; their counts are artwork, not a claimed
mass-flow or bypass ratio. The shared pure model owns all visual speed mappings.

## Parts list before geometry

- Stand: four pads, four feet, deck, two engine pedestals, and engraved plaque.
- Nacelle: intake lip, aft lip, rear and front cutaway shells, three external
  fastening bands, and fastener dots on the exposed cut edges.
- Core: sectioned compressor casing, combustor casing and perforated liner,
  turbine casing, core nozzle, and twelve radial supports joining the nacelle.
- Shaft: three exposed shaft sections, two solid couplings, spinner nose, and six stationary guide vanes.
- Moving assemblies: eighteen swept fan blades, four ten-blade compressor
  rows, two ten-blade turbine rows, and their hubs. Each blade's faces are
  re-projected and shaded in the same world camera as the Anatomy artwork.
- Air: cool intake streams, a cool bypass annulus, heated core streams, and a
  softly fading mixed exhaust. These are tracers, not physical solid parts.

## Rendering boundaries

Anatomy authors the fixed SVG solids. A single feature-local 2D canvas renders
the moving blade faces and the continuous air tracers between rear and front SVG
layers. This avoids introducing a graphics dependency or a general 3D engine.
The pure model and generated projection keep all three layers registered.
React owns controls and announcements, never per-frame geometry. The renderer
caps pixel ratio and catch-up, and releases its frames, observers, and listeners.
Small screens enlarge all registered drawing layers together inside a clipped
stage, keeping the fan and core readable without horizontal page scrolling.
Intrinsic image dimensions reserve the stage before SVG downloads finish, so
late casing assets do not move the controls or misregister the canvas.
Reduced motion uses a still composition at the chosen speed. Canvas denial keeps
an SVG engine and speed-dependent air paths; it does not claim animated playback.

The static authoring recorder uses the actual slabs, annular sectors, and turned
profiles. Moving blade clearances are bounded separately by their pure radial
geometry and axial spacing. Surface marks stay on their physical parts.

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

The generator writes four theme-specific SVG assets and projection data. The
projection JSON uses eight decimal places to avoid platform-dependent trailing
bits in trigonometric results. This is far below a screen pixel; regeneration
still compares every generated file exactly and reports the differing filename.
The selected theme loads two images only when the experience is mounted; theme changes
select the matching pair. Both theme pairs together have an 80 KiB compressed
source-art regression limit, separate from the existing JavaScript budgets.
Ordinary builds
do not regenerate the figure and do not ship the skill kit. The earlier lock and
its assets are removed; the existing six other experiences remain unchanged.
