import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
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
      const data = await awsApi.getMarketInsights();
      
      if (data && data.cache_age !== undefined) {
        const oneHour = 60 * 60 * 1000;
        
        if (data.cache_age > oneHour) {
          loadMarketInsights();
        } else {
          setMarketData(data.market_data);
          setLastUpdated(new Date(data.last_fetched));
        }
      } else {
        loadMarketInsights();
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
      loadMarketInsights();
    }
  };

  const loadMarketInsights = async () => {
    setIsLoading(true);
    try {
      const prompt = `You are analyzing US economic data. Today is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.

CRITICAL: Search Yahoo Finance for the LATEST US economic indicator data published in late 2025.

For EACH economic indicator, search Yahoo Finance specifically:
1. Interest Rate: Search "site:finance.yahoo.com Federal Reserve interest rate December 2025"
2. Inflation (CPI): Search "site:finance.yahoo.com US inflation CPI November 2025" 
3. Unemployment: Search "site:finance.yahoo.com US unemployment rate November 2025"
4. GDP Growth: Search "site:finance.yahoo.com US GDP Q3 2025"
5. Leading Economic Index: Search "site:finance.yahoo.com US leading economic index November 2025"

REQUIREMENTS:
- Use ONLY Yahoo Finance articles from late 2025 (November/December 2025)
- Report the actual published values from the articles
- Compare to previous month/quarter for trend determination
- All data must be US-specific
- as_of dates must show exact month + 2025 (e.g., "November 2025")

US Economic Indicators to report:
- interest_rate: {value: number (Fed Funds Rate midpoint), trend: "up"|"down"|"stable", source: "Federal Reserve", as_of: "Month 2025", significance: string, is_notable: boolean}
- inflation: {value: number (CPI year-over-year %), trend: "up"|"down"|"stable", source: "Bureau of Labor Statistics", as_of: "Month 2025", significance: string, is_notable: boolean}
- unemployment: {value: number (U-3 rate %), trend: "up"|"down"|"stable", source: "Bureau of Labor Statistics", as_of: "Month 2025", significance: string, is_notable: boolean}
- gdp_growth: {value: number (annualized %), trend: "up"|"down"|"stable", source: "Bureau of Economic Analysis", as_of: "Q# 2025", significance: string, is_notable: boolean}
- leading_index: {value: number (LEI index), trend: "up"|"down"|"stable", source: "The Conference Board", as_of: "Month 2025", significance: string, is_notable: boolean}

is_notable = true only for significant changes: inflation/unemployment >0.2%, GDP >0.8%, LEI >1.0 point, rate >0.25%

Return JSON with:

1. overall_sentiment: {score: number 0-100, label: string, key_factors: [3 short strings]}

2. sector_sentiment: Array of 5 objects with {sector: string, score: number, reasoning: string} for Technology, Healthcare, Finance, Energy, Consumer Goods

3. news_stories: Array of 5 objects with {headline: string, url: string, category: string, sentiment_impact: "positive"|"negative"|"neutral", summary: string, source: string, time: string}

4. US Economic Indicators (SEARCH OFFICIAL SOURCES FOR REAL DATA):
- interest_rate: {value: number (current Fed Funds Rate midpoint), trend: "up"|"down"|"stable", source: "Federal Reserve", as_of: "Month YYYY", significance: string (1 sentence), is_notable: boolean}
- inflation: {value: number (latest US CPI year-over-year %), trend: "up"|"down"|"stable", source: "Bureau of Labor Statistics", as_of: "Month YYYY", significance: string, is_notable: boolean}
- unemployment: {value: number (latest US U-3 rate %), trend: "up"|"down"|"stable", source: "Bureau of Labor Statistics", as_of: "Month YYYY", significance: string, is_notable: boolean}
- gdp_growth: {value: number (latest quarterly annualized %), trend: "up"|"down"|"stable", source: "Bureau of Economic Analysis", as_of: "Q# YYYY", significance: string, is_notable: boolean}
- leading_index: {value: number (actual LEI index value), trend: "up"|"down"|"stable", source: "The Conference Board", as_of: "Month YYYY", significance: string, is_notable: boolean}

5. major_events: REQUIRED - Array of exactly 5 major financial/economic events from the last 30 days (November 22 - December 22, 2025)
For EACH event, search Yahoo Finance, Bloomberg, CNBC for real events: {description: string (detailed), impact: "high"|"medium"|"low", affected_sectors: [1-3 sector names], url: string (real article URL), date: string (e.g., "Dec 15, 2025")}

6. predictive_signals: Array of 3 objects with {type: "opportunity"|"warning"|"neutral", description: string, confidence: number 0-100, action: string}

7. asset_sentiment: REQUIRED - Array of exactly 5 objects, one for each asset class:
- {asset: "Stocks", score: number 0-100, outlook: "bullish"|"neutral"|"bearish" + reasoning}
- {asset: "Bonds", score: number 0-100, outlook: "bullish"|"neutral"|"bearish" + reasoning}
- {asset: "Commodities", score: number 0-100, outlook: "bullish"|"neutral"|"bearish" + reasoning}
- {asset: "Crypto", score: number 0-100, outlook: "bullish"|"neutral"|"bearish" + reasoning}
- {asset: "Real Estate", score: number 0-100, outlook: "bullish"|"neutral"|"bearish" + reasoning}

Return only valid JSON.`;

      const result = await awsApi.generateMarketInsights(prompt);

      const formattedResult = {
        overall_sentiment: result.overall_sentiment,
        sector_sentiment: result.sector_sentiment,
        news_stories: result.news_stories,
        economic_indicators: {
          interest_rate: result.interest_rate,
          inflation: result.inflation,
          unemployment: result.unemployment,
          gdp_growth: result.gdp_growth,
          leading_economic_index: result.leading_index
        },
        major_events: result.major_events,
        predictive_signals: result.predictive_signals,
        asset_sentiment: result.asset_sentiment
      };

      setMarketData(formattedResult);
      setLastUpdated(new Date());
      await awsApi.cacheMarketInsights(formattedResult);
    } catch (error) {
      console.error("Error loading market insights:", error);
      alert("Error loading market insights. Please try again.");
    }
    setIsLoading(false);
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
              <Card className="border-2 border-purple-300 shadow-xl mb-8 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Activity className="w-7 h-7" />
                    Overall Market Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="text-center">
                      <div className={`inline-flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-2xl border-2 ${getSentimentColor(marketData.overall_sentiment?.score)}`}>
                        {getSentimentIcon(marketData.overall_sentiment?.score)}
                        <div className="text-left">
                          <p className="text-xs md:text-sm opacity-75">Current Sentiment</p>
                          <p className="text-xl md:text-3xl font-bold break-words">{getSentimentLabel(marketData.overall_sentiment?.score)}</p>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-4">
                        <p className="text-3xl md:text-5xl font-bold text-slate-900 break-words">{marketData.overall_sentiment?.score}</p>
                        <p className="text-xs md:text-sm text-slate-500">Sentiment Score</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 text-sm md:text-base">Key Factors Driving Sentiment</h4>
                      <ul className="space-y-2">
                        {marketData.overall_sentiment?.key_factors?.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-slate-700">
                            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mt-0.5 md:mt-1 text-purple-600 flex-shrink-0" />
                            <span className="break-words">{factor}</span>
                          </li>
                        ))}
                      </ul>
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
                        <div className="mt-3 md:mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                          {marketData.asset_sentiment.map((asset, idx) => (
                            <div key={idx} className={`p-2 md:p-3 rounded-lg border-2 ${getSentimentColor(asset.score)}`}>
                              <p className="font-semibold text-xs md:text-sm truncate">{asset.asset}</p>
                              <p className="text-base md:text-lg font-bold break-words">{asset.score}</p>
                              <p className="text-[10px] md:text-xs opacity-75 capitalize mt-1 truncate">{asset.outlook}</p>
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
                        interest_rate: {
                          title: "Interest Rate",
                          unit: "Federal Funds Rate",
                          description: "The target rate set by the Federal Reserve for overnight lending between banks.",
                          trendMeaning: { up: "Higher rates slow growth", down: "Lower rates stimulate growth", stable: "Policy on hold" }
                        },
                        inflation: {
                          title: "Inflation (CPI)",
                          unit: "Year-over-year % change",
                          description: "Consumer Price Index measures average change in prices paid by consumers.",
                          trendMeaning: { up: "Rising prices reduce purchasing power", down: "Moderating prices", stable: "Stable prices" }
                        },
                        unemployment: {
                          title: "Unemployment Rate",
                          unit: "U-3 unemployment rate",
                          description: "Percentage of labor force seeking employment but without jobs.",
                          trendMeaning: { up: "Weakening labor market", down: "Strengthening job market", stable: "Stable employment" }
                        },
                        gdp_growth: {
                          title: "GDP Growth",
                          unit: "Quarterly annualized %",
                          description: "Gross Domestic Product growth measures economic expansion rate.",
                          trendMeaning: { up: "Accelerating growth", down: "Slowing growth", stable: "Steady growth" }
                        },
                        leading_economic_index: {
                          title: "Leading Economic Index",
                          unit: "Index level (100 baseline)",
                          description: "Composite index designed to predict future economic direction.",
                          trendMeaning: { up: "Economy strengthening", down: "Economy weakening", stable: "Steady outlook" }
                        }
                      };

                      const info = indicatorInfo[key] || { 
                        title: key.replace(/_/g, ' '), 
                        unit: "", 
                        description: "",
                        trendMeaning: { up: "", down: "", stable: "" }
                      };

                      const getTrendColor = (trend, metric) => {
                        if (metric === "unemployment") {
                          if (trend === "up") return "bg-rose-100 text-rose-700 border-rose-300";
                          if (trend === "down") return "bg-emerald-100 text-emerald-700 border-emerald-300";
                          return "bg-slate-100 text-slate-700 border-slate-300";
                        }
                        if (metric === "inflation") {
                          if (trend === "up") return "bg-amber-100 text-amber-700 border-amber-300";
                          if (trend === "down") return "bg-emerald-100 text-emerald-700 border-emerald-300";
                          return "bg-slate-100 text-slate-700 border-slate-300";
                        }
                        if (metric === "interest_rate") {
                          if (trend === "stable") return "bg-slate-100 text-slate-700 border-slate-300";
                          return "bg-purple-100 text-purple-700 border-purple-300";
                        }
                        if (trend === "up") return "bg-emerald-100 text-emerald-700 border-emerald-300";
                        if (trend === "down") return "bg-rose-100 text-rose-700 border-rose-300";
                        return "bg-slate-100 text-slate-700 border-slate-300";
                      };

                      return (
                        <Card key={idx} className={`border-2 transition-all rounded-xl ${
                          data.is_notable 
                            ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg ring-2 ring-amber-200" 
                            : "border-slate-200 hover:shadow-lg"
                        }`}>
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                              <h3 className="font-bold text-slate-900 text-sm md:text-lg truncate">{info.title}</h3>
                              {data.is_notable && (
                                <Badge className="bg-amber-600 text-white animate-pulse">Notable</Badge>
                              )}
                            </div>

                            <div className="mb-4">
                              <Badge className={`border-2 ${getTrendColor(data.trend, key)}`}>
                                {data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→"} {data.trend.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="mb-3">
                              <p className="text-2xl md:text-4xl font-bold text-slate-900 break-words">
                                {key === "leading_economic_index" ? data.value : `${data.value}%`}
                              </p>
                              <p className="text-[10px] md:text-xs text-slate-500 mt-1 break-words">{info.unit}</p>
                            </div>

                            {data.significance && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-3 border-2 border-blue-200">
                                <p className="text-sm text-slate-800 font-medium">
                                  {data.significance}
                                </p>
                              </div>
                            )}

                            <div className="pt-3 border-t border-slate-200 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Source:</span>
                                <span className="font-semibold text-slate-700">{data.source || "Official Data"}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">As of:</span>
                                <span className="font-semibold text-slate-700">{data.as_of || "Latest"}</span>
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
