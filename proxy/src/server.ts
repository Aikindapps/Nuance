import * as http from 'http';
import * as fs from 'fs';
import pkg from 'http-proxy';
const { createProxyServer } = pkg;
import { URL } from 'url';
import { fetchPostData, getUserByHandle } from './actor.js'; 
import { Post } from '../declarations/PostBucket/PostBucket.did.js';
import { User } from '../declarations/User/User.did';
import { fileURLToPath } from 'url';
import path from 'path';



// Create a proxy server
const proxy = createProxyServer({});

interface BucketReturn {
    bucketReturn:{
    ok?: Post; 
    err?: string;
    }
}

interface UserResponse {
    ok?: User;
    err?: string;
}


// check if the user agent is a crawler
const crawlers = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
    'YandexBot', 'Sogou', 'Slackbot-LinkExpanding', 'Slack-ImgProxy', 
    'Twitterbot', 'facebookexternalhit', 'LinkedInBot', 'Facebot',
    'Pinterestbot', 'Applebot', 'SkypeUriPreview', 'WhatsApp', 'Notion'
];

function isCrawler(userAgent = '') {
        return crawlers.some(crawler => userAgent.includes(crawler));
}

function buildUserSEO(user : User, canonicalUrl : string, userAgent = '') {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${user.displayName}</title>
            <meta name="description" content="${user.bio}">
            <meta name="author" content="${user.handle}">
            <link rel="canonical" href="${canonicalUrl}">

            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="profile">
            <meta property="og:title" content="${user.displayName}">
            <meta property="og:description" content="${user.bio}">
            <meta property="og:image" content="${user.avatar}">
            <meta property="og:url" content="${canonicalUrl}">

            <!-- Twitter -->
            <meta name="twitter:card" content="summary">
            <meta property="twitter:title" content="${user.displayName}">
            <meta property="twitter:description" content="${user.bio}">
            <meta property="twitter:image" content="${user.avatar}">
        </head>
        <body>
            <header>
                <h1>${user.displayName}</h1>
                <img src="${user.avatar}" alt="${user.displayName}">
            </header>
            <main>
                <p>${user.bio}</p>
                <p>Followers: ${user.followersCount}</p>
                <!-- You can add more user details here -->
            </main>
            <footer>
                Account created on: ${user.accountCreated}
            </footer>
        </body>
        </html>
    `;
}

function buildPostSEO(post: Post, handle: string, canonicalUrl: string) {
    const userUrl = new URL(`/user/${post.creator || handle}`, canonicalUrl).href;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${post.title}</title>
            <meta name="description" content="${post.subtitle}">
            <meta name="author" content="${handle}">
            <link rel="canonical" href="${canonicalUrl}">

            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="article">
            <meta property="og:title" content="${post.title}">
            <meta property="og:description" content="${post.subtitle}">
            <meta property="og:image" content="${post.headerImage}">
            <meta property="og:url" content="${canonicalUrl}">

            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image">
            <meta property="twitter:title" content="${post.title}">
            <meta property="twitter:description" content="${post.subtitle}">
            <meta property="twitter:image" content="${post.headerImage}">
        </head>
        <body>
            <header>
                <h1>${post.title}</h1>
                <h2>By ${handle}</h2>
                <img src="${post.headerImage}" alt="${post.title}">
            </header>
            <main>${post.content}</main>
            <section id="author-info">
                    <h2>About the Author</h2>
                    <p>${post.creator || post.handle}</p>
                    <p>More about the author: <a href="${userUrl}">${userUrl}</a></p>
            <footer>
                Published on: ${new Date(Number(post.publishedDate)).toLocaleDateString()}
                
            </footer>
        </body>
        </html>
    `;
}


const reservedPaths = new Set([
    '', 'metrics', 'timed-out', 'register', 'article', 'publication', 'my-profile', 'favicon.ico', 'api', 'assets', 'user', 'sitemap.xml'
  ]);
  

const server = http.createServer(async (req, res) => {
    
    
    const userAgent = req.headers['user-agent'];
    const requestUrl = req.url || '/';
    const host = req.headers.host || '';

    const parsedUrl = new URL(requestUrl, `http://${host}`);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    

    console.log('Request received: ' + req.url);
    console.log('User Agent: ' + userAgent);

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    const sitemap2Path = path.join(__dirname, 'sitemap2.xml');

    if (parsedUrl.pathname === '/sitemap.xml' || parsedUrl.pathname === '/sitemap2.xml') {
        if (parsedUrl.pathname === '/sitemap.xml') {
        fs.readFile(sitemapPath, (err, data) => {
            if (err) {
                res.writeHead(404); 
                res.end('Sitemap not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(data);
            }
    
        });
    }
    if (parsedUrl.pathname === '/sitemap2.xml') {
        fs.readFile(sitemap2Path, (err, data) => {
            if (err) {
                res.writeHead(404); 
                res.end('Sitemap not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(data);
            }
    
        });
    }
     } else {

    if (isCrawler(userAgent)) {
        if (pathSegments.length >= 3 && pathSegments[0] !== 'publication'  && !reservedPaths.has(pathSegments[0])) {
            const handle = pathSegments[0];
            const combinedPostIdAndBucket = pathSegments[1];
            const splitIndex = combinedPostIdAndBucket.indexOf('-');

            const postId = combinedPostIdAndBucket.substring(0, splitIndex);
            const bucketCanisterId = combinedPostIdAndBucket.substring(splitIndex + 1);

            try {
                const postData = await fetchPostData(postId, bucketCanisterId) as BucketReturn;
                console.log('Fetched Post Data',);

                // Convert postData to SEO optimized HTML and serve it
                if (postData.bucketReturn.ok) {
                let post = postData?.bucketReturn.ok as Post;
            
               
       
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(buildPostSEO(postData.bucketReturn.ok, handle, parsedUrl.href));
                }
            } catch (error) {
                proxy.web(req, res, {
                    target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                    changeOrigin: true
                });
            }
        } else if (pathSegments[0] === 'publication') {
            const handle = pathSegments.length === 1 ? pathSegments[0] : pathSegments[1];
            if (!handle || handle === 'undefined'){
                console.log('handle is undefined');
                proxy.web(req, res, {
                    target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                    changeOrigin: true
                });
            }

        
            try {
                console.log('Fetching user... ' + handle);
                const response = await getUserByHandle(handle) as UserResponse;
                if (response && response.ok) {
                    const user = response.ok; // Unwrapping the 'ok' property
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(buildUserSEO(user, parsedUrl.href));
                } else {
                    proxy.web(req, res, {
                        target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                        changeOrigin: true
                    });
                }
            } catch (error) {
                proxy.web(req, res, {
                    target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                    changeOrigin: true
                });
            }
        }
         else if (pathSegments[0] === 'user' || pathSegments.length === 1 && !reservedPaths.has(pathSegments[0])  ) {
            const handle = pathSegments.length === 1 ? pathSegments[0] : pathSegments[1];
            if (!handle || handle === 'undefined'){
                console.log('handle is undefined');
                return;
            }

        
            try {
                console.log('Fetching user... ' + handle);
                const response = await getUserByHandle(handle) as UserResponse;
                if (response && response.ok) {
                    const user = response.ok; // Unwrapping the 'ok' property
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(buildUserSEO(user, parsedUrl.href, userAgent));
                } else {
                    proxy.web(req, res, {
                        target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                        changeOrigin: true
                    });
                }
            } catch (error) {
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
    } else {
        proxy.web(req, res, {
            target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
            changeOrigin: true
        });
    }
    }
});

console.log("Proxy server running...");

server.listen(8080, '0.0.0.0');
