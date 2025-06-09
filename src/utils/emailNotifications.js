// src/utils/emailNotifications.js
import { auth } from "../firebase/firebase";
import { doc as firestoreDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { doc, addDoc, collection, updateDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
export const getUserDataForEmail = async (userId) => {
    try {
        if (!userId) return null;

        const userDoc = firestoreDoc(db, 'users', userId);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            console.warn('User document not found for ID:', userId);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

// Function to send review response notification email
export const sendReviewResponseNotification = async ({
                                                         reviewerEmail,
                                                         reviewerName,
                                                         ownerName,
                                                         ownerOrganization,
                                                         reviewText,
                                                         responseText,
                                                         dogName,
                                                         profileUrl
                                                     }) => {
    try {
        console.log('📧 EMAIL FUNCTION DEBUG:');
        console.log('📧 - reviewerEmail:', reviewerEmail);
        console.log('📧 - reviewerName:', reviewerName);
        console.log('📧 - ownerName:', ownerName);
        console.log('📧 - ownerOrganization:', ownerOrganization);
        console.log('📧 - dogName:', dogName);

        // ✅ ROBUST: Handle missing sender name
        const senderName = ownerOrganization || ownerName || 'Pet Owner';

        // ✅ ROBUST: Handle missing dog name
        const finalDogName = dogName || 'your pet';

        // ✅ ROBUST: Handle missing reviewer name
        const finalReviewerName = reviewerName || 'User';

        console.log('📧 - Final senderName:', senderName);
        console.log('📧 - Final dogName:', finalDogName);

        // Validate critical fields only
        if (!reviewerEmail || !responseText) {
            throw new Error('Missing critical fields: reviewerEmail or responseText');
        }

        // Truncate review text if too long for email
        const truncatedReview = reviewText && reviewText.length > 150
            ? reviewText.substring(0, 150) + '...'
            : (reviewText || 'No review text available');

        const emailPayload = {
            reviewerEmail: reviewerEmail,
            reviewerName: finalReviewerName,
            senderName: senderName,              // ✅ Will never be undefined
            reviewText: truncatedReview,
            responseText: responseText,
            name: finalDogName,                  // ✅ Will never be undefined
            profileUrl: profileUrl || '#',
            isOrganization: !!ownerOrganization
        };

        console.log('📧 FINAL EMAIL PAYLOAD:', JSON.stringify(emailPayload, null, 2));

        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-review-response-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Review response email sent successfully');
            return { success: true };
        } else {
            console.warn('⚠️ Review response email failed:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('❌ Error sending review response email:', error);
        return { success: false, error: error.message };
    }
};

// ADD THESE MISSING FUNCTIONS TO YOUR emailNotifications.js file:

// ============================================================================
// MESSAGE EMAIL NOTIFICATION FUNCTIONS
// ============================================================================

// Function to send message notification email
// UPDATE YOUR sendMessageNotification FUNCTION in emailNotifications.js

// Function to send message notification email
export const sendMessageNotification = async (messageData) => {
    try {
        console.log('📧 Preparing to send message notification email...');
        console.log('📧 Message data:', messageData);

        // ✅ CREATE UNIQUE REPLY-TO ADDRESS FOR EMAIL REPLIES
        const conversationId = `${messageData.senderId}-${messageData.recipientId}-${messageData.advertId || 'general'}`;
        const replyToEmail = `reply-${conversationId}@reply.mypetconnect.co.uk`;

        const emailPayload = {
            emailData: {
                recipientEmail: messageData.recipientEmail,
                recipientId: messageData.recipientId,
                senderId: messageData.senderId,                    // ✅ ADD THIS LINE
                senderName: messageData.senderName,
                senderAvatar: messageData.senderAvatar,
                senderInitials: messageData.senderInitials,
                senderLocation: messageData.senderLocation,
                petName: messageData.petName,
                advertId: messageData.advertId,
                messageText: messageData.messageText,
                messagePreview: messageData.messagePreview,
                messageTime: messageData.messageTime,
                conversationUrl: messageData.conversationUrl,
                advertUrl: messageData.advertUrl,
                messageTruncated: messageData.messageTruncated,
                showStats: messageData.showStats,
                unreadCount: messageData.unreadCount,
                totalInquiries: messageData.totalInquiries,
                isFileAttachment: messageData.isFileAttachment,
                fileName: messageData.fileName,

                // ✅ ADD REPLY-TO EMAIL FOR EMAIL REPLIES
                replyToEmail: replyToEmail,
                canReplyByEmail: true
            }
        };

        console.log('📧 Sending message notification with reply-to:', replyToEmail);
        console.log('📧 Conversation ID:', conversationId);
        console.log('📧 Sender ID:', messageData.senderId);
        console.log('📧 Recipient ID:', messageData.recipientId);
        console.log('📧 Advert ID:', messageData.advertId);

        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-message-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Message notification email sent successfully');
            return { success: true };
        } else {
            console.warn('⚠️ Message notification email failed:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('❌ Error sending message notification email:', error);
        return { success: false, error: error.message };
    }
};

// Function to send new message notification (simpler version)
export const sendNewMessageNotification = async ({
                                                     recipientEmail,
                                                     recipientName,
                                                     senderName,
                                                     petName,
                                                     messageText,
                                                     conversationUrl,
                                                     advertUrl
                                                 }) => {
    try {
        const messageData = {
            recipientEmail,
            recipientId: 'unknown', // You might need to pass this
            senderName,
            petName,
            messageText,
            messagePreview: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
            messageTime: new Date().toLocaleString(),
            conversationUrl,
            advertUrl,
            messageTruncated: messageText.length > 100,
            showStats: false,
            unreadCount: 1,
            totalInquiries: 0,
            isFileAttachment: false
        };

        return await sendMessageNotification(messageData);
    } catch (error) {
        console.error('❌ Error in sendNewMessageNotification:', error);
        return { success: false, error: error.message };
    }
};

// ============================================================================
// EMAIL REPLY PROCESSING FUNCTIONS (for future implementation)
// ============================================================================

// Function to process incoming email replies
export const processEmailReply = async (emailReplyData) => {
    try {
        console.log('📨 Processing email reply...');

        // This will be used when you implement the email reply webhook
        const {
            replyToEmail,
            fromEmail,
            replyText,
            subject
        } = emailReplyData;

        // Extract conversation info from reply-to address
        const match = replyToEmail.match(/reply-(.+)-(.+)-(.+)@reply\.mypetconnect\.co\.uk/);

        if (!match) {
            throw new Error('Invalid reply-to format');
        }

        const [, senderId, recipientId, advertId] = match;

        // Clean the reply text
        const cleanedText = cleanEmailReply(replyText);

        // This would save to your messaging system
        // await saveMessageToDatabase({
        //     senderId,
        //     recipientId,
        //     advertId: advertId !== 'general' ? advertId : null,
        //     text: cleanedText,
        //     fromEmail: true
        // });

        console.log('✅ Email reply processed successfully');
        return { success: true, conversationId: `${senderId}-${recipientId}-${advertId}` };

    } catch (error) {
        console.error('❌ Error processing email reply:', error);
        return { success: false, error: error.message };
    }
};

// Helper function to clean email reply text
function cleanEmailReply(emailText) {
    if (!emailText) return '';

    // Remove common email signatures and reply chains
    const cleanPatterns = [
        /-----Original Message-----[\s\S]*/i,
        /On .+ wrote:[\s\S]*/i,
        /From: .+[\s\S]*/i,
        /<.*?>/g, // Remove HTML tags
        /Sent from my \w+/i,
        /Get Outlook for \w+/i,
        /\r?\n\r?\n.*$/s // Remove everything after double line break
    ];

    let cleaned = emailText;
    cleanPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Trim whitespace and limit length
    return cleaned.trim().substring(0, 1000);
}

// Function to generate reply-to email address
export const generateReplyToEmail = (senderId, recipientId, advertId = 'general') => {
    const conversationId = `${senderId}-${recipientId}-${advertId}`;
    return `reply-${conversationId}@reply.mypetconnect.co.uk`;
};

// Function to validate reply-to email format
export const parseReplyToEmail = (replyToEmail) => {
    const match = replyToEmail.match(/reply-(.+)-(.+)-(.+)@reply\.mypetconnect\.co\.uk/);

    if (!match) {
        return null;
    }

    const [, senderId, recipientId, advertId] = match;

    return {
        senderId,
        recipientId,
        advertId: advertId !== 'general' ? advertId : null,
        conversationId: `${senderId}-${recipientId}-${advertId}`
    };
};

// Function to send password change notification email
export const sendPasswordChangeNotification = async (userData, changeMethod = 'profile') => {
    try {
        console.log('📧 Preparing to send password change notification');

        const user = auth.currentUser;
        if (!user) {
            console.error('❌ No authenticated user found');
            return;
        }

        // Get user agent and basic device info
        const userAgent = navigator.userAgent || 'Unknown device';

        // Create timestamp
        const timestamp = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        const payload = {
            userEmail: userData.email || user.email,
            userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
            changeMethod: changeMethod, // 'reset' or 'profile'
            userAgent: userAgent,
            ipAddress: 'Hidden for privacy', // Don't expose real IP on client side
            timestamp: timestamp,
            userId: user.uid
        };

        console.log('📧 Password change email payload:', payload);

        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-password-changed-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('📧 Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Password change notification sent successfully:', result);
            return { success: true };
        } else {
            const error = await response.json();
            console.error('❌ Failed to send password change notification:', error);
            return { success: false, error };
        }
    } catch (error) {
        console.error('❌ Error sending password change notification:', error);
        return { success: false, error: error.message };
    }
};

// Specific function for profile password changes
export const notifyProfilePasswordChange = async (userData) => {
    return sendPasswordChangeNotification(userData, 'profile');
};

// Specific function for password reset changes
export const notifyPasswordReset = async (userData) => {
    return sendPasswordChangeNotification(userData, 'reset');
};

// ============================================================================
// TICKET EMAIL NOTIFICATION FUNCTIONS
// ============================================================================

// Function to send ticket submission confirmation email
// Function to send ticket submission confirmation email
export const sendTicketSubmittedNotification = async (ticketData, userData) => {
    try {
        console.log('📧 Preparing to send ticket submission email...');
        console.log('Ticket data received:', ticketData);

        // The ticketData already has the correct field names from HelpSupport.jsx
        const emailPayload = {
            userEmail: ticketData.userEmail,       // ✅ Already correct from frontend
            userName: ticketData.userName,         // ✅ Already correct from frontend
            ticketNumber: ticketData.ticketNumber, // ✅ Already correct from frontend
            subject: ticketData.subject,           // ✅ Already correct from frontend
            ticketType: ticketData.ticketType,     // ✅ Already correct from frontend
            priority: ticketData.priority,         // ✅ Already correct from frontend
            message: ticketData.message,           // ✅ Already correct from frontend
            userId: ticketData.userId              // ✅ Already correct from frontend
        };

        console.log('📧 Final email payload to server:', emailPayload);

        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-ticket-submitted-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload) // ✅ Send the correctly named fields
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Ticket submission email sent successfully');
            return { success: true, emailSent: true };
        } else {
            console.warn('⚠️ Ticket submission email failed:', result.error);
            return { success: false, error: result.error, emailSent: false };
        }

    } catch (error) {
        console.error('❌ Error sending ticket submission email:', error);
        return { success: false, error: error.message, emailSent: false };
    }
};

export const sendTicketUpdateNotification = async (ticketData, updateType, adminMessage, userData) => {
    try {
        console.log('📧 Preparing to send ticket update email...');
        console.log('📧 Ticket data:', ticketData);
        console.log('📧 Update type:', updateType);
        console.log('📧 Admin message:', adminMessage);
        console.log('📧 User data:', userData);

        const emailPayload = {
            userEmail: userData.email || ticketData.customerEmail || ticketData.email,
            userName: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.displayName || ticketData.customerName || 'Customer',
            ticketNumber: ticketData.ticketNumber || ticketData.id,
            subject: ticketData.subject,
            updateType: updateType, // 'reply', 'status_change', 'priority_change', 'assignment'
            newStatus: ticketData.status,
            newPriority: ticketData.priority,
            adminReply: adminMessage,
            adminName: 'Support Team', // You can make this dynamic based on current admin
            userId: ticketData.customerId || ticketData.userId
        };

        console.log('📧 Final email payload for admin reply:', emailPayload);

        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-ticket-updated-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Ticket update email sent successfully');
            return { success: true };
        } else {
            console.warn('⚠️ Ticket update email failed:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('❌ Error sending ticket update email:', error);
        return { success: false, error: error.message };
    }
};

// Function to send ticket closed notification email
export const sendTicketClosedNotification = async (ticketData, resolutionSummary, userData) => {
    try {
        console.log('📧 Preparing to send ticket closed email...');
        console.log('📧 Ticket data:', ticketData);
        console.log('📧 Resolution summary:', resolutionSummary);
        console.log('📧 User data:', userData);

        // Calculate resolution time
        const calculateResolutionTime = (createdDate, closedDate = new Date()) => {
            try {
                const created = new Date(createdDate);
                const closed = new Date(closedDate);
                const diffMs = closed - created;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                if (diffDays > 0) {
                    return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                } else {
                    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                }
            } catch (error) {
                return 'N/A';
            }
        };

        const emailPayload = {
            userEmail: userData.email || ticketData.customerEmail || ticketData.email,
            userName: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.displayName || ticketData.customerName || 'Customer',
            ticketNumber: ticketData.ticketNumber || ticketData.id,
            subject: ticketData.subject,
            closedBy: 'Support Team', // You can make this dynamic based on who closed it
            resolutionSummary: resolutionSummary,
            createdDate: ticketData.created || ticketData.createdAt ?
                new Date(ticketData.created || ticketData.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'N/A',
            resolutionTime: calculateResolutionTime(ticketData.created || ticketData.createdAt),
            userId: ticketData.customerId || ticketData.userId
        };

        console.log('📧 Final email payload for ticket closure:', emailPayload);

        const response = await fetch('https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-ticket-closed-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Ticket closed email sent successfully');
            return { success: true };
        } else {
            console.warn('⚠️ Ticket closed email failed:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('❌ Error sending ticket closed email:', error);
        return { success: false, error: error.message };
    }
};