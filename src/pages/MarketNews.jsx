import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
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

  useEffect(() => {
    loadMarketNews();
  }, []);

  const loadMarketNews = async () => {
    setIsLoading(true);
    
    try {
      const newsResult = await awsApi.getMarketNews();
      setNewsData(newsResult);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading market news:", error);
      alert("Error loading market news. Please try again.");
    }

    setIsLoading(false);
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

  const getTrendIcon = (trend) => {
    if (!trend) return null;
    const lowerTrend = trend.toLowerCase();
    if (lowerTrend.includes("up") || lowerTrend.includes("rising") || lowerTrend.includes("increase")) {
      return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    }
    if (lowerTrend.includes("down") || lowerTrend.includes("falling") || lowerTrend.includes("decrease")) {
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
                Latest financial news, interest rates, and market events
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
        </motion.div>

        {isLoading && !newsData && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {newsData && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
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
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Savings Avg</span>
                      <span className="text-xl font-bold text-slate-900">
                        {newsData.interest_rates.savings_avg}%
                      </span>
                    </div>
                    {newsData.interest_rates.latest_change && (
                      <div className="pt-3 bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-slate-700 mb-1">Latest Change:</p>
                        <p className="text-sm text-slate-600">{newsData.interest_rates.latest_change}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getTrendIcon(newsData.interest_rates.trend)}
                          <span className="text-sm font-medium text-slate-700">
                            {newsData.interest_rates.trend}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {newsData.economic_indicators && (
                <Card className="border-2 border-slate-200 shadow-lg bg-white lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-6 h-6" />
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

              {newsData.major_events && newsData.major_events.length > 0 && (
                <Card className="border-2 border-slate-200 shadow-lg bg-white lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-6 h-6" />
                      Major Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {newsData.major_events.map((event, index) => (
                      <div key={index} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-slate-900 mb-1">{event.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{event.date}</span>
                              {event.impact && (
                                <Badge variant="outline" className="text-xs">
                                  Impact: {event.impact}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                                      {article.impact}
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
