import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../firebase/firebaseAuth';

export default function RequireAdmin({ children }) {
    const { currentUser, userData, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && (!currentUser || !userData?.isAdmin)) {
            navigate('/login', { state: { from: location.pathname } });
        }
    }, [currentUser, userData, loading, navigate, location]);

    if (loading || !userData) return <p>Loading...</p>;

    return children;
}
