import awsClient from './awsClient';

export const awsApi = {
  // Stock data
  getStockQuote: async (symbol) => {
    return awsClient.getStockQuote(symbol);
  },

  getStockAnalysis: async (symbol) => {
    return awsClient.getStockAnalysis(symbol);
  },

  // Portfolio calculations
  calculateExpectedReturn: async (data) => {
    return awsClient.calculateExpectedReturn(data);
  },

  getPortfolioAnalysis: async (data) => {
    return awsClient.getPortfolioAnalysis(data);
  },

  saveAnalysis: async (data) => {
    return awsClient.saveAnalysis(data);
  },

  // Market data
  getVIXData: async () => {
    return awsClient.getVIXData();
  },

  // Email
  sendEmail: async (data) => {
    return awsClient.sendEmail(data);
  },

  // Subscription
  checkSubscription: async (email) => {
    return awsClient.checkSubscription(email);
  },

  // Usage tracking
  getUsageStats: async (email) => {
    return awsClient.getUsageStats(email);
  },

  updateUsageStats: async (email, action) => {
    return awsClient.updateUsageStats(email, action);
  },

  // User
  getCurrentUser: async () => {
    return awsClient.getCurrentUser();
  },

  // LLM
  invokeLLM: async (data) => {
    return awsClient.invokeLLM(data);
  },
};

export default awsApi;
