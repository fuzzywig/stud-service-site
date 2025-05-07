#!/usr/bin/env node
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

// 1) Load your service account key from JSON
const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
    console.error("❌ serviceAccountKey.json not found in project root");
    process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

// 2) Initialize the Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId:   serviceAccount.project_id,
});

const db = admin.firestore();

(async () => {
    try {
        console.log("🔑 Backfilling using project:", serviceAccount.project_id);

        // 3) Fetch all studAds
        const snaps = await db.collection("studAds").get();
        for (const docSnap of snaps.docs) {
            const ad = docSnap.data();
            if (ad.location) continue; // already backfilled

            // 4) Grab the owner’s user doc
            const userSnap = await db.collection("users").doc(ad.ownerId).get();
            if (!userSnap.exists) continue;
            const user = userSnap.data();
            if (!user.location) continue; // nothing to copy

            // 5) Copy location & postcode into the advert
            await docSnap.ref.update({
                location: user.location,
                postcode: user.postcode,
            });
            console.log(`✅ Backfilled ad ${docSnap.id}`);
        }

        console.log("🎉 Backfill complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Backfill failed:", err);
        process.exit(1);
    }
})();
