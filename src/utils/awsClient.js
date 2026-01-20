import { Amplify } from "aws-amplify";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

// AWS Configuration from environment variables
const AWS_CONFIG = {
  API_GATEWAY_URL: import.meta.env.VITE_AWS_API_GATEWAY_URL || "https://4ku664jsl7.execute-api.us-east-1.amazonaws.com/Production1",
  COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || "us-east-1_W41gAu1rf",
  COGNITO_APP_CLIENT_ID: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || "15i5hjimlsg2b339bspclnocq4",
  COGNITO_REGION: import.meta.env.VITE_COGNITO_REGION || "us-east-1",
};

// Configure AWS Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: AWS_CONFIG.COGNITO_USER_POOL_ID,
      userPoolClientId: AWS_CONFIG.COGNITO_APP_CLIENT_ID,
      region: AWS_CONFIG.COGNITO_REGION,
    }
  }
});

// Get JWT token from Cognito
const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Generic API Gateway call
const apiCall = async (path, method = "POST", body = null) => {
  try {
    const token = await getAuthToken();
    
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const url = `${AWS_CONFIG.API_GATEWAY_URL}${path}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API call failed: ${method} ${path}`, error);
    throw error;
  }
};

// Export all API methods
export const awsApi = {
  // Stock data
  getStockQuote: (symbol) => apiCall('/getStockQuote', 'POST', { symbol }),
  getStockBatch: (symbols, forceRefresh = true) => apiCall('/getStockBatch', 'POST', { symbols, forceRefresh }),
  getStockAnalysis: (symbol) => apiCall('/getStockAnalysis', 'POST', { symbol }),
  getVIXData: () => apiCall('/getVIXData', 'POST'),

  // Trading
  executePaperTrade: (tradeData) => apiCall('/executePaperTrade', 'POST', tradeData),
  syncPortfolio: (portfolioData) => apiCall('/syncPortfolio', 'POST', portfolioData),

  // Beta
  calculateRealBeta: (symbol) => apiCall('/calculateRealBeta', 'POST', { symbol }),

  // Emails
  sendWeeklySummary: (email) => apiCall('/sendWeeklySummary', 'POST', { email }),
  sendDailyAlert: (email) => apiCall('/sendDailyAlert', 'POST', { email }),
  sendMonthlyReport: (email) => apiCall('/sendMonthlyReport', 'POST', { email }),
  sendNewsletter: (email) => apiCall('/sendNewsletter', 'POST', { email }),
  sendSupportEmail: (data) => apiCall('/sendSupportEmail', 'POST', data),

  // LLM
  invokeLLM: (prompt, addContext = false, responseSchema = null) => 
    apiCall('/invokeLLM', 'POST', {
      prompt,
      add_context_from_internet: addContext,
      response_json_schema: responseSchema,
    }),

  // Companies
  getCompanies: async () => {
    const response = await apiCall("/companies", "GET");
    return response?.Items || response?.items || [];
  },

  // Analyses
  getPortfolioAnalyses: async (userId) => {
    const response = await apiCall(`/analyses?userId=${userId}`, "GET");
    return response?.Items || response?.items || [];
  },

  getAnalysis: async (analysisId) => {
    const response = await apiCall(`/analyses/${analysisId}`, "GET");
    return response?.Item || response;
  },

  saveAnalysis: async (data) => {
    const user = await getCurrentUser();
    return await apiCall("/saveAnalysis", "POST", {
      userId: user.userId,
      ...data,
    });
  },

  // Trades
  executeTrade: (tradeData) => apiCall("/executeTrade", "POST", tradeData),

  // Portfolio
  getPortfolio: async (userId) => {
    const response = await apiCall(`/portfolio?userId=${userId}`, "GET");
    return response?.Item || response;
  },

  syncPortfolioData: (userId) => apiCall("/syncPortfolio", "POST", { userId }),
};
