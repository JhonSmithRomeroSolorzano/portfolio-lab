import type { LabSetup } from "./lab-setup";
export interface InvestigationStep {
  title: string;
  question: string;
  evidence: string;
  setup: LabSetup;
}
export const INVESTIGATIONS: {
  id: string;
  title: string;
  steps: InvestigationStep[];
}[] = [
  {
    id: "responsive",
    title: "Keep a fast interface correct",
    steps: [
      {
        title: "Reproduce an outdated result",
        question:
          "Which search will remain visible when the first request is the slowest?",
        evidence:
          "Inspect the last response: “r” arrives at 800 ms and replaces “react”.",
        setup: {
          version: 1,
          lab: "search",
          settings: { oldDelay: 800, newestDelay: 100, policy: "every" },
        },
      },
      {
        title: "Guard the result",
        question:
          "Can the interface ignore outdated responses without changing the network timing?",
        evidence:
          "The same arrivals now leave “react” visible. Ignoring a result does not cancel the request.",
        setup: {
          version: 1,
          lab: "search",
          settings: { oldDelay: 800, newestDelay: 100, policy: "latest" },
        },
      },
      {
        title: "Reduce work before it starts",
        question:
          "How much handler work can a quiet period remove from bursty input?",
        evidence:
          "Compare the every-event and debounce counts. Debounce delays work; response guarding solves a different problem.",
        setup: {
          version: 1,
          lab: "events",
          settings: { pattern: "burst", delay: 200, policy: "debounce" },
        },
      },
    ],
  },
  {
    id: "recovery",
    title: "Protect a recovering service",
    steps: [
      {
        title: "Fail fast during the outage",
        question: "What changes when repeated failures open a circuit?",
        evidence:
          "Blocked calls stay local. The probe at 900 ms follows service recovery at 800 ms.",
        setup: {
          version: 1,
          lab: "circuit",
          settings: { threshold: 3, cooldown: 500, recovery: 800 },
        },
      },
      {
        title: "Probe too early",
        question:
          "What happens if the cooldown is shorter than the remaining outage?",
        evidence:
          "Follow the failed half-open probes and the next cooldown. A short wait does not make the service recover sooner.",
        setup: {
          version: 1,
          lab: "circuit",
          settings: { threshold: 2, cooldown: 100, recovery: 1200 },
        },
      },
      {
        title: "Bound incoming bursts",
        question:
          "How does gradual refill treat requests near a window boundary?",
        evidence:
          "Compare token-bucket admission with fixed windows. This separate experiment limits arrivals; it does not model circuit behavior.",
        setup: {
          version: 1,
          lab: "rate-limit",
          settings: { limit: 4, policy: "bucket" },
        },
      },
    ],
  },
  {
    id: "conflicts",
    title: "Resolve competing changes",
    steps: [
      {
        title: "Observe a lost update",
        question: "Both clients read 10. Will adding 1 and 5 always leave 16?",
        evidence:
          "Blind overwrite finishes at 15 because Client B saves a value based on the old snapshot.",
        setup: {
          version: 1,
          lab: "writes",
          settings: { firstDelta: 1, secondDelta: 5, policy: "overwrite" },
        },
      },
      {
        title: "Reject stale work",
        question:
          "Does an atomic version check automatically apply the second change?",
        evidence:
          "The value stays at 11. Rejecting a conflict protects existing work but leaves the caller a decision.",
        setup: {
          version: 1,
          lab: "writes",
          settings: { firstDelta: 1, secondDelta: 5, policy: "reject" },
        },
      },
      {
        title: "Reread before retrying",
        question: "When is applying the delta again safe?",
        evidence:
          "After a known rejection, Client B rereads and adds 5 to 11. The result is 16; arbitrary side effects need additional safeguards.",
        setup: {
          version: 1,
          lab: "writes",
          settings: { firstDelta: 1, secondDelta: 5, policy: "retry" },
        },
      },
    ],
  },
];
