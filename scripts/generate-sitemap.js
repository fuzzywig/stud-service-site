// scripts/generate-sitemap.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOMAIN = 'https://mypetconnect.co.uk'

// ✅ ADD XML ESCAPING FUNCTION
function escapeXml(unsafe) {
    if (typeof unsafe !== 'string') {
        return String(unsafe)
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

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

    // ✅ ADD CATEGORY PAGES (these were missing!)
    { path: '/browse?category=dogs', changefreq: 'daily', priority: 0.8 },
    { path: '/browse?category=cats', changefreq: 'daily', priority: 0.8 },
    { path: '/browse?category=rabbits', changefreq: 'weekly', priority: 0.7 },
    { path: '/browse?category=birds', changefreq: 'weekly', priority: 0.7 },
    { path: '/browse?category=horses', changefreq: 'weekly', priority: 0.7 },
    { path: '/browse?category=livestock', changefreq: 'weekly', priority: 0.6 },
    { path: '/browse?category=reptiles', changefreq: 'weekly', priority: 0.6 },
    { path: '/browse?category=fish', changefreq: 'weekly', priority: 0.6 },

    // Intent pages
    { path: '/browse?intent=sale', changefreq: 'daily', priority: 0.8 },
    { path: '/browse?intent=stud', changefreq: 'daily', priority: 0.8 },
    { path: '/browse?intent=rescue', changefreq: 'daily', priority: 0.8 },
]

// ✅ ADD DEBUGGING FOR STATIC ROUTES
console.log('🔍 Static routes check:')
console.log(`   📊 staticRoutes is defined: ${typeof staticRoutes}`)
console.log(`   📊 staticRoutes length: ${staticRoutes?.length || 0}`)
console.log(`   📊 First route: ${staticRoutes?.[0]?.path || 'undefined'}`)

if (staticRoutes.length === 0) {
    console.error('❌ CRITICAL: staticRoutes array is empty!')
    console.error('❌ This means no static pages will be in sitemap')
}

console.log('✅ Static routes check complete, continuing...')

// Function to fetch dynamic content from your database
async function fetchDynamicRoutes() {
    console.log('🔍 fetchDynamicRoutes function called')
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

        // ✅ ADD DEBUGGING FOR DYNAMIC ROUTES
        if (advertRoutes.length > 0) {
            console.log(`📝 First few dynamic routes:`, advertRoutes.slice(0, 2))
        } else {
            console.log('⚠️ No dynamic routes found - checking why...')
        }

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
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`📁 Working directory: ${process.cwd()}`)

    // ✅ CHECK STATIC ROUTES FIRST
    console.log(`📄 Static routes count: ${staticRoutes.length}`)
    console.log(`📄 First few static routes:`, staticRoutes.slice(0, 3))

    // Fetch dynamic content
    console.log('🔗 About to fetch dynamic routes...')
    const [advertRoutes, blogRoutes] = await Promise.all([
        fetchDynamicRoutes(),
        fetchBlogRoutes()
    ])

    console.log(`🔗 Dynamic routes returned: ${advertRoutes.length}`)
    console.log(`📝 Blog routes returned: ${blogRoutes.length}`)

    // Combine all routes
    const allRoutes = [...staticRoutes, ...advertRoutes, ...blogRoutes]

    console.log(`📊 Sitemap generation summary:`)
    console.log(`   📄 Static routes: ${staticRoutes.length}`)
    console.log(`   🔗 Dynamic advert routes: ${advertRoutes.length}`)
    console.log(`   📝 Blog routes: ${blogRoutes.length}`)
    console.log(`   📊 Total routes: ${allRoutes.length}`)

    // ✅ CRITICAL CHECK - If we have no routes, something is wrong
    if (allRoutes.length === 0) {
        console.error('❌ CRITICAL: No routes found at all!')
        console.error('❌ This will create an empty sitemap')
        console.error('❌ Checking static routes definition...')
        console.error('staticRoutes variable:', typeof staticRoutes, staticRoutes)

        // Don't create an empty sitemap
        throw new Error('No routes found - aborting sitemap generation')
    }

    const currentDate = new Date().toISOString().split('T')[0]
    console.log(`📅 Using current date: ${currentDate}`)

    // ✅ SHOW WHAT WE'RE GENERATING
    console.log('🛠️ About to generate XML for routes:')
    allRoutes.slice(0, 3).forEach((route, index) => {
        console.log(`   ${index + 1}. ${DOMAIN}${route.path} (${route.changefreq}, ${route.priority})`)
    })

    // ✅ GENERATE SITEMAP WITH XML ESCAPING
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${escapeXml(DOMAIN + route.path)}</loc>
    <lastmod>${route.lastmod || currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // ✅ LOG THE GENERATED XML SIZE
    console.log(`📏 Generated XML length: ${sitemap.length} characters`)
    console.log(`📊 XML contains ${(sitemap.match(/<url>/g) || []).length} URL entries`)

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
        console.log('📁 Created public directory')
    }

    // Write sitemap to public directory
    const sitemapPath = path.join(publicDir, 'sitemap.xml')

    try {
        fs.writeFileSync(sitemapPath, sitemap)
        console.log('✅ Sitemap written successfully!')

        // ✅ VERIFY WHAT WAS ACTUALLY WRITTEN
        const writtenContent = fs.readFileSync(sitemapPath, 'utf8')
        console.log(`📏 Written file size: ${writtenContent.length} characters`)
        console.log(`📄 File starts with: ${writtenContent.substring(0, 150)}...`)

        // ✅ CHECK FOR EMPTY SITEMAP
        if (writtenContent.includes('<urlset/>') || writtenContent.length < 200) {
            console.error('❌ WARNING: Generated sitemap appears to be empty!')
            console.error('❌ Content:', writtenContent)
        }

    } catch (writeError) {
        console.error('❌ Failed to write sitemap:', writeError.message)
        throw writeError
    }

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

    // ✅ RETURN RESULT FOR API ENDPOINTS
    return {
        success: true,
        routeCount: allRoutes.length,
        staticRoutes: staticRoutes.length,
        dynamicRoutes: advertRoutes.length,
        blogRoutes: blogRoutes.length,
        sitemapUrl: `${DOMAIN}/sitemap.xml`,
        filePath: sitemapPath,
        fileSize: fs.statSync(sitemapPath).size
    }
}

// Replace the bottom section with this:
console.log('📋 About to call generateSitemap()...')
console.log('📋 import.meta.url:', import.meta.url)
console.log('📋 process.argv[1]:', process.argv[1])

// Simpler check - if this script is run directly
if (process.argv[1] && process.argv[1].endsWith('generate-sitemap.js')) {
    console.log('📋 Script called directly, starting generation...')
    generateSitemap().catch(error => {
        console.error('💥 Sitemap generation failed:', error)
        process.exit(1)
    })
} else {
    console.log('📋 Script imported as module, not generating')
}