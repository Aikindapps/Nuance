import React, { useEffect, useState, useContext, Suspense, lazy } from 'react';
import { usePostStore, useUserStore } from './store';
import {
  BrowserRouter as Router,
  useLocation,
  useNavigate,
  useRoutes,
} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { RenderToaster } from './services/toastService';
import Loader from './UI/loader/Loader';
import { useAuthStore } from './store';
import { useIdleTimer } from 'react-idle-timer';
import { ThemeProvider, useTheme } from './contextes/ThemeContext';
import {
  Context as ModalContext,
  ContextProvider as ModalContextProvider,
} from './contextes/ModalContext';
import { images, colors } from './shared/constants';
import { authChannel } from './store/authStore';

const HomePageGrid = lazy(() => import('./screens/home/homepage'));
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
const MyProfile = lazy(() => import('./screens/profile/my-profile/myProfile'));
const EditProfile = lazy(
  () => import('./screens/profile/edit-profile/editProfile')
);
const PersonalArticles = lazy(
  () => import('./screens/profile/personal-articles/personalArticles')
);
const PublishedArticles = lazy(
  () => import('./screens/profile/publishedArticles')
);
const Profile = lazy(() => import('./screens/user/profile'));
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
import NotificationsSidebar from './components/notifications/notifications';
import Subscriptions from './screens/profile/subscriptions';
import PublicationSubscribersTab from './screens/profile/publication-subscribers-tab';
import SubscribersTab from './screens/profile/subscribers-tab';
import {
  useAgent,
  useAuth,
  useIdentity,
  useIsInitializing,
} from '@nfid/identitykit/react';
import { Usergeek } from 'usergeek-ic-js';

const Routes = () => {
  return useRoutes([
    { path: '/', element: <HomePageGrid /> },
    { path: '/metrics', element: <Metrics /> },
    { path: '/timed-out', element: <TimedOut /> },
    { path: '/register', element: <LoginRegistration /> },
    { path: '/:handle', element: <Profile /> },
    { path: '/user/:handle', element: <Profile /> },
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
        { path: 'articles', element: <PersonalArticles /> },
        { path: 'published', element: <PublishedArticles /> },
        { path: 'planned', element: <div>Test</div> },
        { path: 'topics', element: <FollowedTags /> },
        { path: 'following', element: <Following /> },
        { path: 'followers', element: <Followers /> },
        { path: 'wallet', element: <Wallet /> },
        { path: 'publications/:handle', element: <PublicationArticles /> },
        { path: 'subscriptions', element: <Subscriptions /> },
        { path: 'subscribers', element: <SubscribersTab /> },
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
  const [isLoading, setIsLoading] = useState(false);

  const handleResize = () => {
    let width = window.outerWidth;
    let height = window.outerHeight;
    context.setWidth(width);
    context.setHeight(height);
  };

  const isLocal: boolean =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('127.0.0.1');

  const {
    isLoggedIn,
    isInitialized,
    isInitializedAgent,
    agent: agentAuth,
    setAgent,
    setIdentity,
    logout,
    getUserWallet,
    fetchTokenBalances,
  } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    isInitialized: state.isInitialized,
    isInitializedAgent: state.isInitializedAgent,
    agent: state.agent,
    setAgent: state.setAgent,
    setIdentity: state.setIdentity,
    logout: state.logout,
    getUserWallet: state.getUserWallet,
    fetchTokenBalances: state.fetchTokenBalances,
  }));

  const customHost = isLocal ? 'http://localhost:8080' : 'https://icp-api.io';
  const agent = useAgent({ host: customHost, retryTimes: 10 });

  const identity = useIdentity();
  const { user, disconnect } = useAuth();
  const isInitializing = useIsInitializing();

  useEffect(() => {
    if (isLoggedIn) {
      agent ? setIsLoading(false) : setIsLoading(true);
    }
  }, [agent, isLoggedIn]);

  useEffect(() => {
    if (
      identity?.getPrincipal().toText() === '2vxsx-fae' &&
      isLoggedIn === true
    ) {
      setIdentity(undefined);
      useAuthStore.setState({ isLoggedIn: false });
    }
  });

  useEffect(() => {
    !isInitializing && identity && setIdentity(identity);
  }, [identity, isInitializing]);

  useEffect(() => {
    if (!isInitializing && agent) {
      setAgent(agent);
      useAuthStore.setState({ isInitializedAgent: true });
    }
  }, [agent, isInitializing]);

  useEffect(() => {
    const executeFetchTokenBalances = async () => {
      if (!agent && !isLoggedIn && !isInitializing) {
        return;
      }
      // we know the user is connected
      if (agent && !isInitializing) {
        const loggedUser = await useUserStore.getState().getUser(agent);

        if (loggedUser === undefined && !isInitialized && !isInitializing) {
          useAuthStore.setState({ isInitialized: true });
          window.location.href = '/register';
        } else {
          //user fetched successfully, get the token balances
          await getUserWallet();
          await fetchTokenBalances();
        }
      }

      // track session with usergeek
      Usergeek.setPrincipal(identity?.getPrincipal());
      Usergeek.trackSession();
      Usergeek.flush();
    };

    executeFetchTokenBalances();
  }, [agent, isInitializing]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    setTimeout(handleResize, 200);
  }, []);

  useEffect(() => {
    if (agent && identity && !isInitializing) {
      fetchTokenBalances();
    }
  }, [agent, identity, isInitializing]);

  useEffect(() => {
    document.body.style.backgroundColor = darkTheme
      ? 'var(--dark-primary-background-color)'
      : colors.primaryBackgroundColor;
  }, [darkTheme]);

  const inactivityTimeout: number = //process.env.II_INACTIVITY_TIMEOUT
    //   ? // configuration is in minutes, but API expects milliseconds
    //     Number(process.env.II_INACTIVITY_TIMEOUT) * 60 * 1_000
    //   : // default = 1 hour
    //30 days in milliseconds
    43200 * 60 * 1_000;

  const onIdle = async () => {
    console.log('Idle: ' + new Date());
    if (isLoggedIn) {
      await disconnect();
      logout();
      console.log('Logged out: ' + new Date());
      window.location.href = '/timed-out';
    }
  };

  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.data.type === 'logout') {
        console.log('Logout initiated from another tab');
        window.location.href = '/timed-out';
      }

      if (event.data.type === 'login') {
        window.location.reload();
      }
    };

    authChannel.onmessage = handleMessage;

    /* return () => {
      authChannel.close();
    }; */
  }, []);

  // migrating to identitykit condition
  // this condition will be true for the users whose sessions are still alive after deployment
  // will be true once and then won't be used anymore
  // can be deleted 30 days after deployment of identitykit because max session time is 30 days.
  if (
    !useAuthStore.getState().agent &&
    !useAuthStore.getState().identity &&
    isLoggedIn &&
    isInitialized &&
    isInitializing
  ) {
    disconnect();
    logout();
    window.location.reload();
  }

  if (isLoading || isInitializing) {
    return (
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
    );
  }

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
            <ModalsWrapper />
            <Routes />
          </Suspense>
          <RenderToaster />
        </Router>
      </div>
    </ModalContextProvider>
  );
}

export default App;
