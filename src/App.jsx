import React, {useEffect} from "react";
import { Routes, Route } from "react-router-dom";
import {onAuthStateChanged} from "firebase/auth";
import {doc, updateDoc, setDoc, serverTimestamp, getDoc} from "firebase/firestore";import {auth, db} from "./firebase/firebase";
import useIdleLogout from "./hooks/useIdleLogout";
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


import Layout from "./components/Layout";
import Home from "./pages/Home";
import BrowseStuds from "./pages/BrowseStuds";
import AdWizard from "./pages/AdWizard";
import AdvertDetails from "./pages/AdvertDetails";
import MyAdvertsPage from './pages/MyAdvertsPage';
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import Logout from "./pages/Logout";
import MessagesPage from "./pages/Messages";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveAdverts from "./pages/admin/ApproveAdverts";
import ApproveReviews from "./pages/admin/ApproveReviews";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageUserProfile from "./pages/admin/ManageUserProfile";
import EditStud from "./pages/EditStud";
import Favourites from "./pages/Favourites";
import RequireAdmin from "./components/RequireAdmin";
import LoginModal from "./components/LoginModal";
import AdminViewAdvert from "./pages/admin/AdminViewAdvert";
import MinimalLayout from "./components/MinimalLayout";
import ReportedUsers from "./pages/admin/ReportedUsers"; // ← make sure it's imported
import TopStuds from "./pages/TopStudsPage";
import { useLoginModal } from "./context/LoginContext";
import HelpSupport from "./pages/HelpSupport";
import AdminUIDInspector from "./pages/admin/AdminUIDInspector";
import AdminTickets from "./pages/admin/AdminTickets.jsx";
import BreedingGuide from "./pages/BreedingGuide";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookieConsentBanner from "./components/CookieConsentBanner"
import CookiePolicyPage from "./pages/CookiePolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import AboutUs from './pages/AboutUs';





function App() {
    const { isLoginOpen, openLogin, closeLogin } = useLoginModal();

    useIdleLogout(); // 👈 Call useIdleLogout at the top level of the component


    useEffect(() => {
        let interval;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);

                // Helper function to safely update lastSeen
                const updateLastSeen = async () => {
                    try {
                        // First check if the document exists
                        const userDoc = await getDoc(userRef);

                        if (userDoc.exists()) {
                            // Document exists, use updateDoc
                            await updateDoc(userRef, { lastSeen: serverTimestamp() });
                        } else {
                            // Document doesn't exist, create it with setDoc
                            await setDoc(userRef, {
                                lastSeen: serverTimestamp(),
                                email: user.email,
                                uid: user.uid,
                                createdAt: serverTimestamp()
                            }, { merge: true });
                        }
                    } catch (error) {
                        // Only log if it's not a permission error
                        if (error.code !== 'permission-denied') {
                            console.log("Error updating lastSeen:", error.message);
                        }
                    }
                };

                // Initial update
                await updateLastSeen();

                // Set up interval for periodic updates
                interval = setInterval(updateLastSeen, 60000); // Every minute
            } else {
                if (interval) clearInterval(interval);
            }
        });

        return () => {
            unsubscribe();
            if (interval) clearInterval(interval);
        };
    }, []);

    const [showCookieBanner, setShowCookieBanner] = React.useState(false);

    React.useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        setShowCookieBanner(!consent);
    }, []);

    const resetCookieConsent = () => {
        localStorage.removeItem('cookieConsent');
        setShowCookieBanner(true);
    };


    return (
        <>
            <LoginModal isOpen={isLoginOpen} onClose={closeLogin} />

            <CookieConsentBanner showBanner={showCookieBanner} setShowBanner={setShowCookieBanner} />


            <Routes>
                {/* Admin routes */}
                <Route path="/admin/uid-inspector" element={<AdminUIDInspector />} />
                <Route
                    path="/admin/tickets"
                    element={
                        <RequireAdmin>
                            <AdminTickets />
                        </RequireAdmin>
                    }
                />

                <Route
                    path="/admin"
                    element={<RequireAdmin><AdminDashboard/></RequireAdmin>}
                />
                <Route
                    path="/admin/approve-adverts"
                    element={<RequireAdmin><ApproveAdverts/></RequireAdmin>}
                />
                <Route
                    path="/admin/approve-reviews"
                    element={<RequireAdmin><ApproveReviews/></RequireAdmin>}
                />
                <Route
                    path="/admin/manage-users"
                    element={<RequireAdmin><ManageUsers/></RequireAdmin>}
                />
                <Route path="/admin/reported-users" element={<ReportedUsers/>}/>
                <Route path="/admin/user/:userId" element={<ManageUserProfile/>}/>
                <Route
                    path="/admin/view-advert/:advertId"
                    element={<RequireAdmin><AdminViewAdvert/></RequireAdmin>}
                />

                {/* Main layout */}
                <Route
                    path="/"
                    element={<Layout onLoginClick={openLogin} onResetCookieConsent={resetCookieConsent} />}
                >
                    {/* Nested routes inside main layout */}
                    <Route index element={<Home />} />
                    <Route path="browse" element={<BrowseStuds />} />
                    <Route path="new-advert" element={<AdWizard mode="create" />} />
                    <Route path="edit/:adId/*" element={<AdWizard mode="edit" />} />
                    <Route path="advert-details/:id" element={<AdvertDetails />} />
                    <Route path="profile/:uid" element={<UserProfile />} />
                    <Route path="logout" element={<Logout />} />
                    <Route path="edit-stud/:id" element={<EditStud />} />
                    <Route path="favourites" element={<Favourites />} />
                    <Route path="my-adverts" element={<MyAdvertsPage />} />
                    <Route path="top-studs" element={<TopStuds />} />
                    <Route path="help" element={<HelpSupport />} />
                    <Route path="breeding-guide" element={<BreedingGuide />} />
                    <Route path="cookie-policy" element={<CookiePolicyPage />} />
                    <Route path="terms-of-service" element={<TermsOfServicePage />} />
                    <Route path="about" element={<AboutUs />} />
                    <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                </Route>

                <Route
                    path="/messages"
                    element={
                        <MinimalLayout onLoginClick={openLogin}>
                            <MessagesPage />
                        </MinimalLayout>
                    }
                />

                {/* Standalone auth routes */}
                <Route path="register" element={<Register />} />
            </Routes>
        </>
    );

}

export default App;
