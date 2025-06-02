import React, {useState, useEffect, useRef} from "react";
import "./Messages.css";
import {ref, uploadBytes, getDownloadURL} from "firebase/storage";
import {storage} from "../firebase/firebase"; // make sure storage is imported
import { Eye } from "lucide-react";
// lucide icons
import { Send, Paperclip, Trash2, ShieldX, MoreVertical, ChevronRight } from "lucide-react";

// Firestore
import {
    doc,
    deleteDoc,
    collection,
    updateDoc,
    arrayUnion,
    getDocs,       // ← add this
    getDoc,
    setDoc,
    serverTimestamp,
    query,          // ✅ MISSING
    orderBy,        // ✅ MISSING
    limit
} from "firebase/firestore";
import {db} from "../firebase/firebase";

import {useSearchParams} from "react-router-dom";
import {useAuth} from "../firebase/firebaseAuth";
import {
    getConversationId,
    sendMessage,
    listenToMessages,
    fetchUserConversations,
    listenToUserConversations // ✅ this was missing
} from "../firebase/firestoreChat";


// Permanently deletes a conversation and all its messages subcollection
async function deleteConversation(convoId) {
    // 1) Delete every message doc
    const msgsCol = collection(db, "conversations", convoId, "messages");
    const msgsSnap = await getDocs(msgsCol);
    await Promise.all(msgsSnap.docs.map(d => deleteDoc(d.ref)));

    // 2) Delete the conversation document itself
    await deleteDoc(doc(db, "conversations", convoId));
}


function formatMessageTimestamp(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";

    const msgDate = timestamp.toDate();
    const now = new Date();

    const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (msgDay.getTime() === today.getTime()) {
        return msgDate.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    } else if (msgDay.getTime() === yesterday.getTime()) {
        return "Yesterday";
    } else {
        return msgDate.toLocaleDateString([], {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }
}

function groupMessagesByDate(messages) {
    const groups = {};

    messages.forEach(msg => {
        if (!msg.createdAt?.toDate) return;

        const date = msg.createdAt.toDate();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        let label = date.toLocaleDateString([], {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        const todayKey = today.toLocaleDateString();
        const yesterdayKey = yesterday.toLocaleDateString();
        const msgKey = msgDate.toLocaleDateString();

        if (msgKey === todayKey) label = "Today";
        else if (msgKey === yesterdayKey) label = "Yesterday";

        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(msg);
    });

    return groups;
}


const Messages = () => {
    const {currentUser} = useAuth();
    const [conversations, setConversations] = useState([]);
    const [participants, setParticipants] = useState({});
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchParams] = useSearchParams();
    const advertId = searchParams.get("advert");   // ← new
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [previewImageFilename, setPreviewImageFilename] = useState(null)
    const activeConvo = conversations.find(c => c.id === activeConversationId);
    const [showAlert, setShowAlert] = useState(false);
    const [advertTitles, setAdvertTitles] = useState({});
    const [conversationsLoaded, setConversationsLoaded] = useState(false);
    const [advertImages, setAdvertImages] = useState({});
    const [reactionMenuOpen, setReactionMenuOpen] = useState(null);
    const pressTimer = useRef(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [currentUserData, setCurrentUserData] = useState({});
    const [audioContext, setAudioContext] = useState(null);
    const [reactionMenuPosition, setReactionMenuPosition] = useState({ top: 0, left: 0 });


    const handleBlockUser = async () => {
        if (!currentUser || !otherUserId) return;

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                const currentBlocked = data.blockedUsers || [];

                if (!currentBlocked.includes(otherUserId)) {
                    const updatedBlocked = [...currentBlocked, otherUserId];

                    // ✅ Update Firestore
                    await setDoc(userRef, { blockedUsers: updatedBlocked }, { merge: true });

                    // 🔁 Refresh from Firestore to trigger a proper re-render
                    const refreshedSnap = await getDoc(userRef);
                    if (refreshedSnap.exists()) {
                        const updated = refreshedSnap.data().blockedUsers || [];
                        setBlockedUsers(updated);
                        setCurrentUserData(refreshedSnap.data());
                    }

                    alert("User blocked successfully.");
                } else {
                    alert("This user is already blocked.");
                }
            }
        } catch (err) {
            console.error("Failed to block user:", err);
            alert("Error blocking user.");
        }
    };

    const handleUnblockUser = async (userId) => {
        if (!currentUser || !userId) return;

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentBlocked = userSnap.data().blockedUsers || [];
                const updatedBlocked = currentBlocked.filter(id => id !== userId);

                await setDoc(userRef, { blockedUsers: updatedBlocked }, { merge: true });

                const refreshedSnap = await getDoc(userRef);
                if (refreshedSnap.exists()) {
                    setBlockedUsers(refreshedSnap.data().blockedUsers || []);
                    setCurrentUserData(refreshedSnap.data());
                }

                alert("User unblocked successfully.");
            }
        } catch (err) {
            console.error("Failed to unblock user:", err);
            alert("Error unblocking user.");
        }
    };





    const handlePressStart = (messageId, event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log("Press start initiated for message:", messageId);
        console.log("Event type:", event.type);
        console.log("Current reactionMenuOpen:", reactionMenuOpen);

        // Capture the element reference BEFORE setTimeout
        const msgElement = event.currentTarget;
        const rect = msgElement.getBoundingClientRect();

        clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => {
            console.log("Long press timer completed for message:", messageId);

            if (!msgElement) {
                console.log("No msgElement found!");
                return;
            }

            console.log("Message bubble rect:", rect);

            const top = rect.top - 50;
            const left = rect.left;
            const clampedLeft = Math.min(Math.max(0, left), window.innerWidth - 200);

            console.log("Setting menu position:", { top, left: clampedLeft });
            setReactionMenuPosition({ top, left: clampedLeft });

            console.log("About to set reactionMenuOpen to:", messageId);
            setReactionMenuOpen(messageId);
        }, 500);
    };


    const handlePressEnd = () => {
        clearTimeout(pressTimer.current);
    };

    const handleSelectReaction = async (messageId, emoji) => {
        try {
            await setDoc(doc(db, "conversations", activeConversationId, "messages", messageId), {
                reaction: emoji
            }, { merge: true });

            // Play pop sound
            playPopSound();

            // Add vibration for mobile devices
            if (navigator.vibrate) {
                navigator.vibrate(40); // 40ms vibration
            }

            setReactionMenuOpen(null); // Close the menu
        } catch (error) {
            console.error("Failed to save reaction:", error);
        }
    };

    useEffect(() => {
        console.log("reactionMenuOpen changed:", reactionMenuOpen);
    }, [reactionMenuOpen]);


    useEffect(() => {
        if (!currentUser?.uid) return;

        const fetchCurrentUserData = async () => {
            const userSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (userSnap.exists()) {
                setCurrentUserData(userSnap.data());
            }
        };

        fetchCurrentUserData();
    }, [currentUser]);


    useEffect(() => {
        if (!currentUser) return;

        const fetchBlocked = async () => {
            try {
                const snap = await getDoc(doc(db, "users", currentUser.uid));
                if (snap.exists()) {
                    setBlockedUsers(snap.data().blockedUsers || []);
                }
            } catch (err) {
                console.error("Failed to fetch blocked users:", err);
            }
        };

        fetchBlocked();
    }, [currentUser]);



    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = listenToUserConversations(currentUser.uid, (convos) => {
            setConversations(convos);
            setConversationsLoaded(true);
        });

        return () => unsubscribe();
    }, [currentUser]);


// 👇 rest of your useEffects...
    useEffect(() => {
        const prev = document.body.style.overflowY;
        document.body.style.overflowY = "hidden";
        return () => {
            document.body.style.overflowY = prev;
        };
    }, []);

    useEffect(() => {
        const markAsRead = async () => {
            if (!currentUser || !activeConversationId) return;

            const convoRef = doc(db, "conversations", activeConversationId);
            const convoSnap = await getDoc(convoRef);

            if (convoSnap.exists()) {
                const data = convoSnap.data();
                const msg = data.lastMessage;

                // If unread and not already marked read by this user
                if (
                    msg &&
                    msg.senderId !== currentUser.uid &&
                    (!msg.readBy || !msg.readBy.includes(currentUser.uid))
                ) {
                    await updateDoc(convoRef, {
                        "lastMessage.readBy": arrayUnion(currentUser.uid)
                    });
                }
            }
        };

        markAsRead().catch(console.error);
    }, [activeConversationId, currentUser]);


// ✅ Safely fetch other user's info from the active conversation
    const getOtherUserInfo = () => {
        if (!activeConversationId || !conversations.length) return {};

        const convo = conversations.find(c => c.id === activeConversationId);
        if (!convo) return {};

        const otherId = convo.users.find(u => u !== currentUser.uid);
        return participants[otherId] || {};
    };

// ✅ Compute isOnline using lastSeen timestamp
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser || !activeConversationId) return;

        const ext = file.name.split(".").pop();
        const fileRef = ref(storage, `chat_uploads/${activeConversationId}/${Date.now()}.${ext}`);

        try {
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            const convo = conversations.find(c => c.id === activeConversationId);
            const toUid = convo?.users.find(u => u !== currentUser.uid) || recipientIdFromURL;

            await sendMessage(activeConversationId, currentUser.uid, toUid, url, file.name);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload attachment.");
        }
    };


    const messagesEndRef = useRef(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const conversationIdFromURL = searchParams.get("c");
    const recipientIdFromURL = searchParams.get("recipient");


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setPreviewImageUrl(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);


    useEffect(() => {
        // Find which element is causing overflow
        const findOverflow = () => {
            const allElements = document.querySelectorAll('*');
            for (let elem of allElements) {
                const style = window.getComputedStyle(elem);
                if (style.position === 'fixed') continue; // Skip fixed elements

                // Check if element is wider or taller than viewport
                const rect = elem.getBoundingClientRect();
                if (rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
                    console.log('Element causing overflow:', elem, rect);
                }
            }
        };

        // Run after a short delay to ensure layout is complete
        setTimeout(findOverflow, 1000);
    }, []);
    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // Show footer - ensure it's always visible
    useEffect(() => {
        const footer = document.querySelector("footer");
        if (footer) {
            footer.style.display = "block";
        }
    }, []);

    // Handle starting from recipient ID
    useEffect(() => {
        const loadOrCreateConversation = async () => {
            if (!currentUser) return;

            if (recipientIdFromURL) {
                const convoId = getConversationId(currentUser.uid, recipientIdFromURL, advertId);
                const convoRef = doc(db, "conversations", convoId);
                const convoSnap = await getDoc(convoRef);

                // ✅ Fetch advertTitle from Firestore
                let advertTitle = "Conversation";
                if (advertId) {
                    try {
                        const advertRef = doc(db, "allListings", advertId);
                        const advertSnap = await getDoc(advertRef);
                        if (advertSnap.exists()) {
                            const advertData = advertSnap.data();
                            advertTitle = advertData.title || "Conversation";
                        }
                    } catch (err) {
                        console.error("Failed to fetch advert title:", err);
                    }
                }

                if (!convoSnap.exists()) {
                    await setDoc(convoRef, {
                        users: [currentUser.uid, recipientIdFromURL],
                        createdAt: serverTimestamp(),
                        lastMessage: "",
                        lastUpdated: serverTimestamp(),
                        advertId: advertId || "",
                        advertTitle // ✅ use fetched title
                    });
                }

                setActiveConversationId(convoId);

            } else if (conversationIdFromURL) {
                const convoRef = doc(db, "conversations", conversationIdFromURL);
                const convoSnap = await getDoc(convoRef);

                // ✅ Fetch advertTitle here too, in case convo doesn't exist
                let advertTitle = "Conversation";
                if (advertId) {
                    try {
                        const advertRef = doc(db, "allListings", advertId);
                        const advertSnap = await getDoc(advertRef);
                        if (advertSnap.exists()) {
                            const advertData = advertSnap.data();
                            advertTitle = advertData.title || "Conversation";
                        }
                    } catch (err) {
                        console.error("Failed to fetch advert title:", err);
                    }
                }

                if (convoSnap.exists()) {
                    setActiveConversationId(convoSnap.id);
                } else {
                    await setDoc(convoRef, {
                        users: [currentUser.uid, recipientIdFromURL],
                        createdAt: serverTimestamp(),
                        lastMessage: "",
                        lastUpdated: serverTimestamp(),
                        advertId: advertId || "",
                        advertTitle // ✅ use fetched title here too
                    });

                    setActiveConversationId(convoRef.id);
                }
            }
        };

        loadOrCreateConversation();
    }, [currentUser, conversationIdFromURL, recipientIdFromURL,]);


    // Fetch user conversations and participants
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

            const titleMap = {};
            const imageMap = {}; // ✅ add this line
            for (const convo of convos) {
                if (convo.advertId && !titleMap[convo.advertId]) {
                    try {
                        const adSnap = await getDoc(doc(db, "allListings", convo.advertId));
                        if (adSnap.exists()) {
                            const adData = adSnap.data();
                            titleMap[convo.advertId] = adData.title || "Advert";
                            imageMap[convo.advertId] = adData.images?.[0] || null;


                        }

                    } catch (err) {
                        console.error("Failed to fetch advert title for:", convo.advertId, err);
                    }
                }
            }
            setAdvertTitles(titleMap);
            setAdvertImages(imageMap); // ✅ new state


        })();
    }, [currentUser]);

    // Load messages for the active conversation
    // Load messages and sync reactions
    useEffect(() => {
        if (!activeConversationId || !conversationsLoaded) return;

        const unsubscribe = listenToMessages(activeConversationId, (msgs) => {
            setMessages(msgs);

            const reactionMap = {};
            msgs.forEach((msg) => {
                if (msg.reaction) {
                    reactionMap[msg.id] = msg.reaction;
                }
            });
            setMessageReactions(reactionMap);
        });

        return () => unsubscribe();
    }, [activeConversationId, conversationsLoaded]);

    useEffect(() => {
        // Create AudioContext only when needed
        const initializeAudio = () => {
            if (!audioContext) {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                setAudioContext(context);
            }
        };

        // Add event listener for user interaction to enable audio
        document.addEventListener('click', initializeAudio, { once: true });

        return () => {
            document.removeEventListener('click', initializeAudio);
        };
    }, [audioContext]);

    const playPopSound = () => {
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    };


    // Send a message
    const handleSend = async () => {
        if (!newMessage.trim() && !selectedFile) return;
        if (!activeConversationId) return;

        const convo = conversations.find(c => c.id === activeConversationId);
        const toUid = convo?.users.find(uid => uid !== currentUser.uid) || recipientIdFromURL;
        if (!toUid) return;


        try {
            if (selectedFile) {
                // Upload file to Firebase Storage
                const fileRef = ref(storage, `messages/${activeConversationId}/${Date.now()}_${selectedFile.name}`);
                await uploadBytes(fileRef, selectedFile);
                const fileURL = await getDownloadURL(fileRef);

                // Send the file URL as the message
                await sendMessage(activeConversationId, currentUser.uid, toUid, fileURL, selectedFile.name);
                setSelectedFile(null);
            } else {
                await sendMessage(activeConversationId, currentUser.uid, toUid, newMessage);
            }

            setNewMessage("");
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };


    // Handle enter key in input
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Replace your existing getOtherUserName with this:

    const getOtherUserName = () => {
        if (!activeConversationId || !conversations.length) return "User";

        const convo = conversations.find(c => c.id === activeConversationId);
        if (!convo) return "User";

        const otherId = convo.users.find(u => u !== currentUser.uid);
        const user = participants[otherId] || {};

        // Build “First Last” and fall back to “User”
        const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ");

        return fullName || "User";
    };

    const otherUser = getOtherUserInfo();
    const otherUserId = conversations
        .find(c => c.id === activeConversationId)
        ?.users.find(u => u !== currentUser?.uid);
    const isOnline = otherUser?.lastSeen?.seconds > Date.now() / 1000 - 300;


    return (
        <div className="messages-page-container">
            {showAlert && (
                <div className="messages-page-alert">
                    Please select a conversation first
                </div>
            )}

            <div className="messages-page-inner">
                {/* Left Column: Conversation List */}


                <div className={`messages-page-sidebar ${showSidebar ? "show" : ""}`}>



                    <h2 className="messages-page-sidebar-header">Your Conversations</h2>
                    <button
                        className="messages-page-sidebar-close"
                        onClick={() => {
                            if (activeConversationId) {
                                setShowSidebar(false);
                            } else {
                                setShowAlert(true);
                                setTimeout(() => setShowAlert(false), 2500); // auto-hide after 2.5s
                            }
                        }}
                    >
                        ✕
                    </button>

                    {conversations.length === 0 ? (
                        <p className="messages-page-no-convo">No conversations yet</p>
                    ) : (
                        conversations.map((conv) => {
                            const otherId = conv.users.find(u => u !== currentUser.uid);
                            console.log("Checking convo with:", otherId, "→ Blocked?", blockedUsers.includes(otherId));
                            const isBlocked = blockedUsers.includes(otherId); // ✅ This is the correct per-convo check                            const otherUser = participants[otherId] || {}; // ✅ ADD THIS
                            const otherUser = participants[otherId] || {};
                            const initials = (
                                (otherUser.firstName?.[0] ?? "") +
                                (otherUser.lastName?.[0] ?? "")
                            ).toUpperCase() || "U";

                            // get raw title (from advert or fallback)
                            const rawTitle =
                                advertTitles[conv.advertId] ||
                                `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() ||
                                "Conversation";

                            const isUnread =
                                conv.lastMessageSenderId &&
                                conv.lastMessageSenderId !== currentUser?.uid &&
                                activeConversationId !== conv.id;


                            // truncate to 60 chars


                            const preview = conv.lastMessage || "No messages yet";
                            const nameToShow =
                                `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() ||
                                "User";

                            return (
                                <div
                                    key={conv.id}
                                    className={`messages-page-convo-item ${
                                        activeConversationId === conv.id ? "active" : ""
                                    } ${isUnread ? "unread" : ""} ${isBlocked ? "blocked" : ""}`}
                                    onClick={() => {
                                        if (isBlocked) {
                                            alert("❌ You have blocked this user. Unblock to send messages.");
                                            return;
                                        }

                                        const url = new URLSearchParams();
                                        url.set("recipient", otherId);
                                        if (conv.advertId) url.set("advert", conv.advertId);
                                        if (advertTitles[conv.advertId]) url.set("title", advertTitles[conv.advertId]);

                                        window.history.replaceState(null, "", `/messages?${url.toString()}`);
                                        setActiveConversationId(conv.id);
                                        if (window.innerWidth <= 768) setShowSidebar(false);
                                    }}
                                >
                                    {advertImages[conv.advertId] ? (
                                        <div className="messages-page-avatar-wrapper">
                                            <img
                                                src={advertImages[conv.advertId]}
                                                alt="avatar"
                                                className="messages-page-avatar-image"
                                            />
                                        </div>
                                    ) : (
                                        <div className="messages-page-avatar-placeholder">
                                            {initials}
                                        </div>
                                    )}

                                    {isBlocked && (
                                        <div className="blocked-message-warning">

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Don't open convo
                                                    handleUnblockUser(otherId);
                                                }}
                                                className="messages-page-unblock-button"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    )}


                                    <div className="messages-page-convo-details">
  <span className="messages-page-convo-title">
  {rawTitle.slice(0, 60)}</span>


                                        <span className="messages-page-convo-preview">
    <strong>{(conv.lastMessageSenderName || nameToShow || "").split(" ")[0]}:</strong>
                                            {conv.lastMessageText || preview}
  </span>

                                        <span className="messages-page-convo-timestamp">
  {conv.lastUpdated?.toDate ? formatMessageTimestamp(conv.lastUpdated) : ""}
</span>


                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>


                {/* Right Column: Chat Window */}
                {/* Right Column: Chat Window */}
                <div className="messages-page-chat">
                    {activeConversationId ? (
                        <>
                            <div className="messages-page-chat-header">
                                <div
                                    className="messages-page-chat-header-info"
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    {/* Left: Sidebar toggle (mobile only) + Name */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <button
                                            className="messages-page-toggle-button"
                                            onClick={() => setShowSidebar((old) => !old)}
                                            aria-label="Toggle sidebar"
                                        >
                                            <ChevronRight />
                                        </button>

                                        <span className="messages-page-chat-header-name">
        {getOtherUserName()}
      </span>
                                    </div>

                                    {/* Right: Online status + Menu */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                                        <div className="messages-page-chat-header-status">
        <span
            className="status-dot"
            style={{ backgroundColor: isOnline ? "#4caf50" : "#ccc" }}
        />
                                            {isOnline ? "Online" : "Offline"}
                                        </div>

                                        <button
                                            className="messages-page-mobile-menu-button"
                                            onClick={() => setMobileMenuOpen((o) => !o)}
                                            aria-label="Open conversation menu"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>
                                </div>
                                {mobileMenuOpen && (
                                    <div className="messages-page-dropdown">
                                        {activeConvo?.advertId && (
                                            <>
                                                <button
                                                    className="dropdown-item"
                                                    disabled
                                                    style={{ cursor: "default", color: "#444", fontWeight: 500 }}
                                                >
                                                    ID: {activeConvo.advertId}
                                                </button>

                                                <button
                                                    className="dropdown-item view-advert-item"
                                                    onClick={() => {
                                                        setMobileMenuOpen(false);
                                                        window.location.href = `/advert-details/${activeConvo.advertId}`;
                                                    }}
                                                    title="View Advert"
                                                >
                                                    <Eye size={18} style={{ marginRight: 8 }} />
                                                    View Advert
                                                </button>
                                            </>
                                        )}

                                        <button
                                            className="dropdown-item"
                                            onClick={async () => {
                                                setMobileMenuOpen(false);
                                                if (window.confirm("Are you sure you want to report this user? This will flag the conversation for admin review.")) {
                                                    try {
                                                        const reportRef = doc(collection(db, "reports"));
                                                        const messagesQuery = query(
                                                            collection(db, "conversations", activeConversationId, "messages"),
                                                            orderBy("createdAt", "desc"),
                                                            limit(10)
                                                        );
                                                        const messagesSnap = await getDocs(messagesQuery);
                                                        const messageSnapshot = messagesSnap.docs.map(doc => {
                                                            const data = doc.data();
                                                            return {
                                                                from: data.from,
                                                                text: data.text || "",
                                                                filename: data.filename || "",
                                                                createdAt: data.createdAt
                                                            };
                                                        }).reverse();

                                                        await setDoc(reportRef, {
                                                            reportedBy: currentUser.uid,
                                                            reportedUser: otherUserId,
                                                            conversationId: activeConversationId,
                                                            timestamp: serverTimestamp(),
                                                            reason: "Flagged via messages",
                                                            status: "pending",
                                                            messageSnapshot
                                                        });
                                                        alert("✅ User has been reported. Our team will review the messages.");
                                                    } catch (err) {
                                                        console.error("Failed to submit report:", err);
                                                        alert("⚠️ Failed to submit report. Please try again later.");
                                                    }
                                                }
                                            }}
                                        >
                                            Report User
                                        </button>

                                        <button
                                            className="dropdown-item"
                                            onClick={async () => {
                                                setMobileMenuOpen(false);
                                                if (window.confirm("Are you sure you want to permanently delete this conversation?")) {
                                                    await deleteConversation(activeConversationId);
                                                    setConversations(cs => cs.filter(c => c.id !== activeConversationId));
                                                    setActiveConversationId(null);
                                                }
                                            }}
                                            title="Delete Conversation"
                                        >
                                            <Trash2 size={18} style={{ marginRight: 8 }} />
                                            Delete
                                        </button>

                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                if (window.confirm("Are you sure you want to block this user?")) {
                                                    handleBlockUser();
                                                }
                                            }}
                                            title="Block User"
                                        >
                                            <ShieldX size={18} style={{ marginRight: 8 }} />
                                            Block
                                        </button>
                                    </div>
                                )}
                            </div>



                            {/* Messages list */}
                            <div className="messages-page-chat-messages">
                                {Object.entries(groupMessagesByDate(messages)).map(([dateLabel, msgs]) => (
                                    <div key={dateLabel} className="messages-group">
                                        <div className="messages-date-label">{dateLabel}</div>

                                        {msgs.map(m => (
                                            <div
                                                key={m.id}
                                                className={`messages-page-chat-bubble ${
                                                    m.from === currentUser?.uid ? "outgoing" : "incoming"
                                                }`}
                                                onMouseDown={e => m.from !== currentUser?.uid && handlePressStart(m.id, e)}
                                                onMouseUp={handlePressEnd}
                                                onMouseLeave={handlePressEnd}
                                                onTouchStart={e => m.from !== currentUser?.uid && handlePressStart(m.id, e)}
                                                onTouchEnd={handlePressEnd}
                                                onTouchCancel={handlePressEnd}
                                                onDoubleClick={() => m.from !== currentUser?.uid && handleSelectReaction(m.id, "❤️")}                                                onContextMenu={e => e.preventDefault()}
                                            >
                                                <div className="message-text-content">
                                                    {m.filename ? (
                                                        /\.(jpg|jpeg|png|gif|webp)$/i.test(m.filename) ? (
                                                            <div
                                                                className="image-thumbnail-wrapper"
                                                                onClick={() => {
                                                                    setPreviewImageUrl(m.text);
                                                                    setPreviewImageFilename(m.filename);
                                                                }}
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                <img
                                                                    src={m.text}
                                                                    alt={m.filename}
                                                                    className="messages-page-image-thumbnail"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <a href={m.text} target="_blank" rel="noopener noreferrer">
                                                                📎 {m.filename}
                                                            </a>
                                                        )
                                                    ) : (
                                                        m.text
                                                    )}
                                                </div>

                                                {messageReactions[m.id] && (
                                                    <div className="reaction-floating">{messageReactions[m.id]}</div>
                                                )}

                                                {reactionMenuOpen === m.id && (
                                                    <div
                                                        className="reaction-menu"
                                                        style={{
                                                            position: "fixed",
                                                            top: reactionMenuPosition.top,
                                                            left: reactionMenuPosition.left,
                                                            display: "flex",
                                                            flexDirection: "row",
                                                            gap: "10px",
                                                            background: "white",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "10px",
                                                            padding: "5px 10px",
                                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                            zIndex: 1000,
                                                            fontSize: "1.4rem",

                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        {["❤️", "😆", "😮", "😢", "👍", "👎"].map((emoji) => (
                                                            <span
                                                                key={emoji}
                                                                className="reaction-emoji"
                                                                onClick={() => handleSelectReaction(m.id, emoji)}
                                                                style={{
                                                                    cursor: "pointer",
                                                                    padding: "4px 8px",
                                                                    fontSize: "1.3rem",
                                                                    borderRadius: "100%",
                                                                    transition: "background-color 0.2s"
                                                                }}
                                                                onMouseLeave={e => e.target.style.backgroundColor = "transparent"}
                                                            >
                        {emoji}
                    </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                    </div>
                                ))}
                                <div ref={messagesEndRef}/>
                            </div>


                            {/* Input */}
                            <div className="messages-page-chat-input">
                                <div className="messages-page-input-container">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <label className="attachment-icon-inner">
                                        <Paperclip size={18} />
                                        <input
                                            type="file"
                                            style={{display: "none"}}
                                            onChange={handleFileUpload}
                                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                                        />
                                    </label>
                                </div>
                                <button
                                    className="messages-page-send-button"
                                    onClick={handleSend}
                                    aria-label="Send message"
                                >
                                    <Send />
                                </button>
                            </div>

                        </>
                    ) : (
                        <div className="messages-page-no-chat">
                            Select a conversation to start messaging
                        </div>
                    )}
                </div>

            </div>
            {previewImageUrl && (
                <div className="image-preview-modal" onClick={() => setPreviewImageUrl(null)}>
                    <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="image-preview-close"
                            onClick={() => setPreviewImageUrl(null)}
                        >
                            ×
                        </button>

                        <img src={previewImageUrl} alt={previewImageFilename}/>
                    </div>
                </div>
            )}


        </div>

    );
};

export default Messages;