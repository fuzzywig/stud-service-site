const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { getAuth } = require("firebase-admin/auth");
const { defineSecret } = require("firebase-functions/params");

// Define SendGrid API key as a secret
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");


initializeApp();
const db = getFirestore();
const storage = getStorage().bucket();
const auth = getAuth();

// Helper function to check if user is admin
const isAdmin = async (uid) => {
    try {
        // Check users collection first
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data().isAdmin === true) {
            return true;
        }

        // Then check adminUsers collection
        const adminQuery = await db.collection('adminUsers').where('uid', '==', uid).get();
        if (!adminQuery.empty) {
            return true; // Staff members are considered admin
        }

        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

// 📧 NEWSLETTER FUNCTIONS

// Add newsletter subscriber and sync to SendGrid
exports.addNewsletterSubscriber = onCall({ secrets: [sendgridApiKey] }, async (request) => {
    try {
        const { email } = request.data;

        // Validate email
        if (!email || !email.includes('@')) {
            throw new Error('Valid email is required');
        }

        // Check if email already exists
        const existingSubscriber = await db.collection('newsletter_subscribers')
            .where('email', '==', email)
            .get();

        if (!existingSubscriber.empty) {
            throw new Error('Email already subscribed');
        }

        // Add to Firestore
        const subscriberData = {
            email: email,
            subscribedAt: Timestamp.now(),
            status: 'active',
            source: 'website',
            preferences: {
                frequency: 'weekly'
            }
        };

        const docRef = await db.collection('newsletter_subscribers').add(subscriberData);
        console.log(`Successfully added ${email} to Firestore`);

        // Add to SendGrid Contacts
        try {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(sendgridApiKey.value());

            const request = {
                method: 'PUT',
                url: '/v3/marketing/contacts',
                body: {
                    contacts: [{
                        email: email,
                        custom_fields: {
                            source: 'website',
                            subscribed_date: new Date().toISOString().split('T')[0]
                        }
                    }]
                }
            };

            await sgMail.request(request);

            // Update Firestore doc to mark as synced to SendGrid
            await docRef.update({
                sendgridSynced: true,
                sendgridSyncedAt: Timestamp.now()
            });

            console.log(`Successfully synced ${email} to SendGrid`);

        } catch (sendgridError) {
            console.error('SendGrid sync failed:', sendgridError);

            // Update Firestore to mark sync failure (but keep the subscriber)
            await docRef.update({
                sendgridSynced: false,
                sendgridError: sendgridError.message
            });

            // Don't throw error - subscriber is still saved to Firestore
            console.log(`Email saved to Firestore but SendGrid sync failed for ${email}`);
        }

        return {
            success: true,
            message: 'Successfully subscribed to newsletter!',
            id: docRef.id
        };

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        throw new Error(error.message);
    }
});

// Manually sync existing subscribers to SendGrid
exports.syncExistingSubscribersToSendGrid = onCall({ secrets: [sendgridApiKey] }, async (request) => {
    // Check if user is authenticated and is admin
    if (!request.auth) {
        throw new Error('Authentication required');
    }

    const adminStatus = await isAdmin(request.auth.uid);
    if (!adminStatus) {
        throw new Error('Admin access required');
    }

    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sendgridApiKey.value());

        // Get all subscribers not synced to SendGrid
        const unsynced = await db.collection('newsletter_subscribers')
            .where('sendgridSynced', '!=', true)
            .where('status', '==', 'active')
            .get();

        const contacts = [];
        const updatePromises = [];

        unsynced.forEach(doc => {
            const data = doc.data();
            contacts.push({
                email: data.email,
                custom_fields: {
                    source: data.source || 'website',
                    subscribed_date: data.subscribedAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
                }
            });

            // Prepare update to mark as synced
            updatePromises.push(
                doc.ref.update({
                    sendgridSynced: true,
                    sendgridSyncedAt: Timestamp.now()
                })
            );
        });

        if (contacts.length === 0) {
            return { success: true, message: 'No subscribers to sync', count: 0 };
        }

        // Send to SendGrid in batches of 1000 (SendGrid limit)
        const batchSize = 1000;
        for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, i + batchSize);

            const request = {
                method: 'PUT',
                url: '/v3/marketing/contacts',
                body: { contacts: batch }
            };

            await sgMail.request(request);
        }

        // Update Firestore documents
        await Promise.all(updatePromises);

        return {
            success: true,
            message: `Successfully synced ${contacts.length} subscribers to SendGrid`,
            count: contacts.length
        };

    } catch (error) {
        console.error('Bulk sync error:', error);
        throw new Error(error.message);
    }
});

// Handle SendGrid webhooks for unsubscribes
exports.handleSendGridWebhook = onRequest(async (req, res) => {
    try {
        const events = req.body;

        for (const event of events) {
            if (event.event === 'unsubscribe' || event.event === 'spamreport') {
                const email = event.email;

                // Update status in Firestore
                const snapshot = await db.collection('newsletter_subscribers')
                    .where('email', '==', email)
                    .get();

                const updates = [];
                snapshot.forEach(doc => {
                    updates.push(doc.ref.update({
                        status: 'unsubscribed',
                        unsubscribedAt: Timestamp.now(),
                        unsubscribeReason: event.event
                    }));
                });

                await Promise.all(updates);
                console.log(`Updated unsubscribe status for ${email}`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

// EXISTING STAFF MANAGEMENT FUNCTIONS

// ✅ NEW: Function to verify existing staff member's email
exports.verifyStaffEmail = onCall(async (request) => {
    try {
        console.log('verifyStaffEmail called by:', request.auth?.uid);

        // Check if user is authenticated
        if (!request.auth) {
            throw new Error('Authentication required');
        }

        // For testing purposes, we'll skip the admin check initially
        // Uncomment this after testing if you want to restrict access:
        /*
        const adminStatus = await isAdmin(request.auth.uid);
        if (!adminStatus) {
            throw new Error('Admin access required');
        }
        */

        // Verify the specific staff member's email
        const staffUid = '2b37GlMGj1ZUbnkusyXgQBQwiIb2';

        console.log(`Attempting to verify email for UID: ${staffUid}`);

        await auth.updateUser(staffUid, {
            emailVerified: true
        });

        console.log(`Email successfully verified for: ${staffUid}`);

        return {
            success: true,
            message: 'Staff member email verified successfully',
            uid: staffUid
        };

    } catch (error) {
        console.error('Error in verifyStaffEmail:', error);
        throw new Error(`Failed to verify email: ${error.message}`);
    }
});

// 👥 Create staff accounts (FIXED)
exports.createStaffAccount = onCall(async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new Error('User must be authenticated to create staff accounts');
    }

    // Check if user is admin
    const adminStatus = await isAdmin(request.auth.uid);
    if (!adminStatus) {
        throw new Error('Only administrators can create staff accounts');
    }

    // Validate required data
    const { email, password, staffData } = request.data;

    if (!email || !password || !staffData) {
        throw new Error('Email, password, and staff data are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }

    try {
        console.log('Creating staff account for:', email);

        // ✅ FIX 1: Create the Firebase Auth user with VERIFIED EMAIL
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            emailVerified: true, // ✅ Auto-verify staff emails
            disabled: false
        });

        console.log('Firebase Auth user created:', userRecord.uid);

        // Prepare the admin user data for Firestore
        const adminUserData = {
            ...staffData,
            uid: userRecord.uid,
            email: email,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            createdBy: request.auth.uid,
            updatedBy: request.auth.uid
        };

        // Remove password from stored data (never store passwords in Firestore)
        delete adminUserData.password;
        delete adminUserData.confirmPassword;

        // ✅ FIX 2: Use the UID as document ID instead of auto-generated ID
        await db.collection('adminUsers').doc(userRecord.uid).set(adminUserData);

        console.log('Admin user document created with UID as document ID:', userRecord.uid);

        // Return success response
        return {
            success: true,
            uid: userRecord.uid,
            documentId: userRecord.uid, // Document ID is now the same as UID
            message: 'Staff account created successfully'
        };

    } catch (error) {
        console.error('Error creating staff account:', error);

        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            throw new Error('An account with this email already exists');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak');
        }

        // Generic error
        throw new Error('Failed to create staff account: ' + error.message);
    }
});

// 🔄 Migration function to fix admin users document structure
exports.migrateAdminUsers = onCall(async (request) => {
    // Check if user is admin
    const adminStatus = await isAdmin(request.auth.uid);
    if (!adminStatus) {
        throw new Error('Admin access required');
    }

    try {
        console.log('Starting admin users migration...');

        // Get all documents from adminUsers collection
        const adminUsersSnapshot = await db.collection('adminUsers').get();

        const migrationResults = [];

        for (const doc of adminUsersSnapshot.docs) {
            const data = doc.data();
            const currentDocId = doc.id;
            const userUid = data.uid;

            console.log(`Processing document: ${currentDocId}, UID: ${userUid}`);

            // If document ID is already the UID, skip
            if (currentDocId === userUid) {
                console.log(`Document ${currentDocId} already has correct structure`);
                migrationResults.push({
                    uid: userUid,
                    email: data.email,
                    status: 'already_correct'
                });
                continue;
            }

            // Create new document with UID as document ID
            await db.collection('adminUsers').doc(userUid).set(data);
            console.log(`Created new document with UID as ID: ${userUid}`);

            // Delete old document with random ID
            await doc.ref.delete();
            console.log(`Deleted old document: ${currentDocId}`);

            // Also verify the user's email in Firebase Auth
            try {
                await auth.updateUser(userUid, {
                    emailVerified: true
                });
                console.log(`Email verified for user: ${userUid}`);
            } catch (authError) {
                console.error(`Failed to verify email for ${userUid}:`, authError);
            }

            migrationResults.push({
                uid: userUid,
                email: data.email,
                oldDocId: currentDocId,
                newDocId: userUid,
                status: 'migrated'
            });
        }

        console.log('Migration completed:', migrationResults);

        return {
            success: true,
            message: 'Admin users migration completed',
            results: migrationResults
        };

    } catch (error) {
        console.error('Migration error:', error);
        throw new Error(`Migration failed: ${error.message}`);
    }
});

// ✅ Quick fix for existing staff member
exports.verifyExistingStaff = onCall(async (request) => {
    // Check if user is admin
    const adminStatus = await isAdmin(request.auth.uid);
    if (!adminStatus) {
        throw new Error('Admin access required');
    }

    try {
        // Verify the specific staff member's email
        const staffUid = '2b37GlMGj1ZUbnkusyXgQBQwiIb2';

        await auth.updateUser(staffUid, {
            emailVerified: true
        });

        console.log(`Email verified for staff member: ${staffUid}`);

        return {
            success: true,
            message: 'Staff member email verified successfully',
            uid: staffUid
        };

    } catch (error) {
        console.error('Error verifying staff email:', error);
        throw new Error(`Failed to verify email: ${error.message}`);
    }
});

// 📝 Update staff accounts (NEW)
exports.updateStaffAccount = onCall(async (request) => {
    // Check authentication and admin status
    if (!request.auth) {
        throw new Error('Authentication required');
    }

    const adminStatus = await isAdmin(request.auth.uid);
    if (!adminStatus) {
        throw new Error('Admin access required');
    }

    const { documentId, staffData } = request.data;

    if (!documentId || !staffData) {
        throw new Error('Document ID and staff data required');
    }

    try {
        // Update the Firestore document
        await db.collection('adminUsers').doc(documentId).update({
            ...staffData,
            updatedAt: Timestamp.now(),
            updatedBy: request.auth.uid
        });

        return { success: true, message: 'Staff account updated successfully' };

    } catch (error) {
        console.error('Error updating staff account:', error);
        throw new Error('Failed to update staff account');
    }
});

// 🗑️ Delete staff accounts (NEW)
exports.deleteStaffAccount = onCall(async (request) => {
    // Check authentication and admin status
    if (!request.auth) {
        throw new Error('Authentication required');
    }

    const adminStatus = await isAdmin(request.auth.uid);
    if (!adminStatus) {
        throw new Error('Admin access required');
    }

    const { uid, documentId } = request.data;

    if (!uid || !documentId) {
        throw new Error('UID and document ID required');
    }

    try {
        // Delete from Firebase Auth
        await auth.deleteUser(uid);

        // Delete from Firestore
        await db.collection('adminUsers').doc(documentId).delete();

        return { success: true, message: 'Staff account deleted successfully' };

    } catch (error) {
        console.error('Error deleting staff account:', error);
        throw new Error('Failed to delete staff account');
    }
});

// EXISTING SCHEDULED FUNCTIONS

// 🔄 Auto-unpublish adverts older than 30 days (EXISTING)
exports.unpublishOldAdverts = onSchedule("every 24 hours", async () => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const snapshot = await db.collection("studAds")
        .where("approved", "==", true)
        .where("createdAt", "<=", cutoff)
        .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
        batch.update(doc.ref, {
            approved: false,
            expired: true,
            status: "expired",
            unpublishedAt: Timestamp.now()
        });
    });

    await batch.commit();
    console.log(`Unpublished ${snapshot.size} adverts older than 30 days`);
});

// 🗑️ Auto-delete adverts that expired over 14 days ago (EXISTING)
exports.deleteOldExpiredAdverts = onSchedule("every 24 hours", async () => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
    const snapshot = await db.collection("studAds")
        .where("expired", "==", true)
        .where("unpublishedAt", "<=", cutoff)
        .get();

    let deletedCount = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const advertId = docSnap.id;

        // Skip if republished within last 14 days
        if (data.resubmittedAt && data.resubmittedAt.toDate() > cutoff.toDate()) {
            console.log(`Skipping recently republished advert: ${advertId}`);
            continue;
        }

        const images = Array.isArray(data.images) ? data.images : [];

        for (const url of images) {
            try {
                const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
                await storage.file(path).delete();
                console.log(`Deleted image: ${path}`);
            } catch (err) {
                console.warn(`Failed to delete image ${url}:`, err.message);
            }
        }

        await docSnap.ref.delete();
        deletedCount++;
        console.log(`Deleted advert: ${advertId}`);
    }

    console.log(`Deleted ${deletedCount} expired adverts`);
});



// 🗺️ SITEMAP GENERATION FUNCTIONS

const SITEMAP_DOMAIN = 'https://mypetconnect.co.uk';

// Static routes configuration
const staticRoutes = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/browse', changefreq: 'daily', priority: 0.9 },
    { path: '/top-studs', changefreq: 'weekly', priority: 0.8 },
    { path: '/about', changefreq: 'monthly', priority: 0.7 },
    { path: '/new-advert', changefreq: 'monthly', priority: 0.8 },
    { path: '/dog-rescue', changefreq: 'weekly', priority: 0.7 },
    { path: '/register', changefreq: 'monthly', priority: 0.6 },
    { path: '/breeding-guide', changefreq: 'monthly', priority: 0.8 },
    { path: '/help', changefreq: 'monthly', priority: 0.6 },
    { path: '/blog', changefreq: 'weekly', priority: 0.8 },
    { path: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
    { path: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
    { path: '/cookie-policy', changefreq: 'yearly', priority: 0.3 },
];

// Generate sitemap XML content
async function generateSitemapContent() {
    try {
        console.log('🚀 Generating sitemap content...');

        // Fetch approved adverts from allListings collection
        const advertsSnapshot = await db.collection('allListings')
            .where('approved', '==', true)
            .get();

        const advertRoutes = advertsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                path: `/advert-details/${doc.id}`,
                changefreq: 'weekly',
                priority: 0.6,
                lastmod: data.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    data.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    new Date().toISOString().split('T')[0]
            };
        });

        // Fetch published blog posts
        const blogSnapshot = await db.collection('blogPosts')
            .where('status', '==', 'published')
            .get();

        const blogRoutes = blogSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                path: `/blog/${data.slug || doc.id}`,
                changefreq: 'monthly',
                priority: 0.7,
                lastmod: data.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    data.publishedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    new Date().toISOString().split('T')[0]
            };
        });

        // Combine all routes
        const allRoutes = [...staticRoutes, ...advertRoutes, ...blogRoutes];
        const currentDate = new Date().toISOString().split('T')[0];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${SITEMAP_DOMAIN}${route.path}</loc>
    <lastmod>${route.lastmod || currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        console.log(`✅ Generated sitemap with ${allRoutes.length} URLs`);
        console.log(`   📄 Static: ${staticRoutes.length}, 🔗 Adverts: ${advertRoutes.length}, 📝 Blog: ${blogRoutes.length}`);

        return sitemap;

    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
        throw error;
    }
}

// Upload sitemap to Firebase Storage
async function uploadSitemap(sitemapContent) {
    try {
        const file = storage.file('sitemap.xml');

        await file.save(sitemapContent, {
            metadata: {
                contentType: 'application/xml',
                cacheControl: 'public, max-age=300',
            },
            public: true
        });

        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${storage.name}/sitemap.xml`;
        console.log(`🌐 Sitemap uploaded to: ${publicUrl}`);

        return publicUrl;
    } catch (error) {
        console.error('❌ Error uploading sitemap:', error);
        throw error;
    }
}

// Store sitemap metadata for tracking
async function updateSitemapMetadata(url, routeCount) {
    try {
        await db.collection('sitemapMetadata').doc('current').set({
            url: url,
            routeCount: routeCount,
            lastUpdated: Timestamp.now(),
            generatedBy: 'cloud-function'
        });

        console.log('📊 Sitemap metadata updated');
    } catch (error) {
        console.error('❌ Error updating metadata:', error);
    }
}

// 🕐 Daily scheduled sitemap generation
exports.generateDailySitemap = onSchedule("0 6 * * *", async () => {
    try {
        console.log('🌅 Starting daily sitemap generation...');

        const sitemapContent = await generateSitemapContent();
        const sitemapUrl = await uploadSitemap(sitemapContent);

        const routeCount = (sitemapContent.match(/<url>/g) || []).length;
        await updateSitemapMetadata(sitemapUrl, routeCount);

        console.log('🎉 Daily sitemap generation completed successfully!');
        console.log(`📊 Generated ${routeCount} URLs`);
        console.log(`🔗 Available at: ${sitemapUrl}`);

    } catch (error) {
        console.error('💥 Daily sitemap generation failed:', error);
        throw error;
    }
});

// 🔧 Manual sitemap generation (callable function for admin)
exports.generateSitemapManual = onCall(async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Authentication required');
        }

        const adminStatus = await isAdmin(request.auth.uid);
        if (!adminStatus) {
            throw new Error('Admin access required');
        }

        console.log('🔧 Manual sitemap generation triggered by admin:', request.auth.uid);

        const sitemapContent = await generateSitemapContent();
        const sitemapUrl = await uploadSitemap(sitemapContent);

        const routeCount = (sitemapContent.match(/<url>/g) || []).length;
        await updateSitemapMetadata(sitemapUrl, routeCount);

        return {
            success: true,
            message: 'Sitemap generated successfully',
            url: sitemapUrl,
            routeCount: routeCount,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Manual sitemap generation failed:', error);
        throw new Error(`Sitemap generation failed: ${error.message}`);
    }
});

// 📊 Get sitemap status (callable function)
exports.getSitemapStatus = onCall(async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Authentication required');
        }

        const adminStatus = await isAdmin(request.auth.uid);
        if (!adminStatus) {
            throw new Error('Admin access required');
        }

        const metadataDoc = await db.collection('sitemapMetadata').doc('current').get();

        if (!metadataDoc.exists) {
            return {
                exists: false,
                message: 'No sitemap generated yet'
            };
        }

        const metadata = metadataDoc.data();

        return {
            exists: true,
            url: metadata.url,
            routeCount: metadata.routeCount,
            lastUpdated: metadata.lastUpdated.toDate().toISOString(),
            generatedBy: metadata.generatedBy
        };

    } catch (error) {
        console.error('❌ Error getting sitemap status:', error);
        throw new Error(`Failed to get sitemap status: ${error.message}`);
    }
});




// 📧 Send expiring advert notifications (7 days before expiry) (EXISTING)
exports.sendExpiringAdvertEmails = onSchedule("0 9 * * *", async () => {
    try {
        console.log('🔍 Checking for adverts expiring in 7 days...');

        // Calculate date 7 days from now
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999);

        // Calculate date 6 days from now
        const sixDaysFromNow = new Date();
        sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
        sixDaysFromNow.setHours(0, 0, 0, 0);

        console.log(`📅 Looking for adverts expiring between ${sixDaysFromNow.toDateString()} and ${sevenDaysFromNow.toDateString()}`);

        // Query for adverts that expire in 7 days and haven't been notified
        const advertsSnapshot = await db
            .collection('allListings')
            .where('approved', '==', true)
            .where('expired', '==', false)
            .where('sold', '!=', true)
            .where('expiresAt', '>=', Timestamp.fromDate(sixDaysFromNow))
            .where('expiresAt', '<=', Timestamp.fromDate(sevenDaysFromNow))
            .get();

        console.log(`📊 Found ${advertsSnapshot.size} adverts potentially expiring in 7 days`);

        let emailsSent = 0;
        let errorsCount = 0;

        for (const advertDoc of advertsSnapshot.docs) {
            try {
                const advertData = advertDoc.data();
                const advertId = advertDoc.id;

                // Check if we've already sent an expiring notification for this advert
                if (advertData.expiringEmailSent) {
                    console.log(`⏭️ Skipping advert ${advertId} - expiring email already sent`);
                    continue;
                }

                // Calculate exact days left
                const expiryDate = advertData.expiresAt.toDate();
                const now = new Date();
                const timeDiff = expiryDate.getTime() - now.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // Only send if exactly 7 days (give or take due to timing)
                if (daysLeft < 6 || daysLeft > 8) {
                    console.log(`⏭️ Skipping advert ${advertId} - ${daysLeft} days left (not 7)`);
                    continue;
                }

                // Get owner's information
                const ownerDoc = await db
                    .collection('users')
                    .doc(advertData.ownerId)
                    .get();

                if (!ownerDoc.exists) {
                    console.log(`❌ Owner not found for advert ${advertId}`);
                    continue;
                }

                const ownerData = ownerDoc.data();

                // Prepare email data
                const emailPayload = {
                    userEmail: ownerData.email,
                    userName: `${ownerData.firstName || ''} ${ownerData.lastName || ''}`.trim() || 'Pet Owner',
                    advertData: {
                        id: advertId,
                        ...advertData,
                        expiresAt: advertData.expiresAt.toDate() // Convert Timestamp to Date for JSON
                    },
                    daysLeft: daysLeft,
                    userId: advertData.ownerId
                };

                // Send the email to your Express server
                console.log(`📧 Sending expiring email for advert: ${advertData.name || advertId}`);

                // Use your production URL or localhost for development
                const emailApiUrl = process.env.NODE_ENV === 'production'
                    ? 'https://mypetconnect-api-j6usd.ondigitalocean.app/api/send-advert-expiring-email'  // ✅ CORRECT
                    : 'http://localhost:8080/api/send-advert-expiring-email';

                const emailResponse = await fetch(emailApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(emailPayload)
                });

                if (emailResponse.ok) {
                    // Mark this advert as having received the expiring email
                    await db
                        .collection('allListings')
                        .doc(advertId)
                        .update({
                            expiringEmailSent: true,
                            expiringEmailSentAt: Timestamp.now()
                        });

                    emailsSent++;
                    console.log(`✅ Expiring email sent for advert ${advertId}`);
                } else {
                    const errorText = await emailResponse.text();
                    console.error(`❌ Failed to send expiring email for advert ${advertId}:`, errorText);
                    errorsCount++;
                }

            } catch (error) {
                console.error(`❌ Error processing advert ${advertDoc.id}:`, error);
                errorsCount++;
            }
        }

        console.log(`✅ Expiring adverts check complete: ${emailsSent} emails sent, ${errorsCount} errors`);





    } catch (error) {
        console.error('❌ Error in sendExpiringAdvertEmails:', error);
        throw error; // Let Firebase Functions handle the error
    }
});