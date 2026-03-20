import React, { useState, useEffect } from "react";
import { callAwsFunction } from "@/components/utils/api/awsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Building2, TrendingUp, Filter, Plus, Loader2, Sparkles, ArrowRight, Target, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CardSkeleton from "@/components/ui/CardSkeleton";
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
  const hasAutoAnalyzed = React.useRef(false);

  // Transform Lambda response from snake_case to camelCase
  const transformStockData = (data) => {
    return {
      symbol: data.symbol,
      name: data.name,
      price: data.current_price,
      marketCap: data.market_cap,
      peRatio: data.pe_ratio,
      weekChange52: data.week_change_52,
      dividendYield: data.dividend_yield,
      beta: data.beta,
      sector: data.sector,
      description: data.description,
      valuation: data.valuation,
      valuation_reasoning: data.valuation_reasoning,
      expected_return: data.expected_return,
      risk: data.risk,
      data_sources: data.data_sources,
      recommendations: data.recommendations
    };
  };

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

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const result = await callAwsFunction('getCompanies', {});
      const companiesData = result.items || [];
      setCompanies(companiesData);
      setFilteredCompanies(companiesData);
    } catch (error) {
      console.error("Error loading companies:", error);
      setCompanies([]);
      setFilteredCompanies([]);
    }
    setIsLoading(false);
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

  const toggleCompany = (symbol) => {
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
      setSelectedCompanies(prev => 
        prev.includes(symbol) ? prev : [...prev, symbol]
      );
      alert(`${symbol} is already in your selection!`);
      setSymbolSearchQuery("");
      return;
    }

    setIsSearchingSymbol(true);
    
    try {
      const batchResult = await callAwsFunction('getStockBatch', { symbols: [symbol] });
      
      if (!batchResult.stocks || batchResult.stocks.length === 0) {
        alert(`Could not find symbol "${symbol}". Please check the ticker and try again.`);
        setIsSearchingSymbol(false);
        return;
      }

      const stockData = batchResult.stocks[0];

      // Add new company to list
      const newCompany = {
        symbol: stockData.symbol,
        name: stockData.name || symbol,
        sector: stockData.sector || "Other",
        description: stockData.description || "Stock information not available"
      };

      setCompanies(prev => [...prev, newCompany]);
      setSelectedCompanies(prev => [...prev, symbol]);
      setSymbolSearchQuery("");
      alert(`✅ ${stockData.name} added to your selection!`);
    } catch (error) {
      console.error("Error searching for symbol:", error);
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
      
      // Call getStockAnalysis for comprehensive AI analysis
      const analysisData = await callAwsFunction('getStockAnalysis', { symbol });

      if (!analysisData || !analysisData.symbol) {
        alert(`Could not analyze symbol "${symbol}". Please try again.`);
        setIsAnalyzing(false);
        return;
      }

      const transformedData = transformStockData(analysisData);
      setAnalysisResult({
        stock: transformedData,
        recommendations: analysisData.recommendations || []
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-none border-b-4 border-indigo-600 shadow-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-tight">
                  Browse Investments
                </h1>
                <p className="font-bold uppercase text-[10px] tracking-[0.3em] text-slate-400">
                  Select stocks and index funds to get AI-powered investment recommendations
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card className="border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] mb-8 bg-white rounded-none">
          <CardContent className="p-10 min-h-[180px] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-slate-900 rounded-none border-b-4 border-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Quick Stock Analysis</h2>
                <p className="font-bold uppercase text-[10px] tracking-[0.3em] text-slate-400">Get AI-powered analysis and discover better alternatives</p>
              </div>
            </div>
            
            <div className="flex gap-3 mb-2">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, MSFT)..."
                value={quickAnalysisSymbol}
                onChange={(e) => setQuickAnalysisSymbol(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
                className="flex-1 h-14 text-lg border-slate-900 border-2 rounded-none bg-slate-50"
                disabled={isAnalyzing}
              />
              <Button
                onClick={analyzeStock}
                disabled={isAnalyzing || !quickAnalysisSymbol.trim()}
                className="rounded-none bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-[10px] tracking-widest border-b-4 border-indigo-900 h-14 px-8"
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
                <div className="bg-slate-50 border-2 border-slate-900 rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {analysisResult.stock.logoUrl && (
                        <img src={analysisResult.stock.logoUrl} alt={`${analysisResult.stock.name} logo`} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{analysisResult.stock.symbol}</h3>
                        <p className="font-black uppercase text-[8px] text-slate-400">{analysisResult.stock.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {analysisResult.stock.valuation && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">Valuation</p>
                        <p className={`text-xl font-bold ${analysisResult.stock.valuation === 'overvalued' ? 'text-red-500' : analysisResult.stock.valuation === 'undervalued' ? 'text-green-500' : 'text-blue-600'}`}>
                          {analysisResult.stock.valuation.charAt(0).toUpperCase() + analysisResult.stock.valuation.slice(1)}
                        </p>
                      </div>
                    )}
                    
                    {analysisResult.stock.price != null && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">Price</p>
                        <p className="text-xl font-bold text-slate-900">
                          ${analysisResult.stock.price.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {analysisResult.stock.marketCap && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">Market Cap</p>
                        <p className="text-xl font-bold text-slate-900">
                          {analysisResult.stock.marketCap}
                        </p>
                      </div>
                    )}

                    {(analysisResult.stock.peRatioFormatted || analysisResult.stock.peRatio != null) && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">P/E Ratio</p>
                        <p className="text-xl font-bold text-blue-600">
                          {analysisResult.stock.peRatioFormatted || analysisResult.stock.peRatio.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {analysisResult.stock.beta != null && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">Beta</p>
                        <p className="text-xl font-bold text-slate-900">
                          {analysisResult.stock.beta.toFixed(2)}
                        </p>
                        {analysisResult.stock.betaConfidence && (
                          <span className="text-xs text-slate-500">{analysisResult.stock.betaConfidence} confidence</span>
                        )}
                      </div>
                    )}

                    {analysisResult.stock.expectedReturn != null && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">Expected Return</p>
                        <p className="text-xl font-bold text-blue-600">
                          {analysisResult.stock.expectedReturn.toFixed(1)}%
                        </p>
                      </div>
                    )}

                    {analysisResult.stock.risk != null && (
                      <div>
                        <p className="font-black uppercase text-[8px] text-slate-400">Risk</p>
                        <p className="text-xl font-bold text-orange-600">
                          {analysisResult.stock.risk.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {analysisResult.stock.valuationReasoning && (
                    <div className="bg-slate-900 text-white p-6 rounded-none border-l-4 border-indigo-500 mb-4">
                      <p className="font-bold uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-2">AI Analysis</p>
                      <p className="text-sm text-white leading-relaxed">
                        {analysisResult.stock.valuationReasoning}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => addStockFromAnalysis(analysisResult.stock.symbol)}
                    className="w-full rounded-none bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-[10px] tracking-widest border-b-4 border-indigo-900"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Selection
                  </Button>
                </div>

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">AI Recommended Alternatives</h3>
                    {analysisResult.recommendations.map((rec) => (
                      <Card key={rec.symbol} className="bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <p className="text-lg font-bold text-slate-900">{rec.symbol}</p>
                              <p className="font-black uppercase text-[8px] text-slate-400">{rec.name}</p>
                              {rec.beta != null && (
                                <p className="text-xs text-slate-500">Beta: {rec.beta.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-slate-700 mb-3" dangerouslySetInnerHTML={{ __html: rec.explanation }} />
                          <Button
                            onClick={() => addStockFromAnalysis(rec.symbol)}
                            variant="outline"
                            className="w-full rounded-none bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-[10px] tracking-widest border-b-4 border-indigo-900 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Selection
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-slate-900 border-x border-b border-t-4 border-t-indigo-600 p-8 shadow-2xl rounded-none mb-8">
          <Card className="border-0 bg-transparent mb-4 rounded-none shadow-none">
            <CardContent className="p-0 py-0 flex flex-col justify-center min-h-[0]">
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search any publicly traded company by its ticker symbol"
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchAndAddSymbol()}
                    className="h-12 text-base font-mono rounded-none border-2 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 uppercase text-xs"
                    disabled={isSearchingSymbol}
                  />
                </div>
                <Button
                  onClick={searchAndAddSymbol}
                  disabled={isSearchingSymbol || !symbolSearchQuery.trim()}
                  className="rounded-none bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-[10px] tracking-widest border-b-4 border-indigo-900 h-12 px-6"
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
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mt-2">
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
                className="pl-12 h-12 font-mono uppercase text-xs rounded-none border-2 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-40 h-12 rounded-none font-black uppercase text-[10px] tracking-widest border-b-2 border-slate-700 bg-slate-800 text-white">
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
                <Card className="relative bg-slate-900 border-4 border-white shadow-[0px_0px_30px_rgba(0,0,0,0.5)] rounded-none p-4 overflow-visible">
                  <CardContent className="relative p-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-none border-b-4 border-indigo-600 shadow-lg flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">
                              {selectedCompanies.length} Selected
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCompanies([])}
                              className="text-slate-400 hover:text-slate-200 bg-transparent border-0 h-7 px-3 rounded-none font-black uppercase text-[10px] tracking-widest"
                            >
                              Clear all
                            </Button>
                          </div>
                          <p className="font-black uppercase text-[8px] text-slate-400">
                            Ready for AI-powered risk analysis
                          </p>
                        </div>
                      </div>
                      <Link to={createPageUrl("Analysis") + `?companies=${selectedCompanies.join(',')}`} className="w-full sm:w-auto flex-shrink-0">
                        <Button className="group relative w-full h-14 text-base md:text-lg rounded-none bg-indigo-600 font-black uppercase tracking-widest text-white shadow-xl">
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
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <AnimatePresence>
              {filteredCompanies.map((company) => {
                const isSelected = selectedCompanies.includes(company.symbol);

                // Description truncation + Beta / Market Cap normalization
                const rawDescription = company.description || "";
                const truncatedDescription = rawDescription.length > 150 ? rawDescription.substring(0, 150) + "..." : rawDescription || "No description available";

                const betaNum = Number(company.beta);
                const betaDisplay = Number.isFinite(betaNum) ? betaNum.toFixed(2) : "Not Available";

                const marketCapRaw = company.market_cap;
                const marketCapIsValid =
                  typeof marketCapRaw === "number" ||
                  (typeof marketCapRaw === "string" && /^[\d,\.]+\s*[BMK]?$/i.test(marketCapRaw.trim()));
                const marketCapDisplay = marketCapIsValid ? marketCapRaw : "Not Available";

                return (
                  <motion.div
                    key={company.symbol}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className={`group transition-all duration-300 border-2 rounded-none h-full cursor-pointer shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${
                        isSelected 
                          ? 'border-indigo-600 shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] bg-white'
                          : 'border-slate-900 bg-white'
                      }`}
                      onClick={() => toggleCompany(company.symbol)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {company.logo_url && (
                              <img src={company.logo_url} alt={`${company.name} logo`} className="w-10 h-10 rounded-none border-2 border-slate-900" />
                            )}
                            <div>
                              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tighter">{company.symbol}</h3>
                              <Badge 
                                variant="secondary"
                                className="rounded-none border border-slate-900 font-black uppercase text-[9px] py-1 px-2"
                              >
                                {company.sector}
                              </Badge>
                            </div>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCompany(company.symbol)}
                            className="w-5 h-5 rounded-none border-2 border-slate-900 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                        </div>
                        
                        <h4 className="font-black text-slate-900 mb-2 uppercase tracking-tighter">{company.name}</h4>
                        <p className="text-sm text-slate-600 mb-3">{truncatedDescription}</p>
                        <div className="flex justify-between items-center font-black uppercase text-[8px] text-slate-400 mt-2">
                          <span>Beta: {betaDisplay}</span>
                          <span>Market Cap: {marketCapDisplay}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
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
