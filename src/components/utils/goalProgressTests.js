import { calculateGoalMetrics } from "./calculations/goalCalculationEngine";
import { differenceInMonths } from "date-fns";

/**
 * Regression test suite - ensures calculation accuracy
 * Critical for financial accuracy
 */
export const runAllGoalProgressTests = () => {
  const tests = [];

  // Test 1: Zero holdings returns initial capital
  const test1 = () => {
    const goal = { target_amount: 100000, current_allocation: 50000 };
    const holdings = [];
    const metrics = calculateGoalMetrics(goal, holdings);
    
    if (metrics.portfolioValue !== 50000) {
      return { passed: false, reason: `Expected 50000, got ${metrics.portfolioValue}` };
    }
    return { passed: true };
  };

  // Test 2: Holdings value calculated correctly
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

  // Test 3: Progress reflects initial capital
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

  // Test 4: Months remaining calculated
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

  // Test 5: Remaining gap calculation
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

  // MANDATORY SNAPSHOT TEST: Education Fund
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
