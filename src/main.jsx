import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";
import { BrowserRouter } from "react-router-dom";
import { LoginProvider } from "./context/LoginContext";
// 1) Import HelmetProvider from react-helmet-async
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
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
