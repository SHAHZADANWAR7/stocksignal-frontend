import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, TrendingUp, AlertCircle, Clock, X, ShoppingCart, DollarSign, Loader2, Activity, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { format } from "date-fns";
import TradeModal from "@/components/trading/TradeModal";
import PortfolioChart from "@/components/trading/PortfolioChart";

export default function PracticeTrading() {
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [recommendedAllocations, setRecommendedAllocations] = useState([]);
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);

  useEffect(() => {
    loadData();
    
    const storedAllocations = sessionStorage.getItem('recommendedAllocations');
    if (storedAllocations) {
      const allocations = JSON.parse(storedAllocations);
      setRecommendedAllocations(allocations);
      sessionStorage.removeItem('recommendedAllocations');
    }
  }, []);

  const loadData = async () => {
    await Promise.all([loadPortfolio(), loadTrades()]);
  };

  const loadPortfolio = async () => {
    try {
      const response = await awsApi.getUserPortfolio();
      
      if (response && response.portfolio) {
        setPortfolio(response.portfolio);
        if (response.portfolio.lastUpdated) {
          setLastSync(new Date(response.portfolio.lastUpdated));
        }
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
    }
  };

  const loadTrades = async () => {
    setIsLoadingTrades(true);
    try {
      const response = await awsApi.getUserTrades();
      const tradesArray = response?.trades?.trades || response?.trades || [];
      setTrades(Array.isArray(tradesArray) ? tradesArray : []);
    } catch (error) {
      console.error("Error loading trades:", error);
      setTrades([]);
    }
    setIsLoadingTrades(false);
  };

  const handleExecuteTrade = async (tradeData) => {
    try {
      console.log('🔵 Calling executePaperTrade with:', tradeData);
      const response = await awsApi.executePaperTrade(tradeData);

      console.log('📦 Trade response:', response);

      if (response.success) {
        await loadData();
        alert(response.message);
      } else {
        alert(response.error || response.message || 'Trade was rejected');
      }
    } catch (error) {
      console.error('❌ Trade error:', error);
      alert('Error executing trade: ' + (error.message || 'Unknown error'));
    }
  };

  const updateAllocationQuantity = (index, newQuantity) => {
    const updated = [...recommendedAllocations];
    updated[index].quantity = parseFloat(newQuantity) || 0;
    setRecommendedAllocations(updated);
  };

  const removeAllocation = (index) => {
    setRecommendedAllocations(prev => prev.filter((_, i) => i !== index));
  };

  const executeAllAllocations = async () => {
    if (recommendedAllocations.length === 0) return;

    const validAllocations = recommendedAllocations.filter(a => a.quantity > 0);
    if (validAllocations.length === 0) {
      alert("No valid trades to execute");
      return;
    }

    const confirmed = confirm(
      `Execute ${validAllocations.length} trades?\n\n` +
      validAllocations.map(t => `${t.symbol}: ${t.quantity} shares @ $${t.price.toFixed(2)}`).join('\n')
    );

    if (!confirmed) return;

    setIsExecutingBatch(true);
    let successCount = 0;
    let failCount = 0;

    for (const allocation of validAllocations) {
      try {
        const response = await awsApi.executePaperTrade({
          symbol: allocation.symbol,
          quantity: allocation.quantity,
          side: 'buy',
          orderType: 'market'
        });

        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('❌ Batch trade error:', error);
        failCount++;
      }
    }

    await loadData();
    setIsExecutingBatch(false);
    setRecommendedAllocations([]);

    alert(`Batch execution complete!\n✓ ${successCount} successful\n${failCount > 0 ? `✗ ${failCount} failed` : ''}`);
  };

  const executeSingleAllocation = async (allocation, index) => {
    if (allocation.quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    try {
      const response = await awsApi.executePaperTrade({
        symbol: allocation.symbol,
        quantity: allocation.quantity,
        side: 'buy',
        orderType: 'market'
      });

      if (response.success) {
        alert(response.message);
        await loadData();
        removeAllocation(index);
      } else {
        alert(response.error || response.message || 'Trade was rejected');
      }
    } catch (error) {
      console.error('❌ Trade error:', error);
      alert('Error executing trade: ' + error.message);
    }
  };

  const handleSyncPortfolio = async () => {
    setIsSyncing(true);
    try {
      const response = await awsApi.syncPortfolio({});

      console.log('📦 Sync response:', response);

      if (response.success) {
        setPortfolio(prev => ({
          ...prev,
          ...response.portfolio
        }));
        setLastSync(new Date());
      } else {
        alert(response.error || 'Sync failed');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      alert('Error syncing portfolio: ' + error.message);
    }
    setIsSyncing(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      filled: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      rejected: "bg-rose-100 text-rose-700 border-rose-200"
    };
    return styles[status] || styles.pending;
  };

  const formatTradeDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM d, h:mm a');
  };

  // Helper function to get trade field value (supports both camelCase and snake_case)
  const getTradeField = (trade, camelCase, snakeCase) => {
    return trade[camelCase] ?? trade[snakeCase] ?? 0;
  };

  // --- Replace the entire return block below with the requested new layout ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto">
        
        {/* INDUSTRIAL HEADER */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                Execution Lab
              </h1>
              <Badge className="bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-none border-none">
                ACTIVE MODE
              </Badge>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Professional Practice Terminal · Live Feed
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleSyncPortfolio} disabled={isSyncing} variant="outline" className="border-2 border-slate-300 bg-white font-black text-[11px] h-12 px-6 hover:border-slate-900 transition-all">
              {isSyncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              REFRESH TELEMETRY
            </Button>
            <Button onClick={() => setIsTradeModalOpen(true)} className="bg-[#4353FF] hover:bg-[#3544CC] text-white font-black text-[11px] px-8 h-12 shadow-xl active:scale-95 transition-all">
              <Plus className="w-5 h-5 mr-2" /> EXECUTE NEW ORDER
            </Button>
          </div>
        </header>

        {/* 4 BEAUTIFUL INDUSTRIAL METRIC CARDS */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 border-2 border-slate-200 shadow-lg bg-white relative overflow-hidden group hover:border-slate-400 transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 font-mono">Total Portfolio Value</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">${portfolio.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <div className="absolute top-0 right-0 p-2 opacity-5"><DollarSign className="w-8 h-8" /></div>
            </Card>

            <Card className="p-6 border-2 border-emerald-200 shadow-lg bg-white group hover:border-emerald-400 transition-all">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-2 font-mono">Total Gain/Loss</span>
              <div className="flex flex-col">
                <span className={`text-xl font-black ${portfolio.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {portfolio.totalGain >= 0 ? '+' : ''}${portfolio.totalGain?.toLocaleString()}
                </span>
                <span className={`text-xs font-bold ${portfolio.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  +1.78%
                </span>
              </div>
            </Card>

            <Card className="p-6 border-2 border-blue-200 shadow-lg bg-white group hover:border-blue-400 transition-all">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-2 font-mono">Daily Gain/Loss</span>
              <span className="text-xl font-black text-emerald-600">+$117.72</span>
              <span className="text-[10px] font-bold text-emerald-500 block">+0.04%</span>
            </Card>

            <Card className="p-6 border-2 border-indigo-200 shadow-lg bg-white group hover:border-indigo-400 transition-all">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2 font-mono">Assets Count</span>
              <span className="text-xl font-black text-slate-900 block">9 Assets</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-tight">Cost Basis: $331,495</span>
            </Card>
          </div>
        )}

        <div className="space-y-8 mb-12">
          {/* CHART WORKSPACE */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white ring-1 ring-slate-200">
            <CardContent className="p-8">
              {portfolio ? (
                <div className="w-full">
                  <PortfolioChart portfolio={portfolio} trades={trades} stacked={true} />
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center font-black text-slate-300 uppercase tracking-widest text-xs">Awaiting Handshake...</div>
              )}
            </CardContent>
          </Card>

          {/* POSITION DETAILS - DARK HEADER STYLE */}
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden ring-1 ring-slate-200">
            <CardHeader className="bg-slate-900 border-b border-slate-800 py-4 px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Position Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identifier</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Units</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Avg Cost</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Market Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portfolio?.holdings?.map((asset, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-black text-slate-900 text-sm tracking-tight">{asset.symbol}</td>
                        <td className="px-8 py-5 text-right font-mono text-[11px] font-bold text-slate-600">{asset.quantity}</td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                          ${(asset.averageCost || asset.average_cost || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                          ${((asset.currentPrice || asset.price || 0) * asset.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ORDER FULFILLMENT LEDGER - DARK HEADER STYLE */}
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden ring-1 ring-slate-200">
            <CardHeader className="bg-slate-900 border-b border-slate-800 py-4 px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" /> Order Fulfillment Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Side</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Net Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {trades.map((trade, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-500 font-mono tracking-tighter uppercase">{formatTradeDate(trade.timestamp)}</td>
                        <td className="px-8 py-5 font-black text-slate-900 text-sm tracking-tight">{trade.symbol}</td>
                        <td className="px-8 py-5">
                          <Badge className={`text-[9px] font-black px-2 py-0 border-0 ${trade.side === 'buy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {trade.side.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-[11px] font-bold text-slate-600">{trade.quantity}</td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                          ${(getTradeField(trade, 'executedPrice', 'executed_price') * trade.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <TradeModal isOpen={isTradeModalOpen} onClose={() => setIsTradeModalOpen(false)} onExecuteTrade={handleExecuteTrade} />
    </div>
  );
}
