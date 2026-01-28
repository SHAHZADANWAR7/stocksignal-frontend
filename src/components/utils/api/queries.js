/**
 * React Query Hooks for Data Fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { get, post, put, del } from 'aws-amplify/api';
import awsApi from './awsApi';

// Query keys for consistent caching
export const QUERY_KEYS = {
  USER: 'user',
  HOLDINGS: 'holdings',
  PORTFOLIO: 'portfolio',
  COMPANIES: 'companies',
  INDEX_FUNDS: 'indexFunds',
  TRANSACTIONS: 'transactions',
  TRADES: 'trades',
  PORTFOLIO_HEALTH: 'portfolioHealth',
  INVESTOR_SCORE: 'investorScore',
  GOALS: 'goals',
  MARKET_DATA: 'marketData',
  SUBSCRIPTION: 'subscription',
};

/**
 * Get current authenticated user
 */
export function useUser() {
  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      try {
        const user = await getCurrentUser();
        return user;
      } catch (error) {
        return null;
      }
    },
  });
}

/**
 * Get user's holdings
 */
export function useHoldings() {
  return useQuery({
    queryKey: [QUERY_KEYS.HOLDINGS],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/holdings',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching holdings:', error);
        return [];
      }
    },
  });
}

/**
 * Get portfolio details
 */
export function usePortfolio() {
  return useQuery({
    queryKey: [QUERY_KEYS.PORTFOLIO],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/portfolio',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || null;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
      }
    },
  });
}

/**
 * Get all companies
 */
export function useCompanies() {
  return useQuery({
    queryKey: [QUERY_KEYS.COMPANIES],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/companies',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
  });
}

/**
 * Get single company by symbol
 */
export function useCompany(symbol) {
  return useQuery({
    queryKey: [QUERY_KEYS.COMPANIES, symbol],
    queryFn: async () => {
      try {
        const response = await awsApi.getStockAnalysis(symbol);
        return response.data || null;
      } catch (error) {
        console.error('Error fetching company:', error);
        return null;
      }
    },
    enabled: !!symbol,
  });
}

/**
 * Get index funds
 */
export function useIndexFunds() {
  return useQuery({
    queryKey: [QUERY_KEYS.INDEX_FUNDS],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/index-funds',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching index funds:', error);
        return [];
      }
    },
  });
}

/**
 * Get user's transactions
 */
export function useTransactions() {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/transactions',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
  });
}

/**
 * Get user's trades
 */
export function useTrades() {
  return useQuery({
    queryKey: [QUERY_KEYS.TRADES],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/trades',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching trades:', error);
        return [];
      }
    },
  });
}

/**
 * Get portfolio health metrics
 */
export function usePortfolioHealth() {
  return useQuery({
    queryKey: [QUERY_KEYS.PORTFOLIO_HEALTH],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/portfolio/health',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || null;
      } catch (error) {
        console.error('Error fetching portfolio health:', error);
        return null;
      }
    },
  });
}

/**
 * Get investor score
 */
export function useInvestorScore() {
  return useQuery({
    queryKey: [QUERY_KEYS.INVESTOR_SCORE],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/investor-score',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || null;
      } catch (error) {
        console.error('Error fetching investor score:', error);
        return null;
      }
    },
  });
}

/**
 * Get user's goals
 */
export function useGoals() {
  return useQuery({
    queryKey: [QUERY_KEYS.GOALS],
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        const response = await get({
          apiName: 'api',
          path: '/goals',
          options: {
            headers: {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`,
            },
          },
        }).response;
        const data = await response.body.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
      }
    },
  });
}

/**
 * Get market data
 */
export function useMarketData() {
  return useQuery({
    queryKey: [QUERY_KEYS.MARKET_DATA],
    queryFn: async () => {
      try {
        const response = await awsApi.getVIXData();
        return response.data || null;
      } catch (error) {
        console.error('Error fetching market data:', error);
        return null;
      }
    },
  });
}

/**
 * Get subscription status
 */
export function useSubscription() {
  const { data: user } = useUser();
  
  return useQuery({
    queryKey: [QUERY_KEYS.SUBSCRIPTION, user?.username],
    queryFn: async () => {
      if (!user?.username) return null;
      try {
        const response = await awsApi.checkSubscription(user.username);
        return response || null;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    },
    enabled: !!user?.username,
  });
}

/**
 * Create holding mutation
 */
export function useCreateHolding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (holdingData) => {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'api',
        path: '/holdings',
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
          body: holdingData,
        },
      }).response;
      const data = await response.body.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOLDINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PORTFOLIO] });
    },
  });
}

/**
 * Update holding mutation
 */
export function useUpdateHolding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const session = await fetchAuthSession();
      const response = await put({
        apiName: 'api',
        path: `/holdings/${id}`,
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
          body: data,
        },
      }).response;
      const responseData = await response.body.json();
      return responseData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOLDINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PORTFOLIO] });
    },
  });
}

/**
 * Delete holding mutation
 */
export function useDeleteHolding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const session = await fetchAuthSession();
      const response = await del({
        apiName: 'api',
        path: `/holdings/${id}`,
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
        },
      }).response;
      const data = await response.body.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOLDINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PORTFOLIO] });
    },
  });
}

/**
 * Create goal mutation
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalData) => {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'api',
        path: '/goals',
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
          body: goalData,
        },
      }).response;
      const data = await response.body.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GOALS] });
    },
  });
}

/**
 * Update goal mutation
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const session = await fetchAuthSession();
      const response = await put({
        apiName: 'api',
        path: `/goals/${id}`,
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
          body: data,
        },
      }).response;
      const responseData = await response.body.json();
      return responseData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GOALS] });
    },
  });
}

/**
 * Delete goal mutation
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const session = await fetchAuthSession();
      const response = await del({
        apiName: 'api',
        path: `/goals/${id}`,
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
        },
      }).response;
      const data = await response.body.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GOALS] });
    },
  });
}

/**
 * Execute trade mutation
 */
export function useExecuteTrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tradeData) => {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'api',
        path: '/trades',
        options: {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`,
          },
          body: tradeData,
        },
      }).response;
      const data = await response.body.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRADES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOLDINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PORTFOLIO] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
    },
  });
}
