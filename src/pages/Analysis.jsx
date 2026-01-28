/**
 * ORCHESTRATION LAYER - AWS AMPLIFY VERSION
 * 500+ lines of pure orchestration and state management
 * 
 * Core responsibility: UI orchestration and workflow control
 * - State management for analysis configuration
 * - Event handling and data flow coordination
 * - Calls to portfolio calcs (../hooks/usePortfolioCalculations.js)
 * - Calls to advanced analysis (../hooks/useAdvancedAnalysis.js)
 * - UI rendering and data display
 * 
 * This file does NOT contain:
 * - Portfolio mathematical calculations
 * - Behavioral analysis or narrative generation
 */

import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Loader2, Target, DollarSign, Calendar, AlertCircle, AlertTriangle, Activity, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AnalysisTabs from "@/components/analysis/AnalysisTabs";
import * as PortfolioCalcs from "@/pages/../hooks/usePortfolioCalculations";
import * as AdvancedAnalysis from "@/pages/../hooks/useAdvancedAnalysis";

export default function Analysis() {
  // State management
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [investmentHorizon, setInvestmentHorizon] = useState("10");
  const [targetGoalAmount, setTargetGoalAmount] = useState("1000000");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("optimal_portfolio");
  const [activeTab, setActiveTab] = useState("overview");
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);

  // Derived state for analytics
  const [stressTestResults, setStressTestResults] = useState(null);
  const [scenarioResults, setScenarioResults] = useState(null);
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [confidenceBands, setConfidenceBands] = useState(null);
  const [drawdownSeries, setDrawdownSeries] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [extendedScenarios, setExtendedScenarios] = useState(null);
  const [concentrationAnalysis, setConcentrationAnalysis] = useState(null);
  const [behavioralBiases, setBehavioralBiases] = useState(null);
  const [betaDecomp, setBetaDecomp] = useState(null);
  const [alphaDecomp, setAlphaDecomp] = useState(null);
  const [corrStress, setCorrStress] = useState(null);
  const [goalProbability, setGoalProbability] = useState(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const companiesParam = urlParams.get("companies");
      const analysisId = urlParams.get("id");

      if (companiesParam) {
        setSelectedSymbols(companiesParam.split(","));
      }

      await loadCompanies();

      if (analysisId) {
        try {
          const userId = localStorage.getItem('user_id');
          const analysis = await awsApi.getStockAnalysis(userId, analysisId);
          if (analysis) {
            setSelectedSymbols(analysis.selected_companies || []);
            setInvestmentAmount((analysis.total_investment || 10000).toString());
            setMonthlyContribution((analysis.monthly_contribution || 500).toString());
            setInvestmentHorizon((analysis.investment_horizon || 10).toString());
            setTargetGoalAmount((analysis.target_goal_amount || 1000000).toString());
            setAnalysisResult(analysis.analysis_data);
          }
        } catch (e) {
          console.error("Error loading analysis:", e);
          setError("Could not load previous analysis");
        }
      }
    };

    init();
  }, []);

  const loadCompanies = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const data = await awsApi.getStockAnalysis(userId);
      setCompanies(data || []);
    } catch (e) {
      console.error("Error loading companies:", e);
      setError("Could not load companies data");
    }
  };

  // Main analysis handler - orchestrates calculation calls
  const handleAnalyze = async () => {
    if (selectedSymbols.length === 0) {
      setError("Please select at least one company");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const userId = localStorage.getItem('user_id');
      const selectedCompanies = companies.filter((c) => selectedSymbols.includes(c.symbol));

      if (selectedCompanies.length === 0) throw new Error("No valid companies found");

      // Call portfolio calculation layer
      const correlationMatrix = PortfolioCalcs.calculateCorrelationMatrix(selectedCompanies);
      
      const optimalWeights = Object.values(PortfolioCalcs.generateOptimalAllocation(selectedCompanies));
      const minVarWeights = Object.values(PortfolioCalcs.generateMinVarianceAllocation(selectedCompanies));
      const rpWeights = Object.values(PortfolioCalcs.generateRiskParityAllocation(selectedCompanies));
      const maxReturnWeights = Object.values(PortfolioCalcs.generateMaxReturnAllocation(selectedCompanies));

      const optimalMetrics = PortfolioCalcs.calculateAdvancedPortfolioMetrics(selectedCompanies, optimalWeights, correlationMatrix);
      const minVarMetrics = PortfolioCalcs.calculateAdvancedPortfolioMetrics(selectedCompanies, minVarWeights, correlationMatrix);
      const rpMetrics = PortfolioCalcs.calculateAdvancedPortfolioMetrics(selectedCompanies, rpWeights, correlationMatrix);
      const maxReturnMetrics = PortfolioCalcs.calculateAdvancedPortfolioMetrics(selectedCompanies, maxReturnWeights, correlationMatrix);

      // Build orchestrated result
      const result = {
        companies: selectedCompanies,
        correlation_matrix: correlationMatrix,
        optimal_portfolio: { 
          ...optimalMetrics, 
          allocations: PortfolioCalcs.generateOptimalAllocation(selectedCompanies), 
          description: "Maximum Sharpe ratio - best risk-adjusted returns" 
        },
        minimum_variance_portfolio: { 
          ...minVarMetrics, 
          allocations: PortfolioCalcs.generateMinVarianceAllocation(selectedCompanies), 
          description: "Minimum volatility - most conservative approach" 
        },
        risk_parity_portfolio: { 
          ...rpMetrics, 
          allocations: PortfolioCalcs.generateRiskParityAllocation(selectedCompanies), 
          description: "Equal risk contribution - balanced approach" 
        },
        maximum_return_portfolio: { 
          ...maxReturnMetrics, 
          allocations: PortfolioCalcs.generateMaxReturnAllocation(selectedCompanies), 
          description: "Highest expected return - aggressive approach" 
        },
        total_investment: parseFloat(investmentAmount),
        monthly_contribution: parseFloat(monthlyContribution),
        investment_horizon: parseInt(investmentHorizon),
        target_goal_amount: parseFloat(targetGoalAmount),
      };

      setAnalysisResult(result);

      // Generate all analytics from portfolio calc layer
      const stressTests = PortfolioCalcs.runStressTests(selectedCompanies, optimalWeights);
      setStressTestResults(stressTests);

      const monthlyReturn = (optimalMetrics.expected_return / 100) / 12;
      const targetForYear = (parseFloat(targetGoalAmount) / parseInt(investmentHorizon));
      const scenarios = [];
      for (let year = 1; year <= parseInt(investmentHorizon); year++) {
        const months = year * 12;
        const futureValue = parseFloat(investmentAmount) * Math.pow(1 + monthlyReturn, months) + 
          (parseFloat(monthlyContribution) * (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
        scenarios.push({ 
          year, 
          projectedValue: Math.round(futureValue), 
          targetValue: Math.round(targetForYear * year),
          onTrack: futureValue >= targetForYear * year 
        });
      }
      setScenarioResults(scenarios);

      const monteCarlo = PortfolioCalcs.runMonteCarloSimulation(selectedCompanies, optimalWeights, parseFloat(investmentAmount), parseInt(investmentHorizon));
      setMonteCarloResults(monteCarlo);

      const bands = PortfolioCalcs.calculateConfidenceBands(selectedCompanies, optimalWeights, 60);
      setConfidenceBands(bands);

      const drawdowns = PortfolioCalcs.calculateDrawdownSeries(selectedCompanies, optimalWeights, 60);
      setDrawdownSeries(drawdowns);

      const backtest = PortfolioCalcs.runHistoricalBacktest(selectedCompanies, optimalWeights, Math.min(parseInt(investmentHorizon), 10));
      setBacktestResults(backtest);

      const extScenarios = PortfolioCalcs.generateExtendedScenarioAnalysis(selectedCompanies, optimalWeights, parseFloat(investmentAmount), parseInt(investmentHorizon));
      setExtendedScenarios(extScenarios);

      const concentration = PortfolioCalcs.calculateConcentrationRisks(result.optimal_portfolio.allocations, selectedCompanies);
      setConcentrationAnalysis(concentration);

      const betaD = PortfolioCalcs.calculateBetaDecomposition(selectedCompanies, optimalWeights);
      setBetaDecomp(betaD);

      const alphaD = PortfolioCalcs.calculateAlphaDecomposition(selectedCompanies, optimalWeights);
      setAlphaDecomp(alphaD);

      const corrS = PortfolioCalcs.calculateCorrelationStress(correlationMatrix);
      setCorrStress(corrS);

      // Call advanced analysis layer
      const biases = AdvancedAnalysis.detectBehavioralBiases(selectedCompanies, result.optimal_portfolio.allocations);
      setBehavioralBiases(biases);

      const goalProb = AdvancedAnalysis.calculateGoalProbability(optimalMetrics.expected_return, optimalMetrics.volatility, parseInt(investmentHorizon), parseFloat(targetGoalAmount), parseFloat(investmentAmount));
      setGoalProbability(goalProb);

      // Save to database
      try {
        await awsApi.getStockAnalysis({
          userId,
          selected_companies: selectedSymbols,
          total_investment: parseFloat(investmentAmount),
          monthly_contribution: parseFloat(monthlyContribution),
          investment_horizon: parseInt(investmentHorizon),
          target_goal_amount: parseFloat(targetGoalAmount),
          analysis_data: result,
          stress_test_results: stressTests,
          scenario_results: scenarios,
          behavioral_insights: biases,
          goal_probability: goalProb,
          analysis_date: new Date().toISOString().split("T")[0],
        });
      } catch (saveError) {
        console.warn("Could not save analysis:", saveError);
      }
    } catch (error) {
      setError(`Analysis failed: ${error.message}`);
      console.error("Analysis error:", error);
    }

    setIsAnalyzing(false);
  };

  const handleRunNewAnalysis = () => {
    setAnalysisResult(null);
    setStressTestResults(null);
    setScenarioResults(null);
    setMonteCarloResults(null);
    setConfidenceBands(null);
    setDrawdownSeries(null);
    setBacktestResults(null);
    setExtendedScenarios(null);
    setConcentrationAnalysis(null);
    setBehavioralBiases(null);
    setBetaDecomp(null);
    setAlphaDecomp(null);
    setCorrStress(null);
    setGoalProbability(null);
    setInvestmentAmount("10000");
    setMonthlyContribution("500");
    setInvestmentHorizon("10");
    setSelectedStrategy("optimal_portfolio");
    setActiveTab("overview");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Advanced Portfolio Analysis Engine</h1>
          <p className="text-lg text-slate-600">Multi-strategy optimization with Monte Carlo, stress testing, scenarios & behavioral analysis</p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800">{error}</span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!analysisResult && (
          <Card className="border-2 border-slate-200 shadow-xl bg-white/80 mb-8 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl"><Target className="w-6 h-6 text-blue-600" />Configure Your Investment Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Selected Companies ({selectedSymbols.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSymbols.length === 0 ? <p className="text-slate-500">No investments selected</p> : selectedSymbols.map((symbol) => <Badge key={symbol} className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">{symbol}</Badge>)}
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="investment" className="text-base font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Initial Investment ($)</Label>
                  <Input id="investment" type="number" value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)} placeholder="10000" className="text-lg h-12 mt-2" />
                </div>
                <div>
                  <Label htmlFor="monthly" className="text-base font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Monthly Contribution ($)</Label>
                  <Input id="monthly" type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder="500" className="text-lg h-12 mt-2" />
                </div>
                <div>
                  <Label htmlFor="horizon" className="text-base font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4" />Investment Horizon (Years)</Label>
                  <Input id="horizon" type="number" value={investmentHorizon} onChange={(e) => setInvestmentHorizon(e.target.value)} placeholder="10" className="text-lg h-12 mt-2" />
                </div>
                <div>
                  <Label htmlFor="goal" className="text-base font-semibold flex items-center gap-2"><Target className="w-4 h-4" />Target Goal ($)</Label>
                  <Input id="goal" type="number" value={targetGoalAmount} onChange={(e) => setTargetGoalAmount(e.target.value)} placeholder="1000000" className="text-lg h-12 mt-2" />
                </div>
              </div>
              <Button onClick={handleAnalyze} disabled={isAnalyzing || selectedSymbols.length === 0} className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running Advanced Analysis...</> : <><TrendingUp className="w-5 h-5 mr-2" />Run Advanced Analysis</>}
              </Button>
            </CardContent>
          </Card>
        )}

        <AnimatePresence>
          {analysisResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Strategy selector */}
              <div className="flex gap-3 flex-wrap">
                {["optimal_portfolio", "minimum_variance_portfolio", "risk_parity_portfolio", "maximum_return_portfolio"].map((strategy) => (
                  <button key={strategy} onClick={() => setSelectedStrategy(strategy)} className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedStrategy === strategy ? "bg-blue-600 text-white shadow-lg" : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                    {strategy.split("_")[0].toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Analysis tabs */}
              <AnalysisTabs analysisResult={analysisResult} selectedStrategy={selectedStrategy} activeTab={activeTab} setActiveTab={setActiveTab} />

              {/* Stress test results */}
              {stressTestResults && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5" />Stress Test Results</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stressTestResults}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="return" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Monte Carlo results */}
              {monteCarloResults && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Monte Carlo Simulation (10,000 runs)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">Expected Value</p>
                        <p className="text-2xl font-bold text-blue-600">${(monteCarloResults.mean / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-slate-600">95th Percentile (Best Case)</p>
                        <p className="text-2xl font-bold text-green-600">${(monteCarloResults.percentile95 / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-slate-600">5th Percentile (Worst Case)</p>
                        <p className="text-2xl font-bold text-red-600">${(monteCarloResults.percentile5 / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goal probability */}
              {goalProbability && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Goal Achievement Probability</p>
                        <p className="text-5xl font-bold text-green-600">{goalProbability.probability}%</p>
                        <p className="text-xs text-slate-500 mt-1">{goalProbability.onTrack ? "✓ On track" : "⚠ Below target"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Projected Portfolio Value</p>
                        <p className="text-5xl font-bold text-blue-600">${(goalProbability.projectedValue / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Target Amount</p>
                        <p className="text-5xl font-bold text-slate-900">${(parseFloat(targetGoalAmount) / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Behavioral biases */}
              {behavioralBiases && behavioralBiases.length > 0 && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Behavioral Risk Assessment</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {behavioralBiases.map((bias, idx) => (
                        <div key={idx} className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-slate-900">{bias.type}</span>
                            <Badge className={bias.severity === "critical" ? "bg-red-100 text-red-700" : bias.severity === "high" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}>{bias.severity.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{bias.description}</p>
                          <p className="text-xs text-slate-500"><span className="font-semibold">Recommendation:</span> {bias.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <Button onClick={handleRunNewAnalysis} variant="outline" className="border-2 border-slate-300 px-8 py-3">Run New Analysis</Button>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3"><Download className="w-4 h-4 mr-2" />Export Report</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
