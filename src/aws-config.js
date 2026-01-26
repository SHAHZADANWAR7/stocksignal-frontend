import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: import.meta.env.VITE_COGNITO_REGION,                     // AWS region for Cognito
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,           // StockSignalUserPool
    userPoolWebClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID, // StockSignalAppClient
    oauth: {
      domain: import.meta.env.VITE_COGNITO_OAUTH_DOMAIN,             // your Cognito domain
      scope: ['email', 'openid', 'aws.cognito.signin.user.admin'],   // OIDC scopes
      redirectSignIn: import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN, // e.g., https://stocksignal.io/
      redirectSignOut: import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT,// e.g., https://stocksignal.io/
      responseType: 'code'
    }
  }
};

Amplify.configure(awsConfig);

export default awsConfig;
