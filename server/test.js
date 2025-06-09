import sgMail from '@sendgrid/mail';
import { templates } from '../config/sendgridTemplates.js';

// Don't set the API key here - let the calling code handle it
class EmailService {
    constructor() {
        // Set API key when service is created
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        }
    }

    async sendEmail(templateKey, recipientEmail, dynamicData) {
        try {
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

    // ... rest of your methods stay the same
}

export default new EmailService();