import React from 'react';
import ReactDOM from 'react-dom/client'; // Import from react-dom/client
import Dashboard from './components/dashboard/dashboard';
import { Toaster } from 'react-hot-toast';
import './index.scss'; // Global styles



// Get the root element from the DOM
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
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
      <Dashboard />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
