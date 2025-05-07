import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;

            if (!user.emailVerified) {
                await signOut(auth);
                setError("Your email is not verified. Please check your inbox.");
                return;
            }

            // 🔍 Fetch user profile from Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();

                if (userData.blacklisted) {
                    await signOut(auth);
                    setError("Your account has been blocked. Please contact support at support@mypetconnect.co.uk.");
                    return;
                }

                if (userData.isAdmin) {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                // fallback if user doc doesn't exist
                navigate("/");
            }

        } catch (err) {
            console.error("Login error:", err.message);
            setError("Login failed: " + err.message);
        }
    };


    const handleResendVerification = async () => {
        try {
            const user = auth.currentUser;
            if (user && !user.emailVerified) {
                await user.sendEmailVerification();
                alert("Verification email sent again. Please check your inbox.");
            }
        } catch (err) {
            console.error("Resend verification error:", err.message);
            alert("Failed to resend verification email.");
        }
    };

    return (
        <div className="login-page">
            <div className="login-logo">
                <img src="https://placehold.co/120x120?text=Logo" alt="Logo" />
            </div>

            <h2>Login</h2>
            {error && (
                <div className="login-error-message">
                    <p>{error.includes("support@") ? "Your account has been blocked. Please contact support" : error}</p>
                    {error.includes("support@") && (
                        <p>
                            {" "}
                            <a href="mailto:support@mypetconnect.co.uk" className="email-link">
                                support@mypetconnect.co.uk
                            </a>
                        </p>
                    )}
                </div>
            )}

            {error.includes("not verified") && (
                <button type="button" className="resend-button" onClick={handleResendVerification}>
                    Resend Verification Email
                </button>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>

            <p className="register-link">
                Don’t have an account? <a href="/register">Register now</a>
            </p>
        </div>
    );
}

export default Login;
