import React, { useEffect, useState, useContext, Suspense, lazy } from 'react';
import { usePostStore } from './store';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from 'react-hot-toast';
import Loader from './UI/loader/Loader';
import { useAuthStore } from './store';
import { useIdleTimer } from 'react-idle-timer';
import { ThemeProvider, useTheme } from './contextes/ThemeContext';
import {
  Context as ModalContext,
  ContextProvider as ModalContextProvider,
} from './contextes/ModalContext';
import { images, colors } from './shared/constants';

const HomePageGrid = lazy(() => import('./screens/home/homegrid'));
const Metrics = lazy(() => import('./screens/metrics/metrics'));
const TimedOut = lazy(() => import('./screens/timed-out/timedOut'));
const LoginRegistration = lazy(
  () => import('./screens/login-registration/login-registration')
);
const CreateEditArticle = lazy(
  () => import('./screens/create-edit-article/create-edit-article')
);
const CreateEditPublication = lazy(
  () => import('./screens/create-edit-publication/create-edit-publication')
);
const ReadArticle = lazy(() => import('./screens/read-article/read-article'));
const ProfileSidebar = lazy(() => import('./screens/profile/profileSidebar'));
const MyProfile = lazy(() => import('./screens/profile/myProfile'));
const EditProfile = lazy(() => import('./screens/profile/editProfile'));
const DraftArticles = lazy(() => import('./screens/profile/draftArticles'));
const PublishedArticles = lazy(
  () => import('./screens/profile/publishedArticles')
);
const Profile = lazy(() => import('./screens/profile/profile'));
const FollowedTags = lazy(() => import('./screens/profile/followedTags'));
const Following = lazy(() => import('./screens/profile/following'));
// const PublicationLanding = lazy(
//   () => import('./screens/publication-landing/publication-landing')
// );
import PublicationLanding from './screens/publication-landing/publication-landing';
const PublicationArticles = lazy(
  () => import('./screens/profile/publicationArticles')
);
const CategoryLanding = lazy(
  () => import('./screens/category-landing/category-landing')
);
const Wallet = lazy(() => import('./screens/profile/wallet'));
import { Context } from './contextes/Context';
import Followers from './screens/profile/followers';
import SubmittedArticles from './screens/profile/SubmittedArticles';
import { ModalsWrapper } from './components/modals-wrapper/modals-wrapper';

const Routes = () => {
  return useRoutes([
    { path: '/', element: <HomePageGrid /> },
    { path: '/metrics', element: <Metrics /> },
    { path: '/timed-out', element: <TimedOut /> },
    { path: '/register', element: <LoginRegistration /> },
    { path: '/:handle', element: <Profile /> },
    { path: '/:handle/:id/:title', element: <ReadArticle /> },
    { path: '/article/new', element: <CreateEditArticle /> },
    { path: '/article/edit/:id', element: <CreateEditArticle /> },
    { path: '/publication/:handle', element: <PublicationLanding /> },
    {
      path: '/publication/:handle/subscription',
      element: <PublicationLanding />,
    },
    { path: '/publication/:handle/:category', element: <CategoryLanding /> },
    { path: '/publication/edit/:handle', element: <CreateEditPublication /> },
    {
      path: '/my-profile',
      element: <ProfileSidebar />,
      children: [
        { path: '', element: <MyProfile /> },
        { path: 'edit', element: <EditProfile /> },
        { path: 'submitted-for-review', element: <SubmittedArticles /> },
        { path: 'draft', element: <DraftArticles /> },
        { path: 'published', element: <PublishedArticles /> },
        { path: 'topics', element: <FollowedTags /> },
        { path: 'following', element: <Following /> },
        { path: 'followers', element: <Followers /> },
        { path: 'wallet', element: <Wallet /> },
        { path: 'publications/:handle', element: <PublicationArticles /> },
      ],
    },
  ]);
};

const siteTitle = 'Nuance';
const siteDesc = 'Blogging to the people';
const logo = `https://nuance.xyz/logo.png`;

function App() {
  //handle resize on app wide
  const context = useContext(Context);
  const darkTheme = useTheme();

  const handleResize = () => {
    let width = window.outerWidth;
    let height = window.outerHeight;
    context.setWidth(width);
    context.setHeight(height);
  };
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    fetchTokenBalances()
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = darkTheme
      ? 'var(--dark-primary-background-color)'
      : colors.primaryBackgroundColor;
  }, [darkTheme]);


  const inactivityTimeout: number = //process.env.II_INACTIVITY_TIMEOUT
    //   ? // configuration is in minutes, but API expects milliseconds
    //     Number(process.env.II_INACTIVITY_TIMEOUT) * 60 * 1_000
    //   : // default = 1 hour
    480 * 60 * 1_000;

  const { isLoggedIn, logout, fetchTokenBalances } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    logout: state.logout,
    fetchTokenBalances: state.fetchTokenBalances
  }));

  const onIdle = () => {
    console.log('Idle: ' + new Date());
    if (isLoggedIn) {
      logout();
      console.log('Logged out: ' + new Date());
      window.location.href = '/timed-out';
    }
  };

  // const idleTimer = useIdleTimer({
  //   timeout: inactivityTimeout,
  //   onIdle,
  //   crossTab: true,
  //   startManually: true,
  // });

  // useEffect(() => {
  //   if (isLoggedIn) {
  //     idleTimer.start();
  //   } else {
  //     idleTimer.pause();
  //   }
  // }, [isLoggedIn]);



  return (
    <ModalContextProvider>

      <div className='App'>
        <Helmet>
          <meta charSet='utf-8' />
          <link
            rel='canonical'
            href={'https://nuance.xyz' + window.location.pathname}
          />
          <link rel='icon' href='/favicon.ico' type='image/x-icon' />
          <meta
            name='viewport'
            content='width=device-width, initial-scale=1.0'
          />

          {/* HTML Meta Tags */}
          <title>{siteTitle}</title>
          <meta name='description' content={siteDesc} />

          {/* Google / Search Engine Tags */}
          <meta itemProp='name' content={siteTitle} />
          <meta itemProp='description' content={siteDesc} />
          <meta itemProp='image' content={logo} />

          {/* Facebook Meta Tags */}
          <meta property='og:title' content={siteTitle} />
          <meta property='og:description' content={siteDesc} />
          <meta property='og:url' content='https://nuance.xyz/' />
          <meta property='og:type' content='website' />
          <meta property='og:image' content={logo} />

          {/* Twitter Meta Tags */}
          <meta name='twitter:card' content={logo} />
          <meta name='twitter:card' content={'summary_large_image'} />
          <meta name='twitter:title' content={siteTitle} />
          <meta name='twitter:description' content={siteDesc} />
          <meta name='twitter:image' content={logo} />
          <meta name='twitter:creator' content='@nuancedapp' />
        </Helmet>
        <Router>
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                  width: '100vw',
                  background: darkTheme
                    ? colors.darkModePrimaryBackgroundColor
                    : colors.primaryBackgroundColor,
                }}
              >
                <Loader />
              </div>
            }
          >
            <Routes />
          </Suspense>
        </Router>
        <Toaster
          position='bottom-center'
          toastOptions={{
            style: {
              backgroundColor: '#000000',
              color: '#ffffff',
            },
          }}
        />
        <ModalsWrapper />
      </div>

    </ModalContextProvider>
  );
}

export default App;
