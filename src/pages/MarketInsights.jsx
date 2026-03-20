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
                  {/* RESPONSIVE ENGINE: flex-col for mobile, lg:flex-row for laptop */}
                  <div className="flex flex-col lg:flex-row divide-y-4 lg:divide-y-0 lg:divide-x-4 divide-slate-900">
                    
                    {/* COL 1: CORE SENTIMENT ENGINE (Mobile Center / Laptop Left) */}
                    <div className="p-10 flex flex-col items-center justify-center bg-slate-50 lg:w-[25%]">
                      <div className={`mb-6 px-5 py-2 rounded-full border-2 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 ${getSentimentColor(marketData.overall_sentiment?.score)}`}>
                        {getSentimentIcon(marketData.overall_sentiment?.score)}
                        {getSentimentLabel(marketData.overall_sentiment?.score)}
                      </div>
                      <div className="relative mb-2">
                        <span className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">
                          {marketData.overall_sentiment?.score}
                        </span>
                        <span className="text-xl font-black text-slate-400 absolute -top-1 -right-8">/100</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-6 text-center">Weighted Aggregate Score</p>
                    </div>

                    {/* COL 2: SIGNAL CONTRIBUTION (Mobile Scroll / Laptop Center) */}
                    <div className="p-10 bg-white lg:w-[35%]">
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

                    {/* COL 3: MACRO DRIVERS (Mobile Grid / Laptop Right) */}
                    <div className="p-10 bg-slate-50/50 flex-1">
                      <div className="flex items-center gap-2 mb-8">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Macro Ground Truth</h4>
                      </div>
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-5">
                        {/* VIX */}
                        <div className="bg-white p-5 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Volatility Index</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-slate-900">VIX {marketData.macro_drivers?.vix?.value}</span>
                            <Badge className="text-[9px] font-black bg-slate-900 text-white rounded-md uppercase px-2 h-5">
                              {marketData.macro_drivers?.vix?.status}
                            </Badge>
                          </div>
                        </div>
                        {/* 10Y */}
                        <div className="bg-white p-5 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">US 10Y Yield</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-slate-900">{marketData.macro_drivers?.bond_10y?.value}%</span>
                            <span className={`text-[10px] font-black ${marketData.macro_drivers?.bond_10y?.change > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {marketData.macro_drivers?.bond_10y?.change > 0 ? '▲' : '▼'}{Math.abs(marketData.macro_drivers?.bond_10y?.change)}
                            </span>
                          </div>
                        </div>
                        {/* CRUDE */}
                        <div className="bg-white p-5 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Energy / WTI</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-slate-900">${marketData.macro_drivers?.oil?.wti}</span>
                            <span className={`text-[10px] font-black ${marketData.macro_drivers?.oil?.change_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {marketData.macro_drivers?.oil?.change_pct}%
                            </span>
                          </div>
                        </div>
                        {/* BREADTH */}
                        <div className="bg-white p-5 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Market Breadth</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-slate-900">{marketData.macro_drivers?.breadth?.ratio}x</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">A/D Ratio</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

             {/* SYMMETRICAL INDUSTRIAL DASHBOARD GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                
                {/* 1. SECTOR RISK DISTRIBUTION */}
                <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden bg-white flex flex-col">
                  <CardHeader className="bg-slate-900 text-white py-4 border-b-4 border-slate-900">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      Sector Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="h-64 md:h-72 mb-10">
                      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                        <BarChart data={marketData.sector_sentiment} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis 
                            dataKey="sector" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} domain={[0, 100]} />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                            {marketData.sector_sentiment.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.score > 60 ? '#4f46e5' : entry.score > 40 ? '#818cf8' : '#312e81'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Standardized reasoning list */}
                    <div className="space-y-4">
                      {marketData.sector_sentiment.map((sector, idx) => (
                        <div key={idx} className="flex gap-4 p-4 border-2 border-slate-900 rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] min-h-[110px] lg:h-[110px] overflow-y-auto">
                          <div className="flex flex-col items-center justify-center min-w-[50px] border-r-2 border-slate-200 pr-4">
                            <span className="text-xl font-black text-slate-900">{sector.score}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase">Score</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest truncate">{sector.sector}</h4>
                                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${sector.score > 60 ? 'bg-emerald-500' : sector.score < 45 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed line-clamp-3">{sector.reasoning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. ASSET ALLOCATION REGIME */}
                <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden bg-white flex flex-col">
                  <CardHeader className="bg-slate-900 text-white py-4 border-b-4 border-slate-900">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <Target className="w-5 h-5 text-emerald-400" />
                      Asset Allocation Regime
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="h-64 md:h-72 mb-10">
                      <ResponsiveContainer width="100%" aspect={1}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={marketData.asset_sentiment}>
                          <PolarGrid stroke="#e2e8f0" strokeWidth={2} />
                          <PolarAngleAxis dataKey="asset" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Sentiment" dataKey="score" stroke="#1e293b" strokeWidth={4} fill="#10b981" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      {marketData.asset_sentiment.map((asset, idx) => (
                        <div key={idx} className="flex gap-4 p-4 border-2 border-slate-900 rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] min-h-[110px] lg:h-[110px] overflow-y-auto">
                          <div className="flex items-center gap-4 min-w-0 w-full">
                            <div className={`w-10 h-10 rounded-xl border-2 border-slate-900 flex-shrink-0 flex items-center justify-center font-black text-sm ${
                              asset.outlook.toLowerCase() === 'bullish' ? 'bg-emerald-500 text-white' : 
                              asset.outlook.toLowerCase() === 'bearish' ? 'bg-rose-500 text-white' : 'bg-white text-slate-900'
                            }`}>
                              {asset.asset[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest truncate">{asset.asset}</span>
                                <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 border-2 rounded-full border-slate-900 bg-slate-50 text-slate-500 flex-shrink-0">
                                  {asset.outlook}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold leading-tight line-clamp-3">{asset.reasoning}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-xl font-black text-slate-900 font-mono leading-none">{asset.score}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Regime</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

            {/* INDUSTRIAL AI PREDICTIVE SIGNAL INTELLIGENCE - OPTIMIZED DENSITY */}
              <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mb-10 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white py-4 border-b-4 border-slate-900">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Predictive Signal Intelligence
                  </CardTitle>
                </CardHeader>
                
                {/* FIXED: 
                   - Removed min-h-[400px] to prevent vertical stretching.
                   - Reduced py-12 to py-8 for a tighter, high-density professional look.
                   - Kept flex items-center to ensure 1 or 2 cards stay centered.
                */}
                <CardContent className="py-8 md:py-10 px-4 md:px-8 flex flex-col items-center bg-slate-50/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
                    {marketData.predictive_signals?.map((signal, idx) => {
                      const Icon = getSignalIcon(signal.type);
                      return (
                        <div key={idx} className="border-2 border-slate-900 rounded-2xl overflow-hidden flex flex-col bg-white hover:translate-y-[-4px] transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          <div className={`p-4 border-b-2 border-slate-900 flex items-center justify-between ${
                            signal.type === 'opportunity' ? 'bg-emerald-50' : signal.type === 'warning' ? 'bg-rose-50' : 'bg-blue-50'
                          }`}>
                            <div className="flex items-center gap-3">
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
                              <p className="font-mono text-xs font-black leading-none text-slate-900">{signal.confidence}%</p>
                              <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Confidence</p>
                            </div>
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-slate-900 font-black text-sm mb-3 leading-snug uppercase tracking-tight">
                                {signal.description}
                              </h5>
                              <div className="bg-slate-50 border-l-4 border-slate-900 p-3 mb-4 rounded-r-lg shadow-inner">
                                <p className="text-[11px] text-slate-700 font-bold leading-relaxed italic">
                                  "{signal.action}"
                                </p>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200 shadow-inner mt-auto">
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
  {/* INDUSTRIAL TABS LIST: Optimized for High-Density Mobile Scaling */}
  <TabsList className="flex flex-wrap md:grid w-full md:grid-cols-3 h-auto p-1.5 bg-slate-900 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
    <TabsTrigger 
      value="news" 
      className="flex-1 py-2.5 md:py-3 font-black uppercase text-[9px] xs:text-[10px] md:text-xs tracking-widest text-slate-400 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-[1.5rem] transition-all"
    >
      News Wire
    </TabsTrigger>
    <TabsTrigger 
      value="events" 
      className="flex-1 py-2.5 md:py-3 font-black uppercase text-[9px] xs:text-[10px] md:text-xs tracking-widest text-slate-400 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-[1.5rem] transition-all"
    >
      Macro Events
    </TabsTrigger>
    <TabsTrigger 
      value="indicators" 
      className="flex-1 py-2.5 md:py-3 font-black uppercase text-[9px] xs:text-[10px] md:text-xs tracking-widest text-slate-400 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-[1.5rem] transition-all"
    >
      Indicators
    </TabsTrigger>
  </TabsList>

                <TabsContent value="news" className="mt-6 outline-none">
  <div className="space-y-6">
    {marketData.news_stories?.map((story, idx) => {
      const CategoryIcon = getCategoryIcon(story.category);
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          {/* INDUSTRIAL CARD: High-visibility solid background and heavy borders */}
          <div className="group border-4 border-slate-900 bg-white rounded-[2rem] overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all flex flex-col md:flex-row">
            
            {/* CATEGORY STRIPE: Solid slate-50 background prevents the "dimmed" look */}
            <div className="md:w-20 bg-slate-50 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 flex items-center justify-center p-5">
              <CategoryIcon className="w-8 h-8 text-slate-900" />
            </div>

            <div className="flex-1 p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-900 text-white font-mono text-[10px] px-3 py-1 uppercase border-0 rounded-md">
                    {story.source}
                  </Badge>
                  <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {story.time.includes('T') ? story.time.split('T')[1].substring(0, 5) : story.time} GMT
                  </span>
                </div>
                <Badge variant="outline" className={`font-black uppercase text-[10px] border-2 rounded-full px-4 py-1 ${getImpactColor(story.sentiment_impact)}`}>
                  {story.sentiment_impact} IMPACT
                </Badge>
              </div>

              <h3 className="font-black text-slate-900 text-lg md:text-2xl leading-tight mb-3 uppercase tracking-tight">
                {story.headline}
              </h3>

              {/* INDUSTRIAL SUMMARY BLOCK: High contrast for mobile legibility */}
              <div className="bg-slate-50 border-l-4 border-slate-900 p-4 mb-5 rounded-r-xl">
                <p className="text-xs md:text-sm text-slate-700 font-bold leading-relaxed">
                  {story.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100">
                <Badge className="bg-slate-200 text-slate-700 border-0 text-[10px] font-black uppercase rounded-md px-3">
                  {story.category}
                </Badge>
                {story.url && (
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 bg-slate-900 text-white rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none"
                  >
                    ACCESS TERMINAL
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    })}
  </div>
</TabsContent>

               <TabsContent value="events" className="mt-6">
                  {!marketData.major_events || marketData.major_events.length === 0 ? (
                    <div className="border-4 border-dashed border-slate-200 bg-slate-50 rounded-[2rem] p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No System-Critical Events Detected</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {marketData.major_events.map((event, idx) => (
                        <div key={idx} className="group border-4 border-slate-900 bg-white rounded-[2.5rem] overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all flex flex-col md:flex-row">
                          <div className={`md:w-32 flex flex-col items-center justify-center p-6 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 ${
                            event.impact === "high" ? "bg-rose-50" :
                            event.impact === "medium" ? "bg-amber-50" : "bg-blue-50"
                          }`}>
                            <AlertTriangle className={`w-8 h-8 mb-2 ${
                              event.impact === "high" ? "text-rose-600" :
                              event.impact === "medium" ? "text-amber-600" : "text-blue-600"
                            }`} />
                            <span className="font-black text-[10px] uppercase tracking-widest text-slate-900">{event.impact}</span>
                          </div>
                          
                          <div className="flex-1 p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <h3 className="text-slate-900 font-black text-lg md:text-2xl leading-tight uppercase tracking-tight mb-2">
                                  {event.description}
                                </h3>
                                {event.date && (
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono text-[10px] font-black uppercase tracking-widest">{event.date}</span>
                                  </div>
                                )}
                              </div>
                              <Badge className={`rounded-full border-2 font-black uppercase text-[10px] px-4 py-1 flex-shrink-0 ${
                                event.impact === "high" ? "border-rose-500 text-rose-600 bg-rose-50" :
                                event.impact === "medium" ? "border-amber-500 text-amber-600 bg-amber-50" : 
                                "border-blue-500 text-blue-600 bg-blue-50"
                              }`}>
                                {event.impact} IMPACT
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-slate-100">
                              <div className="flex gap-2 flex-wrap">
                                {event.affected_sectors?.map((sector, sidx) => (
                                  <Badge key={sidx} className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase rounded-full px-3 py-0.5">
                                    {sector}
                                  </Badge>
                                ))}
                              </div>
                              {event.url && (
                                <a
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-900 hover:text-purple-600 font-black text-xs flex items-center gap-1 transition-colors uppercase tracking-tighter"
                                >
                                  Detailed Analysis
                                  <ChevronRight className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
               <TabsContent value="indicators" className="mt-8 outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {marketData.economic_indicators && Object.entries(marketData.economic_indicators).map(([key, data], idx) => {
                      const indicatorInfo = {
                        fed_funds_rate: { title: "Fed Funds Rate", unit: "Midpoint Target" },
                        inflation_rate: { title: "Inflation (CPI)", unit: "Year-over-Year" },
                        unemployment_rate: { title: "Unemployment", unit: "U-3 Rate" },
                        gdp_growth: { title: "GDP Growth", unit: "Annualized Rate" },
                        vix_index: { title: "VIX Index", unit: "Volatility Level" },
                        yield_curve_slope: { title: "Yield Curve", unit: "10Y-2Y Spread" }
                      };

                      const info = indicatorInfo[key] || { title: key.replace(/_/g, ' '), unit: "Latest Metric" };
                      
                      // INDUSTRIAL HIGH-CONTRAST TREND LOGIC
                      const getTrendColor = (trend, metric, val) => {
                        // Bad if Up: VIX, Unemployment, Inflation
                        if (["unemployment_rate", "vix_index", "inflation_rate"].includes(metric)) {
                          if (trend === "up") return "bg-rose-600 text-white border-rose-700 shadow-sm";
                          if (trend === "down") return "bg-emerald-600 text-white border-emerald-700 shadow-sm";
                        }
                        // Yield Curve: Bad if Negative (Inverted)
                        if (metric === "yield_curve_slope") {
                          return val < 0 ? "bg-rose-600 text-white border-rose-700" : "bg-emerald-600 text-white border-emerald-700";
                        }
                        // Standard: Up is Good
                        return trend === "up" ? "bg-emerald-600 text-white border-emerald-700" : "bg-rose-600 text-white border-rose-700";
                      };

                      return (
                        <div key={idx} className={`group border-4 border-slate-900 rounded-[2.5rem] p-8 bg-white transition-all hover:translate-y-[-4px] ${
                          data.is_notable ? 'shadow-[8px_8px_0px_0px_rgba(245,158,11,1)] border-amber-500' : 'shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]'
                        }`}>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="font-black text-slate-950 text-[10px] uppercase tracking-[0.2em] mb-1">{info.title}</h3>
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{info.unit}</p>
                            </div>
                            {data.is_notable && (
                              <Badge className="bg-amber-600 text-white text-[9px] uppercase font-black px-2 py-0.5 animate-pulse rounded-full border-2 border-slate-900">Notable</Badge>
                            )}
                          </div>

                          <div className="flex items-baseline gap-3 mb-6 flex-wrap">
                            <span className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter">
                              {key === 'vix_index' || key === 'yield_curve_slope' ? data.value : `${data.value}%`}
                            </span>
                            <Badge className={`border-2 font-black uppercase text-[10px] px-3 py-1 rounded-full ${getTrendColor(data.trend, key, data.value)}`}>
                              {data.trend === "up" ? "▲" : data.trend === "down" ? "↓" : "■"} {data.trend}
                            </Badge>
                          </div>

                          <div className="bg-slate-50 border-l-4 border-slate-900 p-4 mb-6 rounded-r-2xl">
                            <p className="text-[11px] font-black text-slate-700 leading-relaxed italic line-clamp-3">
                              "{data.significance}"
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-slate-900">
                            <div className="min-w-0">
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Source</p>
                              <p className="text-[10px] text-slate-950 font-black truncate">{data.source || "Institutional"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">As Of</p>
                              <p className="text-[10px] text-slate-950 font-black">{data.as_of || "Real-time"}</p>
                            </div>
                          </div>
                        </div>
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
