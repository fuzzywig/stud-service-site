const express = require('express');
const path = require('path');
const https = require('https');

// → Your GetAddress.io API key
const API_KEY = 'pP8O9JNud0upxRnM9Fbs3w45793';

// → Port where this combined server will listen
const PORT = process.env.PORT || 5000;

const app = express();

// Trust proxy headers (for correct protocol detection behind load balancers)
app.set('trust proxy', true);

// Redirect logic: force HTTPS and remove www
app.use((req, res, next) => {
    const host = req.headers.host;

    // If on HTTP, redirect to HTTPS
    if (req.protocol === 'http') {
        return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    // If www, redirect to non-www
    if (host && host.startsWith('www.')) {
        const newHost = host.replace(/^www\./, '');
        return res.redirect(301, `https://${newHost}${req.originalUrl}`);
    }

    next();
});

// 1) Serve the Vite/React build statically from ./dist
app.use(express.static(path.join(__dirname, 'dist')));

// 2) Proxy any request to /api/postcode/:postcode → getaddress.io
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

// 3) Handle all other routes with index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
