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
- [x] Single light/dark toggle with saved preference and readable navy dark theme. Follow the device initially; the separate System button was removed at the user’s request.
- [x] Recruiter-friendly résumé with experience and education verified from [the user's LinkedIn profile](https://www.linkedin.com/in/jhonsmithr). Profile access succeeded October 6 through the signed-in browser. Preserve the listed overlapping dates; do not infer employment relationships or add unverified achievements.
- [x] Restrained scroll reveals with keyboard, mobile, and reduced-motion support.
- [x] Reviewed the résumé, JSR mark, blue lab, theme selection/reload, and keyboard activation in the browser at desktop, 390px, and 320px widths; no horizontal page overflow. Verified lab controls after the refresh. Checked primary, muted, card, and lab text color pairs at 4.5:1 or better. The 51-test suite covers initial theme/storage fallbacks and reveal lifecycle, focus cancellation, and live reduced-motion changes; production build passes.

### Personal design direction — October 6 follow-up

- [x] Replaced the oversized editorial hero and numbered marketing sections with a compact identity rail, personal introduction, and interactive map of Jhon’s stack.
- [x] Selectable Interface, Services, and Data layers describe verified experience and connect to useful portfolio sections. The map is authored for this repository in React/CSS/SVG.
- [x] Retained uppercase JSR, warm light and navy dark themes, résumé content, keyboard operation, and reduced-motion support. Keep one theme toggle; do not restore a separate System button.
- [x] Reworked the narrow lab diagram into two rows so its nodes remain visible on small phones. Browser checks covered all three stack selections, keyboard input, theme persistence, résumé navigation, lab state changes, and widths of 320px, 390px, 900px, and desktop. A compact sidebar keeps the toggle reachable in short desktop windows. All 52 tests pass.

Future visual work should build on this workspace direction and Jhon’s actual engineering work. Avoid reinstating generic oversized slogan heroes, repeated numbered sections, or borrowed portfolio layouts. Do not claim a globally unique design; keep the implementation specific to this project.

Next for this brief: a print/download résumé generated from the same verified profile data, then focused browser regression coverage. Keep newly supplied career details subject to verification.

### Personal introduction and contact — October 6 follow-up

- [x] Added the user's own LinkedIn portrait as a local asset and brought the technology stack into the introduction.
- [x] Incorporated directly confirmed React/Material UI, Node.js/Express, and NoSQL/SQL experience in the stack map; identify NoSQL as the strongest database experience.
- [x] Made the uppercase JSR mark and favicon follow the selected theme, including saved preferences on reload.
- [x] Added contact navigation and a prominent introduction link to the contact section; LinkedIn remains the available contact channel.
- [x] Checked desktop, 900px, 390px, and 320px layouts, portrait loading, keyboard theme switching, saved theme/logo/favicon agreement, diagram content, and contact navigation. All 52 tests and the production build pass.
- [ ] Add email and phone links once the user supplies the exact contact details to publish. Do not infer them from account metadata.

### Organized technology stack — October 6 follow-up

- [x] Separated shared JavaScript/TypeScript languages from frontend libraries/components/styling, backend runtime/framework/communication, databases/cache, and infrastructure.
- [x] Included Material UI, Tailwind CSS, REST APIs, WebSockets, Redis, Docker, and GitHub Actions for CI/CD. Azure and some AWS experience were confirmed directly by the user; retain that distinction.
- [x] Added shared testing coverage with Jest, Playwright, and Mocha, and the user-confirmed integration and end-to-end levels.
- [x] Expanded the diagram to four keyboard-operable layers, including Infrastructure. The overview, diagram, and background use one shared technology source.
- [x] Verified the expanded overview and diagram at desktop, 900px, and 320px widths, both themes, every selection, keyboard activation, and no horizontal overflow. All 52 tests and the production build pass.
- [x] Rewrote the opening introduction around the experience and systems Jhon builds; keep tool names in the organized stack below rather than repeating them in the opening paragraph.

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
