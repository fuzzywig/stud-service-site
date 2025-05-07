import React, { useState } from "react";
import { useMessages } from "../utils/useMessages";
import { sendMessage } from "../utils/sendMessage";
import { auth } from "../firebase/firebaseAuth";
import "./ChatWindow.css"; // <-- new CSS we'll add next

function ChatWindow({ conversationId }) {
    const [newMessage, setNewMessage] = useState("");
    const messages = useMessages(conversationId);

    const handleSend = async () => {
        if (newMessage.trim() === "") return;
        await sendMessage(conversationId, newMessage);
        setNewMessage("");
    };

    return (
        <div className="chat-window">
            <div className="chat-header">Live Chat</div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-message ${
                            msg.senderId === auth.currentUser.uid ? "sent" : "received"
                        }`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}

export default ChatWindow;
