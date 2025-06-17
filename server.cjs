const express = require('express');
const path = require('path');
const https = require('https');

// Firebase Admin for sitemap access
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin (you'll need to add your service account)
// For now, using default initialization - you may need to add credentials
try {
    initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'studservice-app.firebasestorage.app'
    });
    console.log('✅ Firebase Admin initialized for sitemap access');
} catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
}

// → Your GetAddress.io API key from environment variable
const API_KEY = process.env.GETADDRESS_API_KEY;

if (!API_KEY) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ GETADDRESS_API_KEY environment variable is required in production');
        process.exit(1);
    } else {
        console.log('⚠️  GETADDRESS_API_KEY not set (development mode - postcode lookup disabled)');
    }
}

// → Port where this combined server will listen
const PORT = process.env.PORT || 6500;

const app = express();

app.set('trust proxy', true);

app.use((req, res, next) => {
    const host = req.headers.host;

    // Only apply redirects in production (not localhost)
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        // Redirect www to non-www first
        if (host && host.startsWith('www.')) {
            const newHost = host.replace(/^www\./, '');
            return res.redirect(301, `https://${newHost}${req.originalUrl}`);
        }

        // Then redirect http to https
        if (req.protocol === 'http') {
            return res.redirect(301, `https://${host}${req.originalUrl}`);
        }
    }

    next();
});

// ADD THIS DEBUG MIDDLEWARE:
app.use((req, res, next) => {
    console.log(`🔍 Request: ${req.method} ${req.path} from ${req.ip}`);
    next(); // Pass control to next middleware/route
});

// 🗺️ SITEMAP ENDPOINT - MUST BE BEFORE STATIC FILES AND CATCH-ALL
app.get('/sitemap.xml', async (req, res) => {
    try {
        console.log('📍 Sitemap requested from:', req.ip);

        // Get sitemap from Firebase Storage
        const bucket = getStorage().bucket();
        const file = bucket.file('sitemap.xml');

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            console.error('❌ Sitemap not found in Firebase Storage');

            // Fallback: try to serve from static files if available
            const staticSitemapPath = path.join(__dirname, 'dist', 'sitemap.xml');
            try {
                return res.sendFile(staticSitemapPath);
            } catch {
                return res.status(404)
                    .type('text/plain')
                    .send('Sitemap not found. Please generate it from the admin panel.');
            }
        }

        // Get file metadata for caching headers
        const [metadata] = await file.getMetadata();
        console.log('📊 Serving sitemap from Firebase Storage, updated:', metadata.updated);

        // Set proper headers for SEO and caching
        res.set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'Last-Modified': new Date(metadata.updated).toUTCString(),
            'X-Sitemap-Source': 'firebase-storage'
        });

        // Stream the file content directly
        const stream = file.createReadStream();

        stream.on('error', (error) => {
            console.error('❌ Error streaming sitemap from Firebase:', error);

            // Fallback to static file if streaming fails
            const staticSitemapPath = path.join(__dirname, 'dist', 'sitemap.xml');
            try {
                res.set('X-Sitemap-Source', 'static-fallback');
                res.sendFile(staticSitemapPath);
            } catch {
                res.status(500).type('text/plain').send('Error retrieving sitemap');
            }
        });

        // Pipe the Firebase Storage file to the response
        stream.pipe(res);

    } catch (error) {
        console.error('❌ Sitemap endpoint error:', error);

        // Final fallback: try static file
        try {
            const staticSitemapPath = path.join(__dirname, 'dist', 'sitemap.xml');
            res.set('X-Sitemap-Source', 'static-fallback');
            res.sendFile(staticSitemapPath);
        } catch {
            res.status(500).type('text/plain').send('Sitemap temporarily unavailable');
        }
    }
});

// 📊 API ROUTES - MUST BE BEFORE STATIC FILES AND CATCH-ALL
app.get('/api/sitemap-status', async (req, res) => {
    console.log('📊 SITEMAP STATUS ROUTE HIT!', req.path);
    try {
        const bucket = getStorage().bucket();
        const file = bucket.file('sitemap.xml');

        const [exists] = await file.exists();
        if (!exists) {
            return res.json({
                exists: false,
                source: 'firebase-storage',
                message: 'No sitemap found in Firebase Storage'
            });
        }

        const [metadata] = await file.getMetadata();

        res.json({
            exists: true,
            source: 'firebase-storage',
            size: metadata.size,
            sizeFormatted: `${Math.round(metadata.size / 1024)} KB`,
            updated: metadata.updated,
            updatedFormatted: new Date(metadata.updated).toLocaleString(),
            contentType: metadata.contentType,
            url: `${req.protocol}://${req.get('host')}/sitemap.xml`
        });

    } catch (error) {
        console.error('❌ Sitemap status error:', error);
        res.status(500).json({
            error: error.message,
            exists: false,
            source: 'error'
        });
    }
});

// Test route
app.get('/api/test', (req, res) => {
    console.log('🧪 TEST ROUTE HIT - API routing is working!');
    res.json({
        message: 'API routing works!',
        timestamp: new Date(),
        path: req.path,
        url: req.url
    });
});

// GetAddress.io API proxy
app.get('/api/postcode/:postcode', (req, res) => {
    const postcode = encodeURIComponent(req.params.postcode);
    const upstream = `https://api.getaddress.io/find/${postcode}?api-key=${API_KEY}`;

    https.get(upstream, (upRes) => {
        let data = '';
        upRes.on('data', (chunk) => (data += chunk));
        upRes.on('end', () => {
            res.status(upRes.statusCode).type('application/json').send(data);
        });
    }).on('error', (err) => {
        res.status(502).json({ error: 'Upstream error', details: err.message });
    });
});

// STATIC FILES - AFTER API ROUTES
app.use(express.static(path.join(__dirname, 'dist')));

// CATCH-ALL ROUTE - MUST BE LAST
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`📍 Sitemap available at: http://0.0.0.0:${PORT}/sitemap.xml`);
    console.log(`📊 Sitemap status at: http://0.0.0.0:${PORT}/api/sitemap-status`);
});