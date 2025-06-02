import React, { useEffect, useState } from "react";
import {
    collection,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { FaTimes } from "react-icons/fa";
import "./AdminNotesModal.css";

const AdminNotesModal = ({ userId, adminName, onClose }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");

    const fetchNotes = async () => {
        const snap = await getDocs(
            query(collection(db, "adminNotes"), where("userId", "==", userId))
        );
        setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleSubmit = async () => {
        if (!newNote.trim()) return;
        await addDoc(collection(db, "adminNotes"), {
            userId,
            text: newNote.trim(),
            createdAt: serverTimestamp(),
            userName: adminName
        });
        setNewNote("");
        await fetchNotes();
    };

    const handleDelete = async (noteId) => {
        if (window.confirm("Delete this note?")) {
            await deleteDoc(doc(db, "adminNotes", noteId));
            await fetchNotes();
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [userId]);

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="admin-modal-close" onClick={onClose}><FaTimes /></button>
                <h3>Admin Notes</h3>
                <textarea
                    placeholder="Write a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                />
                <button onClick={handleSubmit}>Save Note</button>
                <div className="admin-previous-notes">
                    {notes.map(note => (
                        <div key={note.id} className="note-item">
                            <div className="note-header">
                                <strong>{note.text}</strong>
                                <button
                                    className="delete-note-btn"
                                    onClick={() => handleDelete(note.id)}
                                    title="Delete note"
                                >
                                    ✖
                                </button>
                            </div>
                            <div className="note-meta">
                                By <em>{note.userName || "Admin"}</em> at {note.createdAt?.toDate().toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminNotesModal;
