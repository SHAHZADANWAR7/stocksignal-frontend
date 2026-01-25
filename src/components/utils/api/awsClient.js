import { Auth, API } from 'aws-amplify';

class AWSClient {
  constructor() {
    this.apiName = 'api';
  }

  async getCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getIdToken() {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  async apiCall(path, method = 'GET', body = null) {
    try {
      const token = await this.getIdToken();
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        config.body = body;
      }

      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await API.get(this.apiName, path, config);
          break;
        case 'POST':
          response = await API.post(this.apiName, path, config);
          break;
        case 'PUT':
          response = await API.put(this.apiName, path, config);
          break;
        case 'DELETE':
          response = await API.del(this.apiName, path, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  async get(path) {
    return this.apiCall(path, 'GET');
  }

  async post(path, body) {
    return this.apiCall(path, 'POST', body);
  }

  async put(path, body) {
    return this.apiCall(path, 'PUT', body);
  }

  async delete(path) {
    return this.apiCall(path, 'DELETE');
  }

  async getStockQuote(symbol) {
    return this.get(`/stock/quote/${symbol}`);
  }

  async getStockAnalysis(symbol) {
    return this.get(`/stock/analysis/${symbol}`);
  }

  async calculateExpectedReturn(data) {
    return this.post('/portfolio/expected-return', data);
  }

  async getVIXData() {
    return this.get('/market/vix');
  }

  async getPortfolioAnalysis(data) {
    return this.post('/portfolio/analysis', data);
  }

  async saveAnalysis(data) {
    return this.post('/portfolio/save-analysis', data);
  }

  async sendEmail(data) {
    return this.post('/email/send', data);
  }

  async checkSubscription(email) {
    return this.get(`/subscription/check/${email}`);
  }

  async getUsageStats(email) {
    return this.get(`/usage/stats/${email}`);
  }

  async updateUsageStats(email, action) {

  async invokeLLM(data) {
    return this.post('/llm/invoke', data);
  }
    return this.post('/usage/update', { email, action });

  async invokeLLM(data) {
    return this.post('/llm/invoke', data);
  }
  }

  async invokeLLM(data) {
    return this.post('/llm/invoke', data);
  }
}

export default new AWSClient();
