import sgMail from '@sendgrid/mail';
import { templates } from '../config/sendgridTemplates.js';

class EmailService {
    async sendEmail(templateKey, recipientEmail, dynamicData) {
        try {
            // Set API key just before sending (in case env vars weren't loaded on import)
            if (!sgMail.client.apiKey && process.env.SENDGRID_API_KEY) {
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            }

            const msg = {
                to: recipientEmail,
                from: {
                    email: process.env.FROM_EMAIL,
                    name: process.env.FROM_NAME
                },
                replyTo: process.env.REPLY_TO_EMAIL,
                templateId: templates[templateKey],
                dynamicTemplateData: {
                    currentYear: new Date().getFullYear(),
                    ...dynamicData
                }
            };

            await sgMail.send(msg);
            console.log(`Email sent: ${templateKey} to ${recipientEmail}`);
            return { success: true };
        } catch (error) {
            console.error(`Email failed: ${templateKey} to ${recipientEmail}`, error);
            return { success: false, error: error.message };
        }
    }

    // Welcome Email
    async sendWelcomeEmail(userData) {
        const dynamicData = {
            firstName: userData.firstName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            accountType: userData.accountType,
            breederType: userData.breederType,
            licenceNumber: userData.licenceNumber || null,
            organizationName: userData.organizationName || null,
            loginUrl: `${process.env.APP_URL}/login`,
            createAdvertUrl: `${process.env.APP_URL}/create-advert`,
            helpUrl: `${process.env.APP_URL}/help`,
            facebookUrl: 'https://facebook.com/mypetconnect',
            instagramUrl: 'https://instagram.com/mypetconnect',
            twitterUrl: 'https://twitter.com/mypetconnect'
        };

        return await this.sendEmail('WELCOME', userData.email, dynamicData);
    }

    // Password Changed
    async sendPasswordChangedEmail(userData, changeInfo) {
        const dynamicData = {
            firstName: userData.firstName,
            changeDate: new Date().toLocaleDateString('en-GB'),
            changeTime: new Date().toLocaleTimeString('en-GB'),
            ipAddress: changeInfo.ipAddress,
            deviceInfo: changeInfo.deviceInfo,
            loginUrl: `${process.env.APP_URL}/login`,
            supportUrl: `${process.env.APP_URL}/support`
        };

        return await this.sendEmail('PASSWORD_CHANGED', userData.email, dynamicData);
    }

    // Advert Submitted
    async sendAdvertSubmittedEmail(advertData, userData) {
        const dynamicData = {
            firstName: userData.firstName,
            categoryName: advertData.categoryName,
            advertType: advertData.type,
            petName: advertData.petName,
            price: advertData.price || null,
            imageCount: advertData.images ? advertData.images.length : 0,
            profileUrl: `${process.env.APP_URL}/profile`,
            createAdvertUrl: `${process.env.APP_URL}/create-advert`
        };

        return await this.sendEmail('ADVERT_SUBMITTED', userData.email, dynamicData);
    }

    // Advert Approved
    async sendAdvertApprovedEmail(advertData, userData) {
        const dynamicData = {
            userName: userData.firstName,
            petName: advertData.petName,
            advertUrl: `${process.env.APP_URL}/advert/${advertData.id}`,
            profileUrl: `${process.env.APP_URL}/profile`
        };

        return await this.sendEmail('ADVERT_APPROVED', userData.email, dynamicData);
    }

    // Advert Rejected
    async sendAdvertRejectedEmail(advertData, userData, rejectionReason) {
        const dynamicData = {
            userName: userData.firstName,
            petName: advertData.petName,
            rejectionReason: rejectionReason,
            myAdvertsUrl: `${process.env.APP_URL}/my-adverts`,
            guidelinesUrl: `${process.env.APP_URL}/guidelines`
        };

        return await this.sendEmail('ADVERT_REJECTED', userData.email, dynamicData);
    }

    // Advert Expiring
    async sendAdvertExpiringEmail(advertData, userData, daysLeft) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysLeft);

        const dynamicData = {
            userName: userData.firstName,
            petName: advertData.petName,
            daysLeft: daysLeft,
            expiryDate: expiryDate.toLocaleDateString('en-GB'),
            advertType: advertData.type,
            postedDate: new Date(advertData.createdAt).toLocaleDateString('en-GB'),
            viewCount: advertData.viewCount || 0,
            inquiryCount: advertData.inquiryCount || 0,
            advertImage: advertData.images && advertData.images[0] ? advertData.images[0] : null,
            renewUrl: `${process.env.APP_URL}/advert/${advertData.id}/renew`,
            advertUrl: `${process.env.APP_URL}/advert/${advertData.id}`,
            responseTime: 'normal',
            specialOffer: false,
            specialOfferText: ''
        };

        return await this.sendEmail('ADVERT_EXPIRING', userData.email, dynamicData);
    }

    // Support Ticket Submitted
    async sendTicketSubmittedEmail(ticketData, userData) {
        const priorityColors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444'
        };

        const dynamicData = {
            userName: userData.firstName,
            ticketId: ticketData.id,
            subject: ticketData.subject,
            message: ticketData.message,
            category: ticketData.category,
            priority: ticketData.priority,
            priorityColor: priorityColors[ticketData.priority] || '#10b981',
            responseTime: ticketData.expectedResponseTime || 'normal',
            ticketUrl: `${process.env.APP_URL}/support/ticket/${ticketData.id}`,
            helpCenterUrl: `${process.env.APP_URL}/help`,
            allTicketsUrl: `${process.env.APP_URL}/support/tickets`
        };

        return await this.sendEmail('TICKET_SUBMITTED', userData.email, dynamicData);
    }

    // Support Ticket Updated
    async sendTicketUpdatedEmail(ticketData, userData, agentData, replyMessage) {
        const statusColors = {
            'open': '#10b981',
            'waiting on customer': '#f59e0b',
            'resolved': '#059669',
            'closed': '#6b7280'
        };

        const dynamicData = {
            userName: userData.firstName,
            ticketId: ticketData.id,
            subject: ticketData.subject,
            status: ticketData.status,
            statusColor: statusColors[ticketData.status.toLowerCase()] || '#10b981',
            agentName: agentData.name,
            agentInitials: agentData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
            replyTime: new Date().toLocaleString('en-GB'),
            replyMessage: replyMessage,
            replyPreview: replyMessage.substring(0, 100),
            ticketUrl: `${process.env.APP_URL}/support/ticket/${ticketData.id}`,
            allTicketsUrl: `${process.env.APP_URL}/support/tickets`,
            newTicketUrl: `${process.env.APP_URL}/support/new`,
            helpCenterUrl: `${process.env.APP_URL}/help`
        };

        return await this.sendEmail('TICKET_UPDATED', userData.email, dynamicData);
    }

    // Support Ticket Closed
    async sendTicketClosedEmail(ticketData, userData, closedBy) {
        const createdDate = new Date(ticketData.createdAt);
        const closedDate = new Date();
        const resolutionHours = Math.round((closedDate - createdDate) / (1000 * 60 * 60));

        const dynamicData = {
            userName: userData.firstName,
            ticketId: ticketData.id,
            subject: ticketData.subject,
            closedBy: closedBy,
            resolutionSummary: ticketData.resolutionSummary || null,
            createdDate: createdDate.toLocaleDateString('en-GB'),
            resolutionTime: resolutionHours < 24 ? `${resolutionHours} hours` : `${Math.round(resolutionHours / 24)} days`,
            reopenDays: 30,
            satisfactionUrl: `${process.env.APP_URL}/support/ticket/${ticketData.id}/feedback`,
            ticketUrl: `${process.env.APP_URL}/support/ticket/${ticketData.id}`,
            newTicketUrl: `${process.env.APP_URL}/support/new`,
            helpCenterUrl: `${process.env.APP_URL}/help`
        };

        return await this.sendEmail('TICKET_CLOSED', userData.email, dynamicData);
    }

    // New Message
    // New Message - Updated to accept single emailData object
    async sendNewMessageEmail(emailData) {
        const dynamicData = {
            senderName: emailData.senderName,
            senderAvatar: emailData.senderAvatar || null,
            senderInitials: emailData.senderInitials,
            senderLocation: emailData.senderLocation || null,
            petName: emailData.petName,
            messageTime: emailData.messageTime,
            messageText: emailData.messageText,
            messageTruncated: emailData.messageTruncated || false,
            messagePreview: emailData.messagePreview,
            conversationUrl: emailData.conversationUrl,
            advertUrl: emailData.advertUrl,
            allMessagesUrl: emailData.allMessagesUrl,
            helpUrl: emailData.helpUrl,
            notificationSettingsUrl: emailData.notificationSettingsUrl,
            currentYear: emailData.currentYear,
            showStats: emailData.showStats || false,
            unreadCount: emailData.unreadCount || null,
            totalInquiries: emailData.totalInquiries || null
        };

        return await this.sendEmail('NEW_MESSAGE', emailData.recipientEmail, dynamicData);
    }

    // New Review
    async sendNewReviewEmail(reviewData, userData, reviewerData) {
        const starDisplay = '⭐'.repeat(reviewData.rating) + '☆'.repeat(5 - reviewData.rating);

        const dynamicData = {
            userName: userData.firstName,
            reviewerName: reviewerData.name,
            petName: reviewData.advertTitle,
            starRating: reviewData.rating,
            starDisplay: starDisplay,
            reviewText: reviewData.text,
            reviewDate: new Date().toLocaleDateString('en-GB'),
            canRespond: true,
            reviewUrl: `${process.env.APP_URL}/review/${reviewData.id}`,
            respondUrl: `${process.env.APP_URL}/review/${reviewData.id}/respond`,
            profileUrl: `${process.env.APP_URL}/profile/reviews`,
            showStats: true,
            averageRating: userData.averageRating || reviewData.rating,
            totalReviews: userData.totalReviews || 1
        };

        return await this.sendEmail('NEW_REVIEW', userData.email, dynamicData);
    }
}

export default new EmailService();