import React, { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useSearchParams } from "react-router-dom";

// Utility to get the conversation ID
const getConversationId = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_");
};

function Messages() {
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [activeUserDetails, setActiveUserDetails] = useState({});
    const [conversations, setConversations] = useState([]); // State to store all conversations
    const messagesEndRef = useRef(null);

    const currentUser = auth.currentUser;

    // Get the recipient ID from the URL
    const [searchParams] = useSearchParams();
    const recipientId = searchParams.get("recipient");

    // Set the active user if it's passed from the query string
    useEffect(() => {
        if (recipientId) {
            setActiveUser({ id: recipientId });
            // Fetch the details of the user
            const fetchUserDetails = async () => {
                const userRef = doc(db, "users", recipientId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setActiveUserDetails(userSnap.data());
                }
            };
            fetchUserDetails();
        }
    }, [recipientId]);

    // Fetch conversation messages when the active user changes
    useEffect(() => {
        if (!currentUser || !activeUser) return;

        const conversationId = getConversationId(currentUser.uid, activeUser.id);
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => doc.data()));
        });

        return () => unsubscribe();
    }, [currentUser, activeUser]);

    // Fetch all conversations for the current user (for message list)
    useEffect(() => {
        if (!currentUser) return;

        const fetchConversations = async () => {
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("user1Id", "==", currentUser.uid));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const conversationsList = snapshot.docs.map(doc => doc.data());
                setConversations(conversationsList);
            });

            return () => unsubscribe();
        };

        fetchConversations();
    }, [currentUser]);

    // Function to send a message
    const handleSend = async () => {
        if (!inputText.trim() || !currentUser || !activeUser) return;

        const conversationId = getConversationId(currentUser.uid, activeUser.id);

        // Create the conversation document if it doesn't exist
        const conversationRef = doc(db, "conversations", conversationId);
        await setDoc(conversationRef, {
            user1Id: currentUser.uid,
            user2Id: activeUser.id,
        }, { merge: true });

        // Add a message to the messages sub-collection
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        await addDoc(messagesRef, {
            senderId: currentUser.uid,
            text: inputText,
            createdAt: serverTimestamp(),
        });

        setInputText("");
    };

    // Scroll to the latest message when new messages are received
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="messages-page">
            <div className={`message-list ${activeUser ? "hide-on-mobile" : ""}`}>
                <h2>Messages</h2>
                <ul>
                    {conversations.map((conv, index) => (
                        <li key={index} onClick={() => setActiveUser({ id: conv.user1Id === currentUser.uid ? conv.user2Id : conv.user1Id })}>
                            <span>{conv.user1Id === currentUser.uid ? conv.user2Id : conv.user1Id}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`message-window ${!activeUser ? "hide-on-mobile" : ""}`}>
                {activeUser ? (
                    <>
                        <div className="message-header">
                            <button className="back-btn" onClick={() => setActiveUser(null)}>←</button>
                            <h3>{activeUserDetails.name || "Loading..."}</h3>
                        </div>
                        <div className="chat-body">
                            {messages.map((msg, i) => (
                                <p key={i} className={msg.senderId === currentUser.uid ? "sender" : "receiver"}>
                                    <strong>{msg.senderId === currentUser.uid ? "You" : activeUserDetails.name}:</strong> {msg.text}
                                </p>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button onClick={handleSend}>Send</button>
                        </div>
                    </>
                ) : (
                    <p className="placeholder">Select a conversation to start messaging</p>
                )}
            </div>
        </div>
    );
}

export default Messages;
