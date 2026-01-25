/**
 * Subscription and Usage Management
 */

import { Auth } from 'aws-amplify';
import awsApi from './api/awsApi';

/**
 * Check if user has active premium subscription
 * @param {string} userEmail - User's email address
 * @returns {Object} { isPremium: boolean, status: string, expirationDate: string }
 */
export async function checkSubscription(userEmail) {
  try {
    // Check if user is admin (automatic premium access for testing)
    const user = await Auth.currentAuthenticatedUser();
    if (user?.attributes?.['custom:role'] === 'admin') {
      return {
        isPremium: true,
        status: 'admin',
        expirationDate: null
      };
    }

    // Call AWS API to check subscription status
    const response = await awsApi.checkSubscription(userEmail);
    
    return {
      isPremium: response?.isActive || false,
      status: response?.status || 'none',
      expirationDate: response?.expirationDate || null
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      isPremium: false,
      status: 'error',
      expirationDate: null
    };
  }
}

/**
 * Get or initialize user usage stats
 * @param {string} userEmail - User's email address
 * @returns {Object} Usage statistics
 */
export async function getUserUsageStats(userEmail) {
  try {
    const stats = await awsApi.getUsageStats(userEmail);
    
    // Return stats with defaults if not found
    return {
      weeklyAnalyses: stats?.weeklyAnalyses || 0,
      totalAnalyses: stats?.totalAnalyses || 0,
      weeklyTrades: stats?.weeklyTrades || 0,
      totalTrades: stats?.totalTrades || 0,
      totalSessions: stats?.totalSessions || 0,
      weekStartDate: stats?.weekStartDate || getWeekStart(),
      lastResetDate: stats?.lastResetDate || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      weeklyAnalyses: 0,
      totalAnalyses: 0,
      weeklyTrades: 0,
      totalTrades: 0,
      totalSessions: 0,
      weekStartDate: getWeekStart(),
      lastResetDate: new Date().toISOString()
    };
  }
}

/**
 * Check if new week has started
 * @param {string} weekStartDate - ISO date string of week start
 * @returns {boolean} True if new week
 */
export function isNewWeek(weekStartDate) {
  const currentWeekStart = getWeekStart();
  return currentWeekStart !== weekStartDate;
}

/**
 * Get start of current week (Monday at 00:00)
 * @returns {string} ISO date string
 */
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

/**
 * Update user usage statistics
 * @param {string} userEmail - User's email address
 * @param {Object} updates - Statistics to update
 */
export async function updateUsageStats(userEmail, updates) {
  try {
    const currentStats = await getUserUsageStats(userEmail);
    
    // Merge updates with current stats
    const updatedStats = {
      ...currentStats,
      ...updates
    };
    
    // Save to backend
    await awsApi.post('/usage/update', {
      email: userEmail,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Error updating usage stats:', error);
  }
}

/**
 * Track AI analysis usage
 * @param {string} userEmail - User's email address
 */
export async function trackAnalysisUsage(userEmail) {
  try {
    const stats = await getUserUsageStats(userEmail);
    
    // Check if new week
    if (isNewWeek(stats.weekStartDate)) {
      // Reset weekly counter
      await updateUsageStats(userEmail, {
        weeklyAnalyses: 1,
        totalAnalyses: stats.totalAnalyses + 1,
        weekStartDate: getWeekStart()
      });
    } else {
      // Increment counters
      await updateUsageStats(userEmail, {
        weeklyAnalyses: stats.weeklyAnalyses + 1,
        totalAnalyses: stats.totalAnalyses + 1
      });
    }
  } catch (error) {
    console.error('Error tracking analysis usage:', error);
  }
}

/**
 * Check if user has reached weekly AI analysis limit
 * @param {string} userEmail - User's email address
 * @returns {boolean} True if limit reached
 */
export async function hasReachedWeeklyLimit(userEmail) {
  try {
    // Check if user is premium
    const subscription = await checkSubscription(userEmail);
    if (subscription.isPremium) {
      return false; // Premium users have unlimited access
    }

    // Check if user is admin
    const user = await Auth.currentAuthenticatedUser();
    if (user?.attributes?.['custom:role'] === 'admin') {
      return false;
    }

    // Get usage stats
    const stats = await getUserUsageStats(userEmail);
    
    // Free tier limit: 3 AI analyses per week
    const weeklyLimit = 3;
    
    return stats.weeklyAnalyses >= weeklyLimit;
  } catch (error) {
    console.error('Error checking weekly limit:', error);
    return false; // Don't block on error
  }
}

/**
 * Track trade execution
 * @param {string} userEmail - User's email address
 */
export async function trackTradeUsage(userEmail) {
  try {
    const stats = await getUserUsageStats(userEmail);
    
    await updateUsageStats(userEmail, {
      weeklyTrades: stats.weeklyTrades + 1,
      totalTrades: stats.totalTrades + 1
    });
  } catch (error) {
    console.error('Error tracking trade usage:', error);
  }
}

/**
 * Track user session
 * @param {string} userEmail - User's email address
 */
export async function trackSessionUsage(userEmail) {
  try {
    const stats = await getUserUsageStats(userEmail);
    
    await updateUsageStats(userEmail, {
      totalSessions: stats.totalSessions + 1
    });
  } catch (error) {
    console.error('Error tracking session usage:', error);
  }
}

/**
 * Get remaining analyses for the week
 * @param {string} userEmail - User's email address
 * @returns {number} Remaining analysis count (Infinity for premium users)
 */
export async function getRemainingAnalyses(userEmail) {
  try {
    // Check if user is premium
    const subscription = await checkSubscription(userEmail);
    if (subscription.isPremium) {
      return Infinity;
    }

    // Check if user is admin
    const user = await Auth.currentAuthenticatedUser();
    if (user?.attributes?.['custom:role'] === 'admin') {
      return Infinity;
    }

    // Get usage stats
    const stats = await getUserUsageStats(userEmail);
    
    // Free tier limit: 3 AI analyses per week
    const weeklyLimit = 3;
    
    return Math.max(0, weeklyLimit - stats.weeklyAnalyses);
  } catch (error) {
    console.error('Error getting remaining analyses:', error);
    return 0;
  }
}
