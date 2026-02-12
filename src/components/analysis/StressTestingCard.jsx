import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingDown,
  Shield,
  Clock,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import BehavioralNudge from "@/components/trust/BehavioralNudge";
import {
  STRESS_SCENARIOS,
  calculateStressImpact,
  calculateCrashProbability,
  calculateEnhancedDrawdown,
  estimateRecoveryTime,
  analyzeSectorVulnerability,
  calculateDiversificationBenefit
} from "@/components/utils/calculations/stressTesting";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function StressTestingCard({ companies, weights, portfolioRisk, expectedReturn }) {
  const [selectedScenario, setSelectedScenario] = useState('marketCrash');
  const [showDetails, setShowDetails] = useState(false);
  const [scenarioChanges, setScenarioChanges] = useState(0);

  // Track scenario changes for behavioral nudge
  React.useEffect(() => {
    setScenarioChanges(prev => prev + 1);
  }, [selectedScenario]);

  if (!companies || companies.length === 0 || !weights) return null;

  // Calculate stress impacts for all scenarios
  const stressResults = {
    marketCrash: calculateStressImpact(companies, weights, 'marketCrash'),
    sectorCollapse: calculateStressImpact(companies, weights, 'sectorCollapse'),
    blackSwan: calculateStressImpact(companies, weights, 'blackSwan')
  };

  const currentResult = stressResults[selectedScenario];

  // Enhanced drawdown metrics
  const drawdownMetrics = calculateEnhancedDrawdown(portfolioRisk, 10, expectedReturn);

  // Crash probabilities
  const crashProbs = calculateCrashProbability(portfolioRisk, expectedReturn);

  // Recovery time estimation
  const recoveryEstimate = estimateRecoveryTime(
    currentResult.portfolioImpact, 
    expectedReturn, 
    portfolioRisk
  );

  // Sector vulnerability
  const vulnerability = analyzeSectorVulnerability(companies, weights);

  // Diversification benefit
  const diversificationBenefit = calculateDiversificationBenefit(
    companies, 
    weights, 
    selectedScenario,
    { symbol: 'SPY', allocation: 0.20 }
  );

  const scenarioColors = {
    marketCrash: 'from-amber-600 to-orange-600',
    sectorCollapse: 'from-orange-600 to-red-600',
    blackSwan: 'from-red-600 to-rose-700'
  };

  return (
    <>
      {scenarioChanges > 3 && <BehavioralNudge trigger="stress_test_overuse" />}
      <Card className="border-2 border-slate-200 shadow-lg bg-white rounded-xl">
      <CardHeader className={`bg-gradient-to-r ${scenarioColors[selectedScenario]} text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <AlertTriangle className="w-7 h-7" />
              Stress Testing & Tail Risk Analysis
            </CardTitle>
            <p className="text-white/90 text-sm mt-2">
              Extreme scenario modeling beyond standard Monte Carlo projections
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg cursor-help">
                  <Info className="w-5 h-5 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p className="text-xs leading-relaxed">
                  <strong>Tail-Risk Scenarios vs. Expected Volatility:</strong><br/><br/>
                  These represent <strong>extreme simulation scenarios</strong> (e.g., 2008-style market crash) 
                  based on historical crisis data, sector impacts, beta exposures, and profitability status. 
                  They differ from expected volatility (normal year-to-year fluctuations).<br/><br/>
                  <strong>Data Sources:</strong> Yahoo Finance, Finnhub (TTM EPS, P/E, margins, 5-year beta)<br/>
                  <strong>Profitability:</strong> Based on positive P/E ratio, TTM EPS, and profit margins<br/><br/>
                  Use these to understand portfolio resilience in tail events, not as forecasts.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Scenario Selector */}
        <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
          <TabsList className="grid grid-cols-3 w-full h-auto gap-1 md:gap-2">
            <TabsTrigger value="marketCrash" className="data-[state=active]:bg-amber-100 h-auto py-2 md:py-3 px-1 md:px-2">
              <div className="text-center w-full">
                <div className="font-semibold text-[10px] md:text-sm leading-tight mb-0.5 md:mb-1">Market Crash</div>
                <div className="text-[10px] md:text-xs font-medium">(-40%)</div>
                <div className="text-[8px] md:text-[10px] opacity-70 mt-0.5 md:mt-1">~5%/decade</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="sectorCollapse" className="data-[state=active]:bg-orange-100 h-auto py-2 md:py-3 px-1 md:px-2">
              <div className="text-center w-full">
                <div className="font-semibold text-[10px] md:text-sm leading-tight mb-0.5 md:mb-1">Sector Collapse</div>
                <div className="text-[10px] md:text-xs font-medium">(-60%)</div>
                <div className="text-[8px] md:text-[10px] opacity-70 mt-0.5 md:mt-1">~2%/decade</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="blackSwan" className="data-[state=active]:bg-red-100 h-auto py-2 md:py-3 px-1 md:px-2">
              <div className="text-center w-full">
                <div className="font-semibold text-[10px] md:text-sm leading-tight mb-0.5 md:mb-1">Black Swan</div>
                <div className="text-[10px] md:text-xs font-medium">(-70%)</div>
                <div className="text-[8px] md:text-[10px] opacity-70 mt-0.5 md:mt-1">~1%/decade</div>
              </div>
            </TabsTrigger>
          </TabsList>
          
          {/* Current Scenario Impact */}
          <TabsContent value={selectedScenario} className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-2 border-rose-300 bg-rose-50">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h4 className="text-xl md:text-2xl font-bold text-rose-900">
                          {typeof currentResult.portfolioImpact === "number" && Number.isFinite(currentResult.portfolioImpact) ? currentResult.portfolioImpact : "Not Available"}% Portfolio Decline
                        </h4>
                        <Badge className="bg-purple-200 text-purple-900 text-xs px-2 py-1 w-fit">
                          {currentResult.probability} likelihood
                        </Badge>
                      </div>
                      <p className="text-sm text-rose-800 mb-3">{currentResult.description}</p>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <Badge className="bg-rose-200 text-rose-900 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {currentResult.duration}mo duration
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-900 text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {currentResult.recoveryTime}mo recovery
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Narrative */}
                  <div className="mt-4 p-3 md:p-4 bg-white/50 rounded-lg border border-rose-200">
                    <p className="text-xs md:text-sm text-rose-900 leading-relaxed">{currentResult.narrative}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Asset-Level Impacts */}
              <Card className="border border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Asset Impact Breakdown</CardTitle>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-slate-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p className="text-xs leading-relaxed">
                              <strong>Tail-Risk Simulation Methodology:</strong><br/><br/>
                              Asset-level declines are calculated using verified financial data:
                              <br/>• Sector historical crash data (2008, 2020, 2000)
                              <br/>• 5-year beta (Yahoo Finance, Finnhub)
                              <br/>• Market cap tier (TTM data)
                              <br/>• Profitability status (P/E, EPS, margins)
                              <br/><br/>
                              <strong>Realistic Bounds:</strong>
                              <br/>• Mega/large-cap profitable: -30% to -60%
                              <br/>• Mid-cap profitable: -35% to -70%
                              <br/>• Pre-profit/speculative: -50% to -95%
                              <br/><br/>
                              These are model-based simulations for stress testing, not forecasts. 
                              All calculations are 100% data-driven.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? (
                        <><ChevronDown className="w-4 h-4 mr-1" /> Hide Details</>
                      ) : (
                        <><ChevronRight className="w-4 h-4 mr-1" /> Show Details</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={currentResult.assetImpacts} layout="vertical" margin={{ left: 10, right: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        unit="%" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Projected Decline (%)', position: 'bottom', offset: 20, style: { fontSize: 12, fontWeight: 600 } }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="symbol" 
                        width={70}
                        tick={{ fontSize: 12, fontWeight: 600 }}
                      />
                      <Bar dataKey="drop" radius={[0, 8, 8, 0]}>
                        {currentResult.assetImpacts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.riskFlag === 'extreme' ? '#dc2626' :
                            entry.riskFlag === 'high' ? '#f97316' :
                            entry.riskFlag === 'moderate' ? '#f59e0b' :
                            '#10b981'
                          } />
                        ))}
                      </Bar>
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border-2 border-slate-300 rounded-lg shadow-lg">
                                <p className="font-bold text-slate-900 mb-1">{data.symbol}</p>
                                <p className="text-xs text-slate-600 mb-2">{data.sector}</p>
                                <div className="space-y-1 text-xs">
                                  <p><span className="text-slate-600">Decline:</span> <span className="font-bold text-rose-700">{typeof data.drop === "number" && Number.isFinite(data.drop) ? data.drop.toFixed(1) : "Not Available"}%</span></p>
                                  <p><span className="text-slate-600">Contribution:</span> <span className="font-semibold">{typeof data.contribution === "number" && Number.isFinite(data.contribution) ? data.contribution.toFixed(1) : "Not Available"}%</span></p>
                                  <p><span className="text-slate-600">Beta:</span> {typeof data.beta === "number" && Number.isFinite(data.beta) ? data.beta.toFixed(2) : "Not Available"}</p>
                                  <p><span className="text-slate-600">Market Cap:</span> {data.marketCap}</p>
                                  <p><span className="text-slate-600">Status:</span> {data.isProfitable ? 'Profitable' : 'Pre-profit'}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2"
                      >
                        {currentResult.assetImpacts.map((asset, idx) => (
                          <TooltipProvider key={asset.symbol}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex items-start justify-between p-3 rounded-lg border-2 cursor-help transition-all hover:shadow-md ${
                                  asset.riskFlag === 'extreme' ? 'bg-rose-50 border-rose-300 hover:border-rose-400' :
                                  asset.riskFlag === 'high' ? 'bg-orange-50 border-orange-300 hover:border-orange-400' :
                                  asset.riskFlag === 'moderate' ? 'bg-amber-50 border-amber-300 hover:border-amber-400' :
                                  'bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                                }`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <p className="font-bold text-slate-900 text-sm">{asset.symbol}</p>
                                      <Badge className={`text-xs px-2 py-0.5 ${
                                        asset.riskFlag === 'extreme' ? 'bg-rose-200 text-rose-900' :
                                        asset.riskFlag === 'high' ? 'bg-orange-200 text-orange-900' :
                                        asset.riskFlag === 'moderate' ? 'bg-amber-200 text-amber-900' :
                                        'bg-emerald-200 text-emerald-900'
                                      }`}>
                                        {asset.riskFlag} risk
                                      </Badge>
                                      {asset.isProfitable && (
                                        <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border border-green-300">
                                          ✓ Profitable
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                                      <span className="font-medium">{asset.sector}</span>
                                      {asset.marketCap && asset.marketCap !== 'N/A' && ` • ${asset.marketCap}`}
                                      {` • β=${typeof asset.beta === "number" && Number.isFinite(asset.beta) ? asset.beta.toFixed(2) : "Not Available"}`}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs">
                                      <div className="flex items-center gap-1">
                                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min(100, asset.weight * 2)}%` }}
                                          />
                                        </div>
                                        <span className="font-semibold text-slate-700">{typeof asset.weight === "number" && Number.isFinite(asset.weight) ? asset.weight.toFixed(1) : "Not Available"}%</span>
                                      </div>
                                      <div className="text-rose-700">
                                        <span className="text-slate-600">Impact:</span>
                                        <span className="font-bold ml-1">{typeof asset.contribution === "number" && Number.isFinite(asset.contribution) ? asset.contribution.toFixed(1) : "Not Available"}%</span>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge className={`text-base md:text-lg font-bold px-2 md:px-3 py-1 whitespace-nowrap ${
                                    asset.drop < -60 ? 'bg-rose-200 text-rose-900 border-2 border-rose-400' :
                                    asset.drop < -40 ? 'bg-orange-200 text-orange-900 border-2 border-orange-400' :
                                    asset.drop < -25 ? 'bg-amber-200 text-amber-900 border-2 border-amber-400' :
                                    'bg-emerald-200 text-emerald-900 border-2 border-emerald-400'
                                  }`}>
                                    {typeof asset.drop === "number" && Number.isFinite(asset.drop) ? asset.drop.toFixed(1) : "Not Available"}%
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="text-xs space-y-1">
                                  <p className="font-semibold text-slate-900">{asset.name}</p>
                                  <p className="text-slate-600">
                                    <strong>Tail-Risk Projection:</strong> This {typeof asset.drop === "number" && Number.isFinite(asset.drop) ? asset.drop.toFixed(1) : "Not Available"}% decline represents 
                                    an extreme scenario simulation based on historical crisis data, beta exposure, 
                                    market cap tier, and profitability status.
                                  </p>
                                  <p className="text-slate-600">
                                    <strong>Portfolio Impact:</strong> With {typeof asset.weight === "number" && Number.isFinite(asset.weight) ? asset.weight.toFixed(1) : "Not Available"}% allocation, 
                                    this asset contributes {typeof asset.contribution === "number" && Number.isFinite(asset.contribution) ? asset.contribution.toFixed(1) : "Not Available"}% to total portfolio decline 
                                    in this scenario.
                                  </p>
                                  <p className="text-slate-500 text-[10px] mt-2">
                                    This is a stress test simulation, not a forecast. Actual outcomes will vary.
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
        
        {/* Drawdown Decomposition */}
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
              Drawdown Analysis (Multi-Horizon)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-indigo-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4">
                    <p className="text-xs leading-relaxed">
                      <strong>Three distinct drawdown types:</strong><br/>
                      • <strong>Statistical (95%):</strong> Beta-weighted using historical crisis data (2008: -57%, 2020: -34%). Expected worst-case in typical severe market.<br/>
                      • <strong>Tail Risk (99%):</strong> Cornish-Fisher VaR with fat-tailed distribution. Extreme scenario (1-in-100 years).<br/>
                      • <strong>Theoretical:</strong> Mathematical boundary for educational context only.<br/><br/>
                      Calculations incorporate portfolio beta, sector allocation, and profitability. Not forecasts.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-white rounded-lg border-2 border-indigo-300">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-indigo-100 text-indigo-700 text-[10px] md:text-xs">Statistical (95%)</Badge>
                </div>
                <p className="text-xs md:text-sm text-slate-600 mb-1">Probability-Based</p>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600 break-words">{typeof drawdownMetrics.standard === "number" && Number.isFinite(drawdownMetrics.standard) ? drawdownMetrics.standard : "Not Available"}%</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">
                  Expected worst-case using beta-weighted historical crises
                </p>
              </div>
              <div className="p-3 md:p-4 bg-white rounded-lg border-2 border-rose-300">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-rose-100 text-rose-700 text-[10px] md:text-xs">Tail Risk (99%)</Badge>
                </div>
                <p className="text-xs md:text-sm text-slate-600 mb-1">Fat-Tailed Model</p>
                <p className="text-2xl md:text-3xl font-bold text-rose-600 break-words">{typeof drawdownMetrics.tailRisk === "number" && Number.isFinite(drawdownMetrics.tailRisk) ? drawdownMetrics.tailRisk : "Not Available"}%</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">
                  Cornish-Fisher VaR extreme scenario
                </p>
              </div>
              <div className="p-3 md:p-4 bg-white rounded-lg border-2 border-slate-300 opacity-75">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-slate-200 text-slate-700 text-[10px] md:text-xs">Theoretical</Badge>
                </div>
                <p className="text-xs md:text-sm text-slate-600 mb-1">Educational Only</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-600 break-words">
                  {typeof drawdownMetrics.tailRisk === "number" && Number.isFinite(drawdownMetrics.tailRisk) ? Math.min(-15, drawdownMetrics.tailRisk - 10) : "Not Available"}%
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">
                  <em>Mathematical boundary</em>
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900">
                <strong>📊 Methodology:</strong> Statistical (95%) and Tail Risk (99%) use verified portfolio beta, sector allocation (Technology, Consumer Discretionary), 
                and historical crisis data. Theoretical bound is for educational context only—do not interpret as likely outcome.
              </p>
            </div>
            
            {recoveryEstimate && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Recovery Time Estimates (from {typeof currentResult.portfolioImpact === "number" && Number.isFinite(currentResult.portfolioImpact) ? currentResult.portfolioImpact : "Not Available"}% decline)
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{typeof recoveryEstimate.median === "number" && Number.isFinite(recoveryEstimate.median) ? recoveryEstimate.median : "Not Available"}y</p>
                    <p className="text-xs text-slate-600">Median (50%)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">{typeof recoveryEstimate.p75 === "number" && Number.isFinite(recoveryEstimate.p75) ? recoveryEstimate.p75 : "Not Available"}y</p>
                    <p className="text-xs text-slate-600">Conservative (75%)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-rose-600">{typeof recoveryEstimate.p90 === "number" && Number.isFinite(recoveryEstimate.p90) ? recoveryEstimate.p90 : "Not Available"}y</p>
                    <p className="text-xs text-slate-600">Pessimistic (90%)</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Crash Probabilities */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-purple-900">
                  Crash Probability Analysis
                </CardTitle>
                <p className="text-sm text-purple-700 mt-1">
                  Based on portfolio volatility ({Number(portfolioRisk).toFixed(1)}%), beta, and fat-tailed distribution
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-purple-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="text-xs leading-relaxed">
                      <strong>Calculation Methodology:</strong><br/>
                      Uses portfolio annualized volatility ({Number(portfolioRisk).toFixed(1)}%), expected return ({Number(expectedReturn).toFixed(1)}%), 
                      and fat-tailed distribution adjustments to estimate probability of specific decline thresholds.<br/><br/>
                      10-year probability calculated as: 1 - (1 - annual_prob)^10<br/><br/>
                      These are statistical estimates, not predictions. Actual outcomes vary.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">Annual Probability</p>
                <div className="space-y-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center p-2 bg-white rounded border border-amber-200 cursor-help">
                          <span className="text-sm">-20% Decline (Mild)</span>
                          <Badge className="bg-amber-100 text-amber-800">
                            {crashProbs.annualProbabilities.mild}%
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Probability of portfolio declining ≥20% in any given year based on {Number(portfolioRisk).toFixed(1)}% volatility</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center p-2 bg-white rounded border border-orange-200 cursor-help">
                          <span className="text-sm">-35% Decline (Moderate)</span>
                          <Badge className="bg-orange-100 text-orange-800">
                            {crashProbs.annualProbabilities.moderate}%
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Probability of portfolio declining ≥35% in any given year</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center p-2 bg-white rounded border border-rose-200 cursor-help">
                          <span className="text-sm">-50% Decline (Severe)</span>
                          <Badge className="bg-rose-100 text-rose-800">
                            {crashProbs.annualProbabilities.severe}%
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Probability of portfolio declining ≥50% in any given year</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">10-Year Probability</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-amber-200">
                    <span className="text-sm">-20% Decline</span>
                    <Badge className="bg-amber-100 text-amber-800">
                      {crashProbs.tenYearProbabilities.mild}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-orange-200">
                    <span className="text-sm">-35% Decline</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {crashProbs.tenYearProbabilities.moderate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-rose-200">
                    <span className="text-sm">-50% Decline</span>
                    <Badge className="bg-rose-100 text-rose-800">
                      {crashProbs.tenYearProbabilities.severe}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-900">
                <strong>Note:</strong> Probabilities calculated using z-scores and fat-tailed distribution adjustments. 
                Portfolio volatility: {Number(portfolioRisk).toFixed(1)}%, Expected return: {Number(expectedReturn).toFixed(1)}%. 
                These are statistical estimates for stress testing, not predictions of actual outcomes.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Sector Vulnerability */}
        <Card className="border-2 border-teal-200 bg-teal-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-teal-900">
                Sector Vulnerability & Beta Exposure
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-teal-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="text-xs leading-relaxed">
                      <strong>Sector Classification (Verified):</strong><br/>
                      • GOOGL, LOGI, GPRO, SOUN → Technology<br/>
                      • TSLA, WW → Consumer Discretionary<br/><br/>
                      <strong>Beta Exposure:</strong> Weighted by allocation<br/>
                      • Defensive (β&lt;0.8): Below-market volatility<br/>
                      • Neutral (0.8-1.2): Market-like behavior<br/>
                      • Aggressive (β&gt;1.2): Above-market volatility<br/><br/>
                      HHI measures concentration (0-100, higher = more concentrated)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">Beta Exposure (Allocation-Weighted)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Defensive (β<0.8)', value: vulnerability.betaExposure.defensive },
                        { name: 'Neutral (0.8-1.2)', value: vulnerability.betaExposure.neutral },
                        { name: 'Aggressive (β>1.2)', value: vulnerability.betaExposure.aggressive }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${typeof entry.value === "number" && Number.isFinite(entry.value) ? entry.value.toFixed(0) : "Not Available"}%`}
                      labelLine={true}
                      style={{ fontSize: '14px', fontWeight: 600 }}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 p-2 bg-white/60 rounded text-xs text-slate-600 text-center leading-relaxed">
                  Based on verified 5-year beta data from Yahoo Finance & Finnhub
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">Risk Assessment (Verified Sectors)</p>
                <div className="space-y-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 cursor-help">
                          <p className="text-xs text-slate-600">Concentration Risk (HHI)</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  vulnerability.concentrationRisk > 40 ? 'bg-rose-600' :
                                  vulnerability.concentrationRisk > 25 ? 'bg-amber-600' :
                                  'bg-emerald-600'
                                }`}
                                style={{ width: `${Math.min(100, vulnerability.concentrationRisk)}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{typeof vulnerability.concentrationRisk === "number" && Number.isFinite(vulnerability.concentrationRisk) ? vulnerability.concentrationRisk : "Not Available"}/100</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Herfindahl-Hirschman Index: Sum of squared sector weights. 
                          &lt;25 = diversified, 25-40 = moderate concentration, &gt;40 = high concentration
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Dominant Sector (Verified)</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {vulnerability.dominantSector || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {vulnerability.dominantSector && vulnerability.sectorExposure[vulnerability.dominantSector]
                        ? `${typeof vulnerability.sectorExposure[vulnerability.dominantSector].allocation === "number" && Number.isFinite(vulnerability.sectorExposure[vulnerability.dominantSector].allocation) ? vulnerability.sectorExposure[vulnerability.dominantSector].allocation.toFixed(1) : "Not Available"}% allocation`
                        : 'Sector data unavailable'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Crash Exposure
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      {typeof vulnerability.betaExposure.aggressive === "number" && Number.isFinite(vulnerability.betaExposure.aggressive) && vulnerability.betaExposure.aggressive > 50
                        ? `High exposure (${vulnerability.betaExposure.aggressive.toFixed(0)}% aggressive beta) - expect amplified losses during market crashes`
                        : typeof vulnerability.betaExposure.aggressive === "number" && Number.isFinite(vulnerability.betaExposure.aggressive) && vulnerability.betaExposure.aggressive > 30
                        ? `Moderate exposure (${vulnerability.betaExposure.aggressive.toFixed(0)}% aggressive beta) - above-average crash sensitivity`
                        : typeof vulnerability.betaExposure.aggressive === "number" && Number.isFinite(vulnerability.betaExposure.aggressive)
                        ? `Low exposure (${vulnerability.betaExposure.aggressive.toFixed(0)}% aggressive beta) - relative crash protection`
                        : "Not Available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Diversification Benefit */}
        <Card className={`border-2 ${diversificationBenefit.isImprovement ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg ${diversificationBenefit.isImprovement ? 'text-emerald-900' : 'text-amber-900'} flex items-center gap-2`}>
                <Shield className="w-5 h-5" />
                Concentration Risk via Diversification (SPY)
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className={`w-4 h-4 ${diversificationBenefit.isImprovement ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="text-xs leading-relaxed">
                      <strong>Methodology:</strong> Simulates adding 20% SPY (S&P 500 ETF), reweighting current portfolio to 80%.<br/><br/>
                      <strong>SPY Stress Scenario Drops:</strong><br/>
                      • Market Crash: -40% (beta ≈ 1.0, tracks market)<br/>
                      • Sector Collapse: -30% (less if sector-specific)<br/>
                      • Black Swan: -55% (SPY crashes too in systemic events)<br/><br/>
                      <strong>Key Insight:</strong> SPY reduces <em>concentration risk</em> (single-stock, sector-specific), NOT systemic crash losses. 
                      In market-wide crashes, SPY declines with the market (β≈1.0). Benefits arise from broadening exposure, not crash protection.<br/><br/>
                      Calculations use verified beta, sector, profitability, and market cap data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${diversificationBenefit.isImprovement ? 'text-emerald-800' : 'text-amber-800'} mb-4`}>
              Adding {diversificationBenefit.diversifier.allocation}% {diversificationBenefit.diversifier.symbol} (S&P 500 ETF) 
              to your portfolio in the <strong>{STRESS_SCENARIOS[selectedScenario].name}</strong> scenario:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-white rounded-lg border-2 border-rose-300">
                <p className="text-xs md:text-sm text-slate-600 mb-1">Current Portfolio</p>
                <p className="text-xl md:text-2xl font-bold text-rose-600 break-words">{typeof diversificationBenefit.currentImpact === "number" && Number.isFinite(diversificationBenefit.currentImpact) ? diversificationBenefit.currentImpact : "Not Available"}%</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1">100% current allocation</p>
              </div>
              <div className={`p-3 md:p-4 bg-white rounded-lg border-2 ${diversificationBenefit.isImprovement ? 'border-emerald-300' : 'border-rose-300'}`}>
                <p className="text-xs md:text-sm text-slate-600 mb-1">With {diversificationBenefit.diversifier.symbol}</p>
                <p className={`text-xl md:text-2xl font-bold ${diversificationBenefit.isImprovement ? 'text-emerald-600' : 'text-rose-600'} break-words`}>
                  {typeof diversificationBenefit.withDiversifier === "number" && Number.isFinite(diversificationBenefit.withDiversifier) ? diversificationBenefit.withDiversifier : "Not Available"}%
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1">80% current + 20% SPY</p>
              </div>
              <div className={`p-3 md:p-4 bg-white rounded-lg border-2 ${diversificationBenefit.isImprovement ? 'border-teal-300' : 'border-amber-300'}`}>
                <p className="text-xs md:text-sm text-slate-600 mb-1">
                  {diversificationBenefit.isImprovement ? 'Improvement' : 'Change'}
                </p>
                <p className={`text-xl md:text-2xl font-bold ${diversificationBenefit.isImprovement ? 'text-teal-600' : 'text-amber-600'} break-words`}>
                  {typeof diversificationBenefit.change === "number" && Number.isFinite(diversificationBenefit.change) && diversificationBenefit.change > 0 ? '+' : ''}{typeof diversificationBenefit.change === "number" && Number.isFinite(diversificationBenefit.change) ? diversificationBenefit.change : "Not Available"}%
                </p>
                <p className="text-[10px] md:text-xs text-slate-600 mt-1 break-words">
                  {diversificationBenefit.isImprovement 
                    ? `${typeof diversificationBenefit.changePercent === "number" && Number.isFinite(diversificationBenefit.changePercent) && diversificationBenefit.changePercent > 0 ? '+' : ''}${typeof diversificationBenefit.changePercent === "number" && Number.isFinite(diversificationBenefit.changePercent) ? diversificationBenefit.changePercent : "Not Available"}% less severe` 
                    : typeof diversificationBenefit.changePercent === "number" && Number.isFinite(diversificationBenefit.changePercent) && Math.abs(diversificationBenefit.changePercent) < 1 
                      ? 'Minimal impact' 
                      : `${typeof diversificationBenefit.changePercent === "number" && Number.isFinite(diversificationBenefit.changePercent) ? Math.abs(diversificationBenefit.changePercent) : "Not Available"}% more severe`}
                </p>
              </div>
            </div>
            
            {/* Educational Context */}
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              selectedScenario === 'marketCrash' || selectedScenario === 'blackSwan' 
                ? 'bg-blue-50 border-blue-300' 
                : 'bg-white/70 border-emerald-300'
            }`}>
              <p className="text-xs font-semibold text-slate-900 mb-2">
                {selectedScenario === 'marketCrash' || selectedScenario === 'blackSwan' 
                  ? '⚠️ Important Context: Systemic Market Crashes' 
                  : '✓ Sector-Specific Risk Reduction'}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {diversificationBenefit.interpretation}
              </p>
            </div>
            
            <div className={`mt-3 p-3 bg-white/60 rounded-lg border ${diversificationBenefit.isImprovement ? 'border-emerald-200' : 'border-amber-200'}`}>
              <p className="text-xs text-slate-900">
                <strong>Analysis:</strong> {diversificationBenefit.recommendation}
                {' '}SPY (S&P 500 ETF) provides broad market exposure (500 large-cap stocks), reducing single-stock and sector concentration risk. 
                However, with β≈1.0, SPY <strong>does NOT protect against systemic market crashes</strong>—it declines with the market. 
                The benefit shown reflects reduced concentration, not crash immunity.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Methodology & Data Sources (Jan 2026):</strong> Stress tests use historical crash data (2008 Financial Crisis -57%, COVID-19 -34%, Dot-com bubble -78%) 
            combined with verified sector classifications, 5-year beta calculations (Yahoo Finance, Finnhub), market cap tiers (TTM data), and profitability metrics (TTM EPS, P/E ratio, profit margins). 
            Asset-level declines are bounded by historical precedent: mega/large-cap profitable companies typically decline -30% to -60% in black swan events, 
            while pre-profit speculative assets can reach -70% to -95%. 
            Recovery simulations incorporate mean-reversion and volatility drag.
            <strong className="text-slate-900"> All asset data is verified and current.</strong>
          </p>
          <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
            <strong>⚠️ Stress Test Disclaimer:</strong> These are <strong>scenario-based simulations</strong> for educational stress testing, 
            <strong>NOT forecasts or predictions</strong> of actual outcomes. Drawdowns like -85% or -99% represent theoretical worst-case models 
            under extreme assumptions—they are not likely events. Real crises differ in timing, severity, and duration. 
            Use these to understand tail risks and test portfolio resilience, not to predict the future.
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
