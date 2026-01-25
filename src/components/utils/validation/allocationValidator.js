/**
 * Allocation Validator
 * Ensures portfolio allocations are valid, feasible, and realistic
 * 
 * Validates:
 * - Weight constraints (0-100%, sum to 100%)
 * - Position size limits
 * - Concentration risk
 * - Trading costs and liquidity
 */

import { round } from "./financialMath";

/**
 * Validate basic allocation constraints
 * @param {Array} weights - Asset weights (decimal, e.g., 0.25 = 25%)
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateAllocation(weights, options = {}) {
  const {
    maxPosition = 0.40, // Max 40% in single asset
    minPosition = 0.01, // Min 1% position (to avoid dust)
    maxPositions = 50, // Max number of positions
    requireDiversification = true
  } = options;

  const errors = [];
  const warnings = [];

  // Check weights sum to 1.0 (100%)
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    errors.push({
      type: 'sum_constraint',
      message: `Weights sum to ${round(sum * 100, 2)}% instead of 100%`,
      severity: 'error'
    });
  }

  // Check individual weight constraints
  weights.forEach((w, i) => {
    if (w < 0) {
      errors.push({
        type: 'negative_weight',
        assetIndex: i,
        weight: w,
        message: `Asset ${i} has negative weight ${round(w * 100, 2)}%`,
        severity: 'error'
      });
    }

    if (w > maxPosition) {
      warnings.push({
        type: 'max_position',
        assetIndex: i,
        weight: round(w * 100, 1),
        limit: round(maxPosition * 100, 1),
        message: `Asset ${i} exceeds max position size (${round(w * 100, 1)}% > ${round(maxPosition * 100, 1)}%)`,
        severity: 'warning'
      });
    }

    if (w > 0 && w < minPosition) {
      warnings.push({
        type: 'dust_position',
        assetIndex: i,
        weight: round(w * 100, 2),
        message: `Asset ${i} has very small position (${round(w * 100, 2)}%)`,
        severity: 'info'
      });
    }
  });

  // Check number of positions
  const nonZeroPositions = weights.filter(w => w >= minPosition).length;
  if (nonZeroPositions > maxPositions) {
    warnings.push({
      type: 'too_many_positions',
      count: nonZeroPositions,
      limit: maxPositions,
      message: `${nonZeroPositions} positions exceeds recommended maximum of ${maxPositions}`,
      severity: 'warning'
    });
  }

  // Check diversification (HHI)
  if (requireDiversification) {
    const hhi = weights.reduce((sum, w) => sum + w * w, 0);
    if (hhi > 0.25) { // Highly concentrated
      warnings.push({
        type: 'high_concentration',
        hhi: round(hhi, 3),
        message: `Portfolio is highly concentrated (HHI: ${round(hhi, 3)})`,
        severity: 'warning'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: errors.length === 0 
      ? `Valid allocation with ${warnings.length} warnings`
      : `Invalid allocation with ${errors.length} errors`,
    metrics: {
      sum: round(sum, 6),
      nonZeroPositions,
      maxWeight: round(Math.max(...weights) * 100, 1),
      hhi: round(weights.reduce((sum, w) => sum + w * w, 0), 4)
    }
  };
}

/**
 * Enforce allocation constraints
 * Adjusts weights to satisfy all constraints
 * 
 * @param {Array} weights - Original weights
 * @param {Object} options - Constraint options
 * @returns {Object} Adjusted weights and changes made
 */
export function enforceConstraints(weights, options = {}) {
  const {
    maxPosition = 0.40,
    minPosition = 0.01
  } = options;

  let adjusted = [...weights];
  const changes = [];

  // Step 1: Clip to max position size
  adjusted = adjusted.map((w, i) => {
    if (w > maxPosition) {
      changes.push({
        assetIndex: i,
        original: round(w * 100, 1),
        adjusted: round(maxPosition * 100, 1),
        reason: 'max_position_exceeded'
      });
      return maxPosition;
    }
    return w;
  });

  // Step 2: Remove dust positions
  adjusted = adjusted.map((w, i) => {
    if (w > 0 && w < minPosition) {
      changes.push({
        assetIndex: i,
        original: round(w * 100, 2),
        adjusted: 0,
        reason: 'dust_removed'
      });
      return 0;
    }
    return w;
  });

  // Step 3: Renormalize to sum to 1.0
  const sum = adjusted.reduce((acc, w) => acc + w, 0);
  if (sum > 0) {
    adjusted = adjusted.map(w => w / sum);
  }

  return {
    adjusted: adjusted.map(w => round(w, 6)),
    changes,
    originalSum: round(weights.reduce((a, b) => a + b, 0), 6),
    adjustedSum: 1.0
  };
}

/**
 * Validate position sizing for real-world implementation
 * Considers account size and share prices
 * 
 * @param {Array} weights - Asset weights (decimal)
 * @param {Array} prices - Asset prices per share
 * @param {number} accountValue - Total account value ($)
 * @returns {Object} Position sizing validation
 */
export function validatePositionSizing(weights, prices, accountValue) {
  const positions = [];
  const issues = [];

  weights.forEach((w, i) => {
    const dollarAmount = accountValue * w;
    const shares = Math.floor(dollarAmount / prices[i]);
    const actualDollarAmount = shares * prices[i];
    const actualWeight = actualDollarAmount / accountValue;
    const drift = Math.abs(actualWeight - w);

    positions.push({
      assetIndex: i,
      targetWeight: round(w * 100, 2),
      targetDollars: round(dollarAmount, 2),
      price: round(prices[i], 2),
      shares,
      actualDollars: round(actualDollarAmount, 2),
      actualWeight: round(actualWeight * 100, 2),
      drift: round(drift * 100, 2)
    });

    // Flag positions with significant drift due to rounding
    if (drift > 0.01) { // >1% drift
      issues.push({
        assetIndex: i,
        drift: round(drift * 100, 2),
        message: `Share rounding causes ${round(drift * 100, 2)}% drift from target`
      });
    }

    // Flag positions too small to execute
    if (w > 0 && shares === 0) {
      issues.push({
        assetIndex: i,
        message: `Position too small to buy even 1 share (need $${round(prices[i], 2)})`
      });
    }
  });

  const totalDollarsInvested = positions.reduce((sum, p) => sum + p.actualDollars, 0);
  const cashRemaining = accountValue - totalDollarsInvested;

  return {
    positions,
    issues,
    totalInvested: round(totalDollarsInvested, 2),
    cashRemaining: round(cashRemaining, 2),
    utilizationRate: round((totalDollarsInvested / accountValue) * 100, 2)
  };
}

/**
 * Check allocation feasibility for rebalancing
 * Considers transaction costs
 * 
 * @param {Array} currentWeights - Current portfolio weights
 * @param {Array} targetWeights - Target portfolio weights
 * @param {number} transactionCostBps - Transaction cost (basis points)
 * @returns {Object} Rebalancing feasibility analysis
 */
export function checkRebalancingFeasibility(currentWeights, targetWeights, transactionCostBps = 5) {
  const n = currentWeights.length;
  const drifts = [];
  let totalTurnover = 0;

  for (let i = 0; i < n; i++) {
    const drift = targetWeights[i] - currentWeights[i];
    const absDrift = Math.abs(drift);
    
    drifts.push({
      assetIndex: i,
      currentWeight: round(currentWeights[i] * 100, 2),
      targetWeight: round(targetWeights[i] * 100, 2),
      drift: round(drift * 100, 2),
      absDrift: round(absDrift * 100, 2)
    });

    totalTurnover += absDrift;
  }

  // One-sided turnover (buy or sell, not both)
  const oneSidedTurnover = totalTurnover / 2;
  const transactionCost = oneSidedTurnover * (transactionCostBps / 10000);

  drifts.sort((a, b) => b.absDrift - a.absDrift);

  return {
    drifts,
    totalTurnover: round(totalTurnover * 100, 1),
    oneSidedTurnover: round(oneSidedTurnover * 100, 1),
    transactionCostPercent: round(transactionCost * 100, 2),
    worthRebalancing: transactionCost < 0.005, // Worth it if cost < 0.5%
    recommendation: transactionCost < 0.001
      ? 'Minimal cost, rebalance now'
      : transactionCost < 0.005
      ? 'Reasonable cost, consider rebalancing'
      : 'High cost, defer rebalancing unless critical'
  };
}
