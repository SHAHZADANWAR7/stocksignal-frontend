import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_W41gAu1rf',
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || '15i5hjimlsg2b339bspclnocq4',
      region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_OAUTH_DOMAIN || 'https://us-east-1w41gau1rf.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN || 'https://stocksignal.io/', 'http://localhost:5173/'],
          redirectSignOut: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT || 'https://stocksignal.io/', 'http://localhost:5173/'],
          responseType: 'code'
        }
      }
    }
  },
  API: {
    endpoints: [
      {
        name: 'StockSignalAPI',
        endpoint: import.meta.env.VITE_AWS_API_GATEWAY_URL || 'https://4ku664jsl7.execute-api.us-east-1.amazonaws.com/Production1',
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
      }
    ]
  }
};

console.log('[aws-config] Configuring Amplify with:');
console.log('[aws-config] User Pool ID:', awsConfig.Auth.Cognito.userPoolId);
console.log('[aws-config] Client ID:', awsConfig.Auth.Cognito.userPoolClientId);
console.log('[aws-config] Region:', awsConfig.Auth.Cognito.region);
console.log('[aws-config] Environment variables:', {
  VITE_COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  VITE_COGNITO_APP_CLIENT_ID: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
  VITE_COGNITO_REGION: import.meta.env.VITE_COGNITO_REGION
});

Amplify.configure(awsConfig);
console.log('[aws-config] Amplify Auth configured successfully');

export default awsConfig;
