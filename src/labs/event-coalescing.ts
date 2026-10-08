import { modelInteger } from "./model-input";
export const INPUT_PATTERNS = {
  burst: [0, 60, 120, 300, 340, 800],
  steady: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900],
} as const;
export type InputPattern = keyof typeof INPUT_PATTERNS;
export type CoalescingPolicy = "every" | "debounce" | "throttle";
export function coalesceInputs(
  pattern: InputPattern,
  delay: number,
  policy: CoalescingPolicy,
) {
  modelInteger(delay, 50, 500);
  if (
    !Object.hasOwn(INPUT_PATTERNS, pattern) ||
    !["every", "debounce", "throttle"].includes(policy)
  )
    throw new RangeError("Unknown input policy.");
  const input = INPUT_PATTERNS[pattern];
  const emissions: { at: number; inputAt: number; index: number }[] = [];
  let nextAllowed = -Infinity;
  input.forEach((at, index) => {
    if (policy === "every") emissions.push({ at, inputAt: at, index });
    if (policy === "throttle" && at >= nextAllowed) {
      emissions.push({ at, inputAt: at, index });
      nextAllowed = at + delay;
    }
    if (
      policy === "debounce" &&
      (index === input.length - 1 || at + delay <= input[index + 1])
    )
      emissions.push({ at: at + delay, inputAt: at, index });
  });
  return {
    input: [...input],
    emissions,
    omitted: input.length - emissions.length,
    finalInputDelivered: emissions.at(-1)?.index === input.length - 1,
  };
}
