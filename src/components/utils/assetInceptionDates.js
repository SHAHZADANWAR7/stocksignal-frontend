/**
 * Asset Inception Dates
 * Historical data availability for backtesting and analysis
 * 
 * Critical for:
 * - Preventing survivorship bias in backtests
 * - Accurate historical correlation calculations
 * - Realistic portfolio construction (can't invest before IPO)
 */

/**
 * Known asset inception dates (IPO dates or major listing events)
 * Source: Historical market data, company filings
 */
export const ASSET_INCEPTION_DATES = {
  // Major Tech (FAANG+)
  'AAPL': '1980-12-12', // Apple Computer IPO
  'MSFT': '1986-03-13', // Microsoft IPO
  'GOOGL': '2004-08-19', // Google IPO
  'GOOG': '2004-08-19', // Google Class C (same as GOOGL)
  'AMZN': '1997-05-15', // Amazon IPO
  'META': '2012-05-18', // Facebook IPO
  'NFLX': '2002-05-23', // Netflix IPO (traded OTC before)
  'TSLA': '2010-06-29', // Tesla IPO
  
  // Semiconductors
  'NVDA': '1999-01-22', // NVIDIA IPO
  'AMD': '1979-09-01', // AMD IPO (approximate)
  'INTC': '1971-10-13', // Intel IPO
  
  // Other Tech
  'ORCL': '1986-03-12', // Oracle IPO
  'CRM': '2004-06-23', // Salesforce IPO
  'ADBE': '1986-08-20', // Adobe IPO
  
  // Consumer Discretionary
  'HD': '1981-09-22', // Home Depot IPO
  'NKE': '1980-12-02', // Nike IPO
  'MCD': '1965-04-21', // McDonald's IPO
  'SBUX': '1992-06-26', // Starbucks IPO
  'TGT': '1967-10-18', // Target (Dayton Corp)
  
  // Healthcare
  'JNJ': '1944-09-25', // Johnson & Johnson public
  'PFE': '1944-06-22', // Pfizer IPO
  'UNH': '1984-10-16', // UnitedHealth IPO
  'ABBV': '2013-01-02', // AbbVie spinoff from Abbott
  
  // Financials
  'JPM': '1980-03-05', // JPMorgan modern entity
  'BAC': '1929-09-30', // Bank of America (approximate)
  'V': '2008-03-19', // Visa IPO
  'MA': '2006-05-25', // Mastercard IPO
  'GS': '1999-05-04', // Goldman Sachs IPO
  
  // Energy
  'XOM': '1920-01-01', // ExxonMobil (approximate, very old)
  'CVX': '1926-01-01', // Chevron (approximate)
  
  // Consumer Staples
  'PG': '1890-01-01', // Procter & Gamble (very old)
  'KO': '1919-09-05', // Coca-Cola IPO
  'PEP': '1965-11-22', // PepsiCo modern form
  'WMT': '1970-10-01', // Walmart IPO
  'COST': '1985-12-05', // Costco IPO
  
  // ETFs (critical for backtest validity)
  'SPY': '1993-01-22', // SPDR S&P 500 - first US-listed ETF
  'QQQ': '1999-03-10', // Invesco QQQ (Nasdaq-100)
  'IWM': '2000-05-22', // iShares Russell 2000
  'DIA': '1998-01-14', // SPDR Dow Jones Industrial Average
  'VTI': '2001-05-31', // Vanguard Total Stock Market
  'VOO': '2010-09-07', // Vanguard S&P 500
  'IVV': '2000-05-15', // iShares Core S&P 500
  
  // Sector ETFs
  'XLK': '1998-12-16', // Technology Select Sector SPDR
  'XLF': '1998-12-16', // Financial Select Sector SPDR
  'XLE': '1998-12-16', // Energy Select Sector SPDR
  'XLV': '1998-12-16', // Health Care Select Sector SPDR
  'XLY': '1998-12-16', // Consumer Discretionary SPDR
  'XLP': '1998-12-16', // Consumer Staples SPDR
  
  // Bond ETFs
  'AGG': '2003-09-22', // iShares Core US Aggregate Bond
  'BND': '2007-04-03', // Vanguard Total Bond Market
  'TLT': '2002-07-22', // iShares 20+ Year Treasury Bond
  
  // International ETFs
  'EFA': '2001-08-14', // iShares MSCI EAFE
  'VEA': '2007-07-20', // Vanguard FTSE Developed Markets
  'VWO': '2005-03-04', // Vanguard FTSE Emerging Markets
  'EEM': '2003-04-07', // iShares MSCI Emerging Markets
};

/**
 * Check if asset existed on a given date
 * @param {string} symbol - Asset ticker symbol
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {boolean} True if asset existed on that date
 */
export function assetExistedOn(symbol, date) {
  const inceptionDate = ASSET_INCEPTION_DATES[symbol];
  
  if (!inceptionDate) {
    // Unknown inception date - assume it existed (conservative)
    console.warn(`Unknown inception date for ${symbol}, assuming it existed`);
    return true;
  }
  
  const inception = new Date(inceptionDate);
  const checkDate = new Date(date);
  
  return checkDate >= inception;
}

/**
 * Get earliest common date for a set of assets
 * Critical for historical correlation calculations
 * 
 * @param {Array} symbols - Array of asset symbols
 * @returns {string} ISO date string of earliest common date
 */
export function getEarliestCommonDate(symbols) {
  let latestInception = null;
  
  symbols.forEach(symbol => {
    const inception = ASSET_INCEPTION_DATES[symbol];
    
    if (inception) {
      const inceptionDate = new Date(inception);
      if (!latestInception || inceptionDate > latestInception) {
        latestInception = inceptionDate;
      }
    }
  });
  
  // If no inception dates found, default to 20 years ago
  if (!latestInception) {
    latestInception = new Date();
    latestInception.setFullYear(latestInception.getFullYear() - 20);
  }
  
  return latestInception.toISOString().split('T')[0];
}

/**
 * Validate backtest period for portfolio
 * @param {Array} symbols - Asset symbols in portfolio
 * @param {string} startDate - Backtest start date
 * @param {string} endDate - Backtest end date
 * @returns {Object} Validation result with issues
 */
export function validateBacktestPeriod(symbols, startDate, endDate) {
  const issues = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  symbols.forEach(symbol => {
    if (!assetExistedOn(symbol, startDate)) {
      const inception = ASSET_INCEPTION_DATES[symbol];
      issues.push({
        symbol,
        issue: 'did_not_exist',
        message: `${symbol} did not exist on ${startDate} (inception: ${inception || 'unknown'})`,
        recommendation: `Start backtest from ${inception || 'unknown date'}`
      });
    }
  });
  
  // Check if backtest period is reasonable
  const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
  if (daysDiff < 365) {
    issues.push({
      issue: 'short_period',
      message: 'Backtest period less than 1 year',
      recommendation: 'Use at least 1 year for meaningful results'
    });
  }
  
  return {
    valid: issues.length === 0,
    issues,
    earliestCommonDate: getEarliestCommonDate(symbols),
    backtestDays: Math.round(daysDiff)
  };
}

/**
 * Get maximum lookback period for portfolio
 * Useful for historical analysis constraints
 * 
 * @param {Array} symbols - Asset symbols
 * @returns {Object} Lookback information
 */
export function getMaxLookbackPeriod(symbols) {
  const earliestDate = getEarliestCommonDate(symbols);
  const earliest = new Date(earliestDate);
  const today = new Date();
  
  const daysDiff = (today - earliest) / (1000 * 60 * 60 * 24);
  const yearsDiff = daysDiff / 365.25;
  
  return {
    earliestDate,
    maxDays: Math.floor(daysDiff),
    maxYears: Math.floor(yearsDiff),
    recommendation: yearsDiff >= 10 
      ? '10+ years of data available for robust analysis'
      : yearsDiff >= 5
      ? '5-10 years available, sufficient for most analyses'
      : 'Limited historical data, interpret results cautiously'
  };
}
