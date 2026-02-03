import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { callAwsFunction } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Search,
  Loader2,
  RefreshCw,
  Building2,
  Zap,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CardSkeleton from "@/components/ui/CardSkeleton";

export default function IndexFunds() {
  const [indexFunds, setIndexFunds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newSymbol, setNewSymbol] = useState("");
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);

  // Reference mapping for index data display
  const etfToIndexMap = {
    'SPY': { symbol: '^GSPC', name: 'S&P 500 Index' },
    'VOO': { symbol: '^GSPC', name: 'S&P 500 Index' },
    'IVV': { symbol: '^GSPC', name: 'S&P 500 Index' },
    'QQQ': { symbol: '^NDX', name: 'NASDAQ-100 Index' },
    'DIA': { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
    'IWM': { symbol: '^RUT', name: 'Russell 2000 Index' },
    'VTI': { symbol: '^GSPC', name: 'Total Market (S&P 500 Reference)' }
  };

  useEffect(() => {
    loadIndexFunds();
  }, []);

  const loadIndexFunds = async () => {
    setIsLoading(true);
    try {
      const data = await callAwsFunction('getCompanies', { type: 'index_funds' });
      setIndexFunds(data.items || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading index funds:", error);
      alert("Error loading index funds. Please try again.");
    }
    setIsLoading(false);
  };

  const handleAddSymbol = async () => {
    if (!newSymbol.trim()) return;
    
    const symbolUpper = newSymbol.toUpperCase();
    const existing = indexFunds.find(f => f.symbol === symbolUpper);
    if (existing) {
      alert(`${symbolUpper} already exists in the list!`);
      setNewSymbol("");
      return;
    }
    
    setIsAddingSymbol(true);
    try {
      const stockData = await callAwsFunction('getStockQuote', {
        symbol: symbolUpper
      });

      if (stockData.error || !stockData.symbol) {
        alert("Symbol not found or data unavailable. Please check the ticker and try again.");
        setIsAddingSymbol(false);
        return;
      }

      const isETF = stockData.name.includes('ETF') || 
                    stockData.name.includes('Fund') || 
                    stockData.name.includes('Trust') ||
                    stockData.name.includes('Shares');

      if (!isETF) {
        alert("This appears to be a stock, not an ETF/index fund. Try searching for a ticker symbol that represents an ETF.");
        setIsAddingSymbol(false);
        return;
      }

      const fundType = stockData.name.toLowerCase().includes('bond') ? 'bond' :
                      stockData.name.toLowerCase().includes('international') || stockData.name.toLowerCase().includes('emerging') || stockData.name.toLowerCase().includes('msci') ? 'international' :
                      stockData.name.toLowerCase().includes('sector') || stockData.name.toLowerCase().includes('select') ? 'sector' :
                      stockData.name.toLowerCase().includes('commodity') || stockData.name.toLowerCase().includes('gold') || stockData.name.toLowerCase().includes('oil') || stockData.name.toLowerCase().includes('copper') ? 'commodity' :
                      'broad_market';

      const newFund = {
        symbol: symbolUpper,
        name: stockData.name,
        type: fundType,
        description: `${fundType.replace('_', ' ')} ETF - ${stockData.exchange || 'listed'} trading`,
        expense_ratio: 0.10
      };

      setIndexFunds(prev => [...prev, newFund]);
      setNewSymbol("");
      alert(`✅ ${stockData.name} added successfully!`);
    } catch (error) {
      console.error("Error adding symbol:", error);
      alert("Error adding symbol. Please check if it's a valid ETF/index fund symbol.");
    }
    setIsAddingSymbol(false);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const data = await callAwsFunction('getCompanies', { type: 'index_funds', forceRefresh: true });
      setIndexFunds(data.items || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("Error loading some market data. Please try refreshing again.");
    }
    setIsRefreshing(false);
  };

  const filteredFunds = indexFunds.filter(fund => {
    const matchesSearch = searchQuery === "" || 
      fund.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fund.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || fund.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getIndexData = (etfSymbol) => {
    if (!indexFunds) return null;
    const indexInfo = etfToIndexMap[etfSymbol];
    if (!indexInfo) return null;
    return indexFunds.find(f => f.symbol === indexInfo.symbol);
  };

  const getIndexName = (etfSymbol) => {
    return etfToIndexMap[etfSymbol]?.name || null;
  };

  const getTypeColor = (type) => {
    switch(type) {
      case "broad_market": return "bg-blue-100 text-blue-700 border-blue-200";
      case "sector": return "bg-purple-100 text-purple-700 border-purple-200";
      case "international": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "bond": return "bg-amber-100 text-amber-700 border-amber-200";
      case "commodity": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "bullish") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (trend === "bearish") return <TrendingDown className="w-4 h-4 text-rose-600" />;
    return <BarChart3 className="w-4 h-4 text-slate-600" />;
  };

  const getTrendColor = (trend) => {
    if (trend === "bullish") return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (trend === "bearish") return "text-rose-600 bg-rose-50 border-rose-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const getMoodIcon = (mood) => {
    if (mood === "positive") return <TrendingUp className="w-3 h-3 text-blue-600" />;
    if (mood === "negative") return <TrendingDown className="w-3 h-3 text-orange-600" />;
    return <BarChart3 className="w-3 h-3 text-slate-500" />;
  };

  const getMoodColor = (mood) => {
    if (mood === "positive") return "text-blue-600 bg-blue-50 border-blue-200";
    if (mood === "negative") return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
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
                Index Funds & ETFs
              </h1>
              <p className="text-lg text-slate-600">
                Track major market indices and sector ETFs with live data
              </p>
            </div>
            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
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

        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg mb-6 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Can't Find Your Fund?</h3>
                <p className="text-sm text-slate-600">Search any publicly traded ETF or index fund by ticker symbol - we'll fetch the data automatically</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter any NASDAQ/NYSE symbol (e.g., SPY, QQQ, VTI)..."
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                className="flex-1 h-12 text-base"
              />
              <Button
                onClick={handleAddSymbol}
                disabled={isAddingSymbol || !newSymbol.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
              >
                {isAddingSymbol ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Symbol
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-lg mb-8 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-slate-300"
                />
              </div>
              <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-3 md:grid-cols-6 h-12">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="broad_market">Market</TabsTrigger>
                  <TabsTrigger value="sector">Sector</TabsTrigger>
                  <TabsTrigger value="international">International</TabsTrigger>
                  <TabsTrigger value="bond">Bonds</TabsTrigger>
                  <TabsTrigger value="commodity">Commodity</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {isLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </>
          ) : (
          <AnimatePresence>
            {filteredFunds.map((fund, index) => {
              const isPositive = fund.day_change_percent !== null && fund.day_change_percent !== undefined && fund.day_change_percent >= 0;
              const indexData = getIndexData(fund.symbol);
              const indexName = getIndexName(fund.symbol);

              return (
                <motion.div
                  key={fund.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-2 border-slate-200 hover:shadow-xl transition-all duration-300 bg-white group h-full flex flex-col">
                    {indexData && indexName && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-amber-900 mb-0.5 md:mb-1 truncate">{indexName}</p>
                            <p className="text-[9px] md:text-xs text-amber-700">(Index Level - Reference)</p>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-lg md:text-2xl font-bold text-slate-900 break-words">
                              {indexData.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            {indexData.day_change !== null && indexData.day_change !== undefined && (
                              <div className={`flex items-center gap-1 justify-start sm:justify-end ${indexData.day_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {indexData.day_change >= 0 ? <TrendingUp className="w-3 h-3 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 flex-shrink-0" />}
                                <span className="text-xs md:text-sm font-semibold break-words">
                                  {indexData.day_change >= 0 ? '+' : ''}{indexData.day_change.toFixed(2)}
                                </span>
                                <span className="text-xs md:text-sm font-semibold break-words">
                                  ({indexData.day_change_percent >= 0 ? '+' : ''}{indexData.day_change_percent?.toFixed(2)}%)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-3 px-4 md:px-6 pt-4 md:pt-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg md:text-xl text-slate-900 truncate">{fund.symbol}</h3>
                            <Badge variant="outline" className={`${getTypeColor(fund.type)} border text-[10px] md:text-xs mt-1`}>
                              {fund.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-1.5 self-start">
                          {fund.long_term_trend && (
                            <Badge variant="outline" className={`${getTrendColor(fund.long_term_trend)} border flex items-center gap-1 text-[10px] md:text-xs px-2 py-1`}>
                              {getTrendIcon(fund.long_term_trend)}
                              <span className="hidden sm:inline">Long: {fund.long_term_trend}</span>
                              <span className="sm:hidden">LT</span>
                            </Badge>
                          )}
                          {fund.short_term_mood && (
                            <Badge variant="outline" className={`${getMoodColor(fund.short_term_mood)} border flex items-center gap-1 text-[10px] md:text-xs px-2 py-1`}>
                              {getMoodIcon(fund.short_term_mood)}
                              <span className="hidden sm:inline">Short: {fund.short_term_mood}</span>
                              <span className="sm:hidden">ST</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="text-xs md:text-sm font-medium text-slate-600 break-words">{fund.name}</h4>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 flex-1 px-4 md:px-6 pb-4 md:pb-6">
                      {fund.current_price !== undefined ? (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                            <p className="text-2xl md:text-3xl font-bold text-slate-900 break-words">
                              ${(fund.current_price || 0).toFixed(2)}
                            </p>
                            {fund.day_change !== null && fund.day_change !== undefined && (
                              <div className={`flex items-center gap-1 flex-wrap ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />}
                                <span className="text-xs md:text-sm font-semibold break-words">
                                  {isPositive ? '+' : ''}{fund.day_change.toFixed(2)}
                                </span>
                                <span className="text-xs md:text-sm font-semibold break-words">
                                  ({isPositive ? '+' : ''}{(fund.day_change_percent || 0).toFixed(2)}%)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 md:pt-3 border-t border-slate-100">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-700 mb-2">Historical Returns</p>
                            <div className="grid grid-cols-2 gap-2">
                              {fund.ytd_return !== null && fund.ytd_return !== undefined && (
                                <div className="bg-slate-50 rounded p-1.5 md:p-2">
                                  <p className="text-[10px] md:text-xs text-slate-500">YTD</p>
                                  <p className={`text-xs md:text-sm font-bold break-words ${fund.ytd_return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fund.ytd_return >= 0 ? '+' : ''}{fund.ytd_return.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                              {fund.return_1y !== null && fund.return_1y !== undefined && (
                                <div className="bg-slate-50 rounded p-2">
                                  <p className="text-xs text-slate-500">1 Year</p>
                                  <p className={`text-sm font-bold ${fund.return_1y >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fund.return_1y >= 0 ? '+' : ''}{fund.return_1y.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                              {fund.return_3y_annualized !== null && fund.return_3y_annualized !== undefined && (
                                <div className="bg-slate-50 rounded p-2">
                                  <p className="text-xs text-slate-500">3Y Annual</p>
                                  <p className={`text-sm font-bold ${fund.return_3y_annualized >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fund.return_3y_annualized >= 0 ? '+' : ''}{fund.return_3y_annualized.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                              {fund.return_5y_total !== null && fund.return_5y_total !== undefined && (
                                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                                  <p className="text-xs text-blue-700 font-semibold">5Y Total</p>
                                  <p className={`text-sm font-bold ${fund.return_5y_total >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {fund.return_5y_total >= 0 ? '+' : ''}{fund.return_5y_total.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                              {fund.return_10y_annualized !== null && fund.return_10y_annualized !== undefined && (
                                <div className="bg-slate-50 rounded p-2">
                                  <p className="text-xs text-slate-500">10Y Annual</p>
                                  <p className={`text-sm font-bold ${fund.return_10y_annualized >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fund.return_10y_annualized >= 0 ? '+' : ''}{fund.return_10y_annualized.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                              {fund.total_return_inception !== null && fund.total_return_inception !== undefined && (
                                <div className="bg-slate-50 rounded p-2">
                                  <p className="text-xs text-slate-500">Since Inception</p>
                                  <p className={`text-sm font-bold ${fund.total_return_inception >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fund.total_return_inception >= 0 ? '+' : ''}{fund.total_return_inception.toFixed(0)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-700 mb-2">52-Week Range</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Low</p>
                                <p className="font-semibold text-slate-900">
                                  {fund.fifty_two_week_low ? `$${fund.fifty_two_week_low.toFixed(2)}` : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">High</p>
                                <p className="font-semibold text-slate-900">
                                  {fund.fifty_two_week_high ? `$${fund.fifty_two_week_high.toFixed(2)}` : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {fund.volume && (
                            <div className="pt-3 border-t border-slate-100">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Volume</span>
                                <span className="font-semibold text-slate-900">{fund.volume ? `${(fund.volume / 1000000).toFixed(1)}M` : 'N/A'}</span>
                              </div>
                            </div>
                          )}

                          {fund.expense_ratio !== undefined && fund.expense_ratio !== null && (
                            <div className="pt-3 border-t border-slate-100">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Expense Ratio</span>
                                <span className="font-semibold text-slate-900">{fund.expense_ratio}%</span>
                              </div>
                            </div>
                          )}

                          {fund.insight && (
                            <div className="pt-3 border-t border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                              <p className="text-xs text-slate-800 leading-relaxed">
                                <Zap className="w-3 h-3 inline mr-1 text-blue-600" />
                                {fund.insight}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-600">{fund.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3 mt-auto">
                        <p className="text-xs font-semibold text-slate-700 mb-2">About This Fund</p>
                        <div className="space-y-1.5">
                          {fund.type === 'broad_market' && (
                            <p className="text-xs text-slate-600">• Diversified exposure across the entire market</p>
                          )}
                          {fund.type === 'sector' && (
                            <p className="text-xs text-slate-600">• Focused on specific industry sectors</p>
                          )}
                          {fund.type === 'international' && (
                            <p className="text-xs text-slate-600">• Global diversification outside domestic markets</p>
                          )}
                          {fund.type === 'bond' && (
                            <p className="text-xs text-slate-600">• Fixed income for stability and regular income</p>
                          )}
                          {fund.type === 'commodity' && (
                            <p className="text-xs text-slate-600">• Exposure to physical goods and resources</p>
                          )}
                          <p className="text-xs text-slate-600">• Passively managed for lower costs</p>
                          <p className="text-xs text-slate-600">• Traded like stocks with high liquidity</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          )}
        </div>

        {filteredFunds.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No index funds found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
