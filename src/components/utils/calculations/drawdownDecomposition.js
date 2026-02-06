/**
 * DRAWDOWN DECOMPOSITION & LABELING
 * 
 * Separates drawdown types instead of merging into one number:
 * 1. Historical Worst-Case (actual past data)
 * 2. Statistical Tail Drawdown (95% / 99% percentile)
 * 3. Theoretical Extreme Scenario (educational only)
 * 
 * CRITICAL: Use proper labeling discipline
 * - Never call theoretical scenarios "expected" or "likely"
 * - Clearly distinguish between statistical models and extreme scenarios
 */

import { sanitizeNumber, clamp } from '@/components/utils/calculations/financialMath';

/**
 * Calculate historical worst-case drawdown
 * Based on actual historical return series (if available)
 */
export function calculateHistoricalDrawdown(historicalReturns) {
  if (!historicalReturns || historicalReturns.length < 12) {
    return null;
  }

  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;

  for (const monthlyReturn of historicalReturns) {
    cumulative *= (1 + monthlyReturn);
    peak = Math.max(peak, cumulative);
    const drawdown = (cumulative - peak) / peak;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  }

  return clamp(maxDrawdown * 100, -85, 0);
}

/**
 * Calculate statistical tail drawdown (95th and 99th percentile)
 * Uses fat-tailed distribution (Student's t, df=5)
 */
export function calculateStatisticalDrawdown(volatility, timeHorizon, expectedReturn) {
  const sigma = sanitizeNumber(volatility, 20) / 100;
  const mu = sanitizeNumber(expectedReturn, 10) / 100;
  const T = sanitizeNumber(timeHorizon, 10);

  // 95th percentile (VaR)
  // Using Student's t with df=5 for fat tails
  const z95 = 2.015; // t-distribution critical value (df=5, 95%)
  const drawdown95 = (-z95 * sigma * Math.sqrt(T) + mu * T) * 100;

  // 99th percentile (extreme tail)
  const z99 = 3.365; // t-distribution critical value (df=5, 99%)
  const drawdown99 = (-z99 * sigma * Math.sqrt(T) + mu * T) * 100;

  return {
    percentile95: clamp(drawdown95, -85, -8),
    percentile99: clamp(drawdown99, -85, -10),
    confidence: '95%',
    methodology: 'Student\'s t-distribution (df=5) with drift adjustment'
  };
}

/**
 * Calculate theoretical extreme scenario
 * CLEARLY LABELED as educational/illustrative
 */
export function calculateTheoreticalExtreme(volatility, portfolioBeta, avgCorrelation) {
  // Extreme scenario: 3-sigma event with correlation breakdown
  const sigma = sanitizeNumber(volatility, 20);
  const beta = sanitizeNumber(portfolioBeta, 1);
  const corr = sanitizeNumber(avgCorrelation, 0.5);

  // During extreme events:
  // - Correlations spike toward 1.0
  // - Beta amplification increases
  // - Liquidity dries up (additional -10 to -15%)
  
  const baseExtreme = -3 * sigma;  // 3-sigma event
  const betaAmplification = Math.abs(beta - 1) * 15;
  const correlationBreakdown = corr > 0.6 ? 10 : 5;
  const liquidityPremium = 10;

  const theoreticalWorst = baseExtreme - betaAmplification - correlationBreakdown - liquidityPremium;

  return {
    value: clamp(theoreticalWorst, -85, -15),
    label: 'Theoretical Extreme (Educational)',
    confidence: 'Illustrative Model',
    explanation: 'Combines 3-sigma move, beta amplification, correlation spike, and liquidity crisis. Probability <1% but non-zero.',
    disclaimer: 'This is a mathematical scenario, not a forecast or expected outcome'
  };
}

/**
 * Master function: Generate all three drawdown types
 */
export function decomposeDrawdowns(options) {
  const {
    volatility,
    timeHorizon,
    expectedReturn,
    portfolioBeta,
    avgCorrelation,
    historicalReturns = null
  } = options;

  const historical = historicalReturns 
    ? {
        value: calculateHistoricalDrawdown(historicalReturns),
        label: 'Historical Worst-Case',
        confidence: 'Based on actual past data',
        available: true
      }
    : {
        value: null,
        label: 'Historical Worst-Case',
        confidence: 'Insufficient data',
        available: false
      };

  const statistical = calculateStatisticalDrawdown(volatility, timeHorizon, expectedReturn);

  const theoretical = calculateTheoreticalExtreme(volatility, portfolioBeta, avgCorrelation);

  return {
    historical: {
      ...historical,
      displayPriority: 1,
      description: 'Maximum decline observed in available historical data'
    },
    statistical: {
      percentile95: {
        value: statistical.percentile95,
        label: 'Statistical Tail (95th %ile)',
        confidence: 'High',
        displayPriority: 2,
        description: 'Expected worst-case in 1-in-20 years scenario',
        methodology: statistical.methodology
      },
      percentile99: {
        value: statistical.percentile99,
        label: 'Statistical Tail (99th %ile)',
        confidence: 'Medium',
        displayPriority: 3,
        description: 'Extreme tail event (1-in-100 years)',
        methodology: statistical.methodology
      }
    },
    theoretical: {
      ...theoretical,
      displayPriority: 4,
      visualEmphasis: 'de-emphasize',
      uiGuidance: 'Display with muted styling and explicit educational disclaimer'
    },
    presentation_rules: {
      never_merge: true,
      use_clear_labels: true,
      prioritize_statistical: true,
      de_emphasize_theoretical: true,
      forbidden_language: ['expected extreme', 'likely worst-case', 'forecast'],
      required_language: ['illustrative', 'educational model', 'theoretical scenario']
    }
  };
}
