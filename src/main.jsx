import '../globals.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Amplify } from 'aws-amplify'

// Configure AWS Amplify with Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
