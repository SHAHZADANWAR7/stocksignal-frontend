import { awsApi as awsClient } from './awsClient';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Get current authenticated user's email from Cognito
 */
async function getCurrentUserEmail() {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    return idToken?.payload?.email || null;
  } catch (error) {
    console.warn('Could not get user email:', error);
    return null;
  }
}

/**
 * Call AWS Lambda function via API Gateway
 * @param {string} functionName - Name of Lambda function
 * @param {Object} params - Parameters to pass
 * @returns {Promise} API response (auto-parses body if string)
 */
export async function callAwsFunction(functionName, params) {
  try {
    const apiUrl = import.meta.env.VITE_AWS_API_GATEWAY_URL || import.meta.env.VITE_API_GATEWAY_URL || 'https://YOUR_API_GATEWAY_URL';
    const apiKey = import.meta.env.VITE_AWS_API_KEY;
    
    // Get authenticated user's email from Cognito
    const userEmail = await getCurrentUserEmail();
    
    const response = await fetch(`${apiUrl}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-api-key': apiKey }),
        ...(userEmail && { 'x-user-email': userEmail })
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    // Auto-parse body if it's a JSON string (Lambda via API Gateway format)
    if (result.body && typeof result.body === 'string') {
      try {
        return JSON.parse(result.body);
      } catch (e) {
        console.warn('Could not parse response body as JSON:', e);
        return result;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

export const awsApi = {
  // Stock data
  getStockQuote: async (symbol) => {
    return awsClient.getStockQuote(symbol);
  },

  getStockAnalysis: async (symbol) => {
    return awsClient.getStockAnalysis(symbol);
  },

  getStockBatch: async (symbols) => {
    return awsClient.getStockBatch(symbols);
  },

  // Portfolio operations
  syncPortfolio: async (data) => {
    return awsClient.syncPortfolio(data);
  },

  executePaperTrade: async (data) => {
    return awsClient.executePaperTrade(data);
  },

  // Market data
  getVIXData: async () => {
    return awsClient.getVIXData();
  },

  calculateRealBeta: async (data) => {
    return awsClient.calculateRealBeta(data);
  }
};
