import { writeFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";

/** Bound protocol/cleanup waits. A timeout rejects; the owner must close resources. */
export async function withTimeout(operation, milliseconds, label) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out.`)),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Invalidate stale success on a failed write; surface filesystem refusals too. */
export async function writeReportAtomic(
  path,
  report,
  fs = { writeFile, rename, rm },
  space = 2,
) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(report, null, space), {
      flag: "wx",
    });
    await fs.rename(temporary, path);
    await fs.rm(temporary, { force: true });
  } catch (error) {
    const errors = [error];
    for (const file of [temporary, path]) {
      try {
        await fs.rm(file, { force: true });
      } catch (cleanup) {
        errors.push(cleanup);
      }
    }
    throw new AggregateError(errors, `Unable to save capture report ${path}.`, {
      cause: error,
    });
  }
}

/** Register only atomically completed files from this run, never stale raw data. */
export async function writeCaptureArtifact(
  report,
  path,
  value,
  write = writeReportAtomic,
) {
  await write(path, value, undefined, 0);
  report.artifacts.push(path);
}

async function usingResource(resource, capture, label, cleanupTimeoutMs) {
  const errors = [];
  let result;
  try {
    result = await capture(resource);
  } catch (error) {
    errors.push(error);
  } finally {
    try {
      await withTimeout(resource.close(), cleanupTimeoutMs, `${label} close`);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length)
    throw new AggregateError(errors, `${label} capture failed.`, {
      cause: errors[0],
    });
  return result;
}
export async function withProfileContext(
  browser,
  options,
  capture,
  cleanupTimeoutMs = 10000,
) {
  return usingResource(
    await browser.newContext(options),
    async (context) => {
      context.setDefaultTimeout(15000);
      context.setDefaultNavigationTimeout(15000);
      return capture(context);
    },
    "Context",
    cleanupTimeoutMs,
  );
}
export async function withProfilePage(
  context,
  capture,
  cleanupTimeoutMs = 10000,
) {
  return usingResource(
    await context.newPage(),
    capture,
    "Page",
    cleanupTimeoutMs,
  );
}

function aborted(operation, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener("abort", abort);
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve()
      .then(operation)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}
const describe = (error) =>
  error instanceof AggregateError
    ? `${error.message} ${error.errors.map(describe).join("; ")}`
    : (error?.message ?? String(error));

/** Own the local server so close failures still have a forceful process teardown. */
export async function runBrowserCapture({
  browserType,
  reportPath,
  report,
  prepare = async () => {},
  capture,
  launchOptions = {},
  timeoutMs = 8 * 60 * 1000,
  cleanupTimeoutMs = 10000,
  writeReport = writeReportAtomic,
  signals = process,
}) {
  const controller = new AbortController(),
    errors = [];
  const handlers = ["SIGINT", "SIGTERM", "SIGHUP"].map((signal) => {
    const listener = () =>
      controller.abort(new Error(`Capture interrupted by ${signal}.`));
    signals.on(signal, listener);
    return [signal, listener];
  });
  const timer = setTimeout(
    () => controller.abort(new Error("Capture deadline exceeded.")),
    timeoutMs,
  );
  let server, browser;
  report.status = "running";
  report.runId = randomUUID();
  report.artifacts = [];
  delete report.error;
  delete report.finishedAt;
  report.startedAt = new Date().toISOString();
  try {
    await writeReport(reportPath, report);
    await aborted(prepare, controller.signal);
    controller.signal.throwIfAborted();
    // Startup is bounded by Playwright itself. Keep ownership of a server that
    // finishes launching during interruption rather than racing away from it.
    server = await browserType.launchServer({
      ...launchOptions,
      host: "127.0.0.1",
      timeout: 30000,
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    });
    controller.signal.throwIfAborted();
    browser = await browserType.connect(server.wsEndpoint(), {
      timeout: 30000,
    });
    controller.signal.throwIfAborted();
    report.browserVersion = browser.version();
    await aborted(() => capture(browser), controller.signal);
  } catch (error) {
    errors.push(error);
  } finally {
    if (browser) {
      try {
        await withTimeout(browser.close(), cleanupTimeoutMs, "Browser close");
      } catch (error) {
        errors.push(error);
      }
    }
    if (server) {
      try {
        await withTimeout(
          server.kill(),
          cleanupTimeoutMs,
          "Browser server kill",
        );
      } catch (error) {
        errors.push(error);
        // Last resort targets only the process handle returned by our launch.
        try {
          server.process().kill("SIGKILL");
        } catch (killError) {
          errors.push(killError);
        }
      }
    }
    if (controller.signal.aborted && !errors.includes(controller.signal.reason))
      errors.push(controller.signal.reason);
    clearTimeout(timer);
    for (const [signal, listener] of handlers) signals.off(signal, listener);
    report.finishedAt = new Date().toISOString();
    report.status = errors.length ? "failed" : "passed";
    if (errors.length) report.error = errors.map(describe).join("; ");
    try {
      await writeReport(reportPath, report);
    } catch (error) {
      report.status = "failed";
      errors.push(error);
    }
  }
  if (errors.length)
    throw new AggregateError(errors, "Browser capture failed.", {
      cause: errors[0],
    });
  return report;
}
