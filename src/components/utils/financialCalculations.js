// Re-export core financial math functions
export const futureValue = (pv, rate, periods) => {
  return pv * Math.pow(1 + rate, periods);
};

export const timeToGoal = (target, current, monthlyContribution, annualReturn) => {
  const monthlyRate = annualReturn / 12 / 100;
  if (monthlyRate === 0) {
    return Math.ceil((target - current) / monthlyContribution);
  }
  return Math.ceil(
    Math.log((target * monthlyRate + monthlyContribution) / (monthlyContribution + current * monthlyRate)) /
    Math.log(1 + monthlyRate)
  );
};

export const calculateFutureValue = (pv, rate, periods) => futureValue(pv, rate, periods);
export const calculateMonthsToGoal = (target, current, monthly, rate) => timeToGoal(target, current, monthly, rate);

/**
 * Generate savings-only scenarios (no market returns assumed)
 * Helps users understand pure savings contribution plans
 */
export const generateSavingsScenarios = (targetAmount, monthsToGoal) => {
  const scenarios = [
    {
      name: "Conservative",
      description: "Equal initial & monthly contributions",
      initial_investment: targetAmount * 0.3,
      monthly_contribution: (targetAmount * 0.7) / Math.max(1, monthsToGoal)
    },
    {
      name: "Moderate",
      description: "50/50 split between initial and monthly",
      initial_investment: targetAmount * 0.5,
      monthly_contribution: (targetAmount * 0.5) / Math.max(1, monthsToGoal)
    },
    {
      name: "Aggressive",
      description: "Front-loaded with initial investment",
      initial_investment: targetAmount * 0.7,
      monthly_contribution: (targetAmount * 0.3) / Math.max(1, monthsToGoal)
    }
  ];

  return scenarios.map(scenario => ({
    ...scenario,
    total_invested: scenario.initial_investment + (scenario.monthly_contribution * Math.max(1, monthsToGoal)),
    months_to_goal: Math.max(1, monthsToGoal),
    goal_value: targetAmount
  }));
};

/**
 * Generate investment scenarios with different return assumptions
 * Shows impact of different market performance levels
 */
export const generateInvestmentScenarios = (targetAmount, initialCapital, monthlyContribution) => {
  const scenarios = [
    {
      name: "Conservative Bond-Heavy",
      description: "Lower volatility, steady income focus",
      annual_return: 5
    },
    {
      name: "Balanced Growth Plan",
      description: "Moderate risk with diversification",
      annual_return: 8
    },
    {
      name: "Aggressive Growth",
      description: "Higher growth potential, higher volatility",
      annual_return: 12
    }
  ];

  return scenarios.map(scenario => {
    const monthlyRate = scenario.annual_return / 12 / 100;
    const months = 60; // 5-year projection
    
    // Calculate future value with monthly contributions
    let fv = initialCapital;
    let totalContributions = initialCapital;
    
    for (let i = 0; i < months; i++) {
      fv = fv * (1 + monthlyRate) + monthlyContribution;
      totalContributions += monthlyContribution;
    }

    const growthFromReturns = fv - totalContributions;
    const monthsToGoal = Math.ceil(timeToGoal(targetAmount, initialCapital, monthlyContribution, scenario.annual_return));

    return {
      ...scenario,
      initial_investment: Math.round(initialCapital),
      monthly_contribution: Math.round(monthlyContribution),
      projected_value: Math.round(fv),
      total_contributions: Math.round(totalContributions),
      growth_from_returns: Math.round(growthFromReturns),
      months_to_goal: Math.max(1, monthsToGoal)
    };
  });
};
