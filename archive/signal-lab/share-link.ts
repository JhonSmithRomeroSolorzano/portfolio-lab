import { scenarioUrl } from "./scenario-url";
import type { Scenario } from "../../src/domain/simulation/simulation";

export type CopyResult =
  { status: "copied" } | { status: "manual"; url: string };

/** Only experiment parameters belong in a shared link, never session/tracking data. */
export function shareScenarioUrl(
  currentUrl: string,
  scenario: Scenario,
): string {
  const url = new URL(currentUrl);
  url.search = "";
  url.hash = "lab";
  return scenarioUrl(url.toString(), scenario);
}

export async function copyLink(
  url: string,
  writeText?: (text: string) => Promise<void>,
): Promise<CopyResult> {
  if (writeText) {
    try {
      await writeText(url);
      return { status: "copied" };
    } catch {
      // Clipboard permission and browser support vary; offer a selectable link.
    }
  }
  return { status: "manual", url };
}
