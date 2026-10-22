# Visitor and accessibility review

This is a repeatable review guide, not a claim of completed human testing. Automated browser checks, axe scans, and accessibility-tree inspection cannot stand in for a visitor observation or a screen-reader listening session.

## Current evidence and limits

- The October 15 implementation review reproduced point jumps on off-center grabs, secondary-pointer cancellation ending the primary drag, repeated Space toggles, unchanged arrow-movement status text, small résumé links, and 11px mobile contact copy. Regression coverage lives in `e2e/review-journeys.spec.ts`.
- Chromium and WebKit can exercise keyboard, layout, native touch taps, downloads, and semantic checks. Native touch-move/scroll injection in the new review test uses Chromium CDP and is explicitly skipped in WebKit. Neither desktop engine emulation is a physical iPhone assessment.
- **Still pending:** a new visitor attempting the tasks below, physical-device touch review, and a human screen-reader listening session. Do not mark these complete based on automated results.

| Session                 | Status  | Evidence needed                                                       |
| ----------------------- | ------- | --------------------------------------------------------------------- |
| First-time visitor      | Not run | Consented, anonymized task observations                               |
| Physical phone          | Not run | Actual device/browser, orientation, text size, and observed behavior  |
| Screen-reader listening | Not run | Actual OS/browser/assistive technology and what the participant heard |

Automated checks for the site's motion preference and lab wayfinding live in `e2e/motion-settings.spec.ts` and `e2e/experience-navigation.spec.ts`. Passing those checks does not change the session statuses above.

## First-time visitor session

Ask a willing person who has not used the experience. Explain that the interface—not the participant—is being evaluated. Do not coach them, require a recording, or publish names, private conversations, contact details, or raw interview notes.

Start on Overview, without pointing out controls. Give goals rather than gesture instructions:

1. “Find the developer’s recent experience, get a résumé, and find a way to contact them.”
2. “Make this page calmer while you read it.”
3. “Try one experiment, go to another, then return to the experiment chooser.”
4. In Gravity Loom: “Make the drawing change direction.”
5. “Control a different point.”
6. “Stop it, then continue.”

Observe their first action, whether they find the controllable points and selected-point feedback, where they hesitate, and whether they recover unaided. Afterwards ask what they expected and what felt surprising. Keep only consented, anonymized issue summaries; do not invent success rates or participants. Turn reproducible problems into focused fixes and tests.

Keep the following moderator checks separate from the participant's tasks so they do not become instructions: can the visitor discover Motion settings, distinguish the site preference from the device preference, use Previous/Next and Back to collection, and understand which map details they selected? Record hesitation as an observation, not a guessed motive.

## Real-phone touch session

Use a small phone in light/dark themes, portrait/landscape, and with larger text:

- Grab the edge of a glowing point: it should not jump before the finger moves.
- Drag it, release, select another, and use the non-drag controls. Verify movement, selection, and retained trails.
- Move a point to every side/corner of the field in portrait and landscape. It should reach the visible edge margin rather than stop inside a central square; repeat after rotating/resizing.
- Drag inside the field: the drawing should respond without moving the page. Swipe the surrounding page: scrolling should remain available. Inspect short landscape screens as well as portrait.
- Interrupt a drag by switching tabs/apps or changing motion preferences. A drag must release. On return, autoplay may resume only when the visitor has not manually paused/stopped and reduced motion is off; a manual pause must remain respected.
- Use Motion settings to choose Reduce animation, then scroll through the map and all three autoplay drawings. They should remain still, with controls and static explanations available. Reload, change the preference in another tab, and test Follow device with the OS reduced-motion setting both on and off.
- Enable reduced motion: move points and use native controls without continuous animation. Test the settings disclosure at enlarged text sizes and verify it does not cover the control that has keyboard focus after closing.
- Use Previous/Next and Back to collection in portrait and landscape, including 200% text. Links should remain readable and at least 44px high, preserve the page's query context, and land at the expected heading or chooser.

## Screen-reader listening session

Prefer a tester using their usual assistive technology. Suggested combinations are VoiceOver with Safari/iOS and NVDA with Firefox or Chrome. Record only browser/OS/assistive-technology versions and sanitized findings, not personal information. State exactly which combinations were actually tested.

1. Use the skip link, headings, and main navigation. Check meaningful order, focus arrival, and a single copy of career content after hydration.
2. Read experience dates and contributions. Confirm role summaries, overlapping dates, and qualified experience remain intelligible.
3. Activate PDF and plain-text downloads; verify the filenames and usable content. Reach Contact and identify the LinkedIn destination.
4. Enter Gravity Loom. Listen to the field's name/instructions and status. Do not assume screen-reader browse-mode arrows are passed to custom controls: verify the native **Move a point without dragging** controls independently.
5. Select a point, move it repeatedly, change strength/flow, pause, and reset. Listen for meaningful changing positions, selected/disabled states, lost focus, silence, duplicates, or excessive announcements. No particle frame should be a live announcement.
6. Find Motion settings and operate its native radio group. Listen to selected preference and effective motion feedback, including when the device itself requests reduced motion. Escape should close the disclosure and return focus to its summary; Tab must remain free to leave it.
7. Use an experience's Previous/Next and Back to collection links. Check the link's destination name, heading/chooser focus, reading order, browser Back, and the first/last boundaries. No focus trap or loop is expected.
8. Repeat key actions with reduced motion and enlarged text. Separate what was heard from what was only inspected in the DOM.

## Recruiter path

At 320px and a typical larger phone width, in both themes:

- Reach Experience from Overview and the menu; read the current role and its project contributions.
- Activate both résumé links by keyboard/touch. Confirm nonempty PDF/text exports and retained verified content.
- Reach Contact, read the opportunity statement without zooming by necessity, and identify the verified LinkedIn link. Do not add unverified contact channels.
- Increase default text size to 200%; check wrapping, focus visibility, and no horizontal page overflow. Recheck with JavaScript disabled using the existing prerender journeys.

## Closing a finding

Note the task, environment, observed behavior, expected behavior, reproduction, fix/test reference, and remaining limitations. Keep human observations distinct from automated evidence. Update [ROADMAP](../ROADMAP.md) only when a review or improvement actually completes; follow [CONTRIBUTING](../CONTRIBUTING.md) for verification.

Use this blank record privately during a session; publish only an approved, sanitized issue summary, never participant identities, raw conversations, or recordings:

```text
Session type / date:
Browser / OS / physical device or assistive technology:
Theme / text size / device motion preference / site motion preference:
Task:
Observed action or hesitation:
Expected interface behavior:
Reproduction (if repeatable):
Severity and who is affected:
Approved sanitized finding:
Fix and verification reference (after implementation):
Remaining limitations / follow-up:
```
