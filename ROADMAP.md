# Portfolio roadmap

Aim: show practical full-stack engineering through working features and clear explanations.

## Completed — 2026-10-05

### Portfolio and repeatable experiments

- [x] Responsive portfolio grounded in verified experience.
- [x] Typed cache/database model with visible assumptions and conservation tests.
- [x] Shareable URL settings and clipboard fallback.
- [x] Guided experiments and captured-baseline comparison.
- [x] Named local experiment library, bounded to eight saved setups.
- [x] Versioned JSON import/export with validation and recalculated results.
- [x] Exact traffic input, configurable read hit rate, connection pool, and write share.
- [x] Capacity sweep, accessible results table, and CSV generation.
- [x] Copyable JSON/CSV export views for browsers without working file downloads.
- [x] Step-through cache/database/timeout traces.
- [x] Separate cache expiry and bounded queue experiments.

### Local service and developer tools

- [x] Node HTTP API using the same model; strict validation, body limits, health route, graceful shutdown, and integration checks.
- [x] Generated request IDs and structured logs without request payloads or personal metadata.
- [x] Process-wide fixed-window request budget with 429 and Retry-After.
- [x] Served OpenAPI contract with consistency checks.
- [x] NDJSON batch replay, sample scenarios, bounded input, and useful exit codes.
- [x] Technical case study with architecture, formulas, trade-offs, and reproducible examples.
- [x] Automated validation and GitHub Pages deployment.
- [x] Grouped advanced workload controls to keep the initial lab compact after desktop review.
- [x] Manual browser checks of controls, comparison, persistence, JSON import, expiry/queue results, and narrow-screen layout.

The API is a local teaching service. The public browser demo is static and does not connect to a live cache or database. Expiry and queue experiments are separate from the steady-state model.

## Résumé and visual refresh — current priority

Requested October 6; complete these before expanding the backend lab.

- [x] Uppercase JSR monogram in the header and favicon; cohesive blue branding with the original warm neutral light background.
- [x] Visible light/dark/system theme control, saved preference, and readable navy dark theme.
- [x] Recruiter-friendly résumé with experience and education verified from [the user's LinkedIn profile](https://www.linkedin.com/in/jhonsmithr). Profile access succeeded October 6 through the signed-in browser. Preserve the listed overlapping dates; do not infer employment relationships or add unverified achievements.
- [x] Restrained scroll reveals with keyboard, mobile, and reduced-motion support.
- [x] Reviewed the résumé, JSR mark, blue lab, theme selection/reload, and keyboard activation in the browser at desktop, 390px, and 320px widths; no horizontal page overflow. Verified lab controls after the refresh. Checked primary, muted, card, and lab text color pairs at 4.5:1 or better. The 51-test suite covers initial theme/storage fallbacks and reveal lifecycle, focus cancellation, and live reduced-motion changes; production build passes.

Next for this brief: a print/download résumé generated from the same verified profile data, then focused browser regression coverage. Keep newly supplied career details subject to verification.

## Next useful milestones

1. **Browser regression suite:** automate keyboard flows, reload/URL state, file import/export, and viewport checks. Start from observed user journeys; keep fixtures deterministic.
2. **Comparison reports:** save and restore a baseline, export a readable comparison, and share both setups with explicit versioning and validation.
3. **Cache invalidation:** compare fixed TTL, write-through invalidation, and stale-while-revalidate in the separate key timeline. Define update ordering and test boundary behavior.
4. **Request scheduler:** introduce an event-based model with queue wait and deadlines. Compare it with the steady-state approximation; label all assumptions.
5. **Retry experiment:** show retry amplification, a bounded retry budget, backoff, and jitter with a seeded source of randomness.
6. **Service client:** add an explicitly selected local-API mode, request cancellation, and clear offline/error behavior. Keep the deployed static demo useful independently.
7. **Accessibility review:** test screen-reader announcements, focus behavior, color contrast, and export fallbacks. Fix observed problems and document the evidence.
8. **Recruiter path:** add a user-confirmed contact address, a downloadable résumé, and verified project case studies. Do not invent links, metrics, employer details, or achievements.

## Working rule

Take the next useful, bounded task, validate it, and commit a complete change. Keep relevant tests with the feature. Follow the user's current daily scope without padding commit counts. Never create empty commits, backdate changes, or manufacture activity. Preserve unrelated edits and existing history. If external authentication or publication is blocked, report it once; do not repeatedly edit this roadmap for activity.

Read README.md, CASE_STUDY.md, and AGENTS.md before continuing. Update this roadmap when real work changes its status. When these milestones are complete, propose the next worthwhile improvement.
