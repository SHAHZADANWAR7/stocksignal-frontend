/**
 * Enhanced Scenario Analysis
 * 
 * Enables realistic stress testing with compound shocks and regime-based correlations
 * 
 * Academic Foundation:
 * - Extreme Value Theory: Embrechts et al. (1997)
 * - Copula models for tail dependence: Joe (1997)
 * - Crisis correlation: Forbes & Rigobon (2002)
 */

import { round } from "./financialMath";

/**
 * Adjust correlation matrix based on market stress (VIX level)
 * During crises, correlations surge toward 1.0
 * 
 * @param {Array} baseCorrelationMatrix - Base n×n correlation matrix
 * @param {number} vixLevel - Current VIX level (crisis indicator)
 * @returns {Array} Stress-adjusted correlation matrix
 */
export function adjustCorrelationsForRegime(baseCorrelationMatrix, vixLevel) {
  const stressFactor = Math.min(1.5, 1 + (vixLevel - 20) / 50);
  
  return baseCorrelationMatrix.map(row =>
    row.map((corr, j) => {
      if (corr === 1.0) return 1.0;
      const adjusted = corr * stressFactor;
      return Math.min(0.95, Math.max(-0.3, adjusted));
    })
  );
}

/**
 * Calculate compound shock (market crash + sector collapse simultaneously)
 * Models realistic crisis scenarios where multiple risks materialize
 * 
 * @param {Array} companies - Company objects with sector, beta
 * @param {Array} weights - Portfolio weights
 * @param {number} marketShock - Broad market decline (e.g., -30%)
 * @param {string} vulnerableSector - Sector experiencing collapse
 * @param {number} sectorShock - Additional sector-specific decline (e.g., -40%)
 * @returns {Object} Compound shock impact analysis
 */
export function calculateCompoundShock(companies, weights, marketShock, vulnerableSector, sectorShock) {
  let totalImpact = 0;
  const assetImpacts = [];
  
  companies.forEach((company, i) => {
    const weight = weights[i];
    const beta = company.beta || 1.0;
    const sector = company.sector || 'Unknown';
    
    // Market component (beta-adjusted)
    const marketComponent = marketShock * Math.abs(beta);
    
    // Sector component (only affects vulnerable sector)
    const sectorComponent = sector === vulnerableSector ? sectorShock : 0;
    
    // Total asset decline (compound effect)
    const assetDrop = marketComponent + sectorComponent;
    const cappedDrop = Math.max(-95, assetDrop);
    
    const contribution = weight * cappedDrop;
    totalImpact += contribution;
    
    assetImpacts.push({
      symbol: company.symbol,
      name: company.name,
      sector,
      weight: round(weight * 100, 1),
      marketComponent: round(marketComponent, 1),
      sectorComponent: round(sectorComponent, 1),
      totalDrop: round(cappedDrop, 1),
      contribution: round(contribution, 1),
      isVulnerable: sector === vulnerableSector
    });
  });
  
  assetImpacts.sort((a, b) => a.totalDrop - b.totalDrop);
  
  // Estimate recovery time based on shock severity
  const shockSeverity = Math.abs(totalImpact);
  const baseRecovery = 24; // months
  const recoveryTime = Math.round(baseRecovery * (shockSeverity / 40));
  
  return {
    portfolioImpact: round(totalImpact, 1),
    marketShock,
    sectorShock,
    vulnerableSector,
    recoveryTime,
    assetImpacts
  };
}

/**
 * Calculate diversification benefit in stress scenarios
 * Measures correlation and tail risk reduction from adding diversifier
 * 
 * @param {Array} companies - Current portfolio companies
 * @param {Array} weights - Current weights
 * @param {Array} correlationMatrix - Current correlation matrix
 * @param {Object} diversifier - Asset to add (symbol, correlation, risk)
 * @param {number} diversifierAllocation - Allocation to diversifier (e.g., 0.2)
 * @returns {Object} Diversification benefit analysis
 */
export function calculateDiversificationBenefit(companies, weights, correlationMatrix, diversifier, diversifierAllocation = 0.2) {
  // Current portfolio correlation (weighted average pairwise)
  let currentCorrelation = 0;
  let pairCount = 0;
  
  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      currentCorrelation += correlationMatrix[i][j] * weights[i] * weights[j];
      pairCount++;
    }
  }
  currentCorrelation = pairCount > 0 ? currentCorrelation / pairCount : 0;
  
  // New portfolio with diversifier (scale down existing weights)
  const adjustedWeights = weights.map(w => w * (1 - diversifierAllocation));
  
  // New correlation with diversifier
  let newCorrelation = 0;
  let newPairCount = 0;
  
  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      newCorrelation += correlationMatrix[i][j] * adjustedWeights[i] * adjustedWeights[j];
      newPairCount++;
    }
    // Add diversifier correlation
    newCorrelation += (diversifier.correlation || 0.3) * adjustedWeights[i] * diversifierAllocation;
    newPairCount++;
  }
  newCorrelation = newPairCount > 0 ? newCorrelation / newPairCount : 0;
  
  // Tail risk estimate (simplified)
  const currentTailRisk = currentCorrelation * 50; // Proxy: high correlation = high tail risk
  const newTailRisk = newCorrelation * 50;
  
  return {
    currentCorrelation: round(currentCorrelation, 3),
    newCorrelation: round(newCorrelation, 3),
    correlationReduction: round((currentCorrelation - newCorrelation) * 100, 1),
    currentTailRisk: round(currentTailRisk, 1),
    newTailRisk: round(newTailRisk, 1),
    tailRiskReduction: round(currentTailRisk - newTailRisk, 1),
    diversifier: {
      symbol: diversifier.symbol,
      allocation: round(diversifierAllocation * 100, 1)
    }
  };
}

/**
 * Generate crisis scenario path (time-series)
 * Models realistic market crash with asymmetric volatility
 * 
 * @param {number} initialValue - Starting portfolio value
 * @param {number} peakDecline - Maximum drawdown (e.g., -40%)
 * @param {number} recoveryMonths - Time to recover to breakeven
 * @returns {Array} Monthly portfolio values
 */
export function generateCrisisScenarioPath(initialValue, peakDecline, recoveryMonths) {
  const path = [initialValue];
  const crashMonths = Math.round(recoveryMonths * 0.25); // 25% of time is crash
  const recoveryPhase = recoveryMonths - crashMonths;
  
  // Phase 1: Crash (fast decline)
  for (let month = 1; month <= crashMonths; month++) {
    const progress = month / crashMonths;
    const value = initialValue * (1 + peakDecline / 100 * Math.pow(progress, 1.5));
    path.push(round(value, 0));
  }
  
  // Phase 2: Recovery (slower, with volatility)
  const bottomValue = path[path.length - 1];
  for (let month = 1; month <= recoveryPhase; month++) {
    const progress = month / recoveryPhase;
    const baseValue = bottomValue + (initialValue - bottomValue) * Math.pow(progress, 0.7);
    const noise = (Math.random() - 0.5) * initialValue * 0.03;
    path.push(round(baseValue + noise, 0));
  }
  
  return path;
}
