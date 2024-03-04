import { User } from '../../declarations/User/User.did';
import { getUserPosts } from '../actor.js';

export function buildUserSEO(user : User, canonicalUrl : string, userAgent = '', postsHtml = '', tags: string[] = []) {
   
    const staticKeywords = ['nuance'];

   
    const dynamicKeywords = [user.displayName, user.handle, ...tags, ]; 

    const allKeywords = [...staticKeywords, ...dynamicKeywords].join(', ');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${user.displayName}</title>
            <meta name="description" content="${user.bio}">
            <meta name="author" content="${user.handle}">
            <meta name="keywords" content="${allKeywords}">

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
              
                <section>
                    <h2>Posts by ${user.handle}</h2>
                    <ul>
                    ${postsHtml}
                    </ul>
                </section>
            </main>
            <footer>
                Account created on: ${new Date(Number(user.accountCreated)).toLocaleDateString()}
            </footer>
        </body>
        </html>
    `;
}