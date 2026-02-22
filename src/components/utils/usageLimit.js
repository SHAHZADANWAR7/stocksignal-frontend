import { awsApi } from './api/awsApi';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

/**
 * Get the start of the current week (Monday)
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
 * Check if user has exceeded usage limits
 * @param {string} userEmail - User's email
 * @param {string} actionType - Type of action ('analysis' or 'premium')
 * @returns {Object} { allowed: boolean, message: string }
 */
export async function checkUsageLimit(userEmail, actionType = 'analysis') {
  try {
    // Get user identity locally from Amplify (Safe, Fast, No 401)
    const authUser = await getCurrentUser().catch(() => null);
    const session = await fetchAuthSession().catch(() => null);
    const attributes = session?.tokens?.idToken?.payload || {};

    // Admins have unlimited usage
    if (attributes['custom:role'] === 'admin') {
      return { allowed: true, message: '' };
    }

    // Check subscription status
    const subscription = await awsApi.checkSubscription(userEmail);
    if (subscription?.isActive) {
      return { allowed: true, message: '' };
    }

    // Get usage stats
    const stats = await awsApi.getUsageStats(userEmail);
    const weekStart = getWeekStart();

    // Check weekly limits for free users
    const limits = {
      analysis: 3,
      premium: 0,
    };

    const weeklyUsage = stats?.weeklyUsage || {};
    const currentWeekUsage = weeklyUsage[weekStart] || { analysis: 0, premium: 0 };

    if (currentWeekUsage[actionType] >= limits[actionType]) {
      return {
        allowed: false,
        message: `You've reached your weekly limit of ${limits[actionType]} ${actionType} actions. Upgrade to Premium for unlimited access.`,
      };
    }

    return { allowed: true, message: '' };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: true, message: '' }; // Allow on error to avoid blocking users
  }
}

/**
 * Increment usage count for a user
 * @param {string} userEmail - User's email
 * @param {string} actionType - Type of action ('analysis' or 'premium')
 */
export async function incrementUsage(userEmail, actionType = 'analysis') {
  try {
    // Get user identity locally from Amplify (Safe, Fast, No 401)
    const authUser = await getCurrentUser().catch(() => null);
    const session = await fetchAuthSession().catch(() => null);
    const attributes = session?.tokens?.idToken?.payload || {};

    // Don't track admin usage
    if (attributes['custom:role'] === 'admin') {
      return;
    }

    // Check subscription status
    const subscription = await awsApi.checkSubscription(userEmail);
    if (subscription?.isActive) {
      return; // Don't track premium user usage
    }

    await awsApi.updateUsageStats(userEmail, actionType);
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

/**
 * Get remaining usage for the week
 * @param {string} userEmail - User's email
 * @param {string} actionType - Type of action ('analysis' or 'premium')
 * @returns {number} Remaining usage count
 */
export async function getRemainingUsage(userEmail, actionType = 'analysis') {
  try {
    // Get user identity locally from Amplify (Safe, Fast, No 401)
    const authUser = await getCurrentUser().catch(() => null);
    const session = await fetchAuthSession().catch(() => null);
    const attributes = session?.tokens?.idToken?.payload || {};

    // Admins have unlimited
    if (attributes['custom:role'] === 'admin') {
      return 999;
    }

    // Check subscription status
    const subscription = await awsApi.checkSubscription(userEmail);
    if (subscription?.isActive) {
      return 999; // Unlimited for premium
    }

    // Get usage stats
    const stats = await awsApi.getUsageStats(userEmail);
    const weekStart = getWeekStart();

    const limits = {
      analysis: 3,
      premium: 0,
    };

    const weeklyUsage = stats?.weeklyUsage || {};
    const currentWeekUsage = weeklyUsage[weekStart] || { analysis: 0, premium: 0 };

    return Math.max(0, limits[actionType] - currentWeekUsage[actionType]);
  } catch (error) {
    console.error('Error getting remaining usage:', error);
    return 0;
  }
}
