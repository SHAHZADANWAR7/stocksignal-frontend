import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Lightbulb, TrendingDown, TrendingUp, Search } from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton"; // Adjust path if TableSkeleton is not in ui/TableSkeleton

export default function Holdings() {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [filteredHoldings, setFilteredHoldings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadHoldings();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredHoldings(holdings);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredHoldings(holdings.filter(h => h.symbol.toLowerCase().includes(query)));
    }
  }, [searchQuery, holdings]);

  const loadHoldings = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await awsApi.syncPortfolio({ userId });
      if (response && response.assets) {
        setPortfolio(response);
        setHoldings(response.assets || []);
        setFilteredHoldings(response.assets || []);
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
    }
    setIsLoading(false);
  };

  const handleSyncPortfolio = async () => {
    setIsSyncing(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (!holdings || holdings.length === 0) {
        alert("No assets to sync");
        setIsSyncing(false);
        return;
      }
      const symbols = holdings.map(a => a.symbol);
      const batchData = await awsApi.getStockBatch(symbols);
      const updatedAssets = holdings.map(asset => {
        const stockData = batchData.stocks.find(s => s.symbol.toUpperCase() === asset.symbol.toUpperCase());
        return stockData ? { ...asset, currentPrice: stockData.current_price } : asset;
      });
      const newTotalValue = updatedAssets.reduce((sum, a) => sum + (a.quantity * (a.currentPrice || a.avgCost)), 0);
      await awsApi.syncPortfolio({ userId, assets: updatedAssets, totalValue: newTotalValue, lastUpdated: new Date().toISOString() });
      setPortfolio({ ...portfolio, assets: updatedAssets, totalValue: newTotalValue });
      setHoldings(updatedAssets);
      setFilteredHoldings(updatedAssets);
      alert("✅ Prices synced!");
    } catch (error) {
      alert('Error syncing: ' + error.message);
    }
    setIsSyncing(false);
  };

  const calculateMetrics = (asset) => {
    const currentValue = asset.quantity * asset.currentPrice;
    const costBasis = asset.quantity * asset.avgCost;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    return { currentValue, costBasis, gainLoss, gainLossPercent };
  };

  const explainPortfolio = async () => {
    setIsExplaining(true);
    setShowExplanation(true);
    const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const holdingsList = holdings.map(h => {
      const { gainLossPercent } = calculateMetrics(h);
      return { symbol: h.symbol, value: h.quantity * h.currentPrice, gain_loss_percent: gainLossPercent };
    });
    const prompt = `Explain this portfolio like I'm 10. Simple language, analogies. Portfolio: ${JSON.stringify(holdingsList)} Total: $${totalValue.toLocaleString()}. Why own these? What risks? Why better/worse? What know?`;
    try {
      // Updated to invoke the LLM endpoint with the prompt directly
      const result = await awsApi.invokeLLM(prompt);
      setExplanation(result);
    } catch (error) {
      console.error("Error explaining:", error);
      setExplanation("Unable to generate explanation.");
    }
    setIsExplaining(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 md:mb-2">My Portfolio</h1>
              <p className="text-sm md:text-base text-slate-500">View your paper trading positions</p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <Button onClick={handleSyncPortfolio} disabled={isSyncing} variant="outline" className="border-2 text-xs md:text-sm px-3 md:px-4" size="sm">
                {isSyncing ? <><RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" /><span className="hidden sm:inline">Syncing...</span></> : <><RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Sync Prices</span></>}
              </Button>
              <Link to={createPageUrl("PracticeTrading")}>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs md:text-sm px-3 md:px-4" size="sm">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Paper Trading</span>
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="border-slate-200 shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="Search by symbol or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 border-slate-300" />
            </div>
          </Card>
          {holdings.length > 0 && (
            <Card className="border-2 border-purple-200 shadow-sm p-4 bg-gradient-to-br from-purple-50 to-pink-50">
              <Button onClick={explainPortfolio} disabled={isExplaining} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {isExplaining ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Explaining...</> : <><Lightbulb className="w-4 h-4 mr-2" />Explain My Portfolio</>}
              </Button>
            </Card>
          )}
        </div>
        {showExplanation && explanation && (
          <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 mb-6">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />Your Portfolio Explained
              </h3>
              <div className="bg-white rounded-lg p-4">
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{explanation}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Symbol</TableHead>
                  <TableHead className="font-semibold text-right">Quantity</TableHead>
                  <TableHead className="font-semibold text-right">Avg Cost</TableHead>
                  <TableHead className="font-semibold text-right">Current Price</TableHead>
                  <TableHead className="font-semibold text-right">Total Value</TableHead>
                  <TableHead className="font-semibold text-right">Gain/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <TableSkeleton rows={5} columns={6} />
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {filteredHoldings.map((asset, index) => {
                      const { currentValue, gainLoss, gainLossPercent } = calculateMetrics(asset);
                      const isPositive = gainLoss >= 0;
                      return (
                        <motion.tr key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <TableCell className="font-semibold text-slate-900">{asset.symbol}</TableCell>
                          <TableCell className="text-right text-slate-900">{asset.quantity}</TableCell>
                          <TableCell className="text-right text-slate-900">${asset.avgCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-slate-900">${asset.currentPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
                              <div>
                                <p className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{isPositive ? '+' : ''}${Math.abs(gainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%</p>
                              </div>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredHoldings.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No positions yet</h3>
              <p className="text-slate-500 mb-6">{searchQuery ? "No holdings match" : "Start trading on Paper Trading"}</p>
              {!searchQuery && (
                <Link to={createPageUrl("PracticeTrading")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <TrendingUp className="w-4 h-4 mr-2" />Start Paper Trading
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
