import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { simulate } from "../src/simulation.ts";
import { validScenario } from "../src/scenario-validation.ts";
const MAX_BODY = 16_384;
const FIELDS = [
  "requestsPerSecond",
  "cacheEnabled",
  "database",
  "cacheHitPercent",
  "databaseConnections",
  "writePercent",
];
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
/** Local educational API; no connection to Redis or a production database. */
export function createSimulationServer() {
  const server = createServer(async (req, res) => {
    try {
      const path = (req.url ?? "/").split("?")[0];
      if (path !== "/health" && path !== "/v1/simulate") {
        req.resume();
        send(res, 404, { error: "Route not found." });
        return;
      }
      const method = path === "/health" ? "GET" : "POST";
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
      if (
        !validScenario(scenario) ||
        Object.keys(scenario).some((key) => !FIELDS.includes(key))
      )
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
