import React, { useState, useEffect } from 'react';
import { query, doc, updateDoc, arrayUnion, collection, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useLoginModal } from '../context/LoginContext';
import { useAuth } from '../firebase/firebaseAuth';
import { useLocation } from 'react-router-dom';
import { storage } from "../firebase/firebase";
import { db } from "../firebase/firebase";
import './HelpSupport.css';
import {
    Search, ChevronRight, ChevronDown, MessageCircle, Mail, Phone,
    Send, Clock, AlertCircle, FileText, User, PenLine, Paperclip,
    Tag, BarChart4, ListTodo, LifeBuoy, Monitor, Smartphone,
    Database, Globe, ArrowUpCircle, LayoutGrid, Users, Building,
    Flag, Briefcase, Star, CreditCard, Shield, MessageSquare, RefreshCw, CheckCircle, XCircle, Loader,
    Calendar, Eye, Inbox, Filter, HelpCircle, BookOpen, Headphones
} from 'lucide-react';

const HelpSupport = () => {
    const { currentUser, userData, loading } = useAuth();
    const { openLogin } = useLoginModal();
    const [userTickets, setUserTickets] = useState([]);

    console.log('HelpSupport - Auth state:', { currentUser, loading });

    // State declarations
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'faq'; // default to 'faq'

    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [ticketNumber, setTicketNumber] = useState(null);
    const [replyInputs, setReplyInputs] = useState({});  // key: ticketId, value: current reply text
    const [expandedTicketIds, setExpandedTicketIds] = useState([]); // for toggling ticket detail/reply area

    // Ticket form state - Initialize with user data if available
    const [ticketData, setTicketData] = useState({
        name: userData?.displayName || '',
        email: currentUser?.email || '',
        phone: currentUser?.phoneNumber || '',
        subject: '',
        ticketType: 'technical',
        priority: 'medium',
        message: '',
        attachments: []
    });

    // Ticket filters
    const [ticketFilters, setTicketFilters] = useState({
        status: 'all',
        priority: 'all',
        type: 'all'
    });

    const [openTickets, setOpenTickets] = useState([]);


    const handleReplyInputChange = (ticketId, value) => {
        setReplyInputs(prev => ({ ...prev, [ticketId]: value }));
    };

    const toggleTicketExpand = (ticketId) => {
        setExpandedTicketIds(prev =>
            prev.includes(ticketId)
                ? prev.filter(id => id !== ticketId)
                : [...prev, ticketId]
        );
    };

    const handleSendReply = async (ticket) => {
        const messageText = replyInputs[ticket.id];
        if (!messageText?.trim()) return;

        // Get user's display name
        const senderName = userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : currentUser?.displayName || 'User';

        const newMessage = {
            id: `msg-${Date.now()}`,
            sender: senderName,
            senderType: 'user', // Changed from 'admin' to 'user'
            message: messageText.trim(),
            timestamp: new Date().toISOString(),
            attachments: []
        };

        try {
            const ticketRef = doc(db, "supportTickets", ticket.id);
            await updateDoc(ticketRef, {
                messages: arrayUnion(newMessage),
                responses: (ticket.responses || 0) + 1,
                lastUpdated: serverTimestamp(),
                status: 'pending' // Optionally update status when user replies
            });
            // Clear input on success
            setReplyInputs(prev => ({ ...prev, [ticket.id]: '' }));
        } catch (err) {
            console.error("Failed to send reply:", err);
        }
    };



    // Update ticket data when user changes
    useEffect(() => {
        if (currentUser) {
            const fullName = userData?.firstName && userData?.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : currentUser.displayName || '';
            setTicketData(prev => ({
                ...prev,
                name: fullName,
                email: currentUser.email || '',
                phone: userData?.phone || currentUser.phoneNumber || ''
            }));
        }
    }, [currentUser, userData]);

    useEffect(() => {
        if (!currentUser) {
            setUserTickets([]);
            return;
        }

        const ticketsQuery = query(
            collection(db, "supportTickets"),
            where("userId", "==", currentUser.uid)
        );

        // Real-time listener
        const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserTickets(tickets);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [currentUser]);

    // Loading state
    if (loading) {
        return (
            <div className="hp-container">
                <div className="hp-loading">
                    <Loader className="hp-spinner" />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // FAQ Data
    const faqs = [
        {
            id: 'listings',
            title: 'Listings & Adverts',
            icon: <BookOpen size={20} />,
            color: 'hp-cat-green',
            questions: [
                {
                    id: 'listings-1',
                    question: 'How long does it take for my stud advert to go live?',
                    answer: 'All listings are manually reviewed by our admin team. If your advert meets our guidelines, it’s usually approved within 12 to 24 hours.'
                },
                {
                    id: 'listings-2',
                    question: 'Can I post multiple adverts?',
                    answer: `Yes — you can create separate adverts for each stud dog or litter you’re offering.

For **litters and dogs for sale**, there’s a cap of **3 listings every 12 months** unless you’re a licensed breeder. Stud adverts are not restricted, and you can list as many as you like.`
                },
                {
                    id: 'listings-3',
                    question: 'What types of adverts can I create?',
                    answer: 'You can list stud dogs, litters of puppies, or individual dogs for rehoming. Each type has its own category and requirements.'
                },
                {
                    id: 'listings-4',
                    question: 'Can I update or remove an advert later?',
                    answer: `Yes — head to your **My Adverts** page. Click the **edit icon** to make changes or the **bin icon** to delete the listing.`
                },
                {
                    id: 'listings-5',
                    question: 'How do I mark an advert as sold or no longer available?',
                    answer: 'On your My Adverts page, click the “Mark as Sold” button (tick icon) to move it to your Sold listings tab.'
                }
            ]
        },
        {
            id: 'messaging',
            title: 'Messaging & Communication',
            icon: <MessageSquare size={20} />,
            color: 'hp-cat-blue',
            questions: [
                {
                    id: 'msg-1',
                    question: 'How do I contact the advert owner?',
                    answer: 'Click the “Message Owner” button on the advert page to open a private chat with the breeder.'
                },
                {
                    id: 'msg-2',
                    question: 'Do I need to register to send messages?',
                    answer: 'Yes — messaging is only available to registered users to help reduce spam and maintain accountability.'
                },
                {
                    id: 'msg-3',
                    question: 'What should I do if someone sends offensive messages?',
                    answer: 'Click the “Report” icon in the conversation. Our moderation team will investigate any violations of our community rules.'
                },
                {
                    id: 'msg-4',
                    question: 'Can I block someone from messaging me?',
                    answer: 'Yes — use the block icon in the conversation to prevent further contact.'
                },
                {
                    id: 'msg-5',
                    question: 'Where can I see my past conversations?',
                    answer: 'Your full chat history is available under the Messages section in the main menu.'
                }
            ]
        },
        {
            id: 'trust',
            title: 'Reviews & Trust',
            icon: <Star size={20} />,
            color: 'hp-cat-yellow',
            questions: [
                {
                    id: 'trust-1',
                    question: 'Who can leave a review?',
                    answer: 'Only users who have interacted with your listing (such as messaging or booking a stud) are allowed to leave a review.'
                },
                {
                    id: 'trust-2',
                    question: 'Are reviews moderated?',
                    answer: 'Yes — all reviews go through an approval process before appearing publicly.'
                },
                {
                    id: 'trust-3',
                    question: 'What do the star ratings mean?',
                    answer: 'Ratings reflect communication, professionalism, and overall experience. We average the stars to create a public score.'
                },
                {
                    id: 'trust-4',
                    question: 'Can I reply to a review?',
                    answer: 'Yes — you can leave a public response to any reviews you receive. We recommend keeping replies polite and constructive.'
                },
                {
                    id: 'trust-5',
                    question: 'How do adverts become “Verified”?',
                    answer: 'Verified listings are manually checked by our team and may include added proof like ID or a breeder licence.'
                }
            ]
        },
        {
            id: 'security',
            title: 'Security & Reporting',
            icon: <Shield size={20} />,
            color: 'hp-cat-red',
            questions: [
                {
                    id: 'sec-1',
                    question: 'How do I report a suspicious advert?',
                    answer: 'Click the “Report Listing” button found on each advert. Provide as much detail as you can — we’ll look into it promptly.'
                },
                {
                    id: 'sec-2',
                    question: 'Can I report a user directly?',
                    answer: 'Yes — go to their profile or an existing chat and click the “Report User” option.'
                },
                {
                    id: 'sec-3',
                    question: 'What do you do to prevent scams?',
                    answer: 'We manually review listings, monitor messaging for abusive content, and offer breeder verification to improve trust.'
                },
                {
                    id: 'sec-4',
                    question: 'Are payments made through the site?',
                    answer: 'No — we don’t handle payments. You should always arrange payment in person or use safe, traceable methods.'
                },
                {
                    id: 'sec-5',
                    question: 'Is breeder verification available?',
                    answer: 'Yes — breeders can apply to be verified by submitting ID, licence documents, and proof of breeding history.'
                }
            ]
        },
        {
            id: 'account',
            title: 'Account & Profile',
            icon: <User size={20} />,
            color: 'hp-cat-grey',
            questions: [
                {
                    id: 'acc-1',
                    question: 'Can I update my account details?',
                    answer: 'Yes — go to your profile settings to change your email, phone number, or password.'
                },
                {
                    id: 'acc-2',
                    question: 'What does my public profile show?',
                    answer: 'Your name, profile picture, general location, and your active adverts are visible to other users.'
                },
                {
                    id: 'acc-3',
                    question: 'How do I delete my account?',
                    answer: 'You can request deletion via Settings > Account. This will remove your profile and all associated data.'
                },
                {
                    id: 'acc-4',
                    question: 'How do I change notification settings?',
                    answer: 'Head to your account preferences to turn email or app notifications on or off.'
                },
                {
                    id: 'acc-5',
                    question: 'Can I hide my phone number?',
                    answer: 'Yes — during advert creation or editing, you can choose to show or hide your phone number.'
                }
            ]
        },

    ];



    // Filter questions based on search
    const filteredQuestions = searchQuery
        ? faqs.flatMap(category =>
            category.questions.filter(q =>
                q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(q => ({...q, categoryTitle: category.title, categoryIcon: category.icon, categoryColor: category.color}))
        )
        : [];

    // Filter tickets
    const filteredTickets = userTickets.filter(ticket => {
        const statusMatch = ticketFilters.status === 'all' || ticket.status === ticketFilters.status;
        const priorityMatch = ticketFilters.priority === 'all' || ticket.priority === ticketFilters.priority;
        const typeMatch = ticketFilters.type === 'all' || ticket.ticketType === ticketFilters.type;
        return statusMatch && priorityMatch && typeMatch;
    });


    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTicketData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);

        if (files.length !== validFiles.length) {
            alert('Some files exceed the 10MB limit.');
        }

        setTicketData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...validFiles]
        }));
    };

    const removeAttachment = (index) => {
        setTicketData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ticketData.subject.trim() || !ticketData.message.trim()) {
            setSubmitStatus('error');
            return;
        }

        try {
            // Upload attachments to Firebase Storage and get URLs
            const uploadedUrls = [];

            for (const file of ticketData.attachments) {
                const fileRef = ref(storage, `supportTickets/${currentUser.uid}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(fileRef, file);
                const url = await getDownloadURL(snapshot.ref);
                uploadedUrls.push(url);
            }

            const newTicketNumber = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

            const ticketToSave = {
                ticketNumber: newTicketNumber,
                userId: currentUser.uid,
                name: userData?.firstName && userData?.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : currentUser.displayName || '',
                email: currentUser.email,
                phone: userData?.phone || '',
                subject: ticketData.subject,
                ticketType: ticketData.ticketType,
                priority: ticketData.priority,
                message: ticketData.message,
                attachments: uploadedUrls,
                status: 'open',
                responses: 0,
                messages: [], // Initialize empty messages array
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
            };

            await addDoc(collection(db, "supportTickets"), ticketToSave);

            setTicketNumber(newTicketNumber);
            setSubmitStatus('success');

            // Reset form after delay
            setTimeout(() => {
                setTicketData(prev => ({
                    ...prev,
                    subject: '',
                    message: '',
                    attachments: [],
                    ticketType: 'technical',
                    priority: 'medium'
                }));
                setSubmitStatus(null);
            }, 3000);

        } catch (error) {
            console.error("Error submitting ticket:", error);
            setSubmitStatus('error');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';

        // If it's a Firestore Timestamp object, convert to JS Date
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    // Loading state
    if (loading) {
        return (
            <div className="hp-container">
                <div className="hp-loading">
                    <Loader className="hp-spinner" />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hp-container">
            {/* Header */}
            <header className="hp-header">
                <div className="hp-header-content">
                    <h1 className="hp-header-title">Help & Support Center</h1>
                    <p className="hp-header-subtitle">
                        Find answers, submit tickets, and get the help you need
                    </p>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="hp-tabs">
                <div className="hp-tabs-inner">
                    <ul className="hp-tabs-list">
                        <li className="hp-tab-item">
                            <button
                                className={`hp-tab-button ${activeTab === 'faq' ? 'hp-tab-active' : ''}`}
                                onClick={() => setActiveTab('faq')}
                            >
                                <HelpCircle size={18} />
                                <span>Knowledge Base</span>
                            </button>
                        </li>
                        <li className="hp-tab-item">
                            <button
                                className={`hp-tab-button ${activeTab === 'ticket' ? 'hp-tab-active' : ''}`}
                                onClick={() => setActiveTab('ticket')}
                            >
                                <Send size={18} />
                                <span>Submit Ticket</span>
                            </button>
                        </li>
                        <li className="hp-tab-item">
                            <button
                                className={`hp-tab-button ${activeTab === 'tickets' ? 'hp-tab-active' : ''}`}
                                onClick={() => setActiveTab('tickets')}
                            >
                                <Inbox size={18} />
                                <span>My Tickets</span>
                                {openTickets.length > 0 && (
                                    <span className="hp-tab-badge">{openTickets.length}</span>
                                )}
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Main Content */}
            <main className="hp-content">
                {/* FAQ Tab */}
                {activeTab === 'faq' && (
                    <div className="hp-faq-section">
                        {/* Search Bar */}
                        <div className="hp-search-container">
                            <div className="hp-search-wrapper">
                                <Search className="hp-search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for help articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="hp-search-input"
                                />
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchQuery && filteredQuestions.length > 0 ? (
                            <div className="hp-search-results">
                                <h2 className="hp-results-header">
                                    Search Results ({filteredQuestions.length})
                                </h2>
                                {filteredQuestions.map((q) => (
                                    <div key={q.id} className="hp-result-item">
                                        <div className={`hp-result-category ${q.categoryColor}`}>
                                            {q.categoryIcon}
                                            <span>{q.categoryTitle}</span>
                                        </div>
                                        <div
                                            className="hp-question-header"
                                            onClick={() => setActiveQuestion(activeQuestion === q.id ? null : q.id)}
                                        >
                                            <h3 className="hp-question-text">{q.question}</h3>
                                            <ChevronRight
                                                size={18}
                                                className={`hp-faq-chevron ${activeQuestion === q.id ? 'hp-rotated' : ''}`}
                                            />
                                        </div>
                                        {activeQuestion === q.id && (
                                            <div className="hp-answer">{q.answer}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery && filteredQuestions.length === 0 ? (
                            <div className="hp-no-results">
                                <AlertCircle size={48} className="hp-no-results-icon" />
                                <h3 className="hp-no-results-title">No results found</h3>
                                <p className="hp-no-results-text">
                                    We couldn't find any articles matching "{searchQuery}"
                                </p>
                                <button
                                    className="hp-primary-button"
                                    onClick={() => setActiveTab('ticket')}
                                >
                                    <Send size={18} />
                                    Submit a Support Ticket
                                </button>
                            </div>
                        ) : (
                            <>

                                {/* FAQ Categories */}
                                <div className="hp-faq-grid">
                                    {faqs.map((category) => (
                                        <div
                                            key={category.id}
                                            className={`hp-faq-category ${expandedCategory === category.id ? 'hp-faq-expanded' : ''}`}
                                        >
                                            <div
                                                className="hp-faq-header"
                                                onClick={() => setExpandedCategory(
                                                    expandedCategory === category.id ? null : category.id
                                                )}
                                            >
                                                <div className="hp-faq-header-left">
                                                    <div className={`hp-faq-icon ${category.color}`}>
                                                        {category.icon}
                                                    </div>
                                                    <h3 className="hp-faq-title">
                                                        {category.title}
                                                        <span className="hp-faq-count">
                                                            {category.questions.length}
                                                        </span>
                                                    </h3>
                                                </div>
                                                <ChevronRight size={20} className="hp-faq-chevron" />
                                            </div>

                                            {expandedCategory === category.id && (
                                                <div className="hp-faq-content">
                                                    {category.questions.map((q) => (
                                                        <div key={q.id} className="hp-question">
                                                            <div
                                                                className="hp-question-header"
                                                                onClick={() => setActiveQuestion(
                                                                    activeQuestion === q.id ? null : q.id
                                                                )}
                                                            >
                                                                <h4 className="hp-question-text">{q.question}</h4>
                                                                <ChevronRight
                                                                    size={18}
                                                                    className={`hp-faq-chevron ${activeQuestion === q.id ? 'hp-rotated' : ''}`}
                                                                />
                                                            </div>
                                                            {activeQuestion === q.id && (
                                                                <div className="hp-answer">{q.answer}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Submit Ticket Tab */}
                {activeTab === 'ticket' && (
                    <div className="hp-ticket-form">
                        {!currentUser ? (
                            <div className="hp-login-required">
                                <User size={48} />
                                <h3>Login Required</h3>
                                <p>You must be logged in to submit a support ticket.</p>
                                <button onClick={openLogin} className="hp-primary-button">
                                    Log In / Register
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Success Message */}
                                {submitStatus === 'success' && (
                                    <div className="hp-alert hp-alert-success">
                                        <CheckCircle size={24} />
                                        <div className="hp-alert-content">
                                            <h3 className="hp-alert-title">Ticket Submitted Successfully!</h3>
                                            <p className="hp-alert-text">
                                                Your ticket number is <strong>{ticketNumber}</strong>.
                                                We'll respond within 24 hours.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {submitStatus === 'error' && (
                                    <div className="hp-alert hp-alert-error">
                                        <XCircle size={24} />
                                        <div className="hp-alert-content">
                                            <h3 className="hp-alert-title">Please check your submission</h3>
                                            <p className="hp-alert-text">
                                                Make sure all required fields are filled correctly.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Contact Information (Read-only for logged in users) */}

                                    {/* Contact Information (Read-only for logged in users) */}
                                    <div className="hp-form-section">
                                        <h2 className="hp-form-title">
                                            <User size={20} />
                                            Contact Information
                                        </h2>
                                        <div className="hp-contact-info-grid">
                                            <div className="hp-contact-info-item">
                                                <div className="hp-contact-icon">
                                                    <User size={18} />
                                                </div>
                                                <div className="hp-contact-details">
                                                    <span className="hp-contact-label">Name</span>
                                                    <span className="hp-contact-value">
                    {(userData?.firstName && userData?.lastName)
                        ? `${userData.firstName} ${userData.lastName}`
                        : currentUser?.displayName || 'Not provided'}
                </span>
                                                </div>
                                            </div>

                                            <div className="hp-contact-info-item">
                                                <div className="hp-contact-icon">
                                                    <Mail size={18} />
                                                </div>
                                                <div className="hp-contact-details">
                                                    <span className="hp-contact-label">Email</span>
                                                    <span className="hp-contact-value">
                    {currentUser?.email || 'Not provided'}
                </span>
                                                </div>
                                            </div>

                                            <div className="hp-contact-info-item">
                                                <div className="hp-contact-icon">
                                                    <Phone size={18} />
                                                </div>
                                                <div className="hp-contact-details">
                                                    <span className="hp-contact-label">Phone</span>
                                                    <span className="hp-contact-value">
                    {userData?.phone || currentUser?.phoneNumber || 'Not provided'}
                </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ticket Details */}
                                    <div className="hp-form-section">
                                        <h2 className="hp-form-title">
                                            <FileText size={20} />
                                            Ticket Details
                                        </h2>

                                        <div className="hp-form-group">
                                            <label className="hp-form-label">
                                                <PenLine size={14} />
                                                Subject *
                                            </label>
                                            <input
                                                type="text"
                                                name="subject"
                                                value={ticketData.subject}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Brief description of your issue"
                                                className="hp-form-input"
                                            />
                                        </div>

                                        <div className="hp-form-grid">
                                            <div className="hp-form-group">
                                                <label className="hp-form-label">
                                                    <Tag size={14} />
                                                    Issue Type
                                                </label>
                                                <select
                                                    name="ticketType"
                                                    value={ticketData.ticketType}
                                                    onChange={handleInputChange}
                                                    className="hp-form-select"
                                                >
                                                    <option value="account-registration">Account Registration Issues</option>
                                                    <option value="login-problems">Login Problems</option>
                                                    <option value="advert-creation">Creating or Editing an Advert</option>
                                                    <option value="image-upload">Image Upload Issues</option>
                                                    <option value="advert-approval">Advert Approval Status</option>
                                                    <option value="advert-missing">Missing Advert After Approval</option>
                                                    <option value="my-adverts">Issues Viewing 'My Adverts'</option>
                                                    <option value="account-deletion">Account Deletion / GDPR Requests</option>
                                                    <option value="billing">Payment & Fees</option>
                                                    <option value="technical">Technical Support</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="hp-form-group">
                                            <label className="hp-form-label">
                                                <MessageCircle size={14} />
                                                Describe Your Issue *
                                            </label>
                                            <textarea
                                                name="message"
                                                value={ticketData.message}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Please provide as much detail as possible..."
                                                className="hp-form-textarea"
                                            />
                                        </div>

                                        <div className="hp-form-group">
                                            <label className="hp-form-label">
                                                <Paperclip size={14} />
                                                Attachments
                                            </label>
                                            <div className="hp-upload-area">
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="hp-file-input"
                                                    hidden
                                                />
                                                <label htmlFor="file-upload" className="hp-upload-label">
                                                    <Paperclip className="hp-upload-icon" size={32} />
                                                    <p className="hp-upload-text">
                                                        <span className="hp-upload-link">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="hp-upload-hint">PNG, JPG, PDF up to 10MB</p>
                                                </label>
                                            </div>

                                            {ticketData.attachments.length > 0 && (
                                                <div className="hp-attachments">
                                                    {ticketData.attachments.map((file, index) => (
                                                        <div key={index} className="hp-attachment-item">
                                                            <div className="hp-attachment-info">
                                                                <FileText size={16} />
                                                                <span className="hp-attachment-name">{file.name}</span>
                                                                <span className="hp-attachment-size">
                                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachment(index)}
                                                                className="hp-attachment-remove"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hp-submit-section">
                                        <button type="submit" className="hp-submit-button">
                                            <Send size={18} />
                                            Submit Ticket
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                )}

                {/* My Tickets Tab */}
                {activeTab === 'tickets' && (
                    <div className="hp-tickets-section">
                        {!currentUser ? (
                            <div className="hp-login-required">
                                <User size={48} />
                                <h3>Login Required</h3>
                                <p>You must be logged in to view your support tickets.</p>
                                <button onClick={openLogin} className="hp-primary-button">
                                    Log In / Register
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Filters */}


                                {/* Tickets List */}
                                {filteredTickets.length === 0 ? (
                                    <div className="hp-no-tickets">
                                        <Inbox size={48} className="hp-no-tickets-icon" />
                                        <h3 className="hp-no-tickets-title">No tickets found</h3>
                                        <p className="hp-no-tickets-text">
                                            You haven't submitted any tickets yet.
                                        </p>
                                        <button
                                            className="hp-primary-button"
                                            onClick={() => setActiveTab('ticket')}
                                        >
                                            <Send size={18} />
                                            Create Your First Ticket
                                        </button>
                                    </div>
                                ) : (
                                    <div className="hp-tickets-list">
                                        <div className="hp-tickets-header">
                                            <div className="hp-th hp-th-id">Ticket ID</div>
                                            <div className="hp-th hp-th-subject">Subject</div>
                                            <div className="hp-th hp-th-status">Status</div>
                                            <div className="hp-th hp-th-priority">Priority</div>
                                            <div className="hp-th hp-th-date">Created</div>
                                            <div className="hp-th hp-th-updated">Last Updated</div>
                                        </div>

                                        {filteredTickets.map((ticket) => {
                                            const allMessages = ticket.messages || [];

                                            return (
                                                <div key={ticket.id} className="hp-ticket-item">
                                                    <div className="hp-ticket-row">
                                                        {/* Basic row info */}
                                                        <div className="hp-td hp-td-id">{ticket.ticketNumber || ticket.id}</div>
                                                        <div className="hp-td hp-td-subject">{ticket.subject}</div>
                                                        <div className="hp-td hp-td-status">
                                                            <span className={`hp-status hp-status-${ticket.status}`}>{ticket.status}</span>
                                                        </div>
                                                        <div className="hp-td hp-td-priority">
                                                            <span className={`hp-priority hp-priority-${ticket.priority}`}>{ticket.priority}</span>
                                                        </div>
                                                        <div className="hp-td hp-td-date">{formatDate(ticket.createdAt)}</div>
                                                        <div className="hp-td hp-td-updated">{formatDate(ticket.lastUpdated)}</div>

                                                        {/* Toggle button to show replies and reply box */}
                                                        <div className="hp-td hp-td-actions">
                                                            <button onClick={() => toggleTicketExpand(ticket.id)} className="hp-toggle-button">
                                                                {expandedTicketIds.includes(ticket.id) ? 'Hide Conversation' : 'View Conversation'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded conversation & reply box */}
                                                    {expandedTicketIds.includes(ticket.id) && (
                                                        <div className="hp-ticket-conversation">
                                                            <h4>Ticket Conversation</h4>

                                                            {/* Show initial ticket message */}
                                                            <div className="hp-message hp-message-user">
                                                                <div className="hp-message-header">
                                                                    <strong>You</strong> - <em>{formatDate(ticket.createdAt)}</em>
                                                                </div>
                                                                <p>{ticket.message}</p>
                                                            </div>

                                                            {/* Show all messages in chronological order */}
                                                            {allMessages.length > 0 && allMessages.map(message => (
                                                                <div
                                                                    key={message.id}
                                                                    className={`hp-message hp-message-${message.senderType}`}
                                                                >
                                                                    <div className="hp-message-header">
                                                                        <strong>
                                                                            {message.senderType === 'admin' ? 'Support Team' : message.sender}
                                                                        </strong> - <em>{formatDate(message.timestamp)}</em>
                                                                    </div>
                                                                    <p>{message.message}</p>
                                                                </div>
                                                            ))}

                                                            {/* Reply box - only show if ticket is not closed */}
                                                            {ticket.status !== 'closed' && (
                                                                <div className="hp-reply-section">
                                                                    <textarea
                                                                        placeholder="Write your reply here..."
                                                                        value={replyInputs[ticket.id] || ''}
                                                                        onChange={(e) => handleReplyInputChange(ticket.id, e.target.value)}
                                                                        rows={3}
                                                                        className="hp-reply-textarea"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleSendReply(ticket)}
                                                                        disabled={!replyInputs[ticket.id]?.trim()}
                                                                        className="hp-reply-send-button"
                                                                    >
                                                                        Send Reply
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {ticket.status === 'closed' && (
                                                                <div className="hp-ticket-closed-notice">
                                                                    This ticket is closed and cannot receive new replies.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HelpSupport;