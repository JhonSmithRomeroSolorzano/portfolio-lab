import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const helpers = await import(
  new URL("../scripts/profile-capture.mjs", import.meta.url).href
);

test("raw profile manifests include only fully written artifacts from the current run", async () => {
  const report = { artifacts: [] as string[] };
  await helpers.writeCaptureArtifact(
    report,
    "completed.heapprofile",
    { samples: [] },
    async () => {},
  );
  await assert.rejects(
    helpers.writeCaptureArtifact(
      report,
      "partial.heapprofile",
      {},
      async () => {
        throw new Error("disk full");
      },
    ),
    /disk full/,
  );
  assert.deepEqual(report.artifacts, ["completed.heapprofile"]);
});

test("capture ownership preserves failures, bounds hangs and cleans up launch/connect/signals/writes", async () => {
  for (const fail of [
    undefined,
    "prepare",
    "prepare-hang",
    "launch",
    "connect",
    "capture",
    "close",
    "close-hang",
    "kill",
    "deadline",
    "interrupt",
    "startup-interrupt",
    "initial-write",
    "final-write",
    "multiple",
  ]) {
    const calls: string[] = [],
      reports: Record<string, unknown>[] = [];
    const signals = new EventEmitter(),
      existing = () => {};
    signals.on("SIGINT", existing);
    const report: Record<string, unknown> = { label: "fixture", results: [] };
    const server = {
      wsEndpoint: () => "ws://fixture",
      kill: async () => {
        calls.push("kill");
        if (fail === "kill" || fail === "multiple")
          throw new Error("kill failed");
      },
      process: () => ({ kill: (signal: string) => calls.push(signal) }),
    };
    const browser = {
      version: () => "fixture-browser",
      close: async () => {
        calls.push("close");
        if (fail === "close" || fail === "multiple")
          throw new Error("close failed");
        if (fail === "close-hang") return new Promise(() => {});
      },
    };
    const browserType = {
      launchServer: async (options: Record<string, unknown>) => {
        calls.push("launch");
        assert.equal(options.timeout, 30000);
        assert.equal(options.handleSIGINT, false);
        if (fail === "launch") throw new Error("launch failed");
        if (fail === "startup-interrupt") signals.emit("SIGTERM");
        return server;
      },
      connect: async (_endpoint: string, options: { timeout: number }) => {
        calls.push("connect");
        assert.equal(options.timeout, 30000);
        if (fail === "connect") throw new Error("connect failed");
        return browser;
      },
    };
    let writes = 0;
    const capture = () =>
      helpers.runBrowserCapture({
        browserType,
        reportPath: "fixture.json",
        report,
        signals,
        timeoutMs: fail === "deadline" || fail === "prepare-hang" ? 10 : 5000,
        cleanupTimeoutMs: 10,
        prepare: async () => {
          calls.push("prepare");
          if (fail === "prepare") throw new Error("prepare failed");
          if (fail === "prepare-hang") await new Promise(() => {});
        },
        capture: async () => {
          calls.push("capture");
          report.partial = { paints: 3 };
          if (fail === "capture" || fail === "multiple")
            throw new Error("capture failed");
          if (fail === "interrupt") signals.emit("SIGINT");
          if (fail === "interrupt" || fail === "deadline")
            await new Promise(() => {});
        },
        writeReport: async (_path: string, value: Record<string, unknown>) => {
          writes++;
          if (
            (fail === "initial-write" && writes === 1) ||
            ((fail === "final-write" || fail === "multiple") && writes === 2)
          )
            throw new Error("write failed");
          reports.push(structuredClone(value));
        },
      });
    if (fail)
      await assert.rejects(capture, (error: unknown) => {
        assert.ok(error instanceof AggregateError);
        if (fail === "multiple")
          assert.equal(error.errors[0].message, "capture failed");
        return true;
      });
    else await capture();
    assert.equal(report.status, fail ? "failed" : "passed");
    assert.equal(
      reports.some((r) => r.status === "passed"),
      !fail,
    );
    if (calls.includes("capture"))
      assert.deepEqual(report.partial, { paints: 3 });
    const ownsServer = ![
      "initial-write",
      "prepare",
      "prepare-hang",
      "launch",
    ].includes(fail ?? "");
    assert.equal(calls.includes("kill"), ownsServer);
    assert.equal(
      calls.includes("close"),
      ownsServer && fail !== "connect" && fail !== "startup-interrupt",
    );
    if (fail === "kill" || fail === "multiple")
      assert.ok(calls.includes("SIGKILL"));
    if (fail === "capture")
      assert.match(String(report.error), /capture failed/);
    assert.equal(signals.listenerCount("SIGINT"), 1);
    assert.equal(signals.listenerCount("SIGTERM"), 0);
    assert.equal(signals.listenerCount("SIGHUP"), 0);
  }
});

test("context and auxiliary page cleanup retain both operation and close failures", async () => {
  for (const kind of ["context", "page"]) {
    const calls: string[] = [];
    const resource = {
      setDefaultTimeout: (value: number) => calls.push(`action:${value}`),
      setDefaultNavigationTimeout: (value: number) =>
        calls.push(`navigation:${value}`),
      close: async () => {
        calls.push("close");
        throw new Error("close failed");
      },
    };
    const owner = {
      newContext: async () => resource,
      newPage: async () => resource,
    };
    const work = async () => {
      throw new Error("operation failed");
    };
    const operation = () =>
      kind === "context"
        ? helpers.withProfileContext(owner, {}, work)
        : helpers.withProfilePage(owner, work);
    await assert.rejects(operation, (error: unknown) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors[0].message, "operation failed");
      assert.equal(error.errors[1].message, "close failed");
      return true;
    });
    assert.equal(calls.at(-1), "close");
    if (kind === "context")
      assert.deepEqual(calls.slice(0, 2), ["action:15000", "navigation:15000"]);
  }
});

test("atomic report failures remove temporary files and invalidate stale successes", async () => {
  for (const fail of [undefined, "write", "rename", "cleanup"]) {
    const files = new Map([
      ["report.json", JSON.stringify({ status: "passed", label: "old" })],
    ]);
    let cleanupFailed = false;
    const fs = {
      writeFile: async (path: string, contents: string) => {
        if (fail === "write") throw new Error("write failed");
        files.set(path, contents);
      },
      rename: async (from: string, to: string) => {
        if (fail === "rename") throw new Error("rename failed");
        files.set(to, files.get(from)!);
        files.delete(from);
      },
      rm: async (path: string) => {
        if (fail === "cleanup" && path.endsWith(".tmp") && !cleanupFailed) {
          cleanupFailed = true;
          throw new Error("cleanup failed");
        }
        files.delete(path);
      },
    };
    const operation = () =>
      helpers.writeReportAtomic(
        "report.json",
        { status: "failed", label: "new" },
        fs,
      );
    if (fail) {
      await assert.rejects(operation, AggregateError);
      assert.equal(files.size, 0);
    } else {
      await operation();
      assert.deepEqual([...files.keys()], ["report.json"]);
      assert.equal(JSON.parse(files.get("report.json")!).label, "new");
    }
  }
  const directory = await mkdtemp(join(tmpdir(), "portfolio-capture-"));
  try {
    const path = join(directory, "report.json");
    await helpers.writeReportAtomic(path, { status: "running" });
    await helpers.writeReportAtomic(path, {
      status: "failed",
      error: "fixture",
    });
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), {
      status: "failed",
      error: "fixture",
    });
    assert.deepEqual(await readdir(directory), ["report.json"]);
  } finally {
    await rm(directory, { recursive: true });
  }
});
