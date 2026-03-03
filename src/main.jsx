import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Landing from "./Landing.jsx";
import AuthPage from "./AuthPage.jsx";

// ✅ FIX 1: Removed ProtectedRoute — /app is freely accessible.
// No sign-up wall. Auth is only prompted inside App when user wants to SAVE patterns.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
