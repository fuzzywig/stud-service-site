import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
dotenv.config();

console.log('Step 1: Environment variables loaded');
console.log('API Key exists:', !!process.env.SENDGRID_API_KEY);
console.log('API Key length:', process.env.SENDGRID_API_KEY?.length);

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('Step 2: API key set in SendGrid');

// Try to import the config
try {
    const { templates } = await import('../config/sendgridTemplates.js');
    console.log('Step 3: Templates loaded:', templates);
    console.log('Welcome template ID:', templates.WELCOME);
} catch (error) {
    console.error('Failed to load templates:', error);
}

// Try to send a simple email
console.log('Step 4: Attempting to send simple email...');
const msg = {
    to: 'gavinoxley@gmail.com',
    from: process.env.FROM_EMAIL,
    subject: 'Debug Test',
    text: 'If you receive this, the basic setup works!',
};

try {
    await sgMail.send(msg);
    console.log('Step 5: Simple email sent successfully!');
} catch (error) {
    console.error('Simple email failed:', error.message);
}

// Now try with template
try {
    const { templates } = await import('../config/sendgridTemplates.js');

    console.log('Step 6: Attempting template email...');
    const templateMsg = {
        to: 'gavinoxley@gmail.com',
        from: process.env.FROM_EMAIL,
        templateId: templates.WELCOME,
        dynamicTemplateData: {
            firstName: 'Test',
            currentYear: 2024
        }
    };

    await sgMail.send(templateMsg);
    console.log('Step 7: Template email sent successfully!');
} catch (error) {
    console.error('Template email failed:', error.message);
    if (error.response) {
        console.error('Error details:', error.response.body);
    }
}