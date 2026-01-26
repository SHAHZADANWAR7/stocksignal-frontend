import awsConfig from '../../../../../aws-config.js'; // canonical config
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

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

    const url = `${awsConfig.API.endpoints[0].endpoint}${path}`;
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

  // Transactions
  getTransactions: async (userId) => {
    const response = await apiCall(`/transactions?userId=${userId}`, "GET");
    return response?.Items || response?.items || [];
  },

  createTransaction: async (data) => {
    const response = await apiCall("/transactions", "POST", data);
    return response?.Item || response;
  },

  // Holdings
  getHoldings: async (userId) => {
    const response = await apiCall(`/holdings?userId=${userId}`, "GET");
    return response?.Items || response?.items || [];
  },

  createHolding: async (data) => {
    const response = await apiCall("/holdings", "POST", data);
    return response?.Item || response;
  },

  updateHolding: async (holdingId, data) => {
    const response = await apiCall(`/holdings/${holdingId}`, "PUT", data);
    return response?.Item || response;
  },

  deleteHolding: async (holdingId) => apiCall(`/holdings/${holdingId}`, "DELETE"),

  // Investment Journal
  getInvestmentJournals: async (userId) => {
    const response = await apiCall(`/journals?userId=${userId}`, "GET");
    return response?.Items || response?.items || [];
  },

  createInvestmentJournal: async (data) => {
    const response = await apiCall("/journals", "POST", data);
    return response?.Item || response;
  },

  // Behavioral Analysis
  analyzeBehavioralPatterns: async (prompt) => {
    const response = await apiCall("/analyzeBehavior", "POST", { prompt });
    return response?.analysis || response;
  },
};
