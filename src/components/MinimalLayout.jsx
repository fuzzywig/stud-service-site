import React from "react";
import Navbar from "./Navbar"; // or wherever your navbar is

const MinimalLayout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
};

export default MinimalLayout;
