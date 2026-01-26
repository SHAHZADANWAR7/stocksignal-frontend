import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    // Change from REACT_APP_ to VITE_
userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
userPoolWebClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
region: import.meta.env.VITE_COGNITO_REGION,
  },
  API: {
    endpoints: [
      {
        name: 'api',
        endpoint: process.env.REACT_APP_AWS_API_GATEWAY_URL,
      },
    ],
  },
});
