# Contributing

1. Read [README](README.md) for current behavior and [the roadmap's current status](ROADMAP.md#current-status-and-next-steps), then choose one small, coherent improvement. Dated work-log entries are historical context, not current priorities.
2. Keep personal claims factual, simulation data labeled, and employer information private.
3. Follow [ARCHITECTURE.md](ARCHITECTURE.md): app composes features; features use shared utilities and pure domain models. Keep the archive outside maintained dependency graphs. Document changes to model assumptions.
4. Check relevant behavior with tests. Run `npm run check` before committing. This includes lint, read-only formatting checks, strict types for source/tests/e2e, pure-domain type checks, unit/integration tests, and a production build. Use `npm run format` only when intentionally fixing formatting.
5. For code or build changes, after building run `npm run test:browser` and inspect affected interactions at desktop/mobile widths, in both themes, with keyboard and reduced motion. Documentation-only changes need link/path/command verification but no browser rerun. Preserve lazy loading and error isolation.
6. Update the work log only for completed work and describe validation accurately.
7. Review `git diff` and commit with a message that explains the actual change.
8. Submit changes on a branch/PR and follow [the deployment gates](README.md#deployment); do not bypass protected `main`. A docs-only change does not authorize unrelated application or hosting changes.

For first-time visitor, real-phone, and screen-reader listening sessions, use the [review guide](docs/USABILITY_REVIEW.md). Distinguish completed human observations from automated checks.

For document ownership and scope, use [the documentation map](README.md#documentation-map). Agent-specific workflow and content safeguards live in [AGENTS](AGENTS.md), not in the historical case study or release snapshot.

Never commit secrets, local runtime files, dependencies, or unrelated user changes. Keep commit timestamps accurate and do not force-push shared history.
