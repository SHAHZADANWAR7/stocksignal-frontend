/**
 * Cash Opportunity Metrics
 * Analyzes idle cash and missed investment opportunities
 */

/**
 * Calculate cash opportunity metrics
 * @param {number} idleCash - Amount of uninvested cash
 * @param {Array} holdings - Current portfolio holdings
 * @param {number} marketReturn - Assumed annual market return (default 10%)
 * @returns {Object} Cash opportunity analysis
 */
export function calculateCashOpportunityMetrics(idleCash, holdings, marketReturn = 10) {
  const annualReturn = marketReturn / 100;
  
  // Missed returns on idle cash (annualized)
  const missedReturns = idleCash * annualReturn;
  
  // Identify low-yield assets
  const lowYieldAssets = [];
  
  if (holdings && holdings.length > 0) {
    holdings.forEach(holding => {
      const currentValue = holding.quantity * (holding.current_price || holding.average_cost || 0);
      const costValue = holding.quantity * (holding.average_cost || 0);
      
      if (currentValue > 0 && costValue > 0) {
        const totalReturn = ((currentValue - costValue) / costValue) * 100;
        
        // Assume annual return based on holding period (rough estimate)
        const holdingYears = 1; // Simplified - would need purchase date
        const annualizedReturn = totalReturn / holdingYears;
        
        if (annualizedReturn < 3) { // Below 3% annual return
          const opportunityCost = currentValue * (annualReturn - annualizedReturn / 100);
          lowYieldAssets.push({
            symbol: holding.symbol,
            currentYield: Math.round(annualizedReturn * 10) / 10,
            opportunityCost: Math.round(opportunityCost)
          });
        }
      }
    });
  }
  
  const totalOpportunityCost = lowYieldAssets.reduce((sum, asset) => sum + asset.opportunityCost, 0);
  
  return {
    idleCash,
    missedReturns: Math.round(missedReturns),
    lowYieldAssets,
    totalOpportunityCost: Math.round(totalOpportunityCost),
    totalMissed: Math.round(missedReturns + totalOpportunityCost)
  };
}

/**
 * Estimate market uncertainty score
 * @param {number} vixLevel - Current VIX level (optional)
 * @returns {number} Uncertainty score (0-100)
 */
export function estimateMarketUncertainty(vixLevel = null) {
  if (vixLevel !== null) {
    // VIX-based uncertainty
    // VIX < 15: Low uncertainty (20)
    // VIX 15-25: Normal (40-60)
    // VIX > 25: High uncertainty (70-100)
    if (vixLevel < 15) return 20;
    if (vixLevel < 20) return 40;
    if (vixLevel < 25) return 60;
    if (vixLevel < 35) return 80;
    return 100;
  }
  
  // Heuristic-based estimate (without VIX data)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Base uncertainty
  let uncertainty = 50;
  
  // Seasonal adjustments (simplified)
  if (currentMonth === 0 || currentMonth === 11) {
    uncertainty += 5; // Year-end volatility
  }
  
  // Election year adjustment (US)
  if (currentYear % 4 === 0) {
    uncertainty += 10;
  }
  
  return Math.min(100, Math.max(0, uncertainty));
}
