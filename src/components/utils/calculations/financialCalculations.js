// Financial Calculation Utilities
// Re-exports from centralized financialMath library

import { futureValue, timeToGoal } from "./financialMath";

// Re-export for backwards compatibility
export function calculateFutureValue(principal, monthlyContribution, annualReturnPercent, months) {
  const years = months / 12;
  return futureValue(principal, monthlyContribution, annualReturnPercent, years);
}

export function calculateMonthsToGoal(principal, monthlyContribution, annualReturnPercent, targetAmount) {
  const years = timeToGoal(principal, monthlyContribution, annualReturnPercent, targetAmount);
  return years ? years * 12 : null;
}

/**
 * Generate savings scenarios (no market returns)
 * 
 * @param {number} targetAmount - Goal amount
 * @param {number} monthsToGoal - Timeline in months
 * @returns {Array} Array of 3 savings scenarios
 */
export function generateSavingsScenarios(targetAmount, monthsToGoal) {
  const baseInitial = Math.max(50000, targetAmount * 0.25);
  const baseMonthly = (targetAmount - baseInitial) / monthsToGoal;
  
  return [
    {
      name: "Base Savings Plan",
      description: "Reach goal through contributions only (no investment returns assumed)",
      initial_investment: Math.round(baseInitial),
      monthly_contribution: Math.round(baseMonthly),
      months_to_goal: monthsToGoal,
      total_invested: targetAmount,
      goal_value: targetAmount
    },
    {
      name: "Higher Initial, Lower Monthly",
      description: "Start with 50% more capital, reduce monthly burden",
      initial_investment: Math.round(baseInitial * 1.5),
      monthly_contribution: Math.round((targetAmount - baseInitial * 1.5) / monthsToGoal),
      months_to_goal: monthsToGoal,
      total_invested: targetAmount,
      goal_value: targetAmount
    },
    {
      name: "Reach Goal 6 Months Earlier",
      description: "Achieve goal faster with higher monthly contributions",
      initial_investment: Math.round(baseInitial),
      monthly_contribution: Math.round((targetAmount - baseInitial) / (monthsToGoal - 6)),
      months_to_goal: monthsToGoal - 6,
      total_invested: targetAmount,
      goal_value: targetAmount
    }
  ];
}

/**
 * Generate investment scenarios (with market returns)
 * Uses monthly compounding with end-of-month contributions
 * 
 * @param {number} targetAmount - Goal amount
 * @param {number} baseInitial - Base initial investment
 * @param {number} baseMonthly - Base monthly contribution
 * @returns {Array} Array of 3 investment scenarios with accurate calculations
 */
export function generateInvestmentScenarios(targetAmount, baseInitial, baseMonthly) {
  const scenarios = [];
  
  // Scenario 1: Balanced Growth (8% annual return)
  // Monthly rate: 0.08/12 = 0.006666667
  const balanced = {
    name: "Balanced Growth Plan",
    description: "Standard diversified portfolio with 8% annual returns",
    initial_investment: Math.round(baseInitial),
    monthly_contribution: Math.round(baseMonthly),
    annual_return: 8,
    months_to_goal: 0,
    projected_value: 0,
    total_contributions: 0,
    growth_from_returns: 0
  };
  const balancedMonths = calculateMonthsToGoal(balanced.initial_investment, balanced.monthly_contribution, 8, targetAmount);
  balanced.months_to_goal = balancedMonths ? Math.round(balancedMonths) : 0;
  balanced.total_contributions = balanced.initial_investment + (balanced.monthly_contribution * balanced.months_to_goal);
  balanced.projected_value = Math.round(calculateFutureValue(balanced.initial_investment, balanced.monthly_contribution, 8, balanced.months_to_goal));
  balanced.growth_from_returns = balanced.projected_value - balanced.total_contributions;
  scenarios.push(balanced);
  
  // Scenario 2: Conservative Bond-Heavy (5% annual return, higher monthly to compensate)
  // Monthly rate: 0.05/12 = 0.004166667
  const conservative = {
    name: "Conservative Bond-Heavy",
    description: "Lower risk with 5% returns (70% bonds, 30% stocks)",
    initial_investment: Math.round(baseInitial),
    monthly_contribution: Math.round(baseMonthly * 1.2), // Higher monthly due to lower returns
    annual_return: 5,
    months_to_goal: 0,
    projected_value: 0,
    total_contributions: 0,
    growth_from_returns: 0
  };
  const conservativeMonths = calculateMonthsToGoal(conservative.initial_investment, conservative.monthly_contribution, 5, targetAmount);
  conservative.months_to_goal = conservativeMonths ? Math.round(conservativeMonths) : 0;
  conservative.total_contributions = conservative.initial_investment + (conservative.monthly_contribution * conservative.months_to_goal);
  conservative.projected_value = Math.round(calculateFutureValue(conservative.initial_investment, conservative.monthly_contribution, 5, conservative.months_to_goal));
  conservative.growth_from_returns = conservative.projected_value - conservative.total_contributions;
  scenarios.push(conservative);
  
  // Scenario 3: Aggressive Growth (12% annual return, lower monthly due to higher returns)
  // Monthly rate: 0.12/12 = 0.01
  const aggressive = {
    name: "Aggressive Growth",
    description: "High risk tech-heavy portfolio with 12% target returns",
    initial_investment: Math.round(baseInitial),
    monthly_contribution: Math.round(baseMonthly * 0.8), // Lower monthly due to higher expected returns
    annual_return: 12,
    months_to_goal: 0,
    projected_value: 0,
    total_contributions: 0,
    growth_from_returns: 0
  };
  const aggressiveMonths = calculateMonthsToGoal(aggressive.initial_investment, aggressive.monthly_contribution, 12, targetAmount);
  aggressive.months_to_goal = aggressiveMonths ? Math.round(aggressiveMonths) : 0;
  aggressive.total_contributions = aggressive.initial_investment + (aggressive.monthly_contribution * aggressive.months_to_goal);
  aggressive.projected_value = Math.round(calculateFutureValue(aggressive.initial_investment, aggressive.monthly_contribution, 12, aggressive.months_to_goal));
  aggressive.growth_from_returns = aggressive.projected_value - aggressive.total_contributions;
  scenarios.push(aggressive);
  
  return scenarios;
}
