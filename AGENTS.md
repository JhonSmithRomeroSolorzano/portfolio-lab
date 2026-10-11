# Portfolio development

This file owns instructions for agents working in this repository: preparation, verification, content safeguards, and delivery. Technical design belongs in [ARCHITECTURE.md](ARCHITECTURE.md).

## Before editing

- Read [README.md](README.md) for the current product and [ROADMAP.md](ROADMAP.md) for the latest priorities. Older completed milestones describe retired UI; they are historical context, not a request to restore it.
- Read [ARCHITECTURE.md](ARCHITECTURE.md) before changing code, dependencies, or build configuration. It owns the source map, dependency directions, component responsibilities, runtime boundaries, and technical tradeoffs.
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow. Consult [server/README.md](server/README.md) and [server/openapi.json](server/openapi.json) for optional API work, and [CASE_STUDY.md](CASE_STUDY.md) for the earlier systems model.
- Inspect Git status and preserve unrelated edits. Choose a useful, bounded improvement within the user's current scope; refine the existing experiences rather than expanding the catalog without a request.
- Preserve the product behavior documented in README, including experience-first ordering, projects within Experience, the single theme toggle, stable stack-map panels, and legacy anchors, unless the user requests a change.

## Commands and verification

- Use Node.js 22.19+ and `npm ci`; CI uses Node 24. Tests use Node's test runner with `tsx`, not Jest.
- Run `npm run check` before committing. It runs ESLint, read-only Prettier validation, unit/integration tests, and the production build. Build runs strict app/test/domain type checks, résumé generation, then Vite. Use `npm run format` only for intentional formatting changes; avoid rewriting unrelated files.
- Focused unit/integration test: `node --import tsx --test tests/cache-rescue.test.ts`. API tests start their own ephemeral loopback servers; no database, Redis, or separately running API is needed.
- Browser tests require a fresh `npm run build` and installed browsers (`npx playwright install chromium webkit`). `npm run test:browser` starts the production preview on port 4173, not the dev server; an existing local server there may be reused. Focus: `npm run test:browser -- e2e/cache-rescue.spec.ts --project=webkit`.
- For code or build changes, run the browser suite after building and inspect affected UI at desktop/mobile widths, in both themes, and with keyboard/reduced motion when browser tooling is available. For documentation-only changes, also verify links, paths, and commands; no new behavior tests or browser rerun are needed. Report what ran and any limitations accurately.
- `npm run dev` generates résumé assets first. Profile edits during a running dev session need `npm run build:resume` to refresh downloads; see [README's résumé downloads](README.md#résumé-downloads).

## Content safeguards

- Career/contact additions need Jhon's verified details; do not invent email/phone, outcomes, metrics, or ownership. Preserve overlapping employment dates and qualifications such as “some Next.js/AWS experience.”
- Never publish private conversations, interview feedback, client data, credentials, or employer source code.
- Keep simulation assumptions visible; modeled output is not a measurement of running services.

## Delivery and documentation

- Review each diff before committing. Normal commits/pushes of verified portfolio improvements to the configured origin are authorized. Keep each commit coherent, independently reviewable, and buildable, with relevant tests alongside the behavior they verify. Never force-push, backdate, or pad activity with artificial splits, empty commits, or date-only edits.
- Update the document that owns a changed rule in the same change: this file for agent workflow and safeguards, ARCHITECTURE for technical design, README for product/setup information, and ROADMAP for completed work and next steps. Cross-link instead of copying rules between AGENTS and ARCHITECTURE. Check commands and technical claims against the implementation and configuration; reconcile discrepancies rather than preserving stale documentation.
- Keep daily automation configuration and generated artifacts out of this public repo. Preserve the Sites preview's existing audience. Follow the deployment setup linked from [README](README.md#deployment).
- If external authentication/publication is blocked, report once and wait for a meaningful change rather than repeatedly committing roadmap edits.
