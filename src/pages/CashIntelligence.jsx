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
  AlertCircle,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { checkUsageLimit, incrementUsage, getRemainingUsage } from "@/components/utils/usageLimit";
import { format } from "date-fns";
import { calculateCashOpportunityMetrics, estimateMarketUncertainty } from "@/components/utils/calculations/cashOpportunityMetrics";

export default function CashIntelligence() {
  const [analysis, setAnalysis] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [idleCashAmount, setIdleCashAmount] = useState("");
  const [idleCashMonths, setIdleCashMonths] = useState("");
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [vixData, setVixData] = useState(null);
  const [vixError, setVixError] = useState(false);

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
      const userId = localStorage.getItem('user_id');
      const data = await awsApi.getStockBatch(userId);
      
      if (data && data.syncPortfolio && data.syncPortfolio.assets) {
        setHoldings(data.syncPortfolio.assets);
      }

      const storedAnalysis = localStorage.getItem('cash_intelligence_analysis');
      if (storedAnalysis) {
        setAnalysis(JSON.parse(storedAnalysis));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  /**
   * Fetch real-time VIX data from Lambda function
   * Provides graceful fallback if Lambda fails
   */
  const fetchVIXData = async () => {
    try {
      console.log('🔍 Fetching VIX data from Lambda...');
      
      const response = await awsApi.callAwsFunction('getVIXData', {});
      
      // Parse Lambda response
      let vixResponse;
      if (typeof response === 'string') {
        vixResponse = JSON.parse(response);
      } else if (response.body) {
        vixResponse = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
      } else {
        vixResponse = response;
      }

      console.log('✅ VIX Lambda Response:', vixResponse);

      if (vixResponse.success && vixResponse.currentVIX) {
        setVixData(vixResponse);
        setVixError(false);
        return vixResponse.currentVIX;
      } else {
        // Lambda returned fallback data
        console.warn('⚠️ VIX Lambda returned fallback data');
        setVixData(vixResponse);
        setVixError(true);
        return vixResponse.currentVIX || null;
      }
    } catch (error) {
      console.error('❌ VIX Lambda Error:', error);
      setVixError(true);
      setVixData(null);
      return null;
    }
  };

  const generateStaticRecommendation = (calculatedCash, marketUncertainty, vixInfo = null) => {
    let deployment_signal = "gradual_entry";
    let deployment_reasoning = "";
    const optimal_actions = [];

    const totalInvested = holdings.reduce((sum, h) => 
      sum + (h.quantity * h.average_cost), 0);
    
    const currentValue = holdings.reduce((sum, h) => 
      sum + (h.quantity * (h.current_price || h.average_cost)), 0);

    const portfolioGain = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    // Enhanced reasoning with VIX data if available
    const vixContext = vixInfo && vixInfo.currentVIX 
      ? ` Current VIX is ${vixInfo.currentVIX}, indicating ${vixInfo.regime || 'normal'} market volatility.`
      : '';

    if (marketUncertainty > 70) {
      deployment_signal = "hold_cash";
      deployment_reasoning = `Market uncertainty is elevated at ${marketUncertainty}%.${vixContext} Given high volatility and uncertain market conditions, it's prudent to hold cash and wait for clearer market signals. Your idle cash of $${Math.round(calculatedCash.idle_cash_amount).toLocaleString()} can be deployed when uncertainty decreases.`;
      optimal_actions.push("Monitor VIX and market volatility indicators daily.");
      optimal_actions.push("Set price targets on key holdings for potential rebalancing.");
      optimal_actions.push("Keep cash reserves at current levels for opportunistic buying.");
    } else if (marketUncertainty > 50) {
      deployment_signal = "gradual_entry";
      deployment_reasoning = `Market uncertainty is moderate at ${marketUncertainty}%.${vixContext} Implement a dollar-cost averaging strategy with your $${Math.round(calculatedCash.idle_cash_amount).toLocaleString()} idle cash over the next 3-6 months. This reduces timing risk while deploying capital systematically.`;
      optimal_actions.push(`Divide $${Math.round(calculatedCash.idle_cash_amount).toLocaleString()} into 6 equal monthly tranches of $${Math.round(calculatedCash.idle_cash_amount / 6).toLocaleString()}.`);
      optimal_actions.push("Start with equal-weight distribution across your top performers.");
      optimal_actions.push("Rebalance monthly based on market conditions and portfolio drift.");
    } else if (portfolioGain > 15) {
      deployment_signal = "pause_dca";
      deployment_reasoning = `Your portfolio has gained ${portfolioGain.toFixed(1)}%, suggesting strong recent performance. With market uncertainty at ${marketUncertainty}%,${vixContext} consider pausing regular contributions temporarily. Your idle cash of $${Math.round(calculatedCash.idle_cash_amount).toLocaleString()} remains available if valuations become more attractive.`;
      optimal_actions.push("Pause regular monthly contributions for 1-2 months.");
      optimal_actions.push("Review profit-taking opportunities on top performers.");
      optimal_actions.push("Monitor for pullback opportunities to resume dollar-cost averaging.");
    } else {
      deployment_signal = "invest_now";
      deployment_reasoning = `Current market conditions favor deployment with uncertainty at ${marketUncertainty}%.${vixContext} Your portfolio shows modest gains with room for growth. Deploy your $${Math.round(calculatedCash.idle_cash_amount).toLocaleString()} idle cash now to take advantage of current valuations and benefit from compound growth.`;
      optimal_actions.push(`Deploy full $${Math.round(calculatedCash.idle_cash_amount).toLocaleString()} across your diversified holdings.`);
      optimal_actions.push("Focus on your highest-conviction positions first.");
      optimal_actions.push("Complete deployment within 1-2 weeks before market conditions shift.");
    }

    return {
      deployment_signal,
      deployment_reasoning,
      optimal_actions
    };
  };

  const analyzeCashOpportunity = async () => {
    if (!idleCashAmount || !idleCashMonths) {
      alert("Please enter idle cash amount and duration");
      return;
    }

    setIsAnalyzing(true);

    try {
      // STEP 1: Fetch real-time VIX data from Lambda
      console.log('📊 Step 1: Fetching VIX data...');
      const vixLevel = await fetchVIXData();
      
      // STEP 2: Calculate cash opportunity metrics (with time adjustment)
      console.log('💰 Step 2: Calculating cash opportunity...');
      const calculatedCash = calculateCashOpportunityMetrics(
        idleCashAmount, 
        idleCashMonths, 
        holdings,
        10 // 10% default market return
      );

      // STEP 3: Estimate market uncertainty (with VIX if available)
      console.log('📈 Step 3: Estimating market uncertainty...');
      const marketUncertainty = estimateMarketUncertainty(vixLevel);

      console.log('✅ Analysis complete:', {
        vixLevel,
        marketUncertainty,
        cashCalculation: calculatedCash
      });

      // STEP 4: Generate recommendations
      const recommendation = generateStaticRecommendation(
        calculatedCash, 
        marketUncertainty,
        vixData
      );

      // STEP 5: Build analysis data
      const analysisData = {
        idle_cash_amount: calculatedCash.idle_cash_amount,
        missed_returns: calculatedCash.missed_returns,
        low_yield_assets: calculatedCash.low_yield_assets,
        total_opportunity_cost: calculatedCash.total_opportunity_cost,
        total_missed: calculatedCash.total_missed,
        deployment_signal: recommendation.deployment_signal,
        market_uncertainty_score: marketUncertainty,
        deployment_reasoning: recommendation.deployment_reasoning,
        optimal_actions: recommendation.optimal_actions,
        analysis_date: format(new Date(), 'yyyy-MM-dd'),
        vix_data: vixData ? {
          currentVIX: vixData.currentVIX,
          regime: vixData.regime,
          riskLevel: vixData.riskLevel,
          dataSource: vixData.dataSource
        } : null
      };

      localStorage.setItem('cash_intelligence_analysis', JSON.stringify(analysisData));
      setAnalysis(analysisData);
      
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

  const getVIXBadgeColor = (vixLevel) => {
    if (vixLevel < 15) return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (vixLevel < 20) return "bg-blue-100 text-blue-700 border-blue-300";
    if (vixLevel < 30) return "bg-amber-100 text-amber-700 border-amber-300";
    if (vixLevel < 40) return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-rose-100 text-rose-700 border-rose-300";
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
            Track opportunity costs and optimize capital deployment timing with real-time market volatility analysis
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
            {/* VIX Data Card (if available) */}
            {analysis.vix_data && (
              <Card className="border-2 border-purple-200 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-6 h-6 text-purple-600" />
                    Real-Time Market Volatility (VIX)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-xs text-slate-600 mb-2">Current VIX</p>
                      <p className="text-3xl font-bold text-purple-600 mb-2">
                        {analysis.vix_data.currentVIX}
                      </p>
                      <Badge className={`${getVIXBadgeColor(analysis.vix_data.currentVIX)} border text-sm`}>
                        {analysis.vix_data.regime}
                      </Badge>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-xs text-slate-600 mb-2">Risk Level</p>
                      <p className="text-2xl font-bold text-slate-900 mb-2">
                        {analysis.vix_data.riskLevel}
                      </p>
                      <p className="text-xs text-slate-600">
                        Market volatility assessment
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-xs text-slate-600 mb-2">Data Source</p>
                      <p className="text-sm font-semibold text-slate-900 mb-2">
                        {analysis.vix_data.dataSource.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-600">
                        Live market data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <p className="text-xs md:text-sm text-slate-600 mb-2">Missed Returns (Time-Adjusted)</p>
                    <p className="text-3xl md:text-4xl font-bold text-amber-600 mb-2 break-words">
                      ~${Math.round(analysis.missed_returns || 0).toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-slate-700">
                      Opportunity cost for {idleCashMonths} months idle
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
                                  Current Yield: {asset.current_yield?.toFixed(2) || 0}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-600">Opportunity Cost</p>
                                <p className="text-lg font-bold text-amber-600">
                                  ${Math.round(asset.opportunity_cost || 0).toLocaleString()}
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
                      {analysis.vix_data && (
                        <p className="text-xs text-slate-500 mt-1">
                          Based on VIX: {analysis.vix_data.currentVIX}
                        </p>
                      )}
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
                      {analysis.deployment_reasoning}
                    </p>
                  </div>
                </div>

                {analysis.optimal_actions && analysis.optimal_actions.length > 0 && (
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-emerald-600" />
                      Optimal Actions
                    </h4>
                    <div className="space-y-3">
                      {analysis.optimal_actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2 md:gap-3 bg-slate-50 rounded-lg p-3 md:p-4 border border-slate-200">
                          <div className="w-6 h-6 md:w-7 md:h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs md:text-sm font-bold text-emerald-600">{idx + 1}</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-700 flex-1 break-words overflow-hidden">
                            {action}
                          </p>
                        </div>
                      ))}
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
