import './globals.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Amplify } from 'aws-amplify';

// Configure Amplify with proper Cognito OAuth setup
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      region: import.meta.env.VITE_COGNITO_REGION,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_OAUTH_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN, 'http://localhost:5173/'],
          redirectSignOut: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT, 'http://localhost:5173/'],
          responseType: 'code'
        }
      }
    }
  }
});

console.log('Amplify Auth configured');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
