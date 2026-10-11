export const ROUNDS = [
  {
    name: "The morning rush",
    requests: 24,
    originMs: 400,
    spacingMs: 0,
    note: "Everyone arrives at once. The cache is empty. Keep the database work to one read.",
  },
  {
    name: "A rolling wave",
    requests: 24,
    originMs: 400,
    spacingMs: 25,
    note: "Requests keep arriving while the first fetch is running. Can they share its answer?",
  },
  {
    name: "Room to breathe",
    requests: 12,
    originMs: 100,
    spacingMs: 100,
    note: "Arrivals are farther apart. Try both strategies. Does sharing still save any work?",
  },
] as const;
