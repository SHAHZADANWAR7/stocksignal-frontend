/**
 * Global Consistency Engine
 * Ensures all portfolio calculations remain consistent across analysis sessions
 * 
 * Problem: Same portfolio can yield different results due to:
 * - Floating point arithmetic
 * - Market data updates mid-session
 * - Optimization algorithm randomness
 * 
 * Solution: Lock calculations within a session, store snapshots for reproducibility
 */

import { round } from "./financialMath";

/**
 * Create session snapshot for reproducibility
 * @param {Object} portfolioData - Complete portfolio calculation inputs
 * @returns {Object} Session snapshot with hash
 */
export function createSessionSnapshot(portfolioData) {
  const { companies, weights, expectedReturns, risks, correlations, timestamp } = portfolioData;
  
  const snapshot = {
    sessionId: generateSessionId(),
    timestamp: timestamp || new Date().toISOString(),
    companies: companies.map(c => ({
      symbol: c.symbol,
      name: c.name,
      sector: c.sector,
      beta: c.beta,
      expected_return: c.expected_return,
      risk: c.risk
    })),
    weights: weights.map(w => round(w, 6)),
    expectedReturns: expectedReturns.map(r => round(r, 4)),
    risks: risks.map(r => round(r, 4)),
    correlations: correlations.map(row => row.map(c => round(c, 4))),
    hash: null // Will be calculated
  };
  
  snapshot.hash = hashSnapshot(snapshot);
  
  return snapshot;
}

/**
 * Generate unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hash snapshot for integrity checking
 * @param {Object} snapshot - Session snapshot
 * @returns {string} Hash string
 */
function hashSnapshot(snapshot) {
  const stringified = JSON.stringify({
    companies: snapshot.companies,
    weights: snapshot.weights,
    expectedReturns: snapshot.expectedReturns,
    risks: snapshot.risks,
    correlations: snapshot.correlations
  });
  
  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < stringified.length; i++) {
    const char = stringified.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return hash.toString(16);
}

/**
 * Verify calculation consistency with snapshot
 * @param {Object} newResults - Newly calculated results
 * @param {Object} snapshot - Original session snapshot
 * @param {number} tolerance - Acceptable deviation (default 0.01%)
 * @returns {Object} Consistency report
 */
export function verifyConsistency(newResults, snapshot, tolerance = 0.01) {
  const issues = [];
  
  // Check weights sum
  const weightSum = newResults.weights.reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.001) {
    issues.push({
      type: 'weights',
      message: `Weights sum to ${round(weightSum * 100, 2)}% instead of 100%`,
      severity: 'high'
    });
  }
  
  // Compare portfolio return
  const expectedReturn = snapshot.weights.reduce((sum, w, i) => 
    sum + w * snapshot.expectedReturns[i], 0
  );
  const returnDeviation = Math.abs(newResults.portfolioReturn - expectedReturn);
  
  if (returnDeviation > tolerance) {
    issues.push({
      type: 'return',
      message: `Portfolio return deviates by ${round(returnDeviation, 2)}%`,
      expected: round(expectedReturn, 2),
      actual: round(newResults.portfolioReturn, 2),
      severity: 'medium'
    });
  }
  
  // Compare portfolio risk
  let portfolioVariance = 0;
  const n = snapshot.weights.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cov = (snapshot.risks[i] / 100) * (snapshot.risks[j] / 100) * snapshot.correlations[i][j];
      portfolioVariance += snapshot.weights[i] * snapshot.weights[j] * cov;
    }
  }
  const expectedRisk = Math.sqrt(portfolioVariance) * 100;
  const riskDeviation = Math.abs(newResults.portfolioRisk - expectedRisk);
  
  if (riskDeviation > tolerance) {
    issues.push({
      type: 'risk',
      message: `Portfolio risk deviates by ${round(riskDeviation, 2)}%`,
      expected: round(expectedRisk, 2),
      actual: round(newResults.portfolioRisk, 2),
      severity: 'medium'
    });
  }
  
  return {
    consistent: issues.length === 0,
    issues,
    snapshot: snapshot.hash,
    timestamp: new Date().toISOString()
  };
}

/**
 * Lock market data for session
 * Prevents mid-session data updates from causing inconsistencies
 * 
 * @param {Array} companies - Company data with prices, betas, etc.
 * @returns {Array} Frozen company data
 */
export function lockMarketData(companies) {
  return companies.map(c => ({
    ...c,
    _locked: true,
    _lockTimestamp: new Date().toISOString()
  }));
}

/**
 * Detect drift from original portfolio
 * Useful when user makes incremental changes
 * 
 * @param {Object} originalSnapshot - Original session snapshot
 * @param {Object} currentPortfolio - Current portfolio state
 * @returns {Object} Drift analysis
 */
export function detectDrift(originalSnapshot, currentPortfolio) {
  const weightChanges = [];
  
  originalSnapshot.weights.forEach((origWeight, i) => {
    const currentWeight = currentPortfolio.weights[i];
    const change = currentWeight - origWeight;
    const changePercent = (change / origWeight) * 100;
    
    if (Math.abs(changePercent) > 5) {
      weightChanges.push({
        assetIndex: i,
        symbol: originalSnapshot.companies[i].symbol,
        originalWeight: round(origWeight * 100, 1),
        currentWeight: round(currentWeight * 100, 1),
        change: round(change * 100, 1),
        changePercent: round(changePercent, 1)
      });
    }
  });
  
  return {
    hasDrift: weightChanges.length > 0,
    changes: weightChanges,
    driftMagnitude: weightChanges.reduce((sum, c) => sum + Math.abs(c.change), 0)
  };
}

/**
 * Apply consistency adjustments
 * Corrects minor inconsistencies while preserving user intent
 * 
 * @param {Object} portfolioData - Portfolio data to adjust
 * @returns {Object} Adjusted portfolio data
 */
export function applyConsistencyAdjustments(portfolioData) {
  const { weights, expectedReturns, risks, correlations } = portfolioData;
  
  // Normalize weights to sum to exactly 1.0
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / weightSum);
  
  // Recalculate portfolio metrics with normalized weights
  const portfolioReturn = normalizedWeights.reduce((sum, w, i) => 
    sum + w * expectedReturns[i], 0
  );
  
  let portfolioVariance = 0;
  const n = normalizedWeights.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cov = (risks[i] / 100) * (risks[j] / 100) * correlations[i][j];
      portfolioVariance += normalizedWeights[i] * normalizedWeights[j] * cov;
    }
  }
  const portfolioRisk = Math.sqrt(portfolioVariance) * 100;
  
  return {
    ...portfolioData,
    weights: normalizedWeights.map(w => round(w, 6)),
    portfolioReturn: round(portfolioReturn, 2),
    portfolioRisk: round(portfolioRisk, 2),
    _adjusted: true,
    _adjustmentTimestamp: new Date().toISOString()
  };
}
