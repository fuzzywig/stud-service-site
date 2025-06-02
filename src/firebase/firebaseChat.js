// File: src/firebase/firebaseChat.js
import { db, serverTimestamp } from "./firebase";
import {
    collection,
    doc,
    setDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    getDoc
} from "firebase/firestore";

// Generate a consistent conversation ID for two UIDs
export function getConversationId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}

// Send a message to the messages subcollection under a conversation
export async function sendMessage(convoId, senderId, text) {
    const message = {
        text,
        senderId,
        timestamp: serverTimestamp(),
    };
    const convoRef = doc(db, "conversations", convoId);
    const messagesRef = collection(convoRef, "messages");
    await addDoc(messagesRef, message);
}

// Listen for real-time updates to messages in a conversation
export function listenToMessages(convoId, callback) {
    const convoRef = doc(db, "conversations", convoId);
    const messagesRef = collection(convoRef, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
    });
}

// Get all conversation IDs where current user is a participant
export async function getUserConversations(uid) {
    const convoSnap = await getDocs(collection(db, "conversations"));
    const userConvos = [];

    for (const docSnap of convoSnap.docs) {
        const convoId = docSnap.id;
        if (convoId.includes(uid)) {
            const lastMessageQuery = query(
                collection(docSnap.ref, "messages"),
                orderBy("timestamp", "desc")
            );
            const messagesSnap = await getDocs(lastMessageQuery);
            const lastMessage = messagesSnap.docs[0]?.data();
            userConvos.push({ id: convoId, lastMessage });
        }
    }

    return userConvos;
}
