/**
 * Cash Opportunity Metrics
 * Analyzes idle cash and missed investment opportunities
 * 
 * MERGED VERSION: Combines best features from both development and deployment
 * - Time-adjusted calculations (from development)
 * - Configurable market return (from deployment)
 * - Performance-based low-yield detection (from deployment)
 * - VIX support (from deployment)
 * - Comprehensive seasonal modeling (from both)
 */

/**
 * Calculate cash opportunity metrics
 * 
 * @param {number} idleCashAmount - Amount of uninvested cash
 * @param {number} idleCashMonths - Months cash has been idle (CRITICAL for accuracy)
 * @param {Array} holdings - Current portfolio holdings
 * @param {number} marketReturn - Assumed annual market return (default 10%)
 * @returns {Object} Comprehensive cash opportunity analysis
 */
export function calculateCashOpportunityMetrics(idleCashAmount, idleCashMonths, holdings = [], marketReturn = 10) {
  const cash = parseFloat(idleCashAmount) || 0;
  const months = parseFloat(idleCashMonths) || 0;
  const annualReturn = marketReturn / 100;
  
  // TIME-ADJUSTED MISSED RETURNS (from development - CRITICAL!)
  // Accounts for actual period cash was idle
  const missedReturns = cash * annualReturn * (months / 12);
  
  // IDENTIFY LOW-YIELD ASSETS (from deployment - performance-based)
  const lowYieldAssets = [];
  
  if (holdings && holdings.length > 0) {
    holdings.forEach(holding => {
      const currentValue = holding.quantity * (holding.current_price || holding.average_cost || 0);
      const costValue = holding.quantity * (holding.average_cost || 0);
      
      if (currentValue > 0 && costValue > 0) {
        // Calculate actual performance
        const totalReturn = ((currentValue - costValue) / costValue) * 100;
        
        // Simplified annualized return (would need purchase date for accuracy)
        const holdingYears = 1;
        const annualizedReturn = totalReturn / holdingYears;
        
        // Flag assets with <3% annual return as low-yield
        if (annualizedReturn < 3) {
          const opportunityCost = currentValue * (annualReturn - annualizedReturn / 100);
          lowYieldAssets.push({
            symbol: holding.symbol,
            current_yield: Math.round(annualizedReturn * 10) / 10,
            opportunity_cost: Math.round(opportunityCost)
          });
        }
      }
    });
  }
  
  // TOTAL OPPORTUNITY COST
  const totalOpportunityCost = lowYieldAssets.reduce((sum, asset) => sum + asset.opportunity_cost, 0);
  const totalMissed = missedReturns + totalOpportunityCost;
  
  // PORTFOLIO CONTEXT
  const portfolioValue = holdings.reduce((sum, h) => 
    sum + (h.quantity * (h.current_price || h.average_cost || 0)), 0);
  
  return {
    // Primary metrics
    idle_cash_amount: cash,
    missed_returns: Math.round(missedReturns),
    low_yield_assets: lowYieldAssets,
    total_opportunity_cost: Math.round(totalOpportunityCost),
    total_missed: Math.round(totalMissed),
    
    // Context for AI/LLM analysis
    context: {
      annualReturnUsed: marketReturn,
      monthsIdle: months,
      portfolioValue: Math.round(portfolioValue),
      lowYieldAssetsCount: lowYieldAssets.length
    }
  };
}

/**
 * Estimate market uncertainty score
 * 
 * @param {number} vixLevel - Current VIX level (optional - if null, uses heuristic)
 * @returns {number} Uncertainty score (0-100)
 * 
 * MERGED LOGIC:
 * - VIX-based calculation when available (from deployment)
 * - Comprehensive seasonal heuristics as fallback (from both versions)
 */
export function estimateMarketUncertainty(vixLevel = null) {
  // PRIORITY 1: Use actual VIX data if available (from deployment)
  if (vixLevel !== null && typeof vixLevel === 'number') {
    // VIX-based uncertainty mapping
    // VIX < 15: Low uncertainty (calm markets)
    // VIX 15-25: Normal volatility
    // VIX > 25: High uncertainty (fear/panic)
    if (vixLevel < 15) return 20;
    if (vixLevel < 20) return 40;
    if (vixLevel < 25) return 60;
    if (vixLevel < 35) return 80;
    return 100;
  }
  
  // FALLBACK: Heuristic-based estimate (no VIX data)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Base uncertainty (neutral market)
  let uncertainty = 50;
  
  // SEASONAL ADJUSTMENTS (from both versions - merged)
  
  // January effect: Post-holiday uncertainty
  if (currentMonth === 0) {
    uncertainty += 5;
  }
  
  // Summer lull: Historically calmer markets (from development)
  if (currentMonth >= 5 && currentMonth <= 7) {
    uncertainty -= 5;
  }
  
  // Year-end volatility: December tax-loss harvesting, rebalancing (from deployment)
  if (currentMonth === 11) {
    uncertainty += 5;
  }
  
  // Election year volatility: US presidential elections (from both)
  if (currentYear % 4 === 0) {
    uncertainty += 10;
  }
  
  // Ensure bounds [0, 100]
  return Math.min(100, Math.max(0, uncertainty));
}

/**
 * BACKWARD COMPATIBILITY ALIAS
 * Maintains compatibility with older code using original function name
 */
export function calculateCashOpportunity(idleCashAmount, idleCashMonths, holdings = []) {
  return calculateCashOpportunityMetrics(idleCashAmount, idleCashMonths, holdings, 8);
}
