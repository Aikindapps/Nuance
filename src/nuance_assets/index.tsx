import React from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import { Usergeek } from 'usergeek-ic-js';
import { ContextProvider } from './contextes/Context';
import { ThemeProvider } from './contextes/ThemeContext';

import './index.scss';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <ContextProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ContextProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

//init usergeek
// see: https://github.com/usergeek/usergeek-ic-js

const userGeekApiKey = process.env.USERGEEK_API_KEY || '';
const userGeekSecondaryApiKey = process.env.USERGEEK_API_KEY_SECONDARY || '';

if (process.env.NODE_ENV === 'development') {
  Usergeek.init({
    apiKey: userGeekApiKey,
    host: 'https://fbbjb-oyaaa-aaaah-qaojq-cai.raw.ic0.app/',
  });
  console.log('usergeek init in dev mode');
} else {
  Usergeek.init({ apiKey: userGeekSecondaryApiKey });
  console.log('usergeek init in prod mode');
  console.log(`fully decentralized :)`)
}
