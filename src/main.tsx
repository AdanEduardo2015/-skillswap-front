import "./index.css";
import "./awsConfig.ts";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./app/App";
import AppProviders from "./app/AppProviders";
import AuthSessionProvider from "./app/auth/AuthSessionProvider";

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <Router>
      <AuthSessionProvider>
        <App />
      </AuthSessionProvider>
    </Router>
  </AppProviders>
);
