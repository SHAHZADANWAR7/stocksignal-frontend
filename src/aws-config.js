import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      region: import.meta.env.VITE_COGNITO_REGION,
      loginWith: {
        oauth: {
          domain: 'YOUR_COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: ['https://stocksignal-frontend.vercel.app/'],
          redirectSignOut: ['https://stocksignal-frontend.vercel.app/'],
          responseType: 'code'
        }
      }
    }
  }
};

Amplify.configure(awsConfig);

export default awsConfig;
