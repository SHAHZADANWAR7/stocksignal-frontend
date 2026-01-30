// Proxy configuration - uses Base44 secrets
const PROXY_CONFIG = {
  API_GATEWAY_URL: import.meta.env.VITE_AWS_API_GATEWAY_URL || "https://4ku664jsl7.execute-api.us-east-1.amazonaws.com/Production1",
  API_KEY: import.meta.env.VITE_AWS_API_KEY,
  PROXY_ENDPOINT: "apiGatewayProxy"
};

// Generic proxy invocation - calls through apiGatewayProxy
const invokeProxy = async (functionName, payload) => {
  try {
    const response = await fetch(`${PROXY_CONFIG.API_GATEWAY_URL}/${PROXY_CONFIG.PROXY_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PROXY_CONFIG.API_KEY
      },
      body: JSON.stringify({
        functionName,
        payload
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errorMessage) {
      throw new Error(data.errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`Proxy invocation failed: ${functionName}`, error);
    throw error;
  }
};

// Export all API methods
export const awsApi = {
  getStockQuote: (symbol) => invokeProxy("getStockQuote", { symbol }),
  getStockBatch: (symbols, forceRefresh = true) => invokeProxy("getStockBatch", { symbols, forceRefresh }),
  getStockAnalysis: (payload) => invokeProxy("getStockAnalysis", payload),
  getVIXData: () => invokeProxy("getVIXData", {}),
  executePaperTrade: (tradeData) => invokeProxy("executePaperTrade", tradeData),
  syncPortfolio: (portfolioData) => invokeProxy("syncPortfolio", portfolioData),
  calculateRealBeta: (symbol) => invokeProxy("calculateRealBeta", { symbol }),
  sendWeeklySummary: (email) => invokeProxy("sendWeeklySummary", { email }),
  sendDailyAlert: (email) => invokeProxy("sendDailyAlert", { email }),
  sendMonthlyReport: (email) => invokeProxy("sendMonthlyReport", { email }),
  sendNewsletter: (email) => invokeProxy("sendNewsletter", { email }),
  sendSupportEmail: (data) => invokeProxy("sendSupportEmail", data),
  getShadowPortfolios: (userId) => invokeProxy("getShadowPortfolios", { userId }),
  saveInvestorScore: (scoreData) => invokeProxy("saveInvestorScore", { scoreData }),
  getCompanies: async () => { try { const response = await invokeProxy("getCompanies", {}); return response?.Items || response?.items || []; } catch { return []; } },
  getPortfolioAnalyses: async (userId) => { const response = await invokeProxy("getPortfolioAnalyses", { userId }); return response?.Items || response?.items || []; },
  getAnalysis: async (analysisId) => { const response = await invokeProxy("getAnalysis", { analysisId }); return response?.Item || response; },
  saveAnalysis: async (data) => invokeProxy("saveAnalysis", data),
  executeTrade: (tradeData) => invokeProxy("executeTrade", tradeData),
  getPortfolio: async (userId) => { const response = await invokeProxy("getPortfolio", { userId }); return response?.Item || response; },
  syncPortfolioData: (userId) => invokeProxy("syncPortfolio", { userId }),
  getTransactions: async (userId) => { const response = await invokeProxy("getTransactions", { userId }); return response?.Items || response?.items || []; },
  createTransaction: async (data) => invokeProxy("createTransaction", data),
  getHoldings: async (userId) => { const response = await invokeProxy("getHoldings", { userId }); return response?.Items || response?.items || []; },
  createHolding: async (data) => invokeProxy("createHolding", data),
  updateHolding: async (holdingId, data) => invokeProxy("updateHolding", { holdingId, ...data }),
  deleteHolding: async (holdingId) => invokeProxy("deleteHolding", { holdingId }),
  getInvestmentJournals: async (userId) => { const response = await invokeProxy("getInvestmentJournals", { userId }); return response?.Items || response?.items || []; },
  createInvestmentJournal: async (data) => invokeProxy("createInvestmentJournal", data),
  analyzeBehavioralPatterns: async (prompt) => { const response = await invokeProxy("analyzeBehavioralPatterns", { prompt }); return response?.analysis || response; },
  getUser: (userId) => invokeProxy("getUser", { userId }),
  getUserByEmail: (email) => invokeProxy("getUserByEmail", { email }),
  getCurrentUser: () => invokeProxy("getCurrentUser", {}),
  updateUser: (userId, data) => invokeProxy("updateUser", { userId, ...data }),
  deleteUser: (userId) => invokeProxy("deleteUser", { userId }),
  getChallenges: () => invokeProxy("getChallenges", {}),
  createChallenge: (data) => invokeProxy("createChallenge", data),
  joinChallenge: (challengeId, userId) => invokeProxy("joinChallenge", { challengeId, userId }),
  getChallengeLeaderboard: (challengeId) => invokeProxy("getChallengeLeaderboard", { challengeId }),
  inviteUserToChallenge: (challengeId, email) => invokeProxy("inviteUserToChallenge", { challengeId, email }),
  enterChallengeWithPortfolio: (data) => invokeProxy("enterChallengeWithPortfolio", data),
  syncChallengePortfolios: () => invokeProxy("syncChallengePortfolios", {}),
  generateChallengeReports: () => invokeProxy("generateChallengeReports", {}),
  createSimulationPortfolio: (data) => invokeProxy("createSimulationPortfolio", data),
  updateSimulationPortfolio: (portfolioId, data) => invokeProxy("updateSimulationPortfolio", { portfolioId, ...data }),
  deleteSimulationPortfolio: (portfolioId) => invokeProxy("deleteSimulationPortfolio", { portfolioId }),
  createSimulationChallenge: (data) => invokeProxy("createSimulationChallenge", data),
  getSimulationResults: (simulationId) => invokeProxy("getSimulationResults", { simulationId }),
  runScenarioSimulation: (data) => invokeProxy("runScenarioSimulation", data),
  createPortfolioGoal: (data) => invokeProxy("createPortfolioGoal", data),
  updatePortfolioGoal: (goalId, data) => invokeProxy("updatePortfolioGoal", { goalId, ...data }),
  deletePortfolioGoal: (goalId) => invokeProxy("deletePortfolioGoal", { goalId }),
  createBlackSwanSimulation: (data) => invokeProxy("createBlackSwanSimulation", data),
  getBlackSwanSimulations: (userId) => invokeProxy("getBlackSwanSimulations", { userId }),
  getSubscriptions: (userId) => invokeProxy("getSubscriptions", { userId }),
  createSubscription: (data) => invokeProxy("createSubscription", data),
  updateSubscription: (subscriptionId, data) => invokeProxy("updateSubscription", { subscriptionId, ...data }),
  checkSubscription: (userId) => invokeProxy("checkSubscription", { userId }),
  createCheckoutSession: (data) => invokeProxy("createCheckoutSession", data),
  createPortalSession: (customerId) => invokeProxy("createPortalSession", { customerId }),
  optimizePortfolio: (data) => invokeProxy("optimizePortfolio", data),
  getUserPortfolio: (userId) => invokeProxy("getUserPortfolio", { userId }),
  analyzeInvestmentBehavior: (data) => invokeProxy("analyzeInvestmentBehavior", data),
  generateMarketInsights: () => invokeProxy("generateMarketInsights", {}),
  cacheMarketInsights: (data) => invokeProxy("cacheMarketInsights", data),
  getUserTrades: (userId) => invokeProxy("getUserTrades", { userId }),
  invokeLLM: (prompt, context) => invokeProxy("invokeLLM", { prompt, context }),
  sendEmail: (data) => invokeProxy("sendEmail", data),
};
