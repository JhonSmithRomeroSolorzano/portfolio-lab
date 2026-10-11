# Contributing

1. Read the roadmap and choose one small, coherent improvement.
2. Keep personal claims factual, simulation data labeled, and employer information private.
3. Follow [ARCHITECTURE.md](ARCHITECTURE.md): app composes features; features use shared utilities and pure domain models. Keep the archive outside maintained dependency graphs. Document changes to model assumptions.
4. Check relevant behavior with tests. Run `npm run check` before committing. This includes lint, read-only formatting checks, strict types for source/tests/e2e, pure-domain type checks, unit/integration tests, and a production build. Use `npm run format` only when intentionally fixing formatting.
5. After building, run `npm run test:browser` and inspect affected interactions at desktop/mobile widths, with keyboard and reduced motion. Preserve lazy loading and error isolation.
6. Update the work log only for completed work and describe validation accurately.
7. Review `git diff` and commit with a message that explains the actual change.

Never commit secrets, local runtime files, dependencies, or unrelated user changes. Keep commit timestamps accurate and do not force-push shared history.
