import "./lib/homePrefetch";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register custom SW for notification click handling (after first paint so it
// never competes with the initial render for bandwidth).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-custom.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
