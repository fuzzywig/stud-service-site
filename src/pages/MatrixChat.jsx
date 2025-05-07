// src/pages/MatrixChat.jsx
import React from "react";

const MatrixChat = () => {
    const elementUrl = "https://app.element.io/#/login"; // Change this later to auto-login or open a specific room

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <iframe
                src={elementUrl}
                title="Matrix Chat"
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                }}
            />
        </div>
    );
};

export default MatrixChat;
