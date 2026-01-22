/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shadow Portfolio Financial Validation & Realism Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ CRITICAL: SINGLE SOURCE OF TRUTH FOR ALL SHADOW PORTFOLIO CALCULATIONS
 * 
 * This module is the ONLY authorized source for Shadow Portfolio financial metrics.
 * NO other component, page, or module should recalculate core metrics independently.
 * 
 * ENFORCED RULES (DO NOT BYPASS):
 * --------------------------------
 * 1. All portfolio projections MUST use generateFinancialProjection()
 * 2. All viability scores MUST use calculateRealisticViabilityScore()
 * 3. All income breakdowns MUST use validateIncomeSource()
 * 4. All capital accounting MUST use explainCapitalChange()
 * 5. Projection charts MUST display separate lines for:
 *    - Portfolio Growth Only
 *    - External Income Contributions
 *    - Withdrawals
 * 6. Runway labels MUST distinguish "Portfolio-Sustained" vs "Income-Dependent"
 * 7. High-severity warnings MUST trigger for unrealistic scenarios
 * 
 * REGRESSION PROTECTION:
 * ----------------------
 * - All calculations are deterministic and mathematically consistent
 * - No AI-based recalculations for core financial metrics
 * - Validation functions include internal guardrails
 * - Test specifications documented in SHADOW_PORTFOLIO_TESTS.md
 * 
 * VISUAL REQUIREMENTS:
 * --------------------
 * - Charts must be mobile-responsive (12px fonts minimum)
 * - Labels must not overflow or hide
 * - Color-coding: Blue (portfolio), Green (external), Red (withdrawals)
 * - Tooltips/legends required for all projections
 * 
 * IF YOU'RE ADDING NEW FEATURES:
 * -------------------------------
 * 1. Read this entire file first
 * 2. Use existing functions—do NOT create parallel logic
 * 3. Validate your results using validateShadowPortfolioResults()
 * 4. Update SHADOW_PORTFOLIO_TESTS.md with new test cases
 * 
 * MAINTAINER CONTACT: Base44 Platform Team
 * LAST MAJOR REVISION: 2026-01-12
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Calculate safe withdrawal rate from portfolio
 * 
 * FORMULA: Safe Monthly Income = (Portfolio Value × 3.5%) / 12
 * 
 * RATIONALE:
 * - 3.5% annual withdrawal rate is conservative (4% rule minus inflation buffer)
 * - Accounts for longevity risk (30+ year retirement horizon)
 * - Based on Trinity Study and historical market returns
 * 
 * EXAMPLES:
 * - $1,000,000 portfolio → $2,916/month safe income
 * - $500,000 portfolio → $1,458/month safe income
 * - $100,000 portfolio → $292/month safe income
 * 
 * VALIDATION:
 * - If monthly income > this value, external income is required
 * - Withdrawal rates >10% trigger high-severity warnings
 * 
 * @param {number} portfolioValue - Total portfolio value
 * @param {number} annualReturnPercent - Expected annual return % (unused, for future)
 * @param {number} inflationPercent - Expected inflation % (unused, for future)
 * @returns {number} Safe monthly income from portfolio
 */
export function calculatePortfolioSafeIncome(portfolioValue, annualReturnPercent = 8, inflationPercent = 3) {
  // ENFORCE: Conservative 3.5% withdrawal rate (accounting for inflation & longevity)
  const SAFE_WITHDRAWAL_RATE = 0.035;
  
  // DEFENSIVE CHECK: Prevent NaN or negative values
  if (!portfolioValue || portfolioValue < 0 || isNaN(portfolioValue)) {
    console.warn('⚠️ calculatePortfolioSafeIncome: Invalid portfolioValue:', portfolioValue);
    return 0;
  }
  
  const annualSafeWithdrawal = portfolioValue * SAFE_WITHDRAWAL_RATE;
  return annualSafeWithdrawal / 12;
}

/**
 * Validate income source realism
 * @param {number} monthlyIncome - Stated monthly income
 * @param {number} portfolioValue - Portfolio size
 * @param {string} scenarioType - Type of scenario
 * @returns {Object} { isRealistic, warnings, incomeBreakdown }
 */
export function validateIncomeSource(monthlyIncome, portfolioValue, scenarioType) {
  const safePortfolioIncome = calculatePortfolioSafeIncome(portfolioValue);
  const excessIncome = monthlyIncome - safePortfolioIncome;
  
  const warnings = [];
  let incomeBreakdown = {
    portfolio_derived: Math.min(monthlyIncome, safePortfolioIncome),
    assumed_external: Math.max(0, excessIncome),
    portfolio_yield_percent: portfolioValue > 0 ? (monthlyIncome / portfolioValue * 12 * 100) : 0
  };
  
  // Flag unrealistic portfolio yields
  if (incomeBreakdown.portfolio_yield_percent > 10 && excessIncome < 0) {
    warnings.push({
      severity: 'high',
      message: `Income implies ${incomeBreakdown.portfolio_yield_percent.toFixed(1)}% annual yield from portfolio alone - unrealistic without external income source`
    });
  }
  
  // Early retirement validation - HIGH severity if heavy external dependence
  if (scenarioType === 'early_retirement' && excessIncome > 0) {
    const externalPercent = (excessIncome / monthlyIncome) * 100;
    if (externalPercent > 50) {
      warnings.push({
        severity: 'high',
        message: `Scenario assumes $${Math.round(excessIncome).toLocaleString()}/mo external income (${externalPercent.toFixed(0)}%) - not sustainable portfolio retirement`
      });
    } else {
      warnings.push({
        severity: 'medium',
        message: `Scenario assumes $${Math.round(excessIncome).toLocaleString()}/mo external income - partially income-dependent`
      });
    }
  }
  
  // Small portfolio, large income - ALWAYS HIGH severity
  if (portfolioValue < 100000 && monthlyIncome > 3000) {
    warnings.push({
      severity: 'high',
      message: `Portfolio too small ($${portfolioValue.toLocaleString()}) to sustainably generate $${monthlyIncome.toLocaleString()}/mo income`
    });
  }
  
  // Extreme external income dependence
  if (excessIncome > 0 && portfolioValue > 0) {
    const externalRatio = excessIncome / safePortfolioIncome;
    if (externalRatio > 5) {
      warnings.push({
        severity: 'high',
        message: `External income is ${externalRatio.toFixed(1)}x larger than safe portfolio withdrawal - heavily income-dependent`
      });
    }
  }
  
  const isRealistic = warnings.filter(w => w.severity === 'high').length === 0;
  
  return { isRealistic, warnings, incomeBreakdown };
}

/**
 * Calculate viability score with financial realism constraints
 * @param {Object} scenario - Shadow portfolio scenario
 * @param {Object} currentPortfolio - User's current portfolio
 * @returns {Object} { score, factors, warnings }
 */
export function calculateRealisticViabilityScore(scenario, currentPortfolio) {
  const factors = {
    cashflow_sustainability: 0,
    portfolio_adequacy: 0,
    risk_level: 0,
    transition_feasibility: 0
  };
  
  const warnings = [];
  
  // Factor 1: Cashflow Sustainability (40 points max)
  const netCashflow = (scenario.monthly_income || 0) - (scenario.monthly_expenses || 0);
  const portfolioValue = scenario.total_value || 0;
  const runwayMonths = netCashflow < 0 ? portfolioValue / Math.abs(netCashflow) : 999;
  
  if (netCashflow >= 0) {
    factors.cashflow_sustainability = 40; // Perfect
  } else if (runwayMonths >= 60) {
    factors.cashflow_sustainability = 30; // 5+ years runway
  } else if (runwayMonths >= 24) {
    factors.cashflow_sustainability = 20; // 2+ years
  } else if (runwayMonths >= 12) {
    factors.cashflow_sustainability = 10; // 1+ year
    warnings.push({
      severity: 'medium',
      message: `Only ${runwayMonths} months runway - need additional income or reduce expenses`
    });
  } else {
    factors.cashflow_sustainability = 0;
    warnings.push({
      severity: 'high',
      message: `Critical: Only ${runwayMonths} months until funds depleted`
    });
  }
  
  // Factor 2: Portfolio Adequacy (30 points max)
  const incomeValidation = validateIncomeSource(
    scenario.monthly_income || 0,
    portfolioValue,
    scenario.scenario_type
  );
  
  if (!incomeValidation.isRealistic) {
    warnings.push(...incomeValidation.warnings);
    factors.portfolio_adequacy = 5; // Penalize unrealistic assumptions
  } else {
    // Portfolio size relative to income needs
    const annualExpenses = (scenario.monthly_expenses || 0) * 12;
    const portfolioToExpenseRatio = portfolioValue / annualExpenses;
    
    if (portfolioToExpenseRatio >= 25) {
      factors.portfolio_adequacy = 30; // 25x+ coverage
    } else if (portfolioToExpenseRatio >= 15) {
      factors.portfolio_adequacy = 20; // 15x+ coverage
    } else if (portfolioToExpenseRatio >= 10) {
      factors.portfolio_adequacy = 10; // 10x+ coverage
    } else {
      factors.portfolio_adequacy = 5;
      warnings.push({
        severity: 'medium',
        message: `Portfolio only ${portfolioToExpenseRatio.toFixed(1)}x annual expenses - recommend 25x+ for sustainability`
      });
    }
  }
  
  // Factor 3: Risk Level (20 points max)
  const holdingsCount = scenario.hypothetical_holdings?.length || 0;
  
  if (holdingsCount >= 10) {
    factors.risk_level = 20; // Well diversified
  } else if (holdingsCount >= 5) {
    factors.risk_level = 15; // Moderate diversification
  } else if (holdingsCount >= 3) {
    factors.risk_level = 10;
    warnings.push({
      severity: 'low',
      message: `Only ${holdingsCount} holdings - consider broader diversification`
    });
  } else if (holdingsCount > 0) {
    factors.risk_level = 5;
    warnings.push({
      severity: 'medium',
      message: `High concentration risk with only ${holdingsCount} holdings`
    });
  } else {
    factors.risk_level = 10; // No holdings specified, assume diversified
  }
  
  // Factor 4: Transition Feasibility (10 points max)
  if (!currentPortfolio) {
    factors.transition_feasibility = 10; // No baseline, full points
  } else {
    const valueChange = Math.abs(portfolioValue - currentPortfolio.value);
    const changePercent = (valueChange / currentPortfolio.value) * 100;
    
    if (changePercent <= 20) {
      factors.transition_feasibility = 10; // Realistic change
    } else if (changePercent <= 50) {
      factors.transition_feasibility = 7;
    } else if (changePercent <= 100) {
      factors.transition_feasibility = 5;
      warnings.push({
        severity: 'medium',
        message: `Portfolio value changes by ${changePercent.toFixed(0)}% - explain capital source`
      });
    } else {
      factors.transition_feasibility = 2;
      warnings.push({
        severity: 'high',
        message: `Portfolio value changes by ${changePercent.toFixed(0)}% - requires major capital injection or liquidation explanation`
      });
    }
  }
  
  const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);
  
  return {
    score: Math.min(100, Math.max(0, totalScore)),
    factors,
    warnings,
    incomeBreakdown: incomeValidation.isRealistic ? incomeValidation.incomeBreakdown : null
  };
}

/**
 * Generate financial projection with clear separation and assumptions
 * @param {number} startingValue - Initial portfolio value
 * @param {number} monthlyIncome - Monthly income
 * @param {number} monthlyExpenses - Monthly expenses
 * @param {number} years - Projection horizon
 * @param {Object} assumptions - Return/inflation assumptions
 * @returns {Object} Projection data with metadata
 */
export function generateFinancialProjection(
  startingValue,
  monthlyIncome,
  monthlyExpenses,
  years = 10,
  assumptions = {}
) {
  const {
    annualReturn = 0.08,
    inflationRate = 0.03,
    includeWithdrawals = false
  } = assumptions;
  
  const monthlyReturn = annualReturn / 12;
  const netCashflow = monthlyIncome - monthlyExpenses;
  
  // Calculate safe withdrawal from portfolio
  const safePortfolioIncome = calculatePortfolioSafeIncome(startingValue);
  const externalIncome = Math.max(0, monthlyIncome - safePortfolioIncome);
  
  const projection = [];
  let portfolioValue = startingValue;
  let cumulativeExternalIncome = 0;
  let cumulativePortfolioGrowth = 0;
  let cumulativeWithdrawals = 0;
  
  for (let year = 0; year <= years; year++) {
    const portfolioGrowthSoFar = portfolioValue - startingValue - cumulativeExternalIncome + cumulativeWithdrawals;
    
    projection.push({
      year,
      portfolio_value: Math.round(portfolioValue),
      portfolio_only_growth: Math.round(portfolioGrowthSoFar),
      external_income_contributions: Math.round(cumulativeExternalIncome),
      cumulative_withdrawals: Math.round(cumulativeWithdrawals),
      net_worth: Math.round(portfolioValue)
    });
    
    if (year < years) {
      for (let month = 0; month < 12; month++) {
        const beforeGrowth = portfolioValue;
        portfolioValue = portfolioValue * (1 + monthlyReturn) + netCashflow;
        
        if (netCashflow > 0) {
          cumulativeExternalIncome += Math.min(netCashflow, externalIncome);
        } else {
          cumulativeWithdrawals += Math.abs(netCashflow);
        }
      }
    }
  }
  
  const isPortfolioSustained = externalIncome < (monthlyIncome * 0.1); // Less than 10% external
  
  return {
    projection,
    is_portfolio_sustained: isPortfolioSustained,
    external_income_monthly: externalIncome,
    assumptions: {
      annual_return: `${(annualReturn * 100).toFixed(1)}%`,
      monthly_return: `${(monthlyReturn * 100).toFixed(3)}%`,
      inflation_rate: `${(inflationRate * 100).toFixed(1)}%`,
      net_monthly_cashflow: `$${netCashflow.toLocaleString()}`,
      portfolio_derived_income: `$${Math.round(safePortfolioIncome).toLocaleString()}/mo`,
      external_income: `$${Math.round(externalIncome).toLocaleString()}/mo`,
      rebalancing: "None (constant growth rate)",
      dividends: "Not modeled separately",
      taxes: "Not modeled",
      methodology: "Simple compound growth with monthly contributions/withdrawals"
    },
    summary: {
      starting_value: startingValue,
      ending_value: projection[years].portfolio_value,
      portfolio_only_growth: projection[years].portfolio_only_growth,
      external_contributions: projection[years].external_income_contributions,
      total_withdrawals: projection[years].cumulative_withdrawals,
      investment_growth: projection[years].portfolio_only_growth,
      total_return_percent: startingValue > 0 
        ? ((projection[years].portfolio_value - startingValue) / startingValue * 100)
        : 0,
      portfolio_only_return_percent: startingValue > 0
        ? ((projection[years].portfolio_only_growth) / startingValue * 100)
        : 0
    }
  };
}

/**
 * Validate capital accounting when comparing portfolios
 * @param {number} currentValue - Current portfolio value
 * @param {number} hypotheticalValue - Shadow portfolio value
 * @returns {Object} Capital accounting explanation
 */
export function explainCapitalChange(currentValue, hypotheticalValue) {
  const difference = hypotheticalValue - currentValue;
  const percentChange = currentValue > 0 ? (difference / currentValue * 100) : 0;
  
  return {
    difference,
    percentChange,
    explanation: Math.abs(percentChange) < 5 
      ? "Portfolio values are similar"
      : difference > 0
        ? `This scenario assumes $${Math.abs(difference).toLocaleString()} additional capital injection (${percentChange.toFixed(1)}% increase)`
        : `This scenario assumes $${Math.abs(difference).toLocaleString()} capital withdrawal (${Math.abs(percentChange).toFixed(1)}% reduction)`,
    severity: Math.abs(percentChange) > 100 ? 'high' : Math.abs(percentChange) > 50 ? 'medium' : 'low'
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VALIDATION & REGRESSION PROTECTION
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Validate Shadow Portfolio results for correctness and completeness
 * Use this function to verify all outputs before displaying to users
 * 
 * @param {Object} simulationResults - Results from runSimulation
 * @returns {Object} { isValid, errors, warnings }
 */
export function validateShadowPortfolioResults(simulationResults) {
  const errors = [];
  const warnings = [];
  
  // Required fields check
  const requiredFields = [
    'viability_score',
    'projection_data',
    'projection_summary',
    'is_portfolio_sustained',
    'external_income_monthly',
    'runway_months'
  ];
  
  requiredFields.forEach(field => {
    if (simulationResults[field] === undefined || simulationResults[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Projection data structure check
  if (simulationResults.projection_data && Array.isArray(simulationResults.projection_data)) {
    const requiredProjectionFields = [
      'year',
      'portfolio_value',
      'portfolio_only_growth',
      'external_income_contributions',
      'cumulative_withdrawals'
    ];
    
    const firstPoint = simulationResults.projection_data[0];
    if (firstPoint) {
      requiredProjectionFields.forEach(field => {
        if (firstPoint[field] === undefined) {
          errors.push(`Projection data missing required field: ${field}`);
        }
      });
    }
  } else {
    errors.push('projection_data must be an array');
  }
  
  // Viability score bounds check
  if (typeof simulationResults.viability_score === 'number') {
    if (simulationResults.viability_score < 0 || simulationResults.viability_score > 100) {
      errors.push(`viability_score out of bounds: ${simulationResults.viability_score}`);
    }
  }
  
  // Runway consistency check
  if (simulationResults.runway_months === 999) {
    if (simulationResults.is_portfolio_sustained === undefined) {
      warnings.push('Sustainable runway without is_portfolio_sustained flag');
    }
  }
  
  // External income consistency check
  if (simulationResults.external_income_monthly > 0) {
    if (simulationResults.is_portfolio_sustained === true) {
      warnings.push('External income present but marked as portfolio-sustained');
    }
  }
  
  // High-severity warning enforcement
  if (simulationResults.validation_warnings && Array.isArray(simulationResults.validation_warnings)) {
    const hasHighSeverity = simulationResults.validation_warnings.some(w => w.severity === 'high');
    if (hasHighSeverity && simulationResults.viability_score > 70) {
      warnings.push('High-severity warnings present but viability score is high');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEVELOPER CHECKLIST: BEFORE MODIFYING SHADOW PORTFOLIO LOGIC
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. ✅ Have you read the ENTIRE header documentation in this file?
 * 2. ✅ Are you using ONLY functions from this module (no parallel calculations)?
 * 3. ✅ Have you tested with these scenarios:
 *    - Pure portfolio retirement ($1M portfolio, $2.9k/mo income)
 *    - Income-dependent ($100k portfolio, $4k/mo income)
 *    - Negative runway ($50k portfolio, -$2k/mo cashflow)
 *    - Extreme external income ($60k portfolio, $6k/mo income)
 * 4. ✅ Do projection charts show SEPARATE lines for portfolio vs external income?
 * 5. ✅ Do sustainability labels use getSustainabilityLabel() function?
 * 6. ✅ Are high-severity warnings triggered for unrealistic scenarios?
 * 7. ✅ Have you run validateBeforeRender() before displaying results?
 * 8. ✅ Is mobile responsiveness maintained (11px+ fonts, no overflow)?
 * 9. ✅ Have you updated test documentation if adding new features?
 * 10. ✅ Does your code pass all pre-render validation checkpoints?
 * 
 * IF YOU ANSWERED "NO" TO ANY QUESTION ABOVE, DO NOT PROCEED.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Generate sustainability label based on runway and external income
 * 
 * ENFORCE: Only "Portfolio-Sustained" if portfolio alone covers expenses
 * 
 * LOGIC:
 * - runway_months === 999 + is_portfolio_sustained === true → "✓ Portfolio-Sustained" (green)
 * - runway_months === 999 + is_portfolio_sustained === false → "⚠ Income-Dependent" (amber)
 * - runway_months < 999 → "{N} months" (red)
 * 
 * DO NOT BYPASS: This function enforces consistent labeling across the entire UI
 * 
 * @param {number} runwayMonths - Calculated runway
 * @param {boolean} isPortfolioSustained - Flag from generateFinancialProjection
 * @returns {string} Display label
 */
export function getSustainabilityLabel(runwayMonths, isPortfolioSustained) {
  // DEFENSIVE CHECK
  if (typeof runwayMonths !== 'number' || isNaN(runwayMonths)) {
    console.error('❌ getSustainabilityLabel: Invalid runwayMonths:', runwayMonths);
    return 'Error';
  }
  
  if (runwayMonths === 999) {
    return isPortfolioSustained ? '✓ Portfolio-Sustained' : '⚠ Income-Dependent';
  }
  return `${runwayMonths} months`;
}

/**
 * Get color class for sustainability label
 * 
 * @param {number} runwayMonths - Calculated runway
 * @param {boolean} isPortfolioSustained - Flag from generateFinancialProjection
 * @returns {string} Tailwind color class
 */
export function getSustainabilityColor(runwayMonths, isPortfolioSustained) {
  if (runwayMonths === 999) {
    return isPortfolioSustained ? 'text-emerald-600' : 'text-amber-600';
  }
  return 'text-rose-600';
}

/**
 * Assert projection chart data validity
 * Use before rendering charts to ensure data integrity
 * 
 * @param {Array} projectionData - Chart data
 * @throws {Error} If data is invalid
 */
export function assertProjectionChartData(projectionData) {
  if (!Array.isArray(projectionData) || projectionData.length === 0) {
    throw new Error('❌ CRITICAL: Projection data must be a non-empty array');
  }
  
  const requiredFields = [
    'year',
    'portfolio_value',
    'portfolio_only_growth',
    'external_income_contributions',
    'cumulative_withdrawals'
  ];
  
  projectionData.forEach((point, index) => {
    requiredFields.forEach(field => {
      if (point[field] === undefined || point[field] === null) {
        throw new Error(`❌ CRITICAL: Projection data point ${index} missing required field: ${field}`);
      }
      
      // Validate numeric values
      if (typeof point[field] !== 'number' || isNaN(point[field])) {
        throw new Error(`❌ CRITICAL: Projection data point ${index}.${field} must be a valid number, got: ${point[field]}`);
      }
    });
    
    // MATHEMATICAL CONSISTENCY CHECK
    const calculatedTotal = point.portfolio_only_growth + point.external_income_contributions - point.cumulative_withdrawals;
    const tolerance = 10; // Allow $10 rounding error
    
    if (Math.abs(point.portfolio_value - calculatedTotal) > tolerance) {
      console.error('❌ MATHEMATICAL INCONSISTENCY DETECTED:');
      console.error(`Year ${point.year}:`);
      console.error(`  portfolio_value: ${point.portfolio_value}`);
      console.error(`  portfolio_only_growth: ${point.portfolio_only_growth}`);
      console.error(`  external_income: ${point.external_income_contributions}`);
      console.error(`  withdrawals: ${point.cumulative_withdrawals}`);
      console.error(`  Expected: ${calculatedTotal}`);
      console.error(`  Difference: ${Math.abs(point.portfolio_value - calculatedTotal)}`);
      throw new Error('❌ CRITICAL: Projection math does not add up - data integrity compromised');
    }
  });
  
  // ENFORCE SEPARATION: Ensure external income is tracked separately
  const lastPoint = projectionData[projectionData.length - 1];
  if (lastPoint.external_income_contributions > 0 && 
      lastPoint.portfolio_value === lastPoint.portfolio_only_growth) {
    throw new Error('❌ CRITICAL: External income contributions detected but not reflected in portfolio_value - separation violated');
  }
}

/**
 * Pre-render validation checkpoint
 * Call this before displaying ANY Shadow Portfolio metrics to users
 * 
 * @param {Object} scenario - Shadow portfolio scenario
 * @param {Object} simulationResults - Simulation output
 * @param {Object} currentPortfolio - User's current portfolio (optional)
 * @throws {Error} If any validation fails
 */
export function validateBeforeRender(scenario, simulationResults, currentPortfolio = null) {
  console.log('🔍 Shadow Portfolio Pre-Render Validation Starting...');
  
  // CHECKPOINT 1: Required fields
  const requiredFields = [
    'viability_score',
    'projection_data',
    'projection_summary',
    'is_portfolio_sustained',
    'external_income_monthly',
    'runway_months'
  ];
  
  requiredFields.forEach(field => {
    if (simulationResults[field] === undefined || simulationResults[field] === null) {
      throw new Error(`❌ CRITICAL: Missing required field: ${field}`);
    }
  });
  
  // CHECKPOINT 2: Projection data structure
  assertProjectionChartData(simulationResults.projection_data);
  
  // CHECKPOINT 3: Income source validation
  const portfolioValue = scenario.total_value || 0;
  const monthlyIncome = scenario.monthly_income || 0;
  const safeIncome = calculatePortfolioSafeIncome(portfolioValue);
  const externalIncome = Math.max(0, monthlyIncome - safeIncome);
  
  if (Math.abs(externalIncome - simulationResults.external_income_monthly) > 1) {
    throw new Error(`❌ CRITICAL: External income mismatch - calculated ${externalIncome}, stored ${simulationResults.external_income_monthly}`);
  }
  
  // CHECKPOINT 4: Sustainability label consistency
  if (simulationResults.runway_months === 999) {
    const isPortfolioSustained = externalIncome < (monthlyIncome * 0.1);
    if (simulationResults.is_portfolio_sustained !== isPortfolioSustained) {
      throw new Error(`❌ CRITICAL: is_portfolio_sustained flag mismatch - calculated ${isPortfolioSustained}, stored ${simulationResults.is_portfolio_sustained}`);
    }
  }
  
  // CHECKPOINT 5: High-severity warning enforcement
  if (portfolioValue < 100000 && monthlyIncome > 3000) {
    const hasHighWarning = simulationResults.validation_warnings?.some(w => 
      w.severity === 'high' && w.message.includes('Portfolio too small')
    );
    if (!hasHighWarning) {
      throw new Error('❌ CRITICAL: High-severity warning missing for small portfolio / high income scenario');
    }
  }
  
  // CHECKPOINT 6: Withdrawal rate sanity check
  if (portfolioValue > 0) {
    const impliedWithdrawalRate = (monthlyIncome * 12 / portfolioValue) * 100;
    if (impliedWithdrawalRate > 10 && !simulationResults.validation_warnings?.some(w => w.severity === 'high')) {
      throw new Error(`❌ CRITICAL: Withdrawal rate ${impliedWithdrawalRate.toFixed(1)}% exceeds 10% but no high-severity warning present`);
    }
  }
  
  console.log('✅ Shadow Portfolio Pre-Render Validation PASSED');
  return true;
}
