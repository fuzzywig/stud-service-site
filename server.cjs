// server.cjs
const express = require('express');

const path    = require('path');
const https   = require('https');

// → Your GetAddress.io API key (swap in your real key here)
const API_KEY = 'pP8O9JNud0upxRnM9Fbs3w45793';

// → Port where this combined server will listen. You can change to 80, 5000, etc.
const PORT = process.env.PORT || 5000;

const app = express();

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
            // Forward exactly what the upstream sent back
            res.status(upRes.statusCode).type('application/json').send(data);
        });
    }).on('error', (err) => {
        res.status(502).json({ error: 'Upstream error', details: err.message });
    });
});

// 3) For any “other” route (e.g. client-side React routing), fall back to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
