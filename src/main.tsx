import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { i18nReady } from "./i18n";
import "./index.css";
import { initMonitoring } from "./services/monitoring";
import { captureMarketingAttribution } from "./utils/marketingTracking";

initMonitoring();
captureMarketingAttribution();

// Render once the starting language is ready, so an Arabic reader never sees a
// flash of English while the Arabic text loads.
const render = () =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
i18nReady.then(render, render);
