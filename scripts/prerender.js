// scripts/prerender.js
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routes = [
    '/',
    '/browse',
    '/top-studs',
    '/breeding-guide',
    '/about',
    '/dog-rescue',
    '/blog'
];

const baseUrl = 'http://localhost:4174';
const distDir = path.join(__dirname, '../dist');

async function waitForServer(url, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                console.log('✅ Server is ready');
                return true;
            }
        } catch (error) {
            // Server not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
    }
    return false;
}

async function startPreviewServer() {
    return new Promise((resolve) => {
        console.log('🖥️ Starting preview server...');
        const server = spawn('npm', ['run', 'preview'], {
            stdio: 'pipe',
            shell: true
        });

        let serverUrl = null;

        server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output); // Show the server output

            // Look for the Local URL in the output
            const localMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
            if (localMatch) {
                const port = localMatch[1];
                serverUrl = `http://localhost:${port}`;
                console.log(`🎯 Found server on: ${serverUrl}`);
                resolve({ server, url: serverUrl });
            }
        });

        server.stderr.on('data', (data) => {
            console.error('Server error:', data.toString());
        });

        // Fallback timeout
        setTimeout(() => {
            if (!serverUrl) {
                console.log('⏰ Timeout - using fallback URL');
                serverUrl = 'http://localhost:4173';
            }
            resolve({ server, url: serverUrl });
        }, 10000);
    });
}

async function prerender() {
    let server = null;
    let browser = null;

    try {
        console.log('🚀 Starting prerendering...');

        // Start preview server and get the actual URL
        const serverInfo = await startPreviewServer();
        server = serverInfo.server;
        const serverUrl = serverInfo.url;

        // Wait for server to be actually ready
        const serverReady = await waitForServer(serverUrl);
        if (!serverReady) {
            console.error('❌ Server failed to start');
            throw new Error('Server failed to start');
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--single-process',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ],
            executablePath: process.env.GOOGLE_CHROME_BIN || undefined
        });

        const page = await browser.newPage();

        // Set longer timeouts and disable images for speed
        page.setDefaultTimeout(60000);
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'font') {
                req.abort();
            } else {
                req.continue();
            }
        });

        for (const route of routes) {
            try {
                console.log(`📄 Prerendering: ${route}`);

                const url = `${serverUrl}${route}`;

                // Go to page with a very generous timeout
                await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                // Wait for React root to have content
                try {
                    await page.waitForFunction(() => {
                        const root = document.querySelector('#root');
                        return root && root.children.length > 0;
                    }, { timeout: 30000 });
                } catch (err) {
                    console.log(`⚠️ React content timeout for ${route}, proceeding anyway...`);
                }

                // Extra wait for any async content
                await new Promise(resolve => setTimeout(resolve, 3000));

                const html = await page.content();

                // Clean up HTML
                const cleanHtml = html
                    .replace(/<script (.*?)>/gi, '<script $1 defer>')
                    .replace(/data-reactroot=""/gi, '');

                // Create directory structure
                const routePath = route === '/' ? '' : route;
                const outputDir = path.join(distDir, routePath);

                if (routePath) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const outputFile = path.join(outputDir, 'index.html');
                fs.writeFileSync(outputFile, cleanHtml);

                console.log(`✅ Generated: ${outputFile.replace(process.cwd(), '.')}`);

            } catch (error) {
                console.error(`❌ Failed to prerender ${route}:`, error.message);

                // Create a basic fallback HTML for failed routes
                const routePath = route === '/' ? '' : route;
                const outputDir = path.join(distDir, routePath);

                if (routePath) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const fallbackHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
                const outputFile = path.join(outputDir, 'index.html');
                fs.writeFileSync(outputFile, fallbackHtml);

                console.log(`⚠️ Created fallback for: ${route}`);
            }
        }

        console.log('🎉 Prerendering complete!');

    } catch (error) {
        console.error('❌ Prerendering failed:', error.message);
        process.exit(1);
    } finally {
        // Cleanup: close browser
        if (browser) {
            try {
                await browser.close();
                console.log('🔍 Browser closed');
            } catch (err) {
                console.log('Browser cleanup completed');
            }
        }

        // Cleanup: stop server
        if (server) {
            try {
                server.kill('SIGTERM');
                setTimeout(() => {
                    server.kill('SIGKILL');
                }, 3000);
                console.log('🛑 Preview server stopped');
            } catch (err) {
                console.log('Server cleanup completed');
            }
        }

        // Force exit after cleanup
        setTimeout(() => {
            console.log('🔄 Force exiting process...');
            process.exit(0);
        }, 5000);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, exiting...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, exiting...');
    process.exit(0);
});

prerender().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});