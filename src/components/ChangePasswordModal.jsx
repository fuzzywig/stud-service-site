import React, { useState } from "react";
import { updatePassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

// Import the standalone CSS file
// import "./PasswordModal.css";

const ChangePasswordModal = ({ onClose }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Calculate password strength
    const getPasswordStrength = (password) => {
        if (!password) return 0;
        let score = 0;

        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character variety checks
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        return Math.min(score, 4);
    };

    const getStrengthClass = (strength) => {
        const classes = [
            "up-password-modal-strength-weak",
            "up-password-modal-strength-fair",
            "up-password-modal-strength-good",
            "up-password-modal-strength-strong",
            "up-password-modal-strength-very-strong"
        ];
        return classes[strength];
    };

    const getStrengthText = (strength) => {
        const texts = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
        return texts[strength];
    };

    const handleSubmit = async () => {
        setError("");
        setLoading(true);

        const user = auth.currentUser;

        if (!user) {
            setError("You must be logged in to change your password");
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            await updatePassword(user, newPassword);
            setSuccess("Password updated successfully");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const strength = getPasswordStrength(newPassword);
    const strengthClass = getStrengthClass(strength);
    const strengthText = getStrengthText(strength);

    return (
        <div className="up-password-modal-backdrop" onClick={onClose}>
            <div className="up-password-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="up-password-modal-header">
                    <h3 className="up-password-modal-title">Change Password</h3>
                    <button className="up-password-modal-close-btn" onClick={onClose} aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="up-password-modal-form">
                    <div className="up-password-modal-form-group">
                        <label htmlFor="new-password">New Password</label>
                        <div className="up-password-modal-input-container">
                            <input
                                id="new-password"
                                type={showPassword ? "text" : "password"}
                                className="up-password-modal-input"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                type="button"
                                className="up-password-modal-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72 1.52a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {newPassword && (
                            <div className="up-password-modal-strength">
                                <div className="up-password-modal-strength-labels">
                                    <span className="up-password-modal-strength-label">Password strength</span>
                                    <span className="up-password-modal-strength-value" style={{ color: `var(--${strengthClass.replace('up-password-modal-strength-', '')}-color)` }}>
                                        {strengthText}
                                    </span>
                                </div>
                                <div className="up-password-modal-strength-bar">
                                    <div
                                        className={`up-password-modal-strength-progress ${strengthClass}`}
                                        style={{ width: `${(strength / 4) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="up-password-modal-form-group">
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <div className="up-password-modal-input-container">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                className={`up-password-modal-input ${confirmPassword && newPassword !== confirmPassword ? 'error' : ''}`}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                type="button"
                                className="up-password-modal-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72 1.52a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {confirmPassword && newPassword !== confirmPassword && (
                            <div className="up-password-modal-match-error">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                Passwords don't match
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="up-password-modal-error">
                            <div className="up-password-modal-error-message">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="up-password-modal-success">
                            <div className="up-password-modal-success-message">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span>{success}</span>
                            </div>
                        </div>
                    )}

                    <button
                        className="up-password-modal-submit-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="up-password-modal-loading">
                                <svg className="up-password-modal-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating Password...
                            </span>
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;