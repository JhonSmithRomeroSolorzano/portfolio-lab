# Cache Rescue · single-flight press

## Concept and scope

An Anatomy **Figure**, not a new lab. A small duplicating press explains the
existing one-key cache model: cutting the master is an origin read; request cards
either reach the press independently or wait in a holding tray for the same master.
Completed cards collect in the output tray. Once the master is ready, later cards
reuse it. This is a visual analogy, not a model of mechanical throughput.

The existing `rescueRun`, `rescueState`, and `rescueSnapshot` remain authoritative.
Card identities and counts never come from a separate animation model. The die's
travel represents progress of the first origin fetch, not a count of mechanical
strokes. Independent reads remain concurrent, including after the first refill.

## Parts planned before geometry

- Base: four rubber pads, four foot mounts, machined base plate, inset perimeter,
  four square screw heads, calibration strip, engraved nameplate.
- Input/output: two tray floors, two rear fences, four side fences, two inset beds.
- Structure: two pillar shoes, two guide pillars, two top collars, two top nuts,
  crossbeam, crossbeam inset, two crossbeam fasteners.
- Bed and holding tray: lower bed, replaceable bed insert, waiting-tray floor,
  two side rails, front stop.
- Mechanism: carriage, master die, two carriage guide blocks, rectangular ram,
  two carriage fasteners, four walls forming a hollow ram guide.
- Subject: individually identified request cards, each with three printed rules.

The generator authors 52 solids, including one reusable request-card template.
Geometry uses Anatomy’s beveled solid primitives and four facing-dependent shades.
There are no tubes, cables, shaders, or turning 3D parts. The generated artwork is
source data, not executable markup from visitors or a remote service.

## Regeneration and provenance

Anatomy is vendored under `.opencode/skills/anatomy` from
[`wheresryan22/anatomy`](https://github.com/wheresryan22/anatomy), commit
`e9488296a44211c42701ff71705b7901470ec78f`, under its included MIT license.
The vendored skill includes its kit, references, scripts, and examples unchanged.
The press design and controller are original to this portfolio.

```sh
npm run build:press
npm run build:press -- --check
```

The generator uses the skill's kit only at authoring time. Checked-in `press-art.json`
holds finished SVG groups and projection axes. No kit, WebGL runtime, or skill
examples enter the browser bundle. Ordinary builds do not regenerate the illustration.
Static groups are reused across frames; React updates card placement and the die
from the existing playback snapshot. Native view buttons preserve the simulation
and keyboard focus. There is no idle autoplay or hover-only interaction.
