import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./workspace.css";
import "./motion.css";
import "./play/collection.css";
// Keep these small styles eager: the split stylesheet prevented WebKit from
// recovering after a failed optional script download. The lab code stays lazy.
import "./play/playground.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
