import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Loader2,
  PauseCircle,
  PlayCircle,
  Clock,
  Target,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { checkUsageLimit, incrementUsage, getRemainingUsage } from "@/components/utils/usageLimit";
import { format } from "date-fns";
import { calculateCashOpportunity, estimateMarketUncertainty } from "@/components/utils/calculations/cashOpportunityMetrics";

export default function CashIntelligence() {
  const [analysis, setAnalysis] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [idleCashAmount, setIdleCashAmount] = useState("");
  const [idleCashMonths, setIdleCashMonths] = useState("");
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
    const data = await awsApi.getCashIntelligence();
    
    if (data && data.analysis) {
      setAnalysis(data.analysis);
    }
    if (data && data.holdings) {
      setHoldings(data.holdings);
    }
  };

  const analyzeCashOpportunity = async () => {
    if (!idleCashAmount || !idleCashMonths) {
      alert("Please enter idle cash amount and duration");
      return;
    }

    setIsAnalyzing(true);

    const calculatedCash = calculateCashOpportunity(idleCashAmount, idleCashMonths, holdings);
    const marketUncertainty = estimateMarketUncertainty();

    const totalInvested = holdings.reduce((sum, h) => 
      sum + (h.quantity * h.average_cost), 0);
    
    const currentValue = holdings.reduce((sum, h) => 
      sum + (h.quantity * (h.current_price || h.average_cost)), 0);

    const prompt = `Provide investment timing guidance based on current market conditions:

CALCULATED OPPORTUNITY COSTS (JavaScript):
- Idle Cash: $${calculatedCash.idle_cash_amount.toLocaleString()}
- Months Idle: ${idleCashMonths}
- Missed Returns: $${calculatedCash.missed_returns.toLocaleString()}
- Total Opportunity Cost: $${calculatedCash.total_opportunity_cost.toLocaleString()}
- Annual Return Used: ${calculatedCash.context.annualReturnUsed}%

LOW-YIELD ASSETS DETECTED:
${calculatedCash.low_yield_assets.map(a => `- ${a.symbol}: ${a.current_yield}% yield, $${Math.round(a.opportunity_cost)} opportunity cost`).join('\n')}

PORTFOLIO CONTEXT:
- Total Portfolio Value: $${calculatedCash.context.portfolioValue.toLocaleString()}
- Total Invested: $${totalInvested.toLocaleString()}
- Current Value: $${currentValue.toLocaleString()}

MARKET CONDITIONS (Current):
- Estimated Market Uncertainty: ${marketUncertainty}/100

Your task: Provide deployment strategy (NOT recalculate opportunity costs):

1. deployment_signal: Choose ONE based on current market:
   - "invest_now" (favorable valuations)
   - "pause_dca" (overvalued)
   - "hold_cash" (high uncertainty)
   - "gradual_entry" (moderate risk)

2. market_uncertainty_score: 0-100 based on current conditions

3. deployment_reasoning: Explain your signal with:
   - Current market conditions
   - Valuation environment
   - Timing rationale

4. optimal_actions: 3-5 specific actionable steps

Focus on WHEN and HOW to deploy, not opportunity cost calculation.`;

    try {
      const result = await awsApi.analyzeCashOpportunity(prompt, calculatedCash);

      const analysisData = {
        idle_cash_amount: calculatedCash.idle_cash_amount,
        missed_returns: calculatedCash.missed_returns,
        low_yield_assets: calculatedCash.low_yield_assets,
        deployment_signal: result.deployment_signal,
        market_uncertainty_score: result.market_uncertainty_score,
        deployment_reasoning: result.deployment_reasoning,
        optimal_actions: result.optimal_actions,
        analysis_date: format(new Date(), 'yyyy-MM-dd')
      };

      await awsApi.saveCashAnalysis(analysisData);
      await loadData();
    } catch (error) {
      console.error("Error analyzing:", error);
      alert("Error analyzing cash opportunity. Please try again.");
    }

    setIsAnalyzing(false);
  };

  const getSignalIcon = (signal) => {
    switch(signal) {
      case "invest_now": return <PlayCircle className="w-6 h-6 text-emerald-600" />;
      case "pause_dca": return <PauseCircle className="w-6 h-6 text-amber-600" />;
      case "hold_cash": return <AlertCircle className="w-6 h-6 text-rose-600" />;
      case "gradual_entry": return <Clock className="w-6 h-6 text-blue-600" />;
      default: return <Target className="w-6 h-6 text-slate-600" />;
    }
  };

  const getSignalColor = (signal) => {
    switch(signal) {
      case "invest_now": return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "pause_dca": return "bg-amber-50 border-amber-200 text-amber-700";
      case "hold_cash": return "bg-rose-50 border-rose-200 text-rose-700";
      case "gradual_entry": return "bg-blue-50 border-blue-200 text-blue-700";
      default: return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  const getSignalLabel = (signal) => {
    switch(signal) {
      case "invest_now": return "Invest Now";
      case "pause_dca": return "Pause DCA";
      case "hold_cash": return "Hold Cash";
      case "gradual_entry": return "Gradual Entry";
      default: return signal;
    }
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
            Cash & Opportunity Intelligence
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-slate-600">
            Track opportunity costs and optimize capital deployment timing
          </p>
        </motion.div>

        <div className="mb-8 space-y-6">
          <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                Your Idle Cash Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Idle Cash Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g., 5000"
                    value={idleCashAmount}
                    onChange={(e) => setIdleCashAmount(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Cash sitting in savings/checking accounts
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Months Not Invested
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g., 6"
                    value={idleCashMonths}
                    onChange={(e) => setIdleCashMonths(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    How long has this cash been idle?
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={analyzeCashOpportunity}
                  disabled={isAnalyzing || !idleCashAmount || !idleCashMonths}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {analysis ? "Refresh Analysis" : "Analyze My Cash"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {!analysis ? (
          <Card className="border-2 border-slate-200 shadow-lg bg-white">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Cash Analysis Yet</h3>
              <p className="text-slate-500 mb-6">
                Run your first analysis to discover opportunity costs and optimal deployment timing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-2 border-rose-200 shadow-xl bg-gradient-to-br from-rose-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                  Opportunity Cost Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                  <div className="bg-white rounded-xl p-4 md:p-6">
                    <p className="text-xs md:text-sm text-slate-600 mb-2">Idle Cash Identified</p>
                    <p className="text-3xl md:text-4xl font-bold text-rose-600 mb-2 break-words">
                      ${Math.round(analysis.idle_cash_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-slate-700">
                      Cash sitting in low-yield accounts
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 md:p-6">
                    <p className="text-xs md:text-sm text-slate-600 mb-2">Missed Returns This Year</p>
                    <p className="text-3xl md:text-4xl font-bold text-amber-600 mb-2 break-words">
                      ~${Math.round(analysis.missed_returns || 0).toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-slate-700">
                      Opportunity cost of idle capital
                    </p>
                  </div>
                </div>

                {analysis.low_yield_assets && analysis.low_yield_assets.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3">Low-Yield Assets</h4>
                    <div className="grid gap-3">
                      {analysis.low_yield_assets.map((asset, idx) => (
                        <Card key={idx} className="border border-slate-200 bg-white">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900">{asset.symbol}</p>
                                <p className="text-sm text-slate-600">
                                  Current Yield: {asset.current_yield.toFixed(2)}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-600">Opportunity Cost</p>
                                <p className="text-lg font-bold text-amber-600">
                                  ${Math.round(asset.opportunity_cost).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`border-2 shadow-xl ${getSignalColor(analysis.deployment_signal)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSignalIcon(analysis.deployment_signal)}
                  Smart Capital Deployment Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Current Signal</p>
                      <Badge className={`${getSignalColor(analysis.deployment_signal)} border text-lg px-4 py-2`}>
                        {getSignalLabel(analysis.deployment_signal)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 mb-2">Market Uncertainty</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {Math.round(analysis.market_uncertainty_score || 0)}%
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Analysis Date</p>
                    <p className="text-sm text-slate-600">
                      {format(new Date(analysis.analysis_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Why This Signal?
                  </h4>
                  <div className="prose max-w-none">
                    <p className="text-slate-700 leading-relaxed text-base">
                      {analysis.deployment_reasoning.replace(/\s*\(\[.*?\]\(.*?\)\)/g, '')}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-3">
                      <a 
                        href__="https://apnews.com/article/f77b286bdcee7e86714d89374e3288ee" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline text-sm transition-colors"
                      >
                        AP News: Market Analysis
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <a 
                        href__="https://www.pers.ms.gov/sites/default/files/Content/Board_Materials/2025/April/Materials/Investment%20Committee%20Meeting_April%202025.pdf" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline text-sm transition-colors"
                      >
                        PERS: Valuation Report
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {analysis.optimal_actions && analysis.optimal_actions.length > 0 && (
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-emerald-600" />
                      Optimal Actions
                    </h4>
                    <div className="space-y-3">
                      {analysis.optimal_actions.map((action, idx) => {
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        const parts = action.split(urlRegex);
                        
                        return (
                          <div key={idx} className="flex items-start gap-2 md:gap-3 bg-slate-50 rounded-lg p-3 md:p-4 border border-slate-200">
                            <div className="w-6 h-6 md:w-7 md:h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs md:text-sm font-bold text-emerald-600">{idx + 1}</span>
                            </div>
                            <p className="text-xs md:text-sm text-slate-700 flex-1 break-words overflow-hidden">
                              {parts.map((part, i) => 
                                part.match(/(https?:\/\/)/) ? (
                                  <a 
                                    key={i}
                                    href__={part} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                                  >
                                    [link]
                                  </a>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  Signal Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <PlayCircle className="w-5 h-5 text-emerald-600" />
                      <h5 className="font-bold text-emerald-900">Invest Now</h5>
                    </div>
                    <p className="text-sm text-slate-700">
                      Market conditions favorable. Deploy available capital at current levels.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h5 className="font-bold text-blue-900">Gradual Entry</h5>
                    </div>
                    <p className="text-sm text-slate-700">
                      Dollar-cost average over 3-6 months to reduce timing risk.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <PauseCircle className="w-5 h-5 text-amber-600" />
                      <h5 className="font-bold text-amber-900">Pause DCA</h5>
                    </div>
                    <p className="text-sm text-slate-700">
                      Markets overvalued. Temporarily pause regular contributions.
                    </p>
                  </div>
                  
                  <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      <h5 className="font-bold text-rose-900">Hold Cash</h5>
                    </div>
                    <p className="text-sm text-slate-700">
                      High uncertainty. Keep powder dry for better opportunities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
