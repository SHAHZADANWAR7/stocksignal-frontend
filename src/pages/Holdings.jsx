import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Lightbulb, TrendingDown, TrendingUp, Search, RefreshCw, Loader2, Building2 } from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";

// === Markdown rendering import added below ===
import ReactMarkdown from 'react-markdown';

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
      setFilteredHoldings(holdings.filter(h => h.symbol && h.symbol.toLowerCase().includes(query)));
    }
  }, [searchQuery, holdings]);

  const dynamoItemToJS = (item) => {
    if (item && item.M) {
      const out = {};
      for (const [k, v] of Object.entries(item.M)) {
        if (v.S !== undefined) out[k] = v.S;
        else if (v.N !== undefined) out[k] = parseFloat(v.N);
        else if (v.BOOL !== undefined) out[k] = v.BOOL;
        else out[k] = v;
      }
      return out;
    }
    return item;
  };

  const loadHoldings = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await awsApi.syncPortfolio({ userId });
      if (response && response.portfolio && response.portfolio.assets) {
        const cleanAssets = response.portfolio.assets.map(dynamoItemToJS);
        setPortfolio(response.portfolio);
        setHoldings(cleanAssets);
        setFilteredHoldings(cleanAssets);
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
      const result = await awsApi.invokeLLM(prompt);
      console.log("LLM Response:", result);
      if (typeof result === "string") {
        setExplanation(result);
      } else if (
        typeof result === "object" &&
        result !== null
      ) {
        let text = "";
        if (result.response && typeof result.response === "string") {
          text = result.response;
        } else if (result.content && typeof result.content === "string") {
          text = result.content;
        } else if (result.message && typeof result.message === "string") {
          text = result.message;
        } else {
          text = "[Unable to parse portfolio explanation]\n" + JSON.stringify(result, null, 2);
        }
        setExplanation(text);
      } else {
        setExplanation("Unable to interpret explanation response from AI.");
      }
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
          {/* Always show the Explain button, even if holdings are empty */}
          <Card className="border-2 border-purple-200 shadow-sm p-4 bg-gradient-to-br from-purple-50 to-pink-50">
            <Button
              onClick={explainPortfolio}
              disabled={isExplaining || holdings.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isExplaining ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Explaining...</>
              ) : (
                <><Lightbulb className="w-4 h-4 mr-2" />Explain My Portfolio Like I'm 10</>
              )}
            </Button>
          </Card>
        </div>
        {showExplanation && explanation && (
          <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 mb-6">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />Your Portfolio Explained
              </h3>
              <div className="bg-white rounded-lg p-4">
                {/* === Markdown rendering fix applied here === */}
                <ReactMarkdown className="text-slate-700 leading-relaxed">
                  {typeof explanation === "string"
                    ? explanation
                    : (explanation && typeof explanation === "object" && explanation.response
                      ? explanation.response
                      : "[Unable to display explanation]")
                  }
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
        {/* INDUSTRIAL ASSET DATABASE */}
        <Card className="border-2 border-slate-200 shadow-xl bg-white overflow-hidden rounded-none">
          <div className="bg-slate-900 py-3 px-6 flex items-center justify-between border-b border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Active Holdings: Asset Inventory
            </h3>
            <Badge variant="outline" className="rounded-none border-blue-500/50 text-blue-400 font-mono text-[10px] bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              {filteredHoldings.length} Assets Logged
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-6 text-left border-r border-slate-200 text-slate-500">Symbol</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Qty</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Avg Cost</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Market Price</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Total Value</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-6 text-center text-slate-500">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500 opacity-20" />
                    </td>
                  </tr>
                ) : (
                  filteredHoldings.map((asset, index) => {
                    const { currentValue, gainLoss, gainLossPercent } = calculateMetrics(asset);
                    const isPositive = gainLoss >= 0;
                    return (
                      <tr key={index} className="hover:bg-blue-50/40 transition-colors font-mono text-[11px]">
                        <td className="py-4 px-6 font-bold text-slate-900 border-r border-slate-100 uppercase tracking-tighter">
                          {asset.symbol}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100">
                          {asset.quantity}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100 font-medium">
                          ${asset.avgCost.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100 font-medium">
                          ${asset.currentPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-slate-900 border-r border-slate-100">
                          ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className={`inline-block px-3 py-1.5 text-[10px] font-black rounded-none border-l-4 ${
                            isPositive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500' 
                            : 'bg-rose-50 text-rose-700 border-rose-500'
                          }`}>
                            <div className="flex flex-col items-center leading-none gap-1">
                              <span>{isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%</span>
                              <span className="text-[8px] opacity-60 font-mono">
                                {isPositive ? '+' : '-'}${Math.abs(gainLoss).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {filteredHoldings.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-slate-50/50">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300 opacity-30" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 mb-2">No Active Positions</h3>
              <p className="text-[11px] font-mono text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed uppercase uppercase tracking-widest">Initiate acquisitions in the Paper Trading module to populate database.</p>
              <Link to={createPageUrl("PracticeTrading")}>
                <Button className="bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-[0.2em] px-8 h-10 hover:bg-black border-b-2 border-blue-600 shadow-lg">
                  Initialize Trade
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
