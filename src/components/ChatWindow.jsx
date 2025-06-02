// src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../firebase/firebaseAuth";
import {
    createOrGetConversation,
    sendMessage,
    subscribeToMessages,
} from "../firebase/firestoreChat";
import "./ChatWindow.css";

export default function ChatWindow({ selectedUser }) {
    const { currentUser } = useAuth();
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        const setup = async () => {
            const id = await createOrGetConversation(currentUser.uid, selectedUser.uid);
            setConversationId(id);

            return subscribeToMessages(id, setMessages);
        };

        const unsubscribePromise = setup();

        return () => {
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [selectedUser, currentUser]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await sendMessage(conversationId, currentUser.uid, newMessage.trim());
        setNewMessage("");
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <h4>Chat with {selectedUser?.firstName || "User"}</h4>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-bubble ${msg.senderId === currentUser.uid ? "sent" : "received"}`}
                    >
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="chat-input"
                />
                <button type="submit" className="chat-send-btn">Send</button>
            </form>
        </div>
    );
}
