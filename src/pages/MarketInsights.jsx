import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Activity,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Loader2,
  Brain,
  Target,
  Zap,
  Clock,
  Globe,
  DollarSign,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

export default function MarketInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      console.log("📂 [Cache] Checking for recent market snapshot...");
      const data = await awsApi.getMarketInsights();
      
      if (data && data.cache_age !== undefined) {
        // Updated to 30 minutes to ensure macro-data freshness (v5.4 Standard)
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (data.cache_age > thirtyMinutes) {
          console.log("⏰ Cache is stale (>30m). Triggering fresh waterfall...");
          loadMarketInsights();
        } else {
          console.log(`✅ Cache is fresh (${Math.floor(data.cache_age / 60000)}m old). Loading snapshot.`);
          setMarketData(data.market_data);
          setLastUpdated(new Date(data.last_fetched));
        }
      } else {
        console.log("ℹ️ No cache found. Initializing first-run waterfall.");
        loadMarketInsights();
      }
    } catch (error) {
      console.error("❌ Error loading cached data:", error);
      loadMarketInsights();
    }
  };

  const loadMarketInsights = async () => {
    setIsLoading(true);
    try {
      console.log("📡 [Frontend] Initiating Industrial Macro Waterfall...");

      // 1. Fetch Ground Truth VIX (Source 1)
      const vixResponse = await awsApi.getVIXData();
      const currentVix = vixResponse?.currentVIX || 20;

      // 2. Trigger Hybrid Generator (Source 2)
      // Passing the VIX value as a hint ensures the backend models are aligned
      const result = await awsApi.generateMarketInsights({
        force_refresh: true,
        prompt: `VIX Index: ${currentVix}` 
      });

      // 3. UI Calibration: Normalize Confidence (e.g., 0.88 -> 88)
      if (result.predictive_signals) {
        result.predictive_signals = result.predictive_signals.map(sig => ({
          ...sig,
          confidence: sig.confidence <= 1 ? Math.round(sig.confidence * 100) : Math.round(sig.confidence)
        }));
      }

      // 4. Update Application State
      setMarketData(result);
      setLastUpdated(new Date());

      // 5. Persist to Dashboard Cache (Source 3)
      await awsApi.cacheMarketInsights({
        action: 'save',
        data: result
      });

      console.log("✅ [Frontend] Industrial synchronization complete.");
    } catch (error) {
      console.error("❌ Waterfall Error:", error);
      // Fallback: If live fetch fails, attempt to load the most recent cached version
      loadCachedData();
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (score) => {
    if (score >= 65) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 45) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getSentimentIcon = (score) => {
    if (score >= 65) return <TrendingUp className="w-5 h-5" />;
    if (score >= 45) return <Minus className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  const getSentimentLabel = (score) => {
    if (score >= 65) return "Bullish";
    if (score >= 45) return "Neutral";
    return "Bearish";
  };

  const getImpactColor = (impact) => {
    if (impact === "positive") return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (impact === "negative") return "bg-rose-100 text-rose-700 border-rose-300";
    return "bg-slate-100 text-slate-700 border-slate-300";
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case "market": return BarChart3;
      case "company": return Globe;
      case "economy": return DollarSign;
      case "geopolitical": return AlertTriangle;
      default: return Newspaper;
    }
  };

  const getSignalColor = (type) => {
    if (type === "opportunity") return "from-emerald-600 to-teal-600";
    if (type === "warning") return "from-rose-600 to-red-600";
    return "from-blue-600 to-indigo-600";
  };

  const getSignalIcon = (type) => {
    if (type === "opportunity") return ThumbsUp;
    if (type === "warning") return AlertTriangle;
    return Target;
  };

  if (isLoading && !marketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Global Markets...</h3>
          <p className="text-slate-600">Gathering real-time data and sentiment signals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                <Brain className="w-12 h-12 text-purple-600" />
                Market Insights
              </h1>
              <p className="text-lg text-slate-600">
                Real-time news, sentiment analysis, and predictive market signals
              </p>
              {lastUpdated && (
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button
              onClick={loadMarketInsights}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

        {marketData && (
            <>
              {/* ROUNDED INDUSTRIAL GRADE CIO HYBRID SENTIMENT CARD */}
              <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mb-10 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white py-6 border-b-4 border-slate-900">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-2xl">
                        <Activity className="w-7 h-7 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1.5">Institutional Model</span>
                        <span className="text-xl font-black tracking-tight uppercase">CIO Hybrid Sentiment</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Stream</span>
                      </div>
                      <Badge className="bg-purple-600 text-white border-0 font-mono text-[10px] rounded-full px-3 py-1">v5.4 INDUSTRIAL</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* COL 1: CORE SENTIMENT ENGINE (3/12) */}
                    <div className="lg:col-span-3 p-10 flex flex-col items-center justify-center bg-slate-50 border-b lg:border-b-0 lg:border-r-4 border-slate-900">
                      <div className={`mb-6 px-5 py-2 rounded-full border-2 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 ${getSentimentColor(marketData.overall_sentiment?.score)}`}>
                        {getSentimentIcon(marketData.overall_sentiment?.score)}
                        {getSentimentLabel(marketData.overall_sentiment?.score)}
                      </div>
                      <div className="relative mb-2">
                        <span className="text-8xl font-black text-slate-900 tracking-tighter leading-none">
                          {marketData.overall_sentiment?.score}
                        </span>
                        <span className="text-xl font-black text-slate-400 absolute -top-1 -right-8">/100</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-6">Weighted Aggregate Score</p>
                    </div>

                    {/* COL 2: SIGNAL CONTRIBUTION (4/12) */}
                    <div className="lg:col-span-4 p-10 border-b lg:border-b-0 lg:border-r-4 border-slate-900 bg-white">
                      <div className="flex items-center gap-2 mb-8">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Signal Attribution</h4>
                      </div>
                      <div className="space-y-6">
                        {marketData.signal_contributions && Object.entries(marketData.signal_contributions).map(([key, val]) => (
                          <div key={key} className="group">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] uppercase font-black text-slate-500 group-hover:text-slate-900 transition-colors tracking-widest">{key}</span>
                              <span className="font-mono text-sm font-black text-slate-900">{val}<span className="text-[10px] ml-0.5 text-slate-400">PTS</span></span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(val / 30) * 100}%` }}
                                className={`h-full rounded-full ${
                                  key === 'news' ? 'bg-blue-600' : 
                                  key === 'volatility' ? 'bg-purple-600' : 
                                  key === 'bond' ? 'bg-emerald-600' : 
                                  key === 'commodity' ? 'bg-orange-600' : 'bg-slate-900'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* COL 3: MACRO DRIVERS (5/12) */}
                    <div className="lg:col-span-5 p-10 bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-8">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Macro Ground Truth</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        {/* VIX */}
                        <div className="bg-white p-5 border-2 border-slate-200 rounded-2xl shadow-sm hover:border-slate-900 transition-all hover:shadow-md cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Volatility Index</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">VIX {marketData.macro_drivers?.vix?.value}</span>
                            <Badge variant="outline" className="text-[9px] font-black px-2 h-5 border-0 rounded-full uppercase bg-slate-900 text-white">
                              {marketData.macro_drivers?.vix?.status}
                            </Badge>
                          </div>
                        </div>
                        {/* 10Y */}
                        <div className="bg-white p-5 border-2 border-slate-200 rounded-2xl shadow-sm hover:border-slate-900 transition-all hover:shadow-md cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">US 10Y Yield</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{marketData.macro_drivers?.bond_10y?.value}%</span>
                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${marketData.macro_drivers?.bond_10y?.change > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {marketData.macro_drivers?.bond_10y?.change > 0 ? '▲' : '▼'} {Math.abs(marketData.macro_drivers?.bond_10y?.change)}
                            </span>
                          </div>
                        </div>
                        {/* CRUDE */}
                        <div className="bg-white p-5 border-2 border-slate-200 rounded-2xl shadow-sm hover:border-slate-900 transition-all hover:shadow-md cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Energy / WTI</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">${marketData.macro_drivers?.oil?.wti}</span>
                            <span className={`text-[10px] font-black ${marketData.macro_drivers?.oil?.change_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {marketData.macro_drivers?.oil?.change_pct}%
                            </span>
                          </div>
                        </div>
                        {/* BREADTH */}
                        <div className="bg-white p-5 border-2 border-slate-200 rounded-2xl shadow-sm hover:border-slate-900 transition-all hover:shadow-md cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Market Breadth</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{marketData.macro_drivers?.breadth?.ratio}x</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">A/D Ratio</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-10 mb-10">
                {/* INDUSTRIAL SECTOR SENTIMENT CARD */}
                <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-slate-900 text-white py-4 border-b-4 border-slate-900">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      Sector Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="h-64 mb-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={marketData.sector_sentiment} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis 
                            dataKey="sector" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                            domain={[0, 100]}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 border-2 border-slate-800 p-3 shadow-xl rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payload[0].payload.sector}</p>
                                    <p className="text-xl font-black text-white">{payload[0].value}<span className="text-xs ml-1 text-slate-500">PTS</span></p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                            {marketData.sector_sentiment.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.score > 60 ? '#4f46e5' : entry.score > 40 ? '#818cf8' : '#312e81'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-4">
                      {marketData.sector_sentiment.map((sector, idx) => (
                        <div key={idx} className="flex gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-slate-900 transition-all group bg-slate-50/50">
                          <div className="flex flex-col items-center justify-center min-w-[50px] border-r-2 border-slate-200 pr-4">
                            <span className="text-xl font-black text-slate-900">{sector.score}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase">Score</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{sector.sector}</h4>
                              <div className={`h-2 w-2 rounded-full ${sector.score > 60 ? 'bg-emerald-500' : sector.score < 45 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed">{sector.reasoning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* INDUSTRIAL ASSET CLASS SENTIMENT CARD */}
                <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23_42,1)] rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-slate-900 text-white py-4 border-b-4 border-slate-900">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <Target className="w-5 h-5 text-emerald-400" />
                      Asset Allocation Regime
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="h-64 mb-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={marketData.asset_sentiment}>
                          <PolarGrid stroke="#e2e8f0" strokeWidth={2} />
                          <PolarAngleAxis 
                            dataKey="asset" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Sentiment"
                            dataKey="score"
                            stroke="#1e293b"
                            strokeWidth={4}
                            fill="#10b981"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {marketData.asset_sentiment.map((asset, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border-2 border-transparent hover:border-slate-900 rounded-2xl transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-sm shadow-sm ${
                              asset.outlook.toLowerCase() === 'bullish' ? 'bg-emerald-500 border-emerald-600 text-white' : 
                              asset.outlook.toLowerCase() === 'bearish' ? 'bg-rose-500 border-rose-600 text-white' : 
                              'bg-white border-slate-200 text-slate-900'
                            }`}>
                              {asset.asset[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{asset.asset}</span>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 py-0 border-current ${
                                  asset.outlook.toLowerCase() === 'bullish' ? 'text-emerald-600' : 
                                  asset.outlook.toLowerCase() === 'bearish' ? 'text-rose-600' : 'text-slate-500'
                                }`}>
                                  {asset.outlook}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{asset.reasoning}</p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xl font-black text-slate-900 font-mono leading-none">{asset.score}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Regime</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* INDUSTRIAL AI PREDICTIVE SIGNAL INTELLIGENCE */}
              <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mb-10 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white py-4 border-b-4 border-slate-900">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Predictive Signal Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {marketData.predictive_signals?.map((signal, idx) => {
                      const Icon = getSignalIcon(signal.type);
                      return (
                        <div key={idx} className="border-2 border-slate-900 rounded-2xl overflow-hidden flex flex-col bg-white hover:translate-y-[-2px] transition-transform shadow-sm">
                          <div className={`p-4 border-b-2 border-slate-900 flex items-center justify-between ${
                            signal.type === 'opportunity' ? 'bg-emerald-50' : signal.type === 'warning' ? 'bg-rose-50' : 'bg-blue-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg border-2 ${
                                signal.type === 'opportunity' ? 'border-emerald-200 bg-white' : 
                                signal.type === 'warning' ? 'border-rose-200 bg-white' : 'border-blue-200 bg-white'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  signal.type === 'opportunity' ? 'text-emerald-600' : 
                                  signal.type === 'warning' ? 'text-rose-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <span className="font-black text-[10px] uppercase tracking-[0.15em] text-slate-900">{signal.type}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-xs font-black leading-none">{signal.confidence}%</p>
                              <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">Confidence</p>
                            </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-slate-900 font-black text-sm mb-2 leading-snug uppercase tracking-tight">
                                {signal.description}
                              </h5>
                              <div className="bg-slate-50 border-l-4 border-slate-900 p-3 mb-4 rounded-r-lg">
                                <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">
                                  "{signal.action}"
                                </p>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200 shadow-inner">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${signal.confidence}%` }}
                                className={`h-full ${
                                  signal.type === 'opportunity' ? 'bg-emerald-500' : 
                                  signal.type === 'warning' ? 'bg-rose-500' : 'bg-blue-600'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="news" className="mb-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="news">Live News Feed</TabsTrigger>
                  <TabsTrigger value="events">Major Events</TabsTrigger>
                  <TabsTrigger value="indicators">Economic Indicators</TabsTrigger>
                </TabsList>

                <TabsContent value="news" className="mt-6">
                  <div className="space-y-4">
                    {marketData.news_stories?.map((story, idx) => {
                      const CategoryIcon = getCategoryIcon(story.category);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className="border-2 border-slate-200 hover:shadow-lg transition-shadow rounded-xl">
                            <CardContent className="p-4 md:p-6">
                              <div className="flex items-start gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <CategoryIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                                      <h3 className="font-bold text-slate-900 text-sm md:text-lg break-words flex-1">{story.headline}</h3>
                                      <Badge className={`border ${getImpactColor(story.sentiment_impact)} text-[10px] md:text-xs flex-shrink-0`}>
                                        {story.sentiment_impact}
                                      </Badge>
                                    </div>
                                    <p className="text-xs md:text-sm text-slate-700 mb-3 break-words">{story.summary}</p>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-slate-500 flex-wrap">
                                        <Badge variant="outline" className="capitalize text-[10px] md:text-xs">{story.category}</Badge>
                                        <span className="truncate">{story.source}</span>
                                        <span className="flex items-center gap-1 flex-shrink-0">
                                          <Clock className="w-3 h-3" />
                                          {story.time}
                                        </span>
                                      </div>
                                      {story.url && (
                                        <a
                                          href__={story.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700 font-semibold text-xs md:text-sm flex items-center gap-1 flex-shrink-0"
                                        >
                                          Read More
                                          <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                        </a>
                                      )}
                                    </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  {!marketData.major_events || marketData.major_events.length === 0 ? (
                  <Card className="border-2 border-amber-200 bg-amber-50 rounded-xl">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-600" />
                        <p className="text-slate-700">No major events data available. Click "Refresh" to load recent market events.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {marketData.major_events.map((event, idx) => (
                      <Card key={idx} className="border-2 border-slate-200 rounded-xl">
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              event.impact === "high" ? "bg-rose-100" :
                              event.impact === "medium" ? "bg-amber-100" : "bg-blue-100"
                            }`}>
                              <AlertTriangle className={`w-5 h-5 md:w-6 md:h-6 ${
                                event.impact === "high" ? "text-rose-600" :
                                event.impact === "medium" ? "text-amber-600" : "text-blue-600"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-900 font-semibold mb-1 text-xs md:text-sm break-words">{event.description}</p>
                                  {event.date && (
                                    <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3 flex-shrink-0" />
                                      {event.date}
                                    </p>
                                  )}
                                </div>
                                <Badge className={`capitalize flex-shrink-0 text-[10px] md:text-xs ${
                                  event.impact === "high" ? "bg-rose-100 text-rose-700" :
                                  event.impact === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {event.impact}
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex gap-1.5 md:gap-2 flex-wrap">
                                  {event.affected_sectors?.map((sector, sidx) => (
                                    <Badge key={sidx} variant="outline" className="text-[10px] md:text-xs">
                                      {sector}
                                    </Badge>
                                  ))}
                                </div>
                                {event.url && (
                                  <a
                                    href__={event.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-xs md:text-sm flex items-center gap-1 flex-shrink-0"
                                  >
                                    Read More
                                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                      </div>
                      )}
                      </TabsContent>

                <TabsContent value="indicators" className="mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketData.economic_indicators && Object.entries(marketData.economic_indicators).map(([key, data], idx) => {
                      const indicatorInfo = {
                        fed_funds_rate: { 
                          title: "Fed Funds Rate", 
                          unit: "Midpoint Target", 
                          description: "The benchmark interest rate for the US economy." 
                        },
                        inflation_rate: { 
                          title: "Inflation (CPI)", 
                          unit: "Year-over-Year", 
                          description: "Consumer Price Index; the primary measure of price stability." 
                        },
                        unemployment_rate: { 
                          title: "Unemployment", 
                          unit: "U-3 Rate", 
                          description: "Percentage of the labor force actively seeking work." 
                        },
                        gdp_growth: { 
                          title: "GDP Growth", 
                          unit: "Annualized Rate", 
                          description: "Total value of goods and services produced in the US." 
                        },
                        vix_index: { 
                          title: "VIX Index", 
                          unit: "Volatility Level", 
                          description: "The 'Fear Gauge' measuring S&P 500 implied volatility." 
                        },
                        yield_curve_slope: { 
                          title: "Yield Curve", 
                          unit: "10Y-2Y Spread", 
                          description: "Difference between long and short term debt yields." 
                        }
                      };

                      const info = indicatorInfo[key] || { title: key.replace(/_/g, ' '), unit: "", description: "" };
                      
                      const getTrendColor = (trend, metric) => {
                        // Logic: For VIX and Unemployment, UP is BAD (Rose), DOWN is GOOD (Emerald)
                        if (metric === "unemployment_rate" || metric === "vix_index") {
                          if (trend === "up") return "bg-rose-100 text-rose-700 border-rose-300";
                          if (trend === "down") return "bg-emerald-100 text-emerald-700 border-emerald-300";
                        }
                        // Logic: For Yield Curve, Negative is BAD
                        if (metric === "yield_curve_slope") {
                          return data.value < 0 ? "bg-rose-100 text-rose-700 border-rose-300" : "bg-emerald-100 text-emerald-700 border-emerald-300";
                        }
                        // Standard: UP is GOOD, DOWN is BAD
                        if (trend === "up") return "bg-emerald-100 text-emerald-700 border-emerald-300";
                        if (trend === "down") return "bg-rose-100 text-rose-700 border-rose-300";
                        return "bg-slate-100 text-slate-700 border-slate-300";
                      };

                      return (
                        <Card key={idx} className={`border-2 transition-all rounded-xl shadow-sm hover:shadow-md ${
                          data.is_notable 
                            ? "border-amber-300 bg-amber-50/40" 
                            : "border-slate-200"
                        }`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{info.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{info.unit}</p>
                              </div>
                              {data.is_notable && (
                                <Badge className="bg-amber-600 text-white text-[10px] uppercase font-black px-2 py-0.5 animate-pulse">Notable</Badge>
                              )}
                            </div>

                            <div className="flex items-baseline gap-2 mb-4">
                              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                {key === 'vix_index' || key === 'yield_curve_slope' ? data.value : `${data.value}%`}
                              </span>
                              <Badge className={`border-2 px-1.5 py-0 text-[10px] font-black ${getTrendColor(data.trend, key)}`}>
                                {data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→"} {data.trend.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-xl p-3 mb-4 shadow-inner">
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                                "{data.significance}"
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                              <div>
                                <p className="text-[9px] text-slate-400 font-black uppercase">Source</p>
                                <p className="text-[10px] text-slate-800 font-bold truncate">{data.source || "Official Data"}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-slate-400 font-black uppercase">Reporting</p>
                                <p className="text-[10px] text-slate-800 font-bold">{data.as_of || "Latest"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
