import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  Target,
  Activity,
  Award,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { getRemainingUsage } from "@/components/utils/usageLimit";
import { format } from "date-fns";
import { calculateInvestorMetrics } from "@/components/utils/calculations/investorMetrics";

export default function InvestorScore() {
  const [score, setScore] = useState(null);
  const [transactions, setTransactions] = useState([]);
  // ---- Removed paperTrades state ----
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState(null);

  useEffect(() => {
    loadData();
    loadRemainingUsage();
  }, []);

  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

  // ---- loadData updated ----
  const loadData = async () => {
    try {
      // 1. Fetch REAL history and REAL current synced values
      const [txResponse, syncResponse] = await Promise.all([
        awsApi.getTransactions(null).catch(() => ({ transactions: [] })),
        awsApi.syncPortfolio(null).catch(() => ({ portfolio: { assets: [], totalValue: 0 } }))
      ]);

      // 2. Set Transactions (Your Journal entries for AI analysis)
      const txData = txResponse.transactions || [];
      setTransactions(txData);

      // 3. Set Holdings (The synced assets with fresh prices)
      const portfolioObj = syncResponse.portfolio || {};
      const assetsData = portfolioObj.assets || [];
      setHoldings(assetsData);

      // 4. Update the Portfolio State for the UI
      const portfolioData = {
        totalValue: portfolioObj.totalValue || 0,
        assets: assetsData
      };
      setPortfolio(portfolioData);

      // 5. Calculate metrics locally using real Transactions instead of Paper Trades
      const metrics = calculateInvestorMetrics(txData, portfolioData);
      setScore(metrics);
    } catch (error) {
      console.error("Error loading Investor IQ data:", error);
    }
  };

  // ---- analyzeDecisionQuality updated as per instructions ----
  const analyzeDecisionQuality = async () => {
    setIsAnalyzing(true);

    try {
      // Use real transactions for metrics
      const metrics = calculateInvestorMetrics(transactions, portfolio);

      // AI payload uses real journal notes and real holdings
      const result = await awsApi.analyzeInvestorBehavior({
        metrics: {
          totalTrades: transactions.length,
          profitableTrades: 0, // Set to 0, as table doesn't have a profit field
          averageHoldingDays: transactions.length > 0 
            ? transactions.reduce((sum, t) => sum + (t.holdingDays || 0), 0) / transactions.length 
            : 0,
          journalEntries: transactions.map(t => ({
            symbol: t.symbol,
            type: t.type, // buy/sell
            date: t.transaction_date,
            price: t.price,
            notes: t.notes || "No notes provided",
            fees: t.fees
          })),
          holdings: holdings.map(h => ({
            symbol: h.symbol,
            allocation: (h.quantity * (h.currentPrice || 0)) / (portfolio?.totalValue || 1) * 100
          }))
        },
        userEmail: "ShahzadAnwar"
      });

      // Combine calculated metrics with AI analysis
      const finalScore = {
        ...metrics,
        biases_detected: result.biases_detected || [],
        improvement_suggestions: result.improvement_suggestions || [],
        analysis_date: new Date().toISOString()
      };

      setScore(finalScore);

      await awsApi.saveInvestorScore(finalScore);
    } catch (error) {
      console.error("Error analyzing:", error);
      alert("Error analyzing decision quality. Please try again.");
    }

    setIsAnalyzing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-blue-50 border-blue-200";
    if (score >= 40) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  const getBiasIcon = (severity) => {
    if (severity === "high") return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    if (severity === "medium") return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <AlertTriangle className="w-5 h-5 text-blue-600" />;
  };

  const getBiasBadgeColor = (severity) => {
    if (severity === "high") return "bg-rose-100 text-rose-700 border-rose-200";
    if (severity === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getBiasLabel = (biasType) => {
    const labels = {
      loss_aversion: "Loss Aversion",
      recency_bias: "Recency Bias",
      confirmation_bias: "Confirmation Bias",
      home_country_bias: "Home Country Bias",
      chasing_returns: "Chasing Returns"
    };
    return labels[biasType] || biasType;
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
              Investor IQ Score
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-slate-600">
              Analyze your paper trading behavior and learning progress
            </p>
            {remainingUsage && (
              <p className="text-sm text-blue-600 mt-1">
                {remainingUsage.premium_remaining} analyses remaining this week
              </p>
            )}
          </div>
        </motion.div>

        <div className="mb-8">
          <Card className="border-2 border-slate-200 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Decision Quality Analysis</h3>
                  <p className="text-sm text-slate-600">Separate luck from skill with behavioral analysis</p>
                </div>
                <Button
                  onClick={analyzeDecisionQuality}
                  disabled={isAnalyzing || transactions.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {score?.analysis_date ? "Refresh Analysis" : "Analyze My Decisions"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {!score ? (
          <Card className="border-2 border-slate-200 shadow-lg bg-white">
            <CardContent className="p-12 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Analysis Yet</h3>
              <p className="text-slate-500 mb-6">
                Run your first behavioral analysis to see your Investor IQ Score
              </p>
              {transactions.length === 0 && (
                <p className="text-sm text-slate-400">
                  Add some journal entries in the Transactions page to get behavioral analysis
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className={`border-2 shadow-xl ${getScoreBg(score.overall_score)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Award className={`w-5 h-5 md:w-6 md:h-6 ${getScoreColor(score.overall_score)}`} />
                  Your Investor IQ Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <p className={`text-5xl md:text-6xl font-bold ${getScoreColor(score.overall_score)} break-words`}>
                      {Math.round(score.overall_score)}
                    </p>
                    {score.analysis_date && (
                      <p className="text-sm text-slate-600 mt-2">
                        Last analyzed: {format(new Date(score.analysis_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-slate-700">
                  {score.overall_score >= 80 && "Excellent! You demonstrate strong investment discipline and decision-making."}
                  {score.overall_score >= 60 && score.overall_score < 80 && "Good! You're making solid decisions with room for improvement."}
                  {score.overall_score >= 40 && score.overall_score < 60 && "Fair. Several behavioral patterns could be improved."}
                  {score.overall_score < 40 && "Needs improvement. Focus on reducing emotional decision-making."}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="border border-slate-200 shadow-md">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <h4 className="font-semibold text-sm md:text-base text-slate-900">Discipline</h4>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 break-words">
                    {Math.round(score.discipline_score)}
                  </p>
                  <Progress value={score.discipline_score} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-md">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                    <h4 className="font-semibold text-sm md:text-base text-slate-900">Trading Frequency</h4>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 break-words">
                    {Math.round(score.overtrading_score)}
                  </p>
                  <Progress value={score.overtrading_score} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-md">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <Brain className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                    <h4 className="font-semibold text-sm md:text-base text-slate-900">Emotional Control</h4>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 break-words">
                    {Math.round(score.panic_selling_score)}
                  </p>
                  <Progress value={score.panic_selling_score} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-md">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                    <h4 className="font-semibold text-sm md:text-base text-slate-900">Diversification</h4>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 break-words">
                    {Math.round(score.concentration_score)}
                  </p>
                  <Progress value={score.concentration_score} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {score.biases_detected && score.biases_detected.length > 0 && (
              <Card className="border-2 border-amber-200 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    Behavioral Biases Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {score.biases_detected.map((bias, idx) => (
                      <Card key={idx} className="border border-slate-200 bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getBiasIcon(bias.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900">
                                  {getBiasLabel(bias.bias_type)}
                                </h4>
                                <Badge variant="outline" className={`${getBiasBadgeColor(bias.severity)} border`}>
                                  {bias.severity} severity
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-700">{bias.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {score.improvement_suggestions && score.improvement_suggestions.length > 0 && (
              <Card className="border-2 border-emerald-200 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    Improvement Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {score.improvement_suggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600">{idx + 1}</span>
                        </div>
                        <p className="text-slate-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
