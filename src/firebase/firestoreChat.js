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

// Generate a consistent conversation ID (sorted alphabetically)
// includes advertId if provided
export function getConversationId(userA, userB, advertId) {
    // include advertId so each ad has its own thread
    return [userA, userB, advertId].sort().join("_");
}

// Ensure a conversation document exists
// advertId is optional—if passed, the conversation is specific to that advert

export async function loadOrCreateConversation(currentUserId, otherUserId, advertId) {
    const conversationId = getConversationId(currentUserId, otherUserId, advertId);
    const convRef = doc(db, "conversations", conversationId);
    const snapshot = await getDoc(convRef);

    if (!snapshot.exists()) {
        await setDoc(convRef, {
            users: [currentUserId, otherUserId],
            advertId: advertId || null,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            lastMessage: ""
        });
    }

    return conversationId;
}

// Send a message
export async function sendMessage(convoId, fromUid, toUid, text, filename = null) {
    const msgRef = collection(db, "conversations", convoId, "messages");
    await addDoc(msgRef, {
        text,
        from: fromUid,
        to: toUid,
        createdAt: serverTimestamp(),
        filename: filename || null
    });

    const senderSnap = await getDoc(doc(db, "users", fromUid));
    const senderData = senderSnap.exists() ? senderSnap.data() : {};
    const senderName = [senderData.firstName, senderData.lastName].filter(Boolean).join(" ");

    const messagePreview = filename ? `📎 ${filename}` : text;

    await updateDoc(doc(db, "conversations", convoId), {
        lastMessage: {
            text: messagePreview,
            senderId: fromUid,
            senderName: senderName || "User",
            timestamp: serverTimestamp(),
            readBy: [fromUid] // ✅ this line enables unread tracking
        },
        lastMessageText: messagePreview, // optional for legacy support
        lastMessageSenderName: senderName || "User",
        lastMessageSenderId: fromUid,
        lastUpdated: serverTimestamp()
    });

    console.log("✅ Conversation updated in Firestore");
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
// 👇 New real-time listener for all conversations a user is in
export function listenToUserConversations(uid, callback) {
    const q = query(collection(db, "conversations"), where("users", "array-contains", uid));
    return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(convos);
    });
}

