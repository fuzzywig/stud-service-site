import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import sharp from "sharp";
import path from "path";
import os from "os";
import fs from "fs";

initializeApp();

export const resizeUploadedImage = onObjectFinalized({ memory: "512MB", timeoutSeconds: 60 }, async (event) => {
    const object = event.data;

    const filePath = object.name;
    const contentType = object.contentType;
    const fileName = path.basename(filePath);

    if (!contentType?.startsWith("image/")) {
        console.log("Not an image.");
        return;
    }

    // Skip if already resized (to avoid infinite loop if uploaded again)
    if (object.metadata?.resized === "true") {
        console.log("Image already resized. Skipping.");
        return;
    }

    const bucket = getStorage().bucket(object.bucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const metadata = {
        contentType,
        metadata: {
            resized: "true",
        },
    };

    // Download original image
    await bucket.file(filePath).download({ destination: tempFilePath });

    // Resize and overwrite the original file
    await sharp(tempFilePath).resize({ width: 1200 }).toFile(tempFilePath);

    await bucket.upload(tempFilePath, {
        destination: filePath, // same name = overwrite
        metadata,
    });

    fs.unlinkSync(tempFilePath);
    console.log(`Resized and replaced original image: ${filePath}`);
});
