import awsApi from './awsApi';

/**
 * Get cached stock data
 * @param {string} symbol - Stock symbol
 * @param {string} dataType - Type of data (quote, analysis, etc.)
 * @returns {Object|null} Cached data or null
 */
export async function getCachedStockData(symbol, dataType) {
  try {
    const cacheKey = `${symbol}_${dataType}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Cache valid for 5 minutes
      if (now - data.timestamp < 5 * 60 * 1000) {
        return data.value;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Set cached stock data
 * @param {string} symbol - Stock symbol
 * @param {string} dataType - Type of data
 * @param {Object} value - Data to cache
 */
export async function setCachedStockData(symbol, dataType, value) {
  try {
    const cacheKey = `${symbol}_${dataType}`;
    const data = {
      value,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
}

/**
 * Clear cache for a symbol
 * @param {string} symbol - Stock symbol
 */
export async function clearCacheForSymbol(symbol) {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(`${symbol}_`)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
