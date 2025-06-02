// components/Avatar.jsx
import React from "react";
import "./Messages.css"; // for .messages-page-avatar & .messages-page-avatar-placeholder

export const Avatar = ({ user }) => {
    // try a few fields in your Firestore user doc
    const src = user.avatarUrl || user.photoURL || user.profilePic;

    if (src) {
        return (
            <img
                src={src}
                alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Avatar"}
                className="messages-page-avatar"
            />
        );
    }

    // fallback to initials
    const initials = (
        (user.firstName?.[0] ?? "") +
        (user.lastName?.[0] ?? "")
    ).toUpperCase() || "U";

    return (
        <div className="messages-page-avatar-placeholder">
            {initials}
        </div>
    );
};
