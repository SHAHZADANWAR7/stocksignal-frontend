import { awsApi as awsClient } from './awsClient';

/**
 * Call AWS Lambda function
 * @param {string} functionName - Name of Lambda function
 * @param {Object} params - Parameters to pass
 * @returns {Promise} API response
 */
export async function callAwsFunction(functionName, params) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
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
