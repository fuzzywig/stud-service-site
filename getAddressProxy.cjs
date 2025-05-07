const http = require('http');
const https = require('https');
const url = require('url');

const API_KEY = 'pP8O9JNud0upxRnM9Fbs3w45793'; // Replace with your actual key
const PORT = 5000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname.startsWith('/api/postcode/')) {
        const postcode = parsedUrl.pathname.split('/').pop();
        const apiUrl = `https://api.getaddress.io/find/${postcode}?api-key=${API_KEY}`;

        https.get(apiUrl, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                });
                res.end(data);
            });
        }).on('error', () => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'API request failed' }));
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
