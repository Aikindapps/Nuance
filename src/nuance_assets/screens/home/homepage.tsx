import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/header/header';
import './homepage.scss';
import { images } from '../../shared/constants';
import { useAuthStore, useUserStore } from '../../store';
import Button from '../../UI/Button/Button';

const HomePage = () => {
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  //userStore
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const [selectedTab, setSelectedTab] = useState(
    isLoggedIn ? 'Articles' : 'About'
  );

  return (
    <div className='homepage'>
      <Header
        loggedIn={false}
        isArticlePage={false}
        ScreenWidth={screenWidth}
        isPublicationPage={false}
      />

      <div className='join-revolution'>
        <div className='join-revolution-container'>
          <div className='left'>
            <div className='nuance-logo-blue-text'>
              <img
                className='image-container'
                src={images.NUANCE_LOGO_BLUE_TEXT}
              />
            </div>
            <div className='buttons-wrapper'>
              <div
                className={
                  selectedTab === 'About' ? 'button selected' : 'button'
                }
                onClick={() => {
                  setSelectedTab('About');
                }}
              >
                About Nuance
              </div>
              <div
                className={
                  selectedTab === 'Articles' ? 'button selected' : 'button'
                }
                onClick={() => {
                  setSelectedTab('Articles');
                }}
              >
                Articles
              </div>
            </div>
          </div>
          <div className='right'>
            <div className='title'>Join the on-chain blogging revolution!</div>
            <div className='login-options'></div>
            <div className='buttons-wrapper-only-mobile'>
              <div
                className={
                  selectedTab === 'About' ? 'button selected' : 'button'
                }
                onClick={() => {
                  setSelectedTab('About');
                }}
              >
                About Nuance
              </div>
              <div
                className={
                  selectedTab === 'Articles' ? 'button selected' : 'button'
                }
                onClick={() => {
                  setSelectedTab('Articles');
                }}
              >
                Articles
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedTab === 'About' && (
        <div className='about-nuance-wrapper'>
          <div className='welcome-to-blogging'>
            <div className='title'>
              The world's first blogging platform built entirely on-chain!
            </div>
            <img className='image' src={images.WELCOME_TO_BLOGGING} />
            <div className='colorful-divider' />
          </div>
          <div className='read-write-earn-money'>
            <div className='title'>Read, write and earn money</div>
            <div className='content'>
              <span>
                Nuance is the world's first online blogging platform powered by
                blockchain technology. Nuance offers writers the opportunity to
                own and operate the platform upon which they create content.
                Minimizing platform risk and empowering creators like never
                before.
              </span>
              <span>
                By harnessing the power of blockchain, Nuance applies the
                benefits of Web 3 to a Medium-style content hosting platform.
                This includes anonymity, self-sovereignty, censorship
                resistance, community governance, and tokenization. Ensuring a
                decentralized and secure environment for writers and readers
                alike.
              </span>
            </div>
          </div>
          {!isLoggedIn && (
            <div className='login-buttons-wrapper'>
              <Button style={{ width: '224px' }} styleType='primary-1'>
                Login with Google
              </Button>

              <Button style={{ width: '224px' }} styleType='primary-1'>
                Login with Internet Identity
              </Button>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button style={{ width: '185px' }} styleType='primary-1'>
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='trending-topics'>
            <div className='title'>Trending Topics</div>
            <div className='topics-wrapper'>
              <div className='topic'>BITCOIN</div>
              <div className='topic'>BITCOIN</div>
              <div className='topic'>BITCOIN</div>
              <div className='topic'>BITCOIN</div>
              <div className='topic'>BITCOIN</div>
              <div className='topic'>BITCOIN</div>
            </div>
          </div>
          <div className='high-tech'>
            <div className='left'>
              <div className='title'>High tech made easy</div>
              <div className='content'>
                <span>
                  Individuals can publish articles to their profile and build a
                  following, fostering a vibrant and engaged community of
                  creators and readers.
                </span>
                <span>
                  Nuance prioritizes user experience, offering a sleek UX,
                  invisible technology, smooth performance, search indexing, and
                  familiar features such as login with Google and custom
                  domains. This ensures that users enjoy all the conveniences
                  they're accustomed to in Web 2 while benefiting from the
                  transformative capabilities of blockchain technology.
                </span>
              </div>
            </div>
            <img className='right-image' src={images.HIGH_TECH_IMAGE} />
          </div>
          {!isLoggedIn && (
            <div className='login-buttons-wrapper'>
              <Button style={{ width: '224px' }} styleType='primary-1'>
                Login with Google
              </Button>

              <Button style={{ width: '224px' }} styleType='primary-1'>
                Login with Internet Identity
              </Button>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button style={{ width: '185px' }} styleType='primary-1'>
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='features-wrapper'>
            <div className='title'>Features</div>
            <div className='features-content-wrapper'>
              <div className='features-left'>
                <img
                  className='mask-group'
                  src={images.NUANCE_LOGO_MASK_GROUP}
                />
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
              </div>
              <div className='features-right'>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
                <div className='feature'>
                  <div className='title'>Write articles</div>
                  <div className='content'>Explanation of this feature.</div>
                </div>
              </div>
            </div>
          </div>
          {!isLoggedIn && (
            <div className='login-buttons-wrapper'>
              <Button style={{ width: '224px' }} styleType='primary-1'>
                Login with Google
              </Button>

              <Button style={{ width: '224px' }} styleType='primary-1'>
                Login with Internet Identity
              </Button>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button style={{ width: '185px' }} styleType='primary-1'>
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='monetize-wrapper'>
            <div className='left'>
              <div className='title'>Monetize your writing effort</div>
              <div className='content'>
                <span>
                  One key feature of Nuance is its ability to enable writers to
                  form a direct financial relationship with their readers,
                  eliminating intermediary platform risk.
                </span>
                <span>
                  With Nuance, writers can monetize their content in ways not
                  possible on traditional web2 platforms. Get applauded for your
                  article in real micro-crypto Mint your articles as NFTs,
                  providing cryptographically secure content to NFT holders and
                  opening up new avenues for revenue generation.
                </span>
              </div>
            </div>
            <img className='monetize-image' src={images.MONETIZE_IMAGE} />
          </div>
          <div className='monetize-wrapper-mobile'>
            <img className='monetize-image' src={images.MONETIZE_IMAGE} />
            <div className='content-inside'>
              <div className='title'>Monetize your writing effort</div>
              <div className='content'>
                One key feature of Nuance is its ability to enable writers to
                form a direct financial relationship with their readers,
                eliminating intermediary platform risk.
              </div>
            </div>
            <div className='content-outside'>
              With Nuance, writers can monetize their content in ways not
              possible on traditional web2 platforms. Get applauded for your
              article in real micro-crypto Mint your articles as NFTs, providing
              cryptographically secure content to NFT holders and opening up new
              avenues for revenue generation.
            </div>
          </div>
          {!isLoggedIn && (
            <div className='start-writing'>
              <div className='title'>Start writing now!</div>
              <div className='login-buttons-wrapper'>
                <Button style={{ width: '224px' }} styleType='primary-1'>
                  Login with Google
                </Button>

                <Button style={{ width: '224px' }} styleType='primary-1'>
                  Login with Internet Identity
                </Button>
              </div>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button style={{ width: '185px' }} styleType='primary-1'>
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='start-a-movement'>
            <div className='left'>
              <div className='title'>Start an on-chain movement</div>
              <div className='content'>
                <span>
                  Nuance provides a publication platform that includes
                  user-defined branding, a landing page, and writer management
                  features, allowing writers to establish their own unique
                  presence and identity on the platform.{' '}
                </span>
                <span>
                  Log in with Internet Identity, NFID, Stoic or Bitfinity and
                  Join Nuance today to experience the future of online blogging.
                  Where creators are empowered, content is secure, and
                  communities thrive.
                </span>
              </div>
            </div>
            <img className='right-image' src={images.HIGH_TECH_IMAGE} />
          </div>
          <div className='end-colorful-divider'></div>
        </div>
      )}
      {selectedTab === 'Articles' && <div></div>}
    </div>
  );
};

export default HomePage;
