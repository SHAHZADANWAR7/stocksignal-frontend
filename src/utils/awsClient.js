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
  saveInvestorScore: (scoreData) =>
    invokeLambda("saveInvestorScore", { scoreData }),
  // Companies (kept from original, adjust if needed)
  getCompanies: async () => {
    try {
      const response = await invokeLambda("getCompanies", {});
      return response?.Items || response?.items || [];
    } catch {
      return [];
  // Analyses
  getPortfolioAnalyses: async (userId) => {
      const response = await invokeLambda("getPortfolioAnalyses", { userId });
  getAnalysis: async (analysisId) => {
    const response = await invokeLambda("getAnalysis", { analysisId });
    return response?.Item || response;
  saveAnalysis: async (data) => {
    return invokeLambda("saveAnalysis", data);
  // Trades
  executeTrade: (tradeData) =>
    invokeLambda("executeTrade", tradeData),
  // Portfolio
  getPortfolio: async (userId) => {
    const response = await invokeLambda("getPortfolio", { userId });
  syncPortfolioData: (userId) =>
    invokeLambda("syncPortfolio", { userId }),
  // Transactions
  getTransactions: async (userId) => {
      const response = await invokeLambda("getTransactions", { userId });
  createTransaction: async (data) => {
    const response = await invokeLambda("createTransaction", data);
  // Holdings
  getHoldings: async (userId) => {
      const response = await invokeLambda("getHoldings", { userId });
  createHolding: async (data) => {
    const response = await invokeLambda("createHolding", data);
  updateHolding: async (holdingId, data) =>
    invokeLambda("updateHolding", { holdingId, ...data }),
  deleteHolding: async (holdingId) =>
    invokeLambda("deleteHolding", { holdingId }),
  // Investment Journal
  getInvestmentJournals: async (userId) => {
      const response = await invokeLambda("getInvestmentJournals", { userId });
  createInvestmentJournal: async (data) => {
    const response = await invokeLambda("createInvestmentJournal", data);
  // Behavioral Analysis
  analyzeBehavioralPatterns: async (prompt) => {
  // User Management
  getUser: (userId) =>
    invokeLambda("getUser", { userId }),
  getUserByEmail: (email) =>
    invokeLambda("getUserByEmail", { email }),
  getCurrentUser: () =>
    invokeLambda("getCurrentUser", {}),
  updateUser: (userId, data) =>
    invokeLambda("updateUser", { userId, ...data }),
  deleteUser: (userId) =>
    invokeLambda("deleteUser", { userId }),
  // Challenges
  getChallenges: () =>
    invokeLambda("getChallenges", {}),
  createChallenge: (data) =>
    invokeLambda("createChallenge", data),
  joinChallenge: (challengeId, userId) =>
    invokeLambda("joinChallenge", { challengeId, userId }),
  getChallengeLeaderboard: (challengeId) =>
    invokeLambda("getChallengeLeaderboard", { challengeId }),
  inviteUserToChallenge: (challengeId, email) =>
    invokeLambda("inviteUserToChallenge", { challengeId, email }),
  enterChallengeWithPortfolio: (data) =>
    invokeLambda("enterChallengeWithPortfolio", data),
  syncChallengePortfolios: () =>
    invokeLambda("syncChallengePortfolios", {}),
  generateChallengeReports: () =>
    invokeLambda("generateChallengeReports", {}),
  // Simulation
  createSimulationPortfolio: (data) =>
    invokeLambda("createSimulationPortfolio", data),
  updateSimulationPortfolio: (portfolioId, data) =>
    invokeLambda("updateSimulationPortfolio", { portfolioId, ...data }),
  deleteSimulationPortfolio: (portfolioId) =>
    invokeLambda("deleteSimulationPortfolio", { portfolioId }),
  createSimulationChallenge: (data) =>
    invokeLambda("createSimulationChallenge", data),
  getSimulationResults: (simulationId) =>
    invokeLambda("getSimulationResults", { simulationId }),
  runScenarioSimulation: (data) =>
    invokeLambda("runScenarioSimulation", data),
  // Portfolio Goals
  createPortfolioGoal: (data) =>
    invokeLambda("createPortfolioGoal", data),
  updatePortfolioGoal: (goalId, data) =>
    invokeLambda("updatePortfolioGoal", { goalId, ...data }),
  deletePortfolioGoal: (goalId) =>
    invokeLambda("deletePortfolioGoal", { goalId }),
  // Black Swan
  createBlackSwanSimulation: (data) =>
    invokeLambda("createBlackSwanSimulation", data),
  getBlackSwanSimulations: (userId) =>
    invokeLambda("getBlackSwanSimulations", { userId }),
  // Subscription & Billing
  getSubscriptions: (userId) =>
    invokeLambda("getSubscriptions", { userId }),
  createSubscription: (data) =>
    invokeLambda("createSubscription", data),
  updateSubscription: (subscriptionId, data) =>
    invokeLambda("updateSubscription", { subscriptionId, ...data }),
  checkSubscription: (userId) =>
    invokeLambda("checkSubscription", { userId }),
  createCheckoutSession: (data) =>
    invokeLambda("createCheckoutSession", data),
  createPortalSession: (customerId) =>
    invokeLambda("createPortalSession", { customerId }),
  // Portfolio Optimization & Analysis
  optimizePortfolio: (data) =>
    invokeLambda("optimizePortfolio", data),
  getUserPortfolio: (userId) =>
    invokeLambda("getUserPortfolio", { userId }),
  analyzeInvestmentBehavior: (data) =>
    invokeLambda("analyzeInvestmentBehavior", data),
  // Market Insights
  generateMarketInsights: () =>
    invokeLambda("generateMarketInsights", {}),
  cacheMarketInsights: (data) =>
    invokeLambda("cacheMarketInsights", data),
  getUserTrades: (userId) =>
    invokeLambda("getUserTrades", { userId }),
  // AI/LLM
  invokeLLM: (prompt, context) =>
    invokeLambda("invokeLLM", { prompt, context }),
  // Email
  sendEmail: (data) =>
    invokeLambda("sendEmail", data),
    const response = await invokeLambda("analyzeBehavioralPatterns", { prompt });
    return response?.analysis || response;
