import { createRoot } from "react-dom/client";
import { GeneratorApp } from "./app.js";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<GeneratorApp />);
}
