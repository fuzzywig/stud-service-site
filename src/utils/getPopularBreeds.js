import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const getPopularBreeds = async () => {
    const q = query(
        collection(db, "allListings"),
        where("approved", "==", true),
        where("sold", "==", false),
        where("expired", "==", false)
    );

    const snapshot = await getDocs(q);

    const breedCounts = {};

    snapshot.forEach((doc) => {
        const data = doc.data();

        // Check paused field - if it doesn't exist, treat as not paused
        if (data.paused === true) return;

        const category = data.category?.toLowerCase().replace(/s$/, ''); // <- use this version
        const breed = data.breedOrType?.trim();

        if (!category || !breed) return;

        if (!breedCounts[category]) {
            breedCounts[category] = {};
        }

        breedCounts[category][breed] = (breedCounts[category][breed] || 0) + 1;
    });

    console.log("🐾 Breed Counts:", JSON.stringify(breedCounts, null, 2));

    return {
        dog: Object.entries(breedCounts.dog || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([breed]) => breed),

        cat: Object.entries(breedCounts.cat || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([breed]) => breed),
    };
};