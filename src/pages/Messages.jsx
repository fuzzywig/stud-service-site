// FirebaseChat.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function FirebaseChat() {
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) setUser(user);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "conversations", user.uid, "messages"),
            orderBy("timestamp")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim() || !user) return;

        await addDoc(collection(db, "conversations", user.uid, "messages"), {
            text: input,
            senderId: user.uid,
            timestamp: serverTimestamp(),
        });

        setInput("");
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4">Chat</h2>
            <div className="border rounded h-96 overflow-y-auto p-2 bg-white">
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-2">
                        <div
                            className={`p-2 rounded ${
                                msg.senderId === user?.uid ? "bg-green-100" : "bg-gray-200"
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex mt-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Type a message..."
                />
                <button
                    onClick={handleSend}
                    className="ml-2 bg-green-600 text-white px-4 py-1 rounded"
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default FirebaseChat;
