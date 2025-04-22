import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer"; // Import the proper Footer component
import "./Layout.css";

function Layout() {
    return (
        <div className="layout">
            {/* Full-width navbar */}
            <Navbar />

            {/* Main content stays centered */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Full-width footer */}
            <Footer />
        </div>
    );
}

export default Layout;
