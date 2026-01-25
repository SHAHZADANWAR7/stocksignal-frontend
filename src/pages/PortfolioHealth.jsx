import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LineChart
} from "lucide-react";
import { motion } from "framer-motion";
import { checkUsageLimit, incrementUsage, getRemainingUsage } from "@/components/utils/usageLimit";
import { format, differenceInDays } from "date-fns";
import { Line, LineChart as RechartsLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculatePortfolioHealth } from "@/components/utils/calculations/portfolioHealthMetrics";

export default function PortfolioHealth() {
  const [healthRecords, setHealthRecords] = useState([]);
  const [currentHealth, setCurrentHealth] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previousHealth, setPreviousHealth] = useState(null);
  const [remainingUsage, setRemainingUsage] = useState(null);

  useEffect(() => {
    loadData();
    loadRemainingUsage();
  }, []);

  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

  const loadData = async () => {
    const data = await awsApi.getPortfolioHealth();
    
    setHealthRecords(data.health_records || []);
    if (data.health_records && data.health_records.length > 0) {
      setCurrentHealth(data.health_records[0]);
      if (data.health_records.length > 1) {
        setPreviousHealth(data.health_records[1]);
      }
    }
    if (data.portfolio) {
      setPortfolio(data.portfolio);
    }
  };

  const analyzePortfolioHealth = async () => {
    setIsAnalyzing(true);

    if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
      alert("No portfolio assets to analyze");
      setIsAnalyzing(false);
      return;
    }

    const calculatedHealth = calculatePortfolioHealth(portfolio, previousHealth);

    const holdingsList = portfolio.assets.map(h => ({
      symbol: h.symbol,
      value: h.quantity * h.currentPrice
    }));

    const totalValue = portfolio.totalValue || 0;
    const daysSinceLastCheck = previousHealth 
      ? differenceInDays(new Date(), new Date(previousHealth.analysis_date))
      : null;

    const prompt = `Provide a natural language health summary for this portfolio:

CALCULATED METRICS (JavaScript):
- Diversification Score: ${calculatedHealth.diversification_score}/100
- Fragility Index: ${calculatedHealth.fragility_index}/100 (lower is better)
- Dependency Score: ${calculatedHealth.dependency_score}/100 (lower is better)
- Risk Level: ${calculatedHealth.risk_level}/100
- Correlation Coefficient: ${calculatedHealth.correlation_coefficient}

PORTFOLIO DATA:
- Total Value: $${totalValue.toLocaleString()}
- Holdings: ${holdingsList.length} assets
- Largest Position: ${calculatedHealth.metrics.maxConcentration.toFixed(1)}% of portfolio
- HHI (Herfindahl Index): ${calculatedHealth.metrics.hhi.toFixed(3)}

${previousHealth ? `CHANGES SINCE LAST CHECK (${daysSinceLastCheck} days ago):
- Diversification: ${previousHealth.diversification_score} → ${calculatedHealth.diversification_score} (${calculatedHealth.diversification_score - previousHealth.diversification_score > 0 ? '+' : ''}${calculatedHealth.diversification_score - previousHealth.diversification_score})
- Fragility: ${previousHealth.fragility_index} → ${calculatedHealth.fragility_index} (${calculatedHealth.fragility_index - previousHealth.fragility_index > 0 ? '+' : ''}${calculatedHealth.fragility_index - previousHealth.fragility_index})
- Risk: ${previousHealth.risk_level} → ${calculatedHealth.risk_level} (${calculatedHealth.risk_level - previousHealth.risk_level > 0 ? '+' : ''}${calculatedHealth.risk_level - previousHealth.risk_level})
` : ''}

DETECTED ALERTS:
${calculatedHealth.health_alerts.map(a => `- ${a.type} (${a.severity}): ${a.message}`).join('\n')}

Provide a concise weekly_summary paragraph that:
1. Explains overall portfolio health in simple terms
2. Highlights key risks or strengths
3. Mentions notable changes if previous data exists
4. Is conversational and actionable

Example: "Your portfolio shows moderate diversification with ${holdingsList.length} holdings, but your largest position represents ${calculatedHealth.metrics.maxConcentration.toFixed(0)}% of total value, creating significant fragility risk..."`;

    try {
      const result = await awsApi.analyzePortfolioHealth(prompt, calculatedHealth);

      const healthData = {
        ...calculatedHealth,
        weekly_summary: result.weekly_summary,
        analysis_date: new Date().toISOString()
      };

      await awsApi.savePortfolioHealth(healthData);
      await loadData();
    } catch (error) {
      console.error("Error analyzing health:", error);
      alert("Error analyzing portfolio health. Please try again.");
    }

    setIsAnalyzing(false);
  };

  const getScoreColor = (score, inverse = false) => {
    if (inverse) {
      if (score <= 30) return "text-emerald-600";
      if (score <= 60) return "text-amber-600";
      return "text-rose-600";
    }
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  const getScoreBg = (score, inverse = false) => {
    if (inverse) {
      if (score <= 30) return "bg-emerald-50 border-emerald-200";
      if (score <= 60) return "bg-amber-50 border-amber-200";
      return "bg-rose-50 border-rose-200";
    }
    if (score >= 70) return "bg-emerald-50 border-emerald-200";
    if (score >= 40) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  const getAlertIcon = (severity) => {
    if (severity === "high") return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    if (severity === "medium") return <AlertCircle className="w-5 h-5 text-amber-600" />;
    return <AlertCircle className="w-5 h-5 text-blue-600" />;
  };

  const getAlertColor = (severity) => {
    if (severity === "high") return "bg-rose-100 text-rose-700 border-rose-200";
    if (severity === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const prepareChartData = () => {
    return healthRecords.slice(0, 30).reverse().map(record => ({
      date: format(new Date(record.analysis_date), 'MMM d'),
      diversification: Math.round(record.diversification_score),
      fragility: Math.round(record.fragility_index),
      risk: Math.round(record.risk_level)
    }));
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
            Portfolio Health Monitor
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-slate-600">
            Track your portfolio as a living system
          </p>
        </motion.div>

        <div className="mb-8">
          <Card className="border-2 border-slate-200 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Daily Health Check</h3>
                  <p className="text-sm text-slate-600">Monitor diversification, fragility, and risk drift</p>
                </div>
                <Button
                  onClick={analyzePortfolioHealth}
                  disabled={isAnalyzing || !portfolio || !portfolio.assets || portfolio.assets.length === 0}
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
                      {currentHealth ? "Refresh Check" : "Run Health Check"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {!currentHealth ? (
          <Card className="border-2 border-slate-200 shadow-lg bg-white">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Health Data Yet</h3>
              <p className="text-slate-500 mb-6">
                Run your first health check to monitor your portfolio's vital signs
              </p>
              {(!portfolio || !portfolio.assets || portfolio.assets.length === 0) && (
                <p className="text-sm text-slate-400">
                  Execute paper trades to build your portfolio first
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-2 border-emerald-200 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-emerald-600" />
                  Overall Portfolio Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-xl p-6 mb-4">
                  <p className="text-sm text-slate-600 mb-2">Last checked: {format(new Date(currentHealth.analysis_date), 'MMM d, yyyy h:mm a')}</p>
                  <p className="text-slate-700 leading-relaxed">{currentHealth.weekly_summary}</p>
                </div>

                {previousHealth && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Risk Change</p>
                      <p className={`text-lg font-bold ${currentHealth.risk_level > previousHealth.risk_level ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {currentHealth.risk_level > previousHealth.risk_level ? '+' : ''}
                        {Math.round(currentHealth.risk_level - previousHealth.risk_level)}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Fragility Change</p>
                      <p className={`text-lg font-bold ${currentHealth.fragility_index > previousHealth.fragility_index ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {currentHealth.fragility_index > previousHealth.fragility_index ? '+' : ''}
                        {Math.round(currentHealth.fragility_index - previousHealth.fragility_index)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Days Tracked</p>
                      <p className="text-lg font-bold text-slate-900">
                        {differenceInDays(new Date(currentHealth.analysis_date), new Date(previousHealth.analysis_date))}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Asset Correlation Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Average Correlation Coefficient</span>
                      <span className={`text-sm font-bold ${
                        (currentHealth.correlation_coefficient || 0) < 0 ? 'text-emerald-600' : 
                        (currentHealth.correlation_coefficient || 0) < 0.3 ? 'text-blue-600' :
                        (currentHealth.correlation_coefficient || 0) < 0.7 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {(currentHealth.correlation_coefficient || 0).toFixed(3)}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          (currentHealth.correlation_coefficient || 0) < 0 ? 'bg-emerald-500' : 
                          (currentHealth.correlation_coefficient || 0) < 0.3 ? 'bg-blue-500' :
                          (currentHealth.correlation_coefficient || 0) < 0.7 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${((currentHealth.correlation_coefficient || 0) + 1) * 50}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>-1.0 (Perfect Negative)</span>
                      <span>0.0 (No Correlation)</span>
                      <span>+1.0 (Perfect Positive)</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                    {(currentHealth.correlation_coefficient || 0) < 0 && "🎯 Excellent: Assets move inversely, providing strong diversification"}
                    {(currentHealth.correlation_coefficient || 0) >= 0 && (currentHealth.correlation_coefficient || 0) < 0.3 && "✅ Good: Low correlation means assets are well-diversified"}
                    {(currentHealth.correlation_coefficient || 0) >= 0.3 && (currentHealth.correlation_coefficient || 0) < 0.7 && "⚠️ Moderate: Some correlation exists between your assets"}
                    {(currentHealth.correlation_coefficient || 0) >= 0.7 && "🚨 High: Assets are highly correlated, reducing diversification benefits"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`border-2 shadow-lg rounded-xl h-full ${getScoreBg(currentHealth.diversification_score)}`}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <Shield className={`w-5 h-5 md:w-6 md:h-6 ${getScoreColor(currentHealth.diversification_score)}`} />
                    <h4 className="font-semibold text-sm md:text-base text-slate-900">Diversification</h4>
                  </div>
                  <p className={`text-3xl md:text-4xl font-bold mb-2 ${getScoreColor(currentHealth.diversification_score)} break-words`}>
                    {Math.round(currentHealth.diversification_score)}
                  </p>
                  <Progress value={currentHealth.diversification_score} className="h-2 mb-2" />
                  <p className="text-xs text-slate-600">
                    {currentHealth.diversification_score >= 70 && "Well diversified"}
                    {currentHealth.diversification_score >= 40 && currentHealth.diversification_score < 70 && "Moderately diversified"}
                    {currentHealth.diversification_score < 40 && "Needs diversification"}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-2 shadow-lg rounded-xl h-full ${getScoreBg(currentHealth.fragility_index, true)}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className={`w-6 h-6 ${getScoreColor(currentHealth.fragility_index, true)}`} />
                    <h4 className="font-semibold text-slate-900">Fragility Index</h4>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${getScoreColor(currentHealth.fragility_index, true)}`}>
                    {Math.round(currentHealth.fragility_index)}
                  </p>
                  <Progress value={currentHealth.fragility_index} className="h-2 mb-2" />
                  <p className="text-xs text-slate-600">
                    {currentHealth.fragility_index <= 30 && "Robust portfolio"}
                    {currentHealth.fragility_index > 30 && currentHealth.fragility_index <= 60 && "Moderate fragility"}
                    {currentHealth.fragility_index > 60 && "High fragility"}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-2 shadow-lg rounded-xl h-full ${getScoreBg(currentHealth.dependency_score, true)}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className={`w-6 h-6 ${getScoreColor(currentHealth.dependency_score, true)}`} />
                    <h4 className="font-semibold text-slate-900">Dependency</h4>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${getScoreColor(currentHealth.dependency_score, true)}`}>
                    {Math.round(currentHealth.dependency_score)}
                  </p>
                  <Progress value={currentHealth.dependency_score} className="h-2 mb-2" />
                  <p className="text-xs text-slate-600">
                    {currentHealth.dependency_score <= 30 && "Low concentration"}
                    {currentHealth.dependency_score > 30 && currentHealth.dependency_score <= 60 && "Moderate concentration"}
                    {currentHealth.dependency_score > 60 && "High sector dependency"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {currentHealth.health_alerts && currentHealth.health_alerts.length > 0 && (
              <Card className="border-2 border-amber-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    Health Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentHealth.health_alerts.map((alert, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`${getAlertColor(alert.severity)} border`}>
                              {alert.severity} priority
                            </Badge>
                            <Badge variant="outline" className="bg-slate-100 text-slate-700">
                              {alert.type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {healthRecords.length > 1 && (
              <Card className="border-2 border-slate-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-6 h-6 text-blue-600" />
                    Health Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLine data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="diversification" stroke="#10b981" strokeWidth={2} name="Diversification" />
                      <Line type="monotone" dataKey="fragility" stroke="#f59e0b" strokeWidth={2} name="Fragility" />
                      <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} name="Risk" />
                    </RechartsLine>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
