import { Post } from "../../declarations/PostCore/PostCore.did";



function buildHomeSEO(latestPosts: Post[], popularPosts: Post[]) {
    const title = 'Nuance';
    const description = 'Blogging to the people';
    const logoUrl = 'https://nuance.xyz/assets/images/nuance-logo-black.svg';
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
                  <h1> Join the decentralized blogging revolution!</h1>
                  <img src="${logoUrl}" alt="Nuance Logo" width="300" height="300">
                  </header>
              <main>

              
              <h1>Community Owned</h1>
              <h1>Read, write, earn</h1>
              <p>Nuance is the world's first publishing platform powered entirely by blockchain technology. Nuance offers writers the opportunity to govern the platform upon which they create content. Minimizing platform risk and empowering creators like never before.</p>
              <p>By harnessing the power of blockchain, Nuance applies the benefits of Web 3 to a Medium-style content hosting platform. This includes anonymity, self-sovereignty, censorship resistance, community governance, and tokenization. Ensuring a decentralized and secure environment for writers and readers alike.</p>
              <img src="https://nuance.xyz/assets/images//welcome_to_blogging.png" alt="Nuance, Community Owned" width="300" height="300">

              
              <h1>Trending Topics</h1>
              <ul>
                  <li>BITCOIN</li>
                  <li>NFT</li>
                  <li>CRYPTO</li>
                  <li>PRIVACY</li>
                  <li>SCI-FI</li>
                  <li>ANIME</li>
              </ul>

    <h1>Decentralization matters</h1>
    <p>The advertisement driven business models of web 2 has left control of the internet in the hands of a just a few companies. Advertising dollars drive click-bait and polarises communities where everything is black or white. But we all know that the truth is always somewhere in the middle. The truth is nuanced. Nuance is built on and for the new web. Nuance is for decentralised opinions. Make your opinion unstoppable.</p>
    <img src="https://nuance.xyz/assets/images/high_tech_image_new.svg" alt="Blockchain UI UX on Nuance" width="300" height="300">


    <h1>All the features you know</h1>
    <div>
        <div>
            <h2>Following</h2>
            <p>Following writers, publications and topics ensures you never miss an article</p>
        </div>
        <div>
            <h2>Subscription</h2>
            <p>A subscription provides unlimited access to all members-only content</p>
        </div>
        <div>
            <h2>Publications</h2>
            <p>Publications provide a branded home page showcasing your articles + advanced publishing features</p>
        </div>
        <div>
            <h2>Premium Articles</h2>
            <p>Publish Premium articles behind an NFT gated firewall</p>
        </div>
        <div>
            <h2>Tipping</h2>
            <p>Show appreciation with "applause" and tip writers in NUA, ckBTC and ICP</p>
        </div>
        <div>
            <h2>Commenting</h2>
            <p>Article commenting to engage the community around an article</p>
        </div>
        <div>
            <h2>Social</h2>
            <p>Social links to cross-pollinate your audience</p>
        </div>
        <div>
            <h2>Notifications</h2>
            <p>Get notifications regarding your community so you are always in the loop</p>
        </div>
    </div>

    <h1>Honest days pay for an honest days work</h1>
    <p>One key focus of Nuance is to enable writers to form a direct financial relationship with their readers without the platform risk. With Nuance, writers can monetize their content in ways not possible on traditional web 2 platforms: Tips Premium articles (limited edition NFT) Subscriptions</p>
    <ul>
        <li>Real time tips in crypto</li>
        <li>NFT gated paywalls</li>
        <li>Subscriptions</li>
    </ul>
    <img src="https://nuance.xyz/assets/images/monetize_image.png" alt="Honest days pay for an honest days work on Nuance" width="300" height="300">

    <h1>Start your own decentralised community</h1>
    <p>Nuance provides a publication feature that enables companies, projects and writers to have their own branding, a landing page, and writer management features, allowing teams to establish their own identity on the platform. Log in with Google or Internet Identity (or Stoic or Bitfinity) and join Nuance today to experience the future of decentralized publishing. Where creators are empowered, content is secure, and communities thrive.</p>
    <img src="https://nuance.xyz/assets/images/start_on_chain_image.png" alt="Nuance, Start your own decentralised community" width="300" height="300">

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
