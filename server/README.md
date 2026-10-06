# Local simulation API

The browser demo runs independently. This optional Node HTTP service evaluates the same pure TypeScript model. It does not start Redis or a database, and it does not turn modeled results into real performance measurements.

```sh
npm ci
npm run api
curl http://127.0.0.1:3001/health
curl -X POST http://127.0.0.1:3001/v1/simulate \
  -H 'Content-Type: application/json' \
  -d '{"requestsPerSecond":120,"cacheEnabled":true,"database":"normal"}'
```

`PORT` overrides 3001. The launcher binds to loopback. SIGINT/SIGTERM stop accepting connections and allow up to five seconds for active requests to finish. This local teaching service has no authentication; public deployment needs an explicit hosting and security design.

- `GET /health`: process readiness and model version, without probing external dependencies.
- `POST /v1/simulate`: a scenario with `requestsPerSecond` (20–600, multiples of 20), `cacheEnabled` (boolean), and `database` (`normal`, `slow`, `offline`). Optional integer fields: `cacheHitPercent` (0–100), `databaseConnections` (1–32), `writePercent` (0–100). Unknown fields are rejected.
- Successful response: `model`, `scenario`, `result`, and an explicit simulation `notice`.
- Errors: 400 malformed JSON, 404 unknown route, 405 wrong method, 413 body over 16 KiB, 415 unsupported media type, 422 invalid scenario. Errors have an `error` string. Responses are JSON with `Cache-Control: no-store`.
- Request and header timeouts: five seconds. No cross-origin browser access is enabled.

`npm test` includes real HTTP integration tests on an ephemeral loopback port. `npm run build` type-checks the service along with the browser app. Production Pages hosting publishes only the browser's `dist/` output.

## Request diagnostics

Every response includes a fresh `X-Request-Id`. The launcher writes one JSON record per completed response: generated request ID, UTC timestamp, method, normalized route, status, and elapsed milliseconds. Match a client's response header to a log record when investigating a failure. Request bodies, query strings, cookies, headers, and client addresses are excluded. Incoming request IDs are ignored. Library users can supply a logger; logger failures cannot change a response.

## Request budget

The service permits 60 simulation POSTs per fixed 60-second window, shared across the process. Invalid simulation requests also consume the budget; health checks and unknown routes do not. Responses expose `X-RateLimit-Limit` and `X-RateLimit-Remaining`. An exhausted budget returns 429 with a `Retry-After` delay in whole seconds. Restarting the process resets the budget. This bounded in-memory example demonstrates backpressure, not distributed rate limiting or abuse prevention. The server factory accepts `budget` options for tests and local experiments.
