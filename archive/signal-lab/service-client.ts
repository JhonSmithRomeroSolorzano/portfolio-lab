import { simulate } from "../../src/domain/simulation/simulation";
import type { Scenario } from "../../src/domain/simulation/simulation";
import { validStrictScenario } from "../../src/domain/simulation/scenario-validation";

export class ServiceError extends Error {
  constructor(
    public kind: "offline" | "timeout" | "cancelled" | "http" | "protocol",
    message: string,
    public requestId: string | null = null,
    public retryAfterSeconds: number | null = null,
  ) {
    super(message);
  }
}
export interface ServiceResult {
  result: ReturnType<typeof simulate>;
  requestId: string | null;
  roundTripMs: number;
}
const canonical = (s: Scenario) =>
  JSON.stringify([
    s.requestsPerSecond,
    s.cacheEnabled,
    s.database,
    s.cacheHitPercent ?? 80,
    s.databaseConnections ?? 8,
    s.writePercent ?? 0,
  ]);
export const sameScenario = (a: Scenario, b: Scenario) =>
  canonical(a) === canonical(b);

/** Reject stale/wrong-model replies before they can be presented as evidence. */
export function validateServiceReply(value: unknown, sent: Scenario) {
  const body = value as Record<string, unknown> | null;
  if (
    !body ||
    body.model !== "signal-lab/1" ||
    !validStrictScenario(body.scenario) ||
    !sameScenario(body.scenario, sent) ||
    typeof body.result !== "object" ||
    body.result === null
  )
    throw new ServiceError(
      "protocol",
      "The API returned an incompatible response. Check that both copies use the same version.",
    );
  const expected = simulate(sent);
  const received = body.result as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    const actual = received[key];
    if (
      typeof value === "number"
        ? typeof actual !== "number" ||
          !Number.isFinite(actual) ||
          Math.abs(actual - value) > 1e-9
        : actual !== value
    )
      throw new ServiceError(
        "protocol",
        "The API result differs from this browser’s model. Update both copies before comparing results.",
      );
  }
  return received as ReturnType<typeof simulate>;
}

/** A same-origin development proxy; never probes a visitor's localhost. */
export async function runServiceScenario(
  scenario: Scenario,
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    fetcher?: typeof fetch;
  } = {},
): Promise<ServiceResult> {
  if (!validStrictScenario(scenario))
    throw new ServiceError("protocol", "Choose a valid scenario.");
  const sent = { ...scenario };
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  if (options.signal?.aborted) cancel();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 5000);
  const started = performance.now();
  let requestId: string | null = null;
  try {
    controller.signal.throwIfAborted();
    const response = await (options.fetcher ?? fetch)(
      "/local-api/v1/simulate",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sent),
        signal: controller.signal,
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
      },
    );
    const id = response.headers.get("x-request-id");
    requestId = id && /^[a-zA-Z0-9-]{1,80}$/.test(id) ? id : null;
    if (!response.ok) {
      const raw = response.headers.get("retry-after") ?? "";
      const retry =
        /^\d{1,5}$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
      throw new ServiceError(
        "http",
        response.status === 429
          ? `The API request budget is exhausted.${retry ? ` Try again in ${retry} seconds.` : " Try again later."}`
          : `The local API returned HTTP ${response.status}. Check the API terminal and retry.`,
        requestId,
        retry,
      );
    }
    if (
      !/^application\/json(?:;|$)/i.test(
        response.headers.get("content-type") ?? "",
      )
    )
      throw new ServiceError(
        "protocol",
        "The local API did not return JSON. Check the development proxy.",
        requestId,
      );
    // Bound actual streamed bytes, including replies without Content-Length.
    const reader = response.body?.getReader();
    if (!reader)
      throw new ServiceError(
        "protocol",
        "The API returned an empty response.",
        requestId,
      );
    let raw = "",
      size = 0;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 65_536) {
          await reader.cancel();
          throw new ServiceError(
            "protocol",
            "The API response exceeds 64 KiB.",
            requestId,
          );
        }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    controller.signal.throwIfAborted();
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new ServiceError(
        "protocol",
        "The API returned invalid JSON.",
        requestId,
      );
    }
    const result = validateServiceReply(value, sent);
    return { result, requestId, roundTripMs: performance.now() - started };
  } catch (error) {
    if (controller.signal.aborted)
      throw new ServiceError(
        timedOut ? "timeout" : "cancelled",
        timedOut
          ? "The local API did not finish within five seconds. Start the service and retry."
          : "API request cancelled. Browser results are still available.",
      );
    if (error instanceof ServiceError) {
      error.requestId ??= requestId;
      throw error;
    }
    throw new ServiceError(
      "offline",
      "Could not reach the local API. Run npm run api in a second terminal, then retry.",
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
}
