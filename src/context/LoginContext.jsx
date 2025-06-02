import React, { createContext, useContext, useState } from "react";

const LoginContext = createContext();

export function useLoginModal() {
    return useContext(LoginContext);
}

export function LoginProvider({ children }) {
    const [isLoginOpen, setLoginOpen] = useState(false);

    const openLogin = () => setLoginOpen(true);
    const closeLogin = () => setLoginOpen(false);

    return (
        <LoginContext.Provider value={{ isLoginOpen, openLogin, closeLogin }}>
            {children}
        </LoginContext.Provider>
    );
}
