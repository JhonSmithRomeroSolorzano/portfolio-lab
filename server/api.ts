import openapi from "./openapi.json" with { type: "json" };
import { createRequestBudget } from "./request-budget.ts";
import type { BudgetOptions } from "./request-budget.ts";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { simulate } from "../src/simulation.ts";
import { validStrictScenario } from "../src/scenario-validation.ts";
const MAX_BODY = 16_384;
class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(body));
}
function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    let oversized = false;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        oversized = true;
        chunks.length = 0;
        reject(new RequestError(413, "Request body exceeds 16 KiB."));
      } else if (!oversized) chunks.push(chunk);
    });
    req.on("error", reject);
    req.on("end", () => {
      if (oversized) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new RequestError(400, "Send a valid JSON document."));
      }
    });
  });
}
export interface RequestLog {
  timestamp: string;
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
}
export interface ServerOptions {
  budget?: BudgetOptions;
  logger?: (entry: RequestLog) => void;
}
/** Local educational API; no connection to Redis or a production database. */
export function createSimulationServer(options: ServerOptions = {}) {
  const consume = createRequestBudget(options.budget);
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    const started = performance.now();
    const path = (req.url ?? "/").split("?")[0];
    res.setHeader("x-request-id", requestId);
    res.once("finish", () => {
      try {
        options.logger?.({
          timestamp: new Date().toISOString(),
          requestId,
          method: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "HEAD",
            "OPTIONS",
          ].includes(req.method ?? "")
            ? req.method!
            : "OTHER",
          route: ["/health", "/v1/simulate", "/openapi.json"].includes(path)
            ? path
            : "unmatched",
          status: res.statusCode,
          durationMs: Number((performance.now() - started).toFixed(3)),
        });
      } catch {
        /* Logging must not change an already completed response. */
      }
    });
    try {
      if (
        path !== "/health" &&
        path !== "/v1/simulate" &&
        path !== "/openapi.json"
      ) {
        req.resume();
        send(res, 404, { error: "Route not found." });
        return;
      }
      const method = path === "/v1/simulate" ? "POST" : "GET";
      if (req.method !== method) {
        req.resume();
        res.setHeader("allow", method);
        send(res, 405, { error: `Use ${method} for this route.` });
        return;
      }
      if (path === "/health") {
        send(res, 200, { status: "ok", model: "signal-lab/1" });
        return;
      }
      if (path === "/openapi.json") {
        send(res, 200, openapi);
        return;
      }
      const budget = consume();
      res.setHeader("x-ratelimit-limit", budget.limit);
      res.setHeader("x-ratelimit-remaining", budget.remaining);
      if (!budget.allowed) {
        req.resume();
        res.setHeader("retry-after", budget.retryAfterSeconds);
        send(res, 429, {
          error:
            "Simulation request budget exhausted. Retry after the indicated delay.",
        });
        return;
      }
      if (
        !/^application\/json(?:\s*;.*)?$/i.test(
          req.headers["content-type"] ?? "",
        )
      ) {
        req.resume();
        send(res, 415, { error: "Use application/json." });
        return;
      }
      const scenario = await readJson(req);
      if (!validStrictScenario(scenario))
        throw new RequestError(
          422,
          "Provide a valid scenario with only supported fields.",
        );
      send(res, 200, {
        model: "signal-lab/1",
        scenario,
        result: simulate(scenario),
        notice: "Illustrative model, not production measurements.",
      });
    } catch (error) {
      if (!res.destroyed && !res.writableEnded)
        send(res, error instanceof RequestError ? error.status : 500, {
          error:
            error instanceof RequestError ? error.message : "Internal error.",
        });
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 1000;
  return server;
}
