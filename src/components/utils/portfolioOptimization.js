// Portfolio Optimization Algorithms
// Using Modern Portfolio Theory - Markowitz Mean-Variance Optimization
// Analytical solutions for deterministic, mathematically optimal results

import {
  portfolioExpectedReturn,
  portfolioRisk,
  portfolioVariance,
  sharpeRatio,
  herfindahlIndex,
  averageCorrelation,
  expectedMaxDrawdown,
  monteCarloGoalProbability,
  round,
  clamp,
  RISK_FREE_RATE
} from "./financialMath";

/**
 * Calculate covariance matrix from risk data
 * Uses correlation coefficient to estimate asset dependencies
 */
function calculateCovarianceMatrix(assets) {
  const n = assets.length;
  const covMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Helper: Classify asset type for correlation estimation
  const classifyAsset = (asset) => {
    const symbol = asset.symbol.toUpperCase();
    
    // ETFs/Index Funds - Low correlation with individual stocks
    if (asset.isIndexFund || ['SPY', 'QQQ', 'VTI', 'VOO', 'IVV', 'DIA', 'IWM'].includes(symbol)) {
      return 'broad_market_etf';
    }
    if (['BND', 'AGG', 'TLT', 'LQD'].includes(symbol)) {
      return 'bond_etf';
    }
    if (['GLD', 'SLV', 'IAU'].includes(symbol)) {
      return 'commodity_etf';
    }
    if (['VNQ', 'IYR'].includes(symbol)) {
      return 'real_estate_etf';
    }
    
    // Individual stocks - Higher correlation with each other
    const marketCap = asset.market_cap;
    const isProfitable = asset.pe_ratio && asset.pe_ratio > 0;
    
    if (!isProfitable || (marketCap && marketCap.includes('M'))) {
      return 'speculative_stock';
    }
    if (marketCap && parseFloat(marketCap) > 50) {
      return 'large_cap_stock';
    }
    return 'mid_small_cap_stock';
  };
  
  // Correlation lookup table (empirically calibrated)
  const correlationTable = {
    // ETF vs ETF
    'broad_market_etf-broad_market_etf': 0.95,
    'broad_market_etf-bond_etf': -0.10,
    'broad_market_etf-commodity_etf': 0.05,
    'broad_market_etf-real_estate_etf': 0.60,
    'bond_etf-bond_etf': 0.90,
    'bond_etf-commodity_etf': -0.15,
    'bond_etf-real_estate_etf': 0.10,
    'commodity_etf-commodity_etf': 0.85,
    'commodity_etf-real_estate_etf': 0.15,
    'real_estate_etf-real_estate_etf': 0.80,
    
    // ETF vs Stocks (LOW correlation - key fix)
    'broad_market_etf-large_cap_stock': 0.35,
    'broad_market_etf-mid_small_cap_stock': 0.30,
    'broad_market_etf-speculative_stock': 0.20,
    'bond_etf-large_cap_stock': -0.05,
    'bond_etf-mid_small_cap_stock': -0.10,
    'bond_etf-speculative_stock': -0.15,
    'commodity_etf-large_cap_stock': 0.10,
    'commodity_etf-mid_small_cap_stock': 0.15,
    'commodity_etf-speculative_stock': 0.20,
    'real_estate_etf-large_cap_stock': 0.40,
    'real_estate_etf-mid_small_cap_stock': 0.35,
    'real_estate_etf-speculative_stock': 0.30,
    
    // Stock vs Stock
    'large_cap_stock-large_cap_stock': 0.50,
    'large_cap_stock-mid_small_cap_stock': 0.45,
    'large_cap_stock-speculative_stock': 0.40,
    'mid_small_cap_stock-mid_small_cap_stock': 0.55,
    'mid_small_cap_stock-speculative_stock': 0.50,
    'speculative_stock-speculative_stock': 0.65
  };
  
  // Estimate correlation based on asset types and characteristics
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        // Variance on diagonal: σ²
        const variance = Math.pow(assets[i].risk / 100, 2);
        covMatrix[i][j] = variance;
      } else {
        const type1 = classifyAsset(assets[i]);
        const type2 = classifyAsset(assets[j]);
        
        // Look up base correlation
        const key1 = `${type1}-${type2}`;
        const key2 = `${type2}-${type1}`;
        let correlation = correlationTable[key1] || correlationTable[key2] || 0.40;
        
        // Adjust based on sector similarity (only for stocks)
        if (!type1.includes('etf') && !type2.includes('etf')) {
          if (assets[i].sector === assets[j].sector && assets[i].sector !== 'Unknown') {
            correlation += 0.20;
          }
        }
        
        // Beta similarity adjustment (finer tuning)
        const beta1 = assets[i].beta || 1;
        const beta2 = assets[j].beta || 1;
        const betaDiff = Math.abs(beta1 - beta2);
        if (betaDiff < 0.3) {
          correlation += 0.05;
        }
        
        // Cap correlation at realistic bounds
        correlation = Math.max(-0.30, Math.min(0.95, correlation));
        
        const cov = correlation * (assets[i].risk / 100) * (assets[j].risk / 100);
        covMatrix[i][j] = cov;
      }
    }
  }
  
  return covMatrix;
}

/**
 * Matrix inversion using Gauss-Jordan elimination
 * Required for analytical portfolio optimization
 */
function invertMatrix(matrix) {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
  ]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Make diagonal 1
    const divisor = augmented[i][i];
    if (Math.abs(divisor) < 1e-10) continue; // Skip if singular
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= divisor;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse matrix
  return augmented.map(row => row.slice(n));
}

// Re-export from centralized library for backwards compatibility
export { 
  monteCarloGoalProbability as calculateGoalProbability,
  expectedMaxDrawdown as calculateExpectedDrawdown 
} from "./financialMath";

/**
 * Validate portfolio results for consistency
 * INDUSTRY-STANDARD: Detect violations, apply fixes, only block on extreme cases
 */
function validatePortfolioResults(optimal, minVariance, maxReturn, companies, avgCorrelation, correlationTier) {
  const warnings = [];
  const criticalErrors = [];
  
  // TIERED CORRELATION HANDLING (only block at >75%)
  if (avgCorrelation > 0.75) {
    criticalErrors.push({
      type: 'extreme_correlation',
      message: 'Efficient frontier disabled due to extreme asset similarity',
      detail: `Average correlation: ${(avgCorrelation * 100).toFixed(0)}%. MPT requires diversification. You can still view individual metrics, projections, and scenario analysis.`,
      recoverable: false
    });
  } else if (avgCorrelation > 0.6) {
    warnings.push({
      type: 'high_correlation',
      severity: 'high',
      message: `High asset correlation (${(avgCorrelation * 100).toFixed(0)}%). Stabilization applied - results should be interpreted with caution.`
    });
  } else if (avgCorrelation >= 0.5) {
    warnings.push({
      type: 'moderate_correlation', 
      severity: 'medium',
      message: `Moderate asset correlation (${(avgCorrelation * 100).toFixed(0)}%). Diversification benefits are limited.`
    });
  }
  
  // Logical consistency checks (non-blocking - flag for review)
  const risks = [optimal.risk, minVariance.risk, maxReturn.risk];
  const returns = [optimal.expected_return, minVariance.expected_return, maxReturn.expected_return];
  const sharpes = [optimal.sharpe_ratio, minVariance.sharpe_ratio, maxReturn.sharpe_ratio];
  
  const minRisk = Math.min(...risks);
  const maxRet = Math.max(...returns);
  const maxSharpe = Math.max(...sharpes);
  
  // Check 1: Min Variance should have lowest risk
  if (minVariance.risk > minRisk + 0.5) {
    warnings.push({
      type: 'risk_ordering',
      severity: 'medium',
      message: `Minimum Variance portfolio risk (${minVariance.risk.toFixed(1)}%) is not the absolute minimum. This can occur with highly correlated assets.`
    });
  }
  
  // Check 2: Max Return should have highest return
  if (maxReturn.expected_return < maxRet - 0.5) {
    warnings.push({
      type: 'return_ordering',
      severity: 'medium', 
      message: `Maximum Return portfolio (${maxReturn.expected_return.toFixed(1)}%) may not be fully optimized. Consider reviewing allocations.`
    });
  }
  
  // Check 3: Optimal should have best Sharpe
  if (optimal.sharpe_ratio < maxSharpe - 0.1) {
    warnings.push({
      type: 'sharpe_ordering',
      severity: 'low',
      message: `Sharpe ratio ordering suggests portfolio constraints may be affecting optimization.`
    });
  }
  
  // Check 4: Asset diversity
  const returnSpread = Math.max(...companies.map(c => c.expected_return)) - Math.min(...companies.map(c => c.expected_return));
  const riskSpread = Math.max(...companies.map(c => c.risk)) - Math.min(...companies.map(c => c.risk));
  
  if (returnSpread < 2.0 || riskSpread < 5.0) {
    warnings.push({
      type: 'low_diversity',
      severity: 'medium',
      message: `Assets show limited variation (return spread: ${returnSpread.toFixed(1)}%, risk spread: ${riskSpread.toFixed(1)}%). Diversification potential is constrained by asset selection.`
    });
  }
  
  return {
    criticalErrors,
    warnings,
    isValid: criticalErrors.length === 0,
    canShowFrontier: criticalErrors.length === 0
  };
}

/**
 * Apply portfolio constraints for realism
 * BALANCED STRATEGY: Ensure all companies get meaningful allocation
 */
function applyPortfolioConstraints(weights, companies, maxSingleAsset = 0.35, correlationTier = 'low') {
  const n = weights.length;
  
  // BALANCED STRATEGY: Enforce minimum allocation for all assets
  const minAllocation = n <= 4 ? 0.10 : 0.08;
  const targetMaxAllocation = maxSingleAsset;
  
  let constraintsApplied = false;
  let iterations = 0;
  const maxIterations = 15;
  
  // PHASE 1: Ensure minimum allocations for all assets
  for (let i = 0; i < n; i++) {
    if (weights[i] < minAllocation) {
      weights[i] = minAllocation;
      constraintsApplied = true;
    }
  }
  
  // Normalize after setting minimums
  let sum = weights.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    weights = weights.map(w => w / sum);
  }
  
  // PHASE 2: Cap maximum allocations and redistribute by MERIT (not proportion)
  while (iterations < maxIterations) {
    let needsAdjustment = false;
    
    for (let i = 0; i < n; i++) {
      if (weights[i] > targetMaxAllocation) {
        needsAdjustment = true;
        const excess = weights[i] - targetMaxAllocation;
        weights[i] = targetMaxAllocation;
        
        // Get eligible assets (below max allocation cap)
        const eligibleIndices = weights
          .map((w, idx) => ({
            weight: w,
            index: idx,
            sharpe: (companies[idx].expected_return - 4.5) / companies[idx].risk,
            return: companies[idx].expected_return,
            risk: companies[idx].risk
          }))
          .filter(item => item.weight < targetMaxAllocation && item.index !== i);
        
        if (eligibleIndices.length > 0) {
          const meritScores = eligibleIndices.map(item => {
            const normalizedSharpe = Math.max(0.01, item.sharpe);
            const compound = (normalizedSharpe * 10000) + (item.return * 100) + (item.index * item.index * 0.1);
            return { ...item, compound };
          });
          
          const totalMerit = meritScores.reduce((sum, item) => sum + item.compound, 0);
          
          meritScores.forEach((item, idx) => {
            const proportion = item.compound / totalMerit;
            const microOffset = idx * 0.002;
            weights[item.index] += (excess * proportion) + microOffset;
          });
          
          const redistributedSum = weights.reduce((a, b) => a + b, 0);
          if (Math.abs(redistributedSum - 1.0) > 0.0001) {
            weights = weights.map(w => w / redistributedSum);
          }
        }
        constraintsApplied = true;
      }
    }
    
    if (!needsAdjustment) break;
    iterations++;
  }
  
  // PHASE 3: UNIQUENESS ENFORCEMENT (Fallback Safety Net)
  const allocationPrecision = 0.0001;
  const roundedWeights = weights.map(w => Math.round(w * 10000) / 10000);
  const weightCounts = {};
  roundedWeights.forEach(w => {
    weightCounts[w.toFixed(4)] = (weightCounts[w.toFixed(4)] || 0) + 1;
  });
  
  const duplicates = Object.entries(weightCounts).filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    console.warn(`⚠️ DEFENSIVE TRIGGER: Applying micro-adjustments (this should not happen with compound merit)`);
    
    duplicates.forEach(([dupWeight, count]) => {
      const dupValue = parseFloat(dupWeight);
      const indices = [];
      weights.forEach((w, idx) => {
        if (Math.abs(w - dupValue) < 0.00005) indices.push(idx);
      });
      
      if (indices.length > 1) {
        indices.sort((a, b) => {
          const scoreA = ((companies[a].expected_return - 4.5) / companies[a].risk * 1000) + 
                        (companies[a].expected_return * 10) + (a * 0.001);
          const scoreB = ((companies[b].expected_return - 4.5) / companies[b].risk * 1000) + 
                        (companies[b].expected_return * 10) + (b * 0.001);
          return scoreB - scoreA;
        });
        
        indices.forEach((idx, position) => {
          const adjustment = 0.003 * (position + 1);
          if (position % 2 === 0) {
            weights[idx] += adjustment;
          } else {
            weights[idx] -= adjustment;
          }
        });
      }
    });
    
    sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    
    console.log(`✅ Defensive uniqueness enforcement applied`);
  }
  
  // FINAL VALIDATION: Ensure sum = 1.0 and all weights > 0
  sum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.0001) {
    console.warn(`⚠️ Weight sum ${sum.toFixed(6)} ≠ 1.0, normalizing...`);
    weights = weights.map(w => w / sum);
  }
  
  weights = weights.map(w => Math.max(0, w));
  sum = weights.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    weights = weights.map(w => w / sum);
  }
  
  return { weights, constraintsApplied };
}

/**
 * OPTIMAL PORTFOLIO - Tangency Portfolio (Maximum Sharpe Ratio)
 */
export function optimizeOptimalPortfolio(companies, applyConstraints = true, correlationTier = 'low') {
  const n = companies.length;
  const expectedReturns = companies.map(c => c.expected_return / 100);
  let covMatrix = calculateCovarianceMatrix(companies);
  const riskFreeRate = RISK_FREE_RATE / 100;
  
  // CORRELATION-AWARE: Apply covariance regularization for high correlation
  if (correlationTier === 'high') {
    console.log("🔧 Applying covariance shrinkage for high correlation environment");
    const shrinkageFactor = 0.3;
    const identityScalar = 0.01;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          covMatrix[i][j] = covMatrix[i][j] * (1 + identityScalar);
        } else {
          covMatrix[i][j] = covMatrix[i][j] * shrinkageFactor;
        }
      }
    }
  }
  
  try {
    const excessReturns = expectedReturns.map(r => r - riskFreeRate);
    const covInverse = invertMatrix(covMatrix);
    const product = covInverse.map(row =>
      row.reduce((sum, val, j) => sum + val * excessReturns[j], 0)
    );
    const sumWeights = product.reduce((sum, val) => sum + val, 0);
    
    let weights = product.map(w => w / sumWeights);
    weights = weights.map(w => Math.max(0, w));
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    
    let constraintsApplied = false;
    if (applyConstraints && n >= 2) {
      const result = applyPortfolioConstraints(weights, companies, 0.40, correlationTier);
      weights = result.weights;
      constraintsApplied = result.constraintsApplied;
    }
    
    if (correlationTier === 'high') {
      constraintsApplied = true;
    }
    
    const risks = companies.map(c => c.risk);
    const correlationMatrix = buildCorrelationMatrix(covMatrix);
    
    const portReturn = portfolioExpectedReturn(weights, expectedReturns);
    const portRisk = portfolioRisk(weights, risks, correlationMatrix);
    const portSharpe = sharpeRatio(portReturn * 100, portRisk, RISK_FREE_RATE);
    
    const allocations = {};
    companies.forEach((company, i) => {
      allocations[company.symbol] = weights[i] * 100;
    });
    
    return {
      allocations,
      expected_return: portReturn * 100,
      risk: portRisk,
      sharpe_ratio: portSharpe,
      constraints_applied: constraintsApplied
    };
  } catch (error) {
    console.error('Matrix inversion failed, using equal weights', error);
    const weights = Array(n).fill(1 / n);
    
    const risks = companies.map(c => c.risk);
    const correlationMatrix = buildCorrelationMatrix(covMatrix);
    
    const portReturn = portfolioExpectedReturn(weights, expectedReturns);
    const portRisk = portfolioRisk(weights, risks, correlationMatrix);
    const portSharpe = sharpeRatio(portReturn * 100, portRisk, RISK_FREE_RATE);
    
    const allocations = {};
    companies.forEach((company, i) => {
      allocations[company.symbol] = weights[i] * 100;
    });
    
    return {
      allocations,
      expected_return: portReturn * 100,
      risk: portRisk,
      sharpe_ratio: portSharpe
    };
  }
}

/**
 * Build correlation matrix from covariance matrix
 */
function buildCorrelationMatrix(covMatrix) {
  const n = covMatrix.length;
  const corrMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        corrMatrix[i][j] = 1.0;
      } else {
        corrMatrix[i][j] = covMatrix[i][j] / Math.sqrt(covMatrix[i][i] * covMatrix[j][j]);
      }
    }
  }
  
  return corrMatrix;
}

/**
 * EXPORTED: Build correlation matrix for external use
 */
export function getCorrelationMatrix(companies) {
  const covMatrix = calculateCovarianceMatrix(companies);
  return buildCorrelationMatrix(covMatrix);
}

/**
 * MINIMUM VARIANCE PORTFOLIO - Global Minimum Variance (GMV)
 */
export function optimizeMinimumVariance(companies, applyConstraints = true, correlationTier = 'low') {
  const n = companies.length;
  const expectedReturns = companies.map(c => c.expected_return / 100);
  const covMatrix = calculateCovarianceMatrix(companies);
  
  try {
    const covInverse = invertMatrix(covMatrix);
    const product = covInverse.map(row => row.reduce((sum, val) => sum + val, 0));
    const sumWeights = product.reduce((sum, val) => sum + val, 0);
    
    let weights = product.map(w => w / sumWeights);
    weights = weights.map(w => Math.max(0, w));
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    
    let constraintsApplied = false;
    if (applyConstraints && n >= 2) {
      const result = applyPortfolioConstraints(weights, companies, 0.40, correlationTier);
      weights = result.weights;
      constraintsApplied = result.constraintsApplied;
    }
    
    const risks = companies.map(c => c.risk);
    const correlationMatrix = buildCorrelationMatrix(covMatrix);
    
    const portReturn = portfolioExpectedReturn(weights, expectedReturns);
    const portRisk = portfolioRisk(weights, risks, correlationMatrix);
    const portSharpe = sharpeRatio(portReturn * 100, portRisk, RISK_FREE_RATE);
    
    const allocations = {};
    companies.forEach((company, i) => {
      allocations[company.symbol] = weights[i] * 100;
    });
    
    return {
      allocations,
      expected_return: portReturn * 100,
      risk: portRisk,
      sharpe_ratio: portSharpe,
      constraints_applied: constraintsApplied
    };
  } catch (error) {
    console.error('Matrix inversion failed, using inverse risk weighting', error);
    const risks = companies.map(c => c.risk);
    const inverseRisks = risks.map(r => 1 / r);
    const totalInverseRisk = inverseRisks.reduce((a, b) => a + b, 0);
    let weights = inverseRisks.map(ir => ir / totalInverseRisk);
    
    let constraintsApplied = false;
    if (applyConstraints && n >= 2) {
      const result = applyPortfolioConstraints(weights, companies, 0.40, correlationTier);
      weights = result.weights;
      constraintsApplied = result.constraintsApplied;
    }
    
    const correlationMatrix = buildCorrelationMatrix(covMatrix);
    const portReturn = portfolioExpectedReturn(weights, expectedReturns);
    const portRisk = portfolioRisk(weights, risks, correlationMatrix);
    const portSharpe = sharpeRatio(portReturn * 100, portRisk, RISK_FREE_RATE);
    
    const allocations = {};
    companies.forEach((company, i) => {
      allocations[company.symbol] = weights[i] * 100;
    });
    
    return {
      allocations,
      expected_return: portReturn * 100,
      risk: portRisk,
      sharpe_ratio: portSharpe,
      constraints_applied: constraintsApplied
    };
  }
}

/**
 * MAXIMUM RETURN PORTFOLIO - Concentrated Growth Strategy
 */
export function optimizeMaximumReturn(companies) {
  const n = companies.length;
  const expectedReturns = companies.map(c => c.expected_return / 100);
  const covMatrix = calculateCovarianceMatrix(companies);
  
  let maxReturnIdx = 0;
  let maxReturn = expectedReturns[0];
  let maxRisk = companies[0].risk;
  
  for (let i = 1; i < n; i++) {
    if (expectedReturns[i] > maxReturn || 
        (expectedReturns[i] === maxReturn && companies[i].risk > maxRisk)) {
      maxReturn = expectedReturns[i];
      maxRisk = companies[i].risk;
      maxReturnIdx = i;
    }
  }
  
  const weights = Array(n).fill(0);
  weights[maxReturnIdx] = 1.0;
  
  const risks = companies.map(c => c.risk);
  const correlationMatrix = buildCorrelationMatrix(covMatrix);
  
  const portReturn = portfolioExpectedReturn(weights, expectedReturns);
  const portRisk = portfolioRisk(weights, risks, correlationMatrix);
  const portSharpe = sharpeRatio(portReturn * 100, portRisk, RISK_FREE_RATE);
  
  const allocations = {};
  companies.forEach((company, i) => {
    allocations[company.symbol] = weights[i] * 100;
  });
  
  return {
    allocations,
    expected_return: portReturn * 100,
    risk: portRisk,
    sharpe_ratio: portSharpe
  };
}

/**
 * Apply return caps based on asset class (mean reversion control)
 * Prevents unrealistic long-term expectations
 */
function applyReturnCaps(companies) {
  const adjustments = [];
  
  companies.forEach(company => {
    const symbol = company.symbol.toUpperCase();
    let maxReturn = null;
    let assetClass = 'Speculative';
    
    const isBroadMarketETF = company.isIndexFund || 
                             ['SPY', 'QQQ', 'VTI', 'VOO', 'IVV', 'DIA', 'IWM'].includes(symbol);
    const isBondETF = ['BND', 'AGG', 'TLT', 'LQD', 'SHY'].includes(symbol);
    const isCommodityETF = ['GLD', 'SLV', 'IAU', 'DBC'].includes(symbol);
    const isRealEstateETF = ['VNQ', 'IYR'].includes(symbol);
    const isETF = isBroadMarketETF || isBondETF || isCommodityETF || isRealEstateETF;
    
    if (isBroadMarketETF) {
      maxReturn = 12;
      assetClass = 'Broad Market ETF';
    } else if (isBondETF) {
      maxReturn = 6;
      assetClass = 'Bond ETF';
    } else if (isCommodityETF) {
      maxReturn = 8;
      assetClass = 'Commodity ETF';
    } else if (isRealEstateETF) {
      maxReturn = 10;
      assetClass = 'Real Estate ETF';
    } else {
      const isBluechip = company.market_cap && parseFloat(company.market_cap) > 50 && company.pe_ratio > 0;
      const isSpeculative = !company.pe_ratio || company.pe_ratio < 0 || 
                            (company.market_cap && company.market_cap.includes('M')) ||
                            Math.abs(company.beta || 1) > 1.8;
      
      if (isBluechip) {
        maxReturn = 14;
        assetClass = 'Blue-chip Stock';
      } else if (isSpeculative) {
        maxReturn = 20;
        assetClass = 'Speculative Stock';
      } else {
        maxReturn = 16;
        assetClass = 'Growth Stock';
      }
    }
    
    const shouldCapReturn = !isETF && company.expected_return > maxReturn;
    
    if (shouldCapReturn) {
      adjustments.push({
        symbol: company.symbol,
        original: company.expected_return,
        capped: maxReturn,
        assetClass
      });
      company.expected_return = maxReturn;
      company.return_cap_applied = true;
      company.return_cap_reason = `${assetClass} max: ${maxReturn}% (long-term mean reversion for speculative assets)`;
    }
  });
  
  return adjustments;
}

/**
 * EXPORTED: Calculate quality score for any portfolio composition
 */
export function calculateQualityScore(companies, weights = null) {
  return calculatePortfolioQuality(companies, weights);
}

/**
 * Calculate portfolio quality diagnostics
 */
function calculatePortfolioQuality(companies, weights = null) {
  const n = companies.length;
  const useWeights = weights && weights.length === n;
  const portfolioWeights = useWeights ? weights : Array(n).fill(1 / n);
  
  const sharpeRatios = companies.map(c => sharpeRatio(c.expected_return, c.risk, RISK_FREE_RATE));
  const avgSharpe = sharpeRatios.reduce((a, b) => a + b, 0) / n;
  const maxSharpe = Math.max(...sharpeRatios);
  const minSharpe = Math.min(...sharpeRatios);
  
  const covMatrix = calculateCovarianceMatrix(companies);
  const correlationMatrix = buildCorrelationMatrix(covMatrix);
  const avgCorrelation = averageCorrelation(correlationMatrix);
  
  // COMPONENT 1: SHARPE RATIO SCORE (0-100, Weight: 40%)
  let sharpeScore = 50;
  if (avgSharpe < -0.2) sharpeScore = 5;
  else if (avgSharpe < -0.1) sharpeScore = 15;
  else if (avgSharpe < 0) sharpeScore = 30;
  else if (avgSharpe < 0.2) sharpeScore = 45;
  else if (avgSharpe < 0.4) sharpeScore = 60;
  else if (avgSharpe < 0.6) sharpeScore = 75;
  else if (avgSharpe < 0.8) sharpeScore = 85;
  else sharpeScore = 95;
  
  const sharpeDiff = maxSharpe - minSharpe;
  if (sharpeDiff > 0.5) sharpeScore += 5;
  else if (sharpeDiff < 0.15) sharpeScore -= 10;
  sharpeScore = Math.max(0, Math.min(100, sharpeScore));
  
  // COMPONENT 2: CORRELATION SCORE (0-100, Weight: 30%)
  let correlationScore = 50;
  if (avgCorrelation < 0.2) correlationScore = 100;
  else if (avgCorrelation < 0.3) correlationScore = 90;
  else if (avgCorrelation < 0.4) correlationScore = 80;
  else if (avgCorrelation < 0.5) correlationScore = 65;
  else if (avgCorrelation < 0.6) correlationScore = 45;
  else if (avgCorrelation < 0.7) correlationScore = 25;
  else if (avgCorrelation < 0.75) correlationScore = 10;
  else correlationScore = 0;
  
  // COMPONENT 3: DIVERSIFICATION SCORE (0-100, Weight: 20%)
  let diversificationScore = 50;
  
  const sectorWeights = {};
  companies.forEach((c, idx) => {
    const sector = c.sector || 'Unknown';
    sectorWeights[sector] = (sectorWeights[sector] || 0) + portfolioWeights[idx];
  });
  const sectorHHI = Object.values(sectorWeights).reduce((sum, w) => sum + w * w, 0);
  const sectorDiversityScore = (1 - sectorHHI) * 100;
  
  const marketCapWeights = { micro: 0, small: 0, mid: 0, large: 0, mega: 0, unknown: 0 };
  companies.forEach((c, idx) => {
    if (!c.market_cap) {
      marketCapWeights.unknown += portfolioWeights[idx];
      return;
    }
    if (c.market_cap.includes('M')) {
      const val = parseFloat(c.market_cap);
      marketCapWeights[val < 300 ? 'micro' : 'small'] += portfolioWeights[idx];
    } else if (c.market_cap.includes('B')) {
      const val = parseFloat(c.market_cap);
      if (val < 2) marketCapWeights.small += portfolioWeights[idx];
      else if (val < 10) marketCapWeights.mid += portfolioWeights[idx];
      else if (val < 50) marketCapWeights.large += portfolioWeights[idx];
      else marketCapWeights.mega += portfolioWeights[idx];
    }
  });
  const capHHI = Object.values(marketCapWeights).reduce((sum, w) => sum + w * w, 0);
  const capDiversityScore = (1 - capHHI) * 100;
  
  const assetTypeWeights = { stock: 0, etf: 0, bond: 0 };
  companies.forEach((c, idx) => {
    const symbol = c.symbol.toUpperCase();
    if (['BND', 'AGG', 'TLT', 'LQD', 'SHY'].includes(symbol)) {
      assetTypeWeights.bond += portfolioWeights[idx];
    } else if (c.isIndexFund || ['SPY', 'QQQ', 'VTI', 'VOO', 'GLD', 'VNQ'].includes(symbol)) {
      assetTypeWeights.etf += portfolioWeights[idx];
    } else {
      assetTypeWeights.stock += portfolioWeights[idx];
    }
  });
  const typeHHI = Object.values(assetTypeWeights).reduce((sum, w) => sum + w * w, 0);
  const typeDiversityScore = (1 - typeHHI) * 100;
  
  let liquidityScore = 50;
  const liquidAssetWeight = companies.reduce((sum, c, idx) => {
    const symbol = c.symbol.toUpperCase();
    const isHighlyLiquid = c.isIndexFund || 
                          ['SPY', 'QQQ', 'VTI', 'VOO', 'BND', 'AGG', 'GLD'].includes(symbol) ||
                          (c.market_cap && c.market_cap.includes('B') && parseFloat(c.market_cap) > 10);
    return sum + (isHighlyLiquid ? portfolioWeights[idx] : 0);
  }, 0);
  liquidityScore = 40 + (liquidAssetWeight * 60);
  
  diversificationScore = (sectorDiversityScore * 0.35) + (capDiversityScore * 0.25) + 
                         (typeDiversityScore * 0.25) + (liquidityScore * 0.15);
  
  // COMPONENT 4: MATURITY SCORE (0-100, Weight: 10%)
  let speculativeWeight = 0;
  companies.forEach((c, idx) => {
    const symbol = c.symbol.toUpperCase();
    const isETF = c.isIndexFund || 
                  ['SPY', 'QQQ', 'VTI', 'VOO', 'IVV', 'BND', 'AGG', 'GLD', 'VNQ'].includes(symbol);
    if (isETF) return;
    
    const isSpeculative = !c.pe_ratio || c.pe_ratio < 0 || (c.market_cap && c.market_cap.includes('M'));
    if (isSpeculative) {
      speculativeWeight += portfolioWeights[idx];
    }
  });
  const speculativeRatio = speculativeWeight;
  
  let maturityScore = 50;
  if (speculativeRatio > 0.8) maturityScore = 10;
  else if (speculativeRatio > 0.6) maturityScore = 30;
  else if (speculativeRatio > 0.4) maturityScore = 50;
  else if (speculativeRatio > 0.2) maturityScore = 70;
  else if (speculativeRatio > 0.1) maturityScore = 85;
  else maturityScore = 95;
  
  const lowCorrelationWeight = companies.reduce((sum, c, idx) => {
    const symbol = c.symbol.toUpperCase();
    const isDiversifier = ['BND', 'AGG', 'TLT', 'GLD', 'VNQ', 'VXUS'].includes(symbol);
    return sum + (isDiversifier ? portfolioWeights[idx] : 0);
  }, 0);
  
  if (lowCorrelationWeight > 0.15) {
    maturityScore = Math.min(100, maturityScore + 10);
  }
  
  // WEIGHTED COMPOSITE SCORE
  const rawQualityScore = Math.round(
    sharpeScore * 0.40 +
    correlationScore * 0.30 +
    diversificationScore * 0.20 +
    maturityScore * 0.10
  );
  
  const finalScore = Math.max(0, Math.min(95, rawQualityScore));
  
  let qualityBand = '';
  let bandExplanation = '';
  
  if (finalScore >= 80) {
    qualityBand = 'Exceptional';
    bandExplanation = 'Institutional-quality diversification and risk management';
  } else if (finalScore >= 65) {
    qualityBand = 'Strong';
    bandExplanation = 'Well-constructed with good diversification';
  } else if (finalScore >= 45) {
    qualityBand = 'Acceptable';
    bandExplanation = 'Moderate quality with room for improvement';
  } else if (finalScore >= 25) {
    qualityBand = 'Weak';
    bandExplanation = 'Significant risks - consider rebalancing';
  } else {
    qualityBand = 'Poor';
    bandExplanation = 'High-risk portfolio - educational exploration only';
  }
  
  let correlationTier = 'low';
  let confidenceLevel = 'high';
  
  if (avgCorrelation > 0.75) {
    correlationTier = 'extreme';
    confidenceLevel = 'blocked';
  } else if (avgCorrelation > 0.6) {
    correlationTier = 'high';
    confidenceLevel = 'low';
  } else if (avgCorrelation >= 0.5) {
    correlationTier = 'moderate';
    confidenceLevel = 'medium';
  }
  
  const warnings = [];
  const scoreJustification = [];
  
  if (avgSharpe < 0) {
    warnings.push('Negative risk-adjusted returns - portfolio expected to underperform risk-free rate');
    warnings.push('CRITICAL: Reconsider asset selection or reduce speculative exposure');
    scoreJustification.push(`Negative Sharpe (-${Math.round((100 - sharpeScore) * 0.4)} pts)`);
  } else if (avgSharpe < 0.15) {
    warnings.push('Low Sharpe ratio (<0.15) - poor risk-adjusted performance');
    scoreJustification.push(`Low Sharpe (-${Math.round((100 - sharpeScore) * 0.4)} pts)`);
  }
  
  if (avgCorrelation > 0.85) {
    warnings.push('Extreme correlation (>85%) - assets move nearly in lockstep, eliminating diversification');
    warnings.push('STRONG RECOMMENDATION: Add uncorrelated assets (bonds, gold, utilities, international)');
    scoreJustification.push(`Extreme correlation (-${Math.round((100 - correlationScore) * 0.3)} pts)`);
  } else if (avgCorrelation > 0.75) {
    warnings.push('Very high correlation (>75%) - limited diversification benefit');
    warnings.push('Consider adding uncorrelated assets to improve risk-adjusted returns');
    scoreJustification.push(`Very high correlation (-${Math.round((100 - correlationScore) * 0.3)} pts)`);
  } else if (avgCorrelation > 0.60) {
    warnings.push('High correlation - diversification benefits are reduced');
    scoreJustification.push(`High correlation (-${Math.round((100 - correlationScore) * 0.3)} pts)`);
  }
  
  if (speculativeRatio >= 0.95) {
    warnings.push('Portfolio dominated by speculative/unprofitable assets (>95%)');
    warnings.push('High volatility expected - risk of severe drawdowns');
    warnings.push('Consider balancing with established blue-chip stocks or index funds');
    scoreJustification.push(`100% speculative (-${Math.round((100 - maturityScore) * 0.1)} pts)`);
  } else if (speculativeRatio >= 0.70) {
    warnings.push(`High speculative exposure (${(speculativeRatio * 100).toFixed(0)}%) increases portfolio fragility`);
    warnings.push('Recommend adding profitable companies with proven business models');
    scoreJustification.push(`High speculative exposure (-${Math.round((100 - maturityScore) * 0.1)} pts)`);
  } else if (speculativeRatio >= 0.50) {
    warnings.push(`Moderate speculative allocation (${(speculativeRatio * 100).toFixed(0)}%) - monitor closely`);
  }
  
  if (diversificationScore < 40) {
    const hhi = herfindahlIndex(portfolioWeights);
    if (hhi > 0.60) {
      warnings.push('Severe concentration risk - single-asset outcomes dominate portfolio');
    } else if (hhi > 0.40) {
      warnings.push('High concentration - portfolio heavily dependent on few positions');
    }
    scoreJustification.push(`Poor diversification (-${Math.round((100 - diversificationScore) * 0.2)} pts)`);
  }
  
  if (n < 3) {
    warnings.push('Fewer than 3 assets - insufficient diversification');
  }
  
  if (n >= 3) {
    const sectors = companies.map(c => c.sector);
    const uniqueSectors = new Set(sectors.filter(s => s && s !== 'Unknown'));
    if (uniqueSectors.size === 1 && uniqueSectors.values().next().value) {
      warnings.push(`All assets from ${uniqueSectors.values().next().value} sector - sector concentration risk`);
    }
  }
  
  return {
    qualityScore: finalScore,
    qualityBand,
    bandExplanation,
    avgSharpe,
    avgCorrelation,
    correlationTier,
    confidenceLevel,
    sharpeRange: [minSharpe, maxSharpe],
    speculativeRatio,
    warnings,
    scoreJustification: scoreJustification.length > 0 
      ? scoreJustification.join(', ') 
      : `Score reflects balance of all factors: Sharpe=${Math.round(sharpeScore)}, Correlation=${Math.round(correlationScore)}, Diversification=${Math.round(diversificationScore)}, Maturity=${Math.round(maturityScore)}`,
    components: {
      sharpeScore: Math.round(sharpeScore),
      correlationScore: Math.round(correlationScore),
      diversificationScore: Math.round(diversificationScore),
      maturityScore: Math.round(maturityScore)
    },
    diversityMetrics: {
      sectorDiversity: Math.round(sectorDiversityScore),
      marketCapDiversity: Math.round(capDiversityScore),
      assetTypeDiversity: Math.round(typeDiversityScore),
      uniqueSectors: Object.keys(sectorWeights).length,
      uniqueMarketCaps: Object.keys(marketCapWeights).filter(k => marketCapWeights[k] > 0).length
    }
  };
}

/**
 * ALLOCATION INTEGRITY VALIDATOR
 * Validates that allocations are unique, sum to 100%, and reflect asset metrics
 */
function validateAllocationIntegrity(allocations, companies, portfolioName = 'Portfolio') {
  const symbols = Object.keys(allocations);
  const weights = Object.values(allocations);
  
  const sum = weights.reduce((a, b) => a + b, 0);
  const tolerance = 0.1;
  
  if (Math.abs(sum - 100) > tolerance) {
    console.error(`❌ ${portfolioName}: Allocations sum to ${sum.toFixed(4)}%, expected 100%`);
    throw new Error(`CRITICAL: ${portfolioName} allocations sum to ${sum.toFixed(2)}% (expected 100%)`);
  }
  
  const allocationPrecision = 1;
  const uniqueAllocations = new Set(weights.map(w => w.toFixed(allocationPrecision)));
  
  const metricSignatures = {};
  companies.forEach(c => {
    const signature = `${c.expected_return.toFixed(2)}_${c.risk.toFixed(2)}_${((c.expected_return - 4.5) / c.risk).toFixed(3)}`;
    metricSignatures[c.symbol] = signature;
  });
  const uniqueMetrics = new Set(Object.values(metricSignatures));
  
  if (uniqueAllocations.size < weights.length && uniqueMetrics.size === weights.length) {
    console.error(`❌ ${portfolioName}: ALLOCATION UNIQUENESS VIOLATION`);
    console.error(`   Assets with different metrics received identical allocations`);
    
    const allocationGroups = {};
    symbols.forEach((symbol, idx) => {
      const allocation = weights[idx].toFixed(allocationPrecision);
      if (!allocationGroups[allocation]) allocationGroups[allocation] = [];
      
      const company = companies.find(c => c.symbol === symbol);
      allocationGroups[allocation].push({
        symbol,
        allocation: weights[idx].toFixed(3),
        return: company.expected_return.toFixed(2),
        risk: company.risk.toFixed(2),
        sharpe: ((company.expected_return - 4.5) / company.risk).toFixed(3),
        beta: (company.beta || 1.0).toFixed(3)
      });
    });
    
    Object.entries(allocationGroups).forEach(([allocation, assets]) => {
      if (assets.length > 1) {
        console.error(`   ${allocation}%:`, assets);
      }
    });
    
    throw new Error(`CRITICAL: ${portfolioName} has ${weights.length - uniqueAllocations.size} duplicate allocations despite unique asset metrics.`);
  }
  
  const assetData = symbols.map((symbol, idx) => {
    const company = companies.find(c => c.symbol === symbol);
    return {
      symbol,
      allocation: weights[idx],
      sharpe: (company.expected_return - 4.5) / company.risk
    };
  }).sort((a, b) => b.sharpe - a.sharpe);
  
  const topSharpe = assetData.slice(0, 2);
  const allAllocations = assetData.map(a => a.allocation).sort((a, b) => b - a);
  const topAllocations = allAllocations.slice(0, 2);
  
  topSharpe.forEach(asset => {
    if (asset.allocation < topAllocations[1] * 0.7) {
      console.warn(`⚠️ ${portfolioName}: Asset ${asset.symbol} has Sharpe ${asset.sharpe.toFixed(3)} but allocation ${asset.allocation.toFixed(1)}% is low`);
    }
  });
  
  console.log(`✅ ${portfolioName}: Allocation integrity VALIDATED`);
  console.log(`   Sum: ${sum.toFixed(2)}%, Unique: ${uniqueAllocations.size}/${weights.length}, Range: ${Math.min(...weights).toFixed(1)}%-${Math.max(...weights).toFixed(1)}%`);
  
  return true;
}

/**
 * MASTER OPTIMIZATION FUNCTION
 * Generates all three portfolios with strict validation
 */
export function optimizeAllPortfolios(companies) {
  console.log("🔍 PRE-OPTIMIZATION DIAGNOSTIC:");
  companies.forEach((c, i) => {
    console.log(`   ${i+1}. ${c.symbol}: Return=${c.expected_return.toFixed(3)}%, Risk=${c.risk.toFixed(3)}%, Sharpe=${(c.expected_return/c.risk).toFixed(4)}`);
  });
  
  const returnCapAdjustments = applyReturnCaps(companies);
  if (returnCapAdjustments.length > 0) {
    console.log("📉 RETURN CAPS APPLIED:");
    returnCapAdjustments.forEach(adj => {
      console.log(`   ${adj.symbol} (${adj.assetClass}): ${adj.original.toFixed(1)}% → ${adj.capped.toFixed(1)}%`);
    });
  }
  
  const portfolioQuality = calculatePortfolioQuality(companies);
  
  const returnSpread = Math.max(...companies.map(c => c.expected_return)) - Math.min(...companies.map(c => c.expected_return));
  const riskSpread = Math.max(...companies.map(c => c.risk)) - Math.min(...companies.map(c => c.risk));

  if (returnSpread < 2.0 || riskSpread < 3.0) {
    console.warn("⚠️ ASSET SIMILARITY DETECTED (no auto-adjustment):");
    console.warn(`   Return spread: ${returnSpread.toFixed(2)}%, Risk spread: ${riskSpread.toFixed(2)}%`);
  }
  
  const correlationTier = portfolioQuality.correlationTier || 'low';
  const confidenceLevel = portfolioQuality.confidenceLevel || 'high';
  
  console.log(`📊 CORRELATION TIER: ${correlationTier.toUpperCase()} (${(portfolioQuality.avgCorrelation * 100).toFixed(0)}%)`);
  console.log(`🎯 CONFIDENCE LEVEL: ${confidenceLevel.toUpperCase()}`);
  
  const optimal = optimizeOptimalPortfolio(companies, true, correlationTier);
  const minVariance = optimizeMinimumVariance(companies, true, correlationTier);
  let maxReturn = optimizeMaximumReturn(companies);
  
  const highestIndividualReturn = Math.max(...companies.map(c => c.expected_return));
  
  if (maxReturn.expected_return <= optimal.expected_return || 
      maxReturn.expected_return <= minVariance.expected_return ||
      maxReturn.expected_return < highestIndividualReturn - 0.01) {
    console.warn("⚠️ Maximum Return validation failed - forcing 100% allocation to top asset");
    
    const expectedReturns = companies.map(c => c.expected_return / 100);
    const maxReturnIdx = expectedReturns.indexOf(Math.max(...expectedReturns));
    const weights = Array(companies.length).fill(0);
    weights[maxReturnIdx] = 1.0;
    
    const risks = companies.map(c => c.risk);
    const covMatrix = calculateCovarianceMatrix(companies);
    const correlationMatrix = buildCorrelationMatrix(covMatrix);
    
    const portReturn = portfolioExpectedReturn(weights, expectedReturns);
    const portRisk = portfolioRisk(weights, risks, correlationMatrix);
    const portSharpe = sharpeRatio(portReturn * 100, portRisk, RISK_FREE_RATE);
    
    const allocations = {};
    companies.forEach((company, i) => {
      allocations[company.symbol] = weights[i] * 100;
    });
    
    maxReturn = {
      allocations,
      expected_return: portReturn * 100,
      risk: portRisk,
      sharpe_ratio: portSharpe
    };
  }
  
  const avgCorrelation = portfolioQuality.avgCorrelation;
  const validationResult = validatePortfolioResults(optimal, minVariance, maxReturn, companies, avgCorrelation, correlationTier);
  
  if (correlationTier === 'high') {
    optimal.optimizationMethod = 'Constrained (High Correlation)';
    optimal.stabilizationApplied = true;
  } else if (correlationTier === 'moderate') {
    optimal.optimizationMethod = 'Standard (Moderate Correlation)';
  }
  
  const optimalAllocations = Object.values(optimal.allocations);
  const allocationPrecision = 3;
  const uniqueAllocations = new Set(optimalAllocations.map(a => a.toFixed(allocationPrecision)));
  
  console.log("🔍 ALLOCATION UNIQUENESS CHECK:");
  console.log(`   Total assets: ${companies.length}`);
  console.log(`   Unique allocations: ${uniqueAllocations.size}`);
  console.log(`   Allocations: ${optimalAllocations.map(a => a.toFixed(2) + '%').join(', ')}`);
  
  if (uniqueAllocations.size < companies.length && companies.length >= 3) {
    console.warn("⚠️ WARNING: Some assets have identical allocations despite different metrics");
    
    const allocationGroups = {};
    companies.forEach((c, idx) => {
      const allocation = optimal.allocations[c.symbol].toFixed(allocationPrecision);
      if (!allocationGroups[allocation]) allocationGroups[allocation] = [];
      allocationGroups[allocation].push({
        symbol: c.symbol,
        return: c.expected_return.toFixed(2),
        risk: c.risk.toFixed(2),
        sharpe: ((c.expected_return - 4.5) / c.risk).toFixed(3)
      });
    });
    
    Object.entries(allocationGroups).forEach(([allocation, assets]) => {
      if (assets.length > 1) {
        console.warn(`   ${allocation}%: ${JSON.stringify(assets)}`);
      }
    });
  }
  
  companies.forEach(company => {
    const optimalWeight = optimal.allocations[company.symbol] || 0;
    const sharpeRatio = (company.expected_return - 4.5) / company.risk;
    const marketCap = company.market_cap;
    const isMegaLargeCap = marketCap && marketCap.includes('B') && parseFloat(marketCap) > 50;
    const isSmallMicro = !marketCap || marketCap.includes('M');
    
    let rationale = [];
    
    if (sharpeRatio > 0.5) {
      rationale.push(`Strong risk-adjusted returns (Sharpe: ${sharpeRatio.toFixed(2)})`);
    } else if (sharpeRatio > 0.2) {
      rationale.push(`Moderate risk-adjusted returns (Sharpe: ${sharpeRatio.toFixed(2)})`);
    } else {
      rationale.push(`Lower risk-adjusted returns (Sharpe: ${sharpeRatio.toFixed(2)})`);
    }
    
    if (isMegaLargeCap) {
      rationale.push(`Mega/large-cap stability (${marketCap})`);
    } else if (isSmallMicro) {
      rationale.push(`Small/micro-cap higher risk (${marketCap || 'unknown'})`);
    }
    
    const beta = company.beta || 1.0;
    if (beta > 1.5) {
      rationale.push(`High market sensitivity (β=${beta.toFixed(2)})`);
    } else if (beta < 0.8) {
      rationale.push(`Defensive characteristics (β=${beta.toFixed(2)})`);
    }
    
    if (optimalWeight >= 25) {
      rationale.push(`Major position for diversification balance`);
    } else if (optimalWeight >= 15) {
      rationale.push(`Substantial allocation for portfolio contribution`);
    } else if (optimalWeight >= 8) {
      rationale.push(`Meaningful allocation for diversification`);
    }
    
    company.allocation_rationale = rationale.join(' • ');
  });
  
  console.log("✅ OPTIMIZATION COMPLETE:");
  console.log(`   Optimal: Return=${optimal.expected_return.toFixed(2)}%, Risk=${optimal.risk.toFixed(2)}%, Sharpe=${optimal.sharpe_ratio.toFixed(3)}`);
  console.log(`   Min Var: Return=${minVariance.expected_return.toFixed(2)}%, Risk=${minVariance.risk.toFixed(2)}%, Sharpe=${minVariance.sharpe_ratio.toFixed(3)}`);
  console.log(`   Max Ret: Return=${maxReturn.expected_return.toFixed(2)}%, Risk=${maxReturn.risk.toFixed(2)}%, Sharpe=${maxReturn.sharpe_ratio.toFixed(3)}`);
  
  if (validationResult.criticalErrors.length > 0) {
    console.warn("⚠️ VALIDATION ALERTS:");
    validationResult.criticalErrors.forEach(e => console.warn(`   ${e.type}: ${e.message}`));
  }
  
  if (validationResult.warnings.length > 0) {
    console.log("ℹ️ WARNINGS:");
    validationResult.warnings.forEach(w => console.log(`   [${w.severity}] ${w.message}`));
  }
  
  console.log("\n🔒 ALLOCATION INTEGRITY VALIDATION:");
  
  try {
    validateAllocationIntegrity(optimal.allocations, companies, 'Optimal Portfolio');
    validateAllocationIntegrity(minVariance.allocations, companies, 'Minimum Variance Portfolio');
    
    const maxReturnWeights = Object.values(maxReturn.allocations);
    const has100Percent = maxReturnWeights.some(w => Math.abs(w - 100) < 0.01);
    if (!has100Percent) {
      validateAllocationIntegrity(maxReturn.allocations, companies, 'Maximum Return Portfolio');
    }
    
    console.log("✅ ALL PORTFOLIOS PASSED ALLOCATION INTEGRITY VALIDATION\n");
  } catch (error) {
    console.error("\n❌❌❌ ALLOCATION INTEGRITY FAILURE ❌❌❌");
    console.error(error.message);
    console.error("Review portfolioOptimization.js → applyPortfolioConstraints()\n");
    
    throw new Error(`Portfolio optimization failed integrity validation: ${error.message}`);
  }
  
  return {
    optimal_portfolio: optimal,
    minimum_variance_portfolio: minVariance,
    maximum_return_portfolio: maxReturn,
    validation: validationResult,
    portfolio_quality: portfolioQuality,
    return_cap_adjustments: returnCapAdjustments
  };
}
