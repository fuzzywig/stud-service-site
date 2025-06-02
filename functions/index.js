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
