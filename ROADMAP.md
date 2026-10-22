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

### Export fallback — October 8

- [x] Handle hosts that cannot create a download or reject its click. Open the exact text export, focus it, select its contents, and announce the fallback.
- [x] Avoid claiming a file was saved when a browser can only confirm a download request; clean up the temporary link even when it throws.
- [x] Added blocked-download journeys for experiment JSON and comparison reports.

Next: reduce competing announcements during rapid slider changes.

### Assistive result feedback — October 8

- [x] Replaced competing main status/metric announcements with one complete, atomic summary after a 350 ms pause. Visual results remain immediate.
- [x] Disabled redundant live announcements on the workload outputs; inputs retain their labels and values. Browser coverage checks the settled summary after rapid changes.
- [x] Verification covers DOM accessibility semantics and keyboard behavior; it does not substitute for a human screen-reader listening session.

Next: finish browser regression and contrast checks before publishing.

### Reset persistence — October 8

- [x] Reset now writes default settings to the URL immediately, closing the same 150 ms reload race previously fixed for imports and restores. Unrelated query parameters remain intact.
- [x] Added an immediate-reload browser regression for the traffic/cache/database defaults and preserved campaign parameter.

Next: finish the full browser and visual review; professional details remain dependent on user confirmation.

### Browser review evidence — October 8

- [x] Verified real local API agreement, stale-result labeling, retained Send focus, rename focus, and Clear baseline focus in the browser.
- [x] Checked 320px and desktop layouts without horizontal page overflow. Measured primary/muted text contrast: light 11.34:1 / 5.05:1; dark 14.82:1 / 9.56:1. Lab text pairs range from 7.79:1 to 13.55:1.
- [x] The expanded browser suite contains 42 Chromium/WebKit checks. Its download cleanup assertion now targets temporary blob links and preserves both permanent résumé downloads.

The currently specified implementation milestones are complete. Career/contact additions still require verified details. Proposed next milestone: a guided, reproducible failure investigation that connects a shared workload, API result, and written engineering explanation, rather than adding more standalone controls. Confirm that direction before expanding the lab again.

## Next useful milestones

1. **Browser regression suite — established:** extend the existing recruiter, comparison, library, and keyboard journeys as behavior changes; keep fixtures deterministic.
2. **Comparison reports — complete:** persisted baselines, readable reports, versioned JSON, and links for both setups.
3. **Cache invalidation — complete:** fixed TTL, invalidation on update, and stale-while-revalidate with explicit ordering, policy comparison, and CSV evidence.
4. **Request scheduler — complete:** inspect individual arrival, wait, service, rejection, and deadline outcomes. Keep this finite FIFO experiment distinct from the steady-state approximation.
5. **Retry experiment — complete:** bounded global budget, exponential backoff, seeded full jitter, and explicit recovery assumptions.
6. **Service client — complete:** explicitly selected local-API verification with cancellation, timeouts, bounded response validation, model agreement, and separate transport timing. Hosted builds stay independent.
7. **Accessibility review — completed for the current changes:** automated DOM announcement semantics, keyboard recovery, blocked-storage messages, and export fallbacks. Manual review covered light/dark and 320px layouts; a human screen-reader listening session remains useful.
8. **Recruiter path:** add a user-confirmed contact address and further verified project examples. Résumé downloads are complete. Do not invent links, metrics, employer details, or achievements.

## Working rule

Take the next useful, bounded task, validate it, and commit a complete change. Keep relevant tests with the feature. Follow the user's current daily scope without padding commit counts. Never create empty commits, backdate changes, or manufacture activity. Preserve unrelated edits and existing history. If external authentication or publication is blocked, report it once; do not repeatedly edit this roadmap for activity.

Read README.md, CASE_STUDY.md, and AGENTS.md before continuing. Update this roadmap when real work changes its status. When these milestones are complete, propose the next worthwhile improvement.

## Recruiter-first page and compact labs — October 8 feedback

- [x] Place Experience before the lab and keep the lab as the final main section, after contact. Match menu order and send the introductory link to experience.
- [x] Replace the stack of open disclosures with one selected experiment in a compact workspace, capped at 680px with independent experiment and table scrolling. Keep shared traffic controls only where they apply.
- [x] Organize related experiments across frontend behavior, backend reliability, and data; keep modeled assumptions visible.
- [x] Preserve shared setups and keyboard navigation; retain mobile access and the existing Sites audience during publication.

The requested compact workspace is implemented. This feedback authorizes the new lab direction and supersedes the earlier request to confirm a next milestone.

- [x] Link directly to a selected lab with validated URL state and browser back/forward support. Preserve legacy comparison links, strip unrelated parameters from copied entry URLs, and reset only the workspace scroll when switching experiments.

- [x] Add an expanded workspace with a contained Tab cycle, Escape dismissal, inert background, restored focus/scroll behavior, and preserved experiment state. The normal page remains compact.

- [x] Add an async-search lab that exposes out-of-order responses and compares unguarded rendering with latest-request protection. Include a compact event inspector, tie-order tests, and explicit limits.

- [x] Add debounce/throttle exploration with burst/steady input, side-by-side call counts, handler timing, final-input loss, and exact-boundary tests.

- [x] Add a circuit-breaker lab with configurable threshold, cooldown, recovery time, and a state-by-state event log. Verify cooldown ties and failed probes; distinguish blocked calls from successful work.

- [x] Add fixed-window/token-bucket admission comparison on identical arrivals, including boundary bursts, remaining budget, conservation, and refill bounds.

- [x] Add FIFO/LRU cache eviction with bounded capacity, ordered snapshots, origin-read accounting, and identical-workload comparisons.

- [x] Add concurrent-write exploration: blind overwrite, atomic version rejection, and explicit reread/retry of additive changes, including version progression and lost-update tests.

- [x] Visualize scheduler queue wait and worker time on a shared timeline, including immediate rejection and waiting/running deadlines; keep every request accessible through a selector and full evidence table.

- [x] Compare jittered and synchronized retries with aligned time/count scales, a recovery marker, and an accessible per-window inspector. Keep attempt totals conserved and the original detailed attempt table.

- [x] Share and restore all six new experiments with strict, versioned setup links. Preserve immediate reload and history behavior, reject malformed configurations atomically, and recompute every result from validated settings.

- [x] Connect selected experiments with three compact guided investigations: async UI correctness, service recovery, and write conflicts. Each explicit step loads a reproducible setup, offers optional evidence, and leaves room to explore.

- [x] Add a bounded lab browser with area filters, purpose-based search, result counts, empty-state recovery, and keyboard focus restoration. The native selector remains available for quick switching.

- [x] Add explicit event playback, pause, pace, and manual stepping across the six new labs. Stop playback when switching experiments, changing inputs, hiding the tab, reaching the end, or enabling reduced motion; never autoplay.

Manual review covers the compact and expanded workspaces, dark/light themes, responsive 320px layout without page overflow, lab discovery focus, and Escape restoration. Browser regression is run in Chromium and WebKit through CI before publication. Further career additions still need verified details; additional lab expansion should start with a concrete user need.

## Simpler public presentation — October 8 feedback

- [x] Remove the Build notes section, its menu entry, the “Work in progress” label, and public roadmap promotion. Route the infrastructure map link to verified experience.
- [x] Start Signal Lab with one demo; reveal the chooser, sharing, and guided tools only through More experiments. Preserve selected labs, deep links, settings, and expanded mode.
- [x] Remove repeated lab branding, version, and the extra promotional footer beneath the demo.

Next: refine the existing presentation from user feedback. Keep the portfolio focused on professional experience and a small demonstration; do not expand the public lab catalog without a clear request.

- [x] Give the two-row mobile toolbar its natural height with sufficient CSS specificity; verify that actions stay inside the header above the demo.

- [x] Update both two-tab library journeys to open the secondary tools in each tab before choosing the saved-setup library.

## Distinct labs and play — October 9 feedback

The user requested a collection of distinct interactive labs and games, separated by space, while keeping the existing scroll progress and active menu. This expands the earlier single-demo presentation without changing the experience-first page order.

- [x] Introduce Labs & play with a compact anchor index and three individually styled pieces: Signal Lab, a connection puzzle, and Motion Studio.
- [x] Add three solvable tile-routing puzzles, reciprocal-connection tracing, a turn count, undo/reset, visible signal state, and keyboard movement/rotation without a timer.
- [x] Add an explicitly played motion experiment with four timing curves, duration control, replay, cancellation, and a static reduced-motion alternative.
- [x] Extend expanded-workspace isolation to the new collection, preserving the existing lab settings and focus restoration.
- [x] Cover puzzle solutions and invalid connections in unit tests; add browser journeys for solving, undo, keyboard movement, live reduced motion, narrow layout, and modal isolation.
- [x] Review 320px and 1440px layouts and both themes. The production build and 123 unit/integration checks pass; the affected Chromium/WebKit journeys pass after fixing the modal Tab cycle and making layout assertions independent of late font loading and scrolling.

Next: refine these three pieces from user feedback before adding another. Specific professional feature examples and direct contact details still require verified information; the previous review's broader résumé layout suggestions remain proposals.

## Focused refinements — October 9

- [x] Consolidate technology details in the interactive stack map, retaining languages and testing upfront. Give experience the full content width, with role identity beside contributions on wide screens and education/certifications below. Preserve all verified profile data and résumé downloads.

Next: optional puzzle guidance and a clear next-puzzle action, then browser-local puzzle progress and simultaneous motion comparison. Keep these as complete improvements with behavior tests; do not add sections for contribution counts.

- [x] Add optional one-tile puzzle hints, a keyboard jump to the highlighted tile, explicit inlet/outlet instructions, and a next-puzzle action after a successful connection. Hints leave turns unchanged, clear after board edits, and accept valid alternate routes. Verify hint-led solutions for all boards and browser completion/focus behavior.

Next: preserve each puzzle's progress in this browser, with safe handling for unavailable or invalid storage.

- [x] Save each puzzle's board/turns and the selected puzzle immediately to browser storage. Switching puzzles retains progress and visit-local undo; reset changes only the selected board. Validate version, size, counters, and allowed rotations atomically, recompute connections, and show honest recovery/unavailable-storage feedback. Cover round trips, corrupt saves, denied writes, immediate reload, and independent resets.

Next: compare a selected motion curve against a steady baseline with simultaneous playback and a reduced-motion end state.

- [x] Compare a chosen timing curve against a steady reference in two labeled lanes with matching distance, duration, and start time. Distinguish the markers by fill/outline and the curve graph by solid/dashed strokes. Cancel both lanes on control changes, hidden tabs, or reduced-motion changes; show both end states without movement when reduced motion is enabled.

Next: gather feedback on the more focused recruiter layout and the three interactive pieces. Further professional examples and direct contact details require user confirmation; add another lab only for a concrete new idea.

## Recruiter and frontend review — October 9

- [x] Rename the visible Workbench navigation to Overview while retaining existing anchors. Surface React, TypeScript, Node.js, and Azure beside the full-stack role, shorten the introduction, balance the mobile menu, and retain the portrait and interactive stack diagram.
- [x] Increase experience reading text to 16px, supporting dates/context to readable sizes, and make the diagram's cards grow with text. Clarify the current Antecursor design-to-delivery scope against earlier implementation and maintenance work using verified responsibilities.
- [x] Verify the recruiter journey, résumé downloads, narrow layout, both themes, and legacy links in Chromium and WebKit (12 checks); all 128 unit/integration checks and the production build pass. At 390px the experience section begins around 1,415px down, versus roughly 1,630px before the changes.

Next: load the secondary interactive pieces on demand, add a branded public sharing preview, and audit accessibility/performance. Specific project problems, decisions, and outcomes plus a direct email address still require verified user details.

- [x] Load Signal Lab, the connection puzzle, and Motion Studio in separate on-demand bundles. Preserve explicit anchors, settings, keyboard focus, and retry recovery without blocking the résumé. The initial JavaScript drops from 361.2 KB to 253.2 KB (110.4 KB to 78.9 KB gzipped). Browser coverage checks initial request isolation, direct entries, and failed-download recovery in Chromium and WebKit.

Next: complete the review's accessibility/performance audit and branded public sharing metadata. User-supplied project examples and a contact address remain pending.

- [x] Audit the overview, résumé, contact, and each interactive piece with axe in both themes. Correct Signal Lab label contrast and chart semantics, align control names with visible text, support 200% default text size without clipped stack cards, and make nested request-table arrow scrolling reliable in WebKit. Keep automated checks in the browser suite and document the remaining need for a human screen-reader assessment.
- [x] Add static canonical/Open Graph/large-card metadata with an original 1200×630 JSR sharing image and editable SVG. Point sharing to the public GitHub Pages portfolio; preserve the Sites preview audience.
- [x] Serve the licensed IBM Plex fonts locally and preload the main font. Add a reproducible Lighthouse command. The October 9 local production mobile simulation scored 99 performance, 100 accessibility, 100 best practices, and 100 SEO, with 2.0s LCP, zero blocking time, and zero layout shift. These are lab measurements, not hosted real-user metrics. All 128 unit/integration checks and the production build pass; the corrected loading/game journeys pass in both browsers.

Next: add a direct contact email and concise, concrete Nimrod/Athletify feature examples when the user supplies the problem, personal contribution, decision, and outcome. Do not invent results or turn these pending facts into public placeholders. Further technical work should follow observed issues or new user feedback.

## Visual coding inspiration — October 10

The user requested interactive labs inspired by visual coding videos. Keep the experience-first layout and the compact Signal Lab. Cache Rescue is the first bounded implementation; Algorithm Garden and a sorting playground remain candidate milestones rather than additional page sections.

- [x] Add Cache Rescue inside Signal Lab, with original paired request diagrams comparing independent cache-miss fetches against single-flight sharing. Keep each result tied to the same deterministic workload, including refill/arrival ties and already-started duplicate work.
- [x] Provide explicit play/pause/reset, event stepping, time inspection, adjustable burst size/fetch time/arrival spacing, and validated shareable settings. Stop playback on navigation, hidden tabs, input changes, and reduced motion; provide a static alternative.
- [x] Keep the workspace bounded, preserve all three collection pieces, and include a direct entry from the default demo. Verify the model and affected browser journeys, narrow-screen layout, and both themes before publication.

Next: gather feedback on Cache Rescue's visual explanation, then consider Algorithm Garden as the next distinct interactive concept. Verified career examples and a direct contact email remain pending user input. Do not split an individual feature to create activity.

- [x] Fix the WebKit failed-download recovery regression found by full CI: load the small Cache Rescue stylesheet with existing portfolio styles while keeping its JavaScript on demand. Cover both aborted requests and temporary HTTP 503 responses; preserve the scenario and recovery destination.

## Focused playground — October 10 feedback

- [x] Keep the stack map at a consistent intrinsic height across Frontend, Backend, Data, and Infrastructure. Overlapping grid panels reserve the tallest content while inactive panels stay hidden and inert. Verify wide screens, mobile, enlarged text, and a single accessible detail panel.

Next: replace the sprawling Signal Lab dashboard with four equally prominent, playful experiences and visual entry cards.

- [x] Replace the public Signal Lab dashboard and its large dropdown catalog with four peer experiences: Cache Rescue, Connection puzzle, Motion Studio, and Algorithm Garden. Use visual entry cards, independent anchors, distinct treatments, and lazy loading. Old Signal Lab anchors reach the collection; former dashboard settings no longer configure it.
- [x] Rework Cache Rescue into three short strategy challenges with animated requests, a one-read objective, clear outcomes, replay, pause, and static reduced-motion results. Explain the sparse-arrival case as well as the savings from shared fetches.
- [x] Add Algorithm Garden with breadth-first and pre-order depth-first play, hints, recoverable mistakes, numbered visits, keyboard operation, and a visible traversal trail.
- [x] Replace retired dashboard browser journeys with coverage for the four current pieces, retaining the earlier model/API/CLI unit tests. Check responsive layouts, both themes, reduced motion, direct links, download recovery, and map stability in Chromium and WebKit.

Next: refine these four pieces from user feedback rather than growing another large catalog. A direct contact email and specific professional project outcomes still require verified user details; do not invent them. A human screen-reader assessment remains a separate audit task.

## Architecture hardening — October 10

- [x] Isolate each optional experience behind an error boundary with a local retry. Render/effect exceptions keep the résumé, navigation, and other games usable. Degrade safely when IntersectionObserver is unavailable; cover failures, recovery, and unsupported observation in Chromium and WebKit.

Next: separate app composition, portfolio/playground features, shared browser utilities, pure models, and archived Signal Lab UI; remove retired styles from the public bundle and enforce quality boundaries in CI.

- [x] Organize maintained source into app composition, portfolio/playground features, shared browser/UI utilities, and pure domains. Move retired Signal Lab presentation/adapters into `archive/signal-lab/`, retaining the Node API, batch CLI, exports, and model tests. Update imports and architecture documentation.
- [x] Extract Cache Rescue's controller and arena, Motion Studio's playback controller, and reusable media-query/playback interruption hooks. Drive collection cards, anchors, aliases, and stable lazy loaders from one typed catalog.
- [x] Separate shared tokens/base styles, app layout, portfolio styles, and each game's styles. Remove retired dashboard CSS from the public bundle, reducing built CSS from 55.66 KB to 39.17 KB. Preserve eager game styles; disable optional module preloading after reproducing a WebKit retry failure with the new shared hook.
- [x] Gate CI on ESLint/core React Hooks rules, read-only formatting validation, strict source/test/e2e types, and domain compilation without DOM/Node/React APIs. Add a dependency-direction test that rejects archive imports and inverted layers. Document SOLID, KISS, and DRY through concrete boundaries and small contracts.
- [x] Verify all 135 unit/integration/architecture checks and 68 Chromium/WebKit journeys, including runtime failures, retry, no IntersectionObserver, game playback, responsive layouts, keyboard navigation, reduced motion, and both themes. Inspect the production preview at desktop/mobile sizes; preserve résumé data and unrelated local edits.
- [x] Align AGENTS and ARCHITECTURE with distinct ownership: agent workflow, verification, and delivery in AGENTS; source structure, dependency contracts, and runtime/build rationale in ARCHITECTURE. Replace stale paths and check instructions, and cross-link the documents instead of duplicating technical rules.

Next: refine the four experiences from concrete visitor feedback. A human screen-reader assessment and verified professional feature outcomes/contact details remain useful follow-ups; avoid expanding the catalog or adding abstractions without a demonstrated need.

## Playground interaction review — October 11

- [x] Preserve Algorithm Garden progress and hints, Cache Rescue results, and Motion Studio end states when visitors activate an already-selected option. Only a different selection or an explicit reset/replay starts over. Reproduce the accidental resets and cover the corrected keyboard interactions in Chromium and WebKit.

- [x] Stop Motion Studio when visitors navigate away or scroll the experience out of view. Reuse the shared browser lifecycle hook and wait for explicit replay on return. Cover both paths at desktop/mobile sizes, including cancellation of both animation lanes and successful replay.

Next: use visitor feedback to guide further refinements of the four experiences. A human screen-reader assessment is the next useful accessibility milestone; verified career examples and direct contact details remain pending. Do not expand the catalog or create cosmetic churn to meet contribution counts.

## Connection puzzle saved progress — October 12

- [x] Reproduce a stale second tab overwriting another tab's saved moves. Extract a focused progress controller and reconcile validated saves on storage/focus changes and before writes, preserving each tab's selection and keyboard focus. Invalidate only changed-board Undo and hints; keep play usable after corrupt data or quota failures. Cover two-tab play, delayed notifications, cleared/corrupt saves, and continued play without storage in Chromium and WebKit.

Next: collect visitor feedback on the four games and complete a human screen-reader assessment. Add concrete professional feature outcomes and direct contact information only when verified user details arrive; do not add games or split fixes to fill contribution counts.

## Portfolio improvement milestone — October 13

- [x] Prerender career content with native résumé/contact navigation and hydrate the same components. Cover disabled/blocked JavaScript and theme hydration without duplicate content.

- [x] Add release manifests and an automated deployed-asset verifier. Gate the Pages deployment on its source/asset integrity and support comparing the existing private preview with credentials supplied only through stdin. Cover stale source, mismatched assets, malformed manifests, and credential-origin restrictions.

- [x] Gate builds on explicit asset size budgets and CI on three-run median mobile loading metrics. Reject missing measurements and sustained regressions while tolerating one noisy measurement.

- [x] Add Motion Studio's reusable CSS recipe, matching its current curve and duration with a reduced-motion alternative and a selectable clipboard fallback.

- [x] Give Algorithm Garden three distinct authored trees with working breadth/depth traversal, hints, completion feedback, and stable re-selection. Validate all tree topologies and solve the new shapes by keyboard in both browsers.

- [x] Add an optional queue/stack explanation to Algorithm Garden. Show the actual pending frontier, newly added children, and next node, derived from the same traversal steps as the game.

- [x] Add optional Cache Rescue predictions with validated guesses, locked playback inputs, outcome explanations, and scenario/reset handling. Keep prediction-free play and reduced-motion results available.

- [x] Record puzzle completions and separate personal bests with/without hints. Preserve assistance and rotation counts through Undo, reloads, and tab synchronization; retain records on reset and migrate old saves without inventing results.

- [x] Add concise optional implementation notes to all four experiences, with concrete decisions, tradeoffs, test coverage, and source links. Keep the four-card collection and experience-first page order.

- [x] Verify 144 unit/integration/architecture checks and 118 Chromium/WebKit journeys, including the expanded controls at 320px and 1440px in both themes. Review game screenshots and pass the mobile performance gates: median LCP 2.10s, CLS 0.0004, and TBT 0ms across three local runs.

- [x] Correct the private deployment verifier's bearer authentication and canonical index request after observing Sites' 401/307 responses. Ignore only the recognized provider-injected Cloudflare challenge when hashing private HTML, with tests that still reject changed content/application scripts. Retain exact-origin scoping and redirect rejection. Configure the Linux Actions loopback audit's Chromium launch after its debugging port failed to open; hosted-URL audits keep the default sandbox.

- [x] Clarify deployment integrity tests with explicit expected/mismatched responses and direct response variables.

Next: refine the four experiences from visitor feedback and complete a human screen-reader assessment. Verified professional outcomes and direct contact details remain pending.

## Experience descriptions — October 13

- [x] Complete all five experience entries with concise role summaries drawn from the existing verified responsibilities. Keep the detailed contributions and original employment periods, and include the summaries in the PDF and plain-text résumé.
- [x] Retain OpenCode’s optional contact fields without adding unverified email, phone, or scheduling links; LinkedIn remains the published contact channel.
- [x] Pass all 145 unit/integration checks, 118 Chromium/WebKit journeys, and the production build. Inspect responsive theme layouts and both pages of the generated résumé.

Specific project outcomes and direct contact details still require verified facts; role summaries describe the work already confirmed.

## Signal Sculpture — approved fifth experience

- [x] Add a lazy-loaded particle sculpture with authored JSR, ribbon, and orbit forms, dissolving transitions, depth projection, optional mouse perspective, and a pulse wave. Keep the original four experiences and recruiter-first page order.
- [x] Give the monogram a slow full rotation, rather than a nearly imperceptible rocking motion, following user feedback. Use the existing pausable clock and keep reduced-motion forms static.
- [x] Provide explicit Play/Pause, Pulse, and Reset controls, keyboard/touch operation, static reduced-motion compositions, and a canvas-unavailable SVG fallback. Stop playback on navigation, offscreen changes, hidden tabs, and motion-preference changes; returning waits for Play.
- [x] Separate deterministic domain geometry from the feature-local canvas renderer and React controls. Limit small-screen particle counts and drawing resolution without adding a graphics dependency or changing build policy.
- [x] Inspect desktop and 320px layouts in both themes. Extend checks to actual canvas-pixel changes and pause stability, hidden-document recovery, static fallback, native collection links, and 200% default text. Add wrap-safe headings, collection labels, and contribution text after the 320px enlarged-text check exposed overflow.

Verification: `npm run check` passes with 147 unit/integration/architecture tests and all asset budgets. All 136 Chromium/WebKit journeys pass, including the 18 focused sculpture checks. Reviewed paused and rotating monograms at desktop and 320px widths in both themes. The three-run mobile Lighthouse gate passes with median LCP 2.03s, CLS 0.0004, and TBT 0ms; these are local simulated measurements, not real-user results.

## Gravity Loom — October 14

- [x] Add the requested sixth experience with glowing trail histories, Orbit and counter-rotating Weave fields, adjustable strength, and up to four numbered attractors. Retain the existing five experiences and recruiter-first page order.
- [x] Support direct field taps and equivalent named-position controls for keyboard/touch users. Keep explicit play, pause/resume, field reset, and bounded attractor removal; changing the field starts a fresh pattern. Use one feedback announcement and expose the slider's percentage through its accessible value.
- [x] Keep field motion in a pure, deterministic domain model with softened forces, smooth edge steering, capped speeds, and safety boundaries. Use a feature-local canvas renderer with fixed steps, capped catch-up, bounded trails, and fewer mobile threads; add no graphics dependency.
- [x] Retain static finished artwork for reduced motion and a selectable SVG fallback when canvas is unavailable. Stop playback on navigation, hidden documents, motion changes, and offscreen changes, without autoplay on return.
- [x] Verify 150 unit/integration/architecture tests and all asset budgets through `npm run check`. Run all 154 Chromium/WebKit journeys: 153 passed in the full run; one unchanged WebKit accessibility scan timed out and passed its isolated rerun. Stabilize Signal Sculpture's functional test by keeping its arena and controls visible together, while preserving separate offscreen tests.
- [x] Review desktop/mobile layouts in both themes, static and playing, keyboard actions, touch placement, and 200% text reflow. Pass the three-run mobile Lighthouse gate with median LCP 1.99s, CLS 0.0004, and TBT 0ms. These are local simulated measurements, not hosted real-user results.

Next: gather feedback on the two visual art experiences rather than expanding the collection again. Human screen-reader listening and further verified professional/contact details remain separate follow-ups.

## Gravity Loom direct manipulation — October 14 feedback

- [x] Replace click-to-configure behavior with mouse/touch dragging of a selected live attractor. Hold its pull more strongly and retain a short release impulse so threads visibly follow the user's hand. Capture the pointer, handle cancellation, and clear active gestures on interruption.
- [x] Preserve particles, velocities, and trail histories through live field, strength, and flow edits. Start from the displayed preview's actual final state instead of reseeding on Play; only Reset rebuilds normal-motion artwork.
- [x] Add focused-field arrow steering, Space play/pause, Escape stop, named-position Move here, and optional native directional controls. Movement explicitly starts playback, while hover does not. Keep reduced-motion and canvas-unavailable modes static, with page scrolling available outside the touch-drag field.
- [x] Pass `npm run check` with 152 unit/integration/architecture tests and all 160 Chromium/WebKit journeys. Cover continuous scene endpoints, stronger held-point response, moving-field bounds, preserved paused histories, pointer capture/release, cancellation, keyboard alternatives, and static modes.
- [x] Inspect live mouse and native Chromium touch drags at desktop/320px widths in both themes, including unchanged page scroll during a touch drag. Pass three-run mobile performance gates: median LCP 2.04s, CLS 0.0004, and TBT 0ms (local simulation, not real-user measurements).

## Usability, touch, and recruiter review — October 15

- [x] Reproduce and fix off-center point grabs jumping before movement. Keep the pointer-to-point offset through dragging and scope pointer cancellation to the active pointer, so a secondary touch cannot end the primary grab.
- [x] Prevent held Space from toggling playback repeatedly, without suppressing repeated arrow movement. Share coordinate descriptions between the visible fine-control readout and the atomic status so successive keyboard moves have distinct position feedback.
- [x] Enlarge résumé resource hit areas to at least 44px, name them as a semantic group, increase Contact body copy from 11px on mobile to 16px, and allow its action to wrap at enlarged text sizes. Preserve verified content and generated résumé data.
- [x] Add keyboard and native-touch regression checks, native Chromium drag-versus-page-scroll coverage, and both-theme 320px recruiter journeys that download and validate PDF/text exports, reach Contact, and check 200% reflow. Eight new regression cases failed against the original implementation before fixes.
- [x] Pass `npm run check` (152 unit/integration/architecture tests and production asset budgets). The full browser run passes 173 checks with one explicit WebKit skip for Chromium-only CDP touch-move injection; WebKit native touch taps, dragging by mouse, keyboard, and recruiter checks pass. Also cover safe release feedback if a keyboard command removes a point during a grab. Run used two workers and a 60-second per-test limit after local browser contention.
- [x] Inspect Experience, résumé resources, and Contact at desktop/mobile sizes in both themes, plus landscape Gravity Loom and the existing reduced-motion journeys. Add a [human review guide](docs/USABILITY_REVIEW.md) linked from contributor instructions.
- [ ] Observe a willing first-time visitor attempting neutral tasks without coaching. No new visitor session was conducted by the agent.
- [ ] Complete physical-phone touch review and a human screen-reader listening session. Emulation, axe, and semantic/focus checks are not substitutes.

## Gravity Loom full-field dragging — October 15 feedback

- [x] Replace the shortest-side-square projection with a shared rectangular viewport mapping for canvas, pointer hit testing, and SVG fallback. Allow points to reach every side/corner with a 24px handle margin and preserve normalized positions when resizing.
- [x] Expand the model's valid coordinates and safety bounds to ±1 and move soft frame steering toward the outer edge, so trails can follow a held point beyond the former central restriction. Retain speed caps, fixed steps, grab offsets, and reduced-motion behavior.
- [x] Verify forward/inverse projection, bounded moving fields, and a held corner pull in unit tests. Browser checks inspect painted marker pixels at all four corners in both themes at 320px/1440px, and verify SVG edge placement through portrait/desktop/landscape resizing. The full-field cases pass three repeated runs in Chromium and WebKit.
- [x] Pass `npm run check` with 154 unit/integration/architecture tests and production asset budgets. Complete the full browser coverage across the restart: 92 Chromium passes, then 91 WebKit passes with the existing Chromium-only touch-injection skip. Inspect live mouse and native Chromium touch drags toward the outer edge in both themes at desktop/mobile sizes.

## Anatomy single-flight press — October 15

- [x] Install the requested Anatomy skill locally with its MIT license, kit, references, scripts, and examples pinned to an upstream commit. Current provenance and authoring commands are in [the engine notes](docs/JET_ENGINE.md).
- [x] Use the kit to build an original 52-part isometric duplicating press as Cache Rescue's default Machine view. Keep the existing Request map, all six experiences, and the recruiter-first layout.
- [x] Drive card identities, trays, origin-read counts, waiting, and delivered replies from the existing deterministic model. Derive die movement from first-fetch progress without another clock or idle autoplay. Preserve playback, predictions, and keyboard focus when switching views, with the existing reduced-motion and interruption policy.
- [x] Keep geometry generation authoring-only, ship finished SVG data in the existing lazy Cache Rescue bundle, and enforce the exact skill-kit dependency exception without allowing application imports from skills.

- [x] Pass `npm run check` with 156 unit/integration/architecture tests and production asset budgets. Complete all 191 applicable Chromium/WebKit journeys, including eight new press checks; retain the existing Chromium-only touch-injection skip. The first combined run hit its shell time limit and one broad Chromium review timed out under four-worker contention; that review passes on rerun with two workers, and the full WebKit run passes with two workers and a 60-second test limit.
- [x] Inspect desktop and 390px layouts, both themes, completed and paused mid-stroke states, and 4× mechanism close-ups. Anatomy reports zero floating line ends and clean consoles at rest, completed, and paused mid-stroke in both themes. Browser checks also cover 320px with 200% text and axe scans.
- [x] Pass the three-run mobile Lighthouse gate with median LCP 1.98s, CLS 0.0004, and TBT 4.5ms. These are local simulated measurements, not hosted real-user results.

The mechanical drawing is an analogy, not a production measurement or a model of press throughput. Human screen-reader and physical-device assessments remain separate from these automated checks.

## Direct Anatomy interaction — October 15 feedback

The user found the cache/press analogy unclear and requested a separate experience where input visibly changes the mechanism. This supersedes the press presentation above.

- [x] Restore Cache Rescue's original request map and remove its press view, authoring script, generated art, and press-specific checks. Keep Anatomy installed.
- [x] Add Pin & bolt as a seventh independently loaded experience: five movable pins, visible steel followers and springs, blocked-attempt feedback, a sliding bolt, three cut patterns, and a liftable inspection cover.
- [x] Provide direct pin dragging with preserved grab offset and pointer capture, plus equivalent native sliders and step buttons. Keep alignment and opening policy in a pure model and generate geometry from the same cut patterns.

- [x] Verify each authored pattern against all 7,776 combinations, input bounds, and reproducible geometry generated from the same domain cuts. Pass `npm run check` with 157 unit/integration/architecture tests and unchanged production budgets.
- [x] Pass all 191 applicable Chromium/WebKit journeys, with the existing Chromium-only touch-injection skip. New checks assert actual pin/bolt/cover displacement, jams, all three solutions, preserved re-selection, dragging with grab offset, navigation release, and both-theme native touch controls at 320px with 200% text. An earlier run had one intermittent, unchanged WebKit Loom touch failure; the final complete run passes.
- [x] Inspect closed/open mechanisms and the compact mobile pin chooser at 1440px/390px in both themes, plus 4× close-ups. Anatomy line checks pass with zero floating ends at initial, aligned, and open/cover-lifted states in both themes, with clean consoles. Keep the spring beam in front of its attachment points so lifting the cover does not reveal incorrectly painted wire ends.
- [x] Pass the three-run mobile Lighthouse gate with median LCP 1.97s, CLS 0.0004, and TBT 0ms. These are local simulated measurements, not hosted real-user results.

This is a mechanical puzzle, not a real security simulation. Physical-device and human screen-reader review remain separate follow-ups.

## Jet Engine — requested Anatomy replacement

The user found the lock unclear and too simple, and requested an aircraft engine whose air animation visibly responds to speed. This replaces the seventh experience, rather than adding another activity.

- [x] Replace Pin & bolt with an Anatomy Hero turbofan: a cutaway nacelle/core, eighteen intake fan blades, six inner blade rows, shaft/couplings, guide vanes, and a stand. Keep the other six pieces unchanged and route the former local lock anchor to the engine.
- [x] Drive visible rotation, tracer speed/density, heated-core emphasis, and exhaust reach from one normalized engine-speed control, with Idle/Cruise/Full power shortcuts. Keep the behavior explanatory rather than a puzzle; show four short stage descriptions and distinguish cool bypass air from heated core air.
- [x] Keep per-frame drawing in one capped-resolution canvas between theme-specific Anatomy SVG assets. Use the same projection for fixed and moving parts, explicit playback/interruption, a static reduced-motion composition, and an SVG/canvas-denial alternative. Handle failed casing assets with an honest reload.

- [x] Pass `npm run check` with 158 unit/integration/architecture checks, the existing production budgets, and an 80 KiB compressed limit for both theme pairs of engine SVG source. Keep the initial résumé path independent of the new artwork.
- [x] Pass Anatomy's static audit: 334 recorded solids across 62 fixed parts, with zero support, clearance, depth-order, or other audit problems. Bound the 78 moving blades separately by their shared radial geometry and axial spacing. Check the combined fixed SVG layers in both themes with zero floating line ends; inspect 4× close-ups and slowed contact sheets with confirmed active fan/airflow clocks.
- [x] Pass all 18 engine-specific Chromium/WebKit checks, including actual fan/air pixel changes at low/high speed, zero-flow Off, exact pause stability, interruption, reduced motion, canvas denial, failed artwork recovery, delayed-image geometry reservation, legacy entry, and 320px enlarged-text/native-touch controls. Inspect 1440px and 390px compositions in both themes without page overflow.
- [x] Complete the 202-case portfolio browser run: 199 pass, one existing Chromium-only touch-injection skip, and two failures in unchanged WebKit Motion Studio/Gravity Loom journeys. Both failing journeys pass twice each when rerun serially. No unrelated game behavior was changed to mask those timing/pointer failures.
- [x] Pass the three-run mobile Lighthouse gate with median LCP 2.22s, CLS 0.0004, and TBT 66ms. These are local simulated measurements, not hosted real-user results.

The engine is a deliberately slowed illustration, not real operating data or a thermodynamic simulation. Physical-device and human screen-reader review remain separate follow-ups.

## Direct experience landing — October 16

- [x] Reproduce WebKit moving a directly linked Gravity Loom heading above the viewport after nearby lazy content loads. The failing drag trace clicked at viewport y = -22; a separate browser inspection confirmed the misplaced landing.
- [x] Keep an uninterrupted, focused experience entry aligned after layout changes, with animation-frame coalescing and cleanup. Preserve the existing wheel/touch/pointer/keyboard interruption policy, native focus, reduced motion, and navigation away.
- [x] Add Chromium/WebKit coverage for settled normal/reduced-motion landings, delayed neighboring imports, and scrolling away before completion. The new cases and original drag journey pass three repetitions in both browsers (30 checks).
- [x] Pass `npm run check` with 158 unit/integration/architecture tests and production asset budgets, then the complete browser suite with 209 passes and the existing Chromium-only touch-injection skip. Inspect the corrected WebKit landing and desktop/mobile engine, contact, and field layouts in both themes. The three-run local mobile Lighthouse gate passes with median LCP 1.95s, CLS 0.0004, and TBT 0ms; these are simulated measurements.

Next: refine the existing experiences from visitor feedback. Human accessibility/device sessions and verified contact/project outcomes remain outstanding.

## Portable engine generation — October 16

- [x] Address the Linux release gate's artwork reproducibility failure by serializing projection metadata at eight decimal places, instead of platform-dependent trigonometric trailing bits. Retain exact comparisons for all generated files and include the affected filename in mismatch errors. The four SVG drawings remain unchanged.
- [x] Pass the existing 158 unit/integration/architecture checks, production build, and artwork regeneration on local Node 24 and Node 25. The largest metadata number adjustment is less than 0.000000005; visible geometry remains unchanged at screen resolution.
- [x] Re-run the complete Chromium/WebKit suite after regeneration: 209 passes and the existing Chromium-only touch-injection skip.

Next: confirm the Linux release gate and matching public/private asset manifests, then continue with the visitor-led refinements above.

## Collection order — October 16

- [x] Apply the requested sequence to both the chooser and full experiences: Jet Engine, Gravity Loom, Signal Sculpture, Motion Studio, Connection puzzle, Cache Rescue, and Algorithm Garden. Match every header number to its card and load Jet Engine on collection entry.
- [x] Preserve direct anchors and the former lock alias. Update browser coverage for card/article order, numbering, the first lazy download, and delayed preceding content.
- [x] Extend immediate keyboard navigation to collection cards, experience destinations, and lab controls. This prevents an unfinished native smooth scroll from competing with the visitor's next action. Keep pointer transitions and reduced-motion behavior, and check playback interruption with actual wheel input.
- [x] Pass 158 unit/integration/architecture checks, the production build and asset budgets, and all 209 applicable Chromium/WebKit journeys (one existing platform-specific skip). Inspect the ordered cards at desktop/mobile sizes in both themes without horizontal overflow.

Next: continue refining these experiences from visitor feedback; verified contact/project outcomes and human usability sessions remain outstanding.

## Stack map request flow — October 16

- [x] Animate the existing four-layer map as a browser request, backend validation, data lookup, result, response construction, and browser rendering. Keep infrastructure as the hosting layer rather than implying that it is another request hop. Clearly label the flow as illustrative, not live traffic.
- [x] Start a calm tour on the first visible visit, with Pause and explicit Replay. Stop for keyboard layer exploration, navigation, offscreen/hidden changes, and motion-preference changes. Keep selectable technology panels independent of the animation and provide a static reduced-motion explanation.
- [x] Reserve the intrinsic height of every readout, and measure connections from card edges so packets stay visible along the gaps at different widths and text sizes. Use CSS/SVG motion with one timer per step, cleaned-up observers, and no new dependency or network request.
- [x] Pass `npm run check` with 158 unit/integration/architecture checks and production asset budgets. Verify the round-trip sequence, exact packet endpoints, pause/replay, keyboard selection, hidden/offscreen/navigation interruption, and live reduced-motion changes in Chromium and WebKit. Inspect both themes on desktop/mobile, a paused packet mid-route, and 320px with 200% text without horizontal overflow. Keep the mobile overview's existing résumé proximity check passing.
- [x] Complete the full browser run with 213 passes, the existing Chromium-only touch-injection skip, and two Chromium Motion Studio scroll/replay failures. Both failures remain on a serial rerun; no Motion Studio code was changed to mask them. After the final enlarged-text/focus refinements, all 26 stack-flow, stable-panel, and portfolio checks pass in both browsers; six of eight Motion Studio lifecycle checks pass.

### Automatic flow and color semantics — follow-up

- [x] Replace the selected layer's solid blue fill with a neutral border. Let blue follow active request processing, and give Infrastructure a subtle persistent tint and dashed border to distinguish hosting from a request hop.
- [x] Remove Pause/Replay controls at the user's request. Run automatically while visible, pause for hidden tabs, offscreen changes, keyboard exploration, and reduced motion, and restart from the browser when eligible again. Retain independent, stable detail selection.
- [x] Pass `npm run check`, all 26 focused portfolio/map checks, and desktop/mobile inspection in both themes, including 320px at 200% text. The full run has 212 passes, one existing platform skip, the two previously reported Chromium Motion Studio failures, and a WebKit flow-test clock race. Freeze the sequence test's clock before navigation; all 18 flow checks then pass across three repetitions in both browsers. No application behavior was changed for that test race.

## Mobile release recovery — October 17

- [x] Place the mobile stack-flow counter beside its reserved-height description and tighten the readout's top spacing. Keep the request tour, readable text, stable layer panels, and the existing résumé-proximity limit; do not relax the failing release assertion.
- [x] Correct the narrow-container rule to stack the actual topology grid, rather than its flex wrapper. At 320px with 200% text, each layer gets the full width; keep controls, content, and selection usable without horizontal overflow.
- [x] Trace the Motion Studio replay failures to Chromium continuing a synthetic wheel gesture after the viewport reaches the page edge. Wait for native scroll completion before the test begins another navigation; retain offscreen interruption and explicit-replay assertions without changing game behavior.
- [x] Aim the delayed-entry wheel test at the experience heading instead of the default pointer position inside the separately scrollable identity rail. Keep its assertion that late content must not pull a visitor back.
- [x] Wait for Gravity Loom's reduced-motion state to render before testing subsequent arrow-key announcements, so the test does not race the browser preference event.

- [x] Pass all 158 unit/integration/architecture checks, the production build and asset budgets, and 215 Chromium/WebKit journeys with the existing platform-specific skip. Repeat the direct-entry cases three times in both browsers (24 passes), and visually inspect desktop/mobile themes and the one-column 320px/200% text layout.

- [x] The first GitHub run passes the mobile layout check but exposes a WebKit/Linux wheel-target failure in the Motion Studio check. Position the pointer over the visible Play control before starting playback instead of sending the later wheel input from the untouched viewport edge; retain the offscreen, interruption, and explicit-replay requirements. Pass `npm run check`, 40 repeated lifecycle checks, and the full 215-pass browser suite with its existing platform skip.

Next: collect first-time visitor feedback, physical-phone observations, and a human screen-reader assessment. Add verified project outcomes and direct contact details when supplied; further technical work should address concrete findings.

## Infrastructure experience — October 17

- [x] Add Jhon's directly confirmed Linux and PM2 experience to Infrastructure, grouped under Operating systems and Process management. Reuse the shared technology data for both résumé downloads and keep Azure/AWS qualifications intact.
- [x] Pass `npm run check` and all 215 browser checks with the existing platform skip. Inspect the panel at desktop/mobile sizes in both themes, confirm stable layer heights, and visually verify both pages of the regenerated résumé.

Next: continue from concrete visitor findings and new verified profile details.

## Viewport autoplay — October 21 feedback

- [x] Start Jet Engine and Gravity Loom when their drawing enters view, including ordinary scrolling and direct links. Suspend them offscreen and in hidden tabs, then resume without overriding a visitor’s Pause or Reset. Keep reduced-motion and unavailable-renderer views static.
- [x] Share the opt-in lifecycle hook while retaining each renderer, engine speed controls, Loom dragging/keyboard input, and the other experiences’ playback policies. Update the controls’ explanations and current architecture/product documentation.

- [x] Pass `npm run check` with 158 unit/integration/architecture checks and the production build/asset budgets. Pass 225 Chromium/WebKit journeys with the existing platform-specific skip, including viewport entry, hidden-tab return, manual pause/reset persistence, live reduced-motion changes, static drag interruption, and unavailable IntersectionObserver. Inspect desktop/mobile artwork and controls in both themes.

- [x] Trace the Linux WebKit release failure to a redundant repaint on paused flow changes: the CI images differed in only 4–14 low-alpha pixels while retaining the same trails. Preserve the existing canvas when only future flow/strength settings change; still redraw changed attractors and reduced-motion compositions. Keep the strict paused-image assertion. Repeat `npm run check` and the full browser suite after this fix: 158 checks and 225 browser passes with the existing platform skip.

Next: continue from concrete visitor findings and verified profile details; collect physical-phone and human screen-reader feedback.

## Signal Sculpture autoplay — October 21 follow-up

- [x] Use the shared viewport playback policy for Signal Sculpture: start when its drawing enters view, suspend offscreen or in hidden tabs, and resume on return. Preserve manual Pause/Reset, reduced-motion static forms, canvas fallback, and form/Pulse controls.
- [x] Extend the common lifecycle journeys to the sculpture and verify actual canvas motion/frozen pixels alongside form transitions, keyboard controls, and static accessibility checks. Pass `npm run check` with 158 code checks and the production build/asset budgets, plus 231 Chromium/WebKit journeys with the existing platform-specific skip. Inspect desktop/mobile views in both themes.

Next: continue from concrete visitor findings and verified profile details; physical-phone and human screen-reader assessments remain outstanding.

## Signal Sculpture pointer response — October 21

- [x] Replace depth-weighted mouse offsets with a bounded view tilt and small pan, so cursor feedback stays perceptible throughout the sculpture's rotation. Ease both entry and return to center in the existing animation loop.
- [x] Keep Pause pixel-stable, clear stale pointer targets on interruption, and reset the view for reduced motion and Reset. Retain independent automatic rotation, forms, Pulse, and touch/keyboard controls.
- [x] Pass 160 unit/integration/architecture checks, the production build and asset budgets, and 235 Chromium/WebKit journeys with the existing platform-specific skip. Repeat pointer journeys 12 times after making their frozen-clock entry setup explicit. Check actual pointer-driven pixels, gradual entry/exit, paused/reduced-motion stability, and desktop/mobile views in both themes.

Next: continue from concrete visitor feedback; physical-phone and human screen-reader assessments remain outstanding.

### Pointer release checks — follow-up

- [x] Address Linux WebKit's 30-second test limit by giving each sculpture form its own pointer journey. Compare SHA-256 hashes of all raw canvas pixels instead of repeatedly PNG-encoding and transferring full images; preserve every entry/exit, directional-response, pause, and reduced-motion assertion.

- [x] Pass 160 code checks and the production build, plus all 12 per-form pointer cases in the full Chromium/WebKit run. The local full run completes 240 cases and hits four unrelated WebKit timeouts, including page creation; the affected files then pass eight serial cases with the existing platform-specific skip. An earlier isolated reduced-motion entry failure passes all six repetitions without an application change.

Next: verify the hosted release and matching deployment manifests, then continue from visitor feedback.

## Documentation and architecture review — October 22

- [x] Reconcile AGENTS, README, ARCHITECTURE, contributor instructions, server documentation, and the historical case study with the current seven-experience application. Remove runnable-dashboard instructions from the optional API guide and distinguish archived browser evidence from current coverage.
- [x] Harden dependency validation at the browser entry and app layer. Reject Node/build/skill imports from browser code and keep the server-rendering entry build-only; cover re-exports, lazy imports, CommonJS, and import types with explicit rejection fixtures. Retain the existing feature/domain/controller/renderer structure without adding inheritance or a service container.
- [x] Add automated checks for first-party Markdown links/anchors, documented npm script names, and all eight bundled skill entrypoints and their concrete local resources. Smoke-test UI UX Pro Max's React and UX searches; document companion skills' Claude-specific examples and unavailable optional tooling without rewriting the vendor snapshot.
- [x] Pass `npm run check`: lint, formatting, 164 unit/integration/documentation/architecture checks, strict types, résumé generation, prerendering, release manifest, and asset budgets. Pass 243 Chromium/WebKit browser cases with the existing Chromium-only touch-injection skip. Inspect the desktop production overview; existing browser cases cover mobile layouts, both themes, keyboard, reduced motion, fallback/recovery, and hydration.

No application behavior or career claims changed. External documentation URLs, every optional third-party skill workflow, hosted publication, physical phones, and human screen-reader listening were not revalidated by this review.

## CI/CD hardening — October 22

- [x] Preserve the existing code/build, Chromium/WebKit, accessibility, asset-budget, mobile Lighthouse, and post-deployment integrity gates. Add an all-dependency high/critical audit; update only Vite from 6.4.3 to 6.4.5 within the existing major. The current audit reports zero vulnerabilities.
- [x] Pin workflow actions to verified upstream commit SHAs, disable persisted checkout credentials, bound job durations, and restrict Pages publication explicitly to main. Separate deployed-asset verification into a read-only job so dependency installation never shares Pages/OIDC write permissions. Serialize main runs through verification while still cancelling superseded PR runs.
- [x] Retain browser HTML/JSON reports, failed-attempt traces/screenshots, and available Lighthouse reports for 14 days, including validation failures. Keep the single CI retry and every existing test assertion/threshold unchanged; expose retries/flaky outcomes rather than silently masking them.
- [x] Enable GitHub's Dependabot alerts and automated security updates, and configure weekly npm/Actions update PRs without auto-merge. Enable main protection requiring an up-to-date GitHub Actions `build` check, including for admins, with force-push and deletion disabled. GitHub opened its first automated Vite security-update PR, confirming that automation is active; the combined hardening change includes the same fix.
- [x] Validate workflow syntax with checksum-verified actionlint 1.7.12, parse the Dependabot configuration, and pass `npm run check` (164 checks and production build/budgets). Run the full browser suite with CI reporters: 243 passes, the existing platform-specific skip, and no flakes. Verify generated HTML/JSON reports. Use an isolated preview on port 4183 because 4173 was occupied; leave that server untouched. Pass sequential mobile Lighthouse gates with median LCP 2.13s, CLS 0.0004, and TBT 0ms; these are local simulated measurements.

GitHub protection/security settings are already active. Workflow/dependency changes take effect after their reviewed branch is merged; publication and private Sites settings are unchanged by this hardening work.

### Runner migration recovery — October 22

- [x] Merge the verified hardening PR through its required check. The PR run passes all 243 browser cases with the existing skip, dependency auditing, and Lighthouse; its diagnostic artifact is available on GitHub.
- [x] Diagnose the main release stopping before publication: Ubuntu 26.04's package mirror downloads consume the 20-minute job limit during Playwright installation. The successful PR also used Ubuntu 26, so this is not evidence that the OS is unsupported or the application tests failed. The previous public deployment remains in place.
- [x] Pin all release jobs to supported Ubuntu 24.04 so runner OS changes are deliberate, and give browser installation a five-minute step limit. Preserve the full browser suite, performance thresholds, permissions, and overall job deadlines. Local actionlint and `npm run check` pass; publication remains blocked until the follow-up passes the protected PR check.

### Preinstalled browser environment — October 22

- [x] Confirm the Ubuntu 24.04 main run also times out downloading browser OS dependencies from the Azure Ubuntu mirror, before browser tests start. The application checks pass; increasing test retries would not address this setup failure.
- [x] Run validation in the official Playwright Noble image pinned to a registry-verified digest and the installed Playwright version. Keep Node 24, the full browser/performance gates, existing permissions, and the separate publication/verification jobs. Add a toolchain check that requires coordinated Playwright/image updates.
- [x] Pass checksum-verified actionlint, `npm run check` with 165 code checks and the production build/budgets, and all 243 local Chromium/WebKit cases with the existing platform-specific skip. The Linux container and its performance gate still require the protected PR run.
- [x] Use the PR run to identify Git's ownership check on the host-mounted checkout after all 165 code tests and Vite succeed. Trust only that job's exact `GITHUB_WORKSPACE` path inside its ephemeral container so release fingerprinting can read HEAD; keep checkout credentials disabled and do not use a wildcard trust rule.

Next: validate this environment through the protected PR, then verify both published hosts at the tested release. Continue product work from concrete visitor findings and verified profile details.
