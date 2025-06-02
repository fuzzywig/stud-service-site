import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer"; // Import the proper Footer component
import "./Layout.css";

function Layout({ onLoginClick, onResetCookieConsent }) {
    return (
        <div className="layout">
            <Navbar onLoginClick={onLoginClick} />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer onResetCookieConsent={onResetCookieConsent} />
        </div>
    );
}

export default Layout;
