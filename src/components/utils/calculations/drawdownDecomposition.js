/**
 * Drawdown Decomposition
 * Analyzes which assets contribute most to portfolio drawdown risk
 * 
 * Academic Foundation:
 * - Drawdown attribution: Chekhlov et al. (2005) "Drawdown measure in portfolio optimization"
 * - Component VaR: Garman (1996) "Improving on VaR"
 * - Marginal risk contribution: Euler's theorem for risk decomposition
 */

import { round } from "./financialMath";

/**
 * Calculate asset contribution to portfolio drawdown
 * Uses marginal contribution analysis
 * 
 * @param {Array} weights - Asset weights (decimal)
 * @param {Array} risks - Asset volatilities (%)
 * @param {Array} betas - Asset betas vs portfolio
 * @param {number} portfolioDrawdown - Portfolio max drawdown (%)
 * @returns {Array} Asset drawdown contributions
 */
export function decomposeDrawdown(weights, risks, betas, portfolioDrawdown) {
  const n = weights.length;
  
  // Calculate each asset's marginal contribution to drawdown
  const contributions = [];
  let totalContribution = 0;

  for (let i = 0; i < n; i++) {
    // Marginal drawdown contribution = weight × beta × asset risk
    const marginal = weights[i] * (betas[i] || 1.0) * (risks[i] / 100);
    const contribution = marginal * portfolioDrawdown;
    
    contributions.push({
      assetIndex: i,
      weight: round(weights[i] * 100, 1),
      risk: round(risks[i], 1),
      beta: round(betas[i] || 1.0, 2),
      marginalContribution: round(marginal, 4),
      drawdownContribution: round(contribution, 2),
      percentOfDrawdown: 0 // Will be calculated after summing
    });

    totalContribution += contribution;
  }

  // Normalize contributions to sum to 100%
  contributions.forEach(c => {
    c.percentOfDrawdown = round((c.drawdownContribution / totalContribution) * 100, 1);
  });

  // Sort by contribution (highest first)
  contributions.sort((a, b) => b.drawdownContribution - a.drawdownContribution);

  return contributions;
}

/**
 * Identify top drawdown contributors
 * @param {Array} contributions - Output from decomposeDrawdown
 * @param {number} threshold - Contribution threshold (default 10%)
 * @returns {Array} Top contributors
 */
export function identifyTopContributors(contributions, threshold = 10) {
  return contributions.filter(c => c.percentOfDrawdown >= threshold);
}

/**
 * Calculate diversification benefit for drawdown
 * Measures how much diversification reduces drawdown vs single largest position
 * 
 * @param {Array} weights - Asset weights (decimal)
 * @param {Array} risks - Asset volatilities (%)
 * @param {number} portfolioDrawdown - Portfolio max drawdown (%)
 * @returns {Object} Diversification metrics
 */
export function calculateDrawdownDiversificationBenefit(weights, risks, portfolioDrawdown) {
  // Worst-case: entire portfolio in highest-risk asset
  const maxRisk = Math.max(...risks);
  const worstCaseDrawdown = maxRisk * 1.5; // Rule of thumb: max drawdown ≈ 1.5× volatility

  // Diversification benefit
  const benefit = worstCaseDrawdown - portfolioDrawdown;
  const benefitPercent = (benefit / worstCaseDrawdown) * 100;

  return {
    portfolioDrawdown: round(portfolioDrawdown, 1),
    worstCaseDrawdown: round(worstCaseDrawdown, 1),
    diversificationBenefit: round(benefit, 1),
    benefitPercent: round(benefitPercent, 1),
    message: `Diversification reduces drawdown risk by ${round(benefitPercent, 1)}%`
  };
}

/**
 * Estimate recovery time from drawdown
 * Based on expected return and volatility
 * 
 * @param {number} drawdownPercent - Drawdown magnitude (positive %, e.g., 30 for -30%)
 * @param {number} expectedReturn - Annual expected return (%)
 * @param {number} volatility - Annual volatility (%)
 * @returns {Object} Recovery time estimates
 */
export function estimateRecoveryTime(drawdownPercent, expectedReturn, volatility) {
  // Recovery return needed
  const recoveryReturn = drawdownPercent / (100 - drawdownPercent);

  // Expected recovery time (deterministic)
  const deterministicYears = Math.log(1 + recoveryReturn) / Math.log(1 + expectedReturn / 100);

  // Stochastic adjustment for volatility
  // Higher volatility → longer expected recovery
  const volatilityAdjustment = 1 + (volatility / 100) * 0.3;
  const stochasticYears = deterministicYears * volatilityAdjustment;

  return {
    drawdownPercent: round(drawdownPercent, 1),
    recoveryReturnNeeded: round(recoveryReturn * 100, 1),
    expectedRecoveryYears: round(stochasticYears, 1),
    optimisticYears: round(deterministicYears, 1),
    pessimisticYears: round(stochasticYears * 1.5, 1),
    message: `Expected recovery: ${round(stochasticYears, 1)} years (range: ${round(deterministicYears, 1)}-${round(stochasticYears * 1.5, 1)} years)`
  };
}

/**
 * Decompose drawdown by sector
 * Aggregates asset contributions by sector
 * 
 * @param {Array} companies - Array of company objects with sector
 * @param {Array} contributions - Asset drawdown contributions
 * @returns {Array} Sector-level contributions
 */
export function decomposeDrawdownBySector(companies, contributions) {
  const sectorMap = new Map();

  contributions.forEach((contrib, i) => {
    const sector = companies[i]?.sector || 'Unknown';
    
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, {
        sector,
        totalWeight: 0,
        drawdownContribution: 0,
        percentOfDrawdown: 0,
        assetCount: 0
      });
    }

    const sectorData = sectorMap.get(sector);
    sectorData.totalWeight += contrib.weight;
    sectorData.drawdownContribution += contrib.drawdownContribution;
    sectorData.percentOfDrawdown += contrib.percentOfDrawdown;
    sectorData.assetCount += 1;
  });

  const sectorContributions = Array.from(sectorMap.values());
  
  // Sort by contribution
  sectorContributions.sort((a, b) => b.drawdownContribution - a.drawdownContribution);

  return sectorContributions.map(s => ({
    sector: s.sector,
    totalWeight: round(s.totalWeight, 1),
    drawdownContribution: round(s.drawdownContribution, 2),
    percentOfDrawdown: round(s.percentOfDrawdown, 1),
    assetCount: s.assetCount
  }));
}

/**
 * Analyze tail risk concentration
 * Identifies if drawdown risk is concentrated in few assets
 * 
 * @param {Array} contributions - Asset drawdown contributions
 * @returns {Object} Concentration analysis
 */
export function analyzeTailRiskConcentration(contributions) {
  // Calculate concentration using top contributors
  const top3 = contributions.slice(0, 3);
  const top5 = contributions.slice(0, 5);

  const top3Percent = top3.reduce((sum, c) => sum + c.percentOfDrawdown, 0);
  const top5Percent = top5.reduce((sum, c) => sum + c.percentOfDrawdown, 0);

  let concentrationLevel = 'low';
  if (top3Percent > 70) {
    concentrationLevel = 'high';
  } else if (top3Percent > 50) {
    concentrationLevel = 'medium';
  }

  return {
    top3Contribution: round(top3Percent, 1),
    top5Contribution: round(top5Percent, 1),
    concentrationLevel,
    message: `Top 3 assets contribute ${round(top3Percent, 1)}% of drawdown risk (${concentrationLevel} concentration)`
  };
}
