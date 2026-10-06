# Portfolio roadmap

Aim: show practical full-stack engineering through small, working features and clear explanations.

## Milestone 1 — Foundation (2026-10-05)

- [x] Responsive portfolio grounded in verified experience.
- [x] Interactive traffic, caching, and database failure simulation.
- [x] Typed model with explicit assumptions and behavior tests.
- [x] Accessible controls and reduced-motion support.
- [x] Repository documentation and automated build workflow.

## Milestone 2 — Shareable experiments (2026-10-05)

- [x] Encode the selected scenario in the URL; load valid values safely and reject invalid input.
- [x] Add a copy-link button with a useful success/failure state.
- [x] Test scenario serialization, invalid values, and reset behavior.
- [x] Explain the feature in the build log.

## After that

1. **Compare scenarios:** save a baseline and compare the effects of changing one variable, with tests for comparison behavior.
2. **Request tracing:** step through cache hits, misses, and timeouts with an accessible event log.
3. **Backend service:** introduce a small Node/Express service in an isolated folder with a typed contract, validation, health route, and integration tests. Keep the public browser demo functional without a backend deployment.
4. **Cache behavior:** add a configurable hit ratio and expiry model; explain freshness versus latency.
5. **Queue experiment:** model bounded queues and backpressure, including an explicit overflow policy and tests.
6. **Case study:** write a technical walkthrough of this original project with an architecture diagram and decisions supported by the implementation.
7. **Recruiter path:** add a user-confirmed contact address, resume, and verified project case studies. Do not invent links, metrics, or achievements.
8. **Quality review:** inspect keyboard navigation, contrast, small screens, loading performance, and real browser interactions; fix observed problems.

## Work log

### 2026-10-05

Built the first portfolio and Signal Lab model. Added tests for warm-cache reads, saturation, outages, connection-pool boundaries, invalid traffic, and conservation of requests across all UI scenarios. Next task: shareable experiment URLs.

Added shareable URL state with independent validation for each field, preservation of the deployment subpath, and clean reset behavior. Round-trip tests cover every UI scenario. Next task: a copy-link control.

Added the copy-link control with confirmation and a selectable link when clipboard access is denied or unsupported. Shared links strip unrelated query parameters. Documented the feature and updated the portfolio build log. Next task: compare a saved baseline with the current experiment.

Completed configurable cache hit rates, including safe URL/file validation and 0%/100% boundary behavior.

Completed adjustable database pools, including offline behavior and safe sharing/imports.

Completed capacity sweeps with a throughput chart, accessible sample table, and downloadable CSV.

## Working rule

Completed step-by-step request tracing for cache hits, database reads, and timeouts, restricted to outcomes possible in the selected setup.

Completed portable experiment snapshots with JSON download, validated imports, and fresh result calculation.

Completed a named experiment library with reload persistence, removal, bounded storage, and a session-only fallback when storage is blocked.

Completed baseline comparison: capture a scenario and inspect latency, availability, and database-demand differences as the controls change.

Completed guided experiments for cache benefits, slow databases, and partial outages.

Take the next useful, bounded task, validate it, and commit a complete change. Do not create empty commits or alter dates for activity. Preserve unrelated edits. When this roadmap is complete, propose the next worthwhile milestone.
