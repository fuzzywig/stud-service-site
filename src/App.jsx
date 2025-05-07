import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import BrowseStuds from "./pages/BrowseStuds";
import NewAdvert from "./pages/NewAdvert";
import StudDetails from "./pages/StudDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import Logout from "./pages/Logout";
import MessagesPage from "./pages/Messages";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveAdverts from "./pages/admin/ApproveAdverts";
import ApproveReviews from "./pages/admin/ApproveReviews";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminUserProfile from "./pages/admin/AdminUserProfile"; // ✅ NEW
import Favourites from './pages/Favourites';
import RequireAdmin from './components/RequireAdmin'; // adjust the path if it's located elsewhere
import EditStud from './pages/EditStud'; // adjust the path depending on your project structure
import ManageUserProfile from './pages/admin/ManageUserProfile';



function App() {
    return (
        <Router>
            <Routes>
                {/* ✅ Admin Routes */}
                <Route path="/admin" element={
                    <RequireAdmin>
                        <AdminDashboard />
                    </RequireAdmin>
                } />
                <Route path="/admin/approve-adverts" element={
                    <RequireAdmin>
                        <ApproveAdverts />
                    </RequireAdmin>
                } />
                <Route path="/admin/approve-reviews" element={
                    <RequireAdmin>
                        <ApproveReviews />
                    </RequireAdmin>
                } />
                <Route path="/admin/manage-users" element={
                    <RequireAdmin>
                        <ManageUsers />
                    </RequireAdmin>
                } />
                
                <Route path="/admin/user/:userId" element={<ManageUserProfile />} />

                {/* ✅ Main Site Layout */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="browse" element={<BrowseStuds />} />
                    <Route path="new-advert" element={<NewAdvert />} />
                    <Route path="stud-details" element={<StudDetails />} />
                    <Route path="stud-details/:id" element={<StudDetails />} />
                    <Route path="profile/:uid" element={<UserProfile />} />
                    <Route path="logout" element={<Logout />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="/edit-stud/:id" element={<EditStud />} />
                    <Route path="/favourites" element={<Favourites />} />


                </Route>

                {/* ✅ Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;
