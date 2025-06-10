// server/firebase-sitemap-service.js
import admin from 'firebase-admin';

let isInitialized = false;
let db = null; // Initialize this later

// Lazy initialization - only initialize when first method is called
const initializeFirebase = () => {
    if (isInitialized) return db;

    try {
        console.log('🔥 Initializing Firebase Admin...');

        const firebaseConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

        console.log('🔍 Firebase config check:');
        console.log('PROJECT_ID:', firebaseConfig.projectId ? 'EXISTS' : 'MISSING');
        console.log('CLIENT_EMAIL:', firebaseConfig.clientEmail ? 'EXISTS' : 'MISSING');
        console.log('PRIVATE_KEY:', firebaseConfig.privateKey ? 'EXISTS' : 'MISSING');

        if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
            throw new Error('❌ Missing Firebase environment variables. Please check your .env file.');
        }

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig)
            });
        }

        // NOW we can get the Firestore instance
        db = admin.firestore();
        isInitialized = true;

        console.log('✅ Firebase Admin initialized for sitemap service');
        return db;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
        throw error;
    }
};

// Your pet categories from your breed options
const PET_CATEGORIES = {
    dogs: { name: "Dogs", priority: "0.9" },
    cats: { name: "Cats", priority: "0.9" },
    birds: { name: "Birds", priority: "0.8" },
    fish: { name: "Fish", priority: "0.7" },
    horses: { name: "Horses & Ponies", priority: "0.8" },
    invertebrates: { name: "Invertebrates", priority: "0.6" },
    livestock: { name: "Livestock", priority: "0.7" },
    poultry: { name: "Poultry", priority: "0.7" },
    rabbits: { name: "Rabbits", priority: "0.7" },
    reptiles: { name: "Reptiles", priority: "0.7" },
    rodents: { name: "Rodents", priority: "0.7" },
    accessories: { name: "Accessories & Equipment", priority: "0.6" }
};

// Popular breeds for SEO priority
const POPULAR_BREEDS = {
    dogs: [
        "Labrador Retriever", "Golden Retriever", "French Bulldog", "Bulldog",
        "German Shepherd", "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier",
        "Dachshund", "Siberian Husky", "Boxer", "Border Collie", "Chihuahua"
    ],
    cats: [
        "British Shorthair", "Maine Coon", "Ragdoll", "Bengal", "Siamese",
        "Persian", "Russian Blue", "Abyssinian", "Birman", "Oriental"
    ]
};

export class FirebaseSitemapService {

    // Test connection to Firebase
    static async testConnection() {
        const database = initializeFirebase(); // Initialize and get db instance

        try {
            console.log('🔥 Testing Firebase connection...');
            const testDoc = await database.collection('allListings').limit(1).get();
            console.log(`✅ Firebase connection successful. Found ${testDoc.size} test documents.`);
            return true;
        } catch (error) {
            console.error('❌ Firebase connection failed:', error.message);
            throw error;
        }
    }

    // Get total count of active pets
    static async getActivePetsCount() {
        const database = initializeFirebase(); // Initialize and get db instance

        try {
            console.log('📊 Getting active pets count...');

            const snapshot = await database.collection('allListings')
                .where('approved', '==', true)
                .where('expired', '==', false)
                .get();

            const count = snapshot.size;
            console.log(`📊 Found ${count} active pets`);
            return count;

        } catch (error) {
            console.error('❌ Error getting pets count:', error);
            return 0;
        }
    }

    // Get pets in batches
    static async getPetsBatch(offset = 0, limit = 5000) {
        const database = initializeFirebase(); // Initialize and get db instance

        try {
            console.log(`📦 Getting pets batch: offset=${offset}, limit=${limit}`);

            let query = database.collection('allListings')
                .where('approved', '==', true)
                .where('expired', '==', false)
                .orderBy('createdAt', 'desc')
                .limit(limit);

            if (offset > 0) {
                query = query.offset(offset);
            }

            const snapshot = await query.get();

            const pets = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                pets.push({
                    id: doc.id,
                    slug: data.slug || this.createSlug(data.title || doc.id),
                    updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
                    category: data.category || 'other',
                    breed: data.breedOrType || 'Mixed Breed',
                    location: data.postcode || 'Unknown',
                    type: data.intent || 'sale', // sale, stud, wanted
                    featured: data.featured || false
                });
            });

            console.log(`📦 Retrieved ${pets.length} pets in batch`);
            return pets;

        } catch (error) {
            console.error('❌ Error getting pets batch:', error);
            return [];
        }
    }

    // Get categories with their last update dates
    static async getCategories() {
        const database = initializeFirebase(); // Initialize and get db instance

        try {
            console.log('📂 Getting categories...');

            const snapshot = await database.collection('allListings')
                .where('approved', '==', true)
                .where('expired', '==', false)
                .get();

            const categories = new Map();

            snapshot.forEach(doc => {
                const data = doc.data();
                const category = data.category || 'other';
                const updatedAt = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date();

                if (!categories.has(category)) {
                    categories.set(category, {
                        slug: category,
                        name: PET_CATEGORIES[category]?.name || category,
                        lastUpdated: updatedAt,
                        count: 0,
                        priority: PET_CATEGORIES[category]?.priority || "0.7"
                    });
                }

                const categoryData = categories.get(category);
                categoryData.count++;

                if (updatedAt > categoryData.lastUpdated) {
                    categoryData.lastUpdated = updatedAt;
                }
            });

            const result = Array.from(categories.values()).sort((a, b) => b.count - a.count);
            console.log(`📂 Found ${result.length} categories`);
            return result;

        } catch (error) {
            console.error('❌ Error getting categories:', error);
            return [];
        }
    }

    // Get breeds
    static async getBreeds() {
        const database = initializeFirebase(); // Initialize and get db instance

        try {
            console.log('🐕 Getting breeds...');

            const snapshot = await database.collection('allListings')
                .where('status', '==', 'approved')
                .get();

            const breeds = new Map();

            snapshot.forEach(doc => {
                const data = doc.data();
                const breed = data.breedOrType || 'Mixed Breed';
                const category = data.category || 'other';
                const breedKey = `${breed}_${category}`;
                const updatedAt = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date();

                if (!breeds.has(breedKey)) {
                    let priority = "0.6";
                    if (POPULAR_BREEDS[category] && POPULAR_BREEDS[category].includes(breed)) {
                        priority = "0.8";
                    }

                    breeds.set(breedKey, {
                        slug: this.createSlug(breed),
                        name: breed,
                        category: category,
                        lastUpdated: updatedAt,
                        count: 0,
                        priority: priority
                    });
                }

                const breedData = breeds.get(breedKey);
                breedData.count++;

                if (updatedAt > breedData.lastUpdated) {
                    breedData.lastUpdated = updatedAt;
                }
            });

            const result = Array.from(breeds.values()).sort((a, b) => b.count - a.count);
            console.log(`🐕 Found ${result.length} breeds`);
            return result;

        } catch (error) {
            console.error('❌ Error getting breeds:', error);
            return [];
        }
    }

    // Get locations
    static async getLocations() {
        const database = initializeFirebase(); // Initialize and get db instance

        try {
            console.log('📍 Getting locations...');

            const snapshot = await database.collection('allListings')
                .where('status', '==', 'approved')
                .get();

            const locations = new Map();

            snapshot.forEach(doc => {
                const data = doc.data();
                const location = data.postcode || 'Unknown';
                const updatedAt = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date();

                if (!locations.has(location)) {
                    locations.set(location, {
                        slug: this.createSlug(location),
                        name: location,
                        lastUpdated: updatedAt,
                        count: 0,
                        priority: "0.7"
                    });
                }

                const locationData = locations.get(location);
                locationData.count++;

                if (updatedAt > locationData.lastUpdated) {
                    locationData.lastUpdated = updatedAt;
                }
            });

            const result = Array.from(locations.values()).sort((a, b) => b.count - a.count);
            console.log(`📍 Found ${result.length} locations`);
            return result;

        } catch (error) {
            console.error('❌ Error getting locations:', error);
            return [];
        }
    }

    // Helper function to create URL-friendly slugs
    static createSlug(text) {
        if (!text) return 'unknown';
        return text
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    }
}