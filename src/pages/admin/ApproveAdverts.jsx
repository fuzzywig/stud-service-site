import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminSidebar from '../../components/AdminSidebar';

export default function ApproveAdverts() {
    const [adverts, setAdverts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnapprovedAdverts = async () => {
            try {
                const q = query(collection(db, "studAds"), where("approved", "==", false));
                const querySnapshot = await getDocs(q);
                const fetched = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAdverts(fetched);
            } catch (error) {
                console.error("Error fetching adverts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUnapprovedAdverts();
    }, []);

    const approveAdvert = async (id) => {
        try {
            const advertRef = doc(db, "studAds", id);
            await updateDoc(advertRef, { approved: true });
            setAdverts(prev => prev.filter(advert => advert.id !== id));
        } catch (error) {
            console.error("Failed to approve advert:", error);
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <AdminSidebar />
            <div style={{ marginLeft: '240px', padding: '2rem', width: '100%' }}>
                <h2>Approve Adverts</h2>
                {loading ? (
                    <p>Loading adverts...</p>
                ) : adverts.length === 0 ? (
                    <p>No unapproved adverts found.</p>
                ) : (
                    <ul>
                        {adverts.map(ad => (
                            <li key={ad.id} style={{ marginBottom: "1rem" }}>
                                <strong>{ad.breed}</strong> — {ad.name || 'Unnamed'}<br />
                                {ad.description?.substring(0, 60)}...<br />
                                <button onClick={() => approveAdvert(ad.id)}>✅ Approve</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
