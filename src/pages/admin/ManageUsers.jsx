import React from 'react';
import AdminSidebar from '../../components/AdminSidebar';

export default function ManageUsers() {
    return (
        <>
            <AdminSidebar />
            <div className="admin-dashboard">
                <h1 style={{ marginTop: '40px' }}>Manage Users</h1>
                <p>This is where you’ll view and manage registered users.</p>
            </div>
        </>
    );
}
