import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID,
      region: process.env.REACT_APP_COGNITO_REGION,
    }
  }
};

Amplify.configure(awsConfig);

export default awsConfig;
