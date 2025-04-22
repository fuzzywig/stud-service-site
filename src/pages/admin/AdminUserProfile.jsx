import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar"; // ✅ Import the sidebar

function AdminUserProfile() {
    const { uid } = useParams();
    const [userData, setUserData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            if (!uid) return;

            try {
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                } else {
                    setUserData(false);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserData(false);
            }
        };

        fetchUser();
    }, [uid]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUserData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = async () => {
        if (!userData) return;
        setSaving(true);
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: userData.email || "",
                phone: userData.phone || "",
                postcode: userData.postcode || "",
                isAdmin: userData.isAdmin || false,
            });
            setSuccessMsg("✅ User updated successfully.");
        } catch (err) {
            console.error("Failed to update user:", err);
            alert("Failed to update user.");
        } finally {
            setSaving(false);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    if (userData === false) return <p style={{ padding: "2rem" }}>❌ User not found.</p>;
    if (!userData) return <p style={{ padding: "2rem" }}>Loading user data...</p>;

    return (
        <div style={{ display: "flex" }}>
            <AdminSidebar />
            <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", flex: 1 }}>
                <h2>Admin User Profile</h2>
                <label>First Name</label>
                <input
                    type="text"
                    name="firstName"
                    value={userData.firstName || ""}
                    onChange={handleChange}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <label>Last Name</label>
                <input
                    type="text"
                    name="lastName"
                    value={userData.lastName || ""}
                    onChange={handleChange}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={userData.email || ""}
                    onChange={handleChange}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <label>Phone</label>
                <input
                    type="tel"
                    name="phone"
                    value={userData.phone || ""}
                    onChange={handleChange}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <label>Postcode</label>
                <input
                    type="text"
                    name="postcode"
                    value={userData.postcode || ""}
                    onChange={handleChange}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <label>
                    <input
                        type="checkbox"
                        name="isAdmin"
                        checked={userData.isAdmin || false}
                        onChange={handleChange}
                    />
                    Admin User
                </label>

                <br /><br />
                <button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </button>

                {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}
            </div>
        </div>
    );
}

export default AdminUserProfile;
