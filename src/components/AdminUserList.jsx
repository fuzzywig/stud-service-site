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
        setNewText(''); setNewImage(null);
    };

    const handleDelete = async id => {
        if (!window.confirm('Delete this update?')) return;
        await deleteDoc(doc(db, 'updates', id));
        setUpdates(prev => prev.filter(u => u.id !== id));
    };

    return (
        <div className="advert-updates">
            {/* only owner sees form */}
            {currentUser?.uid === ownerId && (
                <form className="update-form" onSubmit={handleSubmit}>
          <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Write an update..."
              required
          />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setNewImage(e.target.files[0])}
                    />
                    <button type="submit">Post Update</button>
                </form>
            )}

            <div className="updates-list">
                {updates.map(u => (
                    <div key={u.id} className="update-item">
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
                        {currentUser?.uid === ownerId && (
                            <button className="delete-update" onClick={() => handleDelete(u.id)}>
                                Delete
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <button className="load-more" onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}

            {/* lightbox modal */}
            {lightboxUrl && (
                <div className="lightbox-backdrop" onClick={() => setLightboxUrl(null)}>
                    <img className="lightbox-img" src={lightboxUrl} alt="Full size" />
                </div>
            )}
        </div>
    );
}
