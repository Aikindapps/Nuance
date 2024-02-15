import { Post } from '../../declarations/PostBucket/PostBucket.did.js';
import { URL } from 'url';


export function buildPostSEO(post: Post, handle: string, canonicalUrl: string, tags: string[] = []) {
    const userUrl = new URL(`/user/${post.creator || handle}`, canonicalUrl).href;
   
    const staticKeywords = ['nuance'];
    const dynamicKeywords = [post.handle, post.creator, ...tags, ]; 
    const allKeywords = [...staticKeywords, ...dynamicKeywords].join(', ');
    console.log('allKeywords:', allKeywords);

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${post.title}</title>
            <meta name="description" content="${post.subtitle}">
            <meta name="author" content="${handle}">
            <meta name="keywords" content="${allKeywords}">
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