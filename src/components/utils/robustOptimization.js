/**
 * Robust Portfolio Optimization
 * Alternative optimization methods beyond Markowitz
 * 
 * Academic Foundation:
 * - Risk Parity: Qian (2005) "Risk Parity Portfolios"
 * - Minimum Variance: Clarke et al. (2006)
 * - Equal Weight: DeMiguel et al. (2009) "Optimal Versus Naive Diversification"
 */

import { round } from "./financialMath";

/**
 * Risk Parity Portfolio
 * Allocates capital so each asset contributes equally to portfolio risk
 * 
 * @param {Array} risks - Array of asset volatilities (%)
 * @param {Array} correlations - n×n correlation matrix
 * @returns {Array} Risk parity weights
 */
export function calculateRiskParityWeights(risks, correlations) {
  const n = risks.length;
  
  // Simplified risk parity: inverse volatility weighting
  // More sophisticated version would use iterative optimization
  const invVols = risks.map(r => 1 / r);
  const sumInvVols = invVols.reduce((a, b) => a + b, 0);
  
  const weights = invVols.map(iv => iv / sumInvVols);
  
  return weights.map(w => round(w, 4));
}

/**
 * Minimum Variance Portfolio
 * Finds allocation that minimizes portfolio variance
 * 
 * @param {Array} risks - Asset volatilities (%)
 * @param {Array} correlations - n×n correlation matrix
 * @returns {Array} Minimum variance weights
 */
export function calculateMinimumVarianceWeights(risks, correlations) {
  const n = risks.length;
  
  // Build covariance matrix
  const covMatrix = [];
  for (let i = 0; i < n; i++) {
    covMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      covMatrix[i][j] = (risks[i] / 100) * (risks[j] / 100) * correlations[i][j];
    }
  }
  
  // Simplified: inverse of sum of covariance matrix rows
  const rowSums = covMatrix.map(row => row.reduce((a, b) => a + b, 0));
  const invRowSums = rowSums.map(s => 1 / s);
  const sumInvRowSums = invRowSums.reduce((a, b) => a + b, 0);
  
  const weights = invRowSums.map(irs => irs / sumInvRowSums);
  
  return weights.map(w => round(w, 4));
}

/**
 * Equal Weight Portfolio (1/n)
 * Simplest diversification strategy
 * 
 * @param {number} n - Number of assets
 * @returns {Array} Equal weights
 */
export function calculateEqualWeights(n) {
  const weight = 1 / n;
  return Array(n).fill(round(weight, 4));
}

/**
 * Maximum Diversification Portfolio
 * Maximizes diversification ratio
 * 
 * @param {Array} risks - Asset volatilities (%)
 * @param {Array} correlations - n×n correlation matrix
 * @returns {Array} Maximum diversification weights
 */
export function calculateMaxDiversificationWeights(risks, correlations) {
  const n = risks.length;
  
  // Approximate: weight inversely by correlation-adjusted risk
  const avgCorrelations = correlations.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    return (sum - 1) / (n - 1); // Exclude diagonal
  });
  
  const adjustedRisks = risks.map((r, i) => r * (1 + avgCorrelations[i]));
  const invAdjustedRisks = adjustedRisks.map(ar => 1 / ar);
  const sumInvAdjustedRisks = invAdjustedRisks.reduce((a, b) => a + b, 0);
  
  const weights = invAdjustedRisks.map(iar => iar / sumInvAdjustedRisks);
  
  return weights.map(w => round(w, 4));
}

/**
 * Hierarchical Risk Parity (HRP)
 * Uses clustering to build diversified portfolio
 * Simplified implementation
 * 
 * @param {Array} risks - Asset volatilities (%)
 * @param {Array} correlations - n×n correlation matrix
 * @returns {Array} HRP weights
 */
export function calculateHRPWeights(risks, correlations) {
  const n = risks.length;
  
  // Simplified HRP: cluster by correlation, then apply inverse variance
  // Full implementation would use proper hierarchical clustering
  
  // Step 1: Inverse variance weights as base
  const invVars = risks.map(r => 1 / (r * r));
  const sumInvVars = invVars.reduce((a, b) => a + b, 0);
  
  let weights = invVars.map(iv => iv / sumInvVars);
  
  // Step 2: Apply correlation penalty
  for (let i = 0; i < n; i++) {
    let corPenalty = 1;
    for (let j = 0; j < n; j++) {
      if (i !== j && correlations[i][j] > 0.7) {
        corPenalty *= 0.95; // Reduce weight for highly correlated assets
      }
    }
    weights[i] *= corPenalty;
  }
  
  // Renormalize
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  weights = weights.map(w => w / sumWeights);
  
  return weights.map(w => round(w, 4));
}

/**
 * Black-Litterman Portfolio
 * Combines market equilibrium with investor views
 * Simplified implementation
 * 
 * @param {Array} marketWeights - Market cap weights
 * @param {Array} expectedReturns - Investor's expected returns (%)
 * @param {Array} risks - Asset volatilities (%)
 * @returns {Array} Black-Litterman adjusted weights
 */
export function calculateBlackLittermanWeights(marketWeights, expectedReturns, risks) {
  // Simplified: blend market weights with return-optimized weights
  const returnScores = expectedReturns.map((r, i) => r / risks[i]);
  const sumScores = returnScores.reduce((a, b) => a + b, 0);
  const returnWeights = returnScores.map(s => s / sumScores);
  
  // 70% market weights, 30% return-optimized
  const blendedWeights = marketWeights.map((mw, i) => 0.7 * mw + 0.3 * returnWeights[i]);
  
  return blendedWeights.map(w => round(w, 4));
}
