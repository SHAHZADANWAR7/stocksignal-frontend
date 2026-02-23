import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { fetchAuthSession } from 'aws-amplify/auth';
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
  const [userEmail, setUserEmail] = useState(""); // Add this line
  const [previousScore, setPreviousScore] = useState(null); // Add previousScore state

  useEffect(() => {
    loadData();
    loadRemainingUsage();
  }, []);

  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

  // --- loadData updated for Hybrid/Dev "Previous Score" Feature ---
  const loadData = async () => {
    try {
      const session = await fetchAuthSession();
      const email = session.tokens?.idToken?.payload?.email || "";
      setUserEmail(email);

      const [txResponse, syncResponse] = await Promise.all([
        awsApi.getTransactions(null).catch(() => ({ transactions: [] })),
        awsApi.syncPortfolio(null).catch(() => ({ portfolio: { assets: [], totalValue: 0 } }))
      ]);
      setTransactions(txResponse.transactions || []);
      const portfolioData = { 
        totalValue: syncResponse.portfolio?.totalValue || 0, 
        assets: syncResponse.portfolio?.assets || [] 
      };
      setPortfolio(portfolioData);

      // Fallback math calculation with check-first logic
      const metrics = calculateInvestorMetrics(txResponse.transactions || [], portfolioData);

      setScore(current => {
        // If we already have AI data (analysis_date), DO NOT overwrite it with basic math
        if (current?.analysis_date) return current;
        return metrics;
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // --- UX Pro-Tip: Show math score immediately, finalize with AI data ---
  const analyzeDecisionQuality = async () => {
    setIsAnalyzing(true);
    try {
      if (score) setPreviousScore(score);

      // Step 1: Get Math + Journal Sentiments from your updated Lambda
      const response = await awsApi.analyzeInvestmentBehavior({ userEmail });
      const mathData = response.investor_score || {};

      // Show math scores instantly
      setScore(prev => ({ ...prev, ...mathData }));

      // Step 2: Prepare a much smarter prompt including your Journal notes
      // We extract the user_sentiments your Lambda is now providing
      const sentimentText = mathData.user_sentiments && mathData.user_sentiments.length > 0
        ? `INVESTOR JOURNAL NOTES (The user's thoughts):\n${mathData.user_sentiments.map(s => `- ${s}`).join('\n')}`
        : "No journal notes available.";

      const prompt = `Analyze this investor's behavioral performance.
      
      NUMERIC DATA:
      - Discipline: ${mathData.discipline_score}/100
      - Trading Frequency: ${mathData.overtrading_score}/100
      - Emotional Control: ${mathData.panic_selling_score}/100
      
      ${sentimentText}
      
      TASK:
      1. Detect behavioral biases. (e.g., If they are 'confident' but discipline is 16, flag "Overconfidence Bias").
      2. If they mentioned being 'scared' or 'solid', reference those specific thoughts in the description.
      
      Return JSON ONLY: { 
        "biases_detected": [{"bias_type": "string", "severity": "high/medium/low", "description": "string"}], 
        "improvement_suggestions": ["string"] 
      }`;

      // Step 3: Get AI Insights
      const aiResult = await awsApi.invokeLLM(prompt);

      // Step 4: Combine Math + AI Results
      const finalResult = {
        ...mathData,
        biases_detected: aiResult?.biases_detected || [],
        improvement_suggestions: aiResult?.improvement_suggestions || [],
        analysis_date: new Date().toISOString()
      };

      // Step 5: Update the state IMMEDIATELY (This stops the flickering)
      setScore(finalResult);

      // Step 6: Save to DB in the background
      try {
        await awsApi.saveInvestorScore({ 
          ...finalResult, 
          user_email: userEmail 
        });
      } catch (dbError) {
        console.error("Database save failed, but UI is updated:", dbError);
      }

    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
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

  // --- Add getBiasBadgeColor as requested ---
  const getBiasBadgeColor = (severity) => {
    if (severity === "high") return "bg-rose-100 text-rose-700 border-rose-200";
    if (severity === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  // --- Add "Overconfidence" & fallback formatting ---
  const getBiasLabel = (biasType) => {
    const labels = {
      loss_aversion: "Loss Aversion",
      recency_bias: "Recency Bias",
      confirmation_bias: "Confirmation Bias",
      home_country_bias: "Home Country Bias",
      chasing_returns: "Chasing Returns",
      overconfidence: "Overconfidence"
    };
    return labels[biasType] || biasType.replace('_', ' ');
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
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {score?.analysis_date ? "Refresh Analysis" : "Analyze My Decisions"}
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
                {/* Score section with timestamp and previous score comparison */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className={`text-6xl font-bold ${getScoreColor(score.overall_score)}`}>
                      {Math.round(score.overall_score)}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Last analyzed: {format(new Date(score.analysis_date || Date.now()), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  {previousScore && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Previous Score</p>
                      <p className="text-2xl font-bold text-slate-300">{Math.round(previousScore.overall_score)}</p>
                      <span className="text-xs font-bold text-emerald-600">
                        {score.overall_score > previousScore.overall_score
                          ? `+${Math.round(score.overall_score - previousScore.overall_score)} pts`
                          : "No change"}
                      </span>
                    </div>
                  )}
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

            {/* Biases and Suggestions Cards */}
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
