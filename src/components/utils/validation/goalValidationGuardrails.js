/**
 * Goal validation guardrails - ensures data integrity before rendering
 * Prevents silent calculation bugs and financial inaccuracies
 */

export const validateGoalAnalysis = (goal, metrics, recommendation) => {
  const errors = [];
  const warnings = [];

  if (!goal) {
    errors.push({
      code: 'MISSING_GOAL',
      message: 'Goal object is null or undefined',
      severity: 'critical'
    });
    return { isValid: false, errors, warnings };
  }

  if (typeof goal.target_amount !== 'number' || goal.target_amount <= 0) {
    errors.push({
      code: 'INVALID_TARGET',
      message: 'Target amount must be a positive number',
      expected: 'number > 0',
      severity: 'critical'
    });
  }

  if (goal.current_allocation && typeof goal.current_allocation !== 'number') {
    errors.push({
      code: 'INVALID_ALLOCATION',
      message: 'Current allocation must be a number',
      expected: 'number',
      severity: 'critical'
    });
  }

  if (metrics) {
    if (typeof metrics.portfolioValue !== 'number') {
      errors.push({
        code: 'INVALID_PORTFOLIO_VALUE',
        message: 'Metrics must include valid portfolioValue',
        severity: 'critical'
      });
    }

    if (typeof metrics.progressPercent !== 'number') {
      errors.push({
        code: 'INVALID_PROGRESS',
        message: 'Metrics must include valid progressPercent',
        severity: 'critical'
      });
    }

    if (goal.current_allocation > 0 && metrics.progressPercent === 0) {
      warnings.push({
        code: 'PROGRESS_MISMATCH',
        message: 'Initial capital exists but progress shows 0%',
        severity: 'warning'
      });
    }

    if (metrics.progressPercent > 100) {
      warnings.push({
        code: 'OVER_TARGET',
        message: `Goal already exceeded by ${(metrics.progressPercent - 100).toFixed(1)}%`,
        severity: 'info'
      });
    }
  }

  if (recommendation) {
    if (!recommendation.initial_investment || typeof recommendation.initial_investment !== 'object') {
      warnings.push({
        code: 'MISSING_INITIAL_INVESTMENT',
        message: 'Recommendation missing initial investment info',
        severity: 'warning'
      });
    }

    if (!recommendation.monthly_contribution || typeof recommendation.monthly_contribution !== 'object') {
      warnings.push({
        code: 'MISSING_MONTHLY',
        message: 'Recommendation missing monthly contribution info',
        severity: 'warning'
      });
    }

    if (recommendation.sample_allocation?.companies) {
      const totalAllocation = recommendation.sample_allocation.companies.reduce(
        (sum, company) => sum + (company.allocation_percentage || 0),
        0
      );

      if (Math.abs(totalAllocation - 100) > 1) {
        warnings.push({
          code: 'ALLOCATION_MISMATCH',
          message: `Allocation percentages sum to ${totalAllocation}%, expected 100%`,
          severity: 'warning'
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timestamp: (() => { try { return new Date().toISOString(); } catch (e) { return new Date().toLocaleDateString(); } })()
  };
};

export const generateFallbackAllocation = (initialAmount, monthlyAmount) => {
  return {
    disclaimer: "This is a generic fallback allocation. Not personalized. For educational purposes only.",
    companies: [
      {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        allocation_percentage: 40,
        initial_amount: (initialAmount * 0.40),
        monthly_amount: (monthlyAmount * 0.40),
        rationale: "Broad US market exposure with low fees"
      },
      {
        symbol: "VXUS",
        name: "Vanguard Total International Stock ETF",
        allocation_percentage: 20,
        initial_amount: (initialAmount * 0.20),
        monthly_amount: (monthlyAmount * 0.20),
        rationale: "International diversification"
      },
      {
        symbol: "BND",
        name: "Vanguard Total Bond Market ETF",
        allocation_percentage: 30,
        initial_amount: (initialAmount * 0.30),
        monthly_amount: (monthlyAmount * 0.30),
        rationale: "Bond holdings for stability"
      },
      {
        symbol: "VNQ",
        name: "Vanguard Real Estate ETF",
        allocation_percentage: 10,
        initial_amount: (initialAmount * 0.10),
        monthly_amount: (monthlyAmount * 0.10),
        rationale: "Real estate diversification"
      }
    ]
  };
};

export const formatValidationError = (validation) => {
  if (validation.isValid) {
    return {
      hasError: false,
      message: "Goal analysis passed validation",
      type: "success"
    };
  }

  const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
  const message = criticalErrors.length > 0
    ? `Critical validation errors: ${criticalErrors.map(e => e.code).join(', ')}`
    : `Validation warnings: ${validation.warnings.map(w => w.code).join(', ')}`;

  return {
    hasError: true,
    message,
    type: criticalErrors.length > 0 ? 'error' : 'warning',
    details: [...validation.errors, ...validation.warnings]
  };
};

export const canRenderGoalAnalysis = (goal, metrics, recommendation) => {
  const validation = validateGoalAnalysis(goal, metrics, recommendation);
  const hasCriticalErrors = validation.errors.some(e => e.severity === 'critical');
  return {
    canRender: !hasCriticalErrors,
    validation
  };
};
