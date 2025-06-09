import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        const doLogout = async () => {
            try {
                await signOut(auth);
                console.log("👋 User signed out");
                navigate("/");
            } catch (error) {
                console.error("Error signing out:", error);
            }
        };

        doLogout();
    }, [navigate]);

    return <p>Logging out...</p>;
}

export default Logout;
