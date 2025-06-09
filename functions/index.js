const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
const db = getFirestore();
const storage = getStorage().bucket();

// 🔄 Auto-unpublish adverts older than 30 days
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

// 🗑️ Auto-delete adverts that expired over 14 days ago
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

// 📧 Send expiring advert notifications (7 days before expiry)
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
                    ? 'https://mypetconnect.co.uk/api/send-advert-expiring-email'  // ← Your production domain
                    : 'http://localhost:6500/api/send-advert-expiring-email';

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