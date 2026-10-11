import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./shared/styles/tokens.css";
import "./shared/styles/base.css";
import "./app/layout.css";
import "./features/portfolio/portfolio.css";
import "./features/playground/collection.css";
// Styles stay eager: splitting them broke WebKit's failed-download recovery.
// Each experience's JavaScript remains lazy through the playground catalog.
import "./features/playground/cache-rescue/cache-rescue.css";
import "./features/playground/connection-puzzle/connection-puzzle.css";
import "./features/playground/motion-studio/motion-studio.css";
import "./features/playground/algorithm-garden/algorithm-garden.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
