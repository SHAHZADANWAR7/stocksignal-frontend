import { awsApi as awsClient } from '../../../utils/awsClient';

/**
 * AWS API wrapper - delegates to awsClient which handles all auth extraction
 * (cognito_sub and user_email are auto-extracted from JWT by awsClient)
 */
export const awsApi = {
  // Generic function call
  callAwsFunction: (functionName, payload) => awsClient.callAwsFunction(functionName, payload),

  // Stock data
  getStockQuote: (symbol) => awsClient.getStockQuote(symbol),
  getStockAnalysis: (payload) => awsClient.getStockAnalysis(payload),
  getStockBatch: (symbols, forceRefresh) => awsClient.getStockBatch(symbols, forceRefresh),
  getVIXData: () => awsClient.getVIXData(),
  calculateRealBeta: (symbol) => awsClient.calculateRealBeta(symbol),

  // Portfolio operations
  getPortfolio: () => awsClient.getPortfolio(),
  getUserPortfolio: () => awsClient.getUserPortfolio(),
  syncPortfolio: (data) => awsClient.syncPortfolio(data),
  syncPortfolioData: () => awsClient.syncPortfolioData(),
  executePaperTrade: (data) => awsClient.executePaperTrade(data),
  executeTrade: (data) => awsClient.executeTrade(data),

  // Holdings
  getHoldings: () => awsClient.getHoldings(),
  createHolding: (data) => awsClient.createHolding(data),
  updateHolding: (holdingId, data) => awsClient.updateHolding(holdingId, data),
  deleteHolding: (holdingId) => awsClient.deleteHolding(holdingId),

  // Transactions
  getTransactions: () => awsClient.getTransactions(),
  createTransaction: (data) => awsClient.createTransaction(data),

  // Investment Journal
  getInvestmentJournals: () => awsClient.getInvestmentJournals(),
  createInvestmentJournal: (data) => awsClient.createInvestmentJournal(data),
  analyzeBehavioralPatterns: (prompt) => awsClient.analyzeBehavioralPatterns(prompt),

  // Portfolio Analysis
  getPortfolioAnalyses: () => awsClient.getPortfolioAnalyses(),
  getAnalysis: (analysisId) => awsClient.getAnalysis(analysisId),
  saveAnalysis: (data) => awsClient.saveAnalysis(data),
  optimizePortfolio: (data) => awsClient.optimizePortfolio(data),
  analyzeInvestmentBehavior: (data) => awsClient.analyzeInvestmentBehavior(data),
  calculatePortfolioHealth: (data) => awsClient.calculatePortfolioHealth(data), // <-- ADDED AS INSTRUCTION

  // Shadow Portfolios
  // Shadow Portfolios
  getShadowPortfolios: (email) => awsClient.getShadowPortfolios(email),
  createShadowPortfolio: (data) => awsClient.createShadowPortfolio(data),
  deleteShadowPortfolio: (userEmail, id) => awsClient.deleteShadowPortfolio(userEmail, id),

  // Investor Score
  saveInvestorScore: (data) => awsClient.saveInvestorScore(data),

  // Companies
  getCompanies: () => awsClient.getCompanies(),

  // User management
  getUser: () => awsClient.getUser(),
  getUserByEmail: (email) => awsClient.getUserByEmail(email),
  getCurrentUser: () => awsClient.getCurrentUser(),
  updateUser: (data) => awsClient.updateUser(data),
  deleteUser: () => awsClient.deleteUser(),

  // Challenges
  getChallenges: () => awsClient.getChallenges(),
  createChallenge: (data) => awsClient.createChallenge(data),
  joinChallenge: (challengeId) => awsClient.joinChallenge(challengeId),
  getChallengeLeaderboard: (challengeId) => awsClient.getChallengeLeaderboard(challengeId),
  inviteUserToChallenge: (challengeId, email) => awsClient.inviteUserToChallenge(challengeId, email),
  enterChallengeWithPortfolio: (data) => awsClient.enterChallengeWithPortfolio(data),
  syncChallengePortfolios: () => awsClient.syncChallengePortfolios(),
  generateChallengeReports: () => awsClient.generateChallengeReports(),

  // Simulation
  // Simulation
  getSimulationLabData: () => awsClient.getSimulationLabData(), // ADD THIS LINE
  createSimulationPortfolio: (data) => awsClient.createSimulationPortfolio(data),
  updateSimulationPortfolio: (portfolioId, data) => awsClient.updateSimulationPortfolio(portfolioId, data),
  deleteSimulationPortfolio: (portfolioId) => awsClient.deleteSimulationPortfolio(portfolioId),
  createSimulationChallenge: (data) => awsClient.createSimulationChallenge(data),
  getSimulationResults: (simulationId) => awsClient.getSimulationResults(simulationId),
  runScenarioSimulation: (data) => awsClient.runScenarioSimulation(data),

  // Portfolio Goals
  createPortfolioGoal: (data) => awsClient.createPortfolioGoal(data),
  updatePortfolioGoal: (goalId, data) => awsClient.updatePortfolioGoal(goalId, data),
  deletePortfolioGoal: (goalId) => awsClient.deletePortfolioGoal(goalId),

  // Black Swan Simulation
  createBlackSwanSimulation: (data) => awsClient.createBlackSwanSimulation(data),
  getBlackSwanSimulations: () => awsClient.getBlackSwanSimulations(),

  // Subscriptions
  getSubscriptions: () => awsClient.getSubscriptions(),
  createSubscription: (data) => awsClient.createSubscription(data),
  updateSubscription: (subscriptionId, data) => awsClient.updateSubscription(subscriptionId, data),
  checkSubscription: () => awsClient.checkSubscription(),
  createCheckoutSession: (data) => awsClient.createCheckoutSession(data),
  createPortalSession: (customerId) => awsClient.createPortalSession(customerId),

  // Email/Notifications
  sendWeeklySummary: () => awsClient.sendWeeklySummary(),
  sendDailyAlert: () => awsClient.sendDailyAlert(),
  sendMonthlyReport: () => awsClient.sendMonthlyReport(),
  sendNewsletter: () => awsClient.sendNewsletter(),
  sendSupportEmail: (data) => awsClient.sendSupportEmail(data),
  sendEmail: (data) => awsClient.sendEmail(data),

  // Market Insights
  generateMarketInsights: () => awsClient.generateMarketInsights(),
  cacheMarketInsights: (data) => awsClient.cacheMarketInsights(data),

  // Trades
  getUserTrades: () => awsClient.getUserTrades(),

  // LLM
  invokeLLM: (prompt, context) => awsClient.invokeLLM(prompt, context),
};

// Export individual functions for direct imports
export const {
  callAwsFunction,
  getStockQuote,
  getStockAnalysis,
  getStockBatch,
  getVIXData,
  calculateRealBeta,
  getPortfolio,
  getUserPortfolio,
  syncPortfolio,
  syncPortfolioData,
  executePaperTrade,
  executeTrade,
  getHoldings,
  createHolding,
  updateHolding,
  deleteHolding,
  getTransactions,
  createTransaction,
  getInvestmentJournals,
  createInvestmentJournal,
  analyzeBehavioralPatterns,
  getPortfolioAnalyses,
  getAnalysis,
  saveAnalysis,
  optimizePortfolio,
  analyzeInvestmentBehavior,
  calculatePortfolioHealth, // <-- ADDED TO EXPORT LIST
  getShadowPortfolios,
  createShadowPortfolio, // Add this line
  deleteShadowPortfolio, // Add this line
  saveInvestorScore,
  getCompanies,
  getUser,
  getUserByEmail,
  getCurrentUser,
  updateUser,
  deleteUser,
  getChallenges,
  createChallenge,
  joinChallenge,
  getChallengeLeaderboard,
  inviteUserToChallenge,
  enterChallengeWithPortfolio,
  syncChallengePortfolios,
  generateChallengeReports,
  createSimulationPortfolio,
  getSimulationLabData,
  updateSimulationPortfolio,
  deleteSimulationPortfolio,
  createSimulationChallenge,
  getSimulationResults,
  runScenarioSimulation,
  createPortfolioGoal,
  updatePortfolioGoal,
  deletePortfolioGoal,
  createBlackSwanSimulation,
  getBlackSwanSimulations,
  getSubscriptions,
  createSubscription,
  updateSubscription,
  checkSubscription,
  createCheckoutSession,
  createPortalSession,
  sendWeeklySummary,
  sendDailyAlert,
  sendMonthlyReport,
  sendNewsletter,
  sendSupportEmail,
  sendEmail,
  generateMarketInsights,
  cacheMarketInsights,
  getUserTrades,
  invokeLLM,
} = awsApi;
