import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  Globe,
  BarChart3,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function MarketNews() {
  const [newsData, setNewsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMarketNews();
  }, []);

  const loadMarketNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [finnhubNews, polygonNews, fmpArticles, marketIndices] = await Promise.all([
        fetchFinnhubNews(),
        fetchPolygonNews(),
        fetchFMPArticles(),
        fetchYahooMarketIndices()
      ]);

      const aggregatedNews = {
        news: [...(finnhubNews || []), ...(polygonNews || []), ...(fmpArticles || [])].slice(0, 15),
        economic_indicators: {
          inflation_rate: "3.2",
          unemployment_rate: "4.1",
          gdp_growth: "2.5",
          consumer_sentiment: "71.6"
        },
        market_indices: marketIndices,
        interest_rates: {
          federal_reserve_rate: "4.50",
          treasury_10y: "4.15",
          mortgage_30y: "6.87",
          savings_avg: "4.50",
          latest_change: "Fed maintained current rate",
          trend: "Stable"
        },
        major_events: []
      };

      setNewsData(aggregatedNews);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading market news:", error);
      setError("Unable to load market news. Please try again.");
    }

    setIsLoading(false);
  };

  const fetchFinnhubNews = async () => {
    try {
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) return [];
      
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=general&limit=10&token=${apiKey}`
      );
      const data = await response.json();
      
      return (data || []).map(item => ({
        title: item.headline,
        summary: item.summary,
        source: "Finnhub",
        date: new Date(item.datetime * 1000).toLocaleDateString(),
        category: "stocks",
        impact: "medium",
        url: item.url
      }));
    } catch (error) {
      console.error("Finnhub fetch error:", error);
      return [];
    }
  };

  const fetchPolygonNews = async () => {
    try {
      const apiKey = import.meta.env.VITE_POLYGON_IO_KEY;
      if (!apiKey) return [];
      
      const response = await fetch(
        `https://api.polygon.io/v2/reference/news?limit=10&sort=published_utc&order=desc&apikey=${apiKey}`
      );
      const data = await response.json();
      
      return (data.results || []).map(item => ({
        title: item.title,
        summary: item.description || item.title,
        source: "Polygon.io",
        date: new Date(item.published_utc).toLocaleDateString(),
        category: item.amp_url ? "stocks" : "general",
        impact: "low",
        url: item.article_url
      }));
    } catch (error) {
      console.error("Polygon fetch error:", error);
      return [];
    }
  };

  const fetchFMPArticles = async () => {
    try {
      const apiKey = import.meta.env.VITE_FINANCIAL_MODELING_PREP_KEY;
      if (!apiKey) return [];
      
      const response = await fetch(
        `https://financialmodelingprep.com/api/v4/article?limit=10&apikey=${apiKey}`
      );
      const data = await response.json();
      
      return (data || []).map(item => ({
        title: item.title,
        summary: item.text?.substring(0, 150) || item.title,
        source: "FMP",
        date: item.publishedDate ? new Date(item.publishedDate).toLocaleDateString() : "Today",
        category: "stocks",
        impact: "low",
        url: item.link
      }));
    } catch (error) {
      console.error("FMP fetch error:", error);
      return [];
    }
  };

  const fetchYahooMarketIndices = async () => {
    try {
      const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      const rapidApiHost = "yahoo-finance15.p.rapidapi.com";
      
      if (!rapidApiKey) return null;
      
      const symbols = ["^GSPC", "^IXIC", "^DJI"];
      const indices = {};

      for (const symbol of symbols) {
        const response = await fetch(
          `https://${rapidApiHost}/api/v1/markets/quote?symbol=${symbol}`,
          {
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": rapidApiHost
            }
          }
        );
        const data = await response.json();
        
        if (data.body && data.body.length > 0) {
          const quote = data.body[0];
          const indexName = symbol === "^GSPC" ? "S&P 500" : symbol === "^IXIC" ? "NASDAQ" : "Dow Jones";
          indices[indexName] = {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
          };
        }
      }

      return indices;
    } catch (error) {
      console.error("Yahoo Finance fetch error:", error);
      return null;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case "stocks": return "bg-blue-100 text-blue-700 border-blue-200";
      case "crypto": return "bg-purple-100 text-purple-700 border-purple-200";
      case "economy": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "policy": return "bg-orange-100 text-orange-700 border-orange-200";
      case "global": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getImpactColor = (impact) => {
    switch(impact) {
      case "high": return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTrendIcon = (value) => {
    if (!value) return null;
    if (typeof value === "number") {
      return value > 0 ? 
        <TrendingUp className="w-4 h-4 text-emerald-600" /> : 
        <TrendingDown className="w-4 h-4 text-rose-600" />;
    }
    const lower = String(value).toLowerCase();
    if (lower.includes("up") || lower.includes("rising") || lower.includes("increase")) {
      return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes("down") || lower.includes("falling") || lower.includes("decrease")) {
      return <TrendingDown className="w-4 h-4 text-rose-600" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
                Market News & Updates
              </h1>
              <p className="text-lg text-slate-600">
                Latest financial news from multiple sources
              </p>
            </div>
            <Button
              onClick={loadMarketNews}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Refresh News
                </>
              )}
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-slate-500">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
          {error && (
            <p className="text-sm text-rose-600 mt-2">{error}</p>
          )}
        </motion.div>

        {isLoading && !newsData && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {newsData && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {newsData.market_indices && (
                <Card className="border-2 border-slate-200 shadow-lg bg-white lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-6 h-6" />
                      Market Indices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {Object.entries(newsData.market_indices).map(([name, data]) => (
                      <div key={name} className="pb-3 border-b border-slate-100 last:border-0">
                        <p className="text-sm text-slate-600 font-medium">{name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-slate-900">{data.price?.toFixed(2)}</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(data.change)}
                            <span className={`text-sm font-semibold ${data.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {data.changePercent?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {newsData.interest_rates && (
                <Card className="border-2 border-slate-200 shadow-lg bg-white lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-6 h-6" />
                      Interest Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Fed Rate</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.interest_rates.federal_reserve_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">10Y Treasury</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.interest_rates.treasury_10y}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">30Y Mortgage</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.interest_rates.mortgage_30y}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600 font-medium">Savings Avg</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.interest_rates.savings_avg}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {newsData.economic_indicators && (
                <Card className="border-2 border-slate-200 shadow-lg bg-white lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-6 h-6" />
                      Economic Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Inflation (CPI)</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.economic_indicators.inflation_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Unemployment</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.economic_indicators.unemployment_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">GDP Growth</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.economic_indicators.gdp_growth}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600 font-medium">Consumer Sentiment</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.economic_indicators.consumer_sentiment}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {newsData.news && newsData.news.length > 0 && (
              <Card className="border-2 border-slate-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Newspaper className="w-7 h-7 text-blue-600" />
                    Top Financial News
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    {newsData.news.map((article, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Newspaper className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="text-lg font-bold text-slate-900 pr-4">
                                    {article.title}
                                  </h3>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Badge 
                                      variant="outline" 
                                      className={`${getCategoryColor(article.category)} border text-xs`}
                                    >
                                      {article.category}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`${getImpactColor(article.impact)} border text-xs`}
                                    >
                                      {article.source}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-slate-600 mb-3 leading-relaxed">
                                  {article.summary}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Calendar className="w-4 h-4" />
                                  {article.date}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
