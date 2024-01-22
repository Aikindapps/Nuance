import React from 'react';
import ReactDOM from 'react-dom/client'; // Import from react-dom/client
import { Toaster } from 'react-hot-toast';
import './index.scss'; // Global styles
import { BrowserRouter, Router, useRoutes } from 'react-router-dom';
import ReviewComment from './screens/comments/comments';
import Cycles from './screens/cycles/cycles';
import Metrics from './screens/metrics/metrics';
import Actions from './screens/actions/actions';
import { ModalsWrapper } from './components/modals-wrapper/modals-wrapper';
import {
  Context as ModalContext,
  ContextProvider as ModalContextProvider,
} from './contextes/ModalContext';
import Homepage from './screens/homepage/homepage';

// Get the root element from the DOM
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  const Routes = () => {
    return useRoutes([
      { path: '/', element: <Homepage /> },
      { path: '/review-comments', element: <ReviewComment /> },
      { path: '/metrics', element: <Metrics /> },
      { path: '/cycles', element: <Cycles /> },
      { path: '/actions', element: <Actions /> },
    ]);
  };

  root.render(
    <ModalContextProvider>
      <React.StrictMode>
        <Toaster
          position='bottom-center'
          toastOptions={{
            style: {
              backgroundColor: '#000000',
              color: '#ffffff',
            },
          }}
        />
        <BrowserRouter>
          <Routes />
          <ModalsWrapper />
        </BrowserRouter>
      </React.StrictMode>
    </ModalContextProvider>
  );
} else {
  console.error('Failed to find the root element');
}
