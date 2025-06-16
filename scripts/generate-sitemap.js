// scripts/generate-sitemap.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOMAIN = 'https://mypetconnect.co.uk'

// Static routes
const staticRoutes = [
    // Main pages
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/browse', changefreq: 'daily', priority: 0.9 },
    { path: '/top-studs', changefreq: 'weekly', priority: 0.8 },
    { path: '/about', changefreq: 'monthly', priority: 0.7 },

    // Core functionality pages
    { path: '/new-advert', changefreq: 'monthly', priority: 0.8 },
    { path: '/dog-rescue', changefreq: 'weekly', priority: 0.7 },
    { path: '/register', changefreq: 'monthly', priority: 0.6 },

    // Information/Guide pages
    { path: '/breeding-guide', changefreq: 'monthly', priority: 0.8 },
    { path: '/help', changefreq: 'monthly', priority: 0.6 },

    // Blog pages
    { path: '/blog', changefreq: 'weekly', priority: 0.8 },

    // Legal/Policy pages
    { path: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
    { path: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
    { path: '/cookie-policy', changefreq: 'yearly', priority: 0.3 },
]

// Function to fetch dynamic content from your database
async function fetchDynamicRoutes() {
    try {
        console.log('🔗 Fetching approved adverts from Firebase...')

        // Set a timeout for the Firebase operation
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase timeout')), 10000) // 10 second timeout
        )

        const fetchPromise = async () => {
            // Dynamic import of Firebase modules
            const { initializeApp } = await import('firebase/app')
            const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore')

            // Your actual Firebase config
            const firebaseConfig = {
                apiKey: "AIzaSyA6C7sHBGwWc538wAKgARcAHROpGhgIXd0",
                authDomain: "studservice-app.firebaseapp.com",
                projectId: "studservice-app",
                storageBucket: "studservice-app.firebasestorage.app",
                messagingSenderId: "260297704377",
                appId: "1:260297704377:web:c1d99be89240c43a02ac68"
            }

            // Initialize Firebase
            const app = initializeApp(firebaseConfig)
            const db = getFirestore(app)

            // Query for approved adverts (using allListings collection)
            const advertsRef = collection(db, 'allListings')
            const q = query(advertsRef, where('approved', '==', true))
            const snapshot = await getDocs(q)

            const advertRoutes = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    path: `/advert-details/${doc.id}`,
                    changefreq: 'weekly',
                    priority: 0.6,
                    lastmod: data.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                        data.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                        new Date().toISOString().split('T')[0]
                }
            })

            return advertRoutes
        }

        // Race between fetch and timeout
        const advertRoutes = await Promise.race([fetchPromise(), timeoutPromise])

        console.log(`🔗 Found ${advertRoutes.length} approved adverts`)
        return advertRoutes

    } catch (error) {
        console.warn('❌ Could not fetch advert routes:', error.message)
        console.warn('💡 Continuing with static routes only...')
        return []
    }
}

// Function to fetch blog posts
async function fetchBlogRoutes() {
    try {
        console.log('📝 Fetching blog posts from Firebase...')

        // Set a timeout for the Firebase operation
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase timeout')), 10000) // 10 second timeout
        )

        const fetchPromise = async () => {
            // Dynamic import of Firebase modules
            const { initializeApp } = await import('firebase/app')
            const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore')

            // Your actual Firebase config
            const firebaseConfig = {
                apiKey: "AIzaSyA6C7sHBGwWc538wAKgARcAHROpGhgIXd0",
                authDomain: "studservice-app.firebaseapp.com",
                projectId: "studservice-app",
                storageBucket: "studservice-app.firebasestorage.app",
                messagingSenderId: "260297704377",
                appId: "1:260297704377:web:c1d99be89240c43a02ac68"
            }

            const app = initializeApp(firebaseConfig)
            const db = getFirestore(app)

            // Query for published blog posts
            const blogRef = collection(db, 'blogPosts')
            const q = query(blogRef, where('status', '==', 'published'))
            const snapshot = await getDocs(q)

            const blogRoutes = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    path: `/blog/${data.slug || doc.id}`,
                    changefreq: 'monthly',
                    priority: 0.7,
                    lastmod: data.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                        data.publishedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                        new Date().toISOString().split('T')[0]
                }
            })

            return blogRoutes
        }

        // Race between fetch and timeout
        const blogRoutes = await Promise.race([fetchPromise(), timeoutPromise])

        console.log(`📝 Found ${blogRoutes.length} published blog posts`)
        return blogRoutes

    } catch (error) {
        console.warn('❌ Could not fetch blog routes:', error.message)
        console.warn('💡 Continuing without blog routes...')
        return []
    }
}

async function generateSitemap() {
    console.log('🚀 Generating sitemap...')

    // Fetch dynamic content
    const [advertRoutes, blogRoutes] = await Promise.all([
        fetchDynamicRoutes(),
        fetchBlogRoutes()
    ])

    // Combine all routes
    const allRoutes = [...staticRoutes, ...advertRoutes, ...blogRoutes]

    const currentDate = new Date().toISOString().split('T')[0]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <lastmod>${route.lastmod || currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
        console.log('📁 Created public directory')
    }

    // Write sitemap to public directory
    const sitemapPath = path.join(publicDir, 'sitemap.xml')
    fs.writeFileSync(sitemapPath, sitemap)

    console.log('✅ Sitemap generated successfully!')
    console.log(`📍 Generated ${allRoutes.length} URLs total`)
    console.log(`   📄 Static routes: ${staticRoutes.length}`)
    console.log(`   🔗 Advert routes: ${advertRoutes.length}`)
    console.log(`   📝 Blog routes: ${blogRoutes.length}`)
    console.log(`📂 Saved to: ${sitemapPath}`)
    console.log(`🌐 Will be accessible at: ${DOMAIN}/sitemap.xml`)

    // Warn if sitemap is getting large
    if (allRoutes.length > 10000) {
        console.warn('⚠️  Large sitemap detected! Consider splitting into multiple sitemaps.')
    }
}

// Run the generator
generateSitemap().catch(console.error)