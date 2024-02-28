import { Post } from "../../declarations/PostCore/PostCore.did";

function buildHomeSEO(latestPosts: Post[], popularPosts: Post[]) {
    const title = 'Nuance';
    const description = 'Blogging to the people';
    const logoUrl = 'https://nuance.xyz/logo.png';
    const canonicalUrl = 'https://nuance.xyz';

    const staticKeywords = ['nuance', 'blog', 'blogging', 'publish', 'publishing', 'crypto', 'blockchain', 'web3', 'web3.0', 'decentralized', 'dapp', 'dapps', 'canister', 'ic', 'internet computer', 'icp', 'dfinity'];

  
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <link rel="canonical" href="${canonicalUrl}">
          <link rel="icon" href="/favicon.ico" type="image/x-icon">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <meta name="description" content="${description}">
          <meta name="keywords" content="${staticKeywords.join(', ')}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:url" content="${canonicalUrl}">
          <meta property="og:type" content="website">
          <meta property="og:image" content="${logoUrl}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${logoUrl}">
          <meta name="twitter:creator" content="@nuancedapp">
      </head>
      <body>
          <div id="app">
              <header>
                  <h1>Blogging to the people!</h1>
                  <p>Nuance is the world's first blogging platform built entirely on blockchain.

                  Built on, and for, the new Web.</p>
              </header>
              <main>
                  <section>
                      <h2>Latest Articles</h2>
                      <p>Explore featured articles and insights.</p>
                        <ul>
                            ${latestPosts.map(post => `<li><a href="https://nuance.xyz${post.url}">${post.title}</a>
                            <p>${post.subtitle}</p>
                            </li>`).join('')}
                        </ul>
                  </section>
                  
                    <section>
                        <h2>Popular Articles</h2>
                        <p>Discover the most popular authors on Nuance.</p>
                        <ul>
                            ${popularPosts.map(post => `<li><a href="https://nuance.xyz${post.url}">${post.title}</a>
                            <p>${post.subtitle}</p>
                            </li>`).join('')}
                        </ul>
                    </section>
              </main>
          </div>
      </body>
      </html>
    `;
  }
  
  export { buildHomeSEO };
  