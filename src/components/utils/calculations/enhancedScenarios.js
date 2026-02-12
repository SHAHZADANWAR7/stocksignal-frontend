/**
 * Enhanced Scenario Analysis
 * Realistic stress testing with compound shocks and regime-based correlations
 */

import { 
  portfolioRisk, 
  portfolioExpectedReturn,
  expectedMaxDrawdown,
  RISK_FREE_RATE 
} from "./financialMath";

/**
 * Get regime-adjusted correlations based on VIX level
 * During stress, correlations increase (diversification fails)
 */
export function getRegimeAdjustedCorrelations(baseCorrelationMatrix, vixLevel = 20) {
  const n = baseCorrelationMatrix.length;
  const adjustedMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Correlation multiplier based on VIX regime
  let correlationMultiplier = 1.0;
  if (vixLevel > 30) correlationMultiplier = 2.0; // Extreme stress (diversification breakdown)
  else if (vixLevel > 25) correlationMultiplier = 1.5; // High stress
  else if (vixLevel > 20) correlationMultiplier = 1.2; // Moderate stress
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        adjustedMatrix[i][j] = 1.0;
      } else {
        // Increase off-diagonal correlations during stress, cap at 0.95
        const adjusted = Math.min(0.95, baseCorrelationMatrix[i][j] * correlationMultiplier);
        adjustedMatrix[i][j] = adjusted;
      }
    }
  }
  
  return adjustedMatrix;
}

/**
 * Calculate compound shock impact
 * Models simultaneous market crash + sector collapse
 */
export function calculateCompoundShock(companies, weights, baseReturn, baseRisk) {
  // Scenario: Market crash (-35%) + Sector collapse (-20% additional)
  const marketShock = -35;
  const sectorShock = -20;
  
  // Assets with high beta get hit harder in market crashes
  const assetImpacts = companies.map((c, idx) => {
    const beta = c.beta || 1.0;
    const marketImpact = marketShock * Math.abs(beta);
    
    // Check if asset is in a vulnerable sector
    const vulnerableSectors = ['Technology', 'Consumer Discretionary', 'Communication Services'];
    const isVulnerable = vulnerableSectors.includes(c.sector);
    const totalImpact = marketImpact + (isVulnerable ? sectorShock : sectorShock * 0.3);
    
    return {
      symbol: c.symbol,
      weight: weights[idx],
      impact: totalImpact,
      isSectorVulnerable: isVulnerable
    };
  });
  
  // Portfolio-level compound shock
  const portfolioImpact = assetImpacts.reduce((sum, asset) => 
    sum + (asset.weight * asset.impact), 0
  );
  
  // Recovery time estimate (deeper crashes take longer)
  const baseRecovery = 18; // months
  const severityMultiplier = Math.abs(portfolioImpact) / 35;
  const recoveryMonths = Math.round(baseRecovery * severityMultiplier);
  
  return {
    totalImpact: portfolioImpact,
    assetImpacts,
    recoveryMonths,
    scenarioDescription: 'Market crash (-35%) + concentrated sector collapse (-20%)'
  };
}

/**
 * Calculate diversification benefit under stress
 * Shows how adding low-correlation assets improves tail-risk
 */
export function calculateDiversificationBenefit(companies, weights, diversifierSymbol, diversifierAllocation) {
  // Define diversifier characteristics
  const diversifiers = {
    'SPY': { correlation: 0.15, tailProtection: 0.8, description: 'Broad market reduces idiosyncratic risk' },
    'BND': { correlation: -0.10, tailProtection: 1.5, description: 'Bonds provide crisis hedge' },
    'GLD': { correlation: 0.05, tailProtection: 1.2, description: 'Gold shows low equity correlation' },
    'QQQ': { correlation: 0.25, tailProtection: 0.6, description: 'Tech diversification' },
    'VNQ': { correlation: 0.20, tailProtection: 0.7, description: 'Real estate diversification' }
  };
  
  const diversifier = diversifiers[diversifierSymbol] || diversifiers['SPY'];
  const allocation = diversifierAllocation / 100;
  
  // Current average correlation
  const currentCorrelation = weights.reduce((sum, wi, i) => {
    return sum + weights.slice(i + 1).reduce((innerSum, wj, jOffset) => {
      const j = i + 1 + jOffset;
      // Estimate correlation (simplified)
      const sameSector = companies[i].sector === companies[j].sector;
      const baseCorr = sameSector ? 0.65 : 0.45;
      return innerSum + (wi * wj * baseCorr);
    }, 0);
  }, 0);
  
  // New correlation with diversifier
  const newWeights = [...weights.map(w => w * (1 - allocation)), allocation];
  const newCorrelation = currentCorrelation * (1 - allocation) + diversifier.correlation * allocation;
  
  // Tail-risk reduction
  const currentTailRisk = Math.abs(expectedMaxDrawdown(
    companies.reduce((sum, c, i) => sum + weights[i] * c.risk, 0),
    10,
    companies.reduce((sum, c, i) => sum + weights[i] * c.expected_return, 0)
  ));
  
  const tailRiskReduction = diversifier.tailProtection * allocation * 100;
  const newTailRisk = Math.max(5, currentTailRisk - tailRiskReduction);
  
  return {
    correlationReduction: (currentCorrelation - newCorrelation) * 100,
    tailRiskReduction,
    newTailRisk,
    newCorrelation,
    explanation: diversifier.description
  };
}

/**
 * Generate scenario path with realistic crisis dynamics
 * Uses asymmetric volatility (crashes faster than recoveries)
 */
export function generateCrisisScenario(baseValue, crashPercent, crashMonths, recoveryMonths, totalMonths) {
  const path = [];
  const crashEnd = crashMonths;
  const recoveryEnd = crashMonths + recoveryMonths;
  
  let currentValue = baseValue;
  
  for (let month = 0; month <= totalMonths; month++) {
    if (month === 0) {
      path.push({ month, value: baseValue, phase: 'normal' });
    } else if (month <= crashEnd) {
      // Crash phase: exponential decay (fast drop)
      const crashProgress = month / crashEnd;
      const exponentialDecay = 1 - Math.pow(crashProgress, 0.7); // Accelerating crash
      currentValue = baseValue * (1 - (crashPercent / 100) * exponentialDecay);
      path.push({ month, value: Math.round(currentValue), phase: 'crash' });
    } else if (month <= recoveryEnd) {
      // Recovery phase: logarithmic growth (slow recovery)
      const recoveryProgress = (month - crashEnd) / recoveryMonths;
      const logarithmicRecovery = Math.log(1 + recoveryProgress * (Math.E - 1)) / 1;
      const crashedValue = baseValue * (1 - crashPercent / 100);
      currentValue = crashedValue + (baseValue - crashedValue) * logarithmicRecovery;
      path.push({ month, value: Math.round(currentValue), phase: 'recovery' });
    } else {
      // Normal phase: resume expected growth
      const monthsSinceRecovery = month - recoveryEnd;
      const monthlyGrowth = 0.007; // ~8.7% annual
      currentValue = baseValue * Math.pow(1 + monthlyGrowth, monthsSinceRecovery);
      path.push({ month, value: Math.round(currentValue), phase: 'normal' });
    }
  }
  
  return path;
}
