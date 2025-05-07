// AdvertUpdates.jsx
import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase/firebase';
import { auth } from '../firebase/firebaseAuth';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AdvertUpdates.css';

export default function AdvertUpdates({ advertId, ownerId }) {
    const [updates, setUpdates] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newText, setNewText] = useState('');
    const [newImage, setNewImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editImage, setEditImage] = useState(null);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    const currentUser = auth.currentUser;

    useEffect(() => {
        fetchInitial();
    }, [advertId]);

    const fetchInitial = async () => {
        setLoading(true);
        const q = query(
            collection(db, 'updates'),
            where('advertId', '==', advertId),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUpdates(list);
        setLastVisible(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === 5);
        setLoading(false);
    };

    const loadMore = async () => {
        if (!lastVisible) return;
        setLoading(true);
        const q = query(
            collection(db, 'updates'),
            where('advertId', '==', advertId),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(5)
        );
        const snap = await getDocs(q);
        const more = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUpdates(prev => [...prev, ...more]);
        setLastVisible(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === 5);
        setLoading(false);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!currentUser || currentUser.uid !== ownerId) {
            alert("Only the advert's owner can post updates.");
            return;
        }

        let imageUrl = '';
        if (newImage) {
            const storageRef = ref(storage, `updates/${advertId}/${Date.now()}_${newImage.name}`);
            await uploadBytes(storageRef, newImage);
            imageUrl = await getDownloadURL(storageRef);
        }

        const data = {
            advertId,
            text: newText,
            imageUrl,
            posterId: currentUser.uid,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'updates'), data);
        setUpdates(prev => [{ id: docRef.id, ...data, createdAt: new Date() }, ...prev]);
        setNewText('');
        setNewImage(null);
    };

    const handleEditClick = update => {
        setEditingId(update.id);
        setEditText(update.text);
        setEditImage(null);
    };

    const handleUpdateSubmit = async e => {
        e.preventDefault();
        if (!currentUser || currentUser.uid !== ownerId) {
            alert("Only the advert's owner can edit updates.");
            return;
        }

        let imageUrl = updates.find(u => u.id === editingId).imageUrl;
        if (editImage) {
            const storageRef = ref(storage, `updates/${advertId}/${Date.now()}_${editImage.name}`);
            await uploadBytes(storageRef, editImage);
            imageUrl = await getDownloadURL(storageRef);
        }

        await updateDoc(doc(db, 'updates', editingId), { text: editText, imageUrl });

        setUpdates(prev =>
            prev.map(u => (u.id === editingId ? { ...u, text: editText, imageUrl } : u))
        );
        setEditingId(null);
        setEditText('');
        setEditImage(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText('');
        setEditImage(null);
    };

    const handleDelete = async id => {
        if (!currentUser || currentUser.uid !== ownerId) {
            alert("Only the advert's owner can delete updates.");
            return;
        }
        if (!window.confirm('Delete this update?')) return;
        await deleteDoc(doc(db, 'updates', id));
        setUpdates(prev => prev.filter(u => u.id !== id));
    };

    return (
        <div className="advert-updates">
            {/* Tooltip-style header inside component */}
            <div className="updates-tooltip">
                <h3>Advert Updates</h3>
                <p>
                    Post and view the latest changes to this advert—new photos, availability notes,
                    price adjustments, and more. Only the advert owner can create, edit, or delete updates.
                </p>
            </div>

            {currentUser?.uid === ownerId && (
                <form className="update-form" onSubmit={handleSubmit}>
          <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Write an update..."
              required
          />
                    <input type="file" accept="image/*" onChange={e => setNewImage(e.target.files[0])} />
                    <button type="submit">Post Update</button>
                </form>
            )}

            <div className="updates-list">
                {updates.map(u => (
                    <div key={u.id} className="update-item">
                        {editingId === u.id ? (
                            <form className="edit-form" onSubmit={handleUpdateSubmit}>
                                <textarea value={editText} onChange={e => setEditText(e.target.value)} required />
                                <input type="file" accept="image/*" onChange={e => setEditImage(e.target.files[0])} />
                                <div className="edit-buttons">
                                    <button type="submit">Save</button>
                                    <button type="button" onClick={handleCancelEdit}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {u.imageUrl && (
                                    <img
                                        src={u.imageUrl}
                                        alt="Update"
                                        className="update-thumb"
                                        onClick={() => setLightboxUrl(u.imageUrl)}
                                    />
                                )}
                                <p>{u.text}</p>
                                <small>
                                    {u.createdAt.toDate
                                        ? u.createdAt.toDate().toLocaleString()
                                        : new Date(u.createdAt).toLocaleString()}
                                </small>
                                <div className="action-buttons">
                                    {currentUser?.uid === ownerId && (
                                        <>
                                            <button onClick={() => handleEditClick(u)}>Edit</button>
                                            <button onClick={() => handleDelete(u.id)}>Delete</button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <button className="load-more" onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}

            {lightboxUrl && (
                <div className="lightbox" onClick={() => setLightboxUrl(null)}>
                    <img src={lightboxUrl} alt="Full size" className="lightbox-img" />
                </div>
            )}
        </div>
    );
}
