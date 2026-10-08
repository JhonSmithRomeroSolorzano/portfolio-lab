import { modelInteger } from "./model-input";
export type WritePolicy = "overwrite" | "reject" | "retry";
export function concurrentWrites(
  firstDelta: number,
  secondDelta: number,
  policy: WritePolicy,
) {
  modelInteger(firstDelta, -5, 10);
  modelInteger(secondDelta, -5, 10);
  if (!["overwrite", "reject", "retry"].includes(policy))
    throw new RangeError("Unknown write policy.");
  let value = 10,
    version = 1;
  const rows = [
    {
      at: 0,
      title: "Both clients read version 1",
      value,
      version,
      outcome: "read",
    },
  ];
  value += firstDelta;
  version++;
  rows.push({
    at: 200,
    title: "Client A commits its change",
    value,
    version,
    outcome: "saved",
  });
  if (policy === "overwrite") {
    value = 10 + secondDelta;
    version++;
    rows.push({
      at: 300,
      title: "Client B overwrites from its old snapshot",
      value,
      version,
      outcome: "saved",
    });
  } else {
    rows.push({
      at: 300,
      title: "Client B's version check finds a conflict",
      value,
      version,
      outcome: "conflict",
    });
    if (policy === "retry") {
      rows.push({
        at: 350,
        title: "Client B rereads the latest version",
        value,
        version,
        outcome: "read",
      });
      value += secondDelta;
      version++;
      rows.push({
        at: 400,
        title: "Client B reapplies its delta and commits",
        value,
        version,
        outcome: "saved",
      });
    }
  }
  return {
    rows,
    value,
    version,
    expected: 10 + firstDelta + secondDelta,
    conflicts: policy === "overwrite" ? 0 : 1,
  };
}
