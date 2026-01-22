/**
 * Stress Testing & Tail Risk Analysis
 * 
 * Phase 2: Beyond standard Monte Carlo - extreme scenario modeling
 * 
 * Academic Foundation:
 * - VaR (Value at Risk): Jorion (2007) "Value at Risk"
 * - Tail Risk: Taleb (2007) "Black Swan Theory"
 * - Stress Testing: Basel III regulatory framework
 */

import { 
  expectedMaxDrawdown,
  round 
} from "./financialMath";

/**
 * Sector mapping for accurate labeling
 * Ensures all assets have correct sector classifications
 */
const SECTOR_MAPPINGS = {
  'GOOGL': 'Technology',
  'GOOG': 'Technology',
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'META': 'Technology',
  'AMZN': 'Consumer Discretionary',
  'TSLA': 'Consumer Discretionary',
  'NFLX': 'Communication Services',
  'NVDA': 'Technology',
  'AMD': 'Technology',
  'INTC': 'Technology',
  'LOGI': 'Technology',
  'GPRO': 'Technology',
  'SOUN': 'Technology',
  'WW': 'Consumer Discretionary',
  'BA': 'Industrials',
  'CAT': 'Industrials',
  'XOM': 'Energy',
  'CVX': 'Energy',
  'JPM': 'Finance',
  'BAC': 'Finance',
  'JNJ': 'Healthcare',
  'PFE': 'Healthcare',
  'KO': 'Consumer',
  'PEP': 'Consumer',
  'WMT': 'Consumer',
  'TGT': 'Consumer Discretionary',
  'HD': 'Consumer Discretionary',
  'DIS': 'Communication Services',
  'V': 'Finance',
  'MA': 'Finance'
};

/**
 * Known profitable companies (as of Jan 2026)
 * Based on verified TTM EPS, net income, and P/E ratio data
 */
const KNOWN_PROFITABLE = {
  'GOOGL': true,  // Alphabet - consistently profitable
  'GOOG': true,   // Alphabet Class C
  'AAPL': true,   // Apple - highly profitable
  'MSFT': true,   // Microsoft - consistently profitable
  'META': true,   // Meta - profitable
  'AMZN': true,   // Amazon - profitable
  'TSLA': true,   // Tesla - profitable (positive net income and EPS)
  'NFLX': true,   // Netflix - profitable
  'NVDA': true,   // NVIDIA - highly profitable
  'AMD': true,    // AMD - profitable
  'LOGI': true,   // Logitech - profitable
  'GPRO': true,   // GoPro - returned to profitability 2024-2026
  'WW': true,     // WW International - profitable
  'JPM': true,    // JPMorgan Chase
  'BAC': true,    // Bank of America
  'JNJ': true,    // Johnson & Johnson
  'PFE': true,    // Pfizer
  'V': true,      // Visa
  'MA': true,     // Mastercard
  'KO': true,     // Coca-Cola
  'PEP': true,    // PepsiCo
  'WMT': true,    // Walmart
  'INTC': true,   // Intel
  'HD': true,     // Home Depot
  'DIS': true,    // Disney
  // SOUN is intentionally NOT in this list - it's pre-profit/unprofitable
};

/**
 * Get correct sector for a given symbol
 */
function getCorrectSector(symbol, fallbackSector) {
  if (SECTOR_MAPPINGS[symbol]) {
    return SECTOR_MAPPINGS[symbol];
  }
  return fallbackSector && fallbackSector !== 'Unknown' ? fallbackSector : 'Technology';
}

/**
 * Determine if company is profitable with fallback to known data
 */
function isProfitableCompany(company) {
  // First check actual financial data
  const hasPositivePE = company.pe_ratio && company.pe_ratio > 0;
  const hasPositiveEPS = company.eps_ttm && company.eps_ttm > 0;
  const hasPositiveMargin = company.profit_margin && company.profit_margin > 0;
  const dataIndicatesProfitable = hasPositivePE || (hasPositiveEPS && hasPositiveMargin);
  
  // If data shows profitable, trust it
  if (dataIndicatesProfitable) return true;
  
  // Otherwise, check known profitable companies list
  if (KNOWN_PROFITABLE[company.symbol]) return true;
  
  // Default to unprofitable if no evidence
  return false;
}

/**
 * STRESS TEST SCENARIOS
 * Based on historical crashes and regulatory stress tests
 */
export const STRESS_SCENARIOS = {
  marketCrash: {
    name: "Market Crash (-40%)",
    description: "2008 Financial Crisis, COVID-19 March 2020",
    probability: "~5% per decade",
    marketDrop: -40,
    duration: 6,
    recoveryTime: 18,
    sectorImpact: {
      'Technology': -35,
      'Consumer Discretionary': -38,
      'Finance': -50,
      'Healthcare': -25,
      'Energy': -45,
      'Consumer': -30,
      'Real Estate': -40,
      'Utilities': -20,
      'Communication Services': -32,
      'Industrials': -42,
      'Materials': -44,
      'Unknown': -40
    }
  },
  
  sectorCollapse: {
    name: "Sector Collapse (-60%)",
    description: "Dot-com bubble (2000), Oil crash (2014-2016)",
    probability: "~2% per decade",
    marketDrop: -30,
    duration: 12,
    recoveryTime: 36,
    sectorImpact: {
      'Technology': -70,
      'Consumer Discretionary': -55,
      'Finance': -40,
      'Healthcare': -20,
      'Energy': -75,
      'Consumer': -25,
      'Real Estate': -50,
      'Utilities': -15,
      'Communication Services': -50,
      'Industrials': -45,
      'Materials': -60,
      'Unknown': -50
    }
  },
  
  blackSwan: {
    name: "Black Swan Event (-70%)",
    description: "1929 Great Depression, 1987 Black Monday",
    probability: "~1% per decade",
    marketDrop: -55,
    duration: 18,
    recoveryTime: 60,
    sectorImpact: {
      'Technology': -75,
      'Consumer Discretionary': -72,
      'Finance': -80,
      'Healthcare': -50,
      'Energy': -70,
      'Consumer': -60,
      'Real Estate': -75,
      'Utilities': -40,
      'Communication Services': -68,
      'Industrials': -70,
      'Materials': -73,
      'Unknown': -70
    }
  }
};

/**
 * Calculate portfolio impact under stress scenario
 */
export function calculateStressImpact(companies, weights, scenario) {
  const scenarioData = STRESS_SCENARIOS[scenario];
  if (!scenarioData) return null;
  
  // Deduplicate companies by symbol
  const uniqueAssets = new Map();
  companies.forEach((company, i) => {
    if (!uniqueAssets.has(company.symbol)) {
      uniqueAssets.set(company.symbol, { company, weight: weights[i] });
    }
  });
  
  let totalImpact = 0;
  const assetImpacts = [];
  
  Array.from(uniqueAssets.values()).forEach(({ company, weight }) => {
    const rawSector = company.sector || 'Unknown';
    const sector = getCorrectSector(company.symbol, rawSector);
    const sectorDrop = scenarioData.sectorImpact[sector] || scenarioData.marketDrop;
    
    // Beta-based adjustment (more precise scaling)
    const beta = company.beta || 1.0;
    const betaAdjustment = (Math.abs(beta) - 1.0) * 8; // ±8% per 0.1 beta deviation
    
    // Market cap tier adjustment (based on actual market cap data)
    let marketCapAdjustment = 0;
    let marketCapTier = 'unknown';
    const marketCap = company.market_cap || '';
    
    if (marketCap.includes('T')) {
      const capValue = parseFloat(marketCap);
      marketCapAdjustment = +12; // Mega-cap (>$1T) - highly resilient
      marketCapTier = 'mega-cap';
    } else if (marketCap.includes('B')) {
      const capValue = parseFloat(marketCap);
      if (capValue >= 200) {
        marketCapAdjustment = +10; // Mega-cap ($200B+)
        marketCapTier = 'mega-cap';
      } else if (capValue >= 50) {
        marketCapAdjustment = +8; // Large-cap ($50B-$200B)
        marketCapTier = 'large-cap';
      } else if (capValue >= 10) {
        marketCapAdjustment = +3; // Large-cap ($10B-$50B)
        marketCapTier = 'large-cap';
      } else if (capValue >= 2) {
        marketCapAdjustment = -3; // Mid-cap ($2B-$10B)
        marketCapTier = 'mid-cap';
      } else {
        marketCapAdjustment = -8; // Small-cap ($300M-$2B)
        marketCapTier = 'small-cap';
      }
    } else if (marketCap.includes('M')) {
      const capValue = parseFloat(marketCap);
      if (capValue >= 300) {
        marketCapAdjustment = -10; // Small-cap ($300M-$2B)
        marketCapTier = 'small-cap';
      } else {
        marketCapAdjustment = -18; // Micro-cap (<$300M)
        marketCapTier = 'micro-cap';
      }
    }
    
    // Profitability assessment with fallback to known profitable companies
    const isProfitable = isProfitableCompany(company);
    
    // Stronger profitability bonus for large profitable companies
    let profitabilityAdjustment = 0;
    if (isProfitable) {
      profitabilityAdjustment = marketCapTier === 'mega-cap' || marketCapTier === 'large-cap' ? +8 : +5;
    } else {
      profitabilityAdjustment = marketCapTier === 'micro-cap' || marketCapTier === 'small-cap' ? -15 : -10;
    }
    
    // Calculate final asset drop
    let assetDrop = sectorDrop - betaAdjustment + marketCapAdjustment + profitabilityAdjustment;
    
    // Apply realistic bounds based on historical crash data
    // Profitable large-caps: typically -30% to -60% in black swan
    // Speculative small-caps: can reach -70% to -95%
    if (isProfitable && (marketCapTier === 'mega-cap' || marketCapTier === 'large-cap')) {
      assetDrop = Math.max(-65, Math.min(-15, assetDrop));
    } else if (isProfitable && marketCapTier === 'mid-cap') {
      assetDrop = Math.max(-75, Math.min(-20, assetDrop));
    } else {
      assetDrop = Math.max(-95, Math.min(-25, assetDrop));
    }
    
    const contributionToPortfolioDecline = weight * assetDrop;
    totalImpact += contributionToPortfolioDecline;
    
    // Determine risk flag
    let riskFlag = 'low';
    let riskColor = 'emerald';
    if (assetDrop < -70) {
      riskFlag = 'extreme';
      riskColor = 'rose';
    } else if (assetDrop < -50) {
      riskFlag = 'high';
      riskColor = 'orange';
    } else if (assetDrop < -35) {
      riskFlag = 'moderate';
      riskColor = 'amber';
    }
    
    assetImpacts.push({
      symbol: company.symbol,
      name: company.name,
      sector,
      weight: weight * 100,
      drop: round(assetDrop, 1),
      contribution: round(contributionToPortfolioDecline, 1),
      beta: round(beta, 2),
      marketCap: company.market_cap || 'N/A',
      marketCapTier,
      isProfitable,
      riskFlag,
      riskColor
    });
  });
  
  assetImpacts.sort((a, b) => a.drop - b.drop);
  
  // Calculate weighted recovery time based on asset composition
  const avgBeta = companies.reduce((sum, c, i) => sum + (c.beta || 1.0) * weights[i], 0);
  const speculativeWeight = companies.reduce((sum, c, i) => {
    const isSpec = !isProfitableCompany(c) || (c.market_cap && c.market_cap.includes('M') && parseFloat(c.market_cap) < 300);
    return sum + (isSpec ? weights[i] : 0);
  }, 0);
  
  // Adjust recovery time based on portfolio characteristics
  const baseRecovery = scenarioData.recoveryTime;
  const betaFactor = 1 + (avgBeta - 1.0) * 0.15;
  const speculativeFactor = 1 + speculativeWeight * 0.25;
  const adjustedRecovery = Math.round(baseRecovery * betaFactor * speculativeFactor);
  
  return {
    scenario: scenarioData.name,
    description: scenarioData.description,
    probability: scenarioData.probability,
    portfolioImpact: round(totalImpact, 1),
    duration: scenarioData.duration,
    recoveryTime: adjustedRecovery,
    assetImpacts,
    narrative: generateNarrative(scenarioData, totalImpact, assetImpacts)
  };
}

function generateNarrative(scenario, portfolioImpact, assetImpacts) {
  const worstAsset = assetImpacts[0];
  const bestAsset = assetImpacts[assetImpacts.length - 1];
  
  const severity = Math.abs(portfolioImpact);
  let tone = severity > 60 ? 'severe' : severity > 40 ? 'significant' : 'moderate';
  
  return `In a ${scenario.name.toLowerCase()} scenario, your portfolio would experience a ${tone} decline of approximately ${Math.abs(portfolioImpact).toFixed(1)}%. ${worstAsset.symbol} (${worstAsset.sector}) would be hardest hit with a ${Math.abs(worstAsset.drop).toFixed(1)}% decline, while ${bestAsset.symbol} would show relative resilience at ${Math.abs(bestAsset.drop).toFixed(1)}%. The recovery period is estimated at ${scenario.recoveryTime} months, assuming normal market conditions return.`;
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

function tailProbability(z) {
  const normalCDF = 0.5 * (1 + erf(z / Math.sqrt(2)));
  const tailFactor = 1 + Math.abs(z) * 0.15;
  const adjustedProb = Math.min(0.5, normalCDF * tailFactor);
  return Math.max(0.001, adjustedProb);
}

export function calculateCrashProbability(portfolioRisk, targetReturn) {
  const thresholds = { mild: -20, moderate: -35, severe: -50 };
  
  const zScores = {
    mild: (thresholds.mild - targetReturn) / portfolioRisk,
    moderate: (thresholds.moderate - targetReturn) / portfolioRisk,
    severe: (thresholds.severe - targetReturn) / portfolioRisk
  };
  
  const probabilities = {
    mild: tailProbability(zScores.mild),
    moderate: tailProbability(zScores.moderate),
    severe: tailProbability(zScores.severe)
  };
  
  return {
    annualProbabilities: {
      mild: round(probabilities.mild * 100, 2),
      moderate: round(probabilities.moderate * 100, 2),
      severe: round(probabilities.severe * 100, 2)
    },
    tenYearProbabilities: {
      mild: round((1 - Math.pow(1 - probabilities.mild, 10)) * 100, 2),
      moderate: round((1 - Math.pow(1 - probabilities.moderate, 10)) * 100, 2),
      severe: round((1 - Math.pow(1 - probabilities.severe, 10)) * 100, 2)
    }
  };
}

export function calculateEnhancedDrawdown(portfolioRisk, timeHorizon, expectedReturn) {
  const sigma = portfolioRisk / 100;
  const mu = expectedReturn / 100;
  const T = timeHorizon;
  
  const dd95 = expectedMaxDrawdown(portfolioRisk, T, expectedReturn);
  
  const baseDrawdown99 = -2.33 * sigma * Math.sqrt(T);
  const driftAdjustment99 = mu * T;
  const dd99 = (baseDrawdown99 + driftAdjustment99) * 100;
  
  return {
    standard: round(dd95, 0),
    tailRisk: round(Math.max(-99, dd99), 0),
    delta: round(dd99 - dd95, 0)
  };
}

export function estimateRecoveryTime(drawdownPercent, expectedReturn, volatility) {
  const simulations = 1000;
  const monthlyReturn = expectedReturn / 12 / 100;
  const monthlyVol = volatility / Math.sqrt(12) / 100;
  
  const recoveryTimes = [];
  
  for (let sim = 0; sim < simulations; sim++) {
    let value = 100 * (1 + drawdownPercent / 100);
    let months = 0;
    const maxMonths = 120;
    
    while (value < 100 && months < maxMonths) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      const reversionFactor = value < 80 ? 1.2 : value < 90 ? 1.1 : 1.0;
      const monthReturn = monthlyReturn * reversionFactor + z * monthlyVol;
      
      value *= (1 + monthReturn);
      months++;
    }
    
    if (months < maxMonths) {
      recoveryTimes.push(months);
    }
  }
  
  if (recoveryTimes.length === 0) return null;
  
  recoveryTimes.sort((a, b) => a - b);
  const median = recoveryTimes[Math.floor(recoveryTimes.length * 0.5)];
  const p75 = recoveryTimes[Math.floor(recoveryTimes.length * 0.75)];
  const p90 = recoveryTimes[Math.floor(recoveryTimes.length * 0.90)];
  
  return {
    median: round(median / 12, 1),
    p75: round(p75 / 12, 1),
    p90: round(p90 / 12, 1)
  };
}

export function analyzeSectorVulnerability(companies, weights) {
  const sectorExposure = {};
  const betaExposure = { defensive: 0, neutral: 0, aggressive: 0 };
  
  companies.forEach((company, i) => {
    const weight = weights[i];
    const sector = company.sector || 'Unknown';
    const beta = company.beta || 1.0;
    const correctSector = getCorrectSector(company.symbol, sector);
    
    if (!sectorExposure[correctSector]) {
      sectorExposure[correctSector] = {
        allocation: 0,
        avgBeta: 0,
        count: 0,
        speculativeCount: 0
      };
    }
    
    sectorExposure[correctSector].allocation += weight * 100;
    sectorExposure[correctSector].avgBeta += beta * weight;
    sectorExposure[correctSector].count++;
    
    const isSpeculative = !isProfitableCompany(company) || 
                          (company.market_cap && company.market_cap.includes('M') && parseFloat(company.market_cap) < 300);
    if (isSpeculative) {
      sectorExposure[correctSector].speculativeCount++;
    }
    
    if (Math.abs(beta) < 0.8) {
      betaExposure.defensive += weight * 100;
    } else if (Math.abs(beta) > 1.2) {
      betaExposure.aggressive += weight * 100;
    } else {
      betaExposure.neutral += weight * 100;
    }
  });
  
  Object.keys(sectorExposure).forEach(sector => {
    const totalWeight = sectorExposure[sector].allocation / 100;
    if (totalWeight > 0) {
      sectorExposure[sector].avgBeta /= totalWeight;
    }
  });
  
  const sectorAllocations = Object.values(sectorExposure).map(s => s.allocation / 100);
  const hhi = sectorAllocations.reduce((sum, w) => sum + w * w, 0);
  
  return {
    sectorExposure,
    betaExposure: {
      defensive: round(betaExposure.defensive, 1),
      neutral: round(betaExposure.neutral, 1),
      aggressive: round(betaExposure.aggressive, 1)
    },
    concentrationRisk: round(hhi * 100, 0),
    dominantSector: Object.keys(sectorExposure).reduce((a, b) => 
      sectorExposure[a].allocation > sectorExposure[b].allocation ? a : b
    )
  };
}

/**
 * Calculate diversification benefit from adding broad market ETF (SPY)
 * 
 * CRITICAL: This measures concentration risk reduction, NOT systemic crash protection
 * 
 * Context:
 * - SPY reduces single-stock and sector-specific risk
 * - SPY does NOT protect against systemic market crashes (beta ~1.0 by definition)
 * - In broad market crashes, SPY declines with the market
 * - Benefit arises from reducing concentration in specific stocks/sectors
 * 
 * @param {Array} companies - Current portfolio companies
 * @param {Array} weights - Current portfolio weights
 * @param {string} scenario - Stress scenario
 * @param {Object} diversifier - Diversifier config (symbol, allocation)
 * @returns {Object} Diversification impact analysis
 */
export function calculateDiversificationBenefit(companies, weights, scenario, diversifier = { symbol: 'SPY', allocation: 0.20 }) {
  const currentResult = calculateStressImpact(companies, weights, scenario);
  const currentImpact = currentResult.portfolioImpact;
  
  // Adjust existing portfolio to 80% (80% of current)
  const adjustedWeights = weights.map(w => w * (1 - diversifier.allocation));
  
  // SPY stress scenario drops (realistic for broad market ETF)
  // In market-wide crashes, SPY offers minimal protection (beta ~1.0)
  // Protection comes from reducing concentrated positions
  const diversifierDrop = scenario === 'blackSwan' ? -55 :    // SPY also crashes hard
                          scenario === 'sectorCollapse' ? -30 : // Less if sector-specific
                          scenario === 'marketCrash' ? -40 :    // ~Market average
                          -40;
  
  // Calculate new portfolio impact with 80% current + 20% SPY
  const adjustedImpact = adjustedWeights.reduce((sum, w, i) => {
    const sector = getCorrectSector(companies[i].symbol, companies[i].sector || 'Unknown');
    const sectorDrop = STRESS_SCENARIOS[scenario].sectorImpact[sector] || -40;
    
    // Apply same beta/profitability logic as main calculation
    const beta = companies[i].beta || 1.0;
    const betaAdjustment = (Math.abs(beta) - 1.0) * 8;
    
    const isProfitable = isProfitableCompany(companies[i]);
    const marketCap = companies[i].market_cap || '';
    let marketCapTier = 'unknown';
    let marketCapAdjustment = 0;
    
    if (marketCap.includes('T') || (marketCap.includes('B') && parseFloat(marketCap) >= 200)) {
      marketCapAdjustment = +10;
      marketCapTier = 'mega-cap';
    } else if (marketCap.includes('B') && parseFloat(marketCap) >= 50) {
      marketCapAdjustment = +8;
      marketCapTier = 'large-cap';
    } else if (marketCap.includes('B') && parseFloat(marketCap) >= 10) {
      marketCapAdjustment = +3;
      marketCapTier = 'large-cap';
    } else if (marketCap.includes('B') && parseFloat(marketCap) >= 2) {
      marketCapAdjustment = -3;
      marketCapTier = 'mid-cap';
    } else {
      marketCapAdjustment = -8;
      marketCapTier = 'small-cap';
    }
    
    const profitabilityAdjustment = isProfitable ? 
      (marketCapTier === 'mega-cap' || marketCapTier === 'large-cap' ? +8 : +5) :
      (marketCapTier === 'micro-cap' || marketCapTier === 'small-cap' ? -15 : -10);
    
    let assetDrop = sectorDrop - betaAdjustment + marketCapAdjustment + profitabilityAdjustment;
    
    // Apply realistic bounds
    if (isProfitable && (marketCapTier === 'mega-cap' || marketCapTier === 'large-cap')) {
      assetDrop = Math.max(-65, Math.min(-15, assetDrop));
    } else if (isProfitable && marketCapTier === 'mid-cap') {
      assetDrop = Math.max(-75, Math.min(-20, assetDrop));
    } else {
      assetDrop = Math.max(-95, Math.min(-25, assetDrop));
    }
    
    return sum + w * assetDrop;
  }, 0) + diversifier.allocation * diversifierDrop;
  
  // Calculate change (negative improvement = worse outcome)
  const change = adjustedImpact - currentImpact;
  const isImprovement = change > 0; // Less negative = improvement
  
  // Determine scenario type for educational messaging
  const isSystemicCrash = scenario === 'marketCrash' || scenario === 'blackSwan';
  const isSectorSpecific = scenario === 'sectorCollapse';
  
  return {
    currentImpact: round(currentImpact, 1),
    withDiversifier: round(adjustedImpact, 1),
    change: round(change, 1),
    changePercent: round((change / Math.abs(currentImpact)) * 100, 1),
    isImprovement,
    diversifier: {
      symbol: diversifier.symbol,
      allocation: round(diversifier.allocation * 100, 0)
    },
    interpretation: isSystemicCrash
      ? (isImprovement 
          ? `Modest improvement from reducing concentration. SPY still declines in market crashes (β≈1.0).`
          : `Limited benefit in systemic crashes. SPY declines with market (β≈1.0). Main benefit is concentration reduction.`)
      : (isImprovement
          ? `Meaningful improvement from sector diversification. SPY reduces sector-specific risk.`
          : `Minimal benefit. Portfolio may already be well-diversified or SPY has similar exposures.`),
    recommendation: isImprovement
      ? `Adding ${round(diversifier.allocation * 100, 0)}% SPY ${isSystemicCrash ? 'reduces concentration but offers limited crash protection' : 'improves sector diversification'}.`
      : `Adding ${round(diversifier.allocation * 100, 0)}% SPY ${Math.abs(change) < 2 ? 'has minimal impact' : 'may worsen outcomes'} in this scenario.`
  };
}
