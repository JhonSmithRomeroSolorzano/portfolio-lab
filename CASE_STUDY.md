# Signal Lab: making system trade-offs inspectable

**[Try the browser lab](https://jhonsmithromerosolorzano.github.io/portfolio-lab/#lab)** · [Run the local API](server/README.md) · [Read the model](src/simulation.ts)

Signal Lab is an original portfolio project by Jhon Smith Romero. It turns a familiar engineering conversation—traffic, caching, database capacity, and failure—into a small experiment a reviewer can reproduce. It is not a production benchmark or a claim about a previous employer's systems.

## A five-minute walkthrough

1. Start with 120 requests per second, an 80% read-cache hit rate, and eight normal database connections. All requests succeed in this model.
2. Turn the cache off. Database demand rises above its 100 req/s capacity. Set traffic to exactly 100, then 101, to inspect the boundary.
3. Capture that setup as a baseline. Re-enable caching and compare latency, success percentage points, and database demand.
4. Set the database offline. Cached reads still succeed; uncached reads and writes time out. Add a write share to see why a read cache cannot preserve write availability.
5. Open the separate expiry and queue experiments. A longer TTL can return stale data; a larger buffer can postpone rejection while work waits.

Use a share link, a named local experiment, or a JSON snapshot to revisit a setup. A traffic sweep holds all other inputs fixed, and the batch CLI evaluates multiple scenarios without a browser.

## What actually runs

```mermaid
flowchart TD
    U[Browser controls, URLs and imported files] --> V[Scenario validation]
    V --> M[Pure TypeScript steady-state model]
    M --> R[React metrics, comparison and traffic sweep]
    M --> T[Illustrative request trace]
    CLI[NDJSON batch CLI] --> V
    API[Optional local Node HTTP API] --> V
    API --> H[Health, OpenAPI, request IDs and request budget]
    E[Separate TTL timeline] --> R
    Q[Separate bounded queue model] --> R
```

The public site is static HTML, CSS, and JavaScript. Its architecture diagram describes a modeled browser/API/cache/database path. It does not establish network connections to Redis or a database. The optional local API is a real HTTP server that calculates the same model; it is not the database shown in the diagram.

Keeping the calculation in a pure function makes the UI, API, and CLI agree. URL parsing falls back safely per field. File imports recalculate results rather than trusting numbers embedded in a snapshot. The API and CLI reject unknown scenario properties to catch misspellings.

## The steady-state model

For offered load `R`, write fraction `w`, and read-cache hit fraction `h`:

```text
reads             = R × (1 − w)
writes            = R × w
cache hits        = cache enabled ? reads × h : 0
database demand   = R − cache hits
database capacity = online ? connections × 1000 / database latency : 0
database served   = min(demand, capacity)
failed            = R − cache hits − database served
```

Each request adds 12 ms of API overhead. Cache hits take another 8 ms. Database operations take 80 ms normally or 400 ms in slow mode. Requests beyond capacity, or requiring an offline database, receive a modeled 1,000 ms timeout. Reads and writes have equal database cost here; that is an explicit simplification.

The default 120 req/s scenario sends 96 reads to cache and 24 to the database. Its mean response is `12 + (96×8 + 24×80)/120 = 34.4 ms`. This mean includes both successes and timeouts. It is not p95 or p99, and it can conceal a poor experience for a minority of requests. Fractional per-second counts represent steady-state rates, not fractional individual requests.

With the cache disabled, eight 80 ms connections have capacity `8×1000/80 = 100 req/s`. Request conservation is an invariant: **cached + database-served + failed = offered**. Tests check this across supported scenarios.

## Two separate time-based experiments

The TTL timeline reads one key each second from t=0 through t=20. The origin changes just before t=5. A cache miss stores the latest version for the selected TTL; hits do not renew expiry. With an eight-second TTL, t=5, 6, and 7 return stale version 1. At t=8, an expired entry is fetched again. This timeline has no network delay, invalidation, background refresh, or link to the main model's hit-rate slider.

The queue experiment has eight one-second ticks with arrivals `[4, 4, 20, 20, 4, 4, 4, 4]`. Each tick serves old backlog first and then arrivals. Excess work waits up to the buffer limit; overflow rejects the newest arrivals. At capacity 8 and buffer 16, 56 requests finish, 8 are rejected, and none remain waiting. With no buffer, 24 are rejected. The conservation rule is **completed + rejected + waiting = total arrivals**. Waiting work never counts as successful. There are no retries, deadlines, or within-tick latency estimates.

## The local service boundary

The Node service uses the standard HTTP module because this example has a small route surface and no routing dependency is needed. Its purpose is to make the boundary inspectable: JSON parsing, shared input validation, a 16 KiB body limit, request IDs, structured completion logs, and predictable error responses. An OpenAPI document describes the contract.

Simulation POSTs share an in-memory fixed-window budget. Rejection returns 429 and a retry delay. This illustrates backpressure; it is not a distributed rate limiter. Health and contract reads remain available. The launcher binds to loopback and shuts down on SIGINT/SIGTERM. Public service hosting, authentication, TLS termination, and distributed state remain outside this milestone.

Logs contain a generated request ID, normalized route, method, status, timestamp, and duration. They exclude payloads, query strings, cookies, and client addresses. Correlation is useful without collecting those values.

## Evidence and limits

`npm test` covers the model, request conservation, URL round trips, storage/file boundaries, comparison, expiry, queues, rate-window boundaries, batch CLI exit codes, and real HTTP responses on an ephemeral loopback port. `npm run build` checks TypeScript for the browser, server, and scripts before producing static assets. GitHub Actions runs both before Pages deployment.

Browser checks cover precise traffic input, baseline comparison, saved-library persistence, file import, expiry/queue interaction, and a narrow mobile viewport. These are manual checks, not a permanent browser regression suite. Browser downloads depend on host support; copyable JSON/CSV views provide a visible fallback. File contents are generated and tested independently.

The next useful work is a persistent browser regression suite, a more realistic request scheduler, explicit cache invalidation strategies, and a comparison report that can be shared. Those features should explain a new engineering trade-off rather than imply this model predicts production performance.

## Review path

- [`src/simulation.ts`](src/simulation.ts): formulas and core assumptions.
- [`src/scenario-validation.ts`](src/scenario-validation.ts): shared input contract.
- [`src/cache-expiry.ts`](src/cache-expiry.ts) and [`src/queue-model.ts`](src/queue-model.ts): time-based experiments.
- [`server/api.ts`](server/api.ts) and [`server/openapi.json`](server/openapi.json): HTTP boundary and contract.
- [`scripts/replay.ts`](scripts/replay.ts): batch execution.
- [`tests/`](tests/): behavior and boundary checks.

Features were developed with AI assistance and checked through tests, builds, and browser inspection. All code and examples in this project are original portfolio work; no employer code, client data, or private interview material is included.
