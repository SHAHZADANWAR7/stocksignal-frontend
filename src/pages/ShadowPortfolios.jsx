import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Plus, 
  Pencil, 
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  Home,
  Briefcase,
  Plane,
  Sparkles,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { checkUsageLimit, incrementUsage, getRemainingUsage } from "@/components/utils/usageLimit";
import {
  calculateRealisticViabilityScore,
  generateFinancialProjection,
  validateIncomeSource,
  explainCapitalChange,
  validateShadowPortfolioResults,
  assertProjectionChartData,
  getSustainabilityLabel,
  getSustainabilityColor,
  validateBeforeRender
} from "@/components/utils/validation/shadowPortfolioValidation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ShadowPortfolios() {
  const [scenarios, setScenarios] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPortfolio, setCurrentPortfolio] = useState(null);
  const [simulationResults, setSimulationResults] = useState({});
  const [simulatingId, setSimulatingId] = useState(null);
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [formData, setFormData] = useState({
    scenario_name: "",
    scenario_type: "custom",
    description: "",
    hypothetical_holdings: [],
    total_value: "",
    monthly_income: "",
    monthly_expenses: "",
    notes: ""
  });

  useEffect(() => {
    loadScenarios();
    loadCurrentPortfolio();
    loadRemainingUsage();
  }, []);

  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

  useEffect(() => {
    // Load cached simulation results from database
    const savedResults = {};
    scenarios.forEach(scenario => {
      if (scenario.simulation_results) {
        savedResults[scenario.id] = scenario.simulation_results;
      }
    });
    setSimulationResults(savedResults);
  }, [scenarios]);

  const loadScenarios = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    
    const data = await awsApi.getShadowPortfolios(userId);
    setScenarios(data || []);
  };

  const loadCurrentPortfolio = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;

      const portfolio = await awsApi.getPortfolio(userId);
      
      if (portfolio && portfolio.assets) {
        const assets = portfolio.assets || [];
        const totalValue = portfolio.totalValue || 0;
        const totalCost = assets.reduce((sum, a) => sum + (a.quantity * a.avgCost), 0);
        
        setCurrentPortfolio({
          value: totalValue,
          cost: totalCost,
          gain: totalValue - totalCost,
          holdings: assets
        });
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
    }
  };

  const handleSubmit = async () => {
    const userId = localStorage.getItem('user_id');
    const data = {
      ...formData,
      total_value: parseFloat(formData.total_value) || 0,
      monthly_income: parseFloat(formData.monthly_income) || 0,
      monthly_expenses: parseFloat(formData.monthly_expenses) || 0,
      userId
    };

    try {
      if (editingId) {
        await awsApi.syncPortfolio(userId, editingId, data);
      } else {
        await awsApi.syncPortfolio(data);
      }

      setShowDialog(false);
      resetForm();
      loadScenarios();
    } catch (error) {
      console.error("Error saving shadow portfolio:", error);
      alert("Error: This portfolio may have been deleted. Refreshing...");
      setShowDialog(false);
      resetForm();
      loadScenarios();
    }
  };

  const handleEdit = (scenario) => {
    setFormData({
      scenario_name: scenario.scenario_name,
      scenario_type: scenario.scenario_type,
      description: scenario.description || "",
      hypothetical_holdings: scenario.hypothetical_holdings || [],
      total_value: scenario.total_value?.toString() || "",
      monthly_income: scenario.monthly_income?.toString() || "",
      monthly_expenses: scenario.monthly_expenses?.toString() || "",
      notes: scenario.notes || ""
    });
    setEditingId(scenario.id);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this shadow portfolio?")) {
      try {
        const userId = localStorage.getItem('user_id');
        await awsApi.syncPortfolio(userId, id);
        loadScenarios();
      } catch (error) {
        console.error("Error deleting shadow portfolio:", error);
        alert("Error: Portfolio may already be deleted. Refreshing...");
        loadScenarios();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      scenario_name: "",
      scenario_type: "custom",
      description: "",
      hypothetical_holdings: [],
      total_value: "",
      monthly_income: "",
      monthly_expenses: "",
      notes: ""
    });
    setEditingId(null);
  };

  const getScenarioIcon = (type) => {
    switch(type) {
      case "career_change": return <Briefcase className="w-6 h-6" />;
      case "relocation": return <Plane className="w-6 h-6" />;
      case "early_retirement": return <Home className="w-6 h-6" />;
      case "lifestyle_change": return <Sparkles className="w-6 h-6" />;
      default: return <GitBranch className="w-6 h-6" />;
    }
  };

  const getScenarioColor = (type) => {
    switch(type) {
      case "career_change": return "bg-blue-100 text-blue-700 border-blue-200";
      case "relocation": return "bg-purple-100 text-purple-700 border-purple-200";
      case "early_retirement": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "lifestyle_change": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const calculateNetCashflow = (scenario) => {
    const income = scenario.monthly_income || 0;
    const expenses = scenario.monthly_expenses || 0;
    return income - expenses;
  };

  const calculateProjection = (startingValue, monthlyIncome, monthlyExpenses) => {
    const MONTHLY_RETURN = 0.08 / 12; // 8% annual = 0.667% monthly
    const projection = [];
    
    let portfolioValue = startingValue;
    let cumulativeSavings = 0;
    const netCashflow = monthlyIncome - monthlyExpenses;
    
    for (let year = 0; year <= 10; year++) {
      projection.push({
        year,
        portfolio_value: Math.round(portfolioValue),
        cumulative_savings: Math.round(cumulativeSavings)
      });
      
      // Calculate next year (12 months of compounding)
      if (year < 10) {
        for (let month = 0; month < 12; month++) {
          portfolioValue = portfolioValue * (1 + MONTHLY_RETURN) + netCashflow;
          cumulativeSavings += netCashflow;
        }
      }
    }
    
    return projection;
  };

  const runSimulation = async (scenario) => {
    // Check usage limit
    const limitCheck = await checkUsageLimit('premium');
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    setSimulatingId(scenario.id);

    // FINANCIAL VALIDATION ENGINE
    const incomeValidation = validateIncomeSource(
      scenario.monthly_income || 0,
      scenario.total_value || 0,
      scenario.scenario_type
    );
    
    const viabilityCalc = calculateRealisticViabilityScore(scenario, currentPortfolio);
    
    const capitalChange = currentPortfolio 
      ? explainCapitalChange(currentPortfolio.value, scenario.total_value || 0)
      : null;
    
    // DETERMINISTIC PROJECTION with clear assumptions
    const projectionData = generateFinancialProjection(
      scenario.total_value || 0,
      scenario.monthly_income || 0,
      scenario.monthly_expenses || 0,
      10,
      {
        annualReturn: 0.08,
        inflationRate: 0.03,
        includeWithdrawals: true
      }
    );
    
    const netCashflow = calculateNetCashflow(scenario);
    const runwayMonths = netCashflow < 0 
      ? Math.floor((scenario.total_value || 0) / Math.abs(netCashflow))
      : 999;

    const prompt = `You are a financial advisor analyzing a life scenario change. I've calculated mathematical projections with strict financial validation - you provide strategic analysis.

CRITICAL CONTEXT RULES:
1. The CALCULATED_VIABILITY_SCORE is mathematically derived - you MUST use it as-is
2. Income sources have been validated - respect the breakdown provided
3. If warnings exist, acknowledge them in your analysis
4. Be realistic and conservative - this is an educational platform

CURRENT PORTFOLIO:
${currentPortfolio ? `
- Total Value: $${currentPortfolio.value.toLocaleString()}
- Total Cost: $${currentPortfolio.cost.toLocaleString()}
- Gain/Loss: $${currentPortfolio.gain.toLocaleString()}
- Holdings: ${currentPortfolio.holdings.length} assets
` : "No current portfolio data available"}

HYPOTHETICAL SCENARIO:
- Name: ${scenario.scenario_name}
- Type: ${scenario.scenario_type}
- Description: ${scenario.description || "None"}
- Portfolio Value: $${(scenario.total_value || 0).toLocaleString()}
- Monthly Income: $${(scenario.monthly_income || 0).toLocaleString()}
- Monthly Expenses: $${(scenario.monthly_expenses || 0).toLocaleString()}

CALCULATED_VIABILITY_SCORE: ${viabilityCalc.score}/100
(DO NOT recalculate - use this exact value)

INCOME SOURCE BREAKDOWN:
${incomeValidation.incomeBreakdown ? `
- Portfolio-derived (3.5% withdrawal): $${Math.round(incomeValidation.incomeBreakdown.portfolio_derived).toLocaleString()}/mo
- Assumed external income: $${Math.round(incomeValidation.incomeBreakdown.assumed_external).toLocaleString()}/mo
- Implied portfolio yield: ${incomeValidation.incomeBreakdown.portfolio_yield_percent.toFixed(1)}%/year
` : 'Income validation failed - unrealistic assumptions detected'}

VALIDATION WARNINGS:
${viabilityCalc.warnings.length > 0 ? viabilityCalc.warnings.map(w => `- [${w.severity.toUpperCase()}] ${w.message}`).join('\n') : 'None'}

${capitalChange ? `CAPITAL ACCOUNTING:
- Portfolio change: $${Math.abs(capitalChange.difference).toLocaleString()} (${capitalChange.percentChange >= 0 ? '+' : ''}${capitalChange.percentChange.toFixed(1)}%)
- ${capitalChange.explanation}
` : ''}

FINANCIAL METRICS:
- Net Cashflow: $${netCashflow.toLocaleString()}/mo
- Runway: ${runwayMonths === 999 ? 'Sustainable (positive cashflow)' : runwayMonths + ' months'}
- 10Y Projection: $${projectionData.summary.ending_value.toLocaleString()}
- Investment Growth (10Y): $${projectionData.summary.investment_growth.toLocaleString()}

${scenario.hypothetical_holdings && scenario.hypothetical_holdings.length > 0 ? `
HYPOTHETICAL HOLDINGS TO ANALYZE:
${scenario.hypothetical_holdings.map(h => `- ${h.symbol} (${h.name}): ${h.quantity} shares`).join('\n')}
` : ''}

Provide QUALITATIVE analysis (DO NOT recalculate viability score - it's already provided):

1. RISK ANALYSIS (reference the validation warnings):
   - Major risks (list 3-5 specific risks)
   - Risk level: low, medium, or high
   - Mitigation strategies

2. KEY INSIGHTS:
   - 3-5 actionable insights specific to this scenario
   - Reference income breakdown and capital accounting if relevant
   - What would improve viability score?
   - Timeline recommendations

3. COMPARISON WITH CURRENT:
   - What you gain in this scenario
   - What you lose/sacrifice
   - Overall verdict: recommended, consider carefully, or not recommended

${scenario.hypothetical_holdings && scenario.hypothetical_holdings.length > 0 ? `
5. HOLDINGS ANALYSIS (if holdings provided):
   For each hypothetical holding, provide:
   - Short-term outlook (3-6 months): Expected volatility, near-term catalysts/risks
   - Long-term outlook (3-5 years): Growth potential, competitive advantages, sector trends
   - Volatility level: low, moderate, or high
   - Risk assessment: What could go wrong with this stock?
   - Better alternatives: As a STRING listing 2-3 similar stocks with brief reasons
   - Overall recommendation: buy, hold, or avoid
` : ''}

Focus on strategic, lifestyle, and qualitative factors - NOT numerical calculations.`;

    try {
      const result = await awsApi.invokeLLM(prompt, true, {
        type: "object",
        properties: {
          major_risks: { type: "array", items: { type: "string" } },
          risk_level: { type: "string" },
          mitigation_strategies: { type: "array", items: { type: "string" } },
          key_insights: { type: "array", items: { type: "string" } },
          what_you_gain: { type: "array", items: { type: "string" } },
          what_you_lose: { type: "array", items: { type: "string" } },
          verdict: { type: "string" }
        },
        required: ["major_risks", "risk_level", "key_insights", "verdict"]
      });

      // Separate call for holdings analysis if holdings exist
      let holdingsAnalysis = [];
      if (scenario.hypothetical_holdings && scenario.hypothetical_holdings.length > 0) {
        try {
          const holdingsPrompt = `Analyze these holdings briefly:
${scenario.hypothetical_holdings.map(h => `- ${h.symbol} (${h.name})`).join('\n')}

For each holding, provide: symbol, short_term_outlook (1 sentence), long_term_outlook (1 sentence), volatility_level (low/moderate/high), risk_assessment (1 sentence), alternatives (comma-separated list of 2-3 symbols), recommendation (buy/hold/avoid).`;

          const holdingsResult = await awsApi.invokeLLM(holdingsPrompt, true, {
            type: "object",
            properties: {
              holdings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    short_term_outlook: { type: "string" },
                    long_term_outlook: { type: "string" },
                    volatility_level: { type: "string" },
                    risk_assessment: { type: "string" },
                    alternatives: { type: "string" },
                    recommendation: { type: "string" }
                  }
                }
              }
            }
          });
          holdingsAnalysis = holdingsResult.holdings || [];
        } catch (error) {
          console.error("Holdings analysis failed:", error);
          holdingsAnalysis = [];
        }
      }

      // Merge validated calculations with AI analysis
      const finalResult = {
        ...result,
        holdings_analysis: holdingsAnalysis,
        viability_score: viabilityCalc.score,
        viability_factors: viabilityCalc.factors,
        validation_warnings: viabilityCalc.warnings,
        income_breakdown: incomeValidation.incomeBreakdown,
        capital_accounting: capitalChange,
        runway_months: runwayMonths,
        is_portfolio_sustained: projectionData.is_portfolio_sustained,
        external_income_monthly: projectionData.external_income_monthly,
        projection_data: projectionData.projection,
        projection_assumptions: projectionData.assumptions,
        projection_summary: projectionData.summary,
        portfolio_change_percent: currentPortfolio 
          ? ((scenario.total_value - currentPortfolio.value) / currentPortfolio.value * 100)
          : 0
      };

      // ═══════════════════════════════════════════════════════════════════════
      // PERMANENT VALIDATION CHECKPOINT - DO NOT BYPASS
      // ═══════════════════════════════════════════════════════════════════════
      
      // CHECKPOINT 1: Basic structure validation
      const validation = validateShadowPortfolioResults(finalResult);
      if (!validation.isValid) {
        console.error('❌ Shadow Portfolio validation failed:', validation.errors);
        alert('Simulation completed but has data integrity issues. Please contact support.');
        setSimulatingId(null);
        return; // BLOCK rendering if validation fails
      }
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Shadow Portfolio validation warnings:', validation.warnings);
      }

      // CHECKPOINT 2: Chart data mathematical consistency
      try {
        assertProjectionChartData(finalResult.projection_data);
      } catch (error) {
        console.error('❌ Projection chart data invalid:', error.message);
        alert(`Chart validation failed: ${error.message}\n\nPlease contact support.`);
        setSimulatingId(null);
        return; // BLOCK rendering if chart data is invalid
      }
      
      // CHECKPOINT 3: Complete pre-render validation
      try {
        validateBeforeRender(scenario, finalResult, currentPortfolio);
      } catch (error) {
        console.error('❌ Pre-render validation failed:', error.message);
        alert(`Data integrity check failed: ${error.message}\n\nSimulation cannot be displayed. Please contact support.`);
        setSimulatingId(null);
        return; // BLOCK rendering if pre-render validation fails
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // ALL VALIDATIONS PASSED - SAFE TO RENDER
      // ═══════════════════════════════════════════════════════════════════════

      setSimulationResults(prev => ({
        ...prev,
        [scenario.id]: finalResult
      }));

      // Increment usage counter
      await incrementUsage('premium');

      // Save simulation results to database
      const userId = localStorage.getItem('user_id');
      await awsApi.syncPortfolio(userId, scenario.id, {
        simulation_results: finalResult
      });

      // Reload scenarios to get updated data
      await loadScenarios();
      loadRemainingUsage();
      } catch (error) {
      console.error("Simulation error:", error);
      alert("Error running simulation. Please try again.");
      }

      setSimulatingId(null);
  };

  const getViabilityColor = (score) => {
    if (score >= 70) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getVerdictIcon = (verdict) => {
    if (verdict?.includes("recommended")) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (verdict?.includes("not recommended")) return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    return <Eye className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-1 md:mb-2">
              Shadow Portfolios
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-slate-600">
              Model life scenarios with hypothetical portfolios
            </p>
            {remainingUsage && (
              <p className="text-sm text-blue-600 mt-1">
                {remainingUsage.premium_remaining} simulations remaining this week
              </p>
            )}
          </div>
        </motion.div>

        {/* Privacy Notice */}
        <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2">Privacy-First Platform</h3>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-slate-900 mb-1">Zero Integration</p>
                    <p className="text-slate-600">No bank linking, no Plaid, manual input only</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-slate-900 mb-1">No Data Selling</p>
                    <p className="text-slate-600">Your financial data stays private</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-slate-900 mb-1">Local Control</p>
                    <p className="text-slate-600">You own your data, encrypted storage</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Scenario
          </Button>
        </div>

        {scenarios.length === 0 ? (
          <Card className="border-2 border-slate-200 shadow-lg bg-white">
            <CardContent className="p-12 text-center">
              <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Shadow Portfolios Yet</h3>
              <p className="text-slate-500 mb-6">
                Create hypothetical scenarios to explore different life paths
              </p>
              <div className="grid md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="bg-slate-50 rounded-lg p-3 text-left">
                  <p className="text-sm font-semibold text-slate-900">Career Change</p>
                  <p className="text-xs text-slate-600">New job, different income</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-left">
                  <p className="text-sm font-semibold text-slate-900">Relocation</p>
                  <p className="text-xs text-slate-600">Move to another country</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-left">
                  <p className="text-sm font-semibold text-slate-900">Early Retirement</p>
                  <p className="text-xs text-slate-600">Retire at 45, 50, or 55</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-left">
                  <p className="text-sm font-semibold text-slate-900">Custom</p>
                  <p className="text-xs text-slate-600">Any scenario you imagine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {scenarios.map((scenario) => {
              const netCashflow = calculateNetCashflow(scenario);
              return (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-2 border-slate-200 shadow-lg bg-white hover:shadow-xl transition-all rounded-2xl">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScenarioColor(scenario.scenario_type)}`}>
                            {getScenarioIcon(scenario.scenario_type)}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{scenario.scenario_name}</CardTitle>
                            <Badge variant="outline" className={`${getScenarioColor(scenario.scenario_type)} border mt-1`}>
                              {scenario.scenario_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(scenario)}
                            className="hover:bg-slate-100"
                          >
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(scenario.id)}
                            className="hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {scenario.description && (
                        <p className="text-slate-600 mb-4">{scenario.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
                        <div className="bg-slate-50 rounded-lg p-2 md:p-3">
                          <p className="text-[10px] md:text-xs text-slate-600 mb-1">Portfolio Value</p>
                          <p className="text-base md:text-lg font-bold text-slate-900 break-words">
                            ${(scenario.total_value || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className={`rounded-lg p-2 md:p-3 ${netCashflow >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                          <p className="text-[10px] md:text-xs text-slate-600 mb-1">Net Monthly</p>
                          <p className={`text-base md:text-lg font-bold ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'} break-words`}>
                            {netCashflow >= 0 ? '+' : ''}${netCashflow.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {scenario.monthly_income > 0 && (
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">Monthly Income:</span>
                          <span className="font-semibold text-slate-900">${scenario.monthly_income.toLocaleString()}</span>
                        </div>
                      )}

                      {scenario.monthly_expenses > 0 && (
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">Monthly Expenses:</span>
                          <span className="font-semibold text-slate-900">${scenario.monthly_expenses.toLocaleString()}</span>
                        </div>
                      )}

                      {scenario.hypothetical_holdings && scenario.hypothetical_holdings.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-600 mb-2">Holdings ({scenario.hypothetical_holdings.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {scenario.hypothetical_holdings.slice(0, 5).map((holding, idx) => (
                              <Badge key={idx} variant="outline" className="bg-slate-50">
                                {holding.symbol}
                              </Badge>
                            ))}
                            {scenario.hypothetical_holdings.length > 5 && (
                              <Badge variant="outline" className="bg-slate-50">
                                +{scenario.hypothetical_holdings.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {scenario.notes && (
                        <div className="pt-3 border-t border-slate-100 mt-3">
                          <p className="text-xs text-slate-500">{scenario.notes}</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-200 mt-4">
                        <Button
                          onClick={() => runSimulation(scenario)}
                          disabled={simulatingId === scenario.id}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                          {simulatingId === scenario.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Running Simulation...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              {simulationResults[scenario.id] ? "Re-run Simulation" : "Run AI Simulation"}
                            </>
                          )}
                        </Button>
                      </div>

                      {simulationResults[scenario.id] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 space-y-4"
                        >
                          {/* Portfolio Comparison */}
                          {currentPortfolio && (
                            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <GitBranch className="w-5 h-5 text-indigo-600" />
                                  Portfolio Comparison
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                  {/* Current Paper Trading Portfolio */}
                                  <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <TrendingUp className="w-5 h-5 text-blue-600" />
                                      <h5 className="font-bold text-blue-900">Current (Paper Trading)</h5>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Portfolio Value:</span>
                                        <span className="font-bold text-slate-900">
                                          ${currentPortfolio.value.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Total Cost:</span>
                                        <span className="font-semibold text-slate-700">
                                          ${currentPortfolio.cost.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm pt-2 border-t">
                                        <span className="text-slate-600">Gain/Loss:</span>
                                        <span className={`font-bold ${currentPortfolio.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {currentPortfolio.gain >= 0 ? '+' : ''}${currentPortfolio.gain.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Holdings:</span>
                                        <span className="font-semibold text-slate-900">
                                          {currentPortfolio.holdings.length} assets
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Hypothetical Shadow Portfolio */}
                                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <GitBranch className="w-5 h-5 text-purple-600" />
                                      <h5 className="font-bold text-purple-900">Hypothetical Scenario</h5>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Portfolio Value:</span>
                                        <span className="font-bold text-slate-900">
                                          ${(scenario.total_value || 0).toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Monthly Income:</span>
                                        <span className="font-semibold text-emerald-700">
                                          +${(scenario.monthly_income || 0).toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Monthly Expenses:</span>
                                        <span className="font-semibold text-rose-700">
                                          -${(scenario.monthly_expenses || 0).toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm pt-2 border-t">
                                        <span className="text-slate-600">Net Cashflow:</span>
                                        <span className={`font-bold ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {netCashflow >= 0 ? '+' : ''}${netCashflow.toLocaleString()}/mo
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Holdings:</span>
                                        <span className="font-semibold text-slate-900">
                                          {scenario.hypothetical_holdings?.length || 0} assets
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Change Indicator */}
                                <div className="mt-4 bg-white rounded-lg p-3 border border-slate-200">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-600">Portfolio Value Change:</span>
                                      <div className="group relative">
                                        <AlertCircle className="w-3 h-3 text-slate-400 cursor-help" />
                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 bg-slate-900 text-white text-xs rounded-lg p-3 z-10">
                                          Compares your Current (Paper Trading) portfolio value to this Hypothetical scenario's value. Shows how much your portfolio would increase or decrease if you switched to this scenario.
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`text-lg font-bold ${simulationResults[scenario.id].portfolio_change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {simulationResults[scenario.id].portfolio_change_percent >= 0 ? '+' : ''}
                                      {simulationResults[scenario.id].portfolio_change_percent?.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Income Source Transparency */}
                          {simulationResults[scenario.id].income_breakdown && (
                            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                              <CardContent className="p-4">
                                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                  <DollarSign className="w-5 h-5" />
                                  Income Source Breakdown
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-700">Portfolio-derived (3.5% withdrawal):</span>
                                    <span className="font-bold text-slate-900">
                                      ${Math.round(simulationResults[scenario.id].income_breakdown.portfolio_derived).toLocaleString()}/mo
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-700">Assumed external income:</span>
                                    <span className="font-bold text-amber-700">
                                      ${Math.round(simulationResults[scenario.id].income_breakdown.assumed_external).toLocaleString()}/mo
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-blue-200">
                                    <span className="text-slate-700">Implied portfolio yield:</span>
                                    <span className={`font-bold ${simulationResults[scenario.id].income_breakdown.portfolio_yield_percent > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                      {simulationResults[scenario.id].income_breakdown.portfolio_yield_percent.toFixed(1)}%/year
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Capital Accounting */}
                          {simulationResults[scenario.id].capital_accounting && (
                            <Card className={`border-2 ${simulationResults[scenario.id].capital_accounting.severity === 'high' ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                              <CardContent className="p-4">
                                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  Capital Change Explanation
                                </h4>
                                <p className="text-sm text-slate-700 mb-2">
                                  {simulationResults[scenario.id].capital_accounting.explanation}
                                </p>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Value difference:</span>
                                  <span className={`font-bold ${simulationResults[scenario.id].capital_accounting.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {simulationResults[scenario.id].capital_accounting.difference >= 0 ? '+' : ''}
                                    ${Math.abs(simulationResults[scenario.id].capital_accounting.difference).toLocaleString()}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Validation Warnings */}
                          {simulationResults[scenario.id].validation_warnings && simulationResults[scenario.id].validation_warnings.length > 0 && (
                            <Card className="border-2 border-amber-300 bg-amber-50">
                              <CardContent className="p-4">
                                <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5" />
                                  Data Integrity Warnings
                                </h4>
                                <div className="space-y-2">
                                  {simulationResults[scenario.id].validation_warnings.map((warning, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <Badge className={warning.severity === 'high' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}>
                                        {warning.severity}
                                      </Badge>
                                      <span className="text-slate-700">{warning.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Viability Score */}
                          <div className={`rounded-lg p-4 border-2 ${getViabilityColor(simulationResults[scenario.id].viability_score)}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="font-semibold text-sm">Financial Viability Score</span>
                                {simulationResults[scenario.id].viability_factors && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    Cashflow ({simulationResults[scenario.id].viability_factors.cashflow_sustainability}), 
                                    Portfolio ({simulationResults[scenario.id].viability_factors.portfolio_adequacy}), 
                                    Risk ({simulationResults[scenario.id].viability_factors.risk_level}), 
                                    Feasibility ({simulationResults[scenario.id].viability_factors.transition_feasibility})
                                  </p>
                                )}
                              </div>
                              <span className="text-3xl font-bold">
                                {simulationResults[scenario.id].viability_score}/100
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {getVerdictIcon(simulationResults[scenario.id].verdict)}
                              <span>{simulationResults[scenario.id].verdict}</span>
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-3">
                           <div className="bg-slate-50 rounded-lg p-3">
                             <p className="text-xs text-slate-600 mb-1">Portfolio Change</p>
                             <p className={`text-lg font-bold ${simulationResults[scenario.id].portfolio_change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {simulationResults[scenario.id].portfolio_change_percent >= 0 ? '+' : ''}
                               {simulationResults[scenario.id].portfolio_change_percent?.toFixed(1)}%
                             </p>
                           </div>
                           <div className="bg-slate-50 rounded-lg p-3">
                             <p className="text-xs text-slate-600 mb-1">
                               Sustainability
                               <span className="ml-1 group relative inline-block">
                                 <AlertCircle className="w-3 h-3 text-slate-400 cursor-help inline" />
                                 <span className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-2 z-10">
                                   Portfolio-Sustained: Portfolio alone covers expenses. Income-Dependent: Requires external income.
                                 </span>
                               </span>
                             </p>
                             <p className={`text-sm md:text-base font-bold ${
                               getSustainabilityColor(
                                 simulationResults[scenario.id].runway_months,
                                 simulationResults[scenario.id].is_portfolio_sustained
                               )
                             }`}>
                               {getSustainabilityLabel(
                                 simulationResults[scenario.id].runway_months,
                                 simulationResults[scenario.id].is_portfolio_sustained
                               )}
                             </p>
                           </div>
                          </div>

                          {/* 10-Year Projection Chart with Methodology */}
                          {simulationResults[scenario.id].projection_data && (
                            <Card className="border-2 border-purple-200 bg-white">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4 text-purple-600" />
                                  10-Year Financial Projection
                                </h4>
                                
                                {/* Assumptions Disclosure */}
                                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                                  <p className="text-xs font-bold text-blue-900 mb-2">📊 Projection Assumptions</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                                    <div>Return: {simulationResults[scenario.id].projection_assumptions.annual_return}</div>
                                    <div>Inflation: {simulationResults[scenario.id].projection_assumptions.inflation_rate}</div>
                                    <div className="col-span-2">Cashflow: {simulationResults[scenario.id].projection_assumptions.net_monthly_cashflow}</div>
                                    <div className="col-span-2 text-[10px] text-slate-600 mt-1">
                                      {simulationResults[scenario.id].projection_assumptions.methodology}
                                    </div>
                                  </div>
                                </div>

                                <ResponsiveContainer width="100%" height={250}>
                                  <LineChart data={simulationResults[scenario.id].projection_data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                      dataKey="year" 
                                      label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                                      style={{ fontSize: '12px' }}
                                    />
                                    <YAxis 
                                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                      style={{ fontSize: '11px' }}
                                    />
                                    <Tooltip 
                                      formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                                      labelFormatter={(year) => `Year ${year}`}
                                      contentStyle={{ fontSize: '12px' }}
                                    />
                                    <Legend 
                                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                      iconSize={10}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="portfolio_value" 
                                      stroke="#8b5cf6" 
                                      strokeWidth={3} 
                                      name="Total Portfolio Value" 
                                      dot={false}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="portfolio_only_growth" 
                                      stroke="#3b82f6" 
                                      strokeWidth={2} 
                                      name="Portfolio Growth Only" 
                                      strokeDasharray="5 5"
                                      dot={false}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="external_income_contributions" 
                                      stroke="#10b981" 
                                      strokeWidth={2} 
                                      name="External Income" 
                                      strokeDasharray="3 3"
                                      dot={false}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="cumulative_withdrawals" 
                                      stroke="#ef4444" 
                                      strokeWidth={2} 
                                      name="Withdrawals" 
                                      strokeDasharray="5 5"
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>

                                {/* Projection Summary */}
                                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                  <div className="bg-slate-50 rounded p-2">
                                    <p className="text-slate-600">Starting Value</p>
                                    <p className="font-bold text-slate-900 text-sm">
                                      ${simulationResults[scenario.id].projection_summary.starting_value.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50 rounded p-2">
                                    <p className="text-slate-600">Ending Value (10Y)</p>
                                    <p className="font-bold text-slate-900 text-sm">
                                      ${simulationResults[scenario.id].projection_summary.ending_value.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-blue-50 rounded p-2">
                                    <p className="text-slate-600">Portfolio Growth Only</p>
                                    <p className="font-bold text-blue-700 text-sm">
                                      +${simulationResults[scenario.id].projection_summary.portfolio_only_growth.toLocaleString()}
                                      <span className="text-[10px] ml-1">
                                        ({simulationResults[scenario.id].projection_summary.portfolio_only_return_percent.toFixed(1)}%)
                                      </span>
                                    </p>
                                  </div>
                                  <div className="bg-emerald-50 rounded p-2">
                                    <p className="text-slate-600">External Income</p>
                                    <p className="font-bold text-emerald-700 text-sm">
                                      +${simulationResults[scenario.id].projection_summary.external_contributions.toLocaleString()}
                                    </p>
                                  </div>
                                  {simulationResults[scenario.id].projection_summary.total_withdrawals > 0 && (
                                    <div className="bg-rose-50 rounded p-2 col-span-2">
                                      <p className="text-slate-600">Total Withdrawals</p>
                                      <p className="font-bold text-rose-700 text-sm">
                                        -${simulationResults[scenario.id].projection_summary.total_withdrawals.toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Growth Composition Alert */}
                                {simulationResults[scenario.id].external_income_monthly > 100 && (
                                  <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
                                    <p className="text-xs text-amber-900">
                                      <strong>Note:</strong> ${Math.round(simulationResults[scenario.id].external_income_monthly).toLocaleString()}/mo 
                                      external income means this scenario is {simulationResults[scenario.id].is_portfolio_sustained ? 'partially' : 'heavily'} income-dependent, 
                                      not pure portfolio retirement.
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Risks */}
                          {simulationResults[scenario.id].major_risks && simulationResults[scenario.id].major_risks.length > 0 && (
                            <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <h4 className="font-semibold text-rose-900">Major Risks</h4>
                                <Badge className="bg-rose-200 text-rose-700 text-xs">
                                  {simulationResults[scenario.id].risk_level}
                                </Badge>
                              </div>
                              <ul className="space-y-1 text-sm text-rose-700">
                                {simulationResults[scenario.id].major_risks.map((risk, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>{risk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Key Insights */}
                          {simulationResults[scenario.id].key_insights && simulationResults[scenario.id].key_insights.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Key Insights
                              </h4>
                              <ul className="space-y-1 text-sm text-blue-700">
                                {simulationResults[scenario.id].key_insights.map((insight, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Holdings Analysis */}
                          {simulationResults[scenario.id].holdings_analysis && simulationResults[scenario.id].holdings_analysis.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Holdings Analysis & Recommendations
                              </h4>
                              <div className="space-y-4">
                                {simulationResults[scenario.id].holdings_analysis.map((holding, idx) => (
                                  <Card key={idx} className="border border-slate-200 bg-slate-50">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-lg font-bold text-slate-900">{holding.symbol}</h5>
                                        <Badge className={
                                          holding.recommendation === 'buy' ? 'bg-emerald-100 text-emerald-700' :
                                          holding.recommendation === 'avoid' ? 'bg-rose-100 text-rose-700' :
                                          'bg-amber-100 text-amber-700'
                                        }>
                                          {holding.recommendation?.toUpperCase()}
                                        </Badge>
                                      </div>

                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-600 mb-1">SHORT-TERM OUTLOOK (3-6 months)</p>
                                          <p className="text-sm text-slate-700">{holding.short_term_outlook}</p>
                                        </div>

                                        <div>
                                          <p className="text-xs font-semibold text-slate-600 mb-1">LONG-TERM OUTLOOK (3-5 years)</p>
                                          <p className="text-sm text-slate-700">{holding.long_term_outlook}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-white rounded p-2">
                                            <p className="text-xs text-slate-600">Volatility</p>
                                            <Badge variant="outline" className={
                                              holding.volatility_level === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                              holding.volatility_level === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                              'bg-amber-50 text-amber-700 border-amber-200'
                                            }>
                                              {holding.volatility_level}
                                            </Badge>
                                          </div>
                                        </div>

                                        <div className="bg-rose-50 rounded p-3 border border-rose-200">
                                          <p className="text-xs font-semibold text-rose-900 mb-1">⚠️ RISK ASSESSMENT</p>
                                          <p className="text-sm text-rose-700">{holding.risk_assessment}</p>
                                        </div>

                                        {holding.alternatives && (
                                          <div className="bg-blue-50 rounded p-3 border border-blue-200">
                                            <p className="text-xs font-semibold text-blue-900 mb-2">💡 BETTER ALTERNATIVES</p>
                                            {typeof holding.alternatives === 'string' ? (
                                              <p className="text-sm text-slate-700 whitespace-pre-line">{holding.alternatives}</p>
                                            ) : Array.isArray(holding.alternatives) ? (
                                              <div className="space-y-2">
                                                {holding.alternatives.map((alt, altIdx) => (
                                                  <div key={altIdx} className="bg-white rounded p-2">
                                                    <p className="font-semibold text-sm text-blue-900">{alt.symbol}</p>
                                                    <p className="text-xs text-slate-700">{alt.reason}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gains vs Losses */}
                          <div className="grid md:grid-cols-2 gap-3">
                            {simulationResults[scenario.id].what_you_gain && simulationResults[scenario.id].what_you_gain.length > 0 && (
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                                  <h5 className="font-semibold text-emerald-900 text-sm">What You Gain</h5>
                                </div>
                                <ul className="space-y-1 text-xs text-emerald-700">
                                  {simulationResults[scenario.id].what_you_gain.map((gain, idx) => (
                                    <li key={idx}>• {gain}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {simulationResults[scenario.id].what_you_lose && simulationResults[scenario.id].what_you_lose.length > 0 && (
                              <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingDown className="w-4 h-4 text-rose-600" />
                                  <h5 className="font-semibold text-rose-900 text-sm">What You Lose</h5>
                                </div>
                                <ul className="space-y-1 text-xs text-rose-700">
                                  {simulationResults[scenario.id].what_you_lose.map((loss, idx) => (
                                    <li key={idx}>• {loss}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Shadow Portfolio" : "Create Shadow Portfolio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Scenario Name</Label>
              <Input
                placeholder="e.g., If I moved to Canada"
                value={formData.scenario_name}
                onChange={(e) => setFormData({...formData, scenario_name: e.target.value})}
              />
            </div>

            <div>
              <Label>Scenario Type</Label>
              <Select
                value={formData.scenario_type}
                onValueChange={(value) => setFormData({...formData, scenario_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career_change">Career Change</SelectItem>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="early_retirement">Early Retirement</SelectItem>
                  <SelectItem value="lifestyle_change">Lifestyle Change</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this scenario..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Portfolio Value</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={formData.total_value}
                  onChange={(e) => setFormData({...formData, total_value: e.target.value})}
                />
              </div>
              <div>
                <Label>Monthly Income</Label>
                <Input
                  type="number"
                  placeholder="8000"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({...formData, monthly_income: e.target.value})}
                />
              </div>
              <div>
                <Label>Monthly Expenses</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.monthly_expenses}
                  onChange={(e) => setFormData({...formData, monthly_expenses: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Hypothetical Holdings (Optional)</Label>
              <div className="space-y-2">
                {formData.hypothetical_holdings.map((holding, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Symbol (e.g., AAPL)"
                      value={holding.symbol || ""}
                      onChange={(e) => {
                        const updated = [...formData.hypothetical_holdings];
                        updated[idx] = { ...updated[idx], symbol: e.target.value };
                        setFormData({...formData, hypothetical_holdings: updated});
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Name"
                      value={holding.name || ""}
                      onChange={(e) => {
                        const updated = [...formData.hypothetical_holdings];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setFormData({...formData, hypothetical_holdings: updated});
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={holding.quantity || ""}
                      onChange={(e) => {
                        const updated = [...formData.hypothetical_holdings];
                        updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) || 0 };
                        setFormData({...formData, hypothetical_holdings: updated});
                      }}
                      className="w-24"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = formData.hypothetical_holdings.filter((_, i) => i !== idx);
                        setFormData({...formData, hypothetical_holdings: updated});
                      }}
                      className="hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      hypothetical_holdings: [
                        ...formData.hypothetical_holdings,
                        { symbol: "", name: "", quantity: 0 }
                      ]
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holding
                </Button>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional thoughts..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                {editingId ? "Update" : "Create"} Portfolio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
