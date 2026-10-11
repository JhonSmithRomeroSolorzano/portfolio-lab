# Signal Lab reference

This is the retired dashboard presentation, including its browser adapters, export/share tools, and original styles. It is **not imported by the public portfolio**. Pure simulation models remain maintained in `src/domain/simulation/`; the optional Node API, batch CLI, and existing behavior tests still use them.

The files are retained for the earlier [case study](../../CASE_STUDY.md), not as another application layer. Import direction is one-way: this archive may use maintained models and shared primitives; active `src/`, `server/`, and `scripts/` must never import the archive. Tests continue to cover its portable formats and browser-adapter logic. Its old stylesheet snapshots are reference material and are not bundled.

Current development belongs in `src/features/portfolio/` or the four experiences under `src/features/playground/`. See [architecture](../../ARCHITECTURE.md) before adding dependencies.
