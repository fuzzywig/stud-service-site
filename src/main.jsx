import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";
import { BrowserRouter } from "react-router-dom";
import { LoginProvider } from "./context/LoginContext";
import ScrollToTop from "./components/ScrollToTop.jsx";  // <-- import here

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <ScrollToTop />   {/* <-- add here */}
            <LoginProvider>
                <App />
            </LoginProvider>
        </BrowserRouter>
    </React.StrictMode>
);
