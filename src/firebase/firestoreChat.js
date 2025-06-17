import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    serverTimestamp,
    updateDoc,
    query,
    where,
    onSnapshot,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// ✅ FIXED: Generate a consistent conversation ID (sorted alphabetically)
// Only includes advertId if it's actually provided and not null/undefined
export function getConversationId(userA, userB, advertId = null) {
    // ✅ FIXED: Only include advertId if it exists and is not null/undefined
    if (advertId && advertId !== 'undefined' && advertId !== 'null') {
        // Advert-specific conversation: user1_user2_advertId
        return [userA, userB, advertId].sort().join("_");
    } else {
        // General conversation: user1_user2
        return [userA, userB].sort().join("_");
    }
}

// ✅ FIXED: Ensure a conversation document exists
// advertId is optional—if passed, the conversation is specific to that advert
export async function loadOrCreateConversation(currentUserId, otherUserId, advertId = null) {
    // Clean up the advertId parameter
    const cleanAdvertId = advertId && advertId !== 'undefined' && advertId !== 'null' ? advertId : null;

    const conversationId = getConversationId(currentUserId, otherUserId, cleanAdvertId);
    const convRef = doc(db, "conversations", conversationId);
    const snapshot = await getDoc(convRef);

    if (!snapshot.exists()) {
        const conversationData = {
            users: [currentUserId, otherUserId],
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            lastMessage: ""
        };

        // ✅ Only add advertId if it's actually provided
        if (cleanAdvertId) {
            conversationData.advertId = cleanAdvertId;
        }

        await setDoc(convRef, conversationData);
    }

    return conversationId;
}

// ✅ ENHANCED: Updated sendMessage function with better error handling
export async function sendMessage(convoId, fromUid, toUid, text, filename = null) {
    try {
        console.log('🚀 Starting sendMessage:', { convoId, fromUid, toUid, filename });

        // 1. Add the message to Firestore
        const msgRef = collection(db, "conversations", convoId, "messages");
        const messageDoc = await addDoc(msgRef, {
            text,
            from: fromUid,
            to: toUid,
            createdAt: serverTimestamp(),
            filename: filename || null
        });
        console.log('✅ Message added to Firestore:', messageDoc.id);

        // 2. Get sender's details
        console.log('👤 Fetching sender details...');
        const senderSnap = await getDoc(doc(db, "users", fromUid));
        const senderData = senderSnap.exists() ? senderSnap.data() : {};
        console.log('Sender data:', senderData);

        const senderName = [senderData.firstName, senderData.lastName].filter(Boolean).join(" ") || "User";
        console.log('Sender name:', senderName);

        // 3. Get recipient's details for email
        console.log('📧 Fetching recipient details...');
        const recipientSnap = await getDoc(doc(db, "users", toUid));
        const recipientData = recipientSnap.exists() ? recipientSnap.data() : {};
        console.log('Recipient data:', recipientData);

        // 4. Get conversation details and advert info
        console.log('🔍 Fetching conversation details...');
        const convoSnap = await getDoc(doc(db, "conversations", convoId));
        let petName = "your pet";
        let advertId = null;
        let advertUrl = null;

        if (convoSnap.exists()) {
            const convoData = convoSnap.data();
            advertId = convoData.advertId;
            console.log('Conversation advertId:', advertId);

            // If there's an advertId, fetch the advert details
            if (advertId && advertId !== 'undefined' && advertId !== 'null') {
                try {
                    console.log('🐕 Fetching advert details for ID:', advertId);
                    const advertDoc = await getDoc(doc(db, "allListings", advertId));
                    if (advertDoc.exists()) {
                        const advertData = advertDoc.data();
                        console.log('Advert data:', advertData);
                        petName = advertData.title || advertData.name || advertData.petName || "your pet";
                        advertUrl = `https://mypetconnect.co.uk/advert-details/${advertId}`;
                        console.log('Pet name resolved to:', petName);
                    } else {
                        console.log('⚠️ Advert document does not exist for ID:', advertId);
                    }
                } catch (err) {
                    console.error("Error fetching advert details:", err);
                }
            } else {
                console.log('ℹ️ No valid advertId in conversation');
            }
        } else {
            console.log('⚠️ Conversation document does not exist');
        }

        // 5. Prepare message content
        const messagePreview = filename ? `📎 ${filename}` : text;
        const messageText = text && text.length > 150 ? text.substring(0, 150) + "..." : text;
        const messageTruncated = text && text.length > 150;

        console.log('Message content prepared:', { messagePreview, messageText, messageTruncated });

        // 6. Update conversation's last message
        console.log('🔄 Updating conversation...');
        await updateDoc(doc(db, "conversations", convoId), {
            lastMessage: {
                text: messagePreview,
                senderId: fromUid,
                senderName: senderName,
                timestamp: serverTimestamp(),
                readBy: [fromUid]
            },
            lastMessageText: messagePreview,
            lastMessageSenderName: senderName,
            lastMessageSenderId: fromUid,
            lastUpdated: serverTimestamp(),
            petName: petName
        });
        console.log("✅ Conversation updated in Firestore");

        // 7. Send email notification
        const notificationsEnabled = recipientData.messageNotifications !== false;
        console.log('Email notification check:', {
            hasEmail: !!recipientData.email,
            notificationsEnabled,
            recipientEmail: recipientData.email
        });

        if (!recipientData.email) {
            console.log('❌ No recipient email found');
            return { success: true, messageId: messageDoc.id, emailSent: false, reason: 'No email' };
        }

        if (!notificationsEnabled) {
            console.log('❌ Notifications disabled for recipient');
            return { success: true, messageId: messageDoc.id, emailSent: false, reason: 'Notifications disabled' };
        }

        try {
            console.log('📤 Preparing email notification...');

            // Generate sender initials for fallback
            const senderInitials = senderName
                .split(' ')
                .map(name => name.charAt(0).toUpperCase())
                .join('')
                .substring(0, 2) || 'U';

            // Format message time
            const messageTime = new Date().toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const emailData = {
                // ✅ Required IDs
                senderId: fromUid,
                recipientId: toUid,
                advertId: advertId && advertId !== 'undefined' && advertId !== 'null' ? advertId : null,

                // Required fields matching SendGrid template
                recipientEmail: recipientData.email,
                senderName: senderName,
                petName: petName,
                messagePreview: messagePreview || "New message",
                messageText: messageText || text || "New message",
                messageTime: messageTime,
                conversationUrl: `https://mypetconnect.co.uk/messages?c=${convoId}&recipient=${fromUid}${advertId && advertId !== 'undefined' ? `&advert=${advertId}` : ""}`,
                advertUrl: advertUrl || `https://mypetconnect.co.uk/listings`,
                allMessagesUrl: `https://mypetconnect.co.uk/messages`,
                currentYear: new Date().getFullYear(),
                helpUrl: `https://mypetconnect.co.uk/help`,
                notificationSettingsUrl: `https://mypetconnect.co.uk/settings/notifications`,

                // Optional fields
                senderAvatar: senderData.profilePicture || senderData.avatar || null,
                senderInitials: senderInitials,
                senderLocation: null,
                messageTruncated: messageTruncated || false,

                // Optional stats
                showStats: false,
                unreadCount: null,
                totalInquiries: null,

                // Legacy fields for backward compatibility
                recipientName: recipientData.firstName || "User",
                advertTitle: petName,
                isFileAttachment: !!filename,
                fileName: filename
            };

            console.log('📧 Email data prepared:', emailData);

            const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-message-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailData }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📧 Email API response:', result);

            if (result.success) {
                console.log('✅ Message notification email sent successfully');
                return { success: true, messageId: messageDoc.id, emailSent: true };
            } else {
                console.error('❌ Failed to send message notification email:', result.error);
                return { success: true, messageId: messageDoc.id, emailSent: false, reason: result.error };
            }
        } catch (emailError) {
            console.error('❌ Failed to send message notification email:', emailError);
            return { success: true, messageId: messageDoc.id, emailSent: false, reason: emailError.message };
        }

    } catch (error) {
        console.error('❌ Error in sendMessage:', error);
        throw error;
    }
}

// Live listener for messages
export function listenToMessages(conversationId, callback) {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, snapshot => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("🔁 Firestore triggered with:", messages);
        callback(messages);
    });
}

// Fetch conversations involving a user
export async function fetchUserConversations(uid) {
    const q = query(collection(db, "conversations"), where("users", "array-contains", uid));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Real-time listener for all conversations a user is in
export function listenToUserConversations(uid, callback) {
    const q = query(collection(db, "conversations"), where("users", "array-contains", uid));
    return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(convos);
    });
}