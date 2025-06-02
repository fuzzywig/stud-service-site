// src/hooks/useIdleLogout.js
import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function useIdleLogout(timeout = 15 * 60 * 1000) { // 15 minutes
    const timeoutId = useRef();

    useEffect(() => {
        const resetTimer = () => {
            clearTimeout(timeoutId.current);
            timeoutId.current = setTimeout(() => {
                signOut(auth);
                alert("You've been logged out due to inactivity.");
            }, timeout);
        };

        const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
        events.forEach(e => window.addEventListener(e, resetTimer));

        resetTimer(); // Start the timer

        return () => {
            clearTimeout(timeoutId.current);
            events.forEach(e => window.removeEventListener(e, resetTimer));
        };
    }, [timeout]);
}
