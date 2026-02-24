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
  LineChart,
  Brain 
} from "lucide-react";
import { motion } from "framer-motion";
import { checkUsageLimit, incrementUsage, getRemainingUsage } from "@/components/utils/usageLimit";
import { format, differenceInDays } from "date-fns";
import { Line, LineChart as RechartsLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 5. HealthGauge Component
const HealthGauge = ({ score, colorClass }) => {
  const gaugeColor = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="relative w-32 h-16 overflow-hidden mb-4">
      <div 
        className="absolute top-0 left-0 w-32 h-32 rounded-full border-[10px] border-slate-100"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${gaugeColor} ${score * 1.8}deg, transparent 0deg)`,
          maskImage: 'radial-gradient(transparent 58%, black 60%)',
          WebkitMaskImage: 'radial-gradient(transparent 58%, black 60%)'
        }}
      />
      <div className="absolute bottom-0 w-full text-center">
        <span className={`text-2xl font-black ${colorClass}`}>{Math.round(score)}</span>
      </div>
    </div>
  );
};

export default function PortfolioHealth() {
  const [healthRecords, setHealthRecords] = useState([]);
  const [currentHealth, setCurrentHealth] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previousHealth, setPreviousHealth] = useState(null);
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadData();
    loadRemainingUsage();
  }, []);

  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

  const loadData = async () => {
    try {
      const syncResponse = await awsApi.syncPortfolio(null);
      if (syncResponse && syncResponse.portfolio) {
        setPortfolio(syncResponse.portfolio);
        const email = syncResponse.userEmail || "";
        setUserEmail(email);
        const storedRecords = localStorage.getItem('portfolio_health_records');
        const records = storedRecords ? JSON.parse(storedRecords) : [];
        setHealthRecords(records);
        if (records.length > 0) {
          setCurrentHealth(records[0]);
          if (records.length > 1) setPreviousHealth(records[1]);
        }
      }
    } catch (error) {
      console.error("Industrial Load Error:", error);
    }
  };

  // ***** START: INDUSTRIAL AI ANALYSIS SECTION *****
  const analyzePortfolioHealth = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
      alert("No portfolio assets found. Execute a trade first.");
      setIsAnalyzing(false);
      return;
    }

    try {
      // 1. Call backend Health Lambda
      const healthResponse = await awsApi.calculatePortfolioHealth({
        userEmail: userEmail
      });

      if (healthResponse && healthResponse.success) {
        const mathHealth = healthResponse.health;

        // Fixed prompt to remove CRO, TASK, etc
        const prompt = `Perform a Stress Test as a risk manager on these metrics:
- Diversification: ${mathHealth.diversification_score}/100
- Fragility: ${mathHealth.fragility_index}/100
- Risk Level: ${mathHealth.risk_level}/100

PORTFOLIO HOLDINGS:
${portfolio.assets.map(a => `${a.symbol}: ${((a.quantity * a.currentPrice)/portfolio.totalValue*100).toFixed(1)}%`).join('\n')}

INSTRUCTIONS:
1. Check if any asset exceeds 30%.
2. Provide a one-sentence diagnosis and one-sentence prescription.
Return ONLY JSON: {"diagnosis": "...", "prescription": "...", "weekly_summary": "..."}`;

       const aiResponse = await awsApi.invokeLLM(prompt);
        let docInsights = { weekly_summary: "", diagnosis: "", prescription: "" };

        try {
          // Extract JSON from AI response
          const raw = aiResponse?.response || aiResponse?.analysis || "{}";
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : raw;
          const parsed = typeof cleanJson === 'string' ? JSON.parse(cleanJson) : cleanJson;
          
          // Map the parsed data to our object
          docInsights = {
            diagnosis: parsed.diagnosis || parsed.ai_diagnosis || "",
            prescription: parsed.prescription || parsed.ai_prescription || "",
            weekly_summary: parsed.weekly_summary || ""
          };
        } catch (e) {
          console.error("Industrial AI Parsing Error:", e);
        }

        const finalHealthData = {
          ...mathHealth,
          ai_diagnosis: docInsights.diagnosis || "Portfolio vital signs are within normal parameters.",
          ai_prescription: docInsights.prescription || "Continue monitoring for sector-specific volatility.",
          weekly_summary: docInsights.weekly_summary || `Analysis complete. Portfolio diversification is currently ${mathHealth.diversification_score}%. Risk levels are stabilized at ${mathHealth.risk_level}/100.`,
          analysis_date: new Date().toISOString()
        };

        const records = JSON.parse(localStorage.getItem('portfolio_health_records') || '[]');
        records.unshift(finalHealthData);
        const updatedRecords = records.slice(0, 100);
        localStorage.setItem('portfolio_health_records', JSON.stringify(updatedRecords));

        setHealthRecords(updatedRecords);
        setCurrentHealth(finalHealthData);
        if (updatedRecords.length > 1) setPreviousHealth(updatedRecords[1]);
      }
    } catch (error) {
      console.error("Sophisticated Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  // ***** END: INDUSTRIAL AI ANALYSIS SECTION *****

  // ***** PDF Export Function *****
  const downloadHealthReport = () => {
    if (!currentHealth) return;
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Portfolio Health Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 20px; }
            .metrics { display: flex; gap: 20px; margin-bottom: 30px; }
            .metric-box { flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; background: #f8fafc; }
            h2 { color: #3b82f6; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Clinical Portfolio Health Report</h1><p>${format(new Date(currentHealth.analysis_date), 'PPP p')}</p></div>
          <div class="summary"><h2>Executive Summary</h2><p>${currentHealth.weekly_summary}</p></div>
          <div class="metrics">
            <div class="metric-box"><h2>Diversification</h2><strong>${currentHealth.diversification_score}/100</strong></div>
            <div class="metric-box"><h2>Fragility Index</h2><strong>${currentHealth.fragility_index}/100</strong></div>
            <div class="metric-box"><h2>Risk Level</h2><strong>${currentHealth.risk_level}/100</strong></div>
          </div>
          <h2>Clinical Diagnosis</h2><p><i>"${currentHealth.ai_diagnosis}"</i></p>
          <h2>Recommended Treatment</h2><p style="color: #059669; font-weight: bold;">${currentHealth.ai_prescription}</p>
        </body>
      </html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // ***** START: INDUSTRIAL COLOR LOGIC SECTION *****
  const getScoreColor = (score, inverse = false) => {
    const s = Math.round(score);
    if (inverse) {
      if (s <= 15) return "text-emerald-600";
      if (s <= 35) return "text-blue-600";
      if (s <= 60) return "text-amber-600";
      if (s <= 80) return "text-rose-600";
      return "text-red-700 font-black animate-pulse";
    }
    if (s >= 85) return "text-emerald-600 font-bold";
    if (s >= 70) return "text-blue-600";
    if (s >= 50) return "text-amber-600";
    if (s >= 30) return "text-rose-600";
    return "text-red-700 font-black animate-pulse";
  };

  const getScoreBg = (score, inverse = false) => {
    const s = Math.round(score);
    if (inverse) {
      if (s <= 15) return "bg-emerald-50 border-emerald-200";
      if (s <= 35) return "bg-blue-50 border-blue-200";
      if (s <= 60) return "bg-amber-50 border-amber-200";
      if (s <= 80) return "bg-rose-50 border-rose-200";
      return "bg-red-100 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.2)]";
    }
    if (s >= 85) return "bg-emerald-50 border-emerald-200";
    if (s >= 70) return "bg-blue-50 border-blue-200";
    if (s >= 50) return "bg-amber-50 border-amber-200";
    if (s >= 30) return "bg-rose-50 border-rose-200";
    return "bg-red-100 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.2)]";
  };
  // ***** END: INDUSTRIAL COLOR LOGIC SECTION *****

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
      risk: Math.round(record.risk_level),
      dependency: Math.round(record.dependency_score)
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
              <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 min-h-[80px]">
                <div className="flex flex-col justify-center text-center md:text-left">
                  <h3 className="font-bold text-slate-900 mb-1">Daily Health Check</h3>
                  <p className="text-sm text-slate-600">Monitor diversification, fragility, and risk drift</p>
                </div>
                <div className="flex items-center gap-2">
                  {currentHealth && (
                    <Button 
                      variant="outline" 
                      onClick={downloadHealthReport}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  )}
                  <Button
                    onClick={analyzePortfolioHealth}
                    disabled={isAnalyzing || !portfolio}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {currentHealth ? "Refresh Check" : "Run Health Check"}
                  </Button>
                </div>
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

            {/* THE PORTFOLIO DOCTOR CARD - ENHANCED */}
            {currentHealth && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden min-h-[160px] flex flex-col md:flex-row">
                  <div className="bg-blue-600 p-6 flex items-center justify-center md:w-32 shrink-0">
                    <Brain className={`w-12 h-12 text-white ${isAnalyzing ? "animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]" : ""}`} />
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3">DIAGNOSIS</Badge>
                      <h3 className="text-xl font-bold tracking-tight uppercase">Portfolio Stress Test</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Clinical Observations</p>
                        <p className="text-lg font-medium italic text-white leading-snug">
                          {currentHealth.ai_diagnosis && currentHealth.ai_diagnosis !== "..." 
                            ? `"${currentHealth.ai_diagnosis}"` 
                            : "Analysis pending..."}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Recommended Treatment</p>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="text-lg font-bold leading-snug">{currentHealth.ai_prescription}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* OVERALL PORTFOLIO HEALTH CARD (improved, as specified) */}
            <Card className="border-2 border-emerald-200 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Heart className="w-6 h-6" />
                  Overall Portfolio Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-emerald-100">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">
                    Last checked: {format(new Date(currentHealth.analysis_date), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-slate-700 leading-relaxed text-lg font-medium">
                    {currentHealth.weekly_summary}
                  </p>
                </div>

                {previousHealth && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-4 border border-emerald-100 text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Risk Change</p>
                      <p className={`text-xl font-black ${currentHealth.risk_level > previousHealth.risk_level ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {currentHealth.risk_level > previousHealth.risk_level ? '+' : ''}{Math.round(currentHealth.risk_level - previousHealth.risk_level)}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-emerald-100 text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Fragility Change</p>
                      <p className={`text-xl font-black ${currentHealth.fragility_index > previousHealth.fragility_index ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {currentHealth.fragility_index > previousHealth.fragility_index ? '+' : ''}{Math.round(currentHealth.fragility_index - previousHealth.fragility_index)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-emerald-100 text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Days Tracked</p>
                      <p className="text-xl font-black text-slate-900">{differenceInDays(new Date(), new Date(currentHealth.analysis_date))}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ...all other cards and logic remain unchanged... */}
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
              <Card className={`border shadow-lg h-full flex flex-col ${getScoreBg(currentHealth.diversification_score)}`}>
                <CardContent className="p-6 flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className={`w-6 h-6 ${getScoreColor(currentHealth.diversification_score)}`} />
                    <h4 className="font-bold text-slate-900">Diversification</h4>
                  </div>
                  <HealthGauge score={currentHealth.diversification_score} colorClass={getScoreColor(currentHealth.diversification_score)} />
                  <div className="mt-auto">
                    <Progress value={currentHealth.diversification_score} className="h-2 mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Well diversified</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border shadow-lg h-full flex flex-col ${getScoreBg(currentHealth.fragility_index, true)}`}>
                <CardContent className="p-6 flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className={`w-6 h-6 ${getScoreColor(currentHealth.fragility_index, true)}`} />
                    <h4 className="font-bold text-slate-900">Fragility Index</h4>
                  </div>
                  <HealthGauge score={currentHealth.fragility_index} colorClass={getScoreColor(currentHealth.fragility_index, true)} />
                  <div className="mt-auto">
                    <Progress value={currentHealth.fragility_index} className="h-2 mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Fragility Risk</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border shadow-lg h-full flex flex-col ${getScoreBg(currentHealth.dependency_score, true)}`}>
                <CardContent className="p-6 flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className={`w-6 h-6 ${getScoreColor(currentHealth.dependency_score, true)}`} />
                    <h4 className="font-bold text-slate-900">Dependency</h4>
                  </div>
                  <HealthGauge score={currentHealth.dependency_score} colorClass={getScoreColor(currentHealth.dependency_score, true)} />
                  <div className="mt-auto">
                    <Progress value={currentHealth.dependency_score} className="h-2 mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Sector Dependency</p>
                  </div>
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
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
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
                      <Line type="monotone" dataKey="dependency" stroke="#8b5cf6" strokeWidth={2} name="Dependency" />
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
