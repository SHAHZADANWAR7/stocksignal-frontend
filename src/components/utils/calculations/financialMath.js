/**
 * Financial Mathematics Utilities
 * 
 * Centralized, auditable financial and statistical calculations
 * All formulas documented with academic references
 * 
 * References:
 * - Markowitz (1952): Portfolio Selection
 * - Sharpe (1966): Mutual Fund Performance
 * - Magdon-Ismail et al. (2004): Maximum Drawdown
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const RISK_FREE_RATE = 4.5; // 3-month US T-Bill rate (Dec 2024)
export const MARKET_RISK_PREMIUM = 8.0; // Historical US equity risk premium (Ibbotson/SBBI)
export const MARKET_VOLATILITY = 18.0; // S&P 500 historical volatility

// ============================================================================
// BASIC STATISTICS
// ============================================================================

/**
 * Calculate mean (average) of an array
 */
export function mean(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate variance (σ²)
 * Formula: Σ(xi - μ)² / n
 */
export function variance(values) {
  if (!values || values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  return mean(squaredDiffs);
}

/**
 * Calculate standard deviation (σ)
 * Formula: √variance
 */
export function standardDeviation(values) {
  return Math.sqrt(variance(values));
}

/**
 * Calculate covariance between two arrays
 * Formula: Σ[(xi - μx)(yi - μy)] / n
 */
export function covariance(valuesX, valuesY) {
  if (!valuesX || !valuesY || valuesX.length !== valuesY.length) return 0;
  
  const meanX = mean(valuesX);
  const meanY = mean(valuesY);
  const n = valuesX.length;
  
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (valuesX[i] - meanX) * (valuesY[i] - meanY);
  }
  
  return sum / n;
}

/**
 * Calculate Pearson correlation coefficient
 * Formula: Cov(X,Y) / (σx × σy)
 * Range: [-1, 1]
 */
export function correlation(valuesX, valuesY) {
  const cov = covariance(valuesX, valuesY);
  const stdX = standardDeviation(valuesX);
  const stdY = standardDeviation(valuesY);
  
  if (stdX === 0 || stdY === 0) return 0;
  
  return cov / (stdX * stdY);
}

// ============================================================================
// MATRIX OPERATIONS (Basic Linear Algebra)
// ============================================================================

/**
 * Transpose a matrix
 */
export function transpose(matrix) {
  if (!matrix || matrix.length === 0) return [];
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  const result = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }
  
  return result;
}

/**
 * Matrix multiplication
 */
export function matrixMultiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  
  const result = Array(rowsA).fill(null).map(() => Array(colsB).fill(0));
  
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return result;
}

/**
 * Calculate covariance matrix from returns data
 * Input: assets = [{ returns: [...] }, ...]
 * Output: n×n covariance matrix
 */
export function covarianceMatrix(assets) {
  const n = assets.length;
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        // Diagonal: variance
        matrix[i][j] = variance(assets[i].returns);
      } else {
        // Off-diagonal: covariance
        matrix[i][j] = covariance(assets[i].returns, assets[j].returns);
      }
    }
  }
  
  return matrix;
}

// ============================================================================
// PORTFOLIO METRICS
// ============================================================================

/**
 * Calculate portfolio expected return
 * Formula: E(Rp) = Σ(wi × E(Ri))
 * 
 * DATA HYGIENE: Sanitizes all inputs
 * 
 * @param {Array} weights - Portfolio weights [w1, w2, ..., wn]
 * @param {Array} expectedReturns - Expected returns [r1, r2, ..., rn]
 * @returns {number} Portfolio expected return (%) - never NaN
 */
export function portfolioExpectedReturn(weights, expectedReturns) {
  if (weights.length !== expectedReturns.length) {
    throw new Error('Weights and returns arrays must have same length');
  }
  
  let portfolioReturn = 0;
  for (let i = 0; i < weights.length; i++) {
    const weight = sanitizeNumber(weights[i], 0);
    const expectedReturn = sanitizeNumber(expectedReturns[i], 0);
    portfolioReturn += weight * expectedReturn;
  }
  
  return sanitizeNumber(portfolioReturn, 0);
}

/**
 * Calculate portfolio variance
 * Formula: σp² = w^T × Σ × w
 * 
 * DATA HYGIENE: Sanitizes all matrix operations
 * 
 * @param {Array} weights - Portfolio weights [w1, w2, ..., wn]
 * @param {Array} risks - Asset standard deviations [σ1, σ2, ..., σn]
 * @param {Array} correlationMatrix - n×n correlation matrix
 * @returns {number} Portfolio variance (σ²) - never NaN
 */
export function portfolioVariance(weights, risks, correlationMatrix) {
  const n = weights.length;
  let variance = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const w_i = sanitizeNumber(weights[i], 0);
      const w_j = sanitizeNumber(weights[j], 0);
      const r_i = sanitizeNumber(risks[i], 1);
      const r_j = sanitizeNumber(risks[j], 1);
      const corr = sanitizeNumber(correlationMatrix[i]?.[j], 0);
      
      variance += w_i * w_j * r_i * r_j * corr;
    }
  }
  
  return sanitizeNumber(variance, 0);
}

/**
 * Calculate portfolio risk (standard deviation)
 * Formula: σp = √variance
 * 
 * DATA HYGIENE: Ensures positive, finite output
 */
export function portfolioRisk(weights, risks, correlationMatrix) {
  const variance = portfolioVariance(weights, risks, correlationMatrix);
  const risk = Math.sqrt(Math.max(0, variance));
  return sanitizeNumber(risk, 1);
}

/**
 * Calculate Sharpe Ratio
 * Formula: (Rp - Rf) / σp
 * 
 * DATA HYGIENE: Prevents NaN outputs
 * 
 * @param {number} portfolioReturn - Portfolio expected return (%)
 * @param {number} portfolioRisk - Portfolio standard deviation (%)
 * @param {number} riskFreeRate - Risk-free rate (%, default 4.5%)
 * @returns {number} Sharpe ratio (sanitized, never NaN)
 */
export function sharpeRatio(portfolioReturn, portfolioRisk, riskFreeRate = RISK_FREE_RATE) {
  return safeDivide(
    sanitizeNumber(portfolioReturn, 0) - sanitizeNumber(riskFreeRate, RISK_FREE_RATE),
    sanitizeNumber(portfolioRisk, 1),
    0
  );
}

/**
 * CAPM Expected Return
 * Formula: E(R) = Rf + β × (Rm - Rf)
 * 
 * @param {number} beta - Asset beta
 * @param {number} riskFreeRate - Risk-free rate (%, default 4.5%)
 * @param {number} marketRiskPremium - Market risk premium (%, default 8.0%)
 * @returns {number} CAPM expected return (%)
 */
export function capmExpectedReturn(beta, riskFreeRate = RISK_FREE_RATE, marketRiskPremium = MARKET_RISK_PREMIUM) {
  return riskFreeRate + beta * marketRiskPremium;
}

// ============================================================================
// DRAWDOWN CALCULATIONS
// ============================================================================

/**
 * Calculate expected maximum drawdown (Magdon-Ismail formula)
 * Simplified practitioner formula for worst-case portfolio decline
 * 
 * Reference: Magdon-Ismail et al. (2004), Chekhlov et al. (2005)
 * 
 * DRAWDOWN DISCIPLINE:
 * - Caps at -85% (prevents unrealistic -100% scenarios)
 * - Minimum -8% (even low-risk portfolios have drawdowns)
 * - Uses volatility AND expected return for realistic modeling
 * 
 * @param {number} volatility - Portfolio volatility (σ, %)
 * @param {number} timeHorizon - Time horizon (years)
 * @param {number} expectedReturn - Expected return (%, annual)
 * @returns {number} Expected maximum drawdown (%) - NEGATIVE value in range [-85%, -8%]
 */
export function expectedMaxDrawdown(volatility, timeHorizon, expectedReturn) {
  // Data hygiene: sanitize inputs
  const sigma = sanitizeNumber(volatility, 20) / 100;
  const mu = sanitizeNumber(expectedReturn, 10) / 100;
  const T = sanitizeNumber(timeHorizon, 10);
  
  // Simplified Magdon-Ismail formula
  // DD ≈ -2σ√T + μT (drift adjustment)
  const baseDrawdown = -2 * sigma * Math.sqrt(T);
  const driftAdjustment = mu * T;
  
  const maxDD = (baseDrawdown + driftAdjustment) * 100;
  
  // REALISTIC BOUNDS ENFORCEMENT
  // Academic research shows:
  // - Even 2008 crisis: S&P 500 -56%
  // - Diversified portfolios rarely exceed -70% max drawdown
  // - Individual stocks can lose 100%, but diversified portfolios cannot
  return clamp(maxDD, -85, -8);
}

/**
 * Calculate drawdown improvement (delta)
 * Returns absolute percentage point improvement
 * 
 * Example: -85% → -52% = +33 pts improvement
 */
export function drawdownDelta(currentDrawdown, newDrawdown) {
  // Both inputs are negative percentages
  // Delta is the absolute improvement in percentage points
  return newDrawdown - currentDrawdown; // e.g., -52 - (-85) = +33
}

// ============================================================================
// COMPOUND INTEREST & GROWTH PROJECTIONS
// ============================================================================

/**
 * Calculate future value with monthly compounding and contributions
 * Formula: FV = P(1+r)^n + PMT × [((1+r)^n - 1) / r]
 * 
 * @param {number} principal - Initial investment ($)
 * @param {number} monthlyContribution - Monthly contribution ($)
 * @param {number} annualReturn - Annual return rate (%)
 * @param {number} years - Investment period (years)
 * @returns {number} Future value ($)
 */
export function futureValue(principal, monthlyContribution, annualReturn, years) {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) {
    // No growth scenario
    return principal + (monthlyContribution * months);
  }
  
  // Future value of initial investment
  const fvPrincipal = principal * Math.pow(1 + monthlyRate, months);
  
  // Future value of monthly contributions (annuity)
  const fvContributions = monthlyContribution > 0
    ? monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    : 0;
  
  return fvPrincipal + fvContributions;
}

/**
 * Calculate time to reach financial goal
 * Uses numerical approximation for complex scenarios
 * 
 * @param {number} principal - Initial investment ($)
 * @param {number} monthlyContribution - Monthly contribution ($)
 * @param {number} annualReturn - Annual return rate (%)
 * @param {number} goalAmount - Target amount ($)
 * @returns {number|null} Years to goal (or null if unreachable)
 */
export function timeToGoal(principal, monthlyContribution, annualReturn, goalAmount) {
  if (annualReturn <= 0 && monthlyContribution === 0) return null;
  
  const monthlyRate = annualReturn / 100 / 12;
  
  // Simple case: no contributions
  if (monthlyContribution === 0 && annualReturn > 0) {
    const months = Math.log(goalAmount / principal) / Math.log(1 + monthlyRate);
    return months / 12;
  }
  
  // Numerical approximation
  let balance = principal;
  let months = 0;
  const maxMonths = 50 * 12; // 50 years max
  
  while (balance < goalAmount && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    months++;
  }
  
  return balance >= goalAmount ? months / 12 : null;
}

// ============================================================================
// MONTE CARLO SIMULATION
// ============================================================================

/**
 * Monte Carlo simulation for goal probability
 * Uses fat-tailed distribution (Student's t) for realistic tail-risk modeling
 * 
 * @param {number} principal - Initial investment ($)
 * @param {number} monthlyContribution - Monthly contribution ($)
 * @param {number} annualReturn - Expected annual return (decimal, e.g., 0.10 for 10%)
 * @param {number} volatility - Annual volatility (decimal, e.g., 0.20 for 20%)
 * @param {number} goalAmount - Target amount ($)
 * @param {number} months - Time horizon (months)
 * @param {boolean} useFatTails - Use Student's t distribution instead of normal (default: true)
 * @returns {number} Probability of reaching goal (0-1)
 */
export function monteCarloGoalProbability(principal, monthlyContribution, annualReturn, volatility, goalAmount, months, useFatTails = true) {
  const simulations = 15000; // Increased for better tail-event stability
  const monthlyReturn = annualReturn / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);
  
  // Student's t distribution parameters for fat tails
  const degreesOfFreedom = 6; // Lower = fatter tails (more extreme events)
  
  let successCount = 0;
  
  for (let sim = 0; sim < simulations; sim++) {
    let balance = principal;
    
    for (let month = 0; month < months; month++) {
      let z;
      
      if (useFatTails) {
        // Generate Student's t random variable (fat-tailed)
        // Using simplified approximation for t-distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const normalZ = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Chi-squared approximation for degrees of freedom
        let chiSquared = 0;
        for (let i = 0; i < degreesOfFreedom; i++) {
          const ui = Math.random();
          chiSquared += -2 * Math.log(ui);
        }
        
        z = normalZ / Math.sqrt(chiSquared / degreesOfFreedom);
      } else {
        // Standard normal (Box-Muller)
        const u1 = Math.random();
        const u2 = Math.random();
        z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      }
      
      const monthlyRandomReturn = monthlyReturn + z * monthlyVolatility;
      balance = balance * (1 + monthlyRandomReturn) + monthlyContribution;
    }
    
    if (balance >= goalAmount) {
      successCount++;
    }
  }
  
  return successCount / simulations;
}

// ============================================================================
// DIVERSIFICATION METRICS
// ============================================================================

/**
 * Calculate average portfolio correlation
 * Formula: Average of all pairwise correlations (excluding diagonal)
 */
export function averageCorrelation(correlationMatrix) {
  const n = correlationMatrix.length;
  if (n <= 1) return 0;
  
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      sum += correlationMatrix[i][j];
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * Herfindahl-Hirschman Index (HHI)
 * Measures concentration (0 = perfectly diversified, 1 = concentrated)
 * Formula: HHI = Σ(wi²)
 */
export function herfindahlIndex(weights) {
  return weights.reduce((sum, w) => sum + Math.pow(w, 2), 0);
}

// ============================================================================
// ROUNDING & FORMATTING UTILITIES
// ============================================================================

import { safeToFixed } from "@/components/utils/safeToFixed";

/**
 * Round to specified decimal places
 */
export function round(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format percentage with consistent rounding
 */
export function formatPercent(value, decimals = 1) {
  return safeToFixed(round(value, decimals), decimals) + '%';
}

/**
 * Format delta with explicit sign and unit
 */
export function formatDelta(delta, unit = 'pts', decimals = 1) {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${safeToFixed(round(delta, decimals), decimals)} ${unit}`;
}

/**
 * Format Sharpe ratio
 */
export function formatSharpe(value, decimals = 3) {
  return safeToFixed(round(value, decimals), decimals);
}

// ============================================================================
// VALIDATION & DATA HYGIENE
// ============================================================================

/**
 * Validate weights sum to 1.0 (within tolerance)
 */
export function validateWeights(weights, tolerance = 0.001) {
  const sum = weights.reduce((s, w) => s + w, 0);
  return Math.abs(sum - 1.0) < tolerance;
}

/**
 * Ensure value is within bounds
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Data Hygiene: Sanitize numeric inputs (exported for external use)
 * Eliminates NaN, Infinity, null, undefined
 */
export function sanitizeNumber(value, fallback = 0) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value;
}

/**
 * Safe division (prevents division by zero) - exported
 */
export function safeDivide(numerator, denominator, fallback = 0) {
  const num = sanitizeNumber(numerator, 0);
  const denom = sanitizeNumber(denominator, 0);
  
  if (denom === 0 || Math.abs(denom) < 1e-10) {
    return fallback;
  }
  
  const result = num / denom;
  return sanitizeNumber(result, fallback);
}
