import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import "./Messages.css";
import {ref, uploadBytes, getDownloadURL} from "firebase/storage";
import {storage} from "../firebase/firebase";
import { Eye } from "lucide-react";
import { Send, Paperclip, Trash2, ShieldX, MoreVertical, ChevronRight } from "lucide-react";

// Firestore
import {
    doc,
    deleteDoc,
    collection,
    updateDoc,
    arrayUnion,
    getDocs,
    getDoc,
    setDoc,
    writeBatch,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit
} from "firebase/firestore";
import {db} from "../firebase/firebase";

import {useSearchParams, useNavigate} from "react-router-dom";
import {useAuth, auth} from "../firebase/firebaseAuth";
import {
    getConversationId,
    sendMessage,
    listenToMessages,
    listenToUserConversations,
    loadOrCreateConversation  // ✅ ADDED: Missing import
} from "../firebase/firestoreChat";
import {Helmet} from "react-helmet-async";
import { useLoginModal } from "../context/LoginContext";

// Helper function to get main image URL
function getMainImageUrl(ad) {
    if (ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
        const mainIndex = ad.mainImageIndex;
        if (typeof mainIndex === 'number' && mainIndex >= 0 && mainIndex < ad.images.length) {
            return ad.images[mainIndex];
        }
        return ad.images[0];
    }
    return null;
}

// Permanently deletes a conversation and all its messages subcollection
async function deleteConversation(convoId) {
    const msgsCol = collection(db, "conversations", convoId, "messages");
    const msgsSnap = await getDocs(msgsCol);
    await Promise.all(msgsSnap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "conversations", convoId));
}


export const sendMessageWithStatus = async (conversationId, fromUid, toUid, messageText, filename = null) => {
    try {
        const messageRef = doc(collection(db, "conversations", conversationId, "messages"));

        const messageData = {
            id: messageRef.id,
            from: fromUid,
            to: toUid,
            text: messageText,
            createdAt: serverTimestamp(),
            deliveredAt: serverTimestamp(),
            readBy: [fromUid], // Initially only includes sender
            status: 'delivered'
        };

        if (filename) {
            messageData.filename = filename;
        }

        await setDoc(messageRef, messageData);

        // ✅ CRITICAL: Update conversation with lastUpdated timestamp for each new message
        const convoRef = doc(db, "conversations", conversationId);
        const updateData = {
            lastMessage: messageText,
            lastMessageText: filename ? `📎 ${filename}` : messageText,
            lastMessageSenderId: fromUid,
            lastUpdated: serverTimestamp(), // ✅ This triggers unread detection
        };

        // ✅ IMPORTANT: Don't update readBy when sending a new message
        // This ensures the recipient will see it as unread

        await updateDoc(convoRef, updateData);

        console.log('✅ Message sent and conversation updated:', {
            messageId: messageRef.id,
            conversationId,
            from: fromUid,
            to: toUid,
            hasFile: !!filename
        });

        return messageRef.id;
    } catch (error) {
        console.error("❌ Error sending message:", error);
        throw error;
    }
};

const MessageStatus = ({ message, currentUserId }) => {
    if (message.from !== currentUserId) {
        return null; // Only show status for outgoing messages
    }

    const getStatusIcon = () => {
        if (message.readBy && message.readBy.length > 1) {
            // Message has been read
            return <span className="tick-icon read" title="Read"></span>;
        } else if (message.deliveredAt || message.createdAt) {
            // Message has been delivered
            return <span className="tick-icon double" title="Delivered"></span>;
        } else {
            // Message sent but not delivered
            return <span className="tick-icon single" title="Sent"></span>;
        }
    };

    return (
        <div className="message-status-ticks">
            {getStatusIcon()}
        </div>
    );
};

// Function to mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
    try {
        console.log('📧 Marking messages as read for conversation:', conversationId, 'user:', userId);

        const messagesRef = collection(db, "conversations", conversationId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "desc"), limit(100));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        let hasMessageUpdates = false;

        snapshot.docs.forEach(docSnap => {
            const message = docSnap.data();

            if (message.from !== userId &&
                (!message.readBy || !message.readBy.includes(userId))) {

                batch.update(docSnap.ref, {
                    readBy: arrayUnion(userId),
                    readAt: serverTimestamp()
                });
                hasMessageUpdates = true;
            }
        });

        // ✅ CRITICAL: Always update conversation read status
        const convoRef = doc(db, "conversations", conversationId);
        batch.update(convoRef, {
            [`readBy.${userId}`]: serverTimestamp()
        });

        await batch.commit();

        // ✅ MOBILE: Force refresh on mobile after marking as read
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                setMobileRefreshTrigger(prev => prev + 1);
                console.log('📱 Mobile refresh triggered after marking as read');
            }, 100);
        }

        if (hasMessageUpdates) {
            console.log('✅ Messages and conversation marked as read successfully');
        } else {
            console.log('✅ Conversation marked as read (no new messages to update)');
        }

    } catch (error) {
        console.error("❌ Error marking messages as read:", error);
    }
};



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
    const navigate = useNavigate();
    const { openLogin } = useLoginModal();
    const [conversations, setConversations] = useState([]);
    const [participants, setParticipants] = useState({});
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchParams] = useSearchParams();
    const advertId = searchParams.get("advert");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [previewImageFilename, setPreviewImageFilename] = useState(null)
    const activeConvo = conversations.find(c => c.id === activeConversationId);
    const [advertTitles, setAdvertTitles] = useState({});
    const [conversationsLoaded, setConversationsLoaded] = useState(false);
    const [advertImages, setAdvertImages] = useState({});
    const [reactionMenuOpen, setReactionMenuOpen] = useState(null);
    const pressTimer = useRef(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [audioContext, setAudioContext] = useState(null);
    const [reactionMenuPosition, setReactionMenuPosition] = useState({ top: 0, left: 0 });
    const [authChecked, setAuthChecked] = useState(false);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [participantsLoaded, setParticipantsLoaded] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [mobileRefreshTrigger, setMobileRefreshTrigger] = useState(0);

    // ✅ DEBUG: Add this to see what's causing loading state
    useEffect(() => {
        console.log('🔍 LOADING STATE DEBUG:', {
            authChecked,
            currentUser: !!currentUser,
            conversationsLoaded,
            activeConversationId,
            messagesLength: messages.length,
            participantsLoaded,
            conversationsCount: conversations.length,
            // Check if any of these are causing the loading state
            isAuthCheckComplete: authChecked,
            isUserLoggedIn: !!currentUser,
            areConversationsLoaded: conversationsLoaded,
            hasActiveConversation: !!activeConversationId,
            hasMessages: messages.length >= 0, // This should be true even for empty array
            areParticipantsLoaded: participantsLoaded
        });
    }, [authChecked, currentUser, conversationsLoaded, activeConversationId, messages.length, participantsLoaded, conversations.length]);

    // ✅ FIXED: Better participant name function with proper error handling
    const getParticipantName = (userId) => {
        if (!userId || userId === 'undefined') {
            console.warn('⚠️ Invalid userId provided to getParticipantName:', userId);
            return "User";
        }

        const user = participants[userId];
        if (!user) {
            console.warn('⚠️ No participant data found for userId:', userId);
            return "Loading...";
        }

        // Build full name from firstName and lastName
        const firstName = user.firstName?.trim() || "";
        const lastName = user.lastName?.trim() || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");

        if (fullName) {
            console.log('✅ Found name for user', userId, ':', fullName);
            return fullName;
        }

        // Fallback to email if no name
        if (user.email) {
            console.log('📧 Using email as fallback for user', userId, ':', user.email);
            return user.email.split('@')[0];
        }

        console.warn('⚠️ No name or email found for user:', userId, user);
        return "User";
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let needsCleanup = false;

        // Clean up undefined recipient
        if (urlParams.get("recipient") === "undefined") {
            urlParams.delete("recipient");
            needsCleanup = true;
        }

        // Clean up undefined advert
        if (urlParams.get("advert") === "undefined") {
            urlParams.delete("advert");
            needsCleanup = true;
        }

        // Clean up malformed conversation IDs containing "undefined"
        const conversationId = urlParams.get("c");
        if (conversationId && conversationId.includes("_undefined")) {
            urlParams.delete("c");
            needsCleanup = true;
            console.log('🧹 Removing malformed conversation ID:', conversationId);
        }

        // If we cleaned anything up, redirect to the clean URL
        if (needsCleanup) {
            const cleanUrl = urlParams.toString() ?
                `/messages?${urlParams.toString()}` :
                '/messages';
            console.log('🧹 Cleaning up malformed URL, redirecting to:', cleanUrl);
            window.location.replace(cleanUrl);
            return;
        }
    }, []);

    // Force re-render when participants are loaded
    useEffect(() => {
        if (Object.keys(participants).length > 0) {
            console.log('🔄 PARTICIPANTS LOADED - forcing component update:', participants);
            setParticipantsLoaded(true);
        }
    }, [participants]);

    // ✅ FIXED: Use useMemo for expensive calculations with proper dependencies
    const memoizedConversations = useMemo(() => {
        if (!conversationsLoaded || conversations.length === 0) return [];

        console.log('🔄 Recalculating conversations list', {
            mobile: window.innerWidth <= 768,
            refreshTrigger: mobileRefreshTrigger,
            timestamp: new Date().toISOString()
        });

        return conversations
            .filter(convo => {
                const hasValidUsers = convo.users &&
                    convo.users.length === 2 &&
                    convo.users.every(uid => uid && uid !== 'undefined');
                return hasValidUsers;
            })
            .sort((a, b) => {
                const aTime = a.lastUpdated?.toDate?.() || new Date(0);
                const bTime = b.lastUpdated?.toDate?.() || new Date(0);
                return bTime.getTime() - aTime.getTime();
            })
            .map((conv) => {
                const otherId = conv.users.find(u => u !== currentUser.uid);
                const otherUser = participants[otherId] || {};
                const participantName = getParticipantName(otherId);

                const firstName = otherUser.firstName?.trim() || "";
                const lastName = otherUser.lastName?.trim() || "";
                const initials = (firstName[0] || "") + (lastName[0] || "");
                const displayInitials = initials || "?";

                const isBlocked = blockedUsers.includes(otherId);
                const rawTitle = advertTitles[conv.advertId] || participantName || "Conversation";

                // ✅ ENHANCED: Better unread detection for mobile
                const userReadTimestamp = conv.readBy?.[currentUser?.uid];
                const lastMessageTimestamp = conv.lastUpdated;

                const isUnread = conv.lastMessageSenderId &&
                    conv.lastMessageSenderId !== currentUser?.uid &&
                    activeConversationId !== conv.id &&
                    (!userReadTimestamp ||
                        (lastMessageTimestamp && lastMessageTimestamp.toDate() > userReadTimestamp.toDate()));

                console.log('🔍 Conversation unread check:', conv.id, {
                    isUnread,
                    lastMessageSender: conv.lastMessageSenderId,
                    currentUser: currentUser?.uid,
                    activeConvo: activeConversationId,
                    userReadTime: userReadTimestamp?.toDate(),
                    lastMessageTime: lastMessageTimestamp?.toDate()
                });

                const lastMessageSenderName = (() => {
                    if (conv.lastMessageSenderId === currentUser?.uid) {
                        return "You";
                    } else if (conv.lastMessageSenderId === otherId) {
                        return participantName.split(" ")[0] || "User";
                    } else {
                        const senderName = getParticipantName(conv.lastMessageSenderId);
                        return senderName.split(" ")[0] || "User";
                    }
                })();

                return {
                    ...conv,
                    otherId,
                    displayInitials,
                    participantName,
                    isBlocked,
                    rawTitle,
                    isUnread,
                    lastMessageSenderName,
                    advertImage: advertImages[conv.advertId],
                    timestamp: conv.lastUpdated?.toDate ? formatMessageTimestamp(conv.lastUpdated) : ""
                };
            });
    }, [conversations, participants, advertTitles, advertImages, blockedUsers, currentUser, activeConversationId, conversationsLoaded, mobileRefreshTrigger]); // ✅ Added mobileRefreshTrigger

    // ✅ OPTIMIZED: Memoized conversation click handler
    const handleConversationClick = useCallback((conv) => {
        if (conv.isBlocked) {
            alert("❌ You have blocked this user. Unblock to send messages.");
            return;
        }

        const url = new URLSearchParams();
        url.set("recipient", conv.otherId);
        if (conv.advertId) url.set("advert", conv.advertId);
        if (advertTitles[conv.advertId]) url.set("title", advertTitles[conv.advertId]);

        window.history.replaceState(null, "", `/messages?${url.toString()}`);
        setActiveConversationId(conv.id);
        if (window.innerWidth <= 768) setShowSidebar(false);
    }, [advertTitles]);

    const messagesEndRef = useRef(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const recipientIdFromURL = searchParams.get("recipient");

    // ✅ CLEAN UP MALFORMED URLs
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let needsCleanup = false;

        if (urlParams.get("recipient") === "undefined") {
            urlParams.delete("recipient");
            needsCleanup = true;
        }

        const conversationId = urlParams.get("c");
        if (conversationId && conversationId.includes("_undefined")) {
            urlParams.delete("c");
            needsCleanup = true;
        }

        if (needsCleanup) {
            const cleanUrl = urlParams.toString() ?
                `/messages?${urlParams.toString()}` :
                '/messages';
            console.log('🧹 Cleaning up malformed URL, redirecting to:', cleanUrl);
            window.location.replace(cleanUrl);
            return;
        }
    }, []);

    // ✅ Authentication state handler
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setAuthChecked(true);
            if (!user) {
                const currentUrl = window.location.pathname + window.location.search;
                sessionStorage.setItem('redirectAfterLogin', currentUrl);

                if (window.confirm('You need to log in to view messages. Would you like to log in now?')) {
                    openLogin();
                } else {
                    navigate('/');
                }
            }
        });

        return () => unsubscribe();
    }, [navigate, openLogin]);

    // ✅ Handle redirect after login
    useEffect(() => {
        if (currentUser && authChecked) {
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl && redirectUrl !== window.location.pathname + window.location.search) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }
        }
    }, [currentUser, authChecked]);

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
                    await setDoc(userRef, { blockedUsers: updatedBlocked }, { merge: true });

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

        const msgElement = event.currentTarget;
        const rect = msgElement.getBoundingClientRect();

        clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => {
            const top = rect.top - 50;
            const left = rect.left;
            const clampedLeft = Math.min(Math.max(0, left), window.innerWidth - 200);

            setReactionMenuPosition({ top, left: clampedLeft });
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

            playPopSound();

            if (navigator.vibrate) {
                navigator.vibrate(40);
            }

            setReactionMenuOpen(null);
        } catch (error) {
            console.error("Failed to save reaction:", error);
        }
    };

    // ✅ FIXED: Fetch current user data effect
    useEffect(() => {
        if (!currentUser?.uid) return;

        const fetchCurrentUserData = async () => {
            try {
                const userSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (userSnap.exists()) {
                    setCurrentUserData(userSnap.data());
                }
            } catch (error) {
                console.error("Error fetching current user data:", error);
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

    // ✅ FIXED: Enhanced conversation loading with better duplicate prevention
    useEffect(() => {
        if (!currentUser) return;

        console.log('🔄 Setting up conversation listener for user:', currentUser.uid);

        const unsubscribe = listenToUserConversations(currentUser.uid, async (convos) => {
            console.log('📧 Conversations received:', convos.length);

            // Filter out conversations with undefined users
            const validConvos = convos.filter(convo => {
                const hasValidUsers = convo.users &&
                    convo.users.length === 2 &&
                    convo.users.every(uid => uid && uid !== 'undefined');

                if (!hasValidUsers) {
                    console.warn('⚠️ Filtering out invalid conversation:', convo.id, convo.users);
                }
                return hasValidUsers;
            });

            setConversations(validConvos);
            setConversationsLoaded(true);

            // ✅ PERFORMANCE: Only fetch data that's not already cached
            const participantMap = { ...participants };
            const titleMap = { ...advertTitles };
            const imageMap = { ...advertImages };

            // Collect only missing data
            const userIdsToFetch = new Set();
            const advertIdsToFetch = new Set();

            validConvos.forEach(convo => {
                const otherId = convo.users.find(uid => uid !== currentUser.uid);
                if (otherId && !participantMap[otherId]) {
                    userIdsToFetch.add(otherId);
                }

                if (convo.advertId && !titleMap[convo.advertId]) {
                    advertIdsToFetch.add(convo.advertId);
                }
            });

            // Skip if no new data needed
            if (userIdsToFetch.size === 0 && advertIdsToFetch.size === 0) {
                console.log('✅ All data already cached, skipping fetch');
                return;
            }

            console.log('👥 Fetching missing user data:', Array.from(userIdsToFetch));
            console.log('📋 Fetching missing advert data:', Array.from(advertIdsToFetch));

            // ✅ BATCH OPTIMIZATION: Use Promise.allSettled to handle failures gracefully
            const fetchPromises = [];

            // Add user fetch promises
            userIdsToFetch.forEach(userId => {
                fetchPromises.push(
                    getDoc(doc(db, "users", userId))
                        .then(snap => ({
                            type: 'user',
                            id: userId,
                            success: true,
                            data: snap.exists() ? snap.data() : null
                        }))
                        .catch(error => ({
                            type: 'user',
                            id: userId,
                            success: false,
                            error
                        }))
                );
            });

            // Add advert fetch promises
            advertIdsToFetch.forEach(advertId => {
                fetchPromises.push(
                    getDoc(doc(db, "allListings", advertId))
                        .then(snap => ({
                            type: 'advert',
                            id: advertId,
                            success: true,
                            data: snap.exists() ? snap.data() : null
                        }))
                        .catch(error => ({
                            type: 'advert',
                            id: advertId,
                            success: false,
                            error
                        }))
                );
            });

            // Execute all fetches in parallel
            const results = await Promise.allSettled(fetchPromises);

            // Process results
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { type, id, success, data, error } = result.value;

                    if (success && data) {
                        if (type === 'user') {
                            participantMap[id] = data;
                            console.log('✅ User data cached:', id);
                        } else if (type === 'advert') {
                            titleMap[id] = data.title || "Advert";
                            imageMap[id] = getMainImageUrl(data);
                            console.log('✅ Advert data cached:', id);
                        }
                    } else if (!success) {
                        console.warn(`⚠️ Failed to fetch ${type}:`, id, error);
                        // Create placeholder to prevent repeated fetching
                        if (type === 'user') {
                            participantMap[id] = { firstName: '', lastName: '', email: '', uid: id };
                        }
                    }
                }
            });

            console.log('✅ Batch update complete, updating state');

            // Single state update to minimize re-renders
            setParticipants(participantMap);
            setAdvertTitles(titleMap);
            setAdvertImages(imageMap);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        const prev = document.body.style.overflowY;
        document.body.style.overflowY = "hidden";
        return () => {
            document.body.style.overflowY = prev;
        };
    }, []);

    useEffect(() => {
        const handleWindowFocus = () => {
            if (activeConversationId && currentUser) {
                markMessagesAsRead(activeConversationId, currentUser.uid);
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        return () => window.removeEventListener('focus', handleWindowFocus);
    }, [activeConversationId, currentUser]);

    useEffect(() => {
        const markAsRead = async () => {
            if (!currentUser || !activeConversationId) return;

            try {
                await markMessagesAsRead(activeConversationId, currentUser.uid);
            } catch (error) {
                console.error("Error marking messages as read:", error);
            }
        };

        // Mark messages as read when:
        // 1. User opens a conversation
        // 2. New messages arrive
        // 3. User focuses the window
        if (activeConversationId && messages.length > 0) {
            const timer = setTimeout(markAsRead, 500);
            return () => clearTimeout(timer);
        }
    }, [activeConversationId, currentUser, messages.length]); // Added 'messages' dependency


    useEffect(() => {
        const handleWindowFocus = () => {
            if (activeConversationId && currentUser) {
                markMessagesAsRead(activeConversationId, currentUser.uid);
            }
        };

        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [activeConversationId, currentUser]);

    // ✅ FIXED: Modified conversation loading logic to handle advert-specific conversations
    useEffect(() => {
        const loadOrCreateConversation = async () => {
            if (!authChecked) {
                console.log('❌ Auth not checked yet, waiting...');
                return;
            }
            if (!currentUser) {
                console.log('❌ No current user, stopping...');
                return;
            }
            if (!conversationsLoaded) {
                console.log('❌ Conversations not loaded yet, waiting...');
                return;
            }

            // ✅ FIXED: Get URL parameters properly
            const urlParams = new URLSearchParams(window.location.search);
            const conversationIdFromURL = urlParams.get("c");
            const recipientIdFromURL = urlParams.get("recipient");
            const advertIdFromURL = urlParams.get("advert");

            console.log('🔍 loadOrCreateConversation called with:', {
                conversationIdFromURL,
                recipientIdFromURL,
                advertId: advertIdFromURL,
                conversationsCount: conversations.length
            });

            // ✅ If we have a conversation ID in URL, try to load it FIRST
            if (conversationIdFromURL) {
                console.log('📧 Using conversation ID from URL:', conversationIdFromURL);

                // First check if it's in our loaded conversations
                const existingConvo = conversations.find(convo => convo.id === conversationIdFromURL);

                if (existingConvo) {
                    console.log('✅ Found existing conversation by ID:', existingConvo.id);
                    setActiveConversationId(conversationIdFromURL);
                    return;
                } else {
                    console.log('🔍 Conversation ID not in loaded conversations, checking Firestore...');

                    try {
                        const convoRef = doc(db, "conversations", conversationIdFromURL);
                        const convoSnap = await getDoc(convoRef);

                        if (convoSnap.exists()) {
                            console.log('✅ Conversation exists in Firestore, setting as active');
                            setActiveConversationId(conversationIdFromURL);
                            return;
                        } else {
                            console.log('❌ Conversation ID not found in Firestore, clearing URL');
                            const cleanUrl = '/messages';
                            window.history.replaceState(null, "", cleanUrl);
                            return;
                        }
                    } catch (error) {
                        console.error('❌ Error checking conversation in Firestore:', error);
                        return;
                    }
                }
            }

            // ✅ Handle recipient + advert scenario (from "Message Owner" button)
            if (recipientIdFromURL && advertIdFromURL) {
                console.log('🔍 Looking for advert-specific conversation:', { recipientIdFromURL, advertId: advertIdFromURL });

                // Look for existing conversation with BOTH the specific user AND advert
                const existingConvo = conversations.find(convo =>
                    convo.users &&
                    convo.users.includes(recipientIdFromURL) &&
                    convo.users.includes(currentUser.uid) &&
                    convo.advertId === advertIdFromURL
                );

                if (existingConvo) {
                    console.log('✅ Found existing advert-specific conversation:', existingConvo.id);
                    setActiveConversationId(existingConvo.id);

                    // Update URL to include conversation ID
                    const newUrl = `/messages?c=${existingConvo.id}&recipient=${recipientIdFromURL}&advert=${advertIdFromURL}`;
                    window.history.replaceState(null, "", newUrl);
                    return;
                } else {
                    console.log('📧 No existing advert-specific conversation found, creating new one');

                    try {
                        // ✅ FIXED: Import and use loadOrCreateConversation inside the function
                        const { loadOrCreateConversation } = await import("../firebase/firestoreChat");
                        const newConvoId = await loadOrCreateConversation(currentUser.uid, recipientIdFromURL, advertIdFromURL);
                        console.log('✅ Created new advert-specific conversation:', newConvoId);

                        if (newConvoId) {
                            setActiveConversationId(newConvoId);

                            // Update URL with new conversation ID
                            const newUrl = `/messages?c=${newConvoId}&recipient=${recipientIdFromURL}&advert=${advertIdFromURL}`;
                            window.history.replaceState(null, "", newUrl);
                        } else {
                            console.error('❌ Failed to create conversation - no ID returned');
                            alert('Failed to start conversation. Please try again.');
                        }
                        return;
                    } catch (error) {
                        console.error('❌ Failed to create new conversation:', error);
                        alert('Failed to start conversation. Please try again.');
                        return;
                    }
                }
            }

            // ✅ Handle recipient without advert (direct user messaging)
            if (recipientIdFromURL && !advertIdFromURL) {
                console.log('🔍 Looking for general conversation with user:', recipientIdFromURL);

                // Look for any conversation with this user that has NO advertId (general conversation)
                const existingConvo = conversations.find(convo =>
                    convo.users &&
                    convo.users.includes(recipientIdFromURL) &&
                    convo.users.includes(currentUser.uid) &&
                    !convo.advertId // ✅ Only general conversations (no advert)
                );

                if (existingConvo) {
                    console.log('✅ Found existing general conversation:', existingConvo.id);
                    setActiveConversationId(existingConvo.id);

                    const newUrl = `/messages?c=${existingConvo.id}&recipient=${recipientIdFromURL}`;
                    window.history.replaceState(null, "", newUrl);
                    return;
                } else {
                    console.log('📧 Creating new general conversation');

                    try {
                        // ✅ FIXED: Import and use loadOrCreateConversation inside the function
                        const { loadOrCreateConversation } = await import("../firebase/firestoreChat");
                        const newConvoId = await loadOrCreateConversation(currentUser.uid, recipientIdFromURL);
                        console.log('✅ Created new general conversation:', newConvoId);

                        if (newConvoId) {
                            setActiveConversationId(newConvoId);

                            const newUrl = `/messages?c=${newConvoId}&recipient=${recipientIdFromURL}`;
                            window.history.replaceState(null, "", newUrl);
                        } else {
                            console.error('❌ Failed to create conversation - no ID returned');
                            alert('Failed to start conversation. Please try again.');
                        }
                        return;
                    } catch (error) {
                        console.error('❌ Failed to create new conversation:', error);
                        alert('Failed to start conversation. Please try again.');
                        return;
                    }
                }
            }

            console.log('ℹ️ No conversation action needed');
        };

        // ✅ CRITICAL: Only run this effect when the URL actually changes
        loadOrCreateConversation();
    }, [currentUser, conversationsLoaded, conversations, authChecked, searchParams]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setPreviewImageUrl(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // Show footer
    useEffect(() => {
        const footer = document.querySelector("footer");
        if (footer) {
            footer.style.display = "block";
        }
    }, []);

    // ✅ FIXED: Messages listener with better logging and no conversationsLoaded dependency
    useEffect(() => {
        if (!activeConversationId) {
            console.log('❌ No active conversation ID, clearing messages');
            setMessages([]);
            setMessageReactions({});
            return;
        }

        console.log('🔄 Setting up messages listener for conversation:', activeConversationId);

        const unsubscribe = listenToMessages(activeConversationId, (msgs) => {
            console.log('📨 Messages received for conversation', activeConversationId, ':', msgs.length, 'messages');
            setMessages(msgs);

            const reactionMap = {};
            msgs.forEach((msg) => {
                if (msg.reaction) {
                    reactionMap[msg.id] = msg.reaction;
                }
            });
            setMessageReactions(reactionMap);
        });

        return () => {
            console.log('🔄 Cleaning up messages listener for:', activeConversationId);
            unsubscribe();
        };
    }, [activeConversationId]); // ✅ REMOVED: conversationsLoaded dependency

    useEffect(() => {
        const initializeAudio = () => {
            if (!audioContext) {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                setAudioContext(context);
            }
        };

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

    const handleFileUpload = async (e) => {
        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();

        const file = e.target.files[0];

        // Reset input immediately to prevent resubmission
        e.target.value = '';

        if (!file || !currentUser || !activeConversationId) {
            console.log('❌ Upload cancelled: missing file, user, or conversation');
            return;
        }

        // Check file size (limit to 10MB for documents)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert("File too large. Please choose a file smaller than 10MB.");
            return;
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("File type not supported. Please choose an image, PDF, Word, Excel, or text file.");
            return;
        }

        console.log('📤 Starting upload for:', file.name, 'Size:', file.size, 'Type:', file.type);

        // Set uploading state
        setUploadingFile(true);
        setUploadProgress(0);

        const ext = file.name.split(".").pop().toLowerCase();
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fileRef = ref(storage, `chat_uploads/${activeConversationId}/${fileName}`);

        try {
            // Create upload task for progress tracking
            const uploadTask = uploadBytes(fileRef, file);

            // Wait for upload to complete
            await uploadTask;
            console.log('✅ File uploaded to storage');

            setUploadProgress(50); // 50% - uploaded to storage

            // Get download URL
            const url = await getDownloadURL(fileRef);
            console.log('✅ Download URL obtained');

            setUploadProgress(75); // 75% - got download URL

            // Find recipient
            const convo = conversations.find(c => c.id === activeConversationId);
            const toUid = convo?.users.find(u => u !== currentUser.uid) || recipientIdFromURL;

            if (!toUid) {
                throw new Error('Recipient not found');
            }

            // Send message with file
            await sendMessageWithStatus(activeConversationId, currentUser.uid, toUid, url, file.name);
            console.log('✅ Message sent successfully');

            setUploadProgress(100); // 100% - message sent

            // Small delay to show completion
            setTimeout(() => {
                setUploadingFile(false);
                setUploadProgress(0);
            }, 500);

        } catch (error) {
            console.error("❌ Upload failed:", error);

            // Reset states
            setUploadingFile(false);
            setUploadProgress(0);

            // Show user-friendly error message
            let errorMessage = "Failed to upload file. ";

            if (error.code === 'storage/unauthorized') {
                errorMessage += "Permission denied.";
            } else if (error.code === 'storage/canceled') {
                errorMessage += "Upload was cancelled.";
            } else if (error.code === 'storage/unknown') {
                errorMessage += "Unknown error occurred.";
            } else if (error.message?.includes('network')) {
                errorMessage += "Network error. Please check your connection.";
            } else {
                errorMessage += "Please try again.";
            }

            alert(errorMessage);

            // Don't let the error bubble up and cause page refresh
            return false;
        }
    };


    const handleSend = async (e) => {
        // Prevent form submission if called from a form
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!newMessage.trim() && !selectedFile) return;
        if (!activeConversationId) return;

        const convo = conversations.find(c => c.id === activeConversationId);
        const toUid = convo?.users.find(uid => uid !== currentUser.uid) || recipientIdFromURL;
        if (!toUid) return;

        try {
            if (selectedFile) {
                const fileRef = ref(storage, `messages/${activeConversationId}/${Date.now()}_${selectedFile.name}`);
                await uploadBytes(fileRef, selectedFile);
                const fileURL = await getDownloadURL(fileRef);

                await sendMessageWithStatus(activeConversationId, currentUser.uid, toUid, fileURL, selectedFile.name);
                setSelectedFile(null);
            } else {
                await sendMessageWithStatus(activeConversationId, currentUser.uid, toUid, newMessage);
            }

            setNewMessage("");
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };


    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // This is crucial to prevent form submission
            e.stopPropagation();
            handleSend();
        }
    };

    const getOtherUserInfo = () => {
        if (!activeConversationId || !conversations.length) return {};

        const convo = conversations.find(c => c.id === activeConversationId);
        if (!convo) return {};

        const otherId = convo.users.find(u => u !== currentUser.uid);
        return participants[otherId] || {};
    };

    // ✅ FIXED: Better name display in header
    const getOtherUserName = () => {
        if (!activeConversationId || !conversations.length) {
            return "Loading...";
        }

        const convo = conversations.find(c => c.id === activeConversationId);
        if (!convo) return "User";

        const otherId = convo.users.find(u => u !== currentUser.uid);
        if (!otherId) return "User";

        // Wait for participant data to load
        if (!participantsLoaded && !participants[otherId]) {
            return "Loading...";
        }

        return getParticipantName(otherId);
    };

    const otherUser = getOtherUserInfo();
    const otherUserId = conversations
        .find(c => c.id === activeConversationId)
        ?.users.find(u => u !== currentUser?.uid);
    const isOnline = otherUser?.lastSeen?.seconds > Date.now() / 1000 - 300;

    // ✅ FIXED: Simplified loading condition - only check auth and user
    const isLoading = !authChecked || !currentUser;

    console.log('🔍 RENDER STATE:', {
        isLoading,
        showingChat: !isLoading && activeConversationId,
        showingNoChat: !isLoading && !activeConversationId
    });

    // Early returns for authentication states
    if (isLoading) {
        return (
            <>
                <Helmet>
                    <title>Loading Messages | My Pet Connect</title>
                    <meta name="robots" content="noindex,follow" />
                </Helmet>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading messages...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Your Messages | My Pet Connect</title>
                <meta name="robots" content="noindex,follow" />
            </Helmet>

            <div className="messages-page-container">
                <div className="messages-page-inner">
                    {/* Left Column: Conversation List */}
                    <div className={`messages-page-sidebar ${showSidebar ? "show" : ""}`}>
                        <h2 className="messages-page-sidebar-header">Your Conversations</h2>
                        <button
                            className="messages-page-sidebar-close"
                            onClick={() => setShowSidebar(false)}
                        >
                            ✕
                        </button>

                        {conversations.length === 0 ? (
                            <p className="messages-page-no-convo">
                                No conversations yet
                            </p>
                        ) : (
                            memoizedConversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={`messages-page-convo-item ${
                                        activeConversationId === conv.id ? "active" : ""
                                    } ${conv.isUnread ? "unread" : ""} ${conv.isBlocked ? "blocked" : ""}`}
                                    onClick={() => handleConversationClick(conv)}
                                >
                                    {conv.advertImage ? (
                                        <div className="messages-page-avatar-wrapper">
                                            <img
                                                src={conv.advertImage}
                                                alt="avatar"
                                                className="messages-page-avatar-image"
                                            />
                                        </div>
                                    ) : (
                                        <div className="messages-page-avatar-placeholder">
                                            {conv.displayInitials}
                                        </div>
                                    )}

                                    {/* ✅ NOTIFICATION DOT: Show on UNREAD conversations only */}
                                    {conv.isUnread && (
                                        <div className="conversation-notification-dot"></div>
                                    )}

                                    {conv.isBlocked && (
                                        <div className="blocked-message-warning">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnblockUser(conv.otherId);
                                                }}
                                                className="messages-page-unblock-button"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    )}

                                    <div className="messages-page-convo-details">
                <span className="messages-page-convo-title">
                    {conv.rawTitle.slice(0, 60)}
                </span>

                                        <span className="messages-page-convo-preview">
                    <strong>{conv.lastMessageSenderName}:</strong>
                                            {conv.lastMessageText || conv.lastMessage || "No messages yet"}
                </span>

                                        <span className="messages-page-convo-timestamp">
                    {conv.timestamp}
                </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

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
                                                    if (window.confirm("Are you sure you want to report this user?")) {
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
                                    {/* Info banner - only show if there's an active conversation */}
                                    <div className="conversation-info-banner">
                                        <span className="conversation-info-banner-icon">💡</span>
                                        <span className="conversation-info-banner-text">
                                            <span className="conversation-info-banner-highlight">Press and hold </span>
                                            message bubbles to react with emojis, or {" "}
                                            <span className="conversation-info-banner-highlight"> double-tap</span> for ❤️
                                        </span>
                                    </div>

                                    {/* ✅ FIXED: Show messages even if empty */}
                                    {messages.length === 0 ? (
                                        <div className="no-messages-yet" style={{
                                            textAlign: 'center',
                                            padding: '40px 20px',
                                            color: '#666'
                                        }}>
                                            <div className="no-messages-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                                            <p>No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        Object.entries(groupMessagesByDate(messages)).map(([dateLabel, msgs]) => (
                                            <div key={dateLabel} className="messages-group">
                                                <div className="messages-date-label">{dateLabel}</div>

                                                {msgs.map(m => (
                                                    <div key={m.id} className="message-wrapper">
                                                        <div
                                                            className={`messages-page-chat-bubble ${
                                                                m.from === currentUser?.uid ? "outgoing" : "incoming"
                                                            }`}
                                                            onMouseDown={e => m.from !== currentUser?.uid && handlePressStart(m.id, e)}
                                                            onMouseUp={handlePressEnd}
                                                            onMouseLeave={handlePressEnd}
                                                            onTouchStart={e => m.from !== currentUser?.uid && handlePressStart(m.id, e)}
                                                            onTouchEnd={handlePressEnd}
                                                            onTouchCancel={handlePressEnd}
                                                            onDoubleClick={() => m.from !== currentUser?.uid && handleSelectReaction(m.id, "❤️")}
                                                            onContextMenu={e => e.preventDefault()}
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

                                                        {/* Timestamp and status BELOW the message bubble - preserving alignment */}
                                                        {(m.createdAt?.toDate || m.from === currentUser?.uid) && (
                                                            <div className={`message-meta ${m.from === currentUser?.uid ? "outgoing" : "incoming"}`}>
                                                                {m.createdAt?.toDate && (
                                                                    <span className="message-time">
                                                                        {m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                                {m.from === currentUser?.uid && (
                                                                    <MessageStatus message={m} currentUserId={currentUser?.uid} />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef}/>
                                </div>

                                {/* Input */}
                                <div className="messages-page-chat-input">
                                    <div className="messages-page-input-container">
                                        <input
                                            type="text"
                                            placeholder={uploadingFile ? "Uploading file..." : "Type a message..."}
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoComplete="off"
                                            disabled={uploadingFile} // Disable while uploading
                                        />
                                        <label className={`attachment-icon-inner ${uploadingFile ? 'uploading' : ''}`}>
                                            <Paperclip size={18} />
                                            <input
                                                type="file"
                                                style={{display: "none"}}
                                                onChange={handleFileUpload}
                                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                                                disabled={uploadingFile} // Prevent multiple uploads
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Don't allow new uploads while one is in progress
                                                    if (uploadingFile) {
                                                        e.preventDefault();
                                                        return false;
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Upload progress indicator */}
                                    {uploadingFile && (
                                        <div className="upload-progress">
                                            <div className="upload-progress-bar">
                                                <div
                                                    className="upload-progress-fill"
                                                    style={{width: `${uploadProgress}%`}}
                                                ></div>
                                            </div>
                                            <span className="upload-progress-text">{uploadProgress}%</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="messages-page-send-button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!uploadingFile) { // Only allow sending if not uploading
                                                handleSend();
                                            }
                                        }}
                                        disabled={uploadingFile}
                                        aria-label="Send message"
                                    >
                                        <Send />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="messages-page-no-chat">
                                {!showSidebar && (
                                    <button
                                        className="messages-page-open-sidebar-button"
                                        onClick={() => setShowSidebar(true)}
                                        aria-label="Open conversations"
                                    >
                                        <ChevronRight />
                                        View Conversations
                                    </button>
                                )}
                                <div className="no-chat-content">
                                    <div className="no-chat-icon">💬</div>
                                    <h3>No conversation selected</h3>
                                    <div className="no-chat-instructions">
                                        <p><strong>To start messaging:</strong></p>
                                        <ul>
                                            <li>Select an existing conversation from the sidebar</li>
                                            <li>Or click "Message Owner" on any advert page</li>
                                        </ul>
                                    </div>
                                </div>
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
        </>
    );
};

export default Messages;