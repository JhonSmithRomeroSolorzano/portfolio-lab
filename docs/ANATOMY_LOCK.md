# Pin & bolt · Anatomy interaction

## Concept, model, and scope

An Anatomy **Figure**: a cutaway five-pin sliding lock. There is no cache analogy.
Adjusting or dragging a pin visibly moves its brass lower half and steel upper
half; its spring follows the same displacement. All five joins must meet the
marked shear line before the bolt can slide out. Trying too early highlights
the blocking pins. Opening the lock moves the bolt and its lower pins together.
Relocking and changing the cut pattern are explicit actions. Lifting the cover
is a separate inspection control, not another condition for winning.

This is an authored mechanical puzzle, not a lock-picking trainer or a simulation
of a real security product. Each cut is an integer 0–5. The pure domain model owns
alignment and blockers; geometry and feedback use the same values. The pin join
is at `78 + (level - cut) × 8` world units, making alignment exact and visible.

## Parts planned before geometry

- Base: four pads, four foot mounts, one beveled base plate, four square screws,
  inset perimeter, ruler strip, and engraved label plate.
- Structure: rear panel, two rear brackets, two lower guide rails, four rail
  mounts, upper spring beam, and ten pin-guide fixtures.
- Mechanism: five brass lower pins, five steel upper pins, five spring wires,
  five adjustable supporting plungers, sliding bolt, two handle standoffs, and handle grip.
- Inspection: cover, cover inset, four cover fasteners.

The exposed rectangular pins intentionally avoid a full turning 3D runtime.
Anatomy's solids provide bevels, volume, and four facing-dependent shades.
Spring paths are generated for each discrete position and terminate at their
pin and fixed beam. Words stay outside the figure except one engraved nameplate.

## Provenance and regeneration

Anatomy is installed under `.opencode/skills/anatomy` from
[`wheresryan22/anatomy`](https://github.com/wheresryan22/anatomy), commit
`e9488296a44211c42701ff71705b7901470ec78f`, under its included MIT license.
Its kit, references, scripts, and examples are unchanged. This lock design,
puzzle model, controls, and tests are original to the portfolio.

```sh
npm run build:lock
npm run build:lock -- --check
```

The authoring tool writes finished SVG data to `lock-art.json`; the skill kit
does not enter the app bundle or ordinary build. Static groups are reused.
Native sliders and ± buttons duplicate the optional direct pin dragging.
On narrow screens a five-button pin chooser keeps one compact control next to
the figure instead of putting the fifth pin's controls far below the drawing.
Pointer capture preserves the grab offset, and interruption releases the gesture.
There is no idle loop, timer, score submission, or persistence. Reduced motion
keeps every control and result but removes transitions and jam feedback motion.

The earlier Cache Rescue press was removed after feedback that its analogy was
unclear. Cache Rescue retains its original request map; Anatomy remains installed.
