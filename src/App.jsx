import React, {useEffect} from "react";
import {Routes, Route, useLocation} from "react-router-dom";
import {onAuthStateChanged} from "firebase/auth";
import {doc, updateDoc, setDoc, serverTimestamp, getDoc} from "firebase/firestore";
import {auth, db} from "./firebase/firebase";
import useIdleLogout from "./hooks/useIdleLogout";
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import {initGA, trackPageView, trackEvent} from "./utils/analytics";

import {NotificationProvider} from "./context/NotificationContext";

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
import ReportedUsers from "./pages/admin/ReportedUsers";
import TopStuds from "./pages/TopStudsPage";
import {useLoginModal} from "./context/LoginContext";
import HelpSupport from "./pages/HelpSupport";
import AdminUIDInspector from "./pages/admin/AdminUIDInspector";
import AdminTickets from "./pages/admin/AdminTickets.jsx";
import BreedingGuide from "./pages/BreedingGuide";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookieConsentBanner from "./components/CookieConsentBanner"
import CookiePolicyPage from "./pages/CookiePolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import AboutUs from './pages/AboutUs';
import FollowingFeed from "./pages/FollowingFeed";
import DogRescueDashboard from './pages/DogRescueDashboard';
import AdWizardRescue from './pages/AdWizardRescue';

//BlogRoutes
import Blog from './blog/Blog';
import BlogPost from './blog/BlogPost';
import BlogAdmin from './pages/admin/BlogAdmin.jsx';
import BlogCategoryPage from './blog/BlogCategoryPage';
import BlogArchivePage from './blog/BlogArchivePage';

//Admin Imports
import AdminStaffManagement from './pages/admin/AdminStaffManagement';
import SMSAdminPanel from './pages/admin/SMSAdminPanel';



// Page Tracker Component for automatic tracking
function PageTracker() {
    const location = useLocation();

    React.useEffect(() => {
        // Get custom page titles based on route
        const getPageTitle = (pathname) => {
            const routes = {
                '/': 'Home - My Pet Connect',
                '/browse': 'Browse Studs - My Pet Connect',
                '/new-advert': 'Create Advert - My Pet Connect',
                '/my-adverts': 'My Adverts - My Pet Connect',
                '/favourites': 'Favourites - My Pet Connect',
                '/top-studs': 'Top Studs - My Pet Connect',
                '/help': 'Help & Support - My Pet Connect',
                '/breeding-guide': 'Breeding Guide - My Pet Connect',
                '/about': 'About Us - My Pet Connect',
                '/dog-rescue': 'Dog Rescue - My Pet Connect',
                '/messages': 'Messages - My Pet Connect',
                '/register': 'Register - My Pet Connect',
                '/cookie-policy': 'Cookie Policy - My Pet Connect',
                '/privacy-policy': 'Privacy Policy - My Pet Connect',
                '/terms-of-service': 'Terms of Service - My Pet Connect',
                '/following-feed': 'Following Feed - My Pet Connect',
                '/blog': 'Blog - My Pet Connect',
                '/blog-admin': 'Blog Admin - My Pet Connect'
            };

            // Handle dynamic routes
            if (pathname.includes('/advert-details/')) return 'Advert Details - My Pet Connect';
            if (pathname.includes('/profile/')) return 'User Profile - My Pet Connect';
            if (pathname.includes('/edit/')) return 'Edit Advert - My Pet Connect';
            if (pathname.includes('/edit-stud/')) return 'Edit Stud - My Pet Connect';
            if (pathname.includes('/admin/')) return 'Admin Dashboard - My Pet Connect';
            if (pathname.includes('/adwizard-rescue')) return 'Rescue Advert - My Pet Connect';
            if (pathname.includes('/blog/')) return 'Blog Post - My Pet Connect';

            return routes[pathname] || `${pathname} - My Pet Connect`;
        };

        const pageTitle = getPageTitle(location.pathname);
        trackPageView(location.pathname, pageTitle);

        // Track section navigation for analytics
        const section = location.pathname.split('/')[1] || 'home';
        trackEvent('page_view', 'navigation', section);

    }, [location]);

    return null;
}

function App() {
    const {isLoginOpen, openLogin, closeLogin} = useLoginModal();

    useIdleLogout();

    // State for cookie banner
    const [showCookieBanner, setShowCookieBanner] = React.useState(false);

    const resetCookieConsent = () => {
        localStorage.removeItem('cookieConsent');
        setShowCookieBanner(true);
    };

    // Firebase auth effect with login/logout tracking
    useEffect(() => {
        let interval;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Track user login
                trackEvent('login', 'auth', 'firebase_auth');

                const userRef = doc(db, "users", user.uid);

                // Helper function to safely update lastSeen
                const updateLastSeen = async () => {
                    try {
                        // First check if the document exists
                        const userDoc = await getDoc(userRef);

                        if (userDoc.exists()) {
                            // Document exists, use updateDoc
                            await updateDoc(userRef, {lastSeen: serverTimestamp()});
                        } else {
                            // Document doesn't exist, create it with setDoc
                            await setDoc(userRef, {
                                lastSeen: serverTimestamp(),
                                email: user.email,
                                uid: user.uid,
                                createdAt: serverTimestamp()
                            }, {merge: true});
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
                // Track user logout
                trackEvent('logout', 'auth', 'firebase_auth');
                if (interval) clearInterval(interval);
            }
        });

        return () => {
            unsubscribe();
            if (interval) clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#ffffff');
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = "theme-color";
            newMeta.content = "#ffffff";
            document.head.appendChild(newMeta);
        }
    }, []);


    // Cookie consent effect with GA4 initialization
    React.useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        setShowCookieBanner(!consent);

        // Add GA4 initialization if consent already exists
        if (consent === 'accepted') {
            initGA();
            trackPageView(window.location.pathname, document.title);
            trackEvent('app_loaded', 'navigation', 'initial_load');
        }
    }, []);

    return (
        <NotificationProvider>
            <PageTracker/>
            <LoginModal isOpen={isLoginOpen} onClose={closeLogin}/>
            <CookieConsentBanner showBanner={showCookieBanner} setShowBanner={setShowCookieBanner}/>

            <Routes>
                {/* Admin routes */}
                <Route path="/admin/uid-inspector" element={<AdminUIDInspector/>}/>
                <Route
                    path="/admin/tickets"
                    element={
                        <RequireAdmin>
                            <AdminTickets/>
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
                <Route
                    path="/blog-admin"
                    element={
                        <RequireAdmin>
                            <BlogAdmin/>
                        </RequireAdmin>
                    }
                />
                <Route
                    path="/admin/staff-management"
                    element={
                        <RequireAdmin>
                            <AdminStaffManagement/>
                        </RequireAdmin>
                    }
                />
                <Route
                    path="/admin/sms-marketing"
                    element={<RequireAdmin><SMSAdminPanel /></RequireAdmin>}
                />


                {/* Main layout */}
                <Route
                    path="/"
                    element={<Layout onLoginClick={openLogin} onResetCookieConsent={resetCookieConsent}/>}
                >
                    {/* Nested routes inside main layout */}
                    <Route index element={<Home/>}/>
                    <Route path="browse" element={<BrowseStuds/>}/>
                    <Route path="new-advert" element={<AdWizard mode="create"/>}/>
                    <Route path="edit/:adId/*" element={<AdWizard mode="edit"/>}/>
                    <Route path="advert-details/:id" element={<AdvertDetails/>}/>
                    <Route path="profile/:uid" element={<UserProfile/>}/>
                    <Route path="logout" element={<Logout/>}/>
                    <Route path="edit-stud/:id" element={<EditStud/>}/>
                    <Route path="favourites" element={<Favourites/>}/>
                    <Route path="my-adverts" element={<MyAdvertsPage/>}/>
                    <Route path="top-studs" element={<TopStuds/>}/>
                    <Route path="help" element={<HelpSupport/>}/>
                    <Route path="breeding-guide" element={<BreedingGuide/>}/>
                    <Route path="cookie-policy" element={<CookiePolicyPage/>}/>
                    <Route path="terms-of-service" element={<TermsOfServicePage/>}/>
                    <Route path="about" element={<AboutUs/>}/>
                    <Route path="following-feed" element={<FollowingFeed/>}/>
                    <Route path="dog-rescue" element={<DogRescueDashboard/>}/>
                    <Route path="/adwizard-rescue" element={<AdWizardRescue mode="create"/>}/>
                    <Route path="/adwizard-rescue/edit/:adId" element={<AdWizardRescue mode="edit"/>}/>
                    <Route path="privacy-policy" element={<PrivacyPolicyPage/>}/>

                    {/* ✅ PUBLIC: Blog routes - accessible to all users */}
                    <Route path="/blog" element={<Blog/>}/>
                    <Route path="/blog/:slug" element={<BlogPost/>}/>
                    <Route path="/blog/category/:categoryName" element={<BlogCategoryPage />} />
                    <Route path="/blog/archive/:monthYear" element={<BlogArchivePage />} />
                </Route>

                <Route
                    path="/messages"
                    element={
                        <MinimalLayout onLoginClick={openLogin}>
                            <MessagesPage/>
                        </MinimalLayout>
                    }
                />

                {/* Standalone auth routes */}
                <Route path="register" element={<Register/>}/>
            </Routes>
        </NotificationProvider>
    );
}

export default App;