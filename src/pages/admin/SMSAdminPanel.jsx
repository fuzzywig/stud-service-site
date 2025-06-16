import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminSidebar from '../../components/AdminSidebar';
import twilioService from '/src/services/twilioService';
import './SMSAdminPanel.css';

const SMSAdminPanel = () => {
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [sendMode, setSendMode] = useState('now');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [sentMessages, setSentMessages] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sending, setSending] = useState(false);
    const [twilioBalance, setTwilioBalance] = useState(null);

    // Fetch customers from Firebase
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                setError(null);

                const usersQuery = query(
                    collection(db, 'users'),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(usersQuery);
                const customerData = [];

                querySnapshot.forEach((doc) => {
                    const userData = doc.data();

                    if (userData.phone && userData.smsOptIn !== false) {
                        customerData.push({
                            id: doc.id,
                            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.displayName || 'Unknown User',
                            phone: userData.phone,
                            email: userData.email || '',
                            lastActive: userData.lastLoginAt || userData.createdAt || 'Never',
                            status: getCustomerStatus(userData),
                            createdAt: userData.createdAt,
                            smsOptIn: userData.smsOptIn !== false,
                            totalAdverts: userData.totalAdverts || 0
                        });
                    }
                });

                setCustomers(customerData);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError('Failed to load customers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        const fetchTwilioBalance = async () => {
            try {
                const balance = await twilioService.getAccountBalance();
                setTwilioBalance(balance);
                console.log('Twilio balance loaded:', balance);
            } catch (error) {
                console.error('Failed to load Twilio balance:', error);
                setTwilioBalance({ success: false, error: error.message });
            }
        };

        fetchCustomers();
        fetchTwilioBalance();
    }, []);

    const getCustomerStatus = (userData) => {
        if (!userData.lastLoginAt) return 'inactive';

        const lastLogin = new Date(userData.lastLoginAt.toDate ? userData.lastLoginAt.toDate() : userData.lastLoginAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return lastLogin > thirtyDaysAgo ? 'active' : 'inactive';
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        if (date.toDate) {
            return date.toDate().toLocaleDateString();
        }
        return new Date(date).toLocaleDateString();
    };

    const filteredCustomers = customers.filter(customer => {
        if (filterStatus === 'all') return true;
        return customer.status === filterStatus;
    });

    const messageTemplates = {
        'new_advert': 'Hi {name}! Ready to reach more customers? Create your next advert now: {link}',
        'reactivation': 'Hi {name}! We miss you. Come back and post a new advert to reconnect with customers: {link}',
        'promotion': 'Hi {name}! Special offer: Get 20% off your next advert. Limited time only: {link}',
        'reminder': 'Hi {name}! Your current advert expires soon. Renew or create a new one: {link}'
    };

    const handleCustomerSelect = (customerId) => {
        setSelectedCustomers(prev =>
            prev.includes(customerId)
                ? prev.filter(id => id !== customerId)
                : [...prev, customerId]
        );
    };

    const handleSelectAll = () => {
        setSelectedCustomers(
            selectedCustomers.length === filteredCustomers.length
                ? []
                : filteredCustomers.map(c => c.id)
        );
    };

    const handleTemplateChange = (template) => {
        setSelectedTemplate(template);
        setCustomMessage(messageTemplates[template] || '');
    };

    const handleSendMessages = async () => {
        if (selectedCustomers.length === 0 || !customMessage.trim()) {
            alert('Please select customers and enter a message');
            return;
        }

        if (sendMode === 'schedule') {
            if (!scheduleDate || !scheduleTime) {
                alert('Please select both date and time for scheduling');
                return;
            }
        }

        setSending(true);

        try {
            const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));

            if (sendMode === 'now') {
                // Send messages immediately via Twilio
                const messages = selectedCustomerData.map(customer => ({
                    to: twilioService.validatePhoneNumber(customer.phone),
                    body: twilioService.formatMessage(customMessage, {
                        name: customer.name.split(' ')[0],
                        link: 'https://yoursite.com/create-ad'
                    }),
                    customerId: customer.id,
                    customerName: customer.name
                }));

                console.log('Sending messages via Twilio:', messages);

                // Send via Twilio
                const results = await twilioService.sendBulkSMS(messages);

                // Create message history entries
                const newMessages = results.map(result => ({
                    id: result.messageSid || Date.now() + Math.random(),
                    customerName: result.customerName,
                    customerPhone: result.to,
                    customerId: result.customerId,
                    message: result.body,
                    status: result.success ? 'sent' : 'failed',
                    timestamp: new Date().toLocaleString(),
                    scheduled: false,
                    twilioSid: result.messageSid,
                    error: result.error,
                    cost: result.price
                }));

                setSentMessages(prev => [...newMessages, ...prev]);

                const successCount = results.filter(r => r.success).length;
                const failCount = results.filter(r => !r.success).length;

                if (failCount > 0) {
                    const failedMessages = results.filter(r => !r.success);
                    console.error('Failed messages:', failedMessages);

                    let errorDetails = failedMessages.map(msg => `${msg.customerName}: ${msg.error}`).join('\n');
                    alert(`📊 Messages processed!\n\n✅ Success: ${successCount}\n❌ Failed: ${failCount}\n\n🔍 Failed messages:\n${errorDetails}\n\n💡 Note: Trial accounts can only send to verified numbers.`);
                } else {
                    alert(`🎉 Amazing! All ${successCount} messages sent successfully!`);
                }

                // Refresh balance after sending
                try {
                    const newBalance = await twilioService.getAccountBalance();
                    setTwilioBalance(newBalance);
                } catch (balanceError) {
                    console.error('Failed to refresh balance:', balanceError);
                }

            } else {
                // Schedule messages (save to database for later processing)
                const scheduledMessages = selectedCustomerData.map(customer => ({
                    id: Date.now() + Math.random(),
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    customerId: customer.id,
                    message: twilioService.formatMessage(customMessage, {
                        name: customer.name.split(' ')[0],
                        link: 'https://yoursite.com/create-ad'
                    }),
                    status: 'scheduled',
                    timestamp: `Scheduled for ${scheduleDate} ${scheduleTime}`,
                    scheduled: true,
                    scheduleDate: scheduleDate,
                    scheduleTime: scheduleTime
                }));

                setSentMessages(prev => [...scheduledMessages, ...prev]);
                alert(`📅 Perfect! ${scheduledMessages.length} messages scheduled successfully!`);
            }

            // Reset form
            setSelectedCustomers([]);
            setCustomMessage('');
            setSelectedTemplate('');
            setScheduleDate('');
            setScheduleTime('');

        } catch (error) {
            console.error('Error sending messages:', error);
            alert(`❌ Failed to send messages: ${error.message}\n\nCheck browser console for details.`);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <AdminSidebar />
            <div className="sms-admin-main-content">
                <div className="sms-admin-panel">
                    <div className="sms-admin-container">
                        <div className="sms-admin-header">
                            <h1 className="sms-admin-title">
                                <MessageSquare className="sms-admin-title-icon" />
                                SMS Marketing Admin Panel
                            </h1>
                            <p className="sms-admin-subtitle">
                                Send targeted text messages to your customers
                                {twilioBalance?.success && (
                                    <span className="sms-admin-balance">
                    • Balance: ${twilioBalance.balance} {twilioBalance.currency}
                  </span>
                                )}
                                {twilioBalance?.error && (
                                    <span className="sms-admin-balance-error">
                    • Error loading balance
                  </span>
                                )}
                            </p>
                        </div>

                        <div className="sms-admin-content">
                            <div className="sms-admin-section">
                                <div className="sms-admin-section-header">
                                    <h2 className="sms-admin-section-title">
                                        <Users className="sms-admin-section-icon" />
                                        Select Customers ({selectedCustomers.length} selected)
                                    </h2>
                                    <div className="sms-admin-controls">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="sms-admin-filter-select"
                                        >
                                            <option value="all">All Users ({customers.length})</option>
                                            <option value="active">Active Users ({customers.filter(c => c.status === 'active').length})</option>
                                            <option value="inactive">Inactive Users ({customers.filter(c => c.status === 'inactive').length})</option>
                                        </select>
                                        <button
                                            onClick={handleSelectAll}
                                            className="sms-admin-select-all-btn"
                                        >
                                            {selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="sms-admin-loading">
                                        <Loader2 className="sms-admin-loading-icon" />
                                        <span>Loading customers...</span>
                                    </div>
                                ) : error ? (
                                    <div className="sms-admin-error">
                                        <AlertCircle className="sms-admin-error-icon" />
                                        <span>{error}</span>
                                    </div>
                                ) : (
                                    <div className="sms-admin-customer-list">
                                        {filteredCustomers.length === 0 ? (
                                            <div className="sms-admin-no-customers">
                                                <Users className="sms-admin-no-customers-icon" />
                                                <span>No customers found with SMS opt-in and phone numbers</span>
                                            </div>
                                        ) : (
                                            filteredCustomers.map(customer => (
                                                <div key={customer.id} className="sms-admin-customer-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCustomers.includes(customer.id)}
                                                        onChange={() => handleCustomerSelect(customer.id)}
                                                        className="sms-admin-checkbox"
                                                    />
                                                    <div className="sms-admin-customer-info">
                                                        <div className="sms-admin-customer-name">{customer.name}</div>
                                                        <div className="sms-admin-customer-phone">{customer.phone}</div>
                                                        <div className="sms-admin-customer-activity">
                                                            Last active: {formatDate(customer.lastActive)} |
                                                            Adverts: {customer.totalAdverts}
                                                        </div>
                                                    </div>
                                                    <span className={`sms-admin-status-badge ${customer.status === 'active' ? 'active' : 'inactive'}`}>
                            {customer.status}
                          </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="sms-admin-section">
                                <h2 className="sms-admin-section-title">Compose Message</h2>

                                <div className="sms-admin-form-group">
                                    <label className="sms-admin-label">Message Template</label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                        className="sms-admin-select"
                                    >
                                        <option value="">Choose a template...</option>
                                        <option value="new_advert">New Advert Invitation</option>
                                        <option value="reactivation">Customer Reactivation</option>
                                        <option value="promotion">Promotional Offer</option>
                                        <option value="reminder">Advert Expiry Reminder</option>
                                    </select>
                                </div>

                                <div className="sms-admin-form-group">
                                    <label className="sms-admin-label">Message Content</label>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Enter your message here... Use {name} for customer name and {link} for website link"
                                        rows={4}
                                        className="sms-admin-textarea"
                                    />
                                    <p className="sms-admin-char-count">
                                        Character count: {customMessage.length}/160 | Variables: {'{name}'}, {'{link}'}
                                    </p>
                                </div>

                                <div className="sms-admin-form-row">
                                    <div className="sms-admin-form-group">
                                        <label className="sms-admin-label">Send Mode</label>
                                        <select
                                            value={sendMode}
                                            onChange={(e) => setSendMode(e.target.value)}
                                            className="sms-admin-select"
                                        >
                                            <option value="now">Send Now</option>
                                            <option value="schedule">Schedule</option>
                                        </select>
                                    </div>

                                    {sendMode === 'schedule' && (
                                        <>
                                            <div className="sms-admin-form-group">
                                                <label className="sms-admin-label">Date</label>
                                                <input
                                                    type="date"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                    className="sms-admin-input"
                                                />
                                            </div>
                                            <div className="sms-admin-form-group">
                                                <label className="sms-admin-label">Time</label>
                                                <input
                                                    type="time"
                                                    value={scheduleTime}
                                                    onChange={(e) => setScheduleTime(e.target.value)}
                                                    className="sms-admin-input"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={handleSendMessages}
                                    className="sms-admin-send-btn"
                                    disabled={sending || selectedCustomers.length === 0 || !customMessage.trim()}
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="sms-admin-send-icon sms-admin-spinning" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="sms-admin-send-icon" />
                                            {sendMode === 'now' ? 'Send Messages' : 'Schedule Messages'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {sentMessages.length > 0 && (
                        <div className="sms-admin-container">
                            <div className="sms-admin-header">
                                <h2 className="sms-admin-section-title">
                                    <Clock className="sms-admin-section-icon" />
                                    Message History ({sentMessages.length} messages)
                                </h2>
                            </div>

                            <div className="sms-admin-history-list">
                                {sentMessages.map(message => (
                                    <div key={message.id} className="sms-admin-history-item">
                                        <div className="sms-admin-history-content">
                                            <div className="sms-admin-history-header">
                                                <span className="sms-admin-history-customer">{message.customerName}</span>
                                                <span className="sms-admin-history-phone">{message.customerPhone}</span>
                                                {message.scheduled ? (
                                                    <span className="sms-admin-status-badge scheduled">
                            <Clock className="sms-admin-status-icon" />
                            Scheduled
                          </span>
                                                ) : (
                                                    <span className="sms-admin-status-badge sent">
                            <CheckCircle className="sms-admin-status-icon" />
                            Sent
                          </span>
                                                )}
                                            </div>
                                            <p className="sms-admin-history-message">{message.message}</p>
                                            <p className="sms-admin-history-timestamp">{message.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SMSAdminPanel;