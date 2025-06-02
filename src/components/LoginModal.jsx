// File: src/components/LoginModal.jsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import "./LoginModal.css";
import { sendPasswordResetEmail } from "firebase/auth";

function LoginModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation(); // Get current location
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const [resetError, setResetError] = useState("");

    // Effect to control body scrolling
    React.useEffect(() => {
        if (isOpen) {
            // Prevent scrolling when modal is open
            document.body.classList.add('login-modal-open');
        } else {
            // Re-enable scrolling when modal is closed
            document.body.classList.remove('login-modal-open');
        }

        // Cleanup function to ensure we remove the class when component unmounts
        return () => {
            document.body.classList.remove('login-modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const { user } = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            if (!user.emailVerified) {
                await signOut(auth);
                setError("Your email is not verified. Please check your inbox.");
                return;
            }

            const userDoc = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDoc);

            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.blacklisted) {
                    await signOut(auth);
                    setError("Your account has been blocked. Please contact support at support@mypetconnect.co.uk.");
                    return;
                }

                // Update lastLogin timestamp
                await updateDoc(userDoc, {
                    lastLogin: serverTimestamp()
                });

                // FIXED: Don't navigate if already on an admin page
                const currentPath = location.pathname;
                console.log('LoginModal: Current path:', currentPath);
                console.log('LoginModal: User is admin:', data.isAdmin);

                // Close the modal first
                onClose();

                // Only navigate if necessary
                if (currentPath.startsWith('/admin')) {
                    // Already on an admin page, don't navigate
                    console.log('LoginModal: Already on admin page, not navigating');
                    // The RequireAdmin component will re-check auth and render appropriately
                } else if (data.isAdmin) {
                    // Not on admin page but user is admin, go to admin dashboard
                    console.log('LoginModal: Navigating to admin dashboard');
                    navigate("/admin");
                } else {
                    // Regular user, go to home if not already there
                    if (currentPath !== '/') {
                        console.log('LoginModal: Navigating to home');
                        navigate("/");
                    }
                }
            } else {
                // No user document found, just close modal
                console.log('LoginModal: No user document found');
                onClose();

                // Only navigate to home if not already there
                if (location.pathname !== '/') {
                    navigate("/");
                }
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

    return ReactDOM.createPortal(
        <div className="login-modal-overlay">
            <div className="login-modal-content">
                <button className="login-modal-close" onClick={onClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <div className="login-container">
                    <div className="login-logo">
                        <img src="https://placehold.co/120x120?text=Logo" alt="Logo" />
                    </div>

                    <h2 className="login-title">Sign In</h2>

                    {error && (
                        <div className="login-error-message">
                            <p>{error.includes("support@") ? "Your account has been blocked. Please contact support." : error}</p>
                            {error.includes("support@") && (
                                <p><a href="mailto:support@mypetconnect.co.uk" className="login-email-link">support@mypetconnect.co.uk</a></p>
                            )}
                        </div>
                    )}

                    {error.includes("not verified") && (
                        <button type="button" className="login-resend-button" onClick={handleResendVerification}>
                            Resend Verification Email
                        </button>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-form-group">
                            <label htmlFor="email" className="login-label">Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className="login-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="login-form-group">
                            <label htmlFor="password" className="login-label">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                className="login-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button type="submit" className="login-submit-button">
                            Login
                        </button>
                    </form>
                    <div className="login-footer-links">
                        <p className="login-register-link">
                            Don't have an account? <a href="/register" className="login-link">Register now</a>
                        </p>
                        <p
                            className="login-forgot-link"
                            onClick={() => {
                                const emailToUse = formData.email.trim();
                                if (!emailToUse) {
                                    alert("Please enter your email above to reset your password.");
                                    return;
                                }

                                sendPasswordResetEmail(auth, emailToUse)
                                    .then(() => alert("Password reset email sent. Check your inbox."))
                                    .catch((err) => {
                                        console.error("Password reset error:", err.message);
                                        alert("Failed to send reset email. Please check the email address.");
                                    });
                            }}
                        >
                            Forgot your password?
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default LoginModal;