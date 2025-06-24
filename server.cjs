const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs').promises;

// Firebase Admin for sitemap access
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const app = express();
const PORT = process.env.PORT || 6500;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Firebase Admin
try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
        // Use environment variables (recommended for production)
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log('✅ Firebase Admin initialized from environment variables');
    } else {
        // Fallback to service account file (development)
        const serviceAccount = require('./path/to/your-service-account-key.json');
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: 'your-bucket-name.appspot.com'
        });
        console.log('✅ Firebase Admin initialized from service account file');
    }
} catch (error) {
    console.warn('⚠️ Firebase Admin not initialized:', error.message);
}

// Environment warnings
if (!process.env.GETADDRESS_API_KEY) {
    console.warn('⚠️ GETADDRESS_API_KEY not set (development mode - postcode lookup disabled)');
}

// 1. BASIC MIDDLEWARE (keep these at the top)
app.set('trust proxy', true);

// Add compression
const compression = require('compression');
app.use(compression());

// Request logging
app.use((req, res, next) => {
    console.log(`🔍 Request: ${req.method} ${req.path} from ${req.ip}`);
    next();
});

// REDIRECT MIDDLEWARE - Handle domain and HTTPS redirects
app.use((req, res, next) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;

    // Force HTTPS in production
    if (isProduction && protocol !== 'https') {
        console.log(`🔒 Redirecting HTTP to HTTPS: ${req.url}`);
        return res.redirect(301, `https://${host}${req.url}`);
    }

    // Force www subdomain
    if (host && !host.startsWith('www.') && isProduction) {
        console.log(`🌐 Redirecting to www: ${req.url}`);
        return res.redirect(301, `${protocol}://www.${host}${req.url}`);
    }

    next();
});

// 2. API ROUTES FIRST
// Replace your sitemap route with this:

app.get('/sitemap.xml', async (req, res) => {
    try {
        console.log('📍 Sitemap requested');

        // Try to read the generated sitemap file
        const fs = require('fs');
        const path = require('path');

        // Check multiple possible locations
        const possiblePaths = [
            path.join(__dirname, 'dist', 'sitemap.xml'),
            path.join(__dirname, 'dist', 'client', 'sitemap.xml'),
            path.join(__dirname, 'public', 'sitemap.xml'),
            path.join(__dirname, 'sitemap.xml')
        ];

        let sitemapContent = null;
        let foundPath = null;

        for (const sitemapPath of possiblePaths) {
            try {
                if (fs.existsSync(sitemapPath)) {
                    sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
                    foundPath = sitemapPath;
                    console.log(`📍 Found sitemap at: ${foundPath}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        if (sitemapContent && sitemapContent.length > 100) {
            // Serve the generated sitemap
            console.log(`📍 Serving sitemap (${sitemapContent.length} characters)`);
            res.set('Content-Type', 'application/xml');
            res.send(sitemapContent);
        } else {
            // Fallback: Generate a basic sitemap
            console.log('📍 No sitemap file found, generating basic sitemap');

            const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mypetconnect.co.uk/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mypetconnect.co.uk/browse</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mypetconnect.co.uk/top-studs</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

            res.set('Content-Type', 'application/xml');
            res.send(basicSitemap);
        }

    } catch (error) {
        console.error('❌ Sitemap error:', error);
        res.status(500).send('Sitemap generation failed');
    }
});

// Also add this route for manually triggering sitemap generation
app.post('/api/generate-sitemap', async (req, res) => {
    try {
        console.log('🚀 Manual sitemap generation requested');

        // Dynamic import of your sitemap generator
        const { spawn } = require('child_process');
        const scriptPath = path.join(__dirname, 'scripts', 'generate-sitemap.js');

        // Execute the sitemap generator
        const child = spawn('node', [scriptPath], {
            cwd: __dirname,
            stdio: 'pipe'
        });

        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    message: 'Sitemap generated successfully',
                    output: output
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Sitemap generation failed',
                    output: output
                });
            }
        });

    } catch (error) {
        console.error('❌ Manual sitemap generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/sitemap-status', async (req, res) => {
    res.json({ status: 'active', lastUpdated: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

app.get('/api/postcode/:postcode', (req, res) => {
    const { postcode } = req.params;
    if (!process.env.GETADDRESS_API_KEY) {
        return res.status(503).json({ error: 'Postcode lookup service unavailable in development' });
    }
    // Your postcode lookup logic here
    res.json({ postcode, status: 'found' });
});

// 3. SSR ROUTE CONFIGURATION
const SSR_ROUTES = [
    '/advert-details/',
    '/profile/',
    '/blog/'
];

function shouldUseSSR(url) {
    // Handle trailing slashes
    const cleanUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;

    const shouldRender = SSR_ROUTES.some(route => {
        const matches = cleanUrl.startsWith(route.slice(0, -1)); // Remove trailing slash from route too
        return matches;
    });

    return shouldRender;
}

// 4. STATIC FILES MIDDLEWARE - Serve assets directly
console.log('📁 Setting up static file serving...');

// Debug: List files in assets directory
const assetsPath = isProduction ?
    path.join(__dirname, 'dist/client/assets') :
    path.join(__dirname, 'dist/assets');

try {
    const assetFiles = require('fs').readdirSync(assetsPath);
    console.log('📁 Assets directory contents:', assetFiles);
} catch (error) {
    console.log('⚠️ Could not read assets directory:', error.message);
}

// Serve all static files, but skip SSR routes
app.use((req, res, next) => {
    // Skip static serving for SSR routes
    if (shouldUseSSR(req.path)) {
        console.log(`📄 SSR route detected, skipping static: ${req.path}`);
        return next();
    }

    console.log(`📁 Serving static file: ${req.path}`);

    const staticOptions = {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
                console.log(`📁 Setting JS MIME type for: ${filePath}`);
            }
            if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
                console.log(`📁 Setting CSS MIME type for: ${filePath}`);
            }
            if (filePath.endsWith('.woff2')) {
                res.setHeader('Content-Type', 'font/woff2');
            }
        }
    };

    if (isProduction) {
        express.static(path.join(__dirname, 'dist/client'), staticOptions)(req, res, next);
    } else {
        express.static(path.join(__dirname, 'dist'), staticOptions)(req, res, next);
    }
});

if (isProduction) {
    console.log('📁 Static files served from: dist/client');
} else {
    console.log('📁 Static files served from: dist');
}

// 5. SSR MIDDLEWARE - AFTER STATIC FILES
app.get('*', async (req, res, next) => {
    // Skip SSR for static files and non-SSR routes
    if (req.path.startsWith('/assets/') ||
        req.path.startsWith('/api/') ||
        req.path.includes('.') ||
        !shouldUseSSR(req.path)) {
        return next(); // Let it fall through to catch-all
    }

    try {
        console.log(`🎭 SSR rendering: ${req.path}`);

        // Read the template
        let template = await fs.readFile(
            isProduction ?
                path.join(__dirname, 'dist/client/index.html') :
                path.join(__dirname, 'dist/index.html'),
            'utf-8'
        );

        // Import server entry
        const serverEntry = await import(`file://${path.join(__dirname, 'dist/server/entry-server.js')}`);

        // Render the app
        const rendered = serverEntry.render(req.originalUrl);

        // Replace placeholders with rendered content
        const html = template
            .replace(`<!--app-head-->`, rendered.helmet.title + rendered.helmet.meta + rendered.helmet.link)
            .replace(`<!--app-html-->`, rendered.html)
            .replace(`<html lang="en">`, `<html lang="en" ${rendered.helmet.htmlAttributes}>`);

        console.log(`📤 Sending SSR response for: ${req.path}`);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);

    } catch (error) {
        console.error('❌ SSR Error:', error);
        console.log(`⏩ Falling back to SPA for: ${req.path}`);
        next();
    }
});

// 6. CATCH-ALL - SPA FALLBACK (LAST)
app.get('*', (req, res) => {
    console.log(`📄 Serving SPA fallback for: ${req.path}`);
    const indexPath = isProduction ?
        path.join(__dirname, 'dist/client/index.html') :
        path.join(__dirname, 'dist/index.html');
    res.sendFile(indexPath);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📍 Sitemap available at: http://0.0.0.0:${PORT}/sitemap.xml`);
    console.log(`📊 Sitemap status at: http://0.0.0.0:${PORT}/api/sitemap-status`);
    console.log(`🎭 SSR enabled for: ${SSR_ROUTES.join(', ')}`);
});