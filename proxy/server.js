import dotenv from 'dotenv';
import http from 'http';
import httpProxy from 'http-proxy';
import { URL } from 'url';
import { fetchPostData } from './actor.js';


// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Define a function to check if the user agent is a crawler
function isCrawler(userAgent = '') {
    const crawlers = [
        'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
        'YandexBot', 'Sogou', 'Slackbot-LinkExpanding', 'Slack-ImgProxy', 
        'Twitterbot', 'facebookexternalhit', 'LinkedInBot', 'Facebot',
        'Pinterestbot', 'Applebot', 'SkypeUriPreview', 'WhatsApp'
    ];
        return crawlers.some(crawler => userAgent.includes(crawler));
}

const server = http.createServer(async (req, res) => {
    
    const userAgent = req.headers['user-agent'];
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    console.log('Request received: ' + req.url);
    console.log('User Agent: ' + userAgent);

    if (isCrawler(userAgent)) {
        if (pathSegments.length >= 3 && pathSegments[0] !== 'publication') {
            const handle = pathSegments[0];
            const combinedPostIdAndBucket = pathSegments[1];
            const splitIndex = combinedPostIdAndBucket.indexOf('-');

            const postId = combinedPostIdAndBucket.substring(0, splitIndex);
            const bucketCanisterId = combinedPostIdAndBucket.substring(splitIndex + 1);

            try {
                const postData = await fetchPostData(postId, bucketCanisterId);
                console.log('Fetched Post Data:', postData);

                // Convert postData to SEO optimized HTML and serve it
                const { ok } = postData;
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${ok.title}</title>
                        <meta name="description" content="${ok.subtitle}">
                        <meta name="author" content="${handle}">
                        <link rel="canonical" href="${parsedUrl.href}">

                        <!-- Open Graph / Facebook -->
                        <meta property="og:type" content="article">
                        <meta property="og:title" content="${ok.title}">
                        <meta property="og:description" content="${ok.subtitle}">
                        <meta property="og:image" content="${ok.headerImage}">
                        <meta property="og:url" content="${parsedUrl.href}">

                        <!-- Twitter -->
                        <meta property="twitter:card" content="summary_large_image">
                        <meta property="twitter:title" content="${ok.title}">
                        <meta property="twitter:description" content="${ok.subtitle}">
                        <meta property="twitter:image" content="${ok.headerImage}">
                    </head>
                    <body>
                        <header>
                            <h1>${ok.title}</h1>
                            <h2>By ${handle}</h2>
                            <img src="${ok.headerImage}" alt="${ok.title}">
                        </header>
                        <main>
                            ${ok.content}
                        </main>
                        <footer>
                            Published on: ${new Date(Number(ok.publishedDate)).toLocaleDateString()}
                        </footer>
                    </body>
                    </html>
                `);
            } catch (error) {
                console.error('Error fetching post:', error);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        } else {
            proxy.web(req, res, {
                target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                changeOrigin: true
            });
        }
    } else {
        proxy.web(req, res, {
            target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
            changeOrigin: true
        });
    }
});

console.log("Proxy server running...");

server.listen(8080, '0.0.0.0');
