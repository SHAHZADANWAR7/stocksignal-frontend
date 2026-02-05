import { fetchAuthSession } from 'aws-amplify/auth';

// Proxy configuration 
const PROXY_CONFIG = {
  API_GATEWAY_URL: import.meta.env.VITE_AWS_API_GATEWAY_URL || "https://4ku664jsl7.execute-api.us-east-1.amazonaws.com/Production1",
  API_KEY: import.meta.env.VITE_AWS_API_KEY,
  PROXY_ENDPOINT: "apiGatewayProxy"
};

// ========== KEY MAPPING CONFIGURATION ==========
// Maps lambda functions to the correct key type they expect
const LAMBDA_KEY_MAPPING = {
  // functions using cognito_sub
  cognito_sub: [
    "getUser",
    "updateUser",
    "deleteUser",
    "getCurrentUser"
  ],
  // functions using user_id (which is cognito_sub)
  user_id: [
    "getUserPortfolio",
    "getUserTrades",
    "getShadowPortfolios",
    "saveInvestorScore",
    "getPortfolioAnalyses",
    "syncPortfolioData",
    "getTransactions",
    "getBlackSwanSimulations",
    "getSubscriptions",
    "checkSubscription",
    "analyzeInvestmentBehavior",
    "syncPortfolio",
    "executePaperTrade",
    "executeTrade",
    "getPortfolio"
  ],
  // functions using user_email
  user_email: [
    "getHoldings",
    "createHolding",
    "updateHolding",
    "deleteHolding",
    "getInvestmentJournals",
    "createInvestmentJournal",
    "sendWeeklySummary",
    "sendDailyAlert",
    "sendMonthlyReport",
    "sendNewsletter",
    "getUserDashboardData"
  ]
};

// Get JWT token, cognito_sub, and user email from Cognito
const getAuthData = async () => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    
    const token = idToken?.toString();
    const cognitoSub = idToken?.payload?.sub;
    const userEmail = idToken?.payload?.email;
    
    console.log('🔐 getAuthData - Auth data retrieved:', {
      tokenPresent: !!token,
      cognitoSub: cognitoSub || 'MISSING',
      userEmail: userEmail || 'MISSING'
    });
    
    return {
      token,
      cognitoSub,
      userEmail
    };
  } catch (error) {
    console.warn('❌ getAuthData - Could not get auth data:', error);
    return {
      token: null,
      cognitoSub: null,
      userEmail: null
    };
  }
};

// Determine which key type a function needs
const getKeyTypeForFunction = (functionName) => {
  if (LAMBDA_KEY_MAPPING.cognito_sub.includes(functionName)) return 'cognito_sub';
  if (LAMBDA_KEY_MAPPING.user_id.includes(functionName)) return 'user_id';
  if (LAMBDA_KEY_MAPPING.user_email.includes(functionName)) return 'user_email';
  return 'cognito_sub'; // default fallback
};

// Get auth headers with proper key mapping
const getAuthHeaders = async () => {
  const { token, cognitoSub, userEmail } = await getAuthData();
  
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': PROXY_CONFIG.API_KEY
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Pass all identifiers; lambdas will use what they need
  if (cognitoSub) {
    headers['x-cognito-sub'] = cognitoSub;
  }
  
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }
  
  console.log('🔐 getAuthHeaders - Headers prepared:', {
    authorizationPresent: !!headers['Authorization'],
    xCognitoSubPresent: !!headers['x-cognito-sub'],
    xUserEmailPresent: !!headers['x-user-email'],
    xApiKeyPresent: !!headers['x-api-key']
  });
  
  return headers;
};

// Generic proxy invocation - calls through apiGatewayProxy
const invokeProxy = async (functionName, payload = {}) => {
  try {
    console.log(`📡 invokeProxy - Starting invocation for: ${functionName}`, { payload });
    
    const headers = await getAuthHeaders();
    const { cognitoSub, userEmail } = await getAuthData();
    
    // Determine which key this function needs
    const keyType = getKeyTypeForFunction(functionName);
    const enhancedPayload = { ...payload };
    
    // Add x-user-id header for functions that need user_id
    if (keyType === 'user_id' && cognitoSub) {
      headers['x-user-id'] = cognitoSub;
      enhancedPayload.userId = cognitoSub;
    } else if (keyType === 'cognito_sub' && cognitoSub) {
      enhancedPayload.cognitoSub = cognitoSub;
    } else if (keyType === 'user_email' && userEmail) {
      enhancedPayload.userEmail = userEmail;
    }
    
    console.log(`📡 invokeProxy - Request details for ${functionName}:`, {
      url: `${PROXY_CONFIG.API_GATEWAY_URL}/${PROXY_CONFIG.PROXY_ENDPOINT}`,
      keyType,
      headersKeys: Object.keys(headers),
      payload: enhancedPayload
    });
    
    const response = await fetch(`${PROXY_CONFIG.API_GATEWAY_URL}/${PROXY_CONFIG.PROXY_ENDPOINT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        functionName,
        payload: enhancedPayload
      })
    });

    console.log(`📡 invokeProxy - Response status for ${functionName}: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ invokeProxy - Success for ${functionName}:`, data);
    
    if (data.errorMessage) {
      throw new Error(data.errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ invokeProxy - Proxy invocation failed for ${functionName}:`, error);
    throw error;
  }
};

// Export all API methods
export const awsApi = {
  callAwsFunction: (functionName, payload) => invokeProxy(functionName, payload),
  getStockQuote: (symbol) => invokeProxy("getStockQuote", { symbol }),
  getStockBatch: (symbols, forceRefresh = true) => invokeProxy("getStockBatch", { symbols, forceRefresh }),
  getStockAnalysis: (payload) => invokeProxy("getStockAnalysis", payload),
  getVIXData: () => invokeProxy("getVIXData", {}),
  executePaperTrade: (tradeData) => invokeProxy("executePaperTrade", tradeData),
  syncPortfolio: (portfolioData) => invokeProxy("syncPortfolio", portfolioData),
  calculateRealBeta: (symbol) => invokeProxy("calculateRealBeta", { symbol }),
  sendWeeklySummary: () => invokeProxy("sendWeeklySummary", {}),
  sendDailyAlert: () => invokeProxy("sendDailyAlert", {}),
  sendMonthlyReport: () => invokeProxy("sendMonthlyReport", {}),
  sendNewsletter: () => invokeProxy("sendNewsletter", {}),
  sendSupportEmail: (data) => invokeProxy("sendSupportEmail", data),
  getShadowPortfolios: () => invokeProxy("getShadowPortfolios", {}),
  saveInvestorScore: (scoreData) => invokeProxy("saveInvestorScore", { scoreData }),
  getCompanies: async () => { try { const response = await invokeProxy("getCompanies", {}); return response?.Items || response?.items || []; } catch { return []; } },
  getPortfolioAnalyses: async () => { const response = await invokeProxy("getPortfolioAnalyses", {}); return response?.Items || response?.items || []; },
  getAnalysis: async (analysisId) => { const response = await invokeProxy("getAnalysis", { analysisId }); return response?.Item || response; },
  saveAnalysis: async (data) => invokeProxy("saveAnalysis", data),
  executeTrade: (tradeData) => invokeProxy("executeTrade", tradeData),
  getPortfolio: async () => { const response = await invokeProxy("getPortfolio", {}); return response?.Item || response; },
  syncPortfolioData: () => invokeProxy("syncPortfolio", {}),
  getTransactions: async () => { const response = await invokeProxy("getTransactions", {}); return response?.Items || response?.items || []; },
  createTransaction: async (data) => invokeProxy("createTransaction", data),
  getHoldings: async () => { const response = await invokeProxy("getHoldings", {}); return response?.Items || response?.items || []; },
  createHolding: async (data) => invokeProxy("createHolding", data),
  updateHolding: async (holdingId, data) => invokeProxy("updateHolding", { holdingId, ...data }),
  deleteHolding: async (holdingId) => invokeProxy("deleteHolding", { holdingId }),
  getInvestmentJournals: async () => { const response = await invokeProxy("getInvestmentJournals", {}); return response?.Items || response?.items || []; },
  createInvestmentJournal: async (data) => invokeProxy("createInvestmentJournal", data),
  analyzeBehavioralPatterns: async (prompt) => { const response = await invokeProxy("analyzeBehavioralPatterns", { prompt }); return response?.analysis || response; },
  getUser: () => invokeProxy("getUser", {}),
  getUserByEmail: (email) => invokeProxy("getUserByEmail", { email }),
  getCurrentUser: () => invokeProxy("getCurrentUser", {}),
  updateUser: (data) => invokeProxy("updateUser", data),
  deleteUser: () => invokeProxy("deleteUser", {}),
  getChallenges: () => invokeProxy("getChallenges", {}),
  createChallenge: (data) => invokeProxy("createChallenge", data),
  joinChallenge: (challengeId) => invokeProxy("joinChallenge", { challengeId }),
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
  getBlackSwanSimulations: () => invokeProxy("getBlackSwanSimulations", {}),
  getSubscriptions: () => invokeProxy("getSubscriptions", {}),
  createSubscription: (data) => invokeProxy("createSubscription", data),
  updateSubscription: (subscriptionId, data) => invokeProxy("updateSubscription", { subscriptionId, ...data }),
  checkSubscription: () => invokeProxy("checkSubscription", {}),
  createCheckoutSession: (data) => invokeProxy("createCheckoutSession", data),
  createPortalSession: (customerId) => invokeProxy("createPortalSession", { customerId }),
  optimizePortfolio: (data) => invokeProxy("optimizePortfolio", data),
  getUserPortfolio: () => invokeProxy("getUserPortfolio", {}),
  analyzeInvestmentBehavior: (data) => invokeProxy("analyzeInvestmentBehavior", data),
  generateMarketInsights: () => invokeProxy("generateMarketInsights", {}),
  cacheMarketInsights: (data) => invokeProxy("cacheMarketInsights", data),
  getUserTrades: () => invokeProxy("getUserTrades", {}),
  invokeLLM: (prompt, context) => invokeProxy("invokeLLM", { prompt, context }),
  sendEmail: (data) => invokeProxy("sendEmail", data),
  getUserDashboardData: async () => { const response = await invokeProxy("getUserDashboardData", {}); return response; },
};
