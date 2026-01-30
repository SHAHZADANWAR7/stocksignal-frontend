import { awsApi as awsClient } from './awsClient';

/**
 * Call AWS Lambda function via API Gateway
 * @param {string} functionName - Name of Lambda function
 * @param {Object} params - Parameters to pass
 * @returns {Promise} API response
 */
export async function callAwsFunction(functionName, params) {
  try {
    const apiUrl = import.meta.env.VITE_AWS_API_GATEWAY_URL || import.meta.env.VITE_API_GATEWAY_URL || 'https://YOUR_API_GATEWAY_URL';
    const apiKey = import.meta.env.VITE_AWS_API_KEY;
    
    const response = await fetch(`${apiUrl}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-api-key': apiKey })
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return response.json();
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
