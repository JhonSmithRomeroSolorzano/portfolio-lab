import { renderToString } from "react-dom/server";
import { App } from "./App";

/** Build-only entry; never imported by the browser entry. */
export function renderPortfolio() {
  return renderToString(<App />);
}
