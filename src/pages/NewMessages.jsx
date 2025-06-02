import React, { useState, useEffect, useRef } from "react";
import "./Messages.css";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../firebase/firebaseAuth";
import {
    getConversationId,
    sendMessage,
    listenToMessages,
    fetchUserConversations
} from "../firebase/firestoreChat";

// Component: Messages page
const Messages = () => {
    // Section: Auth and initial hooks
    const { currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [participants, setParticipants] = useState({});
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchParams] = useSearchParams();
    const messagesEndRef = useRef(null);
    const [showSidebar, setShowSidebar] = useState(false); // Sidebar visibility on mobile
    const conversationIdFromURL = searchParams.get("c");
    const recipientIdFromURL = searchParams.get("recipient");
    const chatContainerRef = useRef(null);

    // Section: Effects for UI and scrolling
    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Ensure footer is visible
    useEffect(() => {
        const footer = document.querySelector("footer");
        if (footer) {
            footer.style.display = "block";
        }
    }, []);

    // Section: Load or create conversation based on URL params
    useEffect(() => {
        const loadOrCreateConversation = async () => {
            if (!currentUser) return;

            if (recipientIdFromURL) {
                // Create or load conversation for specific recipient
                const convoId = getConversationId(currentUser.uid, recipientIdFromURL);
                const convoRef = doc(db, "conversations", convoId);
                const convoSnap = await getDoc(convoRef);

                if (!convoSnap.exists()) {
                    await setDoc(convoRef, {
                        users: [currentUser.uid, recipientIdFromURL],
                        createdAt: serverTimestamp(),
                        lastMessage: "",
                        lastUpdated: serverTimestamp()
                    });
                }

                setActiveConversationId(convoId);

            } else if (conversationIdFromURL) {
                // Load existing conversation
                const convoRef = doc(db, "conversations", conversationIdFromURL);
                const convoSnap = await getDoc(convoRef);

                if (convoSnap.exists()) {
                    setActiveConversationId(convoSnap.id);
                } else if (recipientIdFromURL) {
                    // Fallback: create new if provided
                    await setDoc(convoRef, {
                        users: [currentUser.uid, recipientIdFromURL],
                        createdAt: serverTimestamp(),
                        lastMessage: "",
                        lastUpdated: serverTimestamp()
                    });
                    setActiveConversationId(convoRef.id);
                } else {
                    console.warn("Conversation ID from URL doesn't exist and no recipient provided.");
                }
            }
        };

        loadOrCreateConversation();
    }, [currentUser, conversationIdFromURL, recipientIdFromURL]);

    // Section: Fetch user's conversations and participant info
    useEffect(() => {
        if (!currentUser) return;

        void (async function fetchConversationsWithUsers() {
            const convos = await fetchUserConversations(currentUser.uid);
            setConversations(convos);

            const map = {};
            for (const convo of convos) {
                const otherId = convo.users.find(uid => uid !== currentUser.uid);
                if (!map[otherId]) {
                    const snap = await getDoc(doc(db, "users", otherId));
                    if (snap.exists()) map[otherId] = snap.data();
                }
            }
            setParticipants(map);
        })();
    }, [currentUser]);

    // Section: Real-time message listener for active conversation
    useEffect(() => {
        if (!activeConversationId) return;

        const unsubscribe = listenToMessages(activeConversationId, setMessages);
        return () => unsubscribe();
    }, [activeConversationId]);

    // Section: Message sending handler
    const handleSend = async () => {
        if (!newMessage.trim() || !activeConversationId) return;

        const convo = conversations.find(c => c.id === activeConversationId);
        let toUid;

        if (convo) {
            toUid = convo.users.find(uid => uid !== currentUser.uid);
        } else if (recipientIdFromURL) {
            toUid = recipientIdFromURL;
        } else {
            console.error("No recipient found to send the message.");
            return;
        }

        await sendMessage(activeConversationId, currentUser.uid, toUid, newMessage);
        setNewMessage("");
    };

    // Section: Keyboard event for Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Section: Helper to get chat header name
    const getOtherUserName = () => {
        if (!activeConversationId || !conversations.length) return "User";

        const convo = conversations.find(c => c.id === activeConversationId);
        if (!convo) return "User";

        const otherId = convo.users.find(u => u !== currentUser?.uid);
        return participants[otherId]?.firstName || "User";
    };

    // Section: Sidebar toggling for mobile
    const toggleSidebar = () => {
        setShowSidebar(prev => !prev);
    };

    const closeSidebarOnMobile = () => {
        if (window.innerWidth <= 768) {
            setShowSidebar(false);
        }
    };

    // Section: Render JSX structure
    return (
        <div className="messages-page-container">
            {/* Overlay: closes sidebar on mobile */}
            {showSidebar && window.innerWidth <= 768 && (
                <div className="messages-page-overlay" onClick={toggleSidebar}></div>
            )}

            <div className="messages-page-inner">
                {/* Left Column: Conversation List Sidebar */}
                <div className={`messages-page-sidebar ${showSidebar ? "show" : ""}`}>
                    <h2 className="messages-page-sidebar-header">
                        Your Conversations
                        <button className="messages-page-close-sidebar" onClick={toggleSidebar}>
                            {/* Close icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z"/>
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5...snip for brevity" />
                            </svg>
                        </button>
                    </h2>
                    {conversations.length === 0 ? (
                        <p className="messages-page-no-convo">No conversations yet</p>
                    ) : (
                        conversations.map((conv) => {
                            const otherUserId = conv.users.find(p => p !== currentUser.uid);
                            const otherUser = participants[otherUserId];

                            return (
                                <div
                                    key={conv.id}
                                    className={`messages-page-convo-item ${activeConversationId === conv.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveConversationId(conv.id);
                                        closeSidebarOnMobile();
                                    }}
                                >
                                    {/* Avatar or placeholder */}
                                    {otherUser?.avatarUrl ? (
                                        <img
                                            src={otherUser.avatarUrl}
                                            alt="avatar"
                                            className="messages-page-avatar"
                                        />
                                    ) : (
                                        <div className="messages-page-avatar-placeholder">
                                            {otherUser?.firstName?.[0] || "U"}
                                        </div>
                                    )}
                                    <div className="messages-page-convo-info">
                                        <span className="messages-page-convo-name">
                                            {otherUser?.firstName || "User"}
                                        </span>
                                        <span className="messages-page-convo-preview">
                                            {conv.lastMessage || "No messages yet"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right Column: Chat Window */}
                <div className="messages-page-chat" ref={chatContainerRef}>
                    {/* Chat Header with toggle button */}
                    <div className="messages-page-chat-header">
                        <button className="messages-page-toggle-button" onClick={toggleSidebar}>
                            {/* Hamburger icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z"/>
                                <path d="M3 18h18v-2H3v2...snip" />
                            </svg>
                        </button>
                        <span className="messages-page-chat-header-name">{getOtherUserName()}</span>
                    </div>

                    {/* Chat Messages Section */}
                    {activeConversationId ? (
                        <div className="messages-page-chat-messages">
                            {messages.length === 0 ? (
                                <div className="messages-page-no-messages">No messages yet. Start the conversation!</div>
                            ) : (
                                messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`messages-page-chat-bubble ${m.from === currentUser?.uid ? "outgoing" : "incoming"}`}
                                    >
                                        {m.text}
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="messages-page-no-chat">Select a conversation to start messaging</div>
                    )}

                    {/* Message Input Section */}
                    {activeConversationId && (
                        <div className="messages-page-chat-input-container">
                            <div className="messages-page-chat-input">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    className="messages-page-send-button"
                                    onClick={handleSend}
                                    aria-label="Send message"
                                >
                                    {/* Send icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                        <path fill="none" d="M0 0h24v24H0z"/>
                                        <path d="M2.01 21L23...snip" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
