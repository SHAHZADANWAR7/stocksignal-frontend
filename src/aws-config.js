import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_Example',
    userPoolWebClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || 'exampleclientid',
    oauth: {
      domain: import.meta.env.VITE_COGNITO_OAUTH_DOMAIN || 'example.auth.us-east-1.amazoncognito.com',
      scope: ['email', 'openid', 'aws.cognito.signin.user.admin'],
      redirectSignIn: import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN || 'https://stocksignal.io/',
      redirectSignOut: import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT || 'https://stocksignal.io/',
      responseType: 'code',
    },
  },
  API: {
    endpoints: [
      {
        name: 'StockSignalAPI',
        endpoint:
          import.meta.env.VITE_AWS_API_GATEWAY_URL ||
          'https://4ku664jsl7.execute-api.us-east-1.amazonaws.com/Production1',
        region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
      },
    ],
  },
};

// Configure Amplify once globally
Amplify.configure(awsConfig);

export default awsConfig;
