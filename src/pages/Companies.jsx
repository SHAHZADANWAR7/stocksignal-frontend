import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { callAwsFunction } from "@/components/utils/api/awsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Search, Building2, TrendingUp, Filter, Plus, Loader2, Sparkles, ArrowRight, Target, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingSymbol, setIsSearchingSymbol] = useState(false);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [quickAnalysisSymbol, setQuickAnalysisSymbol] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasAutoAnalyzed = React.useRef(false);

  useEffect(() => {
    loadCompanies();
    
    const urlParams = new URLSearchParams(window.location.search);
    const symbolToAnalyze = urlParams.get('analyze');
    if (symbolToAnalyze && !hasAutoAnalyzed.current) {
      hasAutoAnalyzed.current = true;
      setQuickAnalysisSymbol(symbolToAnalyze.toUpperCase());
      setTimeout(() => {
        const btn = document.querySelector('[data-analyze-btn]');
        if (btn) btn.click();
      }, 1500);
    }
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, sectorFilter, companies]);

  const loadCompanies = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const userId = localStorage.getItem('user_id');
      const companiesData = await awsApi.getCompanies(userId);
      setCompanies(companiesData || []);
      setFilteredCompanies(companiesData || []);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.symbol.toLowerCase().includes(query) ||
        c.sector.toLowerCase().includes(query)
      );
    }

    if (sectorFilter !== "all") {
      filtered = filtered.filter(c => c.sector === sectorFilter);
    }

    setFilteredCompanies(filtered);
  };

  const toggleCompany = (symbol, company) => {
    setSelectedCompanies(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const searchAndAddSymbol = async () => {
    if (!symbolSearchQuery.trim()) return;
    
    const symbol = symbolSearchQuery.toUpperCase().trim();
    const existing = companies.find(c => c.symbol.toUpperCase() === symbol);
    if (existing) {
      alert(`${symbol} is already in the list!`);
      setSymbolSearchQuery("");
      return;
    }

    setIsSearchingSymbol(true);
    
    try {
      const stockData = await callAwsFunction('getStockAnalysis', { symbol });

      if (stockData.error) {
        alert(`Could not find symbol "${symbol}" on Yahoo Finance`);
        setIsSearchingSymbol(false);
        return;
      }

      const isETF = stockData.name.includes('ETF') || stockData.name.includes('Fund') || 
                    ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO'].includes(symbol);

      if (isETF) {
        const fundType = stockData.sector.toLowerCase().includes('bond') ? 'bond' :
                        stockData.sector.toLowerCase().includes('international') ? 'international' :
                        stockData.sector.toLowerCase().includes('sector') ? 'sector' : 'broad_market';
        await awsApi.createIndexFund({ symbol, name: stockData.name, type: fundType, description: stockData.description });
      } else {
        await awsApi.createCompany({
          symbol, name: stockData.name, sector: stockData.sector, description: stockData.description,
          current_price: stockData.current_price, market_cap: stockData.market_cap, pe_ratio: stockData.pe_ratio,
          beta: stockData.beta, valuation: stockData.valuation, valuation_reasoning: stockData.valuation_reasoning,
          expected_return: stockData.expected_return, risk: stockData.risk, last_analyzed_date: stockData.last_analyzed_date
        });
      }
      
      setSymbolSearchQuery("");
      loadCompanies();
      alert(`✅ ${stockData.name} added with Yahoo Finance data!`);
    } catch (error) {
      alert("Error searching for symbol. Please try again.");
    }
    
    setIsSearchingSymbol(false);
  };

  const analyzeStock = async () => {
    if (!quickAnalysisSymbol.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const symbol = quickAnalysisSymbol.toUpperCase().trim();
      
      console.log('Calling AWS Lambda for analysis:', symbol);
      const stockData = await callAwsFunction('getStockAnalysis', { symbol });

      if (stockData.error) {
        alert(`Could not find symbol "${symbol}": ${stockData.error}`);
        setIsAnalyzing(false);
        return;
      }

      const prompt = `Based on ${symbol} (${stockData.name}) analysis:
- Sector: ${stockData.sector}
- Current Price: $${stockData.current_price}
- Valuation: ${stockData.valuation}
- Expected Return: ${stockData.expected_return}%
- Risk: ${stockData.risk}%

Recommend 4 alternative stocks that are either:
1. Similar quality in same sector
2. Better value/performance
3. Lower risk with comparable returns

For each recommendation, explain WHY it's recommended.`;

      const recommendations = await awsApi.getStockRecommendations(prompt);

      console.log('📊 Setting analysis result with stockData:', stockData);
      setAnalysisResult({
        stock: stockData,
        recommendations: recommendations.recommendations
      });
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing stock. Please try again.");
    }
    
    setIsAnalyzing(false);
  };

  const addStockFromAnalysis = async (symbol) => {
    const existing = companies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    if (existing) {
      setSelectedCompanies(prev => 
        prev.includes(existing.symbol) ? prev : [...prev, existing.symbol]
      );
      alert(`${symbol} added to your selection!`);
      return;
    }

    setSymbolSearchQuery(symbol);
    await searchAndAddSymbol();
  };

  const sectors = [...new Set(companies.map(c => c.sector))];

  const sectorColors = {
    "Technology": "bg-blue-100 text-blue-700 border-blue-200",
    "Healthcare": "bg-green-100 text-green-700 border-green-200",
    "Finance": "bg-purple-100 text-purple-700 border-purple-200",
    "Consumer": "bg-orange-100 text-orange-700 border-orange-200",
    "Energy": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Industrial": "bg-gray-100 text-gray-700 border-gray-200",
    "Automotive": "bg-red-100 text-red-700 border-red-200",
    "Entertainment": "bg-pink-100 text-pink-700 border-pink-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 leading-tight">
                  Browse Investments
                </h1>
                <p className="text-sm md:text-base lg:text-lg text-slate-600 leading-relaxed">
                  Select stocks and index funds to get AI-powered investment recommendations
                </p>
              </div>
            </div>
            <Button
              onClick={() => loadCompanies(true)}
              disabled={isRefreshing}
              className="w-full md:w-auto md:self-end bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-base font-semibold shadow-md"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing Data...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <Card className="border-2 border-emerald-300 shadow-lg mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Quick Stock Analysis</h2>
                <p className="text-sm text-slate-600">Get AI-powered analysis and discover better alternatives</p>
              </div>
            </div>
            
            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, MSFT)..."
                value={quickAnalysisSymbol}
                onChange={(e) => setQuickAnalysisSymbol(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
                className="flex-1 h-14 text-lg border-emerald-300 focus:border-emerald-500"
                disabled={isAnalyzing}
              />
              <Button
                onClick={analyzeStock}
                disabled={isAnalyzing || !quickAnalysisSymbol.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-14 px-8 text-base"
                data-analyze-btn
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {analysisResult && (
               <div className="space-y-6">
                 {analysisResult.stock && console.log('🎯 Rendering analysis result:', analysisResult.stock)}
                 <div className="bg-white rounded-xl p-6 border-2 border-emerald-200">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <h3 className="text-2xl font-bold text-slate-900">{analysisResult.stock.symbol}</h3>
                       <p className="text-slate-600">{analysisResult.stock.name}</p>
                    </div>
                    <Badge className={`text-base px-4 py-2 ${
                      analysisResult.stock.valuation === 'undervalued' ? 'bg-emerald-100 text-emerald-700' :
                      analysisResult.stock.valuation === 'overvalued' ? 'bg-rose-100 text-rose-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {analysisResult.stock.valuation}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-500">Price</p>
                      <p className="text-xl font-bold text-slate-900">
                        {analysisResult.stock.current_price != null ? `$${analysisResult.stock.current_price.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Market Cap</p>
                      <p className="text-base font-bold text-slate-900">
                        {analysisResult.stock.market_cap ? `$${analysisResult.stock.market_cap}` : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {analysisResult.stock.market_cap_category || 'unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Beta</p>
                      <p className="text-xl font-bold text-blue-600">
                        {analysisResult.stock.beta != null ? analysisResult.stock.beta.toFixed(2) : 'N/A'}
                      </p>
                      {analysisResult.stock.beta_confidence && (
                        <p className="text-xs text-slate-500 capitalize">
                          {analysisResult.stock.beta_confidence} confidence
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Expected Return</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {analysisResult.stock.expected_return != null ? `${analysisResult.stock.expected_return.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Risk</p>
                      <p className="text-xl font-bold text-rose-600">
                        {analysisResult.stock.risk != null ? `${analysisResult.stock.risk.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-slate-700 mb-4 space-y-2">
                    {(analysisResult.stock.valuation_reasoning || '').split('\n').map((line, idx) => {
                      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                      if (linkMatch) {
                        const beforeLink = line.substring(0, linkMatch.index);
                        const linkText = linkMatch[1];
                        const linkUrl = linkMatch[2];
                        const afterLink = line.substring(linkMatch.index + linkMatch[0].length);

                        return (
                          <p key={idx}>
                            {beforeLink}
                            <a 
                              href__={linkUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              {linkText}
                            </a>
                            {afterLink}
                          </p>
                        );
                      }
                      return line ? <p key={idx}>{line}</p> : null;
                    })}
                  </div>

                  <Button
                    onClick={() => addStockFromAnalysis(analysisResult.stock.symbol)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Selection
                  </Button>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    AI Recommended Alternatives
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <div key={idx}>
                        <Card className="border-2 border-slate-200 hover:border-emerald-300 transition-colors rounded-xl h-full">
                         <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-lg text-slate-900">{rec.symbol}</h4>
                                <p className="text-sm text-slate-600">{rec.name}</p>
                              </div>
                              <Badge className={`text-xs ${
                                rec.advantage === 'better_value' ? 'bg-emerald-100 text-emerald-700' :
                                rec.advantage === 'lower_risk' ? 'bg-blue-100 text-blue-700' :
                                rec.advantage === 'higher_growth' ? 'bg-purple-100 text-purple-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {rec.advantage.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-700 mb-4">{rec.reason}</p>
                            
                            <Button
                              onClick={() => addStockFromAnalysis(rec.symbol)}
                              variant="outline"
                              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              size="sm"
                            >
                              <Plus className="w-3 h-3 mr-2" />
                              Add to Selection
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6 mb-8">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-4 rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter any NASDAQ/NYSE symbol (e.g., AAPL, GOOGL, SOUN)..."
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchAndAddSymbol()}
                    className="h-12 text-base border-blue-300 focus:border-blue-500"
                    disabled={isSearchingSymbol}
                  />
                </div>
                <Button
                  onClick={searchAndAddSymbol}
                  disabled={isSearchingSymbol || !symbolSearchQuery.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-6"
                >
                  {isSearchingSymbol ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Symbol
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Search any publicly traded company by its ticker symbol - we'll fetch the data automatically
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search companies by name, symbol, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-slate-300 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-40 h-12">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {selectedCompanies.length > 0 && (
          <div className="fixed bottom-8 left-0 right-0 z-40 pointer-events-none">
            <div className="max-w-7xl mx-auto md:ml-[272px] lg:ml-[288px] md:mr-8 px-4 md:px-0 pointer-events-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-40"></div>
                <Card className="relative border-2 border-white/50 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-2xl rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
                  <CardContent className="relative p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur opacity-50"></div>
                          <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-lg md:text-xl font-bold text-slate-900">
                              {selectedCompanies.length} Selected
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCompanies([])}
                              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 text-xs md:text-sm h-7 px-3 rounded-lg font-medium"
                            >
                              Clear all
                            </Button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-600 font-medium">
                            Ready for AI-powered risk analysis
                          </p>
                        </div>
                      </div>
                      <Link to={createPageUrl("Analysis") + `?companies=${selectedCompanies.join(',')}`} className="w-full sm:w-auto flex-shrink-0">
                        <Button className="group relative w-full h-13 md:h-14 text-base md:text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/60 font-bold px-8 md:px-10 rounded-xl transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                          <TrendingUp className="relative w-5 h-5 md:w-6 md:h-6 mr-3 flex-shrink-0" />
                          <span className="relative whitespace-nowrap">Compare Risk Outcomes</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </>
          ) : (
          <AnimatePresence>
            {filteredCompanies.map((company, index) => {
              const isSelected = selectedCompanies.includes(company.symbol);
              return (
                <div key={company.id}>
                  <Card 
                    className={`group transition-all duration-300 border-2 rounded-xl h-full ${
                      isSelected 
                        ? 'cursor-pointer border-blue-500 shadow-lg shadow-blue-500/20 bg-gradient-to-br from-blue-50 to-indigo-50' 
                        : 'cursor-pointer hover:shadow-lg border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                    onClick={() => toggleCompany(company.symbol, company)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-slate-700" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{company.symbol}</h3>
                            <Badge 
                              variant="secondary"
                              className={`${sectorColors[company.sector] || 'bg-gray-100 text-gray-700'} border text-xs`}
                            >
                              {company.sector}
                            </Badge>
                          </div>
                        </div>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCompany(company.symbol, company)}
                          className="w-5 h-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </div>
                      
                      <h4 className="font-semibold text-slate-900 mb-2">{company.name}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {company.description}
                      </p>
                      
                      {company.beta !== null && company.beta !== undefined && (
                       <div className="pt-3 border-t border-slate-100">
                         <div>
                           <p className="text-xs text-slate-500">5Y Beta</p>
                           <p className="text-sm font-semibold text-blue-600">
                             {company.beta.toFixed(3)}
                           </p>
                           {company.beta_confidence && (
                             <Badge className={`text-xs mt-1 ${
                               company.beta_confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                               company.beta_confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                               'bg-rose-100 text-rose-700'
                             }`}>
                               {company.beta_confidence}
                             </Badge>
                           )}
                         </div>
                       </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </AnimatePresence>
          )}
        </div>

        {filteredCompanies.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No companies found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
