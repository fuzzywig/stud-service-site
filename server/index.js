import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server directory FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

// NOW import Firebase service AFTER env vars are loaded
const { FirebaseSitemapService } = await import('./firebase-sitemap-service.js');

// Debug lines
console.log('🔍 DEBUG - Firebase env vars:');
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'EXISTS' : 'MISSING');
console.log('🔍 END DEBUG');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Your SendGrid template IDs
const templates = {
    WELCOME: 'd-c7dbabc9e55846378fb0e4b9970ed43d',
    PASSWORD_CHANGED: 'd-4961110921694f6a9321fda734fd2211',
    ADVERT_SUBMITTED: 'd-08f7c66e3a024bb687db46b3f372343f',
    ADVERT_APPROVED: 'd-f8805dc163fc49d3b9355698d2f389c6',
    ADVERT_REJECTED: 'd-2bf7a62047d6430580ac02e8a175e9d3',
    ADVERT_EXPIRING: 'd-8d9e3e9fde62448181217b7b2823d891',
    TICKET_SUBMITTED: 'd-6c179356393347f39bfb04e6dce0d51d',
    TICKET_UPDATED: 'd-d0bad97e0acb4241bbc9ac49e19c2dba',
    TICKET_CLOSED: 'd-5ff4ef6603ab4fca82db990f5c13c6b5',
    NEW_MESSAGE: 'd-3327bafe35b54cee995636d8f459a094',
    NEW_REVIEW: 'd-42c4264d5a8e4fa68d9fc94eb17f72b6',
    REVIEW_RESPONSE: 'd-8e896410b34c4bd6bd183f5a2e3651e4'

};

// Simple cache for sitemap data
const sitemapCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour

const getCachedOrFetch = async (key, fetchFunction) => {
    const cached = sitemapCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    const data = await fetchFunction();
    sitemapCache.set(key, { data, timestamp: Date.now() });
    return data;
};


// UPDATED: Admin alert email endpoint using SendGrid dynamic template
app.post('/api/send-admin-alert', async (req, res) => {
    console.log('🚨 Admin alert email endpoint called');
    console.log('🚨 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            category,
            intent,
            breedOrType,
            name,
            price,
            fee,
            age,
            gender,
            description,
            images,
            ownerEmail,
            adId
        } = req.body;

        // Validate required fields
        if (!category || !intent || !breedOrType || !ownerEmail) {
            console.log('❌ Missing required fields for admin alert');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['category', 'intent', 'breedOrType', 'ownerEmail']
            });
        }

        // Get admin emails - Updated to use your specific email
        const adminEmails = ['gavinoxley@gmail.com'];

        console.log('🚨 Sending admin alert to:', adminEmails);

        // …inside app.post('/api/send-admin-alert')…
        const intentDisplay   = intent === 'stud' ? 'For Stud' : 'For Sale';
        const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);

        const dynamicTemplateData = {
            message:       "New Pet Advertisement Submitted",
            category:      categoryDisplay,
            intent:        intentDisplay,
            breedOrType:   breedOrType,
            ownerEmail:    ownerEmail,
            adId:          adId,
            timestamp:     new Date().toLocaleString('en-GB'),
            adminPanelUrl: 'https://mypetconnect.co.uk/admin',
            currentYear:   new Date().getFullYear()
        };

        const msg = {
            to: adminEmail.trim(),
            from: {
                email: process.env.FROM_EMAIL,
                name:  process.env.FROM_NAME || 'MyPetConnect Admin Alerts'
            },
            replyTo:                process.env.REPLY_TO_EMAIL,
            templateId:             templates.ADMIN_ALERT,
            dynamicTemplateData
        };

        await sgMail.send(msg);


        console.log('🚨 Template data:', JSON.stringify(dynamicTemplateData, null, 2));

        // Send to all admin emails using dynamic template
        const emailPromises = adminEmails.map(adminEmail => {
            const msg = {
                to: adminEmail.trim(),
                from: {
                    email: process.env.FROM_EMAIL,
                    name: process.env.FROM_NAME || 'MyPetConnect Admin Alerts'
                },
                replyTo: process.env.REPLY_TO_EMAIL,
                templateId: templates.ADMIN_ALERT,
                dynamicTemplateData: dynamicTemplateData
            };

            return sgMail.send(msg);
        });

        // Send all emails
        await Promise.all(emailPromises);

        console.log(`✅ Admin alert emails sent to ${adminEmails.length} admin(s) using template ${templates.ADMIN_ALERT}`);

        res.status(200).json({
            success: true,
            message: `Admin alert emails sent to ${adminEmails.length} admin(s)`,
            adminCount: adminEmails.length,
            templateId: templates.ADMIN_ALERT
        });

    } catch (error) {
        console.error('❌ Error sending admin alert emails:', error);

        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }

        res.status(500).json({
            error: 'Failed to send admin alert emails',
            details: error.message
        });
    }
});


// Test Firebase connection endpoint
app.get('/api/test-firebase-sitemap', async (req, res) => {
    try {
        console.log('🧪 Testing Firebase sitemap connection...');
        await FirebaseSitemapService.testConnection();
        const count = await FirebaseSitemapService.getActivePetsCount();
        res.json({
            success: true,
            totalActivePets: count,
            message: 'Firebase sitemap connection successful',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Firebase sitemap test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Main sitemap index

// Individual pet listings sitemap (add this to your index.js)
app.get('/sitemap-pets-:page.xml', async (req, res) => {
    try {
        const page = parseInt(req.params.page);
        const baseUrl = 'https://mypetconnect.co.uk';

        if (isNaN(page) || page < 1) {
            return res.status(404).send('Invalid sitemap page');
        }

        const petsPerPage = 5000;
        const offset = (page - 1) * petsPerPage;

        console.log(`🗺️ Getting pets for sitemap page ${page}, offset ${offset}`);

        const pets = await getCachedOrFetch(`pets-page-${page}`, () =>
            FirebaseSitemapService.getPetsBatch(offset, petsPerPage)
        );

        if (pets.length === 0) {
            return res.status(404).send('Sitemap page not found');
        }

        const urlElements = pets.map(pet => {
            // Higher priority for featured and recent listings
            let priority = "0.8";
            if (pet.featured) priority = "0.9";

            const daysSinceUpdate = (new Date() - pet.updatedAt) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate <= 7) priority = "0.9"; // Recent listings get higher priority

            return `
  <url>
    <loc>${baseUrl}/advert-details/${pet.id}</loc>
    <lastmod>${pet.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
        }).join('');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);

    } catch (error) {
        console.error('❌ Error generating pets sitemap:', error);
        res.status(500).send('Error generating pets sitemap');
    }
});

app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = 'https://mypetconnect.co.uk';
        const currentDate = new Date().toISOString();

        console.log('🗺️ Generating sitemap index...');
        const totalPets = await getCachedOrFetch('pets-count',
            () => FirebaseSitemapService.getActivePetsCount()
        );

        const petsPerSitemap = 5000;
        const totalSitemaps = Math.ceil(totalPets / petsPerSitemap);

        console.log(`🗺️ Found ${totalPets} active pets, creating ${totalSitemaps} sitemaps`);

        let sitemapEntries = `
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-breeds.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-locations.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;

        // Add pet sitemaps
        for (let i = 1; i <= totalSitemaps; i++) {
            sitemapEntries += `
  <sitemap>
    <loc>${baseUrl}/sitemap-pets-${i}.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;
        }

        const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemapIndex);

    } catch (error) {
        console.error('❌ Error generating sitemap index:', error);
        res.status(500).send('Error generating sitemap index');
    }
});

// Static pages sitemap
app.get('/sitemap-static.xml', async (req, res) => {
    try {
        const baseUrl = 'https://mypetconnect.co.uk';

        const staticRoutes = [
            { url: '/', changefreq: 'daily', priority: '1.0' },
            { url: '/about', changefreq: 'monthly', priority: '0.6' },
            { url: '/contact', changefreq: 'monthly', priority: '0.5' },
            { url: '/how-it-works', changefreq: 'monthly', priority: '0.7' },
            { url: '/browse', changefreq: 'daily', priority: '0.9' },
            { url: '/search', changefreq: 'daily', priority: '0.8' },
            { url: '/post-ad', changefreq: 'monthly', priority: '0.9' },
            { url: '/register', changefreq: 'monthly', priority: '0.8' },
            { url: '/login', changefreq: 'monthly', priority: '0.4' },
            { url: '/help', changefreq: 'monthly', priority: '0.6' }
        ];

        const urlElements = staticRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);

    } catch (error) {
        console.error('❌ Error generating static sitemap:', error);
        res.status(500).send('Error generating static sitemap');
    }
});

// Categories sitemap
app.get('/sitemap-categories.xml', async (req, res) => {
    try {
        const baseUrl = 'https://mypetconnect.co.uk';
        const categories = await getCachedOrFetch('categories', () => FirebaseSitemapService.getCategories());

        let allRoutes = [];

        categories.forEach(category => {
            // Main category page
            allRoutes.push({
                url: `/category/${category.slug}`,
                lastmod: category.lastUpdated.toISOString().split('T')[0],
                changefreq: 'daily',
                priority: category.priority
            });

            // Category + type combinations
            ['sale', 'stud', 'wanted'].forEach(type => {
                allRoutes.push({
                    url: `/category/${category.slug}/${type}`,
                    lastmod: category.lastUpdated.toISOString().split('T')[0],
                    changefreq: 'daily',
                    priority: (parseFloat(category.priority) - 0.1).toString()
                });
            });
        });

        const urlElements = allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);

    } catch (error) {
        console.error('❌ Error generating categories sitemap:', error);
        res.status(500).send('Error generating categories sitemap');
    }
});

// Cache management
app.post('/admin/clear-sitemap-cache', (req, res) => {
    sitemapCache.clear();
    res.json({ message: 'Sitemap cache cleared successfully', timestamp: new Date().toISOString() });
});

// Health check for sitemaps
app.get('/api/sitemap-health', async (req, res) => {
    try {
        const count = await FirebaseSitemapService.getActivePetsCount();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            activePets: count,
            cacheSize: sitemapCache.size
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

// Keep your existing endpoint (for backward compatibility)
app.post('/api/send-email', async (req, res) => {
    const { to, subject, html } = req.body;

    const msg = {
        to,
        from: {
            email: process.env.FROM_EMAIL,
            name: process.env.FROM_NAME || 'MyPetConnect',
        },
        subject,
        html,
    };

    try {
        await sgMail.send(msg);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error('SendGrid error:', err.response?.body || err.message);
        res.status(500).send({ success: false, error: err.message });
    }
});

// NEW: Welcome email endpoint using templates
app.post('/api/send-welcome-email', async (req, res) => {
    const { userData } = req.body;

    const msg = {
        to: userData.email,
        from: {
            email: process.env.FROM_EMAIL,
            name: process.env.FROM_NAME || 'MyPetConnect',
        },
        replyTo: process.env.REPLY_TO_EMAIL,
        templateId: templates.WELCOME,
        dynamicTemplateData: {
            firstName: userData.firstName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            accountType: userData.accountType,
            breederType: userData.breederType,
            licenceNumber: userData.licenceNumber || null,
            organizationName: userData.organizationName || null,

            // UPDATED URLs with actual domain
            loginUrl: `https://mypetconnect.co.uk/?login=true`,
            createAdvertUrl: `https://mypetconnect.co.uk/`,
            helpUrl: `https://mypetconnect.co.uk/help`,

            // Social media URLs (unchanged)
            facebookUrl: 'https://facebook.com/mypetconnect',
            instagramUrl: 'https://instagram.com/mypetconnect',
            twitterUrl: 'https://twitter.com/mypetconnect',
            currentYear: new Date().getFullYear()
        }
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Welcome email sent to ${userData.email}`);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error('SendGrid error:', err.response?.body || err.message);
        res.status(500).send({ success: false, error: err.message });
    }
});

// NEW: Message notification endpoint using SendGrid template
// UPDATE your /api/send-message-notification endpoint in your server index.js

app.post('/api/send-message-notification', async (req, res) => {
    console.log('📧 Message notification endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { emailData } = req.body;

        if (!emailData) {
            return res.status(400).json({ success: false, error: 'Missing emailData' });
        }

        // ✅ DEBUG: Show the conversation URL
        console.log('🔍 DEBUG - conversationUrl:', emailData.conversationUrl);

        // ✅ EXTRACT CONVERSATION ID FROM THE URL
        let conversationId = 'general';

        if (emailData.conversationUrl) {
            // More robust URL parsing
            const url = new URL(emailData.conversationUrl);
            const urlConversationId = url.searchParams.get('c');

            if (urlConversationId) {
                conversationId = urlConversationId;
                console.log('🔍 DEBUG - Extracted conversation ID from URL:', conversationId);
            } else {
                console.log('🔍 DEBUG - No conversation ID found in URL parameters');
            }
        } else {
            console.log('🔍 DEBUG - No conversationUrl provided');
        }

        // ✅ FALLBACK: Generate from IDs if URL extraction fails
        if (conversationId === 'general' && emailData.senderId && emailData.recipientId) {
            const generatedId = [emailData.senderId, emailData.recipientId, emailData.advertId].filter(Boolean).sort().join('_');
            console.log('🔍 DEBUG - Generated conversation ID from IDs:', generatedId);
            conversationId = generatedId;
        }

        // ✅ CREATE PROPER REPLY-TO EMAIL
        const replyToEmail = `reply-${conversationId}@reply.mypetconnect.co.uk`;

        console.log('🔍 DEBUG - Final conversation ID:', conversationId);
        console.log('🔍 DEBUG - Final reply-to email:', replyToEmail);

        // ✅ PREPARE SENDGRID DATA
        const dynamicTemplateData = {
            senderName: emailData.senderName || 'User',
            petName: emailData.petName || 'Pet',
            messagePreview: emailData.messagePreview || emailData.messageText || 'New message',
            messageText: emailData.messageText || 'New message',
            messageTime: emailData.messageTime || new Date().toLocaleString(),
            conversationUrl: emailData.conversationUrl || 'https://mypetconnect.co.uk/messages',
            advertUrl: emailData.advertUrl || 'https://mypetconnect.co.uk/listings',
            allMessagesUrl: emailData.allMessagesUrl || 'https://mypetconnect.co.uk/messages',
            helpUrl: emailData.helpUrl || 'https://mypetconnect.co.uk/help',
            notificationSettingsUrl: emailData.notificationSettingsUrl || `https://mypetconnect.co.uk/profile/${emailData.recipientId || 'user'}#notifications`,
            currentYear: emailData.currentYear || new Date().getFullYear(),

            // ✅ EMAIL REPLY FUNCTIONALITY
            canReplyByEmail: true,
            replyToEmail: replyToEmail,
            replyInstructions: "💬 You can reply directly to this email to send a message back!",

            // Optional fields
            senderAvatar: emailData.senderAvatar || null,
            senderInitials: emailData.senderInitials || 'U',
            senderLocation: emailData.senderLocation || null,
            messageTruncated: emailData.messageTruncated || false,
            showStats: emailData.showStats || false,
            unreadCount: emailData.unreadCount || null,
            totalInquiries: emailData.totalInquiries || null,
            recipientName: emailData.recipientName || 'User',
            advertTitle: emailData.advertTitle || emailData.petName || 'Pet',
            isFileAttachment: emailData.isFileAttachment || false,
            fileName: emailData.fileName || null
        };

        console.log('📧 SendGrid dynamicTemplateData:', JSON.stringify(dynamicTemplateData, null, 2));

        const msg = {
            to: emailData.recipientEmail,
            from: {
                email: 'messages@mypetconnect.co.uk',
                name: 'My Pet Connect'
            },
            replyTo: {
                email: replyToEmail,
                name: 'My Pet Connect Messages'
            },
            templateId: 'd-3327bafe35b54cee995636d8f459a094',
            dynamicTemplateData: dynamicTemplateData
        };

        await sgMail.send(msg);

        console.log(`✅ Message notification email sent to ${emailData.recipientEmail} with reply-to: ${replyToEmail}`);

        res.json({
            success: true,
            message: 'Message notification email sent successfully',
            replyToEmail: replyToEmail,
            conversationId: conversationId
        });

    } catch (error) {
        console.error('❌ Error sending message notification email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message notification email',
            details: error.message
        });
    }
});




// ADD THIS EMAIL REPLY PARSER ENDPOINT
app.post('/api/parse-email-reply', express.raw({type: 'application/json', limit: '10mb'}), async (req, res) => {
    try {
        console.log('📨 Received email reply from SendGrid');

        // SendGrid sends parsed email data
        const emailData = JSON.parse(req.body);

        console.log('📨 Email data:', {
            to: emailData.to,
            from: emailData.from,
            subject: emailData.subject,
            textLength: emailData.text?.length
        });

        // ✅ EXTRACT CONVERSATION INFO FROM REPLY-TO ADDRESS
        const replyTo = emailData.to; // reply-user123-user456-advert789@reply.mypetconnect.co.uk
        const match = replyTo.match(/reply-(.+)-(.+)-(.+)@reply\.mypetconnect\.co\.uk/);

        if (!match) {
            console.error('❌ Invalid reply-to format:', replyTo);
            return res.status(400).send('Invalid reply format');
        }

        const [, senderId, recipientId, advertId] = match;
        const replyText = emailData.text || emailData.html;
        const fromEmail = emailData.from;

        console.log('📨 Parsed conversation:', {
            senderId,
            recipientId,
            advertId,
            fromEmail
        });

        // ✅ VERIFY THE SENDER IS AUTHORIZED
        const senderRef = doc(db, "users", senderId);
        const senderDoc = await getDoc(senderRef);

        if (!senderDoc.exists()) {
            console.error('❌ Sender not found:', senderId);
            return res.status(404).send('Sender not found');
        }

        const senderData = senderDoc.data();
        if (senderData.email !== fromEmail) {
            console.error('❌ Email mismatch. Expected:', senderData.email, 'Got:', fromEmail);
            return res.status(403).send('Unauthorized email address');
        }

        // ✅ CLEAN THE EMAIL REPLY TEXT
        const cleanedText = cleanEmailReply(replyText);

        if (!cleanedText || cleanedText.trim().length === 0) {
            console.error('❌ Empty message after cleaning');
            return res.status(400).send('Empty message');
        }

        // ✅ SAVE TO YOUR EXISTING MESSAGES COLLECTION
        const newMessage = {
            senderId: senderId,
            recipientId: recipientId,
            advertId: advertId !== 'general' ? advertId : null,
            text: cleanedText,
            timestamp: serverTimestamp(),
            read: false,
            fromEmail: true, // ✅ Flag to indicate this came from email
            originalEmailText: replyText, // Store original for debugging
            senderEmail: fromEmail
        };

        console.log('💾 Saving message to database:', {
            senderId,
            recipientId,
            textLength: cleanedText.length,
            fromEmail: true
        });

        // Add to messages collection (same as your regular messages)
        const messageRef = await addDoc(collection(db, "messages"), newMessage);

        console.log('✅ Message saved with ID:', messageRef.id);

        // ✅ UPDATE CONVERSATION METADATA
        const conversationId = [senderId, recipientId].sort().join('-');
        const conversationRef = doc(db, "conversations", conversationId);

        try {
            await updateDoc(conversationRef, {
                lastMessage: cleanedText,
                lastMessageTime: serverTimestamp(),
                lastMessageSender: senderId,
                [`unreadCount_${recipientId}`]: increment(1)
            });
        } catch (error) {
            // If conversation doesn't exist, create it
            if (error.code === 'not-found') {
                await setDoc(conversationRef, {
                    participants: [senderId, recipientId],
                    advertId: advertId !== 'general' ? advertId : null,
                    lastMessage: cleanedText,
                    lastMessageTime: serverTimestamp(),
                    lastMessageSender: senderId,
                    [`unreadCount_${senderId}`]: 0,
                    [`unreadCount_${recipientId}`]: 1,
                    createdAt: serverTimestamp()
                });
            }
        }

        // ✅ SEND NOTIFICATION TO RECIPIENT
        const recipientRef = doc(db, "users", recipientId);
        const recipientDoc = await getDoc(recipientRef);

        if (recipientDoc.exists()) {
            const recipientData = recipientDoc.data();

            // Only send notification if recipient allows them
            if (recipientData.allowNotifications !== false) {
                try {
                    // Get advert data if needed
                    let petName = 'your pet';
                    if (advertId && advertId !== 'general') {
                        const advertRef = doc(db, "allListings", advertId);
                        const advertDoc = await getDoc(advertRef);
                        if (advertDoc.exists()) {
                            petName = advertDoc.data().name || 'your pet';
                        }
                    }

                    // ✅ SEND EMAIL NOTIFICATION TO RECIPIENT
                    const emailPayload = {
                        emailData: {
                            recipientEmail: recipientData.email,
                            recipientId: recipientId,
                            senderId: senderId,
                            senderName: senderData.firstName || 'User',
                            petName: petName,
                            messageText: cleanedText,
                            messagePreview: cleanedText.length > 100 ? cleanedText.substring(0, 100) + '...' : cleanedText,
                            messageTime: new Date().toLocaleString(),
                            conversationUrl: `https://mypetconnect.co.uk/messages?recipient=${senderId}&advert=${advertId}`,
                            advertUrl: advertId && advertId !== 'general' ? `https://mypetconnect.co.uk/advert-details/${advertId}` : null,
                            messageTruncated: cleanedText.length > 100,
                            showStats: false,
                            unreadCount: 1,
                            isFileAttachment: false,
                            advertId: advertId !== 'general' ? advertId : null
                        }
                    };

                    // Call your existing message notification endpoint
                    const notificationUrl = `http://localhost:${PORT}/api/send-message-notification`;
                    const notificationResponse = await fetch(notificationUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(emailPayload)
                    });

                    if (notificationResponse.ok) {
                        console.log('📧 Notification sent to recipient');
                    } else {
                        console.error('❌ Failed to send notification');
                    }
                } catch (notificationError) {
                    console.error('❌ Failed to send notification:', notificationError);
                    // Don't fail the whole process if notification fails
                }
            }
        }

        console.log('✅ Email reply processed successfully');
        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Error processing email reply:', error);
        res.status(500).send('Error processing reply');
    }
});

// HELPER FUNCTION TO CLEAN EMAIL REPLIES
function cleanEmailReply(emailText) {
    if (!emailText) return '';

    console.log('🧹 Cleaning email text, original length:', emailText.length);

    // Remove HTML tags if present
    let cleaned = emailText.replace(/<[^>]*>/g, '');

    // Remove common email signatures and reply chains
    const cleanPatterns = [
        /-----Original Message-----[\s\S]*/i,
        /On .+ wrote:[\s\S]*/i,
        /From: .+[\s\S]*/i,
        /Sent from my \w+/i,
        /Get Outlook for \w+/i,
        /\r?\n\r?\n.*On .+ wrote:/s,
        /\r?\n\r?\n.*From:/s,
        /________________________________/g
    ];

    cleanPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Clean up extra whitespace
    cleaned = cleaned
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 10) // Only take first 10 lines
        .join('\n')
        .trim();

    // Limit length
    if (cleaned.length > 1000) {
        cleaned = cleaned.substring(0, 1000) + '...';
    }

    console.log('🧹 Cleaned text length:', cleaned.length);
    return cleaned;
}


// NEW: Advert approved email endpoint using SendGrid template
app.post('/api/send-advert-approved-email', async (req, res) => {
    console.log('📧 Advert approved email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    const { userData, advertData } = req.body;

    if (!userData || !advertData) {
        console.error('❌ Missing userData or advertData in request body');
        return res.status(400).send({ success: false, error: 'Missing userData or advertData' });
    }

    console.log('📧 Preparing to send advert approved email to:', userData.email);
    console.log('📧 Using template ID:', templates.ADVERT_APPROVED);

    const msg = {
        to: userData.email,
        from: {
            email: process.env.FROM_EMAIL,
            name: process.env.FROM_NAME || 'MyPetConnect',
        },
        replyTo: process.env.REPLY_TO_EMAIL,
        templateId: templates.ADVERT_APPROVED, // d-f8805dc163fc49d3b9355698d2f389c6
        dynamicTemplateData: {
            // User info
            userName: userData.firstName || 'Pet Lover',
            firstName: userData.firstName || 'Pet Lover',

            // Advert info
            petName: advertData.petName || 'your pet',
            advertType: advertData.type || 'pet',

            // URLs - CORRECTED
            advertUrl: `https://mypetconnect.co.uk/advert-details/${advertData.id}`,
            profileUrl: `https://mypetconnect.co.uk/profile/${userData.uid}`,
            myAdvertsUrl: `https://mypetconnect.co.uk/my-adverts`,
            createAdvertUrl: `https://mypetconnect.co.uk/create-advert`,
            helpUrl: `https://mypetconnect.co.uk/help`,

            // Footer
            currentYear: new Date().getFullYear(),
            supportEmail: 'support@mypetconnect.co.uk'
        }
    };

    console.log('📧 SendGrid dynamicTemplateData:', JSON.stringify(msg.dynamicTemplateData, null, 2));

    try {
        await sgMail.send(msg);
        console.log(`✅ Advert approved email sent to ${userData.email}`);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error('❌ SendGrid error:', err.response?.body || err.message);
        console.error('❌ Full error:', err);
        res.status(500).send({ success: false, error: err.message });
    }
});

// NEW: Advert rejected email endpoint using SendGrid template
app.post('/api/send-advert-rejected-email', async (req, res) => {
    console.log('📧 Advert rejected email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    const { userData, advertData, rejectionReason } = req.body;

    if (!userData || !advertData || !rejectionReason) {
        console.error('❌ Missing userData, advertData, or rejectionReason in request body');
        return res.status(400).send({ success: false, error: 'Missing required data' });
    }

    console.log('📧 Preparing to send advert rejected email to:', userData.email);
    console.log('📧 Using template ID:', templates.ADVERT_REJECTED);

    const msg = {
        to: userData.email,
        from: {
            email: process.env.FROM_EMAIL,
            name: process.env.FROM_NAME || 'MyPetConnect',
        },
        replyTo: process.env.REPLY_TO_EMAIL,
        templateId: templates.ADVERT_REJECTED, // d-2bf7a62047d6430580ac02e8a175e9d3
        dynamicTemplateData: {
            // User info
            userName: userData.firstName || 'Pet Lover',
            firstName: userData.firstName || 'Pet Lover',

            // Advert info
            petName: advertData.petName || 'your pet',
            advertType: advertData.type || 'pet',

            // Rejection info
            rejectionReason: rejectionReason,

            // ✅ FIXED URLs - Production domain with login redirect
            myAdvertsUrl: `https://mypetconnect.co.uk/my-adverts?login=true&tab=pending`,
            guidelinesUrl: `https://mypetconnect.co.uk/terms-of-service`,
            createAdvertUrl: `https://mypetconnect.co.uk/create-advert`,
            helpUrl: `https://mypetconnect.co.uk/help?tab=ticket`,
            supportUrl: `https://mypetconnect.co.uk/help?tab=ticket`,

            // Footer
            currentYear: new Date().getFullYear(),
            supportEmail: 'support@mypetconnect.co.uk'
        }
    };

    console.log('📧 SendGrid dynamicTemplateData:', JSON.stringify(msg.dynamicTemplateData, null, 2));

    try {
        await sgMail.send(msg);
        console.log(`✅ Advert rejected email sent to ${userData.email}`);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error('❌ SendGrid error:', err.response?.body || err.message);
        console.error('❌ Full error:', err);
        res.status(500).send({ success: false, error: err.message });
    }
});

// NEW: New review email endpoint using SendGrid template
app.post('/api/send-new-review-email', async (req, res) => {
    console.log('📧 New review email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    const { ownerData, reviewerData, reviewData, advertData } = req.body;

    if (!ownerData || !reviewerData || !reviewData || !advertData) {
        console.error('❌ Missing required data in request body');
        return res.status(400).send({ success: false, error: 'Missing required data' });
    }

    // Ensure ownerData has uid for profile URL
    if (!ownerData.uid) {
        console.error('❌ Missing ownerData.uid in request body');
        return res.status(400).send({ success: false, error: 'Missing owner UID' });
    }

    console.log('📧 Preparing to send new review email to:', ownerData.email);
    console.log('📧 Using template ID:', templates.NEW_REVIEW);

    const msg = {
        to: ownerData.email,
        from: {
            email: process.env.FROM_EMAIL,
            name: process.env.FROM_NAME || 'MyPetConnect',
        },
        replyTo: process.env.REPLY_TO_EMAIL,
        templateId: templates.NEW_REVIEW, // d-42c4264d5a8e4fa68d9fc94eb17f72b6
        dynamicTemplateData: {
            // Owner info
            userName: ownerData.firstName || 'Pet Owner',
            firstName: ownerData.firstName || 'Pet Owner',

            // Reviewer info
            reviewerName: reviewerData.name || 'A user',
            reviewerAvatar: reviewerData.avatar || null,

            // Pet/Advert info
            petName: advertData.petName || 'your pet',
            advertTitle: advertData.petName || 'your pet',

            // Review details
            starRating: reviewData.rating || 0,
            starDisplay: '⭐'.repeat(reviewData.rating || 0) + '☆'.repeat(5 - (reviewData.rating || 0)),
            reviewText: reviewData.text || '',
            reviewDate: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }),

            // ✅ REMOVED: Review response capabilities
            // canRespond: true,
            // respondUrl: removed

            // URLs - Direct to profile reviews tab
            reviewUrl: `http://localhost:5000/profile/${ownerData.uid}?tab=reviews`,
            profileUrl: `http://localhost:5000/profile/${ownerData.uid}`,
            advertUrl: `http://localhost:5000/advert-details/${advertData.id}`,

            // Stats (you can enhance these later)
            showStats: true,
            averageRating: reviewData.rating || 0, // You might want to calculate actual average
            totalReviews: 1, // You might want to count actual reviews

            // Footer
            currentYear: new Date().getFullYear(),
            supportEmail: 'support@mypetconnect.co.uk'
        }
    };

    console.log('📧 SendGrid dynamicTemplateData:', JSON.stringify(msg.dynamicTemplateData, null, 2));

    try {
        await sgMail.send(msg);
        console.log(`✅ New review email sent to ${ownerData.email}`);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error('❌ SendGrid error:', err.response?.body || err.message);
        console.error('❌ Full error:', err);
        res.status(500).send({ success: false, error: err.message });
    }
});


// NEW: Advert submitted email endpoint using SendGrid template
app.post('/api/send-advert-submitted-email', async (req, res) => {
    console.log('📧 Advert submitted email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            userEmail,
            userName,
            petName,
            advertType,
            categoryName,
            breedOrType,
            price,
            imageCount,
            userId
        } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !petName || !advertType || !categoryName) {
            console.log('❌ Missing required fields for advert submitted email');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userEmail', 'userName', 'petName', 'advertType', 'categoryName']
            });
        }

        const msg = {
            to: userEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templates.ADVERT_SUBMITTED,
            dynamicTemplateData: {
                user_name: userName,
                pet_name: petName,
                advert_type: advertType,
                category_name: categoryName,
                breed_or_type: breedOrType || 'Not specified',
                price: price ? `£${price}` : 'Price on application',
                image_count: imageCount || 0,
                my_adverts_url: `https://mypetconnect.co.uk/my-adverts?login=true&tab=pending`, // 👈 Added tab=pending
                current_year: new Date().getFullYear()
            }
        };

        console.log('📧 Sending advert submitted email with template data:', msg.dynamicTemplateData);

        await sgMail.send(msg);
        console.log('✅ Advert submitted email sent successfully');

        res.status(200).json({
            success: true,
            message: 'Advert submitted email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending advert submitted email:', error);

        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }

        res.status(500).json({
            error: 'Failed to send advert submitted email',
            details: error.message
        });
    }
});


// NEW: Password changed email endpoint using SendGrid template
app.post('/api/send-password-changed-email', async (req, res) => {
    console.log('📧 Password changed email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            userEmail,
            userName,
            changeMethod, // 'reset' or 'profile'
            userAgent,
            ipAddress,
            timestamp,
            userId
        } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !changeMethod || !userId) {
            console.log('❌ Missing required fields for password changed email');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userEmail', 'userName', 'changeMethod', 'userId']
            });
        }

        // ✅ IMPROVED: Better timestamp formatting
        const formattedTimestamp = timestamp || new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        const msg = {
            to: userEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templates.PASSWORD_CHANGED, // d-4961110921694f6a9321fda734fd2211
            dynamicTemplateData: {
                user_name: userName,
                firstName: userName.split(' ')[0], // ✅ IMPROVED: Match email template variable
                change_method: changeMethod,
                change_method_text: changeMethod === 'reset' ? 'password reset link' : 'account settings',

                // ✅ IMPROVED: Separate date and time for template flexibility
                changeDate: formattedTimestamp.split(' at ')[0] || formattedTimestamp.split(',')[0],
                changeTime: formattedTimestamp.split(' at ')[1] || formattedTimestamp.split(', ')[1],

                deviceInfo: userAgent || 'Unknown device', // ✅ IMPROVED: Match template variable
                ipAddress: ipAddress || 'Unknown location',

                // Security URLs
                loginUrl: `https://mypetconnect.co.uk/profile/${userId}?login=true`, // ✅ IMPROVED: Match template variable
                security_url: `https://mypetconnect.co.uk/profile/${userId}?login=true&tab=password`,
                help_url: `https://mypetconnect.co.uk/help`,

                // ✅ IMPROVED: Report unauthorized change with better message
                report_unauthorized_url: `https://mypetconnect.co.uk/help?tab=ticket&subject=${encodeURIComponent('Unauthorized Password Change')}&message=${encodeURIComponent(`I did not request this password change that occurred on ${formattedTimestamp}. Please investigate this security issue immediately.

Account Details:
- Email: ${userEmail}
- Change Method: ${changeMethod === 'reset' ? 'Password Reset Link' : 'Account Settings'}
- IP Address: ${ipAddress || 'Unknown'}
- Device: ${userAgent || 'Unknown'}

Please secure my account and investigate this unauthorized access.`)}`,

                support_email: 'support@mypetconnect.co.uk',

                // Footer
                currentYear: new Date().getFullYear(), // ✅ IMPROVED: Match template variable

                // Security tips
                show_security_tips: true,
                was_requested: changeMethod === 'profile', // true if changed from profile, false if reset

                // ✅ NEW: Show report section
                show_report_section: true
            }
        };

        console.log('📧 Sending password changed email with template data:', msg.dynamicTemplateData);

        await sgMail.send(msg);
        console.log('✅ Password changed email sent successfully');

        res.status(200).json({
            success: true,
            message: 'Password changed email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending password changed email:', error);

        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }

        res.status(500).json({
            error: 'Failed to send password changed email',
            details: error.message
        });
    }
});


// NEW: Advert expiring email endpoint using SendGrid template
app.post('/api/send-advert-expiring-email', async (req, res) => {
    console.log('📧 Advert expiring email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            userEmail,
            userName,
            advertData,
            daysLeft,
            userId
        } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !advertData || !daysLeft) {
            console.log('❌ Missing required fields for advert expiring email');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userEmail', 'userName', 'advertData', 'daysLeft']
            });
        }

        // Format expiry date
        const expiryDate = new Date(advertData.expiresAt.toDate ? advertData.expiresAt.toDate() : advertData.expiresAt);
        const formattedExpiryDate = expiryDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const msg = {
            to: userEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templates.ADVERT_EXPIRING, // d-8d9e3e9fde62448181217b7b2823d891
            dynamicTemplateData: {
                // User info
                user_name: userName,
                first_name: userName.split(' ')[0],

                // Advert info
                pet_name: advertData.name || advertData.title || 'your pet',
                advert_title: advertData.name || advertData.title || 'your pet',
                breed_or_type: advertData.breedOrType || 'Unknown breed',
                category_name: advertData.category ? advertData.category.charAt(0).toUpperCase() + advertData.category.slice(1) : 'Pet',
                advert_type: advertData.intent === 'stud' ? 'Stud Service' : advertData.intent === 'rescue' ? 'For Adoption' : 'For Sale',

                // Pricing info
                price: advertData.price ? `£${parseInt(advertData.price).toLocaleString()}` :
                    advertData.fee ? `£${parseInt(advertData.fee).toLocaleString()}` : 'Price on application',

                // Expiry info
                days_left: daysLeft,
                days_text: daysLeft === 1 ? 'day' : 'days',
                expiry_date: formattedExpiryDate,

                // Main image
                main_image_url: advertData.images && advertData.images.length > 0 ?
                    advertData.images[advertData.mainImageIndex || 0] : null,

                // Action URLs
                renew_url: `${process.env.APP_URL}/my-adverts`,
                edit_advert_url: `${process.env.APP_URL}/edit-advert/${advertData.id}`,
                view_advert_url: `${process.env.APP_URL}/advert-details/${advertData.id}`,
                my_adverts_url: `${process.env.APP_URL}/my-adverts`,
                create_new_url: `${process.env.APP_URL}/create-advert`,

                // Support info
                help_url: `${process.env.APP_URL}/help`,
                support_email: 'support@mypetconnect.co.uk',

                // Footer
                current_year: new Date().getFullYear(),

                // Display options
                show_image: advertData.images && advertData.images.length > 0,
                show_price: !!(advertData.price || advertData.fee),
                urgent_warning: daysLeft <= 3, // Show urgent styling if 3 days or less

                // Stats (if you want to include performance data)
                show_stats: false, // Set to true if you want to include view counts, etc.
                view_count: 0,
                inquiry_count: 0
            }
        };

        console.log('📧 Sending advert expiring email with template data:', JSON.stringify(msg.dynamicTemplateData, null, 2));

        await sgMail.send(msg);
        console.log(`✅ Advert expiring email sent to ${userEmail} for advert: ${advertData.name || advertData.title}`);

        res.status(200).json({
            success: true,
            message: 'Advert expiring email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending advert expiring email:', error);

        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }

        res.status(500).json({
            error: 'Failed to send advert expiring email',
            details: error.message
        });
    }
});



// UPDATED: Ticket submitted email endpoint - Handle missing userEmail/userName
app.post('/api/send-ticket-submitted-email', async (req, res) => {
    console.log('📧 Ticket submitted email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            userEmail,
            userName,
            ticketNumber,
            subject,
            ticketType,
            priority,
            message,
            userId,
            // Also check for alternative field names
            email,
            name
        } = req.body;

        // Use either the expected fields or the alternative ones
        const finalUserEmail = userEmail || email;
        const finalUserName = userName || name;

        // Validate required fields
        if (!finalUserEmail || !finalUserName || !ticketNumber || !subject) {
            console.log('❌ Missing required fields for ticket submitted email');
            console.log('❌ Available fields:', Object.keys(req.body));
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userEmail (or email)', 'userName (or name)', 'ticketNumber', 'subject'],
                received: Object.keys(req.body)
            });
        }

        console.log('📧 Using email:', finalUserEmail);
        console.log('📧 Using name:', finalUserName);

        // Determine priority color for template
        const priorityColor = priority === 'high' ? '#dc2626' : priority === 'medium' ? '#d97706' : '#059669';

        const msg = {
            to: finalUserEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templates.TICKET_SUBMITTED, // d-6c179356393347f39bfb04e6dce0d51d
            dynamicTemplateData: {
                // ✅ CORRECTED VARIABLE NAMES TO MATCH SENDGRID TEMPLATE
                userName: finalUserName,
                ticketId: ticketNumber,
                category: ticketType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                priority: priority.charAt(0).toUpperCase() + priority.slice(1),
                priorityColor: priorityColor,
                subject: subject,
                message: message,

                // URLs - CORRECTED NAMES
                ticketUrl: `${process.env.APP_URL}/help?tab=tickets`,
                helpCenterUrl: `${process.env.APP_URL}/help`,

                // Footer
                currentYear: new Date().getFullYear(),

                // Response time logic
                responseTime: 'normal'
            }
        };

        console.log('📧 Using template ID:', templates.TICKET_SUBMITTED);
        console.log('📧 Sending ticket submitted email with CORRECTED template data:', JSON.stringify(msg.dynamicTemplateData, null, 2));

        await sgMail.send(msg);
        console.log(`✅ Ticket submitted email sent to ${finalUserEmail} for ticket: ${ticketNumber}`);

        res.status(200).json({
            success: true,
            message: 'Ticket submitted email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending ticket submitted email:', error);

        if (error.response) {
            console.error('❌ SendGrid error details:', error.response.body);
            console.error('❌ SendGrid status code:', error.response.statusCode);
        }

        res.status(500).json({
            error: 'Failed to send ticket submitted email',
            details: error.message,
            sendgridError: error.response?.body || 'Unknown SendGrid error'
        });
    }
});

// FIXED: Ticket updated email endpoint using SendGrid template
app.post('/api/send-ticket-updated-email', async (req, res) => {
    console.log('📧 Ticket updated email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            userEmail,
            userName,
            ticketNumber,
            subject,
            updateType, // 'reply', 'status_change', 'priority_change', 'assignment'
            newStatus,
            newPriority,
            adminReply,
            adminName,
            userId
        } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !ticketNumber || !updateType) {
            console.log('❌ Missing required fields for ticket updated email');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userEmail', 'userName', 'ticketNumber', 'updateType'],
                received: Object.keys(req.body)
            });
        }

        // Generate agent initials
        const agentInitials = adminName ?
            adminName.split(' ').map(n => n[0]).join('').toUpperCase() :
            'ST';

        // Determine status color
        const getStatusColor = (status) => {
            switch(status) {
                case 'open': return '#10b981';
                case 'pending': return '#f59e0b';
                case 'resolved': return '#059669';
                case 'closed': return '#6b7280';
                default: return '#6b7280';
            }
        };

        const msg = {
            to: userEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templates.TICKET_UPDATED, // d-d0bad97e0acb4241bbc9ac49e19c2dba
            dynamicTemplateData: {
                // ✅ CORRECTED VARIABLE NAMES TO MATCH SENDGRID TEMPLATE
                userName: userName,              // ✅ FIXED: was user_name
                ticketId: ticketNumber,          // ✅ FIXED: was ticket_number
                subject: subject,                // ✅ FIXED: was ticket_subject
                status: newStatus || 'Open',
                statusColor: getStatusColor(newStatus),
                agentName: adminName || 'Support Team',
                agentInitials: adminName ? adminName.split(' ').map(n => n[0]).join('').toUpperCase() : 'ST',
                replyMessage: adminReply || '',  // ✅ FIXED: was admin_reply
                replyTime: new Date().toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                ticketUrl: `${process.env.APP_URL}/help?tab=tickets`,
                helpCenterUrl: `${process.env.APP_URL}/help`,
                currentYear: new Date().getFullYear()
            }
        };

        console.log('📧 Using template ID:', templates.TICKET_UPDATED);
        console.log('📧 Sending ticket updated email with template data:', JSON.stringify(msg.dynamicTemplateData, null, 2));

        await sgMail.send(msg);
        console.log(`✅ Ticket updated email sent to ${userEmail} for ticket: ${ticketNumber}`);

        res.status(200).json({
            success: true,
            message: 'Ticket updated email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending ticket updated email:', error);

        if (error.response) {
            console.error('❌ SendGrid error details:', error.response.body);
            console.error('❌ SendGrid status code:', error.response.statusCode);
        }

        res.status(500).json({
            error: 'Failed to send ticket updated email',
            details: error.message,
            sendgridError: error.response?.body || 'Unknown SendGrid error'
        });
    }
});

// NEW: Ticket closed email endpoint using SendGrid template
app.post('/api/send-ticket-closed-email', async (req, res) => {
    console.log('📧 Ticket closed email endpoint called');
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            userEmail,
            userName,
            ticketNumber,
            subject,
            closedBy,
            resolutionSummary,
            createdDate,
            resolutionTime,
            userId
        } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !ticketNumber) {
            console.log('❌ Missing required fields for ticket closed email');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userEmail', 'userName', 'ticketNumber'],
                received: Object.keys(req.body)
            });
        }

        const msg = {
            to: userEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templates.TICKET_CLOSED,
            dynamicTemplateData: {
                userName: userName,
                ticketId: ticketNumber,
                subject: subject || 'Your Support Ticket',
                closedBy: closedBy || 'Support Team',

                // Optional resolution info
                resolutionSummary: resolutionSummary || null,

                // Dates and timing
                createdDate: createdDate || 'N/A',
                resolutionTime: resolutionTime || 'N/A',

                // URLs
                ticketUrl: `${process.env.APP_URL}/help?tab=tickets`,
                newTicketUrl: `${process.env.APP_URL}/help?tab=ticket`,
                helpCenterUrl: `${process.env.APP_URL}/help`,


                // Footer
                currentYear: new Date().getFullYear(),

                // Reopen policy
                reopenDays: 30
            }
        };

        console.log('📧 Using template ID:', templates.TICKET_CLOSED);
        console.log('📧 Sending ticket closed email with template data:', JSON.stringify(msg.dynamicTemplateData, null, 2));

        await sgMail.send(msg);
        console.log(`✅ Ticket closed email sent to ${userEmail} for ticket: ${ticketNumber}`);

        res.status(200).json({
            success: true,
            message: 'Ticket closed email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending ticket closed email:', error);

        if (error.response) {
            console.error('❌ SendGrid error details:', error.response.body);
            console.error('❌ SendGrid status code:', error.response.statusCode);
        }

        res.status(500).json({
            error: 'Failed to send ticket closed email',
            details: error.message,
            sendgridError: error.response?.body || 'Unknown SendGrid error'
        });
    }
});

// COMPLETE DEBUGGING SOLUTION for the dog name issue

// 1. UPDATED Review response endpoint with extensive debugging
app.post('/api/send-review-response-email', async (req, res) => {
    try {
        console.log('📧 =================================');
        console.log('📧 REVIEW RESPONSE EMAIL DEBUG');
        console.log('📧 =================================');
        console.log('📧 Full Request body:', JSON.stringify(req.body, null, 2));

        // Log each field individually
        console.log('📧 Individual fields:');
        console.log('📧 - name:', req.body.name);
        console.log('📧 - dogName:', req.body.dogName);
        console.log('📧 - petName:', req.body.petName);
        console.log('📧 - advertData:', req.body.advertData);

        const {
            reviewerEmail,
            reviewerName,
            senderName,
            reviewText,
            responseText,
            name,           // This should be your dog's name from DB
            dogName,
            petName,
            profileUrl,
            isOrganization,
            advertData
        } = req.body;

        // Validate required fields
        if (!reviewerEmail || !reviewerName || !senderName || !responseText) {
            console.error('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                received: Object.keys(req.body)
            });
        }

        // ✅ COMPREHENSIVE dog name resolution with detailed logging
        let finalDogName = null;

        console.log('🐕 RESOLVING DOG NAME:');

        if (name) {
            finalDogName = name;
            console.log('🐕 ✅ Found dog name in "name" field:', name);
        } else if (dogName) {
            finalDogName = dogName;
            console.log('🐕 ✅ Found dog name in "dogName" field:', dogName);
        } else if (petName) {
            finalDogName = petName;
            console.log('🐕 ✅ Found dog name in "petName" field:', petName);
        } else if (advertData?.name) {
            finalDogName = advertData.name;
            console.log('🐕 ✅ Found dog name in "advertData.name":', advertData.name);
        } else if (advertData?.petName) {
            finalDogName = advertData.petName;
            console.log('🐕 ✅ Found dog name in "advertData.petName":', advertData.petName);
        } else if (advertData?.title) {
            finalDogName = advertData.title;
            console.log('🐕 ✅ Found dog name in "advertData.title":', advertData.title);
        } else {
            console.log('🐕 ❌ NO DOG NAME FOUND - using fallback');
            finalDogName = null; // Don't use fallback, let template handle it
        }

        console.log('🐕 FINAL DOG NAME:', finalDogName);

        const templateId = templates.REVIEW_RESPONSE;

        // ✅ SIMPLE template data - only send dogName if we have it
        const templateData = {
            reviewerName: reviewerName,
            senderName: senderName,
            reviewText: reviewText || 'No review text provided',
            responseText: responseText,
            profileUrl: profileUrl || `https://mypetconnect.co.uk/profile/${req.body.senderId || ''}`,
            isOrganization: isOrganization || false,
            currentYear: new Date().getFullYear(),
            helpCenterUrl: 'https://mypetconnect.co.uk/help'
        };

        // Only add dogName if we actually have one
        if (finalDogName) {
            templateData.dogName = finalDogName;
            console.log('🐕 ✅ Added dogName to template data:', finalDogName);
        } else {
            console.log('🐕 ⚠️ NOT adding dogName to template data - will show generic message');
        }

        console.log('📧 =================================');
        console.log('📧 TEMPLATE DATA BEING SENT:');
        console.log('📧 =================================');
        console.log(JSON.stringify(templateData, null, 2));
        console.log('📧 =================================');

        // Send email
        const emailData = {
            to: reviewerEmail,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME || 'MyPetConnect'
            },
            replyTo: process.env.REPLY_TO_EMAIL,
            templateId: templateId,
            dynamicTemplateData: templateData
        };

        await sgMail.send(emailData);

        console.log(`✅ Review response email sent successfully!`);
        console.log(`📧 To: ${reviewerEmail}`);
        console.log(`📧 From: ${senderName}`);
        console.log(`📧 Dog: ${finalDogName || 'Not specified'}`);

        res.json({
            success: true,
            message: 'Review response email sent successfully',
            debug: {
                dogNameFound: !!finalDogName,
                dogName: finalDogName,
                templateDataSent: templateData
            }
        });

    } catch (error) {
        console.error('❌ Error sending review response email:', error);

        if (error.response) {
            console.error('❌ SendGrid error details:', error.response.body);
        }

        res.status(500).json({
            success: false,
            error: error.message,
            sendgridError: error.response?.body || 'Unknown SendGrid error'
        });
    }
});

// 2. TEST ENDPOINT to help you debug
app.post('/api/test-review-response-data', (req, res) => {
    console.log('🧪 TEST ENDPOINT - What data is your frontend sending?');
    console.log('🧪 Full request body:', JSON.stringify(req.body, null, 2));

    const dogNameSources = {
        name: req.body.name,
        dogName: req.body.dogName,
        petName: req.body.petName,
        'advertData.name': req.body.advertData?.name,
        'advertData.petName': req.body.advertData?.petName,
        'advertData.title': req.body.advertData?.title
    };

    console.log('🧪 Dog name sources:', dogNameSources);

    res.json({
        message: 'Test endpoint - check console for full data',
        dogNameSources,
        allFields: Object.keys(req.body)
    });
});



// 3. FRONTEND DEBUGGING - Add this to your frontend code that calls the email API
/*
// ADD THIS TO YOUR FRONTEND BEFORE SENDING THE EMAIL:
console.log('🔍 FRONTEND DEBUG - Data being sent to email API:');
console.log('🔍 Review data:', reviewData);
console.log('🔍 Pet/Dog name:', reviewData.name || 'NOT FOUND');
console.log('🔍 Full email payload:', emailPayload);

// EXAMPLE of what your frontend should send:
const emailPayload = {
    reviewerEmail: review.userEmail,
    reviewerName: review.userName,
    senderName: currentUser.name,
    reviewText: review.text,
    responseText: responseText,
    name: review.dogName || review.petName || advertData.name, // ← Make sure this exists!
    profileUrl: profileUrl,
    isOrganization: currentUser.accountType === 'organization'
};

// Send to your API
fetch('/api/send-review-response-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailPayload)
});
*/

app.post('/api/satisfaction-rating', async (req, res) => {
    const { ticketId, rating, userId } = req.body;

    // Save rating to database
    // Send thank you response
    // Optional: trigger follow-up actions
});

// Start the server - ADD THIS AT THE VERY END
app.listen(PORT, () => {
    console.log(`✅ Email API listening at http://localhost:${PORT}`);
});