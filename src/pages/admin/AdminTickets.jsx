import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, where, updateDoc, doc, addDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // adjust path as needed

import './AdminTickets.css';
import AdminSidebar from '../../components/AdminSidebar';

import {
    Search, Filter, ChevronDown, ChevronUp, Clock, AlertCircle,
    CheckCircle, XCircle, MessageSquare, User, Calendar, Tag,
    Star, Trash2, Archive, Eye, Send, Paperclip, Download,
    MoreVertical, Flag, RefreshCw, Bell, Inbox, MessageCircle,
    AlertTriangle, FileText, Mail, Phone, Building
} from 'lucide-react';

const AdminTickets = ({ currentUser }) => {
    const [activeView, setActiveView] = useState('all'); // all, unassigned, mine, archived
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [showInternalNote, setShowInternalNote] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);

    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        type: 'all',
        assignee: 'all',
        dateRange: 'all'
    });

    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'), where('isAdmin', '==', true));
        const unsubscribe = onSnapshot(usersQuery, snapshot => {
            const admins = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAdminUsers(admins);
        }, error => {
            console.error("Failed to fetch admin users:", error);
        });

        return () => unsubscribe();
    }, []);

    // Update your useEffect where you map the ticket data:
    useEffect(() => {
        const ticketsQuery = query(collection(db, "supportTickets"));

        const unsubscribe = onSnapshot(ticketsQuery, snapshot => {
            const ticketsData = snapshot.docs.map(doc => {
                const data = doc.data();

                return {
                    id: doc.id,
                    ...data,
                    messages: data.messages || [],
                    internalNotes: data.internalNotes || [],

                    // Fix: Map createdAt to created
                    created: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() :
                        data.createdAt ||
                        data.created?.toDate ? data.created.toDate().toISOString() :
                            data.created ||
                            new Date().toISOString(),

                    lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate().toISOString() :
                        data.lastUpdated ||
                        new Date().toISOString(),

                    status: data.status || 'open',
                    priority: data.priority || 'medium',
                    type: data.ticketType || data.type || data.category || 'general',
                    ticketType: data.ticketType || data.type || 'general',
                    subject: data.subject || 'No subject',
                    customerName: data.name || data.userName || 'Unknown Customer',
                    customerEmail: data.email || data.userEmail || 'No email provided',
                    customerPhone: data.phone || data.userPhone || '',
                    customerId: data.customerId || data.userId || '',
                    assignedTo: data.assignedTo || '',
                    assignedToId: data.assignedToId || '',
                    responses: data.responses || 0,
                    category: data.category || '',
                    tags: data.tags || [],
                    ticketNumber: data.ticketNumber || `TICK-${doc.id.slice(-6).toUpperCase()}`
                };
            });
            setTickets(ticketsData);
        }, error => {
            console.error("Error fetching tickets:", error);
        });

        return () => unsubscribe();
    }, []);

    const handleArchiveTicket = async (ticketId) => {
        try {
            const ticket = tickets.find(t => t.id === ticketId);
            if (!ticket) return;

            const ticketRef = doc(db, "supportTickets", ticketId);
            const newStatus = ticket.status === 'archived' ? 'open' : 'archived';

            await updateDoc(ticketRef, {
                status: newStatus,
                lastUpdated: serverTimestamp()
            });

            // Clear selection when archiving
            if (newStatus === 'archived') {
                setSelectedTicket(null);
            }

            // If unarchiving and currently in archived view, switch to all view
            if (newStatus === 'open' && activeView === 'archived') {
                setActiveView('all');
                // Re-select the ticket after view change
                setTimeout(() => {
                    const unarchived = tickets.find(t => t.id === ticketId);
                    if (unarchived) setSelectedTicket(unarchived);
                }, 100);
            }
        } catch (error) {
            console.error("Failed to update ticket archive status:", error);
        }
    };


    const handleDeleteTicket = async (ticketId) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) {
            console.error("Ticket not found");
            return;
        }
        if (!currentUser) {
            console.error("No current user");
            return;
        }

        // Use userData.isAdmin instead of currentUser.isAdmin
        if (!userData?.isAdmin && currentUser.uid !== ticket.userId) {
            alert("You don't have permission to delete this ticket");
            return;
        }

        // Show confirmation dialog
        const confirmMessage = `Are you sure you want to delete ticket ${ticket.ticketNumber || ticket.id}?\n\nSubject: ${ticket.subject}\nCustomer: ${ticket.customerName}\n\nThis action cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return; // User cancelled
        }

        try {
            const ticketRef = doc(db, "supportTickets", ticketId);
            await deleteDoc(ticketRef);

            // Clear selection if we just deleted the selected ticket
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(null);
            }

            console.log("Deleted ticket:", ticketId);

            // Optional: Show success message
            // alert(`Ticket ${ticket.ticketNumber} has been deleted successfully`);

        } catch (err) {
            console.error("Failed to delete ticket:", err);
            alert("Failed to delete ticket. Please try again.");
        }
    };


    // Update the stats calculation to be more accurate:
    const stats = {
        total: tickets.filter(t => t.status !== 'archived').length, // Active tickets only
        open: tickets.filter(t => t.status === 'open').length,
        pending: tickets.filter(t => t.status === 'pending').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        archived: tickets.filter(t => t.status === 'archived').length, // Add archived count
        unassigned: tickets.filter(t => !t.assignedTo && t.status !== 'archived').length,
        highPriority: tickets.filter(t => t.priority === 'high' && t.status !== 'archived').length
    };

    // Filter tickets based on view and search
    // Update the filteredTickets filter logic:
    const filteredTickets = tickets.filter(ticket => {
        // View filter
        if (activeView === 'archived') {
            // Only show archived tickets in archived view
            if (ticket.status !== 'archived') return false;
        } else {
            // For all other views (including 'all'), exclude archived tickets
            if (ticket.status === 'archived') return false;

            // Additional view-specific filters
            if (activeView === 'unassigned' && ticket.assignedTo) return false;
            if (activeView === 'mine' && ticket.assignedToId !== currentUser?.uid) return false;
        }

        // Advanced filters
        if (filters.status !== 'all' && ticket.status !== filters.status) return false;
        if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
        if (filters.type !== 'all' && ticket.type !== filters.type) return false;
        if (filters.assignee !== 'all' && ticket.assignedToId !== filters.assignee) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!(
                ticket.id.toLowerCase().includes(query) ||
                ticket.ticketNumber?.toLowerCase().includes(query) ||
                ticket.subject.toLowerCase().includes(query) ||
                ticket.customerName.toLowerCase().includes(query) ||
                ticket.customerEmail.toLowerCase().includes(query)
            )) {
                return false;
            }
        }

        return true;
    });


    // Handlers
    const handleAssignTicket = async (ticketId, assigneeId, assigneeName) => {
        try {
            const ticketRef = doc(db, "supportTickets", ticketId);
            await updateDoc(ticketRef, {
                assignedTo: assigneeName,
                assignedToId: assigneeId,
                lastUpdated: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to assign ticket:", err);
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            const ticketRef = doc(db, "supportTickets", ticketId);
            await updateDoc(ticketRef, {
                status: newStatus,
                lastUpdated: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const handleUpdatePriority = async (ticketId, newPriority) => {
        try {
            const ticketRef = doc(db, "supportTickets", ticketId);
            await updateDoc(ticketRef, {
                priority: newPriority,
                lastUpdated: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to update priority:", err);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !selectedTicket) return;

        const newMessage = {
            id: `msg-${Date.now()}`,
            sender: currentUser?.displayName || 'Admin',
            senderType: 'admin',
            message: replyMessage,
            timestamp: new Date().toISOString(),
            attachments: []
        };

        try {
            const ticketRef = doc(db, "supportTickets", selectedTicket.id);
            await updateDoc(ticketRef, {
                messages: arrayUnion(newMessage),
                responses: selectedTicket.responses + 1,
                lastUpdated: serverTimestamp()
            });
            setReplyMessage('');
        } catch (err) {
            console.error("Failed to send reply:", err);
        }
    };

    const handleAddInternalNote = async () => {
        if (!internalNote.trim() || !selectedTicket) return;

        const newNote = {
            id: `note-${Date.now()}`,
            author: currentUser?.displayName || 'Admin',
            note: internalNote,
            timestamp: new Date().toISOString()
        };

        try {
            const ticketRef = doc(db, "supportTickets", selectedTicket.id);
            await updateDoc(ticketRef, {
                internalNotes: arrayUnion(newNote)
            });
            setInternalNote('');
            setShowInternalNote(false);
        } catch (err) {
            console.error("Failed to add internal note:", err);
        }
    };

    // Update selected ticket when tickets change
    useEffect(() => {
        if (selectedTicket) {
            const updated = tickets.find(t => t.id === selectedTicket.id);
            setSelectedTicket(updated);
        }
    }, [tickets]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div className="ts-admin-tickets-page">
            <AdminSidebar />

            <div className="ts-tickets-content-area">
                {/* Header */}
                <div className="ts-tickets-page-header">
                    <div className="ts-tickets-header-content">
                        <h1 className="ts-tickets-page-title">Support Tickets</h1>
                        <p className="ts-tickets-page-description">
                            Manage and respond to customer support requests
                        </p>
                    </div>
                    <div className="ts-tickets-header-actions">
                        <button className="ts-btn-icon">
                            <RefreshCw size={18} />
                        </button>
                        <button className="ts-btn-icon">
                            <Bell size={18} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="ts-tickets-stats">
                    <div className="ts-stat-card">
                        <div className="ts-stat-icon ts-stat-icon-blue">
                            <Inbox size={20} />
                        </div>
                        <div className="ts-stat-content">
                            <div className="ts-stat-value">{stats.total}</div>
                            <div className="ts-stat-label">Total Tickets</div>
                        </div>
                    </div>
                    <div className="ts-stat-card">
                        <div className="ts-stat-icon ts-stat-icon-green">
                            <MessageCircle size={20} />
                        </div>
                        <div className="ts-stat-content">
                            <div className="ts-stat-value">{stats.open}</div>
                            <div className="ts-stat-label">Open</div>
                        </div>
                    </div>
                    <div className="ts-stat-card">
                        <div className="ts-stat-icon ts-stat-icon-yellow">
                            <Clock size={20} />
                        </div>
                        <div className="ts-stat-content">
                            <div className="ts-stat-value">{stats.pending}</div>
                            <div className="ts-stat-label">Pending</div>
                        </div>
                    </div>
                    <div className="ts-stat-card">
                        <div className="ts-stat-icon ts-stat-icon-red">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="ts-stat-content">
                            <div className="ts-stat-value">{stats.highPriority}</div>
                            <div className="ts-stat-label">High Priority</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="ts-tickets-main">
                    {/* Sidebar */}
                    <div className="ts-tickets-sidebar">
                        {/* Search */}
                        <div className="ts-tickets-search">
                            <Search size={18} className="ts-search-icon" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ts-search-input"
                            />
                        </div>

                        {/* View Tabs */}
                        <div className="ts-view-tabs">
                            <button
                                className={`ts-view-tab ${activeView === 'all' ? 'ts-active' : ''}`}
                                onClick={() => setActiveView('all')}
                            >
                                <Inbox size={16} />
                                <span>All Tickets</span>
                                <span className="ts-tab-count">{stats.total}</span>
                            </button>
                            <button
                                className={`ts-view-tab ${activeView === 'unassigned' ? 'ts-active' : ''}`}
                                onClick={() => setActiveView('unassigned')}
                            >
                                <User size={16} />
                                <span>Unassigned</span>
                                <span className="ts-tab-count">{stats.unassigned}</span>
                            </button>
                            <button
                                className={`ts-view-tab ${activeView === 'mine' ? 'ts-active' : ''}`}
                                onClick={() => setActiveView('mine')}
                            >
                                <Star size={16} />
                                <span>My Tickets</span>
                            </button>
                            <button
                                className={`ts-view-tab ${activeView === 'archived' ? 'ts-active' : ''}`}
                                onClick={() => setActiveView('archived')}
                            >
                                <Archive size={16} />
                                <span>Archived</span>
                                <span className="ts-tab-count">{stats.archived}</span>
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        <button
                            className="ts-filter-toggle"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showFilters && (
                            <div className="ts-filters-panel">
                                <div className="ts-filter-group">
                                    <label>Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    >
                                        <option value="all">All</option>
                                        <option value="open">Open</option>
                                        <option value="pending">Pending</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="ts-filter-group">
                                    <label>Priority</label>
                                    <select
                                        value={filters.priority}
                                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                    >
                                        <option value="all">All</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="ts-filter-group">
                                    <label>Type</label>
                                    <select
                                        value={filters.type}
                                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                                    >
                                        <option value="all">All</option>
                                        <option value="technical">Technical</option>
                                        <option value="billing">Billing</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Ticket List */}
                        <div className="ts-tickets-list">
                            {filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    className={`ts-ticket-item ${selectedTicket?.id === ticket.id ? 'ts-selected' : ''}`}
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="ts-ticket-item-header">
                                        <span className="ts-ticket-id">{ticket.ticketNumber || `#${ticket.id.slice(-6)}`}</span>
                                        <span className={`ts-ticket-priority ts-priority-${ticket.priority}`}>
                   {ticket.priority}
               </span>
                                    </div>
                                    <h4 className="ts-ticket-subject">{ticket.subject}</h4>
                                    <div className="ts-ticket-meta">
                                        <span className="ts-ticket-customer">{ticket.customerName}</span>
                                        <span className="ts-ticket-time">{formatDate(ticket.lastUpdated)}</span>
                                    </div>
                                    <div className="ts-ticket-footer">
                                        <span className={`ts-ticket-status ts-status-${ticket.status}`}>
                                            {ticket.status}
                                        </span>
                                        {ticket.assignedTo && (
                                            <span className="ts-ticket-assignee">
                                                <User size={12} />
                                                {ticket.assignedTo}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Details */}
                    {selectedTicket ? (
                        <div className="ts-ticket-details">
                            {/* Ticket Header */}
                            <div className="ts-ticket-details-header">
                                <div className="ts-ticket-header-left">
                                    <h2>{selectedTicket.subject}</h2>
                                    <div className="ts-ticket-header-meta">
                                        <span className="ts-ticket-id-large">{selectedTicket.ticketNumber}</span>
                                        <span className={`ts-ticket-status-large ts-status-${selectedTicket.status}`}>
                        {selectedTicket.status}
                    </span>
                                        <span className={`ts-ticket-priority-large ts-priority-${selectedTicket.priority}`}>
                        {selectedTicket.priority}
                    </span>
                                    </div>
                                </div>
                                <div className="ts-ticket-header-actions">
                                    <button
                                        className={selectedTicket.status === 'archived' ? 'ts-btn-secondary ts-btn-unarchive' : 'ts-btn-secondary'}
                                        onClick={() => handleArchiveTicket(selectedTicket.id)}
                                    >
                                        {selectedTicket.status === 'archived' ? (
                                            <>
                                                <RefreshCw size={16} />
                                                Unarchive
                                            </>
                                        ) : (
                                            <>
                                                <Archive size={16} />
                                                Archive
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className="ts-btn-secondary"
                                        onClick={() => {
                                            setTicketToDelete(selectedTicket);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div> {/* Properly closed ticket-details-header */}

                            {/* Customer Info */}
                            <div className="ts-customer-info">
                                <h3>Customer Information</h3>
                                <div className="ts-info-grid">
                                    <div className="ts-info-item">
                                        <User size={16} />
                                        <span>{selectedTicket.customerName}</span>
                                    </div>
                                    <div className="ts-info-item">
                                        <Mail size={16} />
                                        <span>{selectedTicket.customerEmail}</span>
                                    </div>
                                    {selectedTicket.customerPhone && (
                                        <div className="ts-info-item">
                                            <Phone size={16} />
                                            <span>{selectedTicket.customerPhone}</span>
                                        </div>
                                    )}
                                    {selectedTicket.customerId && (
                                        <div className="ts-info-item">
                                            <Tag size={16} />
                                            <span>ID: {selectedTicket.customerId}</span>
                                        </div>
                                    )}
                                    <div className="ts-info-item">
                                        <Calendar size={16} />
                                        <span>Created {new Date(selectedTicket.created).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                    {selectedTicket.type && (
                                        <div className="ts-info-item">
                                            <FileText size={16} />
                                            <span>Type: {selectedTicket.ticketType?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    {selectedTicket.category && (
                                        <div className="ts-info-item">
                                            <Building size={16} />
                                            <span>Category: {selectedTicket.category}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rest of the component continues as is... */}

                            {/* Quick Actions */}
                            <div className="ts-quick-actions">
                                <div className="ts-action-group">
                                    <label>Assign to:</label>
                                    <select
                                        value={selectedTicket.assignedToId || ''}
                                        onChange={(e) => {
                                            const option = e.target.options[e.target.selectedIndex];
                                            handleAssignTicket(selectedTicket.id, e.target.value, option.text);
                                        }}
                                    >
                                        <option value="">Unassigned</option>
                                        {adminUsers.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : admin.email}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                                <div className="ts-action-group">
                                    <label>Status:</label>
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                                    >
                                        <option value="open">Open</option>
                                        <option value="pending">Pending</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="ts-action-group">
                                    <label>Priority:</label>
                                    <select
                                        value={selectedTicket.priority}
                                        onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="ts-ticket-messages">
                                <h3>Conversation</h3>
                                <div className="ts-messages-list">
                                    {selectedTicket.messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`ts-message ${message.senderType === 'admin' ? 'ts-admin-message' : 'ts-customer-message'}`}
                                        >
                                            <div className="ts-message-header">
                                                <span className="ts-message-sender">{message.sender}</span>
                                                <span className="ts-message-time">{formatDate(message.timestamp)}</span>
                                            </div>
                                            <div className="ts-message-content">{message.message}</div>
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className="ts-message-attachments">
                                                    {message.attachments.map((url, idx) => (
                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="ts-attachment-link">
                                                            <Paperclip size={14} />
                                                            Attachment {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Box */}
                                <div className="ts-reply-box">
                                    <textarea
                                        placeholder="Type your reply..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        rows={4}
                                    />
                                    <div className="ts-reply-actions">
                                        <div className="ts-reply-actions-left">
                                            <button className="ts-btn-icon">
                                                <Paperclip size={18} />
                                            </button>
                                            <button
                                                className="ts-btn-text"
                                                onClick={() => setShowInternalNote(!showInternalNote)}
                                            >
                                                Add Internal Note
                                            </button>
                                        </div>
                                        <button
                                            className="ts-btn-primary"
                                            onClick={handleSendReply}
                                            disabled={!replyMessage.trim()}
                                        >
                                            <Send size={16} />
                                            Send Reply
                                        </button>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                {showInternalNote && (
                                    <div className="ts-internal-note-box">
                                        <h4>Add Internal Note</h4>
                                        <textarea
                                            placeholder="This note will only be visible to admins..."
                                            value={internalNote}
                                            onChange={(e) => setInternalNote(e.target.value)}
                                            rows={3}
                                        />
                                        <div className="ts-note-actions">
                                            <button
                                                className="ts-btn-text"
                                                onClick={() => {
                                                    setShowInternalNote(false);
                                                    setInternalNote('');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="ts-btn-secondary"
                                                onClick={handleAddInternalNote}
                                                disabled={!internalNote.trim()}
                                            >
                                                Add Note
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Display Internal Notes */}
                                {selectedTicket.internalNotes.length > 0 && (
                                    <div className="ts-internal-notes">
                                        <h4>Internal Notes</h4>
                                        {selectedTicket.internalNotes.map(note => (
                                            <div key={note.id} className="ts-internal-note">
                                                <div className="ts-note-header">
                                                    <span className="ts-note-author">{note.author}</span>
                                                    <span className="ts-note-time">{formatDate(note.timestamp)}</span>
                                                </div>
                                                <div className="ts-note-content">{note.note}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="ts-no-ticket-selected">
                            <MessageSquare size={48} />
                            <h3>Select a ticket to view details</h3>
                            <p>Choose a ticket from the list to view and respond to customer inquiries</p>
                        </div>
                    )}
                </div>
            </div>
            {showDeleteModal && ticketToDelete && (
                <div className="ts-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="ts-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ts-modal-header">
                            <h3>Delete Ticket</h3>
                            <button
                                className="ts-modal-close"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="ts-modal-body">
                            <div className="ts-warning-icon">
                                <AlertTriangle size={48} color="#ef4444" />
                            </div>
                            <p className="ts-modal-message">
                                Are you sure you want to delete ticket <strong>{ticketToDelete.ticketNumber}</strong>?
                            </p>
                            <div className="ts-ticket-details-preview">
                                <p><strong>Subject:</strong> {ticketToDelete.subject}</p>
                                <p><strong>Customer:</strong> {ticketToDelete.customerName}</p>
                                <p><strong>Status:</strong> {ticketToDelete.status}</p>
                            </div>
                            <p className="ts-warning-text">
                                This action cannot be undone. All messages and data associated with this ticket will be permanently deleted.
                            </p>
                        </div>

                        <div className="ts-modal-footer">
                            <button
                                className="ts-btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="ts-btn-danger"
                                onClick={() => {
                                    handleDeleteTicket(ticketToDelete.id);
                                    setShowDeleteModal(false);
                                    setTicketToDelete(null);
                                }}
                            >
                                <Trash2 size={16} />
                                Delete Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTickets;