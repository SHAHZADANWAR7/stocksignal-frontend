/**
 * Portfolio Rebalancing Simulator
 * 
 * Phase 3: Analyzes impact of rebalancing frequency on returns, risk, and costs
 * 
 * Academic Foundation:
 * - Bodie, Kane, Marcus (2014): "Investments" - Portfolio Rebalancing
 * - Vanguard Research (2010): "Best practices for portfolio rebalancing"
 * - Jaconetti et al. (2010): "The impact of automatic rebalancing"
 * 
 * Simulation Parameters (Jan 2026):
 * - Monte Carlo simulations: 5,000 iterations
 * - Transaction cost: 5 bps per trade (0.05%)
 * - Risk-free rate: 4.5% (3-month T-Bill)
 * - Drift threshold: 10% deviation from target weights
 */

import {
  portfolioExpectedReturn,
  portfolioRisk,
  sharpeRatio,
  round
} from "./financialMath";

/**
 * Simulate portfolio drift over time
 * Assets grow at different rates, causing allocation drift
 * 
 * @param {Array} companies - Array of company objects with expected_return and risk
 * @param {Array} initialWeights - Initial portfolio weights (must sum to ~1.0)
 * @param {number} months - Simulation horizon in months
 * @returns {Array} Drift snapshots at quarterly intervals
 */
export function simulatePortfolioDrift(companies, initialWeights, months = 36) {
  // Validate inputs
  const weightSum = initialWeights.reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn(`Initial weights sum to ${weightSum.toFixed(4)}, normalizing to 1.0`);
    initialWeights = initialWeights.map(w => w / weightSum);
  }
  
  const monthlyReturns = companies.map(c => (c.expected_return || 0) / 12 / 100);
  const monthlyVols = companies.map(c => (c.risk || 20) / Math.sqrt(12) / 100);
  
  const simulations = 2000;
  const driftSnapshots = [];
  
  // Track average drift quarterly (every 3 months)
  for (let month = 0; month <= months; month += 3) {
    const monthWeights = [];
    
    for (let sim = 0; sim < simulations; sim++) {
      const values = initialWeights.map((w, i) => {
        let value = w;
        for (let m = 0; m < month; m++) {
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const monthReturn = monthlyReturns[i] + z * monthlyVols[i];
          value *= (1 + monthReturn);
        }
        return Math.max(0, value);
      });
      
      const total = values.reduce((a, b) => a + b, 0);
      if (total > 0) {
        const weights = values.map(v => v / total);
        monthWeights.push(weights);
      }
    }
    
    if (monthWeights.length === 0) continue;
    
    // Average weights across simulations
    const avgWeights = companies.map((_, i) => {
      const sum = monthWeights.reduce((s, w) => s + w[i], 0);
      return sum / monthWeights.length;
    });
    
    // Normalize to ensure sum = 1.0
    const totalWeight = avgWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = avgWeights.map(w => w / totalWeight);
    
    driftSnapshots.push({
      month,
      year: (month / 12).toFixed(1),
      weights: normalizedWeights.map(w => round(w * 100, 1)),
      drift: normalizedWeights.map((w, i) => round((w - initialWeights[i]) * 100, 1)),
      allocationSum: round(normalizedWeights.reduce((a, b) => a + b, 0) * 100, 1)
    });
  }
  
  return driftSnapshots;
}

/**
 * Calculate rebalancing impact
 * Compares buy-and-hold vs periodic rebalancing
 * 
 * @param {Array} companies - Company objects with expected_return and risk
 * @param {Array} initialWeights - Target portfolio weights (must sum to 1.0)
 * @param {number} years - Simulation horizon in years
 * @returns {Object} Rebalancing strategy comparison results
 */
export function calculateRebalancingImpact(companies, initialWeights, years = 10) {
  // Validate and normalize weights
  const weightSum = initialWeights.reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn(`Rebalancing: Initial weights sum to ${weightSum.toFixed(4)}, normalizing`);
    initialWeights = initialWeights.map(w => w / weightSum);
  }
  
  const risks = companies.map(c => c.risk || 20);
  const expectedReturns = companies.map(c => (c.expected_return || 0) / 100);
  
  // Build correlation matrix with sector-based estimates
  const n = companies.length;
  const correlationMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1.0;
      } else {
        const sector1 = companies[i].sector || 'Unknown';
        const sector2 = companies[j].sector || 'Unknown';
        const beta1 = companies[i].beta || 1.0;
        const beta2 = companies[j].beta || 1.0;
        
        // Same sector = 0.7, different = 0.4, beta-adjusted
        const baseCor = sector1 === sector2 ? 0.7 : 0.4;
        const betaAdjustment = (Math.abs(beta1 - 1.0) + Math.abs(beta2 - 1.0)) * 0.05;
        correlationMatrix[i][j] = Math.min(0.95, baseCor + betaAdjustment);
      }
    }
  }
  
  const simulations = 5000;
  const strategies = {
    noRebalance: { returns: [], sharpes: [], finalWeights: [] },
    monthly: { returns: [], sharpes: [], finalWeights: [], costs: [] },
    yearly: { returns: [], sharpes: [], finalWeights: [], costs: [] }
  };
  
  const transactionCostBps = 5;
  const riskFreeRate = 4.5;
  
  for (let sim = 0; sim < simulations; sim++) {
    // Strategy 1: Buy & Hold (No Rebalancing)
    const noRebalValues = [...initialWeights];
    for (let month = 0; month < years * 12; month++) {
      for (let i = 0; i < n; i++) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const monthReturn = expectedReturns[i] / 12 + z * (risks[i] / Math.sqrt(12) / 100);
        noRebalValues[i] = Math.max(0, noRebalValues[i] * (1 + monthReturn));
      }
    }
    const noRebalTotal = noRebalValues.reduce((a, b) => a + b, 0);
    const noRebalReturn = ((noRebalTotal / 1.0) - 1) * 100;
    const noRebalAnnualReturn = noRebalReturn / years;
    const noRebalFinalWeights = noRebalValues.map(v => v / noRebalTotal);
    const noRebalRisk = portfolioRisk(noRebalFinalWeights, risks, correlationMatrix);
    const noRebalSharpe = sharpeRatio(noRebalAnnualReturn, noRebalRisk, riskFreeRate);
    
    strategies.noRebalance.returns.push(noRebalReturn);
    strategies.noRebalance.sharpes.push(noRebalSharpe);
    strategies.noRebalance.finalWeights.push(noRebalFinalWeights);
    
    // Strategy 2: Monthly Rebalancing
    const monthlyValues = [...initialWeights];
    let monthlyCosts = 0;
    
    for (let month = 0; month < years * 12; month++) {
      for (let i = 0; i < n; i++) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const monthReturn = expectedReturns[i] / 12 + z * (risks[i] / Math.sqrt(12) / 100);
        monthlyValues[i] = Math.max(0, monthlyValues[i] * (1 + monthReturn));
      }
      
      // Rebalance to target weights every month
      const total = monthlyValues.reduce((a, b) => a + b, 0);
      const currentWeights = monthlyValues.map((v, idx) => total > 0 ? v / total : initialWeights[idx]);
      
      // One-sided turnover
      const turnover = currentWeights.reduce((sum, w, i) => sum + Math.abs(w - initialWeights[i]), 0) / 2;
      monthlyCosts += turnover * (transactionCostBps / 10000) * total;
      
      // Reset to target
      for (let i = 0; i < n; i++) {
        monthlyValues[i] = total * initialWeights[i];
      }
    }
    const monthlyTotal = monthlyValues.reduce((a, b) => a + b, 0);
    const monthlyReturn = ((monthlyTotal - monthlyCosts) / 1.0 - 1) * 100;
    const monthlyAnnualReturn = monthlyReturn / years;
    const monthlyRisk = portfolioRisk(initialWeights, risks, correlationMatrix);
    const monthlySharpe = sharpeRatio(monthlyAnnualReturn, monthlyRisk, riskFreeRate);
    
    strategies.monthly.returns.push(monthlyReturn);
    strategies.monthly.sharpes.push(monthlySharpe);
    strategies.monthly.costs.push(monthlyCosts);
    strategies.monthly.finalWeights.push([...initialWeights]);
    
    // Strategy 3: Yearly Rebalancing
    const yearlyValues = [...initialWeights];
    let yearlyCosts = 0;
    
    for (let month = 0; month < years * 12; month++) {
      for (let i = 0; i < n; i++) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const monthReturn = expectedReturns[i] / 12 + z * (risks[i] / Math.sqrt(12) / 100);
        yearlyValues[i] = Math.max(0, yearlyValues[i] * (1 + monthReturn));
      }
      
      // Rebalance at year end
      if ((month + 1) % 12 === 0) {
        const total = yearlyValues.reduce((a, b) => a + b, 0);
        const currentWeights = yearlyValues.map((v, idx) => total > 0 ? v / total : initialWeights[idx]);
        
        // One-sided turnover
        const turnover = currentWeights.reduce((sum, w, i) => sum + Math.abs(w - initialWeights[i]), 0) / 2;
        yearlyCosts += turnover * (transactionCostBps / 10000) * total;
        
        for (let i = 0; i < n; i++) {
          yearlyValues[i] = total * initialWeights[i];
        }
      }
    }
    const yearlyTotal = yearlyValues.reduce((a, b) => a + b, 0);
    const yearlyReturn = ((yearlyTotal - yearlyCosts) / 1.0 - 1) * 100;
    const yearlyAnnualReturn = yearlyReturn / years;
    const yearlyRisk = portfolioRisk(initialWeights, risks, correlationMatrix);
    const yearlySharpe = sharpeRatio(yearlyAnnualReturn, yearlyRisk, riskFreeRate);
    
    strategies.yearly.returns.push(yearlyReturn);
    strategies.yearly.sharpes.push(yearlySharpe);
    strategies.yearly.costs.push(yearlyCosts);
    strategies.yearly.finalWeights.push([...initialWeights]);
  }
  
  // Calculate statistics with validation
  const calcStats = (values) => {
    if (values.length === 0) {
      return { median: 0, p25: 0, p75: 0, mean: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return {
      median: round(sorted[Math.floor(sorted.length * 0.5)], 2),
      p25: round(sorted[Math.floor(sorted.length * 0.25)], 2),
      p75: round(sorted[Math.floor(sorted.length * 0.75)], 2),
      mean: round(mean, 2)
    };
  };
  
  return {
    noRebalance: {
      returns: calcStats(strategies.noRebalance.returns),
      sharpe: calcStats(strategies.noRebalance.sharpes),
      avgFinalWeights: companies.map((_, i) => {
        const sum = strategies.noRebalance.finalWeights.reduce((s, w) => s + w[i], 0);
        return round((sum / simulations) * 100, 1);
      }),
      costs: { median: 0, p25: 0, p75: 0, mean: 0 },
      strategy: 'Buy & Hold (No Rebalancing)'
    },
    monthly: {
      returns: calcStats(strategies.monthly.returns),
      sharpe: calcStats(strategies.monthly.sharpes),
      avgFinalWeights: companies.map((_, i) => round(initialWeights[i] * 100, 1)),
      costs: calcStats(strategies.monthly.costs),
      strategy: 'Monthly Rebalancing',
      rebalancesPerYear: 12
    },
    yearly: {
      returns: calcStats(strategies.yearly.returns),
      sharpe: calcStats(strategies.yearly.sharpes),
      avgFinalWeights: companies.map((_, i) => round(initialWeights[i] * 100, 1)),
      costs: calcStats(strategies.yearly.costs),
      strategy: 'Annual Rebalancing',
      rebalancesPerYear: 1
    },
    metadata: {
      simulations,
      years,
      transactionCostBps,
      riskFreeRate,
      initialWeightSum: round(initialWeights.reduce((a, b) => a + b, 0), 4)
    }
  };
}

/**
 * Calculate DCA vs Lump Sum comparison
 * 
 * @param {number} principal - Initial lump sum available
 * @param {number} monthlyAmount - Monthly DCA contribution
 * @param {number} expectedReturn - Portfolio annual expected return (%)
 * @param {number} volatility - Portfolio annualized volatility (%)
 * @param {number} years - Investment horizon
 * @returns {Object} Comparison results with median, percentiles, win rate
 */
export function compareDCAvsLumpSum(principal, monthlyAmount, expectedReturn, volatility, years = 10) {
  const simulations = 5000;
  const dcaResults = [];
  const lumpSumResults = [];
  
  const monthlyReturn = expectedReturn / 12 / 100;
  const monthlyVol = volatility / Math.sqrt(12) / 100;
  
  for (let sim = 0; sim < simulations; sim++) {
    // DCA Strategy: Invest principal immediately + monthly contributions
    let dcaValue = principal;
    for (let month = 0; month < years * 12; month++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const monthRet = monthlyReturn + z * monthlyVol;
      
      dcaValue = Math.max(0, dcaValue * (1 + monthRet)) + monthlyAmount;
    }
    dcaResults.push(dcaValue);
    
    // Lump Sum Strategy: Invest total upfront
    const totalInvested = principal + (monthlyAmount * years * 12);
    let lumpValue = totalInvested;
    for (let month = 0; month < years * 12; month++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const monthRet = monthlyReturn + z * monthlyVol;
      lumpValue = Math.max(0, lumpValue * (1 + monthRet));
    }
    lumpSumResults.push(lumpValue);
  }
  
  dcaResults.sort((a, b) => a - b);
  lumpSumResults.sort((a, b) => a - b);
  
  const totalInvested = principal + (monthlyAmount * years * 12);
  
  // Calculate win rate properly (same-indexed comparison)
  let dcaWins = 0;
  for (let i = 0; i < simulations; i++) {
    if (dcaResults[i] > lumpSumResults[i]) dcaWins++;
  }
  
  const dcaMedian = dcaResults[Math.floor(simulations * 0.5)];
  const lumpMedian = lumpSumResults[Math.floor(simulations * 0.5)];
  
  return {
    dca: {
      median: round(dcaMedian, 0),
      p25: round(dcaResults[Math.floor(simulations * 0.25)], 0),
      p75: round(dcaResults[Math.floor(simulations * 0.75)], 0),
      winRate: round((dcaWins / simulations) * 100, 1),
      totalReturn: round(((dcaMedian / totalInvested) - 1) * 100, 1)
    },
    lumpSum: {
      median: round(lumpMedian, 0),
      p25: round(lumpSumResults[Math.floor(simulations * 0.25)], 0),
      p75: round(lumpSumResults[Math.floor(simulations * 0.75)], 0),
      totalReturn: round(((lumpMedian / totalInvested) - 1) * 100, 1)
    },
    totalInvested,
    mediaDifference: round(lumpMedian - dcaMedian, 0),
    differencePercent: round(((lumpMedian - dcaMedian) / dcaMedian) * 100, 1),
    recommendation: lumpMedian > dcaMedian
      ? `Lump sum has ${round(((lumpMedian - dcaMedian) / dcaMedian) * 100, 1)}% higher median outcome`
      : `DCA reduces risk but lowers expected value by ${round(((dcaMedian - lumpMedian) / lumpMedian) * 100, 1)}%`,
    metadata: {
      simulations,
      expectedReturn,
      volatility,
      years,
      principal,
      monthlyContribution: monthlyAmount
    }
  };
}

/**
 * Calculate panic selling impact
 * Models opportunity cost of emotional selling during market drawdowns
 * 
 * Behavioral Finance References:
 * - Kahneman & Tversky (1979): Prospect theory and loss aversion
 * - Barber & Odean (2000): Trading is hazardous to your wealth
 * - Dalbar QAIB (2023): Average investor underperforms by 3-4% annually
 * 
 * @param {number} expectedReturn - Annual expected return (%)
 * @param {number} volatility - Annualized volatility (%)
 * @param {number} years - Investment horizon
 * @returns {Object} Panic selling impact analysis
 */
export function calculatePanicSellingImpact(expectedReturn, volatility, years = 10) {
  const simulations = 3000;
  const monthlyReturn = expectedReturn / 12 / 100;
  const monthlyVol = volatility / Math.sqrt(12) / 100;
  
  const stayInvestedResults = [];
  const panicSellResults = [];
  
  for (let sim = 0; sim < simulations; sim++) {
    let value = 100;
    let panicValue = 100;
    let soldOut = false;
    let monthsInCash = 0;
    
    for (let month = 0; month < years * 12; month++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const monthRet = monthlyReturn + z * monthlyVol;
      
      // Stay invested: always apply returns
      value = Math.max(0, value * (1 + monthRet));
      
      // Panic seller: Trigger at -20% drawdown from peak
      if (!soldOut && panicValue < 80) {
        soldOut = true;
        // Lock in current value (sell at loss)
      }
      
      if (soldOut) {
        monthsInCash++;
        // Stay in cash for 6 months (miss recovery)
        if (monthsInCash > 6) {
          soldOut = false;
          monthsInCash = 0;
          // Re-enter market
        }
      }
      
      if (!soldOut) {
        panicValue = Math.max(0, panicValue * (1 + monthRet));
      }
      // If sold out, panicValue unchanged (0% return in cash)
    }
    
    stayInvestedResults.push(value);
    panicSellResults.push(panicValue);
  }
  
  stayInvestedResults.sort((a, b) => a - b);
  panicSellResults.sort((a, b) => a - b);
  
  const stayMedian = stayInvestedResults[Math.floor(simulations * 0.5)];
  const panicMedian = panicSellResults[Math.floor(simulations * 0.5)];
  
  return {
    stayInvested: round(stayMedian, 0),
    stayP25: round(stayInvestedResults[Math.floor(simulations * 0.25)], 0),
    stayP75: round(stayInvestedResults[Math.floor(simulations * 0.75)], 0),
    panicSell: round(panicMedian, 0),
    panicP25: round(panicSellResults[Math.floor(simulations * 0.25)], 0),
    panicP75: round(panicSellResults[Math.floor(simulations * 0.75)], 0),
    opportunityCost: round(stayMedian - panicMedian, 0),
    opportunityCostPercent: round(((stayMedian - panicMedian) / panicMedian) * 100, 1),
    panicTriggerRate: round((panicSellResults.filter(v => v < 80).length / simulations) * 100, 1),
    metadata: {
      simulations,
      years,
      triggerThreshold: '-20% from initial investment',
      cashHoldingPeriod: '6 months',
      expectedReturn,
      volatility
    }
  };
}

/**
 * Identify tax-loss harvesting opportunities
 * Finds positions below cost basis for potential tax benefits
 */
export function identifyTaxLossOpportunities(companies, weights, currentPrices, costBasis) {
  const opportunities = [];
  
  companies.forEach((company, i) => {
    const currentPrice = currentPrices[i];
    const basis = costBasis[i];
    
    if (currentPrice < basis) {
      const loss = (currentPrice - basis) / basis * 100;
      const position = weights[i] * 100;
      
      opportunities.push({
        symbol: company.symbol,
        name: company.name,
        currentPrice,
        costBasis: basis,
        unrealizedLoss: round(loss, 1),
        positionSize: round(position, 1),
        potentialTaxBenefit: round(Math.abs(loss) * position * 0.001, 0)
      });
    }
  });
  
  opportunities.sort((a, b) => a.unrealizedLoss - b.unrealizedLoss);
  
  return opportunities;
}

/**
 * Calculate optimal rebalancing threshold
 * Balances drift cost (tracking error) vs transaction costs
 * 
 * Academic: Plaxco & Arnott (2002) "Rebalancing a global policy benchmark"
 * 
 * @param {Array} companies - Company objects with expected_return and risk
 * @param {Array} initialWeights - Target weights (must sum to 1.0)
 * @param {number} transactionCostBps - Transaction cost in basis points
 * @returns {Object} Optimal threshold and comparison results
 */
export function calculateOptimalThreshold(companies, initialWeights, transactionCostBps = 5) {
  const thresholds = [5, 10, 15, 20, 25];
  const results = [];
  
  thresholds.forEach(threshold => {
    const simValue = simulateThresholdRebalancing(
      companies, 
      initialWeights, 
      threshold / 100,
      transactionCostBps,
      120
    );
    
    results.push({
      threshold,
      avgReturn: simValue.avgReturn,
      avgCosts: simValue.avgCosts,
      netReturn: round(simValue.avgReturn - (simValue.avgCosts / 100), 2),
      rebalanceFrequency: simValue.avgRebalances,
      avgRebalancesPerYear: round(simValue.avgRebalances / 10, 1)
    });
  });
  
  const optimal = results.reduce((best, current) => 
    current.netReturn > best.netReturn ? current : best
  );
  
  return {
    optimalThreshold: optimal.threshold,
    optimalNetReturn: optimal.netReturn,
    optimalFrequency: optimal.avgRebalancesPerYear,
    results,
    recommendation: `Rebalance when any asset drifts >${optimal.threshold}% from target weight`
  };
}

function simulateThresholdRebalancing(companies, initialWeights, threshold, costBps, months) {
  const simulations = 1000;
  const returns = [];
  const costs = [];
  const rebalances = [];
  
  for (let sim = 0; sim < simulations; sim++) {
    const values = [...initialWeights];
    let totalCost = 0;
    let rebalanceCount = 0;
    
    for (let month = 0; month < months; month++) {
      for (let i = 0; i < companies.length; i++) {
        const monthReturn = (companies[i].expected_return || 0) / 12 / 100;
        const monthVol = (companies[i].risk || 20) / Math.sqrt(12) / 100;
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        values[i] = Math.max(0, values[i] * (1 + monthReturn + z * monthVol));
      }
      
      const total = values.reduce((a, b) => a + b, 0);
      if (total === 0) continue;
      
      const currentWeights = values.map(v => v / total);
      const maxDrift = Math.max(...currentWeights.map((w, i) => Math.abs(w - initialWeights[i])));
      
      if (maxDrift > threshold) {
        const turnover = currentWeights.reduce((sum, w, i) => sum + Math.abs(w - initialWeights[i]), 0) / 2;
        totalCost += turnover * (costBps / 10000) * total;
        rebalanceCount++;
        
        for (let i = 0; i < companies.length; i++) {
          values[i] = total * initialWeights[i];
        }
      }
    }
    
    const finalValue = values.reduce((a, b) => a + b, 0);
    const totalReturn = finalValue > 0 ? ((finalValue / 1.0) - 1) * 100 : -100;
    
    returns.push(totalReturn);
    costs.push(totalCost);
    rebalances.push(rebalanceCount);
  }
  
  return {
    avgReturn: round(returns.reduce((a, b) => a + b, 0) / simulations, 2),
    avgCosts: round(costs.reduce((a, b) => a + b, 0) / simulations, 2),
    avgRebalances: round(rebalances.reduce((a, b) => a + b, 0) / simulations, 1)
  };
}
