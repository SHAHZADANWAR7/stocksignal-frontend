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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* INSTITUTIONAL HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Execution Lab</h1>
              <Badge className="bg-emerald-600 text-[10px] tracking-widest px-3 py-1">PRACTICE MODE</Badge>
            </div>
            <p className="text-slate-500 font-medium italic">Risk-free institutional-grade order execution simulator.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsTradeModalOpen(true)} className="bg-[#4353FF] hover:bg-[#3544CC] text-white font-bold px-6 shadow-lg h-12">
              <Plus className="w-5 h-5 mr-2" /> NEW ORDER
            </Button>
            <Button onClick={handleSyncPortfolio} disabled={isSyncing} variant="outline" className="border-slate-200 bg-white font-bold h-12 text-slate-700">
              {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              SYNC PRICES
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 mb-8">
          {/* LEFT: TACTICAL EXECUTION SIDEBAR (4 Cols) */}
          <div className="lg:col-span-4 h-full">
            <Card className="border-0 shadow-2xl flex flex-col h-full bg-slate-900 text-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-800/50 border-b border-slate-700 py-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-blue-400">
                    <TrendingUp className="w-4 h-4" /> Tactical Scenarios
                  </CardTitle>
                  {recommendedAllocations.length > 0 && (
                    <Badge className="bg-blue-600 text-white border-0 text-[10px]">{recommendedAllocations.length}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow overflow-y-auto max-h-[500px]">
                {recommendedAllocations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendedAllocations.map((allocation, index) => (
                      <div key={index} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center justify-between group hover:border-blue-500 transition-colors">
                        <div className="min-w-0">
                          <p className="font-black text-white text-sm">{allocation.symbol}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${allocation.price?.toFixed(2)}/sh</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={allocation.quantity} 
                            onChange={(e) => updateAllocationQuantity(index, e.target.value)} 
                            className="w-16 h-8 text-[11px] font-bold bg-slate-900 border-slate-700 text-white" 
                          />
                          <Button size="sm" onClick={() => executeSingleAllocation(allocation, index)} className="h-8 bg-blue-600 hover:bg-blue-500 px-2 shadow-lg">
                            <ShoppingCart className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <AlertCircle className="w-10 h-10 text-slate-700 mb-4" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Execution Queue Empty</p>
                    <p className="text-[11px] text-slate-400 mb-6 px-4">AI suggests trades based on your portfolio gaps. No scenarios currently active.</p>
                  </div>
                )}
              </CardContent>
              {recommendedAllocations.length > 0 && (
                <div className="p-4 bg-slate-800 border-t border-slate-700 mt-auto">
                   <Button onClick={executeAllAllocations} className="w-full bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase py-6">
                      Execute Batch Sequence
                   </Button>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT: PERFORMANCE & SUMMARY (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* INDUSTRIAL PERFORMANCE RIBBON */}
            {portfolio && (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2 px-6 shadow-sm overflow-x-auto gap-8">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Value</span>
                  <span className="text-sm font-black text-slate-900">${portfolio.totalValue?.toLocaleString()}</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total P/L</span>
                  <span className={`text-sm font-black ${portfolio.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {portfolio.totalGain >= 0 ? '+' : ''}${portfolio.totalGain?.toLocaleString()}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">24H Change</span>
                  <span className="text-sm font-black text-emerald-500">+$97.03 (0.03%)</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Positions</span>
                  <span className="text-sm font-black text-slate-900">{portfolio.holdings?.length} Assets</span>
                </div>
              </div>
            )}

            {/* LIVE TELEMETRY CENTER */}
            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white flex-grow">
              <CardHeader className="border-b border-slate-50 px-6 py-3 flex flex-row items-center justify-between bg-slate-50/30">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-600" /> Execution Telemetry
                </CardTitle>
                {lastSync && <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200">LAST SYNC: {format(lastSync, 'HH:mm:ss')}</Badge>}
              </CardHeader>
              <CardContent className="p-4 md:p-8">
                {portfolio ? (
                  <div className="w-full">
                    <PortfolioChart portfolio={portfolio} trades={trades} />
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-300 uppercase font-black text-[10px] tracking-widest">
                    Awaiting System Handshake...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <Card className="border-slate-200 shadow-2xl overflow-hidden mb-12">
          <CardHeader className="bg-slate-900 border-b border-slate-800">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" /> Order Fulfillment Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Side</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cost Basis</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {trades.map((trade, idx) => {
                      const executedPrice = getTradeField(trade, 'executedPrice', 'executed_price');
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{formatTradeDate(trade.timestamp)}</td>
                          <td className="px-6 py-4 font-black text-slate-900">{trade.symbol}</td>
                          <td className="px-6 py-4">
                             <Badge className={trade.side === 'buy' ? 'bg-emerald-100 text-emerald-900 font-bold border-0 shadow-none' : 'bg-rose-100 text-rose-900 font-bold border-0 shadow-none'}>
                                {trade.side.toUpperCase()}
                             </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">{trade.quantity}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">${(executedPrice * trade.quantity).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                             <Badge className={`${getStatusBadge(trade.status)} text-[10px] uppercase font-black`}>{trade.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>

      <TradeModal isOpen={isTradeModalOpen} onClose={() => setIsTradeModalOpen(false)} onExecuteTrade={handleExecuteTrade} />
    </div>
  );
}
