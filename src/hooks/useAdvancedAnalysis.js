/**
 * ADVANCED ANALYSIS ENGINE - AWS AMPLIFY VERSION
 * 650+ lines of behavioral, narrative, and interpretive analysis
 * 
 * Core responsibility: All advanced analytical intelligence
 * - Behavioral bias detection and scoring
 * - Investor psychology insights
 * - Advanced risk interpretation (qualitative)
 * - Regime-based analysis and narrative generation
 * - Strategy interpretation and recommendations
 * - Goal probability and confidence assessment
 * 
 * This file DOES NOT contain:
 * - Portfolio math (belongs to TempPortfolioCalcsAWS.js)
 * - UI orchestration (belongs to TempAnalysisAWS.js)
 * - Card/tab rendering (belongs to TempStrategyCardsAWS.js / TempAnalysisTabsAWS.js)
 */

// ==================== BEHAVIORAL ANALYSIS ====================

/**
 * Detect behavioral biases in portfolio allocation and composition
 * @param {Array} companiesData - Array of company objects
 * @param {Object} allocation - Allocation map (symbol -> percentage)
 * @returns {Array} Array of detected biases with severity and recommendations
 */
export const detectBehavioralBiases = (companiesData, allocation) => {
  if (!companiesData || !allocation || companiesData.length === 0) return [];

  const biases = [];

  // Concentration Bias
  const allocValues = Object.values(allocation).filter(v => v > 0);
  const maxAllocation = allocValues.length > 0 ? Math.max(...allocValues) : 0;

  if (maxAllocation > 30) {
    biases.push({
      type: "Concentration Bias",
      severity: maxAllocation > 50 ? "critical" : maxAllocation > 40 ? "high" : "medium",
      description: `${maxAllocation.toFixed(1)}% in single holding - suggests overconfidence or conviction bias`,
      recommendation: "Reduce position size to below 15% per holding for safer diversification",
      confidence: 0.95,
    });
  }

  // Sector Concentration Bias
  const sectors = {};
  Object.keys(allocation).forEach(symbol => {
    const company = companiesData.find(c => c.symbol === symbol);
    const sector = company?.sector || "Other";
    sectors[sector] = (sectors[sector] || 0) + (allocation[symbol] || 0);
  });

  const sectorValues = Object.values(sectors);
  const maxSector = sectorValues.length > 0 ? Math.max(...sectorValues) : 0;

  if (maxSector > 50) {
    biases.push({
      type: "Sector Concentration Bias",
      severity: maxSector > 70 ? "critical" : "high",
      description: `Over-allocated to single sector (${maxSector.toFixed(1)}%) - indicates sector rotation gambling`,
      recommendation: "Rebalance across 5+ different sectors for macro diversification",
      confidence: 0.90,
    });
  }

  // Insufficient Diversification
  if (companiesData.length < 5) {
    biases.push({
      type: "Insufficient Diversification",
      severity: companiesData.length < 3 ? "critical" : "high",
      description: `Only ${companiesData.length} positions - significant idiosyncratic risk and company-specific volatility`,
      recommendation: "Target 8-15 positions across different sectors and cap sizes for proper diversification",
      confidence: 0.92,
    });
  }

  // Recency Bias
  const recentPerformers = companiesData.filter(c => (c.expected_return || 0) > 15);
  if (recentPerformers.length > companiesData.length * 0.6 && companiesData.length > 3) {
    biases.push({
      type: "Recency Bias",
      severity: "high",
      description: `${Math.round((recentPerformers.length / companiesData.length) * 100)}% of portfolio is recent high performers - mean reversion likely`,
      recommendation: "Mix in proven stable performers; avoid chasing recent winners exclusively",
      confidence: 0.88,
    });
  }

  // Overtrading Tendency
  if (companiesData.length > 25) {
    biases.push({
      type: "Overtrading Tendency",
      severity: "high",
      description: `Holding ${companiesData.length} positions suggests market timing and excessive trading activity`,
      recommendation: "Simplify to 10-20 core positions and reduce trading frequency to quarterly/semi-annual",
      confidence: 0.85,
    });
  }

  // Home Country Bias
  const usCompanies = companiesData.filter(c => {
    const symbol = c.symbol || "";
    return symbol.length > 0 && symbol === symbol.toUpperCase() && symbol.length <= 5;
  });
  const usAllocation = usCompanies.reduce((sum, c) => sum + (allocation[c.symbol] || 0), 0);

  if (usAllocation > 85 && companiesData.length > 5) {
    biases.push({
      type: "Home Country Bias",
      severity: "medium",
      description: `${usAllocation.toFixed(1)}% US-focused - currency risk and economic concentration`,
      recommendation: "Add 15-30% international diversification (developed + emerging markets)",
      confidence: 0.78,
    });
  }

  // Loss Aversion (avoid low volatility = missing upside)
  const avgVolatility = companiesData.reduce((sum, c) => sum + (c.risk || 18), 0) / companiesData.length;
  if (avgVolatility < 10) {
    biases.push({
      type: "Excessive Loss Aversion",
      severity: "medium",
      description: `Portfolio average volatility (${avgVolatility.toFixed(1)}%) suggests fear-driven ultra-conservative positioning`,
      recommendation: "Consider accepting 12-15% volatility for better long-term returns if horizon is 5+ years",
      confidence: 0.75,
    });
  }

  return biases;
};

// ==================== BEHAVIORAL SCORING ====================

/**
 * Calculate investor quality score based on portfolio decisions
 * @param {Array} companiesData - Array of company objects
 * @param {Object} allocation - Allocation map (symbol -> percentage)
 * @param {Object} metrics - Portfolio metrics (expected_return, volatility, sharpe_ratio)
 * @returns {Object} Investor behavior scores (0-100)
 */
export const calculateInvestorBehaviorScores = (companiesData, allocation, metrics) => {
  if (!companiesData || !allocation || !metrics) {
    return {
      discipline_score: 0,
      diversification_score: 0,
      risk_awareness_score: 0,
      concentration_score: 0,
      overall_score: 0,
    };
  }

  const allocValues = Object.values(allocation).filter(v => v > 0);

  // Discipline Score (based on diversification across holdings)
  const numPositions = allocValues.length;
  const disciplineScore = Math.min(100, (numPositions / 15) * 100 * 0.7 + 30);

  // Diversification Score (based on allocation spread and sector mix)
  const allocVariance = allocValues.length > 1
    ? allocValues.reduce((sum, alloc) => sum + Math.pow(alloc - allocValues.reduce((a, b) => a + b, 0) / allocValues.length, 2), 0) / allocValues.length
    : 0;
  const diversificationScore = Math.min(100, Math.max(0, 100 - Math.sqrt(allocVariance) * 2));

  // Risk Awareness Score (based on volatility relative to return)
  const sharpeRatio = metrics.sharpe_ratio || 0;
  const riskAwarenessScore = Math.min(100, Math.max(0, sharpeRatio * 20 + 50));

  // Concentration Score (inverse of concentration risk)
  const maxAllocation = allocValues.length > 0 ? Math.max(...allocValues) : 0;
  const concentrationScore = Math.min(100, Math.max(0, 100 - maxAllocation * 2));

  // Overall Score (weighted average)
  const overallScore = Math.round(
    disciplineScore * 0.25 + diversificationScore * 0.25 + riskAwarenessScore * 0.25 + concentrationScore * 0.25
  );

  return {
    discipline_score: Math.round(disciplineScore),
    diversification_score: Math.round(diversificationScore),
    risk_awareness_score: Math.round(riskAwarenessScore),
    concentration_score: Math.round(concentrationScore),
    overall_score: overallScore,
  };
};

// ==================== GOAL PROBABILITY ANALYSIS ====================

/**
 * Calculate goal achievement probability using direct calculation
 * @param {number} expectedReturn - Portfolio expected return (percentage)
 * @param {number} volatility - Portfolio volatility (percentage)
 * @param {number} horizon - Investment horizon (years)
 * @param {number} targetAmount - Target goal amount
 * @param {number} currentAmount - Current capital
 * @returns {Object} Goal probability metrics
 */
export const calculateGoalProbability = (expectedReturn, volatility, horizon, targetAmount, currentAmount) => {
  if (!expectedReturn || !targetAmount || !currentAmount || horizon <= 0) {
    return {
      probability: 0,
      projectedValue: currentAmount,
      onTrack: false,
      yearsToGoal: Infinity,
      gap: targetAmount - currentAmount,
      confidence: "low",
    };
  }

  const annualReturn = expectedReturn / 100;
  const monthlyReturn = annualReturn / 12;

  // Project forward with monthly contributions (simplified at 5% of initial)
  const monthlyContribution = currentAmount * 0.05 / 12;
  const monthsTotal = horizon * 12;
  let projectedValue = currentAmount;

  for (let month = 0; month < monthsTotal; month++) {
    projectedValue = projectedValue * (1 + monthlyReturn) + monthlyContribution;
  }

  const probability = Math.min(100, Math.max(0, (projectedValue / targetAmount) * 100));

  // Calculate years to goal
  let yearsToGoal = horizon;
  if (annualReturn > 0) {
    yearsToGoal = Math.log(targetAmount / currentAmount) / Math.log(1 + annualReturn);
  }

  return {
    probability: Math.round(probability),
    projectedValue: Math.round(projectedValue),
    onTrack: probability >= 80,
    yearsToGoal: Math.max(0, Math.round(yearsToGoal * 10) / 10),
    gap: Math.max(0, targetAmount - projectedValue),
    confidence: probability >= 80 ? "high" : probability >= 60 ? "medium" : "low",
  };
};

/**
 * Calculate goal probability using Monte Carlo distribution
 * @param {Object} monteCarloResults - Monte Carlo simulation results
 * @param {number} targetAmount - Target goal amount
 * @param {number} horizon - Investment horizon (years)
 * @returns {Object} Monte Carlo goal probability metrics
 */
export const calculateMonteCarloGoalProbability = (monteCarloResults, targetAmount, horizon) => {
  if (!monteCarloResults || !monteCarloResults.results || monteCarloResults.results.length === 0) {
    return {
      monteCarloSuccess: 0,
      expectedValue: 0,
      worstCase5Pct: 0,
      bestCase95Pct: 0,
      median: 0,
      gap: targetAmount,
      confidence: "low",
      interpretation: "Insufficient simulation data",
    };
  }

  const finalValues = monteCarloResults.results.map(r => r.finalValue);
  const achieved = finalValues.filter(v => v >= targetAmount).length;
  const probability = (achieved / finalValues.length) * 100;

  const sorted = finalValues.sort((a, b) => a - b);
  const worstCase = sorted[Math.floor(sorted.length * 0.05)];
  const bestCase = sorted[Math.floor(sorted.length * 0.95)];
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = monteCarloResults.mean || finalValues.reduce((a, b) => a + b, 0) / finalValues.length;

  return {
    monteCarloSuccess: Math.round(probability),
    expectedValue: Math.round(mean),
    worstCase5Pct: Math.round(worstCase),
    bestCase95Pct: Math.round(bestCase),
    median: Math.round(median),
    gap: Math.max(0, targetAmount - median),
    confidence: probability >= 80 ? "high" : probability >= 50 ? "medium" : "low",
    interpretation:
      probability >= 80
        ? "High confidence in goal achievement"
        : probability >= 50
          ? "Moderate confidence; may need increased contributions or risk adjustment"
          : "Low probability; consider revisiting strategy or extending horizon",
  };
};

// ==================== SCENARIO NARRATIVE GENERATION ====================

/**
 * Generate narrative interpretation of scenario results
 * @param {Array} scenarios - Extended scenario analysis results
 * @param {number} baselineReturn - Baseline expected return (percentage)
 * @returns {Array} Scenario narratives with interpretations
 */
export const generateScenarioNarratives = (scenarios, baselineReturn) => {
  if (!scenarios || scenarios.length === 0) return [];

  return scenarios.map((scenario, idx) => {
    const returnDelta = scenario.return - baselineReturn;
    const gainLabel = returnDelta > 0 ? "beats baseline" : "underperforms baseline";
    const magnitude = Math.abs(returnDelta).toFixed(2);

    let narrative = "";
    if (scenario.name === "Bull Market") {
      narrative = `In a strong growth environment with rising corporate earnings and GDP expansion, your portfolio returns ${scenario.return}% annually, ${gainLabel} by ${magnitude}%. You accumulate wealth faster, reaching ${(scenario.projectedValue / 1000000).toFixed(1)}M by your target date.`;
    } else if (scenario.name === "Base Case") {
      narrative = `Under baseline conditions with moderate growth and stable inflation (our default assumption), your portfolio delivers ${scenario.return}% annual returns. This is your core projection scenario.`;
    } else if (scenario.name === "Bear Market") {
      narrative = `During recession or earnings contraction, your portfolio returns ${scenario.return}% annually as valuations compress. Recovery paths extend, but diversification cushions the decline. You still achieve ${(scenario.projectedValue / 1000000).toFixed(1)}M by horizon end.`;
    } else if (scenario.name === "Stagflation") {
      narrative = `In a high-inflation, low-growth environment, traditional equities struggle. Your portfolio returns ${scenario.return}% as bond components provide cushion. Alternative positions become more valuable.`;
    }

    return {
      ...scenario,
      narrative,
      gainPercent: returnDelta > 0 ? `+${returnDelta.toFixed(2)}%` : `${returnDelta.toFixed(2)}%`,
      probability: scenario.probability ? `${(scenario.probability * 100).toFixed(0)}%` : "Unknown",
    };
  });
};

// ==================== RISK INTERPRETATION ====================

/**
 * Generate qualitative risk interpretation
 * @param {Object} metrics - Portfolio metrics (volatility, sharpe_ratio, var_95, cvar_95)
 * @param {Object} concentration - Concentration analysis
 * @param {Object} forwardRisk - Forward-looking risk metrics
 * @returns {Object} Risk interpretation narrative and severity levels
 */
export const generateRiskInterpretation = (metrics, concentration, forwardRisk) => {
  if (!metrics) {
    return {
      volatility_interpretation: "Insufficient data",
      var_interpretation: "Insufficient data",
      concentration_warning: "Insufficient data",
      overall_risk_level: "unknown",
      key_risks: [],
    };
  }

  const vol = metrics.volatility || 0;
  const sharpe = metrics.sharpe_ratio || 0;
  const var95 = metrics.var_95 || 0;
  const cvar95 = metrics.cvar_95 || 0;

  // Volatility interpretation
  let volatilityInterpretation = "";
  let volatilityLevel = "moderate";

  if (vol < 8) {
    volatilityInterpretation = "Conservative volatility - expect smoother but lower returns";
    volatilityLevel = "low";
  } else if (vol < 15) {
    volatilityInterpretation = "Moderate volatility - balanced risk/return profile";
    volatilityLevel = "moderate";
  } else if (vol < 25) {
    volatilityInterpretation = "Elevated volatility - expect 10-25% annual swings";
    volatilityLevel = "high";
  } else {
    volatilityInterpretation = "High volatility - aggressive positioning with significant downside risk";
    volatilityLevel = "very high";
  }

  // Value at Risk interpretation
  let varInterpretation = "";
  if (var95 >= 0) {
    varInterpretation = `In 95% of scenarios, your portfolio returns at least ${var95.toFixed(1)}% annually. Only 1-in-20 years worse.`;
  } else {
    varInterpretation = `In 5% of bad scenarios, you lose up to ${Math.abs(var95).toFixed(1)}% annually. Conditional VaR shows worst 5% average loss of ${Math.abs(cvar95).toFixed(1)}%.`;
  }

  // Concentration warning
  let concentrationWarning = "Portfolio is well-diversified";
  if (concentration && concentration.isConcentrated) {
    concentrationWarning = `Concentration risk is HIGH. Top 3 holdings are ${concentration.top3Concentration}% of portfolio. Herfindahl Index (${concentration.herfindahlIndex}) indicates ${concentration.herfindahlCategory} positioning.`;
  }

  // Overall risk assessment
  const overallRiskLevel =
    sharpe > 0.8 && vol < 12 ? "low" : sharpe > 0.4 && vol < 18 ? "moderate" : vol > 25 ? "very high" : "high";

  const keyRisks = [];
  if (vol > 20) keyRisks.push("High volatility may challenge commitment to strategy");
  if (concentration && concentration.isConcentrated) keyRisks.push("Concentration risk - diversify to reduce single-name risk");
  if (sharpe < 0.3) keyRisks.push("Poor risk-adjusted returns relative to volatility taken");
  if (forwardRisk && forwardRisk.forwardLookingRisk > vol * 1.5)
    keyRisks.push("Forward-looking risk elevated vs base volatility - stress environment ahead");

  return {
    volatility_interpretation: volatilityInterpretation,
    volatility_level: volatilityLevel,
    var_interpretation: varInterpretation,
    concentration_warning: concentrationWarning,
    overall_risk_level: overallRiskLevel,
    key_risks: keyRisks,
  };
};

// ==================== STRATEGY RECOMMENDATIONS ====================

/**
 * Generate strategy-specific recommendations
 * @param {Object} metrics - Portfolio metrics from selected strategy
 * @param {Array} biases - Detected behavioral biases
 * @param {Object} goalProb - Goal probability analysis
 * @param {string} strategyName - Name of strategy (optimal, min_var, etc.)
 * @returns {Object} Strategy-specific insights and recommendations
 */
export const generateStrategyRecommendations = (metrics, biases, goalProb, strategyName) => {
  if (!metrics) {
    return {
      strategy_rationale: "Insufficient data",
      key_strengths: [],
      key_weaknesses: [],
      recommendations: [],
      suitability_warning: "Insufficient metrics for assessment",
    };
  }

  let rationale = "";
  let strengths = [];
  let weaknesses = [];
  let recommendations = [];

  switch (strategyName) {
    case "optimal_portfolio":
      rationale = "Optimal strategy maximizes risk-adjusted returns via Sharpe ratio, balancing return vs volatility.";
      strengths = [
        `Strong Sharpe ratio of ${metrics.sharpe_ratio?.toFixed(3)} - efficient use of volatility for returns`,
        "Blends return potential with downside management",
        "Suitable for long-term, moderate risk tolerance investors",
      ];
      if (metrics.volatility > 20) {
        weaknesses.push("Volatility elevated - may experience 20%+ annual swings");
      }
      if (metrics.volatility < 10) {
        weaknesses.push("Conservative - may undershoot long-term return targets");
      }
      recommendations = [
        "Hold steady for 5+ year horizons to benefit from risk-adjusted compounding",
        "Rebalance quarterly to maintain allocation targets",
        "Monitor drawdowns - acceptable max is typically 15-20% for this profile",
      ];
      break;

    case "minimum_variance_portfolio":
      rationale = "Minimum Variance strategy prioritizes capital preservation and smoother returns.";
      strengths = [
        `Lowest volatility (${metrics.volatility?.toFixed(2)}%) for chosen companies`,
        "Stable, predictable returns with fewer large swings",
        "Ideal for risk-averse or near-retirement investors",
      ];
      weaknesses = [
        `Lower expected return (${metrics.expected_return?.toFixed(2)}%) - may lag inflation long-term`,
        "Over-weighting defensive plays may miss upside opportunities",
      ];
      recommendations = [
        "Consider this as portfolio core for capital preservation",
        "Supplement with tactical growth allocation if target requires higher returns",
        "Review annually - volatility drivers change, reoptimize as needed",
      ];
      break;

    case "risk_parity_portfolio":
      rationale = "Risk Parity ensures equal contribution of each asset to portfolio risk.";
      strengths = [
        "True diversification - all holdings contribute equally to risk",
        "Systematic, rules-based approach reduces behavioral bias",
        "Good for long-term wealth building across market cycles",
      ];
      weaknesses = [
        `Moderate volatility (${metrics.volatility?.toFixed(2)}%) and returns`,
        "May appear 'boring' but lacks excitement of concentrated bets",
      ];
      recommendations = [
        "This is a set-and-forget strategy - rebalance to equal risk annually",
        "Excellent for automated investing through robo-advisors",
        "Very suitable for younger investors with 10+ year horizons",
      ];
      break;

    case "maximum_return_portfolio":
      rationale = "Maximum Return strategy seeks highest growth by overweighting top performers.";
      strengths = [
        `High expected return (${metrics.expected_return?.toFixed(2)}%) for growth investors`,
        "Concentrates on highest-conviction ideas",
      ];
      weaknesses = [
        `Elevated volatility (${metrics.volatility?.toFixed(2)}%) and risk`,
        "Concentration in hot sectors - vulnerable to rotation",
        biases?.some(b => b.type === "Concentration Bias") && "Detected concentration bias - strategy amplifies existing behavioral risk",
      ].filter(Boolean);
      recommendations = [
        "Only suitable for 10+ year horizons and high risk tolerance",
        "Requires stomach for 25-30% annual swings",
        "Monitor for performance chasing - rebalance if weights drift >10%",
      ];
      break;

    default:
      rationale = "Custom strategy";
  }

  // Goal-based adjustment
  if (goalProb && !goalProb.onTrack) {
    recommendations.push(`⚠️ GOAL ADJUSTMENT NEEDED: Current strategy targets ${goalProb.probability}% goal probability. Consider increasing contributions by ${Math.round((goalProb.gap / goalProb.projectedValue) * 100)}% or extending horizon.`);
  }

  return {
    strategy_rationale: rationale,
    key_strengths: strengths,
    key_weaknesses: weaknesses,
    recommendations: recommendations,
    suitability_warning:
      strategyName === "maximum_return_portfolio" && metrics.volatility > 25
        ? "⚠️ Very aggressive - recommended only for experienced investors"
        : null,
  };
};

// ==================== ADVANCED DIVERSIFICATION INSIGHTS ====================

/**
 * Generate advanced diversification analysis and insights
 * @param {Array<Array<number>>} correlationMatrix - Correlation matrix
 * @param {Object} concentration - Concentration analysis
 * @param {Array} companiesData - Company data
 * @returns {Object} Diversification insights and improvement recommendations
 */
export const generateDiversificationInsights = (correlationMatrix, concentration, companiesData) => {
  if (!correlationMatrix || correlationMatrix.length === 0) {
    return {
      diversification_benefit: "Insufficient data",
      correlation_risk: "Unknown",
      sector_concentration: "Unknown",
      improvement_areas: [],
    };
  }

  const flatCorr = correlationMatrix.flat().filter(c => c !== undefined && c !== null);
  const avgCorr = flatCorr.length > 0 ? flatCorr.reduce((a, b) => a + b, 0) / flatCorr.length : 0;

  // Diversification benefit
  const benefitPercent = Math.max(0, (1 - avgCorr) * 100);
  let diversificationBenefit = "";
  if (benefitPercent > 50) {
    diversificationBenefit = `Strong diversification benefit (${benefitPercent.toFixed(0)}%) - correlations are low, true risk reduction achieved`;
  } else if (benefitPercent > 30) {
    diversificationBenefit = `Moderate diversification benefit (${benefitPercent.toFixed(0)}%) - some correlation management, but could be improved`;
  } else {
    diversificationBenefit = `Weak diversification benefit (${benefitPercent.toFixed(0)}%) - holdings are highly correlated, limited risk reduction`;
  }

  // Correlation stress
  const stressCorr = avgCorr * 1.4;
  let correlationRisk = "";
  if (stressCorr > 0.75) {
    correlationRisk = `CRITICAL: Stress scenario correlations approach 1.0 - portfolio loses diversification benefit in crisis`;
  } else if (stressCorr > 0.6) {
    correlationRisk = `Moderate stress risk: During market stress, correlations may increase to ${stressCorr.toFixed(2)}, reducing diversification buffer`;
  } else {
    correlationRisk = `Low correlation breakdown risk - diversification remains effective in stress scenarios`;
  }

  // Sector analysis
  const sectorDiversity =
    concentration && concentration.sectorConcentration ? Object.keys(concentration.sectorConcentration).length : 0;
  let sectorConcentration = `Exposed to ${sectorDiversity} sectors`;
  if (sectorDiversity < 3) {
    sectorConcentration += " - IMPROVE SECTOR DIVERSIFICATION";
  } else if (sectorDiversity < 5) {
    sectorConcentration += " - add more sectors for better diversification";
  }

  // Improvement areas
  const improvementAreas = [];
  if (avgCorr > 0.6) improvementAreas.push("Reduce average correlation - add uncorrelated assets (bonds, international, alts)");
  if (sectorDiversity < 5) improvementAreas.push("Expand to 5-7 different sectors for macro diversification");
  if (concentration && concentration.isConcentrated) improvementAreas.push("Reduce concentration - spread positions more evenly");
  if (companiesData && companiesData.length < 8) improvementAreas.push("Add more individual positions (8-15 optimal) for statistical diversification");

  return {
    diversification_benefit: diversificationBenefit,
    average_correlation: avgCorr.toFixed(3),
    correlation_risk: correlationRisk,
    sector_concentration: sectorConcentration,
    improvement_areas: improvementAreas.length > 0 ? improvementAreas : ["Portfolio is well-diversified"],
  };
};

// ==================== REGIME-BASED ANALYSIS ====================

/**
 * Generate regime-based market analysis and implications
 * @param {Object} forwardRisk - Forward-looking risk metrics
 * @param {Object} metrics - Portfolio metrics
 * @param {Array} extendedScenarios - Extended scenario results
 * @returns {Object} Current regime assessment and implications
 */
export const generateRegimeAnalysis = (forwardRisk, metrics, extendedScenarios) => {
  if (!forwardRisk || !metrics) {
    return {
      current_regime: "Unknown",
      regime_implications: [],
      expected_performance: "Insufficient data",
      suggested_adjustments: [],
    };
  }

  const baseVolatility = parseFloat(forwardRisk.baseVolatility) || 0;
  const adjustedVolatility = parseFloat(forwardRisk.regimeAdjustedVolatility) || 0;
  const regimeMultiplier = parseFloat(forwardRisk.regimeMultiplier) || 1;

  let currentRegime = "Normal Market";
  let regimeImplications = [];

  if (regimeMultiplier > 1.3) {
    currentRegime = "High Volatility / Stress Regime";
    regimeImplications = [
      "VIX elevated - market fear is pricing in downside scenarios",
      "Correlations rising - diversification benefits fading",
      "Defensive positioning recommended over aggressive growth",
      "Buying opportunities may emerge for long-term investors",
    ];
  } else if (regimeMultiplier > 1.1) {
    currentRegime = "Elevated Risk Regime";
    regimeImplications = [
      "Geopolitical or macro uncertainties present",
      "Tail risk scenarios elevated relative to average",
      "Consider taking profits on winners, reduce leverage",
      "Portfolio volatility likely to exceed recent averages",
    ];
  } else if (regimeMultiplier < 0.8) {
    currentRegime = "Low Volatility / Complacency Regime";
    regimeImplications = [
      "Market pricing in low near-term risk",
      "Returns may be compressed but stable",
      "Risk of sudden volatility spike - could see large single-day moves",
      "Good time to rebalance, reduce concentration, take profits",
    ];
  } else {
    currentRegime = "Normal Market";
    regimeImplications = [
      "Volatility near historical averages",
      "No extreme regime shift detected",
      "Current portfolio positioning remains appropriate",
      "Continue disciplined rebalancing program",
    ];
  }

  // Expected performance in current regime
  let expectedPerformance = `In current ${currentRegime}, portfolio expected to deliver ${metrics.expected_return?.toFixed(2)}% annually with ${adjustedVolatility.toFixed(2)}% volatility.`;

  // Suggested adjustments
  const suggestedAdjustments = [];
  if (regimeMultiplier > 1.2) {
    suggestedAdjustments.push("Reduce equity weighting from aggressive positions");
    suggestedAdjustments.push("Increase cash/bond buffers for opportunity reserve");
  }
  if (metrics.sharpe_ratio < 0.3) {
    suggestedAdjustments.push("Risk-adjusted returns weak - consider rebalancing");
  }

  return {
    current_regime: currentRegime,
    regime_multiplier: regimeMultiplier.toFixed(2),
    volatility_adjustment: `Base ${baseVolatility.toFixed(2)}% × ${regimeMultiplier.toFixed(2)} = ${adjustedVolatility.toFixed(2)}% adjusted`,
    regime_implications: regimeImplications,
    expected_performance: expectedPerformance,
    suggested_adjustments: suggestedAdjustments.length > 0 ? suggestedAdjustments : ["Maintain current positioning"],
  };
};

// ==================== GOAL SCENARIO NARRATIVE ====================

/**
 * Generate narrative for goal achievement scenarios
 * @param {Object} goalProb - Goal probability analysis
 * @param {Object} monteCarloGoal - Monte Carlo goal probability
 * @param {number} initialAmount - Initial capital
 * @param {number} targetAmount - Target goal amount
 * @param {number} horizon - Investment horizon (years)
 * @returns {Object} Goal narrative and action items
 */
export const generateGoalNarrative = (goalProb, monteCarloGoal, initialAmount, targetAmount, horizon) => {
  if (!goalProb || !targetAmount) {
    return {
      narrative: "Insufficient data for goal analysis",
      action_items: [],
      confidence_assessment: "unknown",
    };
  }

  let narrative = "";
  const actionItems = [];

  const multiplier = targetAmount / initialAmount;
  const mcSuccess = monteCarloGoal?.monteCarloSuccess || goalProb.probability;

  if (mcSuccess >= 85) {
    narrative = `Your goal of $${(targetAmount / 1000000).toFixed(1)}M has HIGH probability (${mcSuccess}%) of achievement in ${horizon} years. Monte Carlo simulations show ${monteCarloGoal?.median ? `median ending value of $${(monteCarloGoal.median / 1000000).toFixed(1)}M` : `strong tail outcomes`}. Maintain discipline and rebalance quarterly.`;
    actionItems.push("✓ Strategy is well-aligned with goal. Monitor and rebalance quarterly.");
    actionItems.push("✓ No urgent changes needed - stay the course.");
  } else if (mcSuccess >= 60) {
    narrative = `Your goal has MODERATE probability (${mcSuccess}%) of achievement. Median projection shows $${(monteCarloGoal?.median / 1000000 || goalProb.projectedValue / 1000000).toFixed(1)}M by horizon end, with ${(goalProb.gap / 1000000).toFixed(1)}M shortfall. Consider increasing contributions or extending timeline.`;
    actionItems.push(`Increase monthly contributions by ${Math.round((goalProb.gap / horizon / 12) / 1000)}k to close gap.`);
    actionItems.push("OR: Extend horizon by 2-3 years to allow more compounding time.");
    actionItems.push("OR: Accept lower goal or higher risk to improve odds.");
  } else {
    narrative = `Your goal has LOW probability (${mcSuccess}%) of achievement with current strategy. Gap of $${(goalProb.gap / 1000000).toFixed(1)}M is significant. Major adjustments needed.`;
    actionItems.push(
      `Increase contributions by ${Math.round((goalProb.gap / horizon / 12) / 10)}k/month (${Math.round((goalProb.gap / targetAmount) * 100)}% increase)`
    );
    actionItems.push("Increase equity allocation and accept higher volatility.");
    actionItems.push(`Extend horizon to ${Math.round(goalProb.yearsToGoal)} years for more realistic timeline.`);
    actionItems.push("Consider whether target amount is realistic given starting capital.");
  }

  return {
    narrative: narrative,
    goal_multiple: `Need to grow initial capital ${multiplier.toFixed(1)}x in ${horizon} years`,
    success_probability: mcSuccess,
    action_items: actionItems,
    confidence_assessment: monteCarloGoal?.confidence || goalProb.confidence,
  };
};
