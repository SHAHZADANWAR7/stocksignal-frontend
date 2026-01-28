import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { callAwsFunction } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Loader2, Target, DollarSign, Calendar, AlertCircle, AlertTriangle, Activity, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import AnalysisTabs from "@/components/AnalysisTabs";

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
  const [error, setError] = useState(null);
  const [symbolInput, setSymbolInput] = useState("");

  // Initialize from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const companiesParam = urlParams.get("companies");
    
    if (companiesParam) {
      setSelectedSymbols(companiesParam.split(","));
    }
  }, []);

  // Add symbol to selected list
  const handleAddSymbol = () => {
    if (!symbolInput.trim()) return;
    
    const symbolUpper = symbolInput.toUpperCase();
    if (selectedSymbols.includes(symbolUpper)) {
      setError(`${symbolUpper} already selected`);
      return;
    }
    
    setSelectedSymbols([...selectedSymbols, symbolUpper]);
    setSymbolInput("");
    setError(null);
  };

  // Remove symbol from selected list
  const handleRemoveSymbol = (symbol) => {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
  };

  // Main analysis handler - calls getStockAnalysis Lambda
  const handleAnalyze = async () => {
    if (selectedSymbols.length === 0) {
      setError("Please select at least one company");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call AWS Lambda function
      const analysisData = await callAwsFunction('getStockAnalysis', {
        symbols: selectedSymbols,
        investmentAmount: parseFloat(investmentAmount),
        monthlyContribution: parseFloat(monthlyContribution),
        investmentHorizon: parseInt(investmentHorizon),
        targetGoalAmount: parseFloat(targetGoalAmount)
      });

      if (analysisData.error) {
        throw new Error(analysisData.error);
      }

      // Combine analysis results with user inputs
      const result = {
        ...analysisData,
        total_investment: parseFloat(investmentAmount),
        monthly_contribution: parseFloat(monthlyContribution),
        investment_horizon: parseInt(investmentHorizon),
        target_goal_amount: parseFloat(targetGoalAmount),
        analysis_date: new Date().toISOString().split("T")[0]
      };

      setAnalysisResult(result);

    } catch (error) {
      setError(`Analysis failed: ${error.message}`);
      console.error("Analysis error:", error);
    }

    setIsAnalyzing(false);
  };

  const handleRunNewAnalysis = () => {
    setAnalysisResult(null);
    setInvestmentAmount("10000");
    setMonthlyContribution("500");
    setInvestmentHorizon("10");
    setTargetGoalAmount("1000000");
    setSelectedStrategy("optimal_portfolio");
    setActiveTab("overview");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Advanced Portfolio Analysis Engine</h1>
          <p className="text-lg text-slate-600">Multi-strategy optimization with comprehensive risk analysis</p>
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
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-blue-600" />
                Configure Your Investment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Selected Companies ({selectedSymbols.length})
                </Label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSymbols.length === 0 ? (
                    <p className="text-slate-500">No investments selected</p>
                  ) : (
                    selectedSymbols.map((symbol) => (
                      <Badge 
                        key={symbol} 
                        className="bg-blue-100 text-blue-700 px-4 py-2 text-sm cursor-pointer"
                        onClick={() => handleRemoveSymbol(symbol)}
                      >
                        {symbol} ✕
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex gap-2 mb-6">
                  <Input
                    type="text"
                    placeholder="Enter stock symbol (e.g., AAPL, MSFT, TSLA)..."
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                    className="flex-1 h-10"
                  />
                  <Button
                    onClick={handleAddSymbol}
                    disabled={!symbolInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Symbol
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="investment" className="text-base font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Initial Investment ($)
                  </Label>
                  <Input
                    id="investment"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="10000"
                    className="text-lg h-12 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="monthly" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Monthly Contribution ($)
                  </Label>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    placeholder="500"
                    className="text-lg h-12 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="horizon" className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Investment Horizon (Years)
                  </Label>
                  <Input
                    id="horizon"
                    type="number"
                    value={investmentHorizon}
                    onChange={(e) => setInvestmentHorizon(e.target.value)}
                    placeholder="10"
                    className="text-lg h-12 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="goal" className="text-base font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Goal ($)
                  </Label>
                  <Input
                    id="goal"
                    type="number"
                    value={targetGoalAmount}
                    onChange={(e) => setTargetGoalAmount(e.target.value)}
                    placeholder="1000000"
                    className="text-lg h-12 mt-2"
                  />
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedSymbols.length === 0}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Running Advanced Analysis...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Run Advanced Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Strategy selector */}
              <div className="flex gap-3 flex-wrap">
                {[
                  "optimal_portfolio",
                  "minimum_variance_portfolio",
                  "risk_parity_portfolio",
                  "maximum_return_portfolio"
                ].map((strategy) => (
                  <button
                    key={strategy}
                    onClick={() => setSelectedStrategy(strategy)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedStrategy === strategy
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {strategy.split("_")[0].toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Analysis tabs - displays all results from getStockAnalysis */}
              <AnalysisTabs
                analysisResult={analysisResult}
                selectedStrategy={selectedStrategy}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              {/* Goal probability card */}
              {analysisResult.goal_probability && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Goal Achievement Probability</p>
                        <p className="text-5xl font-bold text-green-600">
                          {analysisResult.goal_probability.probability}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {analysisResult.goal_probability.onTrack ? "✓ On track" : "⚠ Below target"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Projected Portfolio Value</p>
                        <p className="text-5xl font-bold text-blue-600">
                          ${(analysisResult.goal_probability.projectedValue / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Target Amount</p>
                        <p className="text-5xl font-bold text-slate-900">
                          ${(parseFloat(targetGoalAmount) / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stress test results */}
              {analysisResult.stress_test_results && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Stress Test Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisResult.stress_test_results}>
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
              {analysisResult.monte_carlo_results && (
                <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Monte Carlo Simulation (10,000 runs)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">Expected Value</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(analysisResult.monte_carlo_results.mean / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-slate-600">95th Percentile (Best Case)</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(analysisResult.monte_carlo_results.percentile95 / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-slate-600">5th Percentile (Worst Case)</p>
                        <p className="text-2xl font-bold text-red-600">
                          ${(analysisResult.monte_carlo_results.percentile5 / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <Button
                  onClick={handleRunNewAnalysis}
                  variant="outline"
                  className="border-2 border-slate-300 px-8 py-3"
                >
                  Run New Analysis
                </Button>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
