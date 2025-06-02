import React, { useEffect, useState } from "react";
import { collection, query, addDoc, getDocs, doc, getDoc, orderBy, updateDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import {
    FaSearch,
    FaUserSlash,
    FaClock,
    FaFlag,
    FaEnvelope,
    FaRegStickyNote,
    FaCheck,
    FaBan,
    FaEye,
    FaUserCircle,
    FaExclamationTriangle,
    FaExclamationCircle,
    FaTimes,
    FaComment,
    FaFilter,
    FaUsers,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaThumbsUp,
    FaThumbsDown,
    FaCalendarAlt,
    FaChevronDown,
    FaChevronUp,
    FaBars,
    FaClipboardList,
    FaDog,
    FaPaw
} from "react-icons/fa";
import "./ReportedUsers.css";

const ReportedUsers = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [adminNotes, setAdminNotes] = useState({});
    const [selectedFilter, setSelectedFilter] = useState("pending");
    const [reportTypeFilter, setReportTypeFilter] = useState("all"); // New filter for report types
    const [isLoading, setIsLoading] = useState(true);
    const [expandedReportId, setExpandedReportId] = useState(null);
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortDirection, setSortDirection] = useState("desc");
    const [activeTab, setActiveTab] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllReports();
    }, []);

    useEffect(() => {
        filterAndSortReports();
    }, [reports, searchTerm, selectedFilter, reportTypeFilter, sortBy, sortDirection]);

    const fetchAllReports = async () => {
        try {
            setIsLoading(true);
            const allReports = [];

            // 1. Fetch original reports (message reports)
            const messageReportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
            const messageReportsSnap = await getDocs(messageReportsQuery);

            for (const docSnap of messageReportsSnap.docs) {
                const report = docSnap.data();
                const reportId = docSnap.id;

                const notesSnap = await getDocs(collection(db, "reports", reportId, "incidentNotes"));
                const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Fetch reported and reporting user info
                const reporterSnap = await getDoc(doc(db, "users", report.reportedBy));
                const reportedSnap = await getDoc(doc(db, "users", report.reportedUser));

                allReports.push({
                    id: reportId,
                    ...report,
                    reportType: "message", // Tag this as a message report
                    reportedByData: reporterSnap.exists() ? reporterSnap.data() : {},
                    reportedUserData: reportedSnap.exists() ? reportedSnap.data() : {},
                    notes
                });

                if (report.adminNotes) {
                    setAdminNotes(prev => ({ ...prev, [reportId]: report.adminNotes }));
                }
                setActiveTab(prev => ({ ...prev, [reportId]: "messages" }));
            }

            // 2. Fetch user reports
            const userReportsQuery = query(collection(db, "userReports"), orderBy("createdAt", "desc"));
            const userReportsSnap = await getDocs(userReportsQuery);

            for (const docSnap of userReportsSnap.docs) {
                const report = docSnap.data();
                const reportId = docSnap.id;

                // Fetch reporter and reported user info
                const reporterSnap = report.reporterId ? await getDoc(doc(db, "users", report.reporterId)) : null;
                const reportedSnap = report.reportedUserId ? await getDoc(doc(db, "users", report.reportedUserId)) : null;

                // Fetch any notes for this user report
                const notesSnap = await getDocs(collection(db, "userReports", reportId, "incidentNotes"));
                const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                allReports.push({
                    id: reportId,
                    ...report,
                    reportType: "user", // Tag this as a user report
                    timestamp: report.createdAt, // Normalize timestamp field
                    reportedBy: report.reporterId, // Normalize field names
                    reportedUser: report.reportedUserId,
                    reportedByData: reporterSnap?.exists() ? reporterSnap.data() : {},
                    reportedUserData: reportedSnap?.exists() ? reportedSnap.data() : {},
                    notes
                });

                setActiveTab(prev => ({ ...prev, [reportId]: "details" }));
            }

            // 3. Fetch advert reports
            const advertReportsQuery = query(collection(db, "advertReports"), orderBy("createdAt", "desc"));
            const advertReportsSnap = await getDocs(advertReportsQuery);

            for (const docSnap of advertReportsSnap.docs) {
                const report = docSnap.data();
                const reportId = docSnap.id;

                // Fetch reporter and advert owner info
                const reporterSnap = report.reporterId ? await getDoc(doc(db, "users", report.reporterId)) : null;
                const ownerSnap = report.ownerId ? await getDoc(doc(db, "users", report.ownerId)) : null;

                // Fetch advert details
                let advertData = null;
                if (report.advertId) {
                    const advertSnap = await getDoc(doc(db, "allListings", report.advertId));
                    if (advertSnap.exists()) {
                        advertData = { id: advertSnap.id, ...advertSnap.data() };
                    }
                }

                // Fetch any notes for this advert report
                const notesSnap = await getDocs(collection(db, "advertReports", reportId, "incidentNotes"));
                const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                allReports.push({
                    id: reportId,
                    ...report,
                    reportType: "advert", // Tag this as an advert report
                    timestamp: report.createdAt, // Normalize timestamp field
                    reportedBy: report.reporterId, // Normalize field names
                    reportedUser: report.ownerId, // The advert owner is the "reported user"
                    reportedByData: reporterSnap?.exists() ? reporterSnap.data() : {},
                    reportedUserData: ownerSnap?.exists() ? ownerSnap.data() : {},
                    advertData, // Include advert details
                    notes
                });

                setActiveTab(prev => ({ ...prev, [reportId]: "advert" }));
            }

            setReports(allReports);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAndSortReports = () => {
        let filtered = reports.filter(report => {
            // Filter by report type
            if (reportTypeFilter !== "all" && report.reportType !== reportTypeFilter) {
                return false;
            }

            // Filter by status
            if (selectedFilter !== "all" && report.status !== selectedFilter) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const reporterName = `${report.reportedByData.firstName || ""} ${report.reportedByData.lastName || ""}`.toLowerCase();
                const reportedName = `${report.reportedUserData.firstName || ""} ${report.reportedUserData.lastName || ""}`.toLowerCase();
                const reportReason = (report.reason || "").toLowerCase();
                const advertTitle = (report.advertData?.title || "").toLowerCase();

                return (
                    reporterName.includes(searchTerm.toLowerCase()) ||
                    reportedName.includes(searchTerm.toLowerCase()) ||
                    reportReason.includes(searchTerm.toLowerCase()) ||
                    advertTitle.includes(searchTerm.toLowerCase()) ||
                    (report.reportedBy && report.reportedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (report.reportedUser && report.reportedUser.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            return true;
        });

        // Sort the filtered results
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case "timestamp":
                    valueA = a.timestamp?.seconds || a.timestamp?._seconds || 0;
                    valueB = b.timestamp?.seconds || b.timestamp?._seconds || 0;
                    break;
                case "reportedUser":
                    valueA = a.reportedUserData?.firstName?.toLowerCase() || "";
                    valueB = b.reportedUserData?.firstName?.toLowerCase() || "";
                    break;
                case "reporter":
                    valueA = a.reportedByData?.firstName?.toLowerCase() || "";
                    valueB = b.reportedByData?.firstName?.toLowerCase() || "";
                    break;
                case "status":
                    valueA = a.status || "pending";
                    valueB = b.status || "pending";
                    break;
                case "type":
                    valueA = a.reportType;
                    valueB = b.reportType;
                    break;
                default:
                    valueA = a.timestamp?.seconds || 0;
                    valueB = b.timestamp?.seconds || 0;
            }

            if (sortDirection === "asc") {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        setFilteredReports(filtered);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortDirection("desc");
        }
    };

    const fetchNotes = async (reportId, reportType) => {
        try {
            const collectionName = reportType === "message" ? "reports" :
                reportType === "user" ? "userReports" :
                    "advertReports";

            const notesSnap = await getDocs(collection(db, collectionName, reportId, "incidentNotes"));
            const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            setReports(prev =>
                prev.map(r => r.id === reportId ? { ...r, notes } : r)
            );
        } catch (err) {
            console.error("Error fetching notes:", err);
        }
    };

    const handleSaveNotes = async (reportId, reportType) => {
        const text = adminNotes[reportId]?.trim();
        if (!text) return alert("Note cannot be empty.");

        try {
            const collectionName = reportType === "message" ? "reports" :
                reportType === "user" ? "userReports" :
                    "advertReports";

            const notesRef = collection(db, collectionName, reportId, "incidentNotes");
            await addDoc(notesRef, {
                text,
                createdAt: serverTimestamp(),
                createdBy: "admin", // use real admin UID
                createdByName: "Admin" // use real admin name
            });

            setAdminNotes(prev => ({ ...prev, [reportId]: "" }));
            alert("Note saved.");
            await fetchNotes(reportId, reportType);
        } catch (err) {
            console.error("Error saving note:", err);
            alert("Failed to save note.");
        }
    };

    const handleMarkAsReviewed = async (reportId, reportType) => {
        try {
            const collectionName = reportType === "message" ? "reports" :
                reportType === "user" ? "userReports" :
                    "advertReports";

            const reportRef = doc(db, collectionName, reportId);
            await updateDoc(reportRef, {
                status: "reviewed",
                reviewedBy: "admin", // Replace with actual admin ID
                reviewedAt: serverTimestamp()
            });

            setReports(reports.map(report =>
                report.id === reportId ? { ...report, status: "reviewed" } : report
            ));

            alert("Report marked as reviewed");
        } catch (error) {
            console.error("Error updating report status:", error);
            alert("Failed to update report status");
        }
    };

    const handleToggleBlacklist = async (userId, reportId, currentlyBlacklisted) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                blacklisted: !currentlyBlacklisted,
                blacklistedAt: serverTimestamp(),
                blacklistedBy: "admin"
            });

            const report = reports.find(r => r.id === reportId);
            const collectionName = report.reportType === "message" ? "reports" :
                report.reportType === "user" ? "userReports" :
                    "advertReports";

            const reportRef = doc(db, collectionName, reportId);
            await updateDoc(reportRef, {
                status: !currentlyBlacklisted ? "blacklisted" : "reviewed"
            });

            setReports(prev =>
                prev.map(report =>
                    report.id === reportId
                        ? {
                            ...report,
                            status: !currentlyBlacklisted ? "blacklisted" : "reviewed",
                            reportedUserData: {
                                ...report.reportedUserData,
                                blacklisted: !currentlyBlacklisted
                            }
                        }
                        : report
                )
            );

            alert(`User has been ${!currentlyBlacklisted ? "blacklisted" : "unblacklisted"}`);
        } catch (error) {
            console.error("Error toggling blacklist:", error);
            alert("Failed to update user blacklist status.");
        }
    };

    const handleDeleteAdvert = async (advertId, reportId) => {
        if (!window.confirm("Are you sure you want to delete this advert? This action cannot be undone.")) {
            return;
        }

        try {
            const advertRef = doc(db, "allListings", advertId);
            await updateDoc(advertRef, {
                deleted: true,
                deletedBy: "admin",
                deletedAt: serverTimestamp(),
                deletedReason: "Reported content violation"
            });

            // Update report status
            await handleMarkAsReviewed(reportId, "advert");

            alert("Advert has been deleted successfully");
        } catch (error) {
            console.error("Error deleting advert:", error);
            alert("Failed to delete advert");
        }
    };

    const toggleReportExpansion = (reportId) => {
        setExpandedReportId(expandedReportId === reportId ? null : reportId);
    };

    const changeReportTab = (reportId, tab) => {
        setActiveTab(prev => ({ ...prev, [reportId]: tab }));
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Unknown date";

        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        } catch (error) {
            return "Invalid date";
        }
    };

    const getReportStatusClass = (status) => {
        switch (status) {
            case "pending":
                return "repus-status-pending";
            case "reviewed":
                return "repus-status-reviewed";
            case "blacklisted":
                return "repus-status-blacklisted";
            default:
                return "repus-status-pending";
        }
    };

    const getReportStatusLabel = (status) => {
        switch (status) {
            case "pending":
                return "Pending Review";
            case "reviewed":
                return "Reviewed";
            case "blacklisted":
                return "User Blacklisted";
            default:
                return "Pending";
        }
    };

    const getReportTypeIcon = (type) => {
        switch (type) {
            case "message":
                return <FaComment />;
            case "user":
                return <FaUserCircle />;
            case "advert":
                return <FaClipboardList />;
            default:
                return <FaFlag />;
        }
    };

    const getReportTypeLabel = (type) => {
        switch (type) {
            case "message":
                return "Message Report";
            case "user":
                return "User Report";
            case "advert":
                return "Advert Report";
            default:
                return "Report";
        }
    };

    const getSortIcon = (column) => {
        if (sortBy !== column) return <FaSort className="repus-sort-icon" />;
        return sortDirection === "asc" ? <FaSortUp className="repus-sort-icon active" /> : <FaSortDown className="repus-sort-icon active" />;
    };

    return (
        <div className="repus-reported-users-page">
            <AdminSidebar />
            <div className="repus-content-area">
                <div className="repus-page-header">
                    <h1 className="repus-page-title">All Reports</h1>
                    <div className="repus-page-stats">
                        <div className="repus-stat-card">
                            <div className="repus-stat-icon repus-pending-icon">
                                <FaClock />
                            </div>
                            <div className="repus-stat-info">
                                <div className="repus-stat-value">{reports.filter(r => r.status === "pending").length}</div>
                                <div className="repus-stat-label">Pending</div>
                            </div>
                        </div>
                        <div className="repus-stat-card">
                            <div className="repus-stat-icon repus-reviewed-icon">
                                <FaCheck />
                            </div>
                            <div className="repus-stat-info">
                                <div className="repus-stat-value">{reports.filter(r => r.status === "reviewed").length}</div>
                                <div className="repus-stat-label">Reviewed</div>
                            </div>
                        </div>
                        <div className="repus-stat-card">
                            <div className="repus-stat-icon repus-blacklisted-icon">
                                <FaBan />
                            </div>
                            <div className="repus-stat-info">
                                <div className="repus-stat-value">{reports.filter(r => r.status === "blacklisted").length}</div>
                                <div className="repus-stat-label">Blacklisted</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="repus-toolbar">
                    <div className="repus-search-box">
                        <FaSearch className="repus-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, reason, user ID, or advert title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="repus-search-input"
                        />
                    </div>
                    <div className="repus-filter-sort">
                        <div className="repus-filter-buttons">
                            <button
                                className={`repus-filter-button ${reportTypeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setReportTypeFilter('all')}
                            >
                                <FaFilter /> All Types
                            </button>
                            <button
                                className={`repus-filter-button ${reportTypeFilter === 'message' ? 'active' : ''}`}
                                onClick={() => setReportTypeFilter('message')}
                            >
                                <FaComment /> Messages
                            </button>
                            <button
                                className={`repus-filter-button ${reportTypeFilter === 'user' ? 'active' : ''}`}
                                onClick={() => setReportTypeFilter('user')}
                            >
                                <FaUserCircle /> Users
                            </button>
                            <button
                                className={`repus-filter-button ${reportTypeFilter === 'advert' ? 'active' : ''}`}
                                onClick={() => setReportTypeFilter('advert')}
                            >
                                <FaClipboardList /> Adverts
                            </button>
                        </div>
                        <div className="repus-filter-buttons">
                            <button
                                className={`repus-filter-button ${selectedFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedFilter('all')}
                            >
                                <FaFilter /> All Status
                            </button>
                            <button
                                className={`repus-filter-button ${selectedFilter === 'pending' ? 'active' : ''}`}
                                onClick={() => setSelectedFilter('pending')}
                            >
                                <FaClock /> Pending
                            </button>
                            <button
                                className={`repus-filter-button ${selectedFilter === 'reviewed' ? 'active' : ''}`}
                                onClick={() => setSelectedFilter('reviewed')}
                            >
                                <FaCheck /> Reviewed
                            </button>
                            <button
                                className={`repus-filter-button ${selectedFilter === 'blacklisted' ? 'active' : ''}`}
                                onClick={() => setSelectedFilter('blacklisted')}
                            >
                                <FaBan /> Blacklisted
                            </button>
                        </div>
                        <div className="repus-sort-dropdown">
                            <div className="repus-sort-options">
                                <div className="repus-sort-label">Sort by:</div>
                                <button
                                    className={`repus-sort-button ${sortBy === 'timestamp' ? 'active' : ''}`}
                                    onClick={() => handleSort("timestamp")}
                                >
                                    Date {getSortIcon("timestamp")}
                                </button>
                                <button
                                    className={`repus-sort-button ${sortBy === 'type' ? 'active' : ''}`}
                                    onClick={() => handleSort("type")}
                                >
                                    Type {getSortIcon("type")}
                                </button>
                                <button
                                    className={`repus-sort-button ${sortBy === 'reportedUser' ? 'active' : ''}`}
                                    onClick={() => handleSort("reportedUser")}
                                >
                                    Reported {getSortIcon("reportedUser")}
                                </button>
                                <button
                                    className={`repus-sort-button ${sortBy === 'reporter' ? 'active' : ''}`}
                                    onClick={() => handleSort("reporter")}
                                >
                                    Reporter {getSortIcon("reporter")}
                                </button>
                                <button
                                    className={`repus-sort-button ${sortBy === 'status' ? 'active' : ''}`}
                                    onClick={() => handleSort("status")}
                                >
                                    Status {getSortIcon("status")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="repus-loading-container">
                        <div className="repus-loading-animation">
                            <div className="repus-loading-circle"></div>
                            <div className="repus-loading-lines">
                                <div className="repus-loading-line"></div>
                                <div className="repus-loading-line"></div>
                                <div className="repus-loading-line"></div>
                            </div>
                        </div>
                        <div className="repus-loading-text">Loading reports...</div>
                    </div>
                ) : filteredReports.length > 0 ? (
                    <div className="repus-reports-grid">
                        {filteredReports.map((report) => (
                            <div
                                key={report.id}
                                className={`repus-report-card ${expandedReportId === report.id ? 'expanded' : ''}`}
                            >
                                <div className="repus-report-header" onClick={() => toggleReportExpansion(report.id)}>
                                    <div className="repus-report-summary">
                                        <div className="repus-report-status">
                                            <span className={`repus-status-badge ${getReportStatusClass(report.status || 'pending')}`}>
                                                {getReportStatusLabel(report.status || 'pending')}
                                            </span>
                                            <span className="repus-report-type-badge">
                                                {getReportTypeIcon(report.reportType)}
                                                {getReportTypeLabel(report.reportType)}
                                            </span>
                                        </div>
                                        <div className="repus-report-users">
                                            <div className="repus-reported-user">
                                                <div className="repus-user-avatar">
                                                    {report.reportedUserData.avatar ? (
                                                        <img
                                                            src={report.reportedUserData.avatar}
                                                            alt="User"
                                                        />
                                                    ) : (
                                                        <FaUserCircle />
                                                    )}
                                                </div>
                                                <div className="repus-user-info">
                                                    <span className="repus-user-name">
                                                        {report.reportedUserData.firstName || 'Unknown'} {report.reportedUserData.lastName || ''}
                                                    </span>
                                                    <span className="repus-user-label">
                                                        {report.reportType === "advert" ? "Advert Owner" : "Reported User"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="repus-reporter">
                                                <div className="repus-user-avatar">
                                                    {report.reportedByData.avatar ? (
                                                        <img
                                                            src={report.reportedByData.avatar}
                                                            alt="User"
                                                        />
                                                    ) : (
                                                        <FaUserCircle />
                                                    )}
                                                </div>
                                                <div className="repus-user-info">
                                                    <span className="repus-user-name">
                                                        {report.reportedByData.firstName || 'Unknown'} {report.reportedByData.lastName || ''}
                                                    </span>
                                                    <span className="repus-user-label">Reporter</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="repus-report-date">
                                            <FaCalendarAlt className="repus-date-icon" />
                                            <span>{formatDate(report.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className="repus-report-reason">
                                        <p>{report.reason || "No reason provided"}</p>
                                        {report.reportType === "advert" && report.advertData && (
                                            <p className="repus-advert-title">
                                                <FaDog /> Advert: "{report.advertData.title}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="repus-report-actions">
                                        {report.reportType !== "advert" && (
                                            <button
                                                className={`repus-action-button ${report.reportedUserData.blacklisted ? 'unblacklist' : 'blacklist'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleBlacklist(report.reportedUser, report.id, report.reportedUserData.blacklisted);
                                                }}
                                                title={report.reportedUserData.blacklisted ? "Unblacklist User" : "Blacklist User"}
                                            >
                                                {report.reportedUserData.blacklisted ? <FaThumbsUp /> : <FaThumbsDown />}
                                                <span>{report.reportedUserData.blacklisted ? "Unblacklist" : "Blacklist"}</span>
                                            </button>
                                        )}
                                        <button
                                            className="repus-action-button review"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsReviewed(report.id, report.reportType);
                                            }}
                                            disabled={report.status === "reviewed" || report.status === "blacklisted"}
                                            title="Mark as Reviewed"
                                        >
                                            <FaCheck />
                                            <span>Mark Reviewed</span>
                                        </button>
                                        <button
                                            className="repus-action-button view-profile"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/user/${report.reportedUser}`);
                                            }}
                                            title="View User Profile"
                                        >
                                            <FaUserCircle />
                                            <span>View Profile</span>
                                        </button>
                                        {report.reportType === "advert" && report.advertData && (
                                            <button
                                                className="repus-action-button view-advert"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`/advert-details/${report.advertId}`, '_blank');
                                                }}
                                                title="View Advert"
                                            >
                                                <FaEye />
                                                <span>View Advert</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="repus-expand-toggle">
                                        {expandedReportId === report.id ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </div>

                                {expandedReportId === report.id && (
                                    <div className="repus-report-details">
                                        <div className="repus-details-tabs">
                                            {report.reportType === "message" && (
                                                <button
                                                    className={`repus-tab ${activeTab[report.id] === 'messages' ? 'active' : ''}`}
                                                    onClick={() => changeReportTab(report.id, 'messages')}
                                                >
                                                    <FaComment /> Messages
                                                </button>
                                            )}
                                            {report.reportType === "advert" && (
                                                <button
                                                    className={`repus-tab ${activeTab[report.id] === 'advert' ? 'active' : ''}`}
                                                    onClick={() => changeReportTab(report.id, 'advert')}
                                                >
                                                    <FaClipboardList /> Advert Details
                                                </button>
                                            )}
                                            <button
                                                className={`repus-tab ${activeTab[report.id] === 'details' ? 'active' : ''}`}
                                                onClick={() => changeReportTab(report.id, 'details')}
                                            >
                                                <FaFlag /> Report Details
                                            </button>
                                            <button
                                                className={`repus-tab ${activeTab[report.id] === 'notes' ? 'active' : ''}`}
                                                onClick={() => changeReportTab(report.id, 'notes')}
                                            >
                                                <FaRegStickyNote /> Admin Notes
                                            </button>
                                            <button
                                                className={`repus-tab ${activeTab[report.id] === 'users' ? 'active' : ''}`}
                                                onClick={() => changeReportTab(report.id, 'users')}
                                            >
                                                <FaUsers /> User Details
                                            </button>
                                        </div>

                                        {/* Messages Tab Content (for message reports) */}
                                        {activeTab[report.id] === 'messages' && report.reportType === "message" && (
                                            <div className="repus-tab-content repus-messages-content">
                                                <h3 className="repus-section-title">
                                                    <FaComment /> Recent Messages
                                                </h3>
                                                <div className="repus-messages-container">
                                                    {(report.messageSnapshot || []).length > 0 ? (
                                                        report.messageSnapshot.map((msg, i) => (
                                                            <div
                                                                key={i}
                                                                className={`repus-message-item ${msg.from === report.reportedBy ? 'repus-reporter-message' : 'repus-reported-message'}`}
                                                            >
                                                                <div className="repus-message-sender">
                                                                    {msg.from === report.reportedBy ? (
                                                                        <>
                                                                            <FaFlag /> Reporter
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FaExclamationCircle /> Reported User
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="repus-message-bubble">
                                                                    <p className="repus-message-text">
                                                                        {msg.text || msg.filename || "[media content]"}
                                                                    </p>
                                                                    <div className="repus-message-time">
                                                                        {msg.timestamp ? formatDate(msg.timestamp) : "Unknown time"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="repus-no-data">
                                                            <FaExclamationTriangle />
                                                            <p>No message history available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Advert Details Tab (for advert reports) */}
                                        {activeTab[report.id] === 'advert' && report.reportType === "advert" && report.advertData && (
                                            <div className="repus-tab-content repus-advert-content">
                                                <h3 className="repus-section-title">
                                                    <FaClipboardList /> Reported Advert
                                                </h3>
                                                <div className="repus-advert-details">
                                                    <div className="repus-advert-image">
                                                        <img
                                                            src={report.advertData.images?.[0] || "https://placehold.co/300x200?text=No+Image"}
                                                            alt={report.advertData.title}
                                                        />
                                                    </div>
                                                    <div className="repus-advert-info">
                                                        <h4>{report.advertData.title}</h4>
                                                        <p className="repus-advert-breed">
                                                            <FaPaw /> {report.advertData.breedOrType || report.advertData.breed || "Unknown Breed"}
                                                        </p>
                                                        <p className="repus-advert-price">
                                                            Price: £{report.advertData.price || report.advertData.fee || "N/A"}
                                                        </p>
                                                        <p className="repus-advert-intent">
                                                            Type: {report.advertData.intent === 'sale' ? 'For Sale' : 'Stud Service'}
                                                        </p>
                                                        <div className="repus-advert-description">
                                                            <strong>Description:</strong>
                                                            <p>{report.advertData.description || "No description available"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="repus-advert-actions">
                                                    <button
                                                        className="repus-action-button delete"
                                                        onClick={() => handleDeleteAdvert(report.advertId, report.id)}
                                                        title="Delete Advert"
                                                    >
                                                        <FaBan />
                                                        <span>Delete Advert</span>
                                                    </button>
                                                    <button
                                                        className="repus-action-button view"
                                                        onClick={() => window.open(`/advert-details/${report.advertId}`, '_blank')}
                                                        title="View Full Advert"
                                                    >
                                                        <FaEye />
                                                        <span>View Full Advert</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Report Details Tab */}
                                        {activeTab[report.id] === 'details' && (
                                            <div className="repus-tab-content repus-details-content">
                                                <h3 className="repus-section-title">
                                                    <FaFlag /> Report Details
                                                </h3>
                                                <div className="repus-report-details-info">
                                                    <div className="repus-detail-row">
                                                        <strong>Report Type:</strong>
                                                        <span>{getReportTypeLabel(report.reportType)}</span>
                                                    </div>
                                                    <div className="repus-detail-row">
                                                        <strong>Reason:</strong>
                                                        <span>{report.reason || "No reason specified"}</span>
                                                    </div>
                                                    {report.comments && (
                                                        <div className="repus-detail-row">
                                                            <strong>Additional Comments:</strong>
                                                            <p>{report.comments}</p>
                                                        </div>
                                                    )}
                                                    <div className="repus-detail-row">
                                                        <strong>Reported On:</strong>
                                                        <span>{formatDate(report.timestamp)}</span>
                                                    </div>
                                                    <div className="repus-detail-row">
                                                        <strong>Status:</strong>
                                                        <span className={`repus-status-text ${report.status || 'pending'}`}>
                                                            {getReportStatusLabel(report.status || 'pending')}
                                                        </span>
                                                    </div>
                                                    {report.reviewedBy && (
                                                        <div className="repus-detail-row">
                                                            <strong>Reviewed By:</strong>
                                                            <span>{report.reviewedBy}</span>
                                                        </div>
                                                    )}
                                                    {report.reviewedAt && (
                                                        <div className="repus-detail-row">
                                                            <strong>Reviewed At:</strong>
                                                            <span>{formatDate(report.reviewedAt)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Admin Notes Tab Content */}
                                        {activeTab[report.id] === 'notes' && (
                                            <div className="repus-tab-content repus-notes-content">
                                                <h3 className="repus-section-title">
                                                    <FaRegStickyNote /> Admin Notes
                                                </h3>
                                                <div className="repus-notes-editor">
                                                    <textarea
                                                        className="repus-notes-textarea"
                                                        placeholder="Add notes about this report..."
                                                        value={adminNotes[report.id] || ""}
                                                        onChange={(e) =>
                                                            setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))
                                                        }
                                                    ></textarea>
                                                    <button
                                                        className="repus-save-notes-button"
                                                        onClick={() => handleSaveNotes(report.id, report.reportType)}
                                                        disabled={!adminNotes[report.id]?.trim()}
                                                    >
                                                        <FaCheck /> Save Note
                                                    </button>
                                                </div>
                                                <div className="repus-previous-notes">
                                                    <h4 className="repus-subsection-title">Previous Notes</h4>
                                                    {(report.notes || []).length === 0 ? (
                                                        <div className="repus-no-data">
                                                            <FaExclamationTriangle />
                                                            <p>No previous notes</p>
                                                        </div>
                                                    ) : (
                                                        <div className="repus-notes-list">
                                                            {report.notes
                                                                .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                                                                .map((note, i) => (
                                                                    <div key={note.id || i} className="repus-note-item">
                                                                        <div className="repus-note-header">
                                                                            <span className="repus-note-author">{note.createdByName || "Admin"}</span>
                                                                            <span className="repus-note-date">{note.createdAt?.toDate?.().toLocaleString() || ""}</span>
                                                                        </div>
                                                                        <p className="repus-note-text">{note.text}</p>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* User Details Tab Content */}
                                        {activeTab[report.id] === 'users' && (
                                            <div className="repus-tab-content repus-users-content">
                                                <div className="repus-user-profiles">
                                                    {/* Reported User Profile */}
                                                    <div className="repus-user-profile repus-reported-user-profile">
                                                        <div className="repus-profile-header">
                                                            <h3 className="repus-profile-title">
                                                                <FaExclamationCircle />
                                                                {report.reportType === "advert" ? "Advert Owner" : "Reported User"}
                                                            </h3>
                                                        </div>
                                                        <div className="repus-profile-content">
                                                            <div className="repus-profile-avatar">
                                                                {report.reportedUserData.avatar ? (
                                                                    <img
                                                                        src={report.reportedUserData.avatar}
                                                                        alt="Reported User"
                                                                    />
                                                                ) : (
                                                                    <FaUserCircle className="repus-avatar-placeholder" />
                                                                )}
                                                            </div>
                                                            <div className="repus-profile-info">
                                                                <h4 className="repus-profile-name">
                                                                    {report.reportedUserData.firstName || 'Unknown'} {report.reportedUserData.lastName || ''}
                                                                </h4>
                                                                <p className="repus-profile-id">ID: {report.reportedUser}</p>
                                                                <p className="repus-profile-email">
                                                                    <FaEnvelope /> {report.reportedUserData.email || 'No email provided'}
                                                                </p>
                                                                <div className="repus-profile-meta">
                                                                    <div className="repus-meta-item">
                                                                        <strong>Account Status:</strong> {report.reportedUserData.status || 'Active'}
                                                                    </div>
                                                                    {report.reportedUserData.blacklisted && (
                                                                        <div className="repus-meta-item blacklisted">
                                                                            <strong>Blacklisted:</strong> Yes
                                                                        </div>
                                                                    )}
                                                                    <div className="repus-meta-item">
                                                                        <strong>Join Date:</strong> {report.reportedUserData.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="repus-profile-actions">
                                                            <button
                                                                className="repus-profile-action-button view"
                                                                onClick={() => navigate(`/admin/user/${report.reportedUser}`)}
                                                            >
                                                                <FaEye /> Full Profile
                                                            </button>
                                                            {report.reportType !== "advert" && (
                                                                <button
                                                                    className={`repus-profile-action-button ${report.reportedUserData.blacklisted ? "unblacklist" : "blacklist"}`}
                                                                    onClick={() => handleToggleBlacklist(report.reportedUser, report.id, report.reportedUserData.blacklisted)}
                                                                >
                                                                    <FaUserSlash /> {report.reportedUserData.blacklisted ? "Unblacklist" : "Blacklist"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Reporter User Profile */}
                                                    <div className="repus-user-profile repus-reporter-user-profile">
                                                        <div className="repus-profile-header">
                                                            <h3 className="repus-profile-title">
                                                                <FaFlag /> Reporter
                                                            </h3>
                                                        </div>
                                                        <div className="repus-profile-content">
                                                            <div className="repus-profile-avatar">
                                                                {report.reportedByData.avatar ? (
                                                                    <img
                                                                        src={report.reportedByData.avatar}
                                                                        alt="Reporter"
                                                                    />
                                                                ) : (
                                                                    <FaUserCircle className="repus-avatar-placeholder" />
                                                                )}
                                                            </div>
                                                            <div className="repus-profile-info">
                                                                <h4 className="repus-profile-name">
                                                                    {report.reportedByData.firstName || 'Unknown'} {report.reportedByData.lastName || ''}
                                                                </h4>
                                                                <p className="repus-profile-id">ID: {report.reportedBy}</p>
                                                                <p className="repus-profile-email">
                                                                    <FaEnvelope /> {report.reportedByData.email || report.reporterEmail || 'No email provided'}
                                                                </p>
                                                                <div className="repus-profile-meta">
                                                                    <div className="repus-meta-item">
                                                                        <strong>Account Status:</strong> {report.reportedByData.status || 'Active'}
                                                                    </div>
                                                                    <div className="repus-meta-item">
                                                                        <strong>Join Date:</strong> {report.reportedByData.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="repus-profile-actions">
                                                            <button
                                                                className="repus-profile-action-button view"
                                                                onClick={() => navigate(`/admin/user/${report.reportedBy}`)}
                                                            >
                                                                <FaEye /> Full Profile
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="repus-empty-state">
                        <div className="repus-empty-state-icon">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="repus-empty-state-title">No Reports Found</h3>
                        <p className="repus-empty-state-message">
                            {searchTerm || selectedFilter !== 'all' || reportTypeFilter !== 'all'
                                ? "No reports match your current search or filters. Try different criteria."
                                : "There are no reports in the system at this time."}
                        </p>
                        {(searchTerm || selectedFilter !== 'all' || reportTypeFilter !== 'all') && (
                            <button
                                className="repus-empty-state-button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedFilter('all');
                                    setReportTypeFilter('all');
                                }}
                            >
                                <FaTimes /> Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportedUsers;