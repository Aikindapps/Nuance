import * as http from 'http';
import * as fs from 'fs';
import pkg from 'http-proxy';
const { createProxyServer } = pkg;
import { URL } from 'url';
import { fetchPostData, getUserByHandle } from './actor.js'; 
import { Post } from '../declarations/PostCore/PostCore.did.js';
import { User } from '../declarations/User/User.did';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildUserSEO } from './screens/userProfile.js';
import { buildPostSEO } from './screens/post.js';
import { buildHomeSEO } from './screens/home.js';
import { getPostKeyProperties, getLatestPosts, getPopularThisWeek, getPostsByFollowers } from './actor.js';
import { PostKeyProperties, GetPostsByFollowers } from '../declarations/PostCore/PostCore.did.js';
import { PostBucketType, PostBucketType__1 } from '../declarations/PostBucket/PostBucket.did.js';

// Create a proxy server
const proxy = createProxyServer({});

interface BucketReturn {
    bucketReturn: {
        ok?: PostBucketType__1; 
        err?: string;
    }
}

interface KeyPropertiesReturn {
    ok?: PostKeyProperties;
    err?: string;
}

interface UserResponse {
    ok?: User;
    err?: string;
}

const crawlers = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
    'YandexBot', 'Sogou', 'Slackbot-LinkExpanding', 'Slack-ImgProxy', 
    'Twitterbot', 'facebookexternalhit', 'LinkedInBot', 'Facebot',
    'Pinterestbot', 'Applebot', 'SkypeUriPreview', 'WhatsApp', 'Notion'
];

function isCrawler(userAgent = '') {
    return crawlers.some(crawler => userAgent.includes(crawler));
}

const reservedPaths = new Set([
    '', 'metrics', 'timed-out', 'register', 'article', 'publication', 'my-profile', 'favicon.ico', 'api', 'assets', 'user', 'sitemap.xml', 'images'
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
        const filePath = parsedUrl.pathname === '/sitemap.xml' ? sitemapPath : sitemap2Path;
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404); 
                res.end('Sitemap not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(data);
            }
        });
    } else {
        if (isCrawler(userAgent)) {
            if (pathSegments.length >= 3 && pathSegments[0] !== 'publication' && !reservedPaths.has(pathSegments[0])) {
                const handle = pathSegments[0];
                const combinedPostIdAndBucket = pathSegments[1];
                const splitIndex = combinedPostIdAndBucket.indexOf('-');
                const postId = combinedPostIdAndBucket.substring(0, splitIndex);
                const bucketCanisterId = combinedPostIdAndBucket.substring(splitIndex + 1);
                var tags: string[] = [];

                try {
                    const [postData, fullPostData] = await Promise.all([
                        fetchPostData(postId, bucketCanisterId) as Promise<BucketReturn>,
                        getPostKeyProperties(postId) as Promise<KeyPropertiesReturn>
                    ]);

                    let tags: string[] = [];
                    if (fullPostData.ok) {
                        tags = fullPostData?.ok.tags.map(tag => tag.tagName);
                    }

                    if (postData.bucketReturn.ok) {
                        let post = postData.bucketReturn.ok;
                        console.log(post)
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(buildPostSEO(post, handle, parsedUrl.href, tags));
                    }
                } catch (error) {
                    console.error(':( Error processing post details:', error);
                    proxy.web(req, res, {
                        target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                        changeOrigin: true
                    });
                }
            } else if (pathSegments[0] === 'publication') {
                const handle = pathSegments.length === 1 ? pathSegments[0] : pathSegments[1];
                if (!handle || handle === 'undefined') {
                    console.log('handle is undefined');
                    proxy.web(req, res, {
                        target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                        changeOrigin: true
                    });
                }

                try {
                    console.log('Fetching Publication... ' + handle);
                    const userResponse = await getUserByHandle(handle) as UserResponse;

                    if (userResponse && userResponse.ok) {
                        const user = userResponse.ok;
                        let postsIdentifiers = getPostsByFollowers([handle], 0, 30) as Promise<GetPostsByFollowers>;
                        let uniqueTags = new Set<string>();

                        let postsPromises = (await postsIdentifiers).posts.map(async (postIdentifier) => {
                            try {
                                const fullPostData = await fetchPostData(postIdentifier.postId, postIdentifier.bucketCanisterId) as BucketReturn;
                                if (fullPostData.bucketReturn.ok) {
                                    const fullPost = fullPostData.bucketReturn.ok;

                                    postIdentifier.tags.forEach(tag => uniqueTags.add(tag.tagName));

                                    return `<li><a href="https://nuance.xyz/${handle}/${postIdentifier.postId}-${postIdentifier.bucketCanisterId}/${fullPost.title}">${fullPost.title}</a>
                                        <p>${fullPost.subtitle}</p>
                                        </li>`;
                                }
                                return '';
                            } catch (error) {
                                console.error('Error fetching full post details:', error);
                                return '';
                            }
                        });

                        let postsHtml = (await Promise.all(postsPromises)).join('') || 'No posts found';
                        let tagsArray = Array.from(uniqueTags);
                        const userSEOContent = buildUserSEO(user, parsedUrl.href, userAgent, postsHtml, tagsArray);
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.end(userSEOContent);

                    } else {
                        throw new Error('User not found');
                    }
                } catch (error) {
                    console.error(error);
                    proxy.web(req, res, {
                        target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                        changeOrigin: true
                    });
                }

            } else if (pathSegments && pathSegments.length === 0) {
                try {
                    const [latestPosts, popularPosts] = await Promise.all([
                        getLatestPosts(0, 30) as Promise<GetPostsByFollowers>,
                        getPopularThisWeek(0, 30) as Promise<GetPostsByFollowers>
                    ]);

                    const latestPostDetailsPromises = latestPosts.posts.map(post =>
                        fetchPostData(post.postId, post.bucketCanisterId) as Promise<BucketReturn>
                    );
                    const popularPostDetailsPromises = popularPosts.posts.map(post =>
                        fetchPostData(post.postId, post.bucketCanisterId) as Promise<BucketReturn>
                    );

                    const allDetailsPromises = [...latestPostDetailsPromises, ...popularPostDetailsPromises];
                    const allResults = await Promise.all(allDetailsPromises);

                    const fullLatestPosts: Post[] = allResults.slice(0, latestPosts.posts.length)
                        .filter(result => result.bucketReturn.ok)
                        .map(result => result.bucketReturn.ok as Post);
                    const fullPopularPosts: Post[] = allResults.slice(latestPosts.posts.length)
                        .filter(result => result.bucketReturn.ok)
                        .map(result => result.bucketReturn.ok as Post);

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(buildHomeSEO(fullLatestPosts, fullPopularPosts));
                }
                catch (error) {
                    console.error('Error fetching home page data:', error);
                    proxy.web(req, res, {
                        target: 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app/',
                        changeOrigin: true
                    });
                }
            } else if (pathSegments[0] === 'user' || pathSegments.length === 1 && !reservedPaths.has(pathSegments[0])) {
                const handle = pathSegments.length === 1 ? pathSegments[0] : pathSegments[1];
                if (!handle || handle === 'undefined') {
                    console.log('handle is undefined');
                    return;
                }

                try {
                    console.log('Fetching user... ' + handle);
                    const userResponse = await getUserByHandle(handle) as UserResponse;

                    if (userResponse && userResponse.ok) {
                        const user = userResponse.ok;
                        let postsIdentifiers = getPostsByFollowers([handle], 0, 30) as Promise<GetPostsByFollowers>;
                        let uniqueTags = new Set<string>();

                        let postsPromises = (await postsIdentifiers).posts.map(async (postIdentifier) => {
                            try {
                                const fullPostData = await fetchPostData(postIdentifier.postId, postIdentifier.bucketCanisterId) as BucketReturn;
                                if (fullPostData.bucketReturn.ok) {
                                    const fullPost = fullPostData.bucketReturn.ok;

                                    postIdentifier.tags.forEach(tag => uniqueTags.add(tag.tagName));

                                    return `<li><a href="https://nuance.xyz/${handle}/${postIdentifier.postId}-${postIdentifier.bucketCanisterId}/${fullPost.title}">${fullPost.title}</a>
                                        <p>${fullPost.subtitle}</p>
                                        </li>`;
                                }
                                return '';
                            } catch (error) {
                                console.error('Error fetching full post details:', error);
                                return '';
                            }
                        });

                        let postsHtml = (await Promise.all(postsPromises)).join('') || 'No posts found';
                        let tagsArray = Array.from(uniqueTags);
                        const userSEOContent = buildUserSEO(user, parsedUrl.href, userAgent, postsHtml, tagsArray);
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.end(userSEOContent);

                    } else {
                        throw new Error('User not found');
                    }
                } catch (error) {
                    console.error('Error processing user details:', error);
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
