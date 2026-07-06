import "./app/i18n.js";
import "maplibre-gl/dist/maplibre-gl.css";
import { createRoot } from "react-dom/client";
import { App } from "./app/app.js";
import "./presentation/styles.css";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<App />);
}
