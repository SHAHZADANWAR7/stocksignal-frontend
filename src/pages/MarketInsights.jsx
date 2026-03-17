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
              {/* INDUSTRIAL GRADE CIO HYBRID SENTIMENT CARD */}
              <Card className="border-b-4 border-r-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mb-10 rounded-none overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white py-4 border-b border-slate-800">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Activity className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Institutional Model</span>
                        <span className="text-lg font-black tracking-tight uppercase">CIO Hybrid Sentiment</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Stream</span>
                      </div>
                      <Badge className="bg-purple-600 text-white border-0 font-mono text-[10px] rounded-none">v5.4 INDUSTRIAL</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* COL 1: CORE SENTIMENT ENGINE (3/12) */}
                    <div className="lg:col-span-3 p-8 flex flex-col items-center justify-center bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200">
                      <div className={`mb-4 px-4 py-1 rounded-none border-2 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 ${getSentimentColor(marketData.overall_sentiment?.score)}`}>
                        {getSentimentIcon(marketData.overall_sentiment?.score)}
                        {getSentimentLabel(marketData.overall_sentiment?.score)}
                      </div>
                      <div className="relative mb-2">
                        <span className="text-8xl font-black text-slate-900 tracking-tighter leading-none">
                          {marketData.overall_sentiment?.score}
                        </span>
                        <span className="text-xl font-black text-slate-400 absolute -top-1 -right-8">/100</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-4">Weighted Aggregate Score</p>
                    </div>

                    {/* COL 2: SIGNAL CONTRIBUTION (4/12) */}
                    <div className="lg:col-span-4 p-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white">
                      <div className="flex items-center gap-2 mb-8">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Signal Attribution</h4>
                      </div>
                      <div className="space-y-6">
                        {marketData.signal_contributions && Object.entries(marketData.signal_contributions).map(([key, val]) => (
                          <div key={key} className="group">
                            <div className="flex justify-between items-end mb-1.5">
                              <span className="text-[10px] uppercase font-black text-slate-500 group-hover:text-slate-900 transition-colors tracking-widest">{key}</span>
                              <span className="font-mono text-sm font-black text-slate-900">{val}<span className="text-[10px] ml-0.5 text-slate-400">PTS</span></span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-none overflow-hidden flex border border-slate-200">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(val / 30) * 100}%` }}
                                className={`h-full ${
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
                    <div className="lg:col-span-5 p-8 bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-8">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Macro Ground Truth</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* VIX */}
                        <div className="bg-white p-4 border-2 border-slate-200 shadow-sm hover:border-slate-900 transition-colors cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Volatility Index</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">VIX {marketData.macro_drivers?.vix?.value}</span>
                            <Badge variant="outline" className="text-[9px] font-black px-1.5 h-4 border-slate-900 rounded-none uppercase bg-slate-900 text-white">
                              {marketData.macro_drivers?.vix?.status}
                            </Badge>
                          </div>
                        </div>
                        {/* 10Y */}
                        <div className="bg-white p-4 border-2 border-slate-200 shadow-sm hover:border-slate-900 transition-colors cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">US 10Y Yield</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{marketData.macro_drivers?.bond_10y?.value}%</span>
                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${marketData.macro_drivers?.bond_10y?.change > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {marketData.macro_drivers?.bond_10y?.change > 0 ? '▲' : '▼'} {Math.abs(marketData.macro_drivers?.bond_10y?.change)}
                            </span>
                          </div>
                        </div>
                        {/* CRUDE */}
                        <div className="bg-white p-4 border-2 border-slate-200 shadow-sm hover:border-slate-900 transition-colors cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Energy / WTI</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">${marketData.macro_drivers?.oil?.wti}</span>
                            <span className={`text-[10px] font-black ${marketData.macro_drivers?.oil?.change_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {marketData.macro_drivers?.oil?.change_pct}%
                            </span>
                          </div>
                        </div>
                        {/* BREADTH */}
                        <div className="bg-white p-4 border-2 border-slate-200 shadow-sm hover:border-slate-900 transition-colors cursor-default">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Market Breadth</p>
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

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Sector Sentiment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={marketData.sector_sentiment} margin={{ top: 10, right: 10, left: 40, bottom: 70 }}>
                        <defs>
                          <linearGradient id="sectorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="sector" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fill: '#475569', fontSize: 12 }}
                          label={{ value: 'Score', angle: -90, position: 'left', offset: 10, fill: '#475569', fontSize: 12 }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '2px solid #3b82f6', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Bar 
                          dataKey="score" 
                          fill="url(#sectorGradient)" 
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
                      {marketData.sector_sentiment?.map((sector, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 md:p-3 border border-blue-100">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="font-bold text-slate-900 text-xs md:text-sm truncate">{sector.sector}</span>
                            <Badge className={`${getSentimentColor(sector.score)} text-xs md:text-sm flex-shrink-0`}>
                              {sector.score}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-slate-600 break-words">{sector.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Asset Class Sentiment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    {!marketData.asset_sentiment || marketData.asset_sentiment.length === 0 ? (
                      <div className="text-center py-6 md:py-8">
                        <Target className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-xs md:text-sm text-slate-600">No asset sentiment data available. Click "Refresh" to load.</p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={260}>
                          <RadarChart data={marketData.asset_sentiment}>
                            <PolarGrid stroke="#d1d5db" />
                            <PolarAngleAxis dataKey="asset" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Radar name="Sentiment" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.6} strokeWidth={2} />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '2px solid #10b981', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        
                        <div className="mt-6 space-y-3">
                          {marketData.asset_sentiment.map((asset, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getSentimentColor(asset.score)}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm md:text-base uppercase tracking-tight">
                                    {asset.asset}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 h-5 border-current">
                                    {asset.outlook}
                                  </Badge>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-black">{asset.score}</span>
                                  <span className="text-[10px] opacity-70 font-bold">/100</span>
                                </div>
                              </div>
                              
                              <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                                {asset.reasoning}
                              </p>

                              <div className="mt-3 w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${asset.score}%` }}
                                  className="h-full bg-current opacity-40"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-amber-300 shadow-xl mb-8 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    AI Predictive Signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {marketData.predictive_signals?.map((signal, idx) => {
                      const Icon = getSignalIcon(signal.type);
                      return (
                        <Card key={idx} className="border-2 border-slate-200 overflow-hidden rounded-xl">
                          <div className={`bg-gradient-to-r ${getSignalColor(signal.type)} text-white p-3 md:p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                              <span className="font-bold capitalize text-xs md:text-sm">{signal.type}</span>
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs">
                              {signal.confidence}% confidence
                            </Badge>
                          </div>
                          <CardContent className="p-3 md:p-4">
                            <p className="text-slate-900 font-semibold mb-2 text-xs md:text-sm break-words">{signal.description}</p>
                            <p className="text-xs md:text-sm text-slate-600 mb-3 break-words">{signal.action}</p>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 md:h-2">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 md:h-2 rounded-full transition-all"
                                style={{ width: `${signal.confidence}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
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
