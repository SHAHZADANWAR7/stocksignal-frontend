// AWS API Gateway client
const API_GATEWAY_URL = 'https://4ku664jsl7.execute-api.us-east-1.amazonaws.com/Production1';

// Get JWT token from localStorage (set during login)
const getAuthToken = () => {
  return localStorage.getItem('jwt_token') || '';
};

// Make API call helper
const apiCall = async (endpoint, method = 'POST', body = null) => {
  try {
    const token = getAuthToken();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
};

// Export all API methods
export const awsApi = {
  // Stock data
  getStockQuote: (symbol) => apiCall('/getStockQuote', 'POST', { symbol }),
  getStockBatch: (symbols) => apiCall('/getStockBatch', 'POST', { symbols }),
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
};
