export const CURVES = [
  {
    name: "Steady",
    easing: "linear",
    path: "M0 100 L100 0",
    note: "The same speed, from start to finish.",
  },
  {
    name: "Soft landing",
    easing: "cubic-bezier(.16,1,.3,1)",
    path: "M0 100 C16 0 30 0 100 0",
    note: "A quick departure with a gentle arrival.",
  },
  {
    name: "Slow & smooth",
    easing: "cubic-bezier(.65,0,.35,1)",
    path: "M0 100 C65 100 35 0 100 0",
    note: "Ease into the movement, then ease back out.",
  },
  {
    name: "A little bounce",
    easing: "cubic-bezier(.34,1.56,.64,1)",
    path: "M0 100 C34 -56 64 0 100 0",
    note: "Go a little past the destination, then settle.",
  },
];
