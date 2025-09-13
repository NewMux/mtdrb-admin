import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";

// MSW is disabled since we&apos;re using mock Supabase client instead
// if (import.meta.env.DEV) {
//   import('./mocks/browser').then(({ worker }) => {
//     worker.start();
//   });
// }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
