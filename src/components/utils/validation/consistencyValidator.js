/**
 * Consistency Validator
 * Ensures allocation weights sum to 100% and portfolio metrics are internally consistent
 * 
 * Academic Foundation:
 * - Modern Portfolio Theory: weights must sum to 1.0 (100%)
 * - Risk decomposition: portfolio risk must be computable from asset risks and correlations
 * - Return attribution: portfolio return must be weighted average of asset returns
 */

import { round } from "./financialMath";

/**
 * Validate allocation weights
 * @param {Array} weights - Asset allocation weights (decimal, not percentage)
 * @param {number} tolerance - Acceptable deviation from 1.0 (default 0.001)
 * @returns {Object} { valid: boolean, sum: number, adjustment: Array, message: string }
 */
export function validateWeights(weights, tolerance = 0.001) {
  if (!weights || weights.length === 0) {
    return {
      valid: false,
      sum: 0,
      adjustment: [],
      message: 'No weights provided'
    };
  }

  const sum = weights.reduce((acc, w) => acc + w, 0);
  const deviation = Math.abs(sum - 1.0);

  if (deviation <= tolerance) {
    return {
      valid: true,
      sum: round(sum, 6),
      adjustment: weights,
      message: 'Weights sum to 100%'
    };
  }

  // Adjust weights to sum to exactly 1.0
  const adjustedWeights = weights.map(w => w / sum);

  return {
    valid: false,
    sum: round(sum, 6),
    adjustment: adjustedWeights.map(w => round(w, 6)),
    message: `Weights sum to ${round(sum * 100, 2)}%, adjusted to 100%`,
    deviation: round(deviation, 6)
  };
}

/**
 * Validate portfolio return calculation
 * Ensures portfolio return equals weighted sum of asset returns
 * 
 * @param {Array} weights - Asset weights (decimal)
 * @param {Array} returns - Asset expected returns (%)
 * @param {number} portfolioReturn - Calculated portfolio return (%)
 * @param {number} tolerance - Acceptable deviation (default 0.01%)
 * @returns {Object} Validation result with recalculated value if inconsistent
 */
export function validatePortfolioReturn(weights, returns, portfolioReturn, tolerance = 0.01) {
  if (!weights || !returns || weights.length !== returns.length) {
    return {
      valid: false,
      message: 'Mismatched weights and returns arrays',
      expected: null,
      actual: portfolioReturn
    };
  }

  // Recalculate portfolio return
  const expectedReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);
  const deviation = Math.abs(expectedReturn - portfolioReturn);

  if (deviation <= tolerance) {
    return {
      valid: true,
      message: 'Portfolio return is consistent',
      expected: round(expectedReturn, 2),
      actual: round(portfolioReturn, 2),
      deviation: round(deviation, 4)
    };
  }

  return {
    valid: false,
    message: `Portfolio return inconsistent. Expected ${round(expectedReturn, 2)}%, got ${round(portfolioReturn, 2)}%`,
    expected: round(expectedReturn, 2),
    actual: round(portfolioReturn, 2),
    deviation: round(deviation, 4),
    corrected: round(expectedReturn, 2)
  };
}

/**
 * Validate portfolio risk calculation
 * Ensures portfolio risk is correctly computed from covariance matrix
 * 
 * @param {Array} weights - Asset weights (decimal)
 * @param {Array} risks - Asset volatilities (%)
 * @param {Array} correlations - n×n correlation matrix
 * @param {number} portfolioRisk - Calculated portfolio risk (%)
 * @param {number} tolerance - Acceptable deviation (default 0.1%)
 * @returns {Object} Validation result
 */
export function validatePortfolioRisk(weights, risks, correlations, portfolioRisk, tolerance = 0.1) {
  if (!weights || !risks || !correlations) {
    return {
      valid: false,
      message: 'Missing required inputs for risk validation',
      expected: null,
      actual: portfolioRisk
    };
  }

  const n = weights.length;

  // Build covariance matrix
  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cov = (risks[i] / 100) * (risks[j] / 100) * correlations[i][j];
      variance += weights[i] * weights[j] * cov;
    }
  }

  const expectedRisk = Math.sqrt(variance) * 100;
  const deviation = Math.abs(expectedRisk - portfolioRisk);

  if (deviation <= tolerance) {
    return {
      valid: true,
      message: 'Portfolio risk is consistent',
      expected: round(expectedRisk, 2),
      actual: round(portfolioRisk, 2),
      deviation: round(deviation, 4)
    };
  }

  return {
    valid: false,
    message: `Portfolio risk inconsistent. Expected ${round(expectedRisk, 2)}%, got ${round(portfolioRisk, 2)}%`,
    expected: round(expectedRisk, 2),
    actual: round(portfolioRisk, 2),
    deviation: round(deviation, 4),
    corrected: round(expectedRisk, 2)
  };
}

/**
 * Validate Sharpe ratio calculation
 * @param {number} portfolioReturn - Portfolio expected return (%)
 * @param {number} portfolioRisk - Portfolio volatility (%)
 * @param {number} riskFreeRate - Risk-free rate (%)
 * @param {number} sharpeRatio - Calculated Sharpe ratio
 * @param {number} tolerance - Acceptable deviation
 * @returns {Object} Validation result
 */
export function validateSharpeRatio(portfolioReturn, portfolioRisk, riskFreeRate, sharpeRatio, tolerance = 0.01) {
  if (portfolioRisk === 0) {
    return {
      valid: false,
      message: 'Cannot calculate Sharpe ratio with zero risk',
      expected: null,
      actual: sharpeRatio
    };
  }

  const expectedSharpe = (portfolioReturn - riskFreeRate) / portfolioRisk;
  const deviation = Math.abs(expectedSharpe - sharpeRatio);

  if (deviation <= tolerance) {
    return {
      valid: true,
      message: 'Sharpe ratio is consistent',
      expected: round(expectedSharpe, 3),
      actual: round(sharpeRatio, 3),
      deviation: round(deviation, 5)
    };
  }

  return {
    valid: false,
    message: `Sharpe ratio inconsistent. Expected ${round(expectedSharpe, 3)}, got ${round(sharpeRatio, 3)}`,
    expected: round(expectedSharpe, 3),
    actual: round(sharpeRatio, 3),
    deviation: round(deviation, 5),
    corrected: round(expectedSharpe, 3)
  };
}

/**
 * Validate entire portfolio calculation consistency
 * Master validator that checks all metrics
 * 
 * @param {Object} portfolioData - Complete portfolio data
 * @returns {Object} Comprehensive validation report
 */
export function validatePortfolioConsistency(portfolioData) {
  const { weights, returns, risks, correlations, portfolioReturn, portfolioRisk, sharpeRatio, riskFreeRate } = portfolioData;

  const validations = {
    weights: validateWeights(weights),
    portfolioReturn: validatePortfolioReturn(weights, returns, portfolioReturn),
    portfolioRisk: validatePortfolioRisk(weights, risks, correlations, portfolioRisk),
    sharpeRatio: validateSharpeRatio(portfolioReturn, portfolioRisk, riskFreeRate || 4.5, sharpeRatio)
  };

  const allValid = Object.values(validations).every(v => v.valid);

  return {
    consistent: allValid,
    validations,
    summary: allValid
      ? 'All portfolio metrics are internally consistent'
      : 'Some portfolio metrics are inconsistent and have been corrected',
    correctedValues: {
      weights: validations.weights.adjustment,
      portfolioReturn: validations.portfolioReturn.corrected || portfolioReturn,
      portfolioRisk: validations.portfolioRisk.corrected || portfolioRisk,
      sharpeRatio: validations.sharpeRatio.corrected || sharpeRatio
    }
  };
}
