import './globals.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import awsConfig from './aws-config.js' // canonical config

// DEBUG: Check if env vars are loaded
console.log('Env vars:', {
  poolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
  region: import.meta.env.VITE_COGNITO_REGION,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
