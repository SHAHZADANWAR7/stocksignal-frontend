import { differenceInMonths } from "date-fns";

/**
 * SINGLE SOURCE OF TRUTH for all goal calculations
 * Ensures deterministic, consistent metrics across the app
 */

export const calculateGoalMetrics = (goal, holdings = []) => {
  try {
    if (!goal || typeof goal.target_amount !== 'number' || goal.target_amount <= 0) {
      throw new Error('Invalid goal: target_amount must be a positive number');
    }

    const holdingsValue = holdings.reduce((sum, h) => {
      const price = h.current_price || h.average_cost || 0;
      const value = (h.quantity || 0) * price;
      return sum + value;
    }, 0);

    const initialCapital = goal.current_allocation || 0;
    const portfolioValue = Math.max(0, initialCapital + (holdingsValue - initialCapital));
    const progressPercent = goal.target_amount > 0 
      ? (portfolioValue / goal.target_amount) * 100 
      : 0;
    const remainingGap = Math.max(0, goal.target_amount - portfolioValue);
    const monthsRemaining = goal.target_date 
      ? differenceInMonths(new Date(goal.target_date), new Date())
      : 0;

    return {
      portfolioValue: Math.round(portfolioValue),
      progressPercent: Math.round(progressPercent * 10) / 10,
      initialCapital: Math.round(initialCapital),
      holdingsValue: Math.round(holdingsValue),
      remainingGap: Math.round(remainingGap),
      monthsRemaining: Math.max(0, monthsRemaining),
      targetAmount: goal.target_amount,
      _calculation: {
        initialCapital,
        holdingsValue,
        portfolioValue,
        source: 'calculateGoalMetrics'
      }
    };
  } catch (error) {
    console.error('calculateGoalMetrics error:', error);
    throw error;
  }
};

export const calculateStressTestMetrics = (goal, monthlyContribution = 0, monthsProjected = 18, annualReturnRate = 0.08) => {
  try {
    const initialInvestment = goal.current_allocation || 0;
    const monthlyRate = annualReturnRate / 12;
    
    let portfolioValue = initialInvestment;
    for (let month = 0; month < monthsProjected; month++) {
      portfolioValue = portfolioValue * (1 + monthlyRate) + monthlyContribution;
    }

    return {
      portfolioValueWithGrowth: Math.round(portfolioValue),
      initialInvestment: Math.round(initialInvestment),
      totalContributions: Math.round(initialInvestment + (monthlyContribution * monthsProjected)),
      monthsProjected,
      annualReturnRate: annualReturnRate * 100
    };
  } catch (error) {
    console.error('calculateStressTestMetrics error:', error);
    throw error;
  }
};

export const calculateProjectionScenarios = (goal, initialCapital, monthlyContribution) => {
  const scenarios = [
    { name: "Pessimistic", rate: 0.03 },
    { name: "Expected", rate: 0.07 },
    { name: "Optimistic", rate: 0.11 }
  ];

  return scenarios.map(scenario => {
    const monthlyRate = scenario.rate / 12;
    let balance = initialCapital;
    let months = 0;
    const maxMonths = 360;

    while (balance < goal.target_amount && months < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      months++;
    }

    return {
      scenario: scenario.name,
      annualReturn: scenario.rate * 100,
      monthsToGoal: months < maxMonths ? months : null,
      projectedValue: Math.round(balance)
    };
  });
};

export const runAllGoalProgressTests = () => {
  const tests = [];

  const test1 = () => {
    const goal = { target_amount: 100000, current_allocation: 50000 };
    const holdings = [];
    const metrics = calculateGoalMetrics(goal, holdings);
    if (metrics.portfolioValue !== 50000) {
      return { passed: false, reason: `Expected 50000, got ${metrics.portfolioValue}` };
    }
    return { passed: true };
  };

  const test2 = () => {
    const goal = { target_amount: 100000, current_allocation: 50000 };
    const holdings = [
      { symbol: 'AAPL', quantity: 10, average_cost: 150, current_price: 160 }
    ];
    const metrics = calculateGoalMetrics(goal, holdings);
    if (metrics.portfolioValue <= 0) {
      return { passed: false, reason: `Portfolio value is ${metrics.portfolioValue}` };
    }
    return { passed: true };
  };

  const test3 = () => {
    const goal = { target_amount: 100000, current_allocation: 25000 };
    const holdings = [];
    const metrics = calculateGoalMetrics(goal, holdings);
    const expectedProgress = 25;
    if (Math.abs(metrics.progressPercent - expectedProgress) > 1) {
      return { passed: false, reason: `Expected ~25%, got ${metrics.progressPercent}%` };
    }
    return { passed: true };
  };

  const test4 = () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const goal = { target_amount: 100000, current_allocation: 0, target_date: futureDate };
    const metrics = calculateGoalMetrics(goal, []);
    if (metrics.monthsRemaining < 5 || metrics.monthsRemaining > 7) {
      return { passed: false, reason: `Expected ~6 months, got ${metrics.monthsRemaining}` };
    }
    return { passed: true };
  };

  const test5 = () => {
    const goal = { target_amount: 100000, current_allocation: 30000 };
    const holdings = [];
    const metrics = calculateGoalMetrics(goal, holdings);
    const expectedGap = 70000;
    if (metrics.remainingGap !== expectedGap) {
      return { passed: false, reason: `Expected gap ${expectedGap}, got ${metrics.remainingGap}` };
    }
    return { passed: true };
  };

  const educationFundTest = () => {
    const educationGoal = {
      goal_name: "Education Fund",
      target_amount: 200000,
      current_allocation: 50000,
      target_date: new Date(new Date().getFullYear() + 18, 0, 1)
    };
    const holdings = [];
    const metrics = calculateGoalMetrics(educationGoal, holdings);
    const snapshot = {
      portfolioValue: 50000,
      progressPercent: 25,
      initialCapital: 50000,
      remainingGap: 150000
    };
    for (const [key, expectedValue] of Object.entries(snapshot)) {
      if (metrics[key] !== expectedValue) {
        return {
          passed: false,
          reason: `Education Fund snapshot failed: ${key} expected ${expectedValue}, got ${metrics[key]}`
        };
      }
    }
    return { passed: true, critical: true };
  };

  tests.push(
    { name: "Zero holdings test", fn: test1 },
    { name: "Holdings value test", fn: test2 },
    { name: "Progress reflection test", fn: test3 },
    { name: "Months remaining test", fn: test4 },
    { name: "Remaining gap test", fn: test5 },
    { name: "Education Fund snapshot (RELEASE GATE)", fn: educationFundTest, critical: true }
  );

  const results = tests.map(test => {
    const result = test.fn();
    return {
      name: test.name,
      passed: result.passed,
      reason: result.reason,
      critical: test.critical
    };
  });

  const criticalFailure = results.find(r => r.critical && !r.passed);

  return {
    allPassed: results.every(r => r.passed),
    criticalFailure: !!criticalFailure,
    results,
    timestamp: new Date().toISOString()
  };
};
