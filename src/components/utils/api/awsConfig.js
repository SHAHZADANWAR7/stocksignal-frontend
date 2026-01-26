import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    // Using VITE_ prefixed environment variables for Vite
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
    region: import.meta.env.VITE_AWS_REGION,
  },
  API: {
    endpoints: [
      {
        name: 'api',
        endpoint: import.meta.env.VITE_AWS_API_GATEWAY_URL,
      },
    ],
  },
});
