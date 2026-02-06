import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  simulatePortfolioDrift,
  calculateRebalancingImpact,
  compareDCAvsLumpSum,
  calculatePanicSellingImpact,
  calculateOptimalThreshold
} from "@/components/utils/calculations/rebalancing";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';

export default function RebalancingSimulator({ companies, initialWeights, expectedReturn, volatility }) {
  const [activeTab, setActiveTab] = useState('drift');
  const [showDetails, setShowDetails] = useState(false);
  const [rebalancingResults, setRebalancingResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  useEffect(() => {
    if (companies && initialWeights) {
      calculateRebalancing();
    }
  }, [companies, initialWeights]);
  
  const calculateRebalancing = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const results = calculateRebalancingImpact(companies, initialWeights, 10);
      setRebalancingResults(results);
      setIsCalculating(false);
    }, 100);
  };
  
  if (!companies || !initialWeights) return null;
  
  const driftData = simulatePortfolioDrift(companies, initialWeights, 36);
  const dcaComparison = compareDCAvsLumpSum(10000, 500, expectedReturn, volatility, 10);
  const panicImpact = calculatePanicSellingImpact(expectedReturn, volatility, 10);
  const optimalThreshold = calculateOptimalThreshold(companies, initialWeights, 5);
  
  const driftChartData = driftData.map(snapshot => {
    const dataPoint = { month: snapshot.month };
    companies.forEach((company, i) => {
      dataPoint[company.symbol] = snapshot.weights[i];
    });
    return dataPoint;
  });
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  
  return (
    <Card className="border-2 border-slate-200 shadow-xl bg-white">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <RefreshCw className="w-7 h-7" />
          Rebalancing & Behavioral Analysis
        </CardTitle>
        <p className="text-white/90 text-sm mt-2">
          Understand allocation drift, rebalancing benefits, and behavioral risks
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
            <TabsTrigger value="rebalancing">Rebalancing</TabsTrigger>
            <TabsTrigger value="dca">DCA vs Lump Sum</TabsTrigger>
            <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drift" className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                📊 How Portfolio Allocations Drift Over Time
              </h4>
              <p className="text-sm text-blue-800">
                Different assets grow at different rates. Without rebalancing, your portfolio composition 
                changes from your target allocation, potentially increasing risk or reducing returns.
              </p>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={driftChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Allocation %', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                {companies.map((company, idx) => (
                  <Area
                    key={company.symbol}
                    type="monotone"
                    dataKey={company.symbol}
                    stackId="1"
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card className="border border-slate-200">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Initial Allocation</p>
                  {companies.map((company, i) => (
                    <div key={company.symbol} className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{company.symbol}</span>
                      <span className="font-semibold">{(initialWeights[i] * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card className="border border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2">After 3 Years (No Rebalance)</p>
                  {companies.map((company, i) => {
                    const drifted = driftData[driftData.length - 1].weights[i];
                    const drift = driftData[driftData.length - 1].drift[i];
                    return (
                      <div key={company.symbol} className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{company.symbol}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{drifted.toFixed(1)}%</span>
                          <Badge className={`text-xs ${
                            drift > 5 ? 'bg-rose-100 text-rose-700' :
                            drift < -5 ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {drift >= 0 ? '+' : ''}{drift.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="rebalancing" className="mt-6">
            {isCalculating ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Running 5,000 simulations...</p>
              </div>
            ) : rebalancingResults && (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2">
                    ⚖️ Rebalancing Strategy Comparison (10-Year Horizon)
                  </h4>
                  <p className="text-sm text-indigo-800">
                    Compares buy-and-hold vs periodic rebalancing. Transaction costs: 5 basis points (0.05%) per trade.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">Buy & Hold</h4>
                          <p className="text-xs text-slate-600">No rebalancing</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-600">Median Return (10y)</p>
                          <p className="text-2xl font-bold text-amber-700">
                            {rebalancingResults.noRebalance.returns.median.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Sharpe Ratio</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {rebalancingResults.noRebalance.sharpe.median.toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Transaction Costs</p>
                          <p className="text-sm font-semibold text-emerald-600">$0</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">Monthly</h4>
                          <p className="text-xs text-slate-600">12 rebalances/year</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-600">Median Return (10y)</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {rebalancingResults.monthly.returns.median.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Sharpe Ratio</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {rebalancingResults.monthly.sharpe.median.toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Transaction Costs</p>
                          <p className="text-sm font-semibold text-rose-600">
                            ${rebalancingResults.monthly.costs.median.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-emerald-200 bg-emerald-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">Yearly</h4>
                          <p className="text-xs text-slate-600">1 rebalance/year</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-600">Median Return (10y)</p>
                          <p className="text-2xl font-bold text-emerald-700">
                            {rebalancingResults.yearly.returns.median.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Sharpe Ratio</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {rebalancingResults.yearly.sharpe.median.toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Transaction Costs</p>
                          <p className="text-sm font-semibold text-amber-600">
                            ${rebalancingResults.yearly.costs.median.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="border-2 border-teal-200 bg-teal-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-teal-900 mb-2">Recommended Strategy</h4>
                        <p className="text-sm text-teal-800">
                          {(() => {
                            const yearly = rebalancingResults.yearly.returns.median - (rebalancingResults.yearly.costs.median / 100);
                            const monthly = rebalancingResults.monthly.returns.median - (rebalancingResults.monthly.costs.median / 100);
                            const none = rebalancingResults.noRebalance.returns.median;
                            
                            const best = Math.max(yearly, monthly, none);
                            
                            if (best === yearly) {
                              return `📅 Yearly rebalancing offers the best balance (${yearly.toFixed(1)}% net return). Lower costs than monthly ($${rebalancingResults.yearly.costs.median.toLocaleString()} vs $${rebalancingResults.monthly.costs.median.toLocaleString()}) while maintaining disciplined allocation.`;
                            } else if (best === monthly) {
                              return `📆 Monthly rebalancing provides best risk management (${monthly.toFixed(1)}% net return) despite higher costs ($${rebalancingResults.monthly.costs.median.toLocaleString()}). Ideal for volatile portfolios.`;
                            } else {
                              return `💼 Buy-and-hold outperforms (${none.toFixed(1)}% return) due to transaction costs. However, this results in significant drift - monitor allocations quarterly.`;
                            }
                          })()}
                        </p>
                        
                        <div className="mt-3 p-3 bg-white/50 rounded-lg border border-teal-200">
                          <p className="text-xs font-semibold text-teal-900 mb-1">Optimal Rebalancing Threshold</p>
                          <p className="text-sm text-teal-800">
                            Rebalance when any asset drifts <strong>{optimalThreshold.optimalThreshold}%</strong> from target. 
                            This balances drift costs vs transaction fees.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { 
                      strategy: 'No Rebalance',
                      return: rebalancingResults.noRebalance.returns.median,
                      sharpe: rebalancingResults.noRebalance.sharpe.median * 10,
                      costs: 0
                    },
                    { 
                      strategy: 'Monthly',
                      return: rebalancingResults.monthly.returns.median,
                      sharpe: rebalancingResults.monthly.sharpe.median * 10,
                      costs: rebalancingResults.monthly.costs.median / 100
                    },
                    { 
                      strategy: 'Yearly',
                      return: rebalancingResults.yearly.returns.median,
                      sharpe: rebalancingResults.yearly.sharpe.median * 10,
                      costs: rebalancingResults.yearly.costs.median / 100
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="return" fill="#3b82f6" name="Return %" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="costs" fill="#ef4444" name="Costs (÷100)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="dca" className="mt-6 space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">
                💰 Dollar-Cost Averaging vs Lump Sum Investment
              </h4>
              <p className="text-sm text-purple-800">
                Should you invest all at once or spread contributions over time? 
                Simulation assumes {expectedReturn.toFixed(1)}% return, {volatility.toFixed(1)}% volatility.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-10 h-10 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-lg">Dollar-Cost Averaging</h4>
                      <p className="text-xs text-slate-600">$500/month for 10 years</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Median Outcome</p>
                      <p className="text-3xl font-bold text-blue-700">
                        ${dcaComparison.dca.median.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600">Range (25th-75th %ile)</p>
                      <p className="font-semibold">
                        ${dcaComparison.dca.p25.toLocaleString()} - ${dcaComparison.dca.p75.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {dcaComparison.dca.winRate}% win rate vs lump sum
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-10 h-10 text-purple-600" />
                    <div>
                      <h4 className="font-bold text-lg">Lump Sum</h4>
                      <p className="text-xs text-slate-600">Invest all upfront</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Median Outcome</p>
                      <p className="text-3xl font-bold text-purple-700">
                        ${dcaComparison.lumpSum.median.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600">Range (25th-75th %ile)</p>
                      <p className="font-semibold">
                        ${dcaComparison.lumpSum.p25.toLocaleString()} - ${dcaComparison.lumpSum.p75.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {100 - dcaComparison.dca.winRate}% win rate vs DCA
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border border-slate-200">
              <CardContent className="p-4">
                <p className="text-sm text-slate-700">
                  <strong>📚 Research Insight:</strong> {dcaComparison.recommendation}. 
                  {dcaComparison.lumpSum.median > dcaComparison.dca.median 
                    ? ' Lump sum typically outperforms in rising markets, but DCA reduces timing risk and emotional stress.'
                    : ' DCA provides smoother entry and reduces regret from market timing, despite potentially lower returns.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="behavioral" className="mt-6 space-y-4">
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <h4 className="font-semibold text-rose-900 mb-2">
                🧠 Behavioral Finance: Emotional Decision Costs
              </h4>
              <p className="text-sm text-rose-800">
                How emotional reactions during market downturns impact long-term wealth.
              </p>
            </div>
            
            <Card className="border-2 border-rose-200 bg-rose-50">
              <CardHeader>
                <CardTitle className="text-lg text-rose-900">
                  Panic Selling Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white rounded-lg border-2 border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-8 h-8 text-emerald-600" />
                      <h5 className="font-bold text-lg">Stay Invested</h5>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Ride out volatility</p>
                    <p className="text-4xl font-bold text-emerald-600">
                      ${panicImpact.stayInvested.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Median 10-year outcome</p>
                  </div>
                  
                  <div className="p-6 bg-white rounded-lg border-2 border-rose-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-8 h-8 text-rose-600" />
                      <h5 className="font-bold text-lg">Panic Sell</h5>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Sell at -20%, wait 6 months</p>
                    <p className="text-4xl font-bold text-rose-600">
                      ${panicImpact.panicSell.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Median 10-year outcome</p>
                  </div>
                </div>
                
                <div className="mt-6 p-6 bg-gradient-to-r from-rose-100 to-orange-100 rounded-xl border-2 border-rose-300">
                  <div className="text-center">
                    <p className="text-sm text-rose-900 mb-2">Opportunity Cost of Panic Selling</p>
                    <p className="text-5xl font-bold text-rose-700 mb-2">
                      ${panicImpact.opportunityCost.toLocaleString()}
                    </p>
                    <p className="text-lg font-semibold text-rose-800">
                      ({panicImpact.opportunityCostPercent}% lower final value)
                    </p>
                    <p className="text-xs text-slate-700 mt-3">
                      Based on 1,000 simulations over 10 years. Assumes selling at -20% drawdown and staying in cash for 6 months.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700">
                    <strong>💡 Key Insight:</strong> Selling during market downturns locks in losses and misses the recovery. 
                    Historically, the best days often follow the worst days. Missing just 10 best days over 30 years 
                    can cut returns in half (Schwab Research, 2022).
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Behavioral Risk Factors</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? (
                      <><ChevronDown className="w-4 h-4 mr-1" /> Hide</>
                    ) : (
                      <><ChevronRight className="w-4 h-4 mr-1" /> Learn More</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h5 className="font-semibold text-amber-900 mb-2">🎯 Loss Aversion</h5>
                        <p className="text-sm text-amber-800">
                          Losses feel 2x worse than equivalent gains (Kahneman & Tversky, 1979). 
                          Leads to selling winners too early and holding losers too long.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-2">📊 Recency Bias</h5>
                        <p className="text-sm text-blue-800">
                          Overweighting recent performance. Last month's winners become over-allocated; 
                          yesterday's losers get abandoned despite fundamental value.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                        <h5 className="font-semibold text-rose-900 mb-2">⏰ Market Timing</h5>
                        <p className="text-sm text-rose-800">
                          Attempting to "time the bottom" typically results in missing the recovery. 
                          DALBAR (2023): Average investor underperforms S&P 500 by 4% annually due to bad timing.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <h5 className="font-semibold text-emerald-900 mb-2">✅ Solution: Systematic Rebalancing</h5>
                        <p className="text-sm text-emerald-800">
                          Remove emotion from the equation. Rebalancing forces you to "buy low, sell high" 
                          automatically by trimming winners and adding to losers when they drift from targets.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Methodology:</strong> Simulations use Monte Carlo with 1,000-5,000 iterations. 
            Rebalancing assumes 5 bps (0.05%) transaction costs. 
            Panic selling model based on behavioral finance research (Barber & Odean, 2000). 
            DCA comparison uses equal total capital deployed over different timeframes. 
            <strong className="text-slate-900"> All results are educational projections, not investment advice.</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
