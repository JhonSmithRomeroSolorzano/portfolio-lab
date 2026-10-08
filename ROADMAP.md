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

Next for this brief: focused browser regression coverage, including résumé downloads. Keep newly supplied career details subject to verification.

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

### Experience details — October 6 follow-up

- [x] Made the senior full-stack role prominent directly below the name in the introduction.
- [x] Added directly confirmed responsibilities for current Antecursor work across feature design, databases, backend, frontend, Azure, and GitHub Actions.
- [x] Described Athletify frontend work with React/TypeScript, Figma design implementation, and some Next.js experience. Product context comes from the official Utah company's profile; do not attribute unverified libraries or Go development to Jhon.
- [x] Expanded résumé tags into Languages, Frontend, Backend, Data, Infrastructure, and Testing groups using the shared technology source. Included Next.js with a qualification and Figma as design handoff.
- [x] Checked the introduction, new role descriptions, and grouped tags in light/dark themes and at desktop, 900px, and 320px widths without horizontal overflow. All 52 tests and the production build pass.

The print/download résumé milestone is complete; see the October 7 export work below.

### Project stories and navigation — October 6 follow-up

- [x] Removed the misaligned résumé/contact shortcuts from the introduction and their unused responsive styles; both destinations remain in the main menu.
- [x] Embedded Athletify's project context and link inside its Experience entry. Projects belong to their corresponding roles; do not add a separate Projects section or main-menu item.
- [x] Kept Next.js experience qualified and Go as product context rather than a personal development claim.
- [x] Verified the embedded project belongs to Athletify, removed the standalone Projects navigation, and checked light/dark, desktop, and 320px layouts without horizontal overflow. The project link has visible keyboard focus; all 52 tests and the production build pass.
- [x] Removed the Figma-to-React/TypeScript handoff diagram at Jhon's request and its unused data and styles. Added Nimrod's public link beneath the current Antecursor role, with product context verified from nimrod.io and no unverified feature ownership claims.
- [ ] Add further professional projects and individual contributions beneath their corresponding Experience entries when Jhon confirms their details.

### Project contributions — October 7 follow-up

- [x] Linked Nimrod beneath both Antecursor roles, as confirmed by Jhon, with contributions specific to each period.
- [x] Made personal contributions the focus of Nimrod and Athletify cards, keeping product descriptions brief and removing duplicate responsibility lists above the cards.
- [x] Used verified frontend, backend, database, maintenance, and delivery work; retained the qualification for Next.js and omitted unrelated product-backend details.
- [x] Checked the rendered links and contribution lists for all three role/project pairs, with no duplicate role lists. All 61 tests and the production build pass.
- [ ] Add concrete feature examples and outcomes when Jhon supplies verified details; do not invent metrics or ownership.

### Scroll and menu motion — October 6 follow-up

- [x] Added a sliding menu indicator with current-section semantics, a reading-progress line, section-arrival sweeps, and a scroll-linked experience timeline.
- [x] Preserved native anchors, smooth scrolling, query parameters, history, and keyboard behavior. User scrolling can interrupt menu feedback; reduced-motion preferences disable decoration and movement while retaining section tracking.
- [x] Added behavioral coverage for section boundaries, modified clicks, coalesced frames, destination tracking, history changes, short sections sharing the last viewport, interruption, reduced-motion changes, and cleanup.
- [x] Checked desktop menu clicks, selected-section feedback, both themes, reading progress, and timeline appearance in the browser. All 61 tests and the production build pass.
- [x] Fixed WebKit keyboard anchor navigation by making destinations focusable and using immediate scrolling during keyboard focus. Verified Enter reaches About and Résumé at the expected top offset, transfers focus, and retains smooth scrolling for pointer clicks.

### Résumé exports — October 7 follow-up

- [x] Added PDF and plain-text downloads beside the Experience heading, generated from the shared verified profile, technology groups, and role contributions.
- [x] Kept each role's responsibilities together in a readable two-page PDF, with selectable text, accented education names, page numbers, and clickable public profile/project links. Both Antecursor periods retain their Nimrod contributions.
- [x] Generate fresh assets before development and production builds; keep generated binaries out of Git and the PDF library out of the browser bundle.
- [x] Added coverage for retained contributions, overlapping dates, qualified experience, actual PDF page count, and oversized-section rejection. All 64 tests and the production build pass. Rendered and reviewed both pages, checked extracted text and link annotations, and verified the served PDF/text match the generated files.
- [x] Reviewed download controls at desktop and 320px widths without horizontal overflow. The browser's automated file download timed out; direct HTTP checks confirmed both assets return 200 with the expected content types and bytes.

Next: automate the recruiter journey through menu navigation, theme selection, and résumé downloads. Exact email/phone details and more concrete project outcomes still require Jhon's confirmation.

### Combined introduction — October 7 follow-up

- [x] Merged About into Workbench, keeping the verified engineering background beside the existing introduction, portrait, technology overview, and interactive stack map.
- [x] Removed the duplicate About navigation item, repeated skill cards, and unused styles. The frontend diagram link now leads to résumé contributions; old `#about` links still reach the introduction.
- [x] Checked desktop/light and 320px/dark layouts, keyboard navigation to experience and back, existing About links with query parameters, and all internal anchor targets. No horizontal overflow; all 64 tests and the production build pass.

Next: browser regression coverage for the simplified menu and recruiter journey.

### Browser regression coverage — October 7

- [x] Added Chromium and WebKit journeys for keyboard navigation, résumé downloads, persistent themes, narrow layout, imported scenario reloads, and legacy links. CI runs against the production build before deployment.

- [x] The first browser run exposed an import/reload race: the controls updated before the debounced URL write. Explicit imports, presets, and baseline restores now synchronize the URL before updating the controls; rapid slider input remains coalesced. The immediate-reload journey guards this regression.

Next: keep browser coverage aligned with completed comparison tools.

### Comparison workspace — October 7

- [x] Capture, persist, restore, and clear a validated comparison baseline. Corrupt or unavailable storage leaves the current visit usable and shows an honest persistence message.

- [x] Export a readable Markdown comparison with both configurations, recalculated metrics, signed differences, and explicit model limitations. A copyable view remains available when downloads are blocked.

- [x] Import/export versioned comparison JSON containing both setups; validate both before changing either, bound input size, and recalculate all results.

- [x] Share both setups with a versioned URL that strips unrelated parameters. Incoming links open the comparison; replacing/clearing the baseline removes stale shared state while retaining current controls.

Next: cache invalidation experiments and accessibility review.

### Cache strategy experiments — October 7

- [x] Added update invalidation and stale-while-revalidate alongside fixed TTL, with explicit event ordering, origin-fetch accounting, and tests for exact expiry/update boundaries.

- [x] Compare all strategies over the same 21 reads, separating total origin fetches, blocking reads, and stale responses. Explain that reliable invalidation is an assumption.

- [x] Export every cache read as CSV with policy, TTL, source/returned versions, freshness, expiry, origin fetches, and pending refresh state. The copyable fallback uses identical data.

Next: richer queue workloads and request timing.

### Queue workload exploration — October 7

- [x] Added equal-volume steady, two-second burst, and single-spike workloads. Holding 64 arrivals fixed makes burstiness visible independently of total traffic. All patterns retain request conservation checks.

- [x] Continue the queue timeline after arrivals stop, showing drain time and counting accepted work as completed only when served. Rejected requests remain rejected.

Next: inspect individual request wait and service times.

### Request timing — October 7

- [x] Added a deterministic FIFO request scheduler with configurable workers, service time, bounded waiting, and per-request arrival/start/finish/wait evidence. Completion and queued work precede same-instant arrivals. Overflow is explicit and every request has an outcome.

- [x] Optional deadlines include queue wait and service, expire waiting requests, and cancel running work to release workers. Exact-boundary completion wins; tests cover expiry/arrival ties and every outcome.

- [x] Added a separate retry experiment with exponential backoff, a global retry budget, seeded full jitter, explicit outage recovery, attempt amplification, and a time-ordered trace. Limits are visible and retries never imply guaranteed success.

Next: inspect the new tools through browser journeys and document the completed models.

### Saved experiment workflow — October 7

- [x] Rename saved experiments and replace a named setup with current controls while preserving identity and order. Validate names and copy scenario values so later edits cannot alter a saved snapshot.

- [x] Undo the last removal at its original position without overwriting newer entries; keyboard focus moves to Undo and returns to the save input after restoration. The eight-item bound still applies.

- [x] Back up and merge versioned libraries without overwriting existing saves. Validate the complete import, skip matching names/settings, regenerate local IDs, and reject imports exceeding eight entries atomically.

- [x] Synchronize library changes between tabs through storage events, distinguish unrelated preferences from a clear, cancel stale edits/undo state, and announce the update. Concurrent writes retain browser storage’s last-write-wins semantics.

Next: maintain browser coverage for the saved workflow.

### Capacity interpretation — October 7

- [x] Added analytical whole-request capacity, spare database capacity, and minimum connections at the current load beside the sampled sweep. Explain offline/all-cached cases and distinguish model capacity from real infrastructure limits.

Next: final accessibility and browser regression checks for the expanded tools.

### Accessible tool inspection — October 7

- [x] Mobile inspection found wide result tables lacked a keyboard focus target. Every table viewport now has an accessible name, a Tab stop, visible focus, and native arrow-key scrolling.
- [x] Shared-comparison regression checks distinguish restoring the current controls (which retains the baseline through reload) from clearing the baseline (which removes it from the link and storage).
- [x] Added browser journeys for comparison links/restoration, cache accounting, request deadlines, keyboard table scrolling, library rename/undo/reload, and cross-tab synchronization. The suite contains 18 Chromium/WebKit checks; deployment is gated on their success.
- [x] Reviewed baseline persistence and restoration, cache strategy totals, mobile table scrolling, and saved-experiment editing at 320px without page overflow. All 91 unit/integration tests and the production build pass.

Next: the optional local-API client and more verified project examples. Keep professional achievements and contact details dependent on Jhon’s confirmation.

### Local API verification — October 8

- [x] Added an opt-in development client through a same-origin Vite proxy; the published site only offers setup instructions.
- [x] Validate model identity, echoed settings, every result, and response size. Show correlation IDs and distinguish HTTP timing from modeled latency.
- [x] Handle cancel, changed inputs, timeout, offline, malformed replies, and rate limits without automatic retries or stale responses.
- [x] Added real HTTP integration coverage and Chromium/WebKit journeys for opt-in, cancellation, stale results, retry, and production isolation.

Next: resolve observed keyboard-focus and storage-feedback problems in the existing tools.

### Keyboard recovery — October 8

- [x] Return focus to the name field after saving a setup and to the entry after saving/cancelling a rename; Escape cancels without losing the keyboard position.
- [x] Restore focus to the name input if a cross-tab update removes the active editor or Undo control. Clearing a baseline returns focus to Capture.
- [x] Added Chromium/WebKit coverage for rename save/cancel/Escape, cross-tab removal during editing, and comparison clearing.

Next: preserve truthful persistence feedback when browser storage fails.

### Honest storage feedback — October 8

- [x] Fixed Update setup replacing a storage-failure warning with a success message. Every save now reports the operation and persistence outcome together.
- [x] Keep visit-only changes usable and point to the portable backup. Added a blocked-storage browser journey covering save, update, reload loss, and backup content.

Next: make failed downloads lead directly to the copyable export.

## Next useful milestones

1. **Browser regression suite — established:** extend the existing recruiter, comparison, library, and keyboard journeys as behavior changes; keep fixtures deterministic.
2. **Comparison reports — complete:** persisted baselines, readable reports, versioned JSON, and links for both setups.
3. **Cache invalidation — complete:** fixed TTL, invalidation on update, and stale-while-revalidate with explicit ordering, policy comparison, and CSV evidence.
4. **Request scheduler — complete:** inspect individual arrival, wait, service, rejection, and deadline outcomes. Keep this finite FIFO experiment distinct from the steady-state approximation.
5. **Retry experiment — complete:** bounded global budget, exponential backoff, seeded full jitter, and explicit recovery assumptions.
6. **Service client — complete:** explicitly selected local-API verification with cancellation, timeouts, bounded response validation, model agreement, and separate transport timing. Hosted builds stay independent.
7. **Accessibility review:** test screen-reader announcements, focus behavior, color contrast, and export fallbacks. Fix observed problems and document the evidence.
8. **Recruiter path:** add a user-confirmed contact address and further verified project examples. Résumé downloads are complete. Do not invent links, metrics, employer details, or achievements.

## Working rule

Take the next useful, bounded task, validate it, and commit a complete change. Keep relevant tests with the feature. Follow the user's current daily scope without padding commit counts. Never create empty commits, backdate changes, or manufacture activity. Preserve unrelated edits and existing history. If external authentication or publication is blocked, report it once; do not repeatedly edit this roadmap for activity.

Read README.md, CASE_STUDY.md, and AGENTS.md before continuing. Update this roadmap when real work changes its status. When these milestones are complete, propose the next worthwhile improvement.
