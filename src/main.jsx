// src/main.jsx
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";
import { BrowserRouter } from "react-router-dom";
import { LoginProvider } from "./context/LoginContext";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop.jsx";

const container = document.getElementById("root");

// Create the app component with all your providers
const AppWithProviders = () => (
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <ScrollToTop />
                <LoginProvider>
                    <App />
                </LoginProvider>
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>
);

// Check if this is an SSR page by looking for React Helmet meta tags in the head
const hasSSRMetaTags = document.querySelector('meta[data-rh="true"]') ||
    document.querySelector('title[data-rh="true"]');

// For SSR pages, always hydrate (even with empty content)
// For regular pages, do client-side rendering
if (hasSSRMetaTags) {
    console.log('🎭 Hydrating SSR content (detected by meta tags)');
    hydrateRoot(container, <AppWithProviders />);
} else {
    console.log('⚛️ Client-side rendering (no SSR meta tags found)');
    const root = createRoot(container);
    root.render(<AppWithProviders />);
}