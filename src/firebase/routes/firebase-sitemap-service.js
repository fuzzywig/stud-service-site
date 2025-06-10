// firebase-sitemap-service.js
const admin = require('firebase-admin');
const express = require('express');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Your pet categories from the breed options
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

// Most popular breeds by category for priority weighting
const POPULAR_BREEDS = {
    dogs: [
        "Labrador Retriever", "Golden Retriever", "French Bulldog", "Bulldog",
        "German Shepherd", "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier",
        "Dachshund", "Siberian Husky", "Boxer", "Border Collie", "Chihuahua"
    ],
    cats: [
        "British Shorthair", "Maine Coon", "Ragdoll", "Bengal", "Siamese",
        "Persian", "Russian Blue", "Abyssinian", "Birman", "Oriental"
    ],
    birds: [
        "Budgerigars", "Cockatiels", "Canaries", "Lovebirds", "Cockatoo", "Conures"
    ]
};

// Firebase Sitemap Service
class FirebaseSitemapService {

    // Get total count of active pets
    static async getActivePetsCount() {
        const snapshot = await db.collection('pets')
            .where('status', '==', 'active')
            .where('expiresAt', '>', new Date())
            .count()
            .get();

        return snapshot.data().count;
    }

    // Get pets in batches for sitemap generation
    static async getPetsBatch(offset = 0, limit = 5000) {
        const snapshot = await db.collection('pets')
            .where('status', '==', 'active')
            .where('expiresAt', '>', new Date())
            .orderBy('featured', 'desc')
            .orderBy('updatedAt', 'desc')
            .offset(offset)
            .limit(limit)
            .get();

        const pets = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            pets.push({
                id: doc.id,
                slug: data.slug,
                updatedAt: data.updatedAt.toDate(),
                category: data.category,
                breed: data.breed,
                location: data.location,
                type: data.type, // sale, stud, wanted
                featured: data.featured || false
            });
        });

        return pets;
    }

    // Get all unique categories with counts and last update
    static async getCategories() {
        const snapshot = await db.collection('pets')
            .where('status', '==', 'active')
            .where('expiresAt', '>', new Date())
            .get();

        const categories = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            const category = data.category;
            const updatedAt = data.updatedAt.toDate();

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

        return Array.from(categories.values())
            .sort((a, b) => b.count - a.count);
    }

    // Get all unique breeds with category and priority
    static async getBreeds() {
        const snapshot = await db.collection('pets')
            .where('status', '==', 'active')
            .where('expiresAt', '>', new Date())
            .get();

        const breeds = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            const breed = data.breed;
            const category = data.category;
            const breedKey = `${breed}_${category}`;
            const updatedAt = data.updatedAt.toDate();

            if (!breeds.has(breedKey)) {
                // Determine priority based on popularity
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

        return Array.from(breeds.values())
            .sort((a, b) => b.count - a.count);
    }

    // Get all unique locations with counts
    static async getLocations() {
        const snapshot = await db.collection('pets')
            .where('status', '==', 'active')
            .where('expiresAt', '>', new Date())
            .get();

        const locations = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            const location = data.location;
            const updatedAt = data.updatedAt.toDate();

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

        return Array.from(locations.values())
            .sort((a, b) => b.count - a.count);
    }

    // Helper function to create URL-friendly slugs
    static createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    }
}

// Express routes for dynamic sitemaps
const app = express();

// Simple cache
const cache = new Map();
const CACHE_DURATION = 3600000; // 1 hour

const getCachedOrFetch = async (key, fetchFunction) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    const data = await fetchFunction();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
};

// Main sitemap index
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = 'https://yourpetsite.com';
        const currentDate = new Date().toISOString();

        const totalPets = await getCachedOrFetch('pets-count',
            () => FirebaseSitemapService.getActivePetsCount()
        );

        const petsPerSitemap = 5000;
        const totalSitemaps = Math.ceil(totalPets / petsPerSitemap);

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
        console.error('Error generating sitemap index:', error);
        res.status(500).send('Error generating sitemap index');
    }
});

// Static pages sitemap
app.get('/sitemap-static.xml', async (req, res) => {
    try {
        const baseUrl = 'https://yourpetsite.com';

        const staticRoutes = [
            { url: '/', changefreq: 'daily', priority: '1.0' },
            { url: '/about', changefreq: 'monthly', priority: '0.6' },
            { url: '/contact', changefreq: 'monthly', priority: '0.5' },
            { url: '/how-it-works', changefreq: 'monthly', priority: '0.7' },
            { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
            { url: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
            { url: '/browse', changefreq: 'daily', priority: '0.9' },
            { url: '/search', changefreq: 'daily', priority: '0.8' },
            { url: '/post-ad', changefreq: 'monthly', priority: '0.9' },
            { url: '/register', changefreq: 'monthly', priority: '0.8' },
            { url: '/login', changefreq: 'monthly', priority: '0.4' },
            { url: '/my-account', changefreq: 'weekly', priority: '0.5' },
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
        console.error('Error generating static sitemap:', error);
        res.status(500).send('Error generating static sitemap');
    }
});

// Categories sitemap
app.get('/sitemap-categories.xml', async (req, res) => {
    try {
        const baseUrl = 'https://yourpetsite.com';
        const categories = await getCachedOrFetch('categories', () => FirebaseSitemapService.getCategories());

        let allRoutes = [];

        // Add category pages
        categories.forEach(category => {
            // Main category page
            allRoutes.push({
                url: `/category/${category.slug}`,
                lastmod: category.lastUpdated.toISOString().split('T')[0],
                changefreq: 'daily',
                priority: category.priority
            });

            // Category + type combinations (sale/stud/wanted)
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
        console.error('Error generating categories sitemap:', error);
        res.status(500).send('Error generating categories sitemap');
    }
});

// Breeds sitemap
app.get('/sitemap-breeds.xml', async (req, res) => {
    try {
        const baseUrl = 'https://yourpetsite.com';
        const breeds = await getCachedOrFetch('breeds', () => FirebaseSitemapService.getBreeds());

        const urlElements = breeds.map(breed => `
  <url>
    <loc>${baseUrl}/breed/${breed.slug}</loc>
    <lastmod>${breed.lastUpdated.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${breed.priority}</priority>
  </url>`).join('');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);

    } catch (error) {
        console.error('Error generating breeds sitemap:', error);
        res.status(500).send('Error generating breeds sitemap');
    }
});

// Locations sitemap
app.get('/sitemap-locations.xml', async (req, res) => {
    try {
        const baseUrl = 'https://yourpetsite.com';
        const [locations, categories] = await Promise.all([
            getCachedOrFetch('locations', () => FirebaseSitemapService.getLocations()),
            getCachedOrFetch('categories', () => FirebaseSitemapService.getCategories())
        ]);

        let allRoutes = [];

        // Add location pages
        locations.forEach(location => {
            allRoutes.push({
                url: `/location/${location.slug}`,
                lastmod: location.lastUpdated.toISOString().split('T')[0],
                changefreq: 'daily',
                priority: location.priority
            });

            // Location + category combinations (only for popular locations/categories)
            if (location.count > 50) { // Only add combinations for locations with many listings
                categories.slice(0, 6).forEach(category => { // Top 6 categories only
                    allRoutes.push({
                        url: `/location/${location.slug}/${category.slug}`,
                        lastmod: location.lastUpdated.toISOString().split('T')[0],
                        changefreq: 'daily',
                        priority: '0.6'
                    });
                });
            }
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
        console.error('Error generating locations sitemap:', error);
        res.status(500).send('Error generating locations sitemap');
    }
});

// Individual pet listings sitemaps (paginated)
app.get('/sitemap-pets-:page.xml', async (req, res) => {
    try {
        const page = parseInt(req.params.page);
        const baseUrl = 'https://yourpetsite.com';

        if (isNaN(page) || page < 1) {
            return res.status(404).send('Invalid sitemap page');
        }

        const petsPerPage = 5000;
        const offset = (page - 1) * petsPerPage;

        const cacheKey = `pets-page-${page}`;
        const pets = await getCachedOrFetch(cacheKey, () =>
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
    <loc>${baseUrl}/pets/${pet.slug}</loc>
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
        console.error('Error generating pets sitemap:', error);
        res.status(500).send('Error generating pets sitemap');
    }
});

// Cache management and stats endpoints
app.post('/admin/clear-sitemap-cache', (req, res) => {
    cache.clear();
    res.json({ message: 'Sitemap cache cleared successfully' });
});

app.get('/admin/sitemap-stats', async (req, res) => {
    try {
        const [totalPets, categories, breeds, locations] = await Promise.all([
            FirebaseSitemapService.getActivePetsCount(),
            FirebaseSitemapService.getCategories(),
            FirebaseSitemapService.getBreeds(),
            FirebaseSitemapService.getLocations()
        ]);

        const petsPerSitemap = 5000;
        const totalSitemaps = Math.ceil(totalPets / petsPerSitemap);

        res.json({
            totalPets,
            totalSitemaps,
            petsPerSitemap,
            categoriesCount: categories.length,
            breedsCount: breeds.length,
            locationsCount: locations.length,
            cacheSize: cache.size,
            cacheDuration: CACHE_DURATION / 1000 / 60, // minutes
            topCategories: categories.slice(0, 5),
            topBreeds: breeds.slice(0, 10),
            topLocations: locations.slice(0, 10)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule sitemap generation every day at 2 AM
cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Clearing sitemap cache for fresh generation');
    cache.clear();
});

module.exports = { app, FirebaseSitemapService };