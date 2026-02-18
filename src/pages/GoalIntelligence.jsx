import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { generateSavingsScenarios, generateInvestmentScenarios } from "@/components/utils/calculations/financialCalculations";
import { calculateGoalMetrics, calculateStressTestMetrics } from "@/components/utils/calculations/goalCalculationEngine";
import { validateGoalAnalysis, generateFallbackAllocation, formatValidationError } from "@/components/utils/validation/goalValidationGuardrails";
import { runAllGoalProgressTests } from "@/components/utils/goalProgressTests";
import { 
  Target, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Loader2,
  Home,
  GraduationCap,
  Shield,
  Sparkles,
  ArrowRight,
  Info,
  Building2,
  TrendingUp,
  Pencil,
  Trash2,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SavingsOnlyNarrative,
  InvestmentProjectionsNarrative,
  AllocationDisclaimerNarrative,
  StressTestNarrative,
  DownturnTimingNarrative,
  PortfolioRiskNarrative,
  ComprehensiveInvestmentDisclaimer
} from "@/components/goals/GoalNarrativeBlocks";

export default function GoalIntelligence() {
  const [goals, setGoals] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [scenarios, setScenarios] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [recommendations, setRecommendations] = useState({});
  const [isGeneratingReco, setIsGeneratingReco] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [crisisSimulation, setCrisisSimulation] = useState(null);
  const [isSimulatingCrisis, setIsSimulatingCrisis] = useState(false);
  const [selectedBlackSwan, setSelectedBlackSwan] = useState(null);
  const [blackSwanResult, setBlackSwanResult] = useState(null);
  const [isGeneratingBlackSwan, setIsGeneratingBlackSwan] = useState(false);
  const [blackSwanSimulations, setBlackSwanSimulations] = useState({});
  const [customInitial, setCustomInitial] = useState("");
  const [customMonthly, setCustomMonthly] = useState("");
  const [selectedGoalForReco, setSelectedGoalForReco] = useState("");
  const [customRecommendations, setCustomRecommendations] = useState(null);
  const [isGeneratingCustomReco, setIsGeneratingCustomReco] = useState(false);
  const [expandedScenarioAllocation, setExpandedScenarioAllocation] = useState(null);
  const [newGoal, setNewGoal] = useState({
    goal_name: "",
    goal_type: "retirement",
    target_amount: "",
    target_date: "",
    current_allocation: "",
    assigned_holdings: [],
    priority: "medium"
  });

  useEffect(() => {
    // ═══════════════════════════════════════════════════════════════════════════════
    // REGRESSION TEST: Verify goal progress calculations are correct before rendering
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const testResult = runAllGoalProgressTests();
    if (!testResult.allPassed) {
      console.error('❌ CRITICAL: Goal progress calculations failed regression tests');
      console.error('Test Results:', testResult);
      // In production, this would trigger an alert
    } else {
      console.log('✅ Goal progress calculations passed all regression tests');
    }
    
    loadData();
    loadBlackSwanSimulations();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    console.log("[GoalDebug] Current userId from storage:", userId);
    console.log("[GoalDebug] Current email from storage:", localStorage.getItem("user_email"));
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    const [goalsData, holdingsData] = await Promise.all([
      awsApi.getPortfolioGoal(localStorage.getItem("user_email")),
      awsApi.getStockBatch(userId)
    ]);
    
    // Also load paper trading portfolio if regular holdings are empty
    let allHoldings = holdingsData || [];
    if (allHoldings.length === 0) {
      const paperPortfolio = await awsApi.getStockBatch(userId);
      if (paperPortfolio?.assets) {
        // Convert paper trading assets to holdings format
        allHoldings = paperPortfolio.assets.map(asset => ({
          symbol: asset.symbol,
          name: asset.symbol,
          quantity: asset.quantity,
          average_cost: asset.avgCost,
          current_price: asset.currentPrice || asset.avgCost
        }));
      }
    }
    
    setGoals(goalsData || []);
    setHoldings(allHoldings);
    setIsLoading(false);
  };

  const loadBlackSwanSimulations = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    
    // Load cached black swan simulations from database
    const simulations = await awsApi.getBlackSwanSimulations(userId);
    const simulationsByType = {};
    (simulations || []).forEach(sim => {
      if (!simulationsByType[sim.scenario_type]) {
        simulationsByType[sim.scenario_type] = sim;
      }
    });
    setBlackSwanSimulations(simulationsByType);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // SINGLE SOURCE OF TRUTH: All goal calculations flow through goalCalculationEngine
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const calculateGoalProgress = (goal) => {
    try {
      const metrics = calculateGoalMetrics(goal, holdings);
      return {
        current: metrics.portfolioValue,
        progress: metrics.progressPercent,
        contributed_capital: metrics.initialCapital,
        portfolio_value: metrics.holdingsValue,
        remaining_gap: metrics.remainingGap,
        // Full metrics for advanced calculations
        _full: metrics
      };
    } catch (error) {
      // ═══════════════════════════════════════════════════════════════════════════
      // ARCHITECTURAL FIX: Do NOT swallow errors with fallback zeros
      // Throw error so validation catches it and prevents misleading output
      // ═══════════════════════════════════════════════════════════════════════════
      console.error("❌ CRITICAL: Error calculating goal progress:", error);
      throw new Error(`Goal progress calculation failed for goal "${goal?.goal_name}": ${error.message}`);
    }
  };

  const calculateImpact = (goal, dropPercent) => {
    const { current } = calculateGoalProgress(goal);
    const impactAmount = current * (dropPercent / 100);
    const newProgress = ((current - impactAmount) / goal.target_amount) * 100;
    
    return {
      impactAmount,
      newProgress,
      monthsDelay: Math.ceil((impactAmount / goal.target_amount) * 
        differenceInMonths(new Date(goal.target_date), new Date()))
    };
  };

  const analyzeScenarios = async () => {
    setIsLoading(true);

    const totalValue = holdings.reduce((sum, h) => 
      sum + (h.quantity * (h.current_price || h.average_cost)), 0);

    const holdingsList = holdings.map(h => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      current_value: h.quantity * (h.current_price || h.average_cost)
    }));

    const prompt = `FETCH AND ANALYZE ACTUAL 5-YEAR HISTORICAL STOCK DATA:

    Portfolio: ${holdingsList.map(h => `${h.symbol} ($${(h.current_value || 0).toLocaleString()})`).join(', ')}
    Total Value: $${(totalValue || 0).toLocaleString()}
    Date Range: December 2020 to December 2025 (5 years)

    STEP 1 - LOOKUP REAL HISTORICAL PRICES FROM YAHOO FINANCE:
    For each symbol (SOUN, AAPL, GPRO, UAA, UA, GOOGL, TSLA, WW):
    - Price in Dec 2020
    - Price in Dec 2025 (current)
    - Calculate 5-year return: ((Dec2025 - Dec2020) / Dec2020) × 100

    Example format:
    AAPL: $132 (Dec 2020) → $250 (Dec 2025) = 89% gain over 5 years
    TSLA: $235 (Dec 2020) → $425 (Dec 2025) = 81% gain over 5 years

    STEP 2 - CALCULATE ACTUAL PORTFOLIO PERFORMANCE:
    Weight each stock by current portfolio value:
    - Total return = Σ (stock_weight × stock_5yr_return)
    - Annualized = ((1 + total_return/100)^0.2 - 1) × 100

    Example: If portfolio is 40% AAPL (89% return) + 60% GOOGL (67% return):
    Total 5yr return = 0.4×89 + 0.6×67 = 76%
    Annual return = ((1.76)^0.2 - 1) × 100 = 12%

    STEP 3 - OPTIMAL STRATEGY (HINDSIGHT):
    Identify top 3 performers from portfolio stocks
    Simulate 60/30/10 allocation to best performers
    Calculate what return WOULD have been

    STEP 4 - CONSERVATIVE (60/40 S&P/BONDS):
    S&P 500 Dec 2020: ~3,756
    S&P 500 Dec 2025: ~6,000 = 60% total 5yr return
    10-year Treasury bonds: ~3% annual = 16% total 5yr
    Blended: 0.6×60 + 0.4×16 = 42% total, 7.3% annual

    STEP 5 - MISSED OPPORTUNITY:
    Dollar amount = (Optimal% - Actual%) / 100 × $${(totalValue || 0).toLocaleString()}
    Example: (95% - 76%) / 100 × $100,000 = $19,000

    OUTPUT FORMAT - USE WHOLE NUMBER PERCENTAGES:
    {
    "actual_scenario": {
    "five_year_return": 76,     // NOT 0.76
    "annual_return": 12,         // NOT 0.12
    "risk_level": "High",
    "description": "Tech-heavy portfolio with AAPL, GOOGL, TSLA achieved solid gains but high volatility"
    },
    "optimal_scenario": {
    "five_year_return": 95,
    "annual_return": 14,
    "key_changes": ["Overweight TSLA 60%", "AAPL 30%", "GOOGL 10%"]
    },
    "conservative_scenario": {
    "five_year_return": 42,
    "annual_return": 7
    },
    "missed_opportunity": {
    "potential_gain": 19000,    // Dollar amount, NOT 0.19
    "description": "By not overweighting top performers"
    },
    "benchmark_comparison": {
    "sp500_return": 60,
    "vs_portfolio": "Portfolio outperformed S&P 500 by 16 percentage points"
    }
    }`;

    try {
      const result = await awsApi.invokeLLM(prompt, true, {
        type: "object",
        properties: {
          actual_scenario: {
            type: "object",
            properties: {
              five_year_return: { type: "number" },
              annual_return: { type: "number" },
              risk_level: { type: "string" },
              description: { type: "string" }
            }
          },
          optimal_scenario: {
            type: "object",
            properties: {
              five_year_return: { type: "number" },
              annual_return: { type: "number" },
              risk_level: { type: "string" },
              description: { type: "string" },
              key_changes: { type: "array", items: { type: "string" } }
            }
          },
          conservative_scenario: {
            type: "object",
            properties: {
              five_year_return: { type: "number" },
              annual_return: { type: "number" },
              risk_level: { type: "string" },
              description: { type: "string" },
              key_changes: { type: "array", items: { type: "string" } }
            }
          },
          missed_opportunity: {
            type: "object",
            properties: {
              potential_gain: { type: "number" },
              description: { type: "string" }
            }
          },
          benchmark_comparison: {
            type: "object",
            properties: {
              sp500_return: { type: "number" },
              vs_portfolio: { type: "string" }
            }
          }
        }
      });

      setScenarios(result);
    } catch (error) {
      console.error("Error analyzing scenarios:", error);
      alert("Error analyzing scenarios. Please try again.");
    }

    setIsLoading(false);
  };

  const handleAddGoal = async () => {
    const userId = localStorage.getItem("user_id");
    if (!newGoal.goal_name || !newGoal.target_amount || !newGoal.target_date) {
      alert("⚠️ Missing Fields: Please ensure Name, Target Amount, and Date are filled.");
      return;
    }
    try {
      const goalData = {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        current_allocation: parseFloat(newGoal.current_allocation || 0),
        userId
      };
      if (editingGoalId) {
        await awsApi.updatePortfolioGoal(userId, editingGoalId, goalData);
      } else {
        const createdGoal = await awsApi.createPortfolioGoal(goalData);
        if (createdGoal) generateRecommendations(createdGoal);
      }
      setShowAddGoal(false);
      setEditingGoalId(null);
      setNewGoal({ goal_name: "", goal_type: "retirement", target_amount: "", target_date: "", priority: "medium", target_amount: "", target_date: "", current_allocation: "", assigned_holdings: [], priority: "medium" });
      await loadData();
    } catch (error) {
      console.error("❌ Goal Save Error:", error);
      alert("Critical Error: Could not save goal.");
    }
  };

  const handleEditGoal = (goal) => {
    setNewGoal({
      goal_name: goal.goal_name,
      goal_type: goal.goal_type,
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date,
      current_allocation: goal.current_allocation?.toString() || "",
      assigned_holdings: goal.assigned_holdings || [],
      priority: goal.priority
    });
    setEditingGoalId(goal.id);
    setShowAddGoal(true);
  };

  const handleDeleteGoal = async (goal) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      const userId = localStorage.getItem('user_id');
      await awsApi.deletePortfolioGoal(goal.id, goal.user_email);
      await loadData();
      setRecommendations(prev => {
        const updated = { ...prev };
        delete updated[goal.id];
        return updated;
      });
      loadData();
    }
  };

  const generateRecommendations = async (goal) => {
    setIsGeneratingReco(goal.id);
    
    const monthsToGoal = differenceInMonths(new Date(goal.target_date), new Date());
    
    const targetAmount = goal.target_amount;
    const initialCapital = goal.current_allocation || Math.max(50000, targetAmount * 0.25);
    const monthlyContribution = monthsToGoal > 0 ? (targetAmount - initialCapital) / monthsToGoal : 0;

    // Calculate all scenarios using JavaScript (deterministic and instant)
    const savingsScenarios = generateSavingsScenarios(targetAmount, monthsToGoal);
    const investmentScenarios = generateInvestmentScenarios(targetAmount, initialCapital, monthlyContribution);

    // ═══════════════════════════════════════════════════════════════════════════════
    // RECOMMENDATION GENERATION: With Fallback & Validation
    // ═══════════════════════════════════════════════════════════════════════════════
    
    let llmResult = null;
    let usedFallback = false;

    // Use LLM only for text descriptions and sample allocation
    const prompt = `Generate savings plan rationale and example stock allocation for a ${goal.goal_type} goal:

Target: $${(targetAmount || 0).toLocaleString()} in ${monthsToGoal} months
Initial Capital: $${Math.round(initialCapital || 0).toLocaleString()}
Monthly Contribution: $${Math.round(monthlyContribution || 0).toLocaleString()}

Provide:
1. Brief rationale for the initial contribution (focus on commitment, financial discipline) - 2 sentences
2. Brief rationale for the monthly contribution (focus on consistency, goal achievement) - 2 sentences
3. EXAMPLE stock allocation across 5 diversified companies:
   - Symbol and name
   - Allocation percentage (must sum to 100%)
   - Initial amount: allocation_percentage% of $${Math.round(initialCapital || 0)}
   - Monthly amount: allocation_percentage% of $${Math.round(monthlyContribution || 0)}
   - Brief rationale (sector diversification focus)
4. Strong disclaimer emphasizing this is EXAMPLE ONLY, NOT a recommendation, applies to both initial and monthly contributions, high risk, potential total loss

CRITICAL: Focus on disciplined saving, not investment returns or strategies.`;

    try {
      llmResult = await awsApi.invokeLLM(prompt, true, {
        type: "object",
        properties: {
          initial_investment: {
            type: "object",
            properties: {
              rationale: { type: "string" }
            }
          },
          monthly_contribution: {
            type: "object",
            properties: {
              rationale: { type: "string" }
            }
          },
          sample_allocation: {
            type: "object",
            properties: {
              disclaimer: { type: "string" },
              companies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    name: { type: "string" },
                    allocation_percentage: { type: "number" },
                    initial_amount: { type: "number" },
                    monthly_amount: { type: "number" },
                    rationale: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      // Fall through to use fallback allocation
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // USE FALLBACK if LLM failed or returned incomplete data
    // ═══════════════════════════════════════════════════════════════════════════════
    
    let sampleAllocation = null;
    if (llmResult?.sample_allocation?.companies && llmResult.sample_allocation.companies.length > 0) {
      sampleAllocation = llmResult.sample_allocation;
    } else {
      // Generate fallback allocation (explicit, not silent)
      sampleAllocation = generateFallbackAllocation(Math.round(initialCapital || 0), Math.round(monthlyContribution || 0));
      usedFallback = true;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // BUILD FINAL RECOMMENDATION WITH VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const fullRecommendation = {
      plan_type: "Goal-Based Investment Plan",
      initial_investment: {
        amount: Math.round(initialCapital || 0),
        rationale: llmResult?.initial_investment?.rationale || "Strategic initial contribution to establish strong foundation for goal."
      },
      monthly_contribution: {
        amount: Math.round(monthlyContribution || 0),
        rationale: llmResult?.monthly_contribution?.rationale || "Consistent monthly contributions ensure steady progress toward goal."
      },
      savings_scenarios: savingsScenarios,
      investment_scenarios: investmentScenarios,
      sample_allocation: sampleAllocation,
      usedFallback: usedFallback
    };

    // Validate recommendation before storing
    const metrics = calculateGoalMetrics(goal, holdings);
    const validation = validateGoalAnalysis(goal, metrics, fullRecommendation);
    
    if (!validation.isValid) {
      console.warn("⚠️ Recommendation validation warnings:", validation.errors);
    }

    setRecommendations(prev => ({
      ...prev,
      [goal.id]: fullRecommendation
    }));

    // ═══════════════════════════════════════════════════════════════════════════════
    // SYNC INITIAL CAPITAL TO GOAL: Ensure progress calculation reflects recommendation
    // ═══════════════════════════════════════════════════════════════════════════════
    if (goal.current_allocation === 0 || !goal.current_allocation) {
      const userId = localStorage.getItem('user_id');
      await awsApi.updatePortfolioGoal(userId, goal.id, {
        current_allocation: Math.round(initialCapital || 0)
      });
    }

    setIsGeneratingReco(null);
  };

  const simulateHistoricalCrises = async () => {
    setIsSimulatingCrisis(true);
    
    const holdingsList = holdings.map(h => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      value: h.quantity * (h.current_price || h.average_cost)
    }));

    const totalValue = holdingsList.reduce((sum, h) => sum + h.value, 0);

    const prompt = `EDUCATIONAL CRISIS SIMULATION - Historical Accuracy Required

Current Portfolio: ${JSON.stringify(holdingsList)}
Total Value: $${(totalValue || 0).toLocaleString()}

CRITICAL ACCURACY RULES:
1. Use ONLY historically accurate recovery times from market data (S&P 500 / NASDAQ Composite)
2. Reference sectors (e.g., "Tech sector", "Consumer discretionary") instead of stocks that didn't exist
3. Clearly state which current holdings existed vs. didn't exist during each crisis
4. Differentiate between partial recovery and full recovery where relevant
5. Use consistent index terminology (S&P 500 for broad market, NASDAQ Composite for tech)

For EACH crisis below, provide these exact fields:

1. 2008 FINANCIAL CRISIS (Oct 2007 peak - Mar 2009 trough)
   Historical Facts: S&P 500 dropped 57%, full recovery to pre-crisis levels took 49 months (April 2013)
   
2. 2020 COVID CRASH (Feb 2020 peak - Mar 2020 trough)
   Historical Facts: S&P 500 dropped 34%, recovered to breakeven by August 2020 (5 months)
   
3. 2000 DOT-COM BUBBLE (Mar 2000 peak - Oct 2002 trough)
   Historical Facts: NASDAQ dropped 78% (full recovery 15 years), S&P 500 dropped 49% (partial recovery 2006, full recovery 2007)
   
4. 1970s-80s HIGH INFLATION (1973-1974 oil crisis through early 1980s)
   Historical Facts: S&P 500 dropped 48% (1973-74), extended bear market and stagflation through early 1980s

For each crisis provide:
{
  "name": "Crisis name with dates",
  "drawdown_percent": <number based on user's sector mix>,
  "recovery_months": <historically accurate number>,
  "story": "Concise educational narrative with bullet points:
    • Holdings Status: Which current stocks existed vs didn't exist
    • Sector Impact: How tech/consumer/other sectors performed
    • Recovery Path: Actual timeline based on S&P 500 or NASDAQ data
    • Investor Experience: What holding through would have meant
    Keep it readable and educational.",
  "worst_hit_asset": "Tech-heavy sectors" or "Growth stocks" or "NASDAQ Composite" or "Broad market" (use softer sector-level terms for older crises where precise stock data is limited)
}

Example Story: "Your tech-heavy portfolio would have declined approximately 55% during the 2008 crisis.

• Holdings Status: AAPL and GOOGL existed and fell 50-60%. TSLA, SOUN, GPRO didn't exist yet.
• Sector Impact: Financial sector collapsed, tech followed consumer spending declines.
• Recovery Path: S&P 500 took 49 months (April 2013) for full recovery. NASDAQ Composite recovered in ~40 months.
• Investor Experience: Holding through the trough would have tested discipline, but long-term holders recovered.

This simulation illustrates past market behavior; future results may differ."

OUTPUT: Provide historically accurate, educational narratives that maintain credibility.`;

    try {
      const result = await awsApi.invokeLLM(prompt, true, {
        type: "object",
        properties: {
          crisis_2008: {
            type: "object",
            properties: {
              name: { type: "string" },
              drawdown_percent: { type: "number" },
              recovery_months: { type: "number" },
              story: { type: "string" },
              worst_hit_asset: { type: "string" }
            }
          },
          crisis_covid: {
            type: "object",
            properties: {
              name: { type: "string" },
              drawdown_percent: { type: "number" },
              recovery_months: { type: "number" },
              story: { type: "string" },
              worst_hit_asset: { type: "string" }
            }
          },
          crisis_dotcom: {
            type: "object",
            properties: {
              name: { type: "string" },
              drawdown_percent: { type: "number" },
              recovery_months: { type: "number" },
              story: { type: "string" },
              worst_hit_asset: { type: "string" }
            }
          },
          crisis_inflation: {
            type: "object",
            properties: {
              name: { type: "string" },
              drawdown_percent: { type: "number" },
              recovery_months: { type: "number" },
              story: { type: "string" },
              worst_hit_asset: { type: "string" }
            }
          }
        }
      });

      setCrisisSimulation(result);
    } catch (error) {
      console.error("Error simulating crises:", error);
      alert("Error simulating historical crises. Please try again.");
    }

    setIsSimulatingCrisis(false);
  };

  const generateCustomRecommendations = async () => {
    setIsGeneratingCustomReco(true);

    const initial = parseFloat(customInitial);
    const monthly = parseFloat(customMonthly) || 0;

    const selectedGoal = goals.find(g => g.id === selectedGoalForReco);
    const goalContext = selectedGoal 
      ? `- Selected Goal: ${selectedGoal.goal_name}
- Goal Target: $${(selectedGoal?.target_amount || 0).toLocaleString()}
- Goal Date: ${format(new Date(selectedGoal.target_date), 'MMM d, yyyy')}
- Goal Type: ${selectedGoal.goal_type}
- Priority: ${selectedGoal.priority}
- Time to Goal: ${differenceInMonths(new Date(selectedGoal.target_date), new Date())} months`
      : '- Selected Goal: None (general investment strategy)';

    const prompt = `As a certified financial advisor, analyze this investment profile and provide personalized stock recommendations:

Investment Profile:
- Initial Investment: $${(initial || 0).toLocaleString()}
- Monthly Contribution: $${(monthly || 0).toLocaleString()}
${goalContext}

Provide:

1. RISK PROFILE ASSESSMENT:
   - Risk Tolerance: Conservative/Moderate/Aggressive (based on investment amounts)
   - Investment Style: Value/Growth/Balanced
   - Recommended Time Horizon
   - Reasoning for this profile

2. STOCK RECOMMENDATIONS (5-7 diversified stocks):
   For each stock provide:
   - Symbol and company name
   - Sector (diversify across sectors)
   - Allocation percentage (must sum to 100%)
   - Initial purchase amount: allocation% × $${initial}
   - Monthly purchase amount: allocation% × $${monthly}
   - Estimated current price
   - Reasoning: Why this stock fits their profile (growth potential, stability, dividends, etc.)

3. IMPROVEMENT TIPS (4-6 actionable suggestions):
   - How to maximize returns
   - Risk management strategies
   - Diversification improvements
   - Timing strategies (dollar-cost averaging, etc.)
   - Tax efficiency tips
   - Rebalancing recommendations

Make recommendations realistic, diversified (different sectors), and aligned with the investment amounts provided.`;

    try {
      const result = await awsApi.invokeLLM(prompt, true, {
        type: "object",
        properties: {
          risk_profile: { type: "string" },
          investment_style: { type: "string" },
          time_horizon: { type: "string" },
          profile_reasoning: { type: "string" },
          stock_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                company_name: { type: "string" },
                sector: { type: "string" },
                allocation_percent: { type: "number" },
                initial_amount: { type: "number" },
                monthly_amount: { type: "number" },
                estimated_price: { type: "number" },
                reasoning: { type: "string" }
              }
            }
          },
          improvement_tips: {
            type: "array",
            items: { type: "string" }
          }
        }
      });

      setCustomRecommendations(result);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      alert("Error generating recommendations. Please try again.");
    }

    setIsGeneratingCustomReco(false);
  };

  const generateBlackSwanScenario = async (scenario) => {
    setIsGeneratingBlackSwan(true);
    setSelectedBlackSwan(scenario);

    // Check if we already have a saved simulation for this scenario
    if (blackSwanSimulations[scenario]) {
      setBlackSwanResult(blackSwanSimulations[scenario]);
      setIsGeneratingBlackSwan(false);
      return;
    }

    const holdingsList = holdings.map(h => ({
      symbol: h.symbol,
      name: h.name,
      value: h.quantity * (h.current_price || h.average_cost)
    }));

    const totalValue = holdingsList.reduce((sum, h) => sum + h.value, 0);

    const scenarioPrompts = {
      war: "Major geopolitical conflict (Russia-NATO escalation or China-Taiwan)",
      rate_hikes: "Aggressive rate hikes to 8-10% to combat inflation",
      ai_bubble: "AI bubble burst - major AI companies overvalued by 80%",
      housing: "Housing market collapse - 40% price drop nationwide"
    };

    const scenarioGuidelines = {
      war: {
        drawdown: "10-15",
        recovery: 12,
        benefiting: ["Gold", "Government Bonds", "Utilities", "Consumer Staples"],
        narrative_tone: "Tech and consumer discretionary sectors most affected. Defensive assets (utilities, staples, bonds) buffer losses. Moderate recovery timeline."
      },
      rate_hikes: {
        drawdown: "20-30",
        recovery: 18,
        benefiting: ["Cash", "Short-term Treasuries"],
        narrative_tone: "Growth stocks and tech hit hardest. Value and dividend stocks hold better."
      },
      ai_bubble: {
        drawdown: "40-60",
        recovery: 24,
        benefiting: ["Traditional value stocks", "Utilities", "Consumer Staples"],
        narrative_tone: "AI and tech-heavy stocks collapse. Traditional sectors remain stable."
      },
      housing: {
        drawdown: "15-25",
        recovery: 36,
        benefiting: ["REITs at discounts", "Home improvement retailers"],
        narrative_tone: "Real estate and construction hammered. Consumer spending shifts away from housing."
      }
    };

    const guidelines = scenarioGuidelines[scenario];

    const prompt = `Simulate this BLACK SWAN event for the portfolio:

Scenario: ${scenarioPrompts[scenario]}
Portfolio: ${JSON.stringify(holdingsList)}
Total Value: $${(totalValue || 0).toLocaleString()}

SCENARIO-SPECIFIC REQUIREMENTS:
- Immediate Drawdown Range: ${guidelines.drawdown}% (pick ONE whole number within this range)
- Recovery Timeline: ${guidelines.recovery} months
- Defensive Assets: ${guidelines.benefiting.join(", ")}
- Narrative Focus: ${guidelines.narrative_tone}

CRITICAL FORMATTING RULES:
1. immediate_drawdown: INTEGER only (e.g., 12 for 12% decline, NOT 0.12 or 12.5)
2. recovery_months: EXACTLY ${guidelines.recovery}
3. Combine similar stocks: "UAA & UA" as ONE entry (not separate)

ASSET FAILURE ORDER:
- Group similar stocks together (e.g., "UAA & UA")
- Use realistic sector-based ranges:
  * Tech (AAPL, GOOGL, TSLA): 40-60% or 30-50% depending on exposure
  * Consumer Discretionary (UAA & UA): 20-40%
- Include ALL portfolio stocks mentioned in narrative

NARRATIVE REQUIREMENTS:
- Opening: Describe overall portfolio impact with chosen drawdown percentage
- Sectors: "Tech and consumer discretionary sectors most affected"
- Defensive Buffer: Mention "${guidelines.benefiting.join(", ")} may buffer losses"
- Disclaimer: "These decline ranges are illustrative estimates based on historical sector behavior, not exact predictions"
- Recovery: "Markets typically take up to ${guidelines.recovery} months to stabilize and return to pre-crisis levels" (use "moderate" for 12-month timelines)
- Stock Consistency: ONLY mention stocks listed in assets_fail_order

OUTPUT EXAMPLE:
{
  "immediate_drawdown": 12,
  "recovery_months": ${guidelines.recovery},
  "benefiting_assets": ${JSON.stringify(guidelines.benefiting)},
  "assets_fail_order": [
    {"symbol": "AAPL", "impact_range": "40-60%", "reason": "High global supply chain exposure"},
    {"symbol": "GOOGL", "impact_range": "30-50%", "reason": "International advertising revenue risk"},
    {"symbol": "TSLA", "impact_range": "30-50%", "reason": "Global manufacturing, especially China exposure"},
    {"symbol": "UAA & UA", "impact_range": "20-40%", "reason": "Consumer discretionary, both impacted by reduced spending"}
  ],
  "narrative_story": "Portfolio faces estimated 12% decline. Tech sector (AAPL, GOOGL, TSLA) most vulnerable due to global supply chains and international exposure. Consumer discretionary (UAA & UA) moderately affected by spending pullback. Defensive assets like Gold, Government Bonds, and Utilities may buffer losses. These decline ranges are illustrative estimates based on historical sector behavior, not exact predictions. Markets typically take up to 12 months to stabilize and return to pre-crisis levels."
}`;

    try {
      const result = await awsApi.invokeLLM(prompt, true, {
        type: "object",
        properties: {
          scenario_name: { type: "string" },
          immediate_drawdown: { type: "number" },
          drawdown_timeline: { type: "string" },
          recovery_months: { type: "number" },
          assets_fail_order: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                impact_range: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          benefiting_assets: {
            type: "array",
            items: { type: "string" }
          },
          narrative_story: { type: "string" }
        }
      });

      // Save to database
      const userId = localStorage.getItem('user_id');
      await awsApi.createBlackSwanSimulation({
        userId,
        scenario_type: scenario,
        scenario_name: result.scenario_name,
        portfolio_snapshot: holdingsList,
        immediate_drawdown: result.immediate_drawdown,
        drawdown_timeline: result.drawdown_timeline,
        recovery_months: result.recovery_months,
        assets_fail_order: result.assets_fail_order,
        benefiting_assets: result.benefiting_assets,
        narrative_story: result.narrative_story,
        simulation_date: (() => { try { return new Date().toISOString().split('T')[0]; } catch (e) { return new Date().toLocaleDateString().split('/').reverse().join('-'); } })()
      });

      setBlackSwanResult(result);
      await loadBlackSwanSimulations();
    } catch (error) {
      console.error("Error generating black swan:", error);
      alert("Error generating scenario. Please try again.");
    }

    setIsGeneratingBlackSwan(false);
  };

  const getGoalIcon = (type) => {
    switch(type) {
      case "retirement": return <Target className="w-6 h-6" />;
      case "home_purchase": return <Home className="w-6 h-6" />;
      case "education": return <GraduationCap className="w-6 h-6" />;
      case "emergency_fund": return <Shield className="w-6 h-6" />;
      default: return <DollarSign className="w-6 h-6" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getScenarioAllocation = (scenarioName, initialAmount, monthlyAmount) => {
    const allocations = {
      "Conservative Bond-Heavy": [
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "Bond ETF", percent: 40, rationale: "Capital preservation with steady income" },
        { ticker: "AGG", name: "iShares Core US Aggregate Bond ETF", type: "Bond ETF", percent: 30, rationale: "Investment-grade bond exposure" },
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "Equity ETF", percent: 20, rationale: "Broad US equity diversification" },
        { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "Equity ETF", percent: 10, rationale: "International diversification" }
      ],
      "Balanced Growth Plan": [
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "Equity ETF", percent: 40, rationale: "Core US market exposure" },
        { ticker: "VOO", name: "Vanguard S&P 500 ETF", type: "Equity ETF", percent: 20, rationale: "Large-cap stability" },
        { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "Equity ETF", percent: 15, rationale: "Global equity diversification" },
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "Bond ETF", percent: 20, rationale: "Risk mitigation through bonds" },
        { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "REIT ETF", percent: 5, rationale: "Real estate diversification" }
      ],
      "Aggressive Growth": [
        { ticker: "QQQ", name: "Invesco QQQ Trust (NASDAQ-100)", type: "Equity ETF", percent: 35, rationale: "Tech-heavy growth exposure" },
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "Equity ETF", percent: 25, rationale: "Broad market foundation" },
        { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "Equity ETF", percent: 20, rationale: "International/emerging growth" },
        { ticker: "ARKK", name: "ARK Innovation ETF", type: "Equity ETF", percent: 10, rationale: "High-growth innovation focus" },
        { ticker: "Cash", name: "Cash / Speculative Allocation", type: "Cash", percent: 10, rationale: "Opportunistic positioning" }
      ]
    };

    return allocations[scenarioName] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 md:mb-3">
            Goal Intelligence
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-slate-600">
            Connect your investments to your life goals with AI-powered analysis
          </p>
        </motion.div>

        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Portfolio Goals Management</h3>
              <p className="text-sm text-slate-600">Track and analyze how your investments align with life goals</p>
            </div>
            <Button
              onClick={() => setShowAddGoal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
            >
              <Target className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>

        {/* Goal-to-Position Traceability */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Your Goals & Impact Analysis
          </h2>
          
          {goals.length === 0 ? (
            <Card className="border-2 border-slate-200 shadow-lg bg-white">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Goals Yet</h3>
                <p className="text-slate-500 mb-6">
                  Start by adding your financial goals to see how your investments support them
                </p>
                <Button
                  onClick={() => setShowAddGoal(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  Add Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {goals.map((goal) => {
                // ═══════════════════════════════════════════════════════════════════════════
                // CANONICAL PROGRESS: Sync recommendation initial capital to goal entity
                // ═══════════════════════════════════════════════════════════════════════════
                const goalRecommendation = recommendations[goal.id];
                if (goalRecommendation?.initial_investment?.amount && 
                    (!goal.current_allocation || goal.current_allocation === 0)) {
                  goal.current_allocation = goalRecommendation.initial_investment.amount;
                }

                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                // DO NOT REMOVE:
                // Progress values must originate from calculateGoalMetrics()
                // Any deviation is a release blocker.
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                let current, progress, contributed_capital, portfolio_value, metrics;
                let validationError = null;

                try {
                  const result = calculateGoalProgress(goal);
                  
                  // ═══════════════════════════════════════════════════════════════════════════
                  // STRICT WIRING: Use engine output directly - NO fallback logic
                  // Engine guarantees numeric output; any undefined = calculation error
                  // ═══════════════════════════════════════════════════════════════════════════
                  if (result.current === undefined || result.progress === undefined) {
                    throw new Error('Engine returned undefined metrics');
                  }
                  
                  current = result.current;
                  progress = result.progress;
                  contributed_capital = result.contributed_capital;
                  portfolio_value = result.portfolio_value;
                  metrics = result._full;

                  // Dev-only source logging for QA and audit trails
                  console.log('[GoalProgress] source=calculateGoalMetrics', {
                    goalName: goal.goal_name,
                    metrics,
                    initialCapital: goal.current_allocation,
                    progressPercent: progress,
                    progressAmount: current
                  });

                  // ═══════════════════════════════════════════════════════════════════════════
                  // RUNTIME INVARIANT (MANDATORY - DO NOT REMOVE)
                  // If initial capital exists, progress MUST reflect it
                  // This prevents silent financial calculation bugs
                  // ═══════════════════════════════════════════════════════════════════════════
                  if (goal.current_allocation > 0 && progress === 0) {
                    throw new Error(
                      `INVARIANT VIOLATION: initial capital $${goal.current_allocation} not reflected in goal progress. ` +
                      `This is a critical financial accuracy bug that must be fixed before release.`
                    );
                  }
                } catch (error) {
                  // ═══════════════════════════════════════════════════════════════════════════
                  // ERROR HANDLING: Block render if engine fails - NEVER show misleading 0%
                  // ═══════════════════════════════════════════════════════════════════════════
                  validationError = {
                    code: 'CALCULATION_FAILED',
                    message: error.message,
                    severity: 'critical'
                  };
                  console.error(`❌ BLOCKING ERROR: Goal "${goal.goal_name}" calculation failed:`, error);
                }

                const monthsToGoal = differenceInMonths(new Date(goal.target_date), new Date());
                const recommendation = goalRecommendation;

                // ═══════════════════════════════════════════════════════════════════════════════
                // PRE-RENDER VALIDATION: Check capital integrity before displaying progress
                // ═══════════════════════════════════════════════════════════════════════════════

                const validation = validationError 
                  ? { isValid: false, errors: [validationError], warnings: [] }
                  : validateGoalAnalysis(goal, metrics, recommendation);
                const showValidationError = !validation.isValid;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                  >
                    <Card className="border-2 border-slate-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-purple-600">
                              {getGoalIcon(goal.goal_type)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{goal.goal_name}</h3>
                              <Badge variant="outline" className={`${getPriorityColor(goal.priority)} border mt-1`}>
                                {goal.priority} priority
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditGoal(goal)}
                              className="hover:bg-slate-100"
                            >
                              <Pencil className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGoal(goal)}
                              className="hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Progress to Goal</span>
                            <span className="font-semibold text-slate-900">
                              ${(current || 0).toLocaleString()} / ${(goal?.target_amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <Progress value={Math.min(100, progress || 0)} className="h-3" />
                          <p className="text-sm font-medium text-slate-700">
                            {Math.max(0, progress || 0).toFixed(1)}% Complete • {monthsToGoal} months remaining
                          </p>
                          {/* Capital Accounting Transparency */}
                          {goal.current_allocation > 0 && (
                            <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                              <p>💰 Capital Accounting:</p>
                              <p className="ml-4">• Contributed: ${Math.round(contributed_capital || 0).toLocaleString()}</p>
                              <p className="ml-4">• Holdings Value: ${Math.round(portfolio_value || 0).toLocaleString()}</p>
                            </div>
                          )}

                          {goal.assigned_holdings?.length > 0 && (
                            <div className="pt-3 border-t border-slate-100">
                              <p className="text-sm text-slate-600 mb-2">Assigned Holdings:</p>
                              <div className="flex flex-wrap gap-2">
                                {goal.assigned_holdings.map((symbol) => (
                                  <Badge key={symbol} variant="outline" className="bg-slate-50">
                                    {symbol}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {!recommendation && (
                            <Button
                              onClick={() => generateRecommendations(goal)}
                              disabled={isGeneratingReco === goal.id}
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600"
                              size="sm"
                            >
                              {isGeneratingReco === goal.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Get Investment Plan
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                  {showValidationError && !recommendation && (
                    <Card className="border-2 border-red-300 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-red-900 mb-2">Goal Analysis Error</h4>
                            <div className="space-y-2">
                              {validation.errors.map((error, idx) => (
                                <p key={idx} className="text-sm text-red-800">
                                  <strong>{error.code}:</strong> {error.message}
                                  {error.expected && <span className="block text-xs text-red-700 mt-1">Expected: {error.expected}</span>}
                                </p>
                              ))}
                            </div>
                            <p className="text-xs text-red-600 mt-3">
                              This goal cannot be analyzed at this time. Please verify your goal settings (target amount, date, and initial capital are required).
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {recommendation && (
                    <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-blue-600" />
                          Investment Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <SavingsOnlyNarrative />

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Initial Contribution</p>
                            <p className="text-3xl font-bold text-blue-600">
                              ${Math.round(recommendation.initial_investment?.amount || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">{recommendation.initial_investment.rationale}</p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Monthly Contribution</p>
                            <p className="text-3xl font-bold text-emerald-600">
                              ${Math.round(recommendation.monthly_contribution?.amount || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">{recommendation.monthly_contribution.rationale}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Savings Plan Scenarios (No Market Returns)
                          </h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            {recommendation.savings_scenarios?.map((scenario, idx) => (
                              <Card key={idx} className="border-2 border-slate-200 bg-white rounded-xl h-full">
                                <CardContent className="p-4">
                                  <h5 className="font-bold text-slate-900 mb-1">{scenario.name}</h5>
                                  <p className="text-xs text-slate-600 mb-3">{scenario.description}</p>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Initial:</span>
                                      <span className="font-semibold">${Math.round(scenario.initial_investment || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Monthly:</span>
                                      <span className="font-semibold">${Math.round(scenario.monthly_contribution || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-3 border-t border-blue-200 bg-blue-50 -mx-4 px-4 py-3 mt-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-blue-700 text-xs">Timeline:</span>
                                        <span className="text-xl font-bold text-blue-700">{Math.round(scenario.months_to_goal)} months</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                      <span className="text-slate-600 font-semibold">Total Contributions:</span>
                                      <span className="font-bold text-slate-900">${Math.round(scenario.total_invested || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600 font-semibold">Goal Reached:</span>
                                      <span className="font-bold text-emerald-600">${Math.round(scenario.goal_value || scenario.total_invested || 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {recommendation.investment_scenarios && recommendation.investment_scenarios.length > 0 && (
                          <div className="pt-6 border-t-2 border-purple-300">
                            <InvestmentProjectionsNarrative />

                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-purple-600" />
                              Projected Investment Scenarios (Estimates)
                            </h4>
                            <div className="grid md:grid-cols-3 gap-4">
                              {recommendation.investment_scenarios.map((scenario, idx) => {
                                const allocationData = getScenarioAllocation(scenario.name, scenario.initial_investment, scenario.monthly_contribution);
                                const isExpanded = expandedScenarioAllocation === `${goal.id}-${idx}`;

                                return (
                                  <Card key={idx} className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl h-full">
                                    <CardContent className="p-4">
                                      <h5 className="font-bold text-slate-900 mb-1">{scenario.name}</h5>
                                      <p className="text-xs text-slate-600 mb-3">{scenario.description}</p>
                                      
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Initial:</span>
                                          <span className="font-semibold">${Math.round(scenario.initial_investment || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Monthly:</span>
                                          <span className="font-semibold">${Math.round(scenario.monthly_contribution || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Return Rate:</span>
                                          <span className="font-bold text-purple-700">{scenario.annual_return}%/year</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pt-3 border-t border-purple-300 bg-purple-100 -mx-4 px-4 py-3 mt-3">
                                          <div className="flex justify-between items-center">
                                            <span className="text-purple-800 text-xs">Timeline:</span>
                                            <span className="text-xl font-bold text-purple-800">{Math.round(scenario.months_to_goal)} months</span>
                                          </div>
                                        </div>
                                        <div className="flex justify-between pt-2">
                                          <span className="text-slate-600 font-semibold">Total Contributions:</span>
                                          <span className="font-semibold text-slate-900">${Math.round(scenario.total_contributions || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600 text-xs">Estimated Projected Value:</span>
                                          <span className="font-bold text-emerald-600">${Math.round(scenario.projected_value || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600 text-xs">Estimated Growth (Returns):</span>
                                          <span className="font-bold text-purple-700">+${Math.round(scenario.growth_from_returns || 0).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-purple-600 italic mt-2">
                                          *Monthly compounding, end-of-month contributions
                                        </p>
                                      </div>

                                      {/* Example Allocation (Collapsible) */}
                                      <Collapsible
                                       open={isExpanded}
                                       onOpenChange={() => setExpandedScenarioAllocation(isExpanded ? null : `${goal.id}-${idx}`)}
                                       className="mt-4"
                                      >
                                       <CollapsibleTrigger asChild>
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           className="w-full flex items-center justify-between bg-white hover:bg-purple-50"
                                         >
                                           <span className="text-xs font-semibold text-slate-700">
                                             Example Allocation (Illustrative Only)
                                           </span>
                                           {isExpanded ? (
                                             <ChevronUp className="w-4 h-4 text-slate-600" />
                                           ) : (
                                             <ChevronDown className="w-4 h-4 text-slate-600" />
                                           )}
                                         </Button>
                                       </CollapsibleTrigger>
                                       <CollapsibleContent className="mt-3 space-y-2">
                                         <div className="bg-amber-50 rounded-lg p-2 border border-amber-200 mb-3">
                                           <p className="text-xs text-amber-800">
                                             <strong>Example only — not a recommendation.</strong> Illustrates one possible portfolio structure consistent with this risk profile. Not financial advice.
                                           </p>
                                         </div>

                                         {allocationData.length > 0 ? (
                                           <>
                                             {allocationData.map((asset, assetIdx) => {
                                               const initialAlloc = (scenario.initial_investment * asset.percent) / 100;
                                               const monthlyAlloc = (scenario.monthly_contribution * asset.percent) / 100;

                                               return (
                                                 <div key={assetIdx} className="bg-white rounded-lg p-3 border border-slate-200">
                                                   <div className="flex items-start justify-between mb-1">
                                                     <div className="flex-1">
                                                       <div className="flex items-center gap-2 mb-1">
                                                         <p className="text-sm font-bold text-slate-900">{asset.ticker}</p>
                                                         <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                                                           {asset.type}
                                                         </Badge>
                                                       </div>
                                                       <p className="text-xs text-slate-600">{asset.name}</p>
                                                     </div>
                                                     <Badge className="bg-purple-100 text-purple-700 text-xs font-bold ml-2">
                                                       {asset.percent}%
                                                     </Badge>
                                                   </div>
                                                   <p className="text-xs text-slate-600 mt-2 mb-2">{asset.rationale}</p>
                                                   <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                                                     <div>
                                                       <span className="text-slate-500">Initial Amount:</span>
                                                       <p className="font-semibold text-slate-900">${Math.round(initialAlloc || 0).toLocaleString()}</p>
                                                     </div>
                                                     <div>
                                                       <span className="text-slate-500">Monthly Amount:</span>
                                                       <p className="font-semibold text-slate-900">${Math.round(monthlyAlloc || 0).toLocaleString()}</p>
                                                     </div>
                                                   </div>
                                                 </div>
                                               );
                                             })}

                                             <div className="bg-blue-50 rounded-lg p-2 border border-blue-200 mt-3">
                                               <p className="text-xs text-blue-800">
                                                 <strong>Why this fits:</strong> This allocation illustrates a portfolio consistent with the {scenario.annual_return}% return assumption through its risk/reward balance.
                                               </p>
                                             </div>

                                             {/* Scenario-Specific Stress Test */}
                                             <div className="mt-4 pt-3 border-t-2 border-purple-200">
                                               <h6 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                                 <AlertTriangle className="w-4 h-4 text-rose-600" />
                                                 Market Downturn Impact
                                               </h6>
                                               <div className="space-y-2">
                                                 {[
                                                   scenario.annual_return <= 6 ? { drop: 8, label: 'Mild' } : { drop: 10, label: 'Mild' },
                                                   scenario.annual_return <= 6 ? { drop: 15, label: 'Moderate' } : { drop: 20, label: 'Moderate' },
                                                   scenario.annual_return <= 6 ? { drop: 20, label: 'Severe' } : scenario.annual_return >= 10 ? { drop: 35, label: 'Severe' } : { drop: 30, label: 'Severe' }
                                                 ].map(({ drop, label }) => {
                                                   const initialInvestment = Math.round(scenario.initial_investment || 0);
                                                   const monthlyContrib = Math.round(scenario.monthly_contribution || 0);
                                                   const monthsToGoal = differenceInMonths(new Date(goal.target_date), new Date());
                                                   const returnRate = scenario.annual_return / 100;

                                                   const stressMetrics = calculateStressTestMetrics(
                                                     { ...goal, current_allocation: initialInvestment },
                                                     monthlyContrib,
                                                     Math.min(18, monthsToGoal),
                                                     returnRate
                                                   );

                                                   const currentPortfolioValue = stressMetrics.portfolioValueWithGrowth;
                                                   const lossAmount = currentPortfolioValue * (drop / 100);
                                                   const newValue = currentPortfolioValue - lossAmount;

                                                   return (
                                                     <div key={drop} className="bg-white rounded-lg p-2 border border-slate-200">
                                                       <div className="flex items-center justify-between mb-1">
                                                         <span className="text-xs font-semibold text-slate-700">{label} ({drop}% decline)</span>
                                                         <span className="text-xs font-bold text-rose-600">-${Math.round(lossAmount || 0).toLocaleString()}</span>
                                                       </div>
                                                       <div className="flex items-center justify-between text-xs text-slate-600">
                                                         <span>New Value:</span>
                                                         <span className="font-semibold">${Math.round(newValue || 0).toLocaleString()}</span>
                                                       </div>
                                                     </div>
                                                   );
                                                 })}
                                               </div>
                                               <p className="text-xs text-slate-600 mt-2 italic">
                                                 Based on {scenario.annual_return}% return at 18-month midpoint. Continue ${Math.round(scenario.monthly_contribution || 0).toLocaleString()}/month.
                                               </p>
                                             </div>
                                           </>
                                         ) : (
                                           <div className="text-center py-4 text-xs text-slate-500">
                                             No allocation data available for this scenario.
                                           </div>
                                         )}
                                       </CollapsibleContent>
                                      </Collapsible>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>



        {/* Personalized Investment Recommendations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Personalized Investment Builder
          </h2>

          <Card className="border-2 border-indigo-200 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Get Custom Stock Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700">
                Enter your investment details to receive personalized stock recommendations based on your goals, risk tolerance, and financial capacity.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="custom-initial" className="font-semibold">Initial Investment Amount ($)</Label>
                  <Input
                    id="custom-initial"
                    type="number"
                    value={customInitial}
                    onChange={(e) => setCustomInitial(e.target.value)}
                    placeholder="50000"
                    className="h-12 text-lg mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-monthly" className="font-semibold">Monthly Contribution ($)</Label>
                  <Input
                    id="custom-monthly"
                    type="number"
                    value={customMonthly}
                    onChange={(e) => setCustomMonthly(e.target.value)}
                    placeholder="5000"
                    className="h-12 text-lg mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="goal-select" className="font-semibold">Link to Existing Goal (Optional)</Label>
                  <Select value={selectedGoalForReco} onValueChange={setSelectedGoalForReco}>
                    <SelectTrigger id="goal-select" className="h-12 mt-2">
                      <SelectValue placeholder="Select a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None (General Strategy)</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.goal_name} (${(goal.target_amount / 1000).toFixed(0)}k)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateCustomRecommendations}
                disabled={isGeneratingCustomReco || !customInitial || parseFloat(customInitial) <= 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 h-12 text-lg"
              >
                {isGeneratingCustomReco ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Investment Plan
                  </>
                )}
              </Button>

              {customRecommendations && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-6 border-t-2 border-indigo-200"
                >
                  {/* Risk Profile */}
                  <div className="bg-white rounded-lg p-5 border-2 border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Your Investment Profile
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Risk Tolerance</p>
                        <Badge className={`${
                          customRecommendations.risk_profile === 'Conservative' ? 'bg-green-100 text-green-700' :
                          customRecommendations.risk_profile === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        } text-sm px-3 py-1 mt-1`}>
                          {customRecommendations.risk_profile}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Investment Style</p>
                        <p className="font-semibold text-slate-900 mt-1">{customRecommendations.investment_style}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Time Horizon</p>
                        <p className="font-semibold text-slate-900 mt-1">{customRecommendations.time_horizon}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mt-3">{customRecommendations.profile_reasoning}</p>
                  </div>

                  {/* Recommended Stocks */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Recommended Stock Allocation
                    </h4>
                    <div className="grid gap-3">
                      {customRecommendations.stock_recommendations?.map((stock, idx) => (
                        <Card key={idx} className="border-2 border-slate-200 bg-white rounded-xl h-full">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-bold text-lg text-slate-900">{stock.symbol}</h5>
                                  <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                                    {stock.allocation_percent}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">{stock.company_name}</p>
                                <p className="text-xs text-slate-500 mt-1">{stock.sector}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
                              <div className="bg-blue-50 rounded-lg p-2 md:p-3">
                                <p className="text-[10px] md:text-xs text-slate-600">Initial Purchase</p>
                                <p className="text-base md:text-xl font-bold text-blue-600 break-words">
                                  ${Math.round(stock.initial_amount || 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500 mt-1">≈ {Math.floor(stock.initial_amount / (stock.estimated_price || 1))} shares</p>
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-2 md:p-3">
                                <p className="text-[10px] md:text-xs text-slate-600">Monthly Purchase</p>
                                <p className="text-base md:text-xl font-bold text-emerald-600 break-words">
                                  ${Math.round(stock.monthly_amount || 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500 mt-1">≈ {Math.floor(stock.monthly_amount / (stock.estimated_price || 1))} shares</p>
                              </div>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3 text-sm">
                              <p className="font-semibold text-slate-900 mb-1">Why this stock?</p>
                              <p className="text-slate-700">{stock.reasoning}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Improvement Suggestions */}
                  {customRecommendations.improvement_tips && customRecommendations.improvement_tips.length > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border-2 border-amber-200">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-600" />
                        Ways to Optimize Your Strategy
                      </h4>
                      <div className="space-y-3">
                        {customRecommendations.improvement_tips.map((tip, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3">
                            <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">{idx + 1}</span>
                            </div>
                            <p className="text-sm text-slate-700">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <ComprehensiveInvestmentDisclaimer />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Stress Stories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-rose-600" />
            Portfolio Stress Stories
          </h2>

          {/* Historical Crisis Simulation */}
          <Card className="border-2 border-slate-200 shadow-lg bg-white mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Historical Crisis Simulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!crisisSimulation ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-6">
                    See how your portfolio would have performed during major historical events
                  </p>
                  <Button
                    onClick={simulateHistoricalCrises}
                    disabled={isSimulatingCrisis || holdings.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {isSimulatingCrisis ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        Simulate Historical Crises
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(crisisSimulation).map(([key, crisis]) => (
                    <Card key={key} className="border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl h-full">
                      <CardContent className="p-6">
                        <h4 className="font-bold text-slate-900 mb-3">{crisis.name}</h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-xs text-slate-600">Max Drawdown</p>
                            <p className="text-2xl font-bold text-rose-600">-{crisis.drawdown_percent}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Recovery Time</p>
                            <p className="text-2xl font-bold text-emerald-600">{crisis.recovery_months}mo</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-xs text-slate-600 mb-1">Worst Hit</p>
                          <p className="text-sm font-semibold text-slate-900">{crisis.worst_hit_asset}</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{crisis.story}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Black Swan Generator */}
          <Card className="border-2 border-rose-200 shadow-lg bg-gradient-to-br from-rose-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-600" />
                Personalized Black Swan Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-4">
                Choose a potential crisis scenario to see its impact on your portfolio
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Button
                  variant={selectedBlackSwan === 'war' ? 'default' : 'outline'}
                  onClick={() => generateBlackSwanScenario('war')}
                  disabled={isGeneratingBlackSwan || holdings.length === 0}
                  className="h-auto py-3 flex-col"
                >
                  <AlertTriangle className="w-5 h-5 mb-1" />
                  <span className="text-xs">Major War</span>
                </Button>
                <Button
                  variant={selectedBlackSwan === 'rate_hikes' ? 'default' : 'outline'}
                  onClick={() => generateBlackSwanScenario('rate_hikes')}
                  disabled={isGeneratingBlackSwan || holdings.length === 0}
                  className="h-auto py-3 flex-col"
                >
                  <TrendingUp className="w-5 h-5 mb-1" />
                  <span className="text-xs">Rate Hikes</span>
                </Button>
                <Button
                  variant={selectedBlackSwan === 'ai_bubble' ? 'default' : 'outline'}
                  onClick={() => generateBlackSwanScenario('ai_bubble')}
                  disabled={isGeneratingBlackSwan || holdings.length === 0}
                  className="h-auto py-3 flex-col"
                >
                  <Sparkles className="w-5 h-5 mb-1" />
                  <span className="text-xs">AI Bubble Burst</span>
                </Button>
                <Button
                  variant={selectedBlackSwan === 'housing' ? 'default' : 'outline'}
                  onClick={() => generateBlackSwanScenario('housing')}
                  disabled={isGeneratingBlackSwan || holdings.length === 0}
                  className="h-auto py-3 flex-col"
                >
                  <Home className="w-5 h-5 mb-1" />
                  <span className="text-xs">Housing Collapse</span>
                </Button>
              </div>

              {isGeneratingBlackSwan && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-rose-600" />
                  <p className="text-slate-600">Generating scenario...</p>
                </div>
              )}

              {blackSwanResult && !isGeneratingBlackSwan && (
                <div className="space-y-4">
                  <Card className="border-2 border-rose-300 bg-white">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-slate-900 mb-4 text-lg">{blackSwanResult.scenario_name}</h4>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-rose-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Immediate Drawdown</p>
                          <p className="text-3xl font-bold text-rose-600">
                            -{Math.round(Math.abs(blackSwanResult.immediate_drawdown) < 1 
                              ? Math.abs(blackSwanResult.immediate_drawdown) * 100 
                              : Math.abs(blackSwanResult.immediate_drawdown))}%
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{blackSwanResult.drawdown_timeline}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Recovery Time</p>
                          <p className="text-3xl font-bold text-blue-600">{blackSwanResult.recovery_months}</p>
                          <p className="text-xs text-slate-500 mt-1">months</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-slate-700 mb-3">Assets Failing in Order:</p>
                        <div className="space-y-2">
                          {blackSwanResult.assets_fail_order?.slice(0, 5).map((asset, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white rounded p-2">
                              <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-rose-600">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">{asset.symbol}</p>
                                <p className="text-xs text-slate-600">{asset.reason}</p>
                              </div>
                              <p className="text-xs font-bold text-rose-600">{asset.impact_range}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {blackSwanResult.benefiting_assets && blackSwanResult.benefiting_assets.length > 0 && (
                        <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                          <p className="text-xs font-semibold text-slate-700 mb-2">Potentially Benefiting:</p>
                          <p className="text-sm text-slate-700">{blackSwanResult.benefiting_assets.join(', ')}</p>
                        </div>
                      )}

                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Scenario Story:</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{blackSwanResult.narrative_story}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alternative Outcome Engine */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-blue-600" />
            Alternative Outcomes & Regret Analysis
          </h2>

          {!scenarios ? (
            <Card className="border-2 border-slate-200 shadow-lg bg-white">
              <CardContent className="p-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Discover What Could Have Been
                </h3>
                <p className="text-slate-500 mb-6 max-w-2xl mx-auto">
                  See how your portfolio compares to optimal strategies, conservative approaches, 
                  and market benchmarks. Understand missed opportunities and decision quality.
                </p>
                <Button
                  onClick={analyzeScenarios}
                  disabled={isLoading || holdings.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Scenarios
                    </>
                  )}
                </Button>
                {holdings.length === 0 && (
                  <p className="text-sm text-slate-400 mt-3">
                    Add holdings to your portfolio first
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      Your Actual Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                      <p className="text-xs md:text-sm text-slate-600">5-Year Projected Return</p>
                      <p className="text-2xl md:text-3xl font-bold text-slate-900 break-words">
                      {scenarios.actual_scenario.five_year_return}%
                      </p>
                      </div>
                      <div>
                      <p className="text-xs md:text-sm text-slate-600">Annual Return</p>
                      <p className="text-lg md:text-xl font-semibold text-slate-900 break-words">
                      {scenarios.actual_scenario.annual_return}%
                      </p>
                      </div>
                      <Badge className="bg-blue-200 text-blue-900">
                        {scenarios.actual_scenario.risk_level} Risk
                      </Badge>
                      <p className="text-xs md:text-sm text-slate-700 pt-2 break-words">
                        {scenarios.actual_scenario.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-emerald-200 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      Optimal Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">5-Year Projected Return</p>
                        <p className="text-3xl font-bold text-emerald-700">
                          {scenarios.optimal_scenario.five_year_return}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Annual Return</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {scenarios.optimal_scenario.annual_return}%
                        </p>
                      </div>
                      <Badge className="bg-emerald-200 text-emerald-900">
                        {scenarios.optimal_scenario.risk_level} Risk
                      </Badge>
                      <p className="text-sm text-slate-700 pt-2">
                        {scenarios.optimal_scenario.description}
                      </p>
                      {scenarios.optimal_scenario.key_changes && (
                        <div className="pt-2 border-t border-emerald-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1">Key Changes:</p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {scenarios.optimal_scenario.key_changes?.slice(0, 3).map((change, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      Conservative Approach
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">5-Year Projected Return</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {scenarios.conservative_scenario.five_year_return}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Annual Return</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {scenarios.conservative_scenario.annual_return}%
                        </p>
                      </div>
                      <Badge className="bg-slate-200 text-slate-900">
                        {scenarios.conservative_scenario.risk_level} Risk
                      </Badge>
                      <p className="text-sm text-slate-700 pt-2">
                        {scenarios.conservative_scenario.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {scenarios.missed_opportunity && (
                <Card className="border-2 border-amber-200 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                      Missed Opportunity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Potential Gain Difference</p>
                        <p className="text-4xl font-bold text-amber-700">
                          ${(scenarios?.missed_opportunity?.potential_gain || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-700 leading-relaxed">
                          {scenarios.missed_opportunity.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {scenarios.benchmark_comparison && (
                <Card className="border-2 border-indigo-200 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle>Market Benchmark Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-2">S&P 500 Return</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          {scenarios.benchmark_comparison.sp500_return}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Comparison</p>
                        <p className="text-slate-700">
                          {scenarios.benchmark_comparison.vs_portfolio}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={analyzeScenarios}
                variant="outline"
                className="w-full"
              >
                Refresh Analysis
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAddGoal} onOpenChange={(open) => {
        if (!open) {
          setShowAddGoal(false);
          setEditingGoalId(null);
          setNewGoal({ goal_name: "", goal_type: "retirement", target_amount: "", target_date: "", current_allocation: "", assigned_holdings: [], priority: "medium" });
        } else {
          setShowAddGoal(true);
        }
      }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Edit Financial Goal" : "Add Financial Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Retirement Fund"
                value={newGoal.goal_name}
                onChange={(e) => setNewGoal({...newGoal, goal_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Goal Type</Label>
              <Select key={`type-${editingGoalId || "new"}`}
                value={newGoal.goal_type}
                onValueChange={(value) => setNewGoal({...newGoal, goal_type: value})}
              >
                <SelectTrigger>
                  <SelectValue>{newGoal.goal_type ? (newGoal.goal_type.charAt(0).toUpperCase() + newGoal.goal_type.slice(1).replace("_", " ")) : "Select..."}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="home_purchase">Home Purchase</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <Select key={`priority-${editingGoalId || "new"}`}
                value={newGoal.priority}
                onValueChange={(value) => setNewGoal({...newGoal, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue>{newGoal.priority ? (newGoal.priority.charAt(0).toUpperCase() + newGoal.priority.slice(1)) : "Select..."}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGoal} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                {editingGoalId ? "Update Goal" : "Add Goal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Build trigger: Tue Feb 17 06:07:41 PM UTC 2026
