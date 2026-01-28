import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Initialize Lambda client with credentials from environment
const lambdaClient = new LambdaClient({
  region: import.meta.env.VITE_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

// Generic Lambda invocation
const invokeLambda = async (functionName, payload) => {
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    if (result.errorMessage) {
      throw new Error(result.errorMessage);
    }

    return result;
  } catch (error) {
    console.error(`Lambda invocation failed: ${functionName}`, error);
    throw error;
  }
};

// Export all API methods
export const awsApi = {
  // Stock data
  getStockQuote: (symbol) =>
    invokeLambda("getStockQuote", { symbol }),
  getStockBatch: (symbols, forceRefresh = true) =>
    invokeLambda("getStockBatch", { symbols, forceRefresh }),
  getStockAnalysis: (payload) =>
    invokeLambda("getStockAnalysis", payload),
  getVIXData: () =>
    invokeLambda("getVIXData", {}),

  // Trading
  executePaperTrade: (tradeData) =>
    invokeLambda("executePaperTrade", tradeData),
  syncPortfolio: (portfolioData) =>
    invokeLambda("syncPortfolio", portfolioData),

  // Beta
  calculateRealBeta: (symbol) =>
    invokeLambda("calculateRealBeta", { symbol }),

  // Emails
  sendWeeklySummary: (email) =>
    invokeLambda("sendWeeklySummary", { email }),
  sendDailyAlert: (email) =>
    invokeLambda("sendDailyAlert", { email }),
  sendMonthlyReport: (email) =>
    invokeLambda("sendMonthlyReport", { email }),
  sendNewsletter: (email) =>
    invokeLambda("sendNewsletter", { email }),
  sendSupportEmail: (data) =>
    invokeLambda("sendSupportEmail", data),

  // Shadow Portfolios
  getShadowPortfolios: (userId) =>
    invokeLambda("getShadowPortfolios", { userId }),

  // Investor Score
  getInvestorScore: () =>
    invokeLambda("getInvestorScore", {}),
  analyzeInvestorBehavior: (prompt, metrics) =>
    invokeLambda("analyzeInvestorBehavior", { prompt, metrics }),
  saveInvestorScore: (scoreData) =>
    invokeLambda("saveInvestorScore", { scoreData }),

  // Companies (kept from original, adjust if needed)
  getCompanies: async () => {
    try {
      const response = await invokeLambda("getCompanies", {});
      return response?.Items || response?.items || [];
    } catch {
      return [];
    }
  },

  // Analyses
  getPortfolioAnalyses: async (userId) => {
    try {
      const response = await invokeLambda("getPortfolioAnalyses", { userId });
      return response?.Items || response?.items || [];
    } catch {
      return [];
    }
  },

  getAnalysis: async (analysisId) => {
    const response = await invokeLambda("getAnalysis", { analysisId });
    return response?.Item || response;
  },

  saveAnalysis: async (data) => {
    return invokeLambda("saveAnalysis", data);
  },

  // Trades
  executeTrade: (tradeData) =>
    invokeLambda("executeTrade", tradeData),

  // Portfolio
  getPortfolio: async (userId) => {
    const response = await invokeLambda("getPortfolio", { userId });
    return response?.Item || response;
  },

  syncPortfolioData: (userId) =>
    invokeLambda("syncPortfolio", { userId }),

  // Transactions
  getTransactions: async (userId) => {
    try {
      const response = await invokeLambda("getTransactions", { userId });
      return response?.Items || response?.items || [];
    } catch {
      return [];
    }
  },

  createTransaction: async (data) => {
    const response = await invokeLambda("createTransaction", data);
    return response?.Item || response;
  },

  // Holdings
  getHoldings: async (userId) => {
    try {
      const response = await invokeLambda("getHoldings", { userId });
      return response?.Items || response?.items || [];
    } catch {
      return [];
    }
  },

  createHolding: async (data) => {
    const response = await invokeLambda("createHolding", data);
    return response?.Item || response;
  },

  updateHolding: async (holdingId, data) =>
    invokeLambda("updateHolding", { holdingId, ...data }),

  deleteHolding: async (holdingId) =>
    invokeLambda("deleteHolding", { holdingId }),

  // Investment Journal
  getInvestmentJournals: async (userId) => {
    try {
      const response = await invokeLambda("getInvestmentJournals", { userId });
      return response?.Items || response?.items || [];
    } catch {
      return [];
    }
  },

  createInvestmentJournal: async (data) => {
    const response = await invokeLambda("createInvestmentJournal", data);
    return response?.Item || response;
  },

  // Behavioral Analysis
  analyzeBehavioralPatterns: async (prompt) => {
    const response = await invokeLambda("analyzeBehavioralPatterns", { prompt });
    return response?.analysis || response;
  },
};
