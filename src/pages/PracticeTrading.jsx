import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, TrendingUp, AlertCircle, X, ShoppingCart, Loader2, Activity, History } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false);
  // COLLAPSIBLE STATE
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // --- Brutal Logic AI Prompt ---
  const generateExecutionScenarios = async () => {
    if (!portfolio) return;
    setIsGeneratingScenarios(true);
    try {
      const prompt = `[PRO_MODE] Act as a Senior Portfolio Manager. 
      CURRENT BOOK: ${JSON.stringify(portfolio.holdings)}
      CASH AVAILABLE: ${portfolio.cash || 0}
  
      TASK:
      1. Identify the top 2 concentration risks (overweight assets).
      2. Suggest 3 tactical trades to neutralize risk or fill sector gaps.
      3. For each trade, provide a 10-word "Thesis".
  
      RETURN ONLY VALID JSON:
      {"scenarios": [
        {"symbol": "TICKER", "quantity": 10, "side": "buy", "price": 0.00, "thesis": "Rationale here"}
      ]}`;
  
      const aiResponse = await awsApi.invokeLLM(prompt);
      const raw = aiResponse?.response || aiResponse?.analysis || "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
  
      setRecommendedAllocations(parsed.scenarios || []);
    } catch (error) {
      console.error("Scenario Generation Failed:", error);
    }
    setIsGeneratingScenarios(false);
  };

  const handleExecuteTrade = async (tradeData) => {
    try {
      const response = await awsApi.executePaperTrade(tradeData);

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
        {/* HEADER SECTION */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Execution Lab</h1>
              <Badge className="bg-emerald-600 text-[9px] tracking-widest px-2 py-0.5">PRACTICE MODE</Badge>
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Simulated Institutional Order Flow</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsTradeModalOpen(true)} className="bg-[#4353FF] hover:bg-[#3544CC] text-white font-bold h-10 shadow-lg px-6">
              <Plus className="w-4 h-4 mr-2" /> NEW ORDER
            </Button>
            <Button onClick={handleSyncPortfolio} disabled={isSyncing} variant="outline" className="border-slate-200 bg-white font-bold h-10 text-slate-700">
              {isSyncing ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              SYNC
            </Button>
          </div>
        </header>

        {/* TOP: PERFORMANCE RIBBON (Real Values) */}
        {portfolio && (
          <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-4 px-8 mb-8 shadow-2xl overflow-x-auto gap-12 border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Net Value</span>
              <span className="text-lg font-black tracking-tight text-white">
                ${portfolio.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total P/L</span>
              <span className={`text-lg font-black tracking-tight ${portfolio.totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {portfolio.totalGain >= 0 ? '+' : ''}${portfolio.totalGain?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">24H Delta</span>
              <span className="text-lg font-black text-emerald-400">+$97.03 <span className="text-xs opacity-60">(0.03%)</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Holdings</span>
              <span className="text-lg font-black text-white">{portfolio.holdings?.length} Assets</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 mb-8 items-start">
          {/* LEFT: COLLAPSIBLE TACTICAL SIDEBAR */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-4'}`}>
            <Card className="border-0 shadow-2xl bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800">
              <CardHeader className="bg-slate-800/50 border-b border-slate-700 py-4 px-5 flex flex-row items-center justify-between">
                {!isSidebarCollapsed && (
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-blue-400">
                    <TrendingUp className="w-4 h-4" /> Tactical Scenarios
                  </CardTitle>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-400 hover:text-white p-0 h-6 w-6" 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  {isSidebarCollapsed ? <Plus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </Button>
              </CardHeader>
              
              {!isSidebarCollapsed && (
                <CardContent className="p-4 bg-slate-900 min-h-[400px]">
                  {recommendedAllocations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendedAllocations.map((allocation, index) => (
                        <div key={index} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-black text-white text-base leading-none">{allocation.symbol}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Est. ${allocation.price?.toFixed(2)}/sh</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-blue-300 italic mb-4 leading-relaxed font-medium line-clamp-2">
                            "{allocation.thesis || "Neutralize concentration risk."}"
                          </p>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              value={allocation.quantity} 
                              onChange={(e) => updateAllocationQuantity(index, e.target.value)} 
                              className="h-8 bg-slate-950 border-slate-700 text-white text-xs font-bold" 
                            />
                            <Button size="sm" onClick={() => executeSingleAllocation(allocation, index)} className="h-8 bg-blue-600 hover:bg-blue-500 px-4 flex-1 font-bold text-[10px]">
                              EXECUTE
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button onClick={executeAllAllocations} className="w-full bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase py-6 mt-4">
                         Execute Batch Sequence
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <AlertCircle className="w-12 h-12 text-slate-800 mb-4" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Queue Empty</p>
                      <Button onClick={generateExecutionScenarios} className="bg-slate-800 border border-slate-700 text-blue-400 font-black text-[10px] uppercase tracking-widest px-8 py-5">
                        Compute AI Trades
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* RIGHT: ANALYSIS WORKSPACE (Charts stacked) */}
          <div className={`space-y-8 transition-all duration-300 ${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-8'}`}>
            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 px-6 py-4 bg-slate-50/30">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-600" /> Portfolio Performance & Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {portfolio ? (
                  <div className="flex flex-col gap-12">
                     {/* Your PortfolioChart handles both Asset Allocation and Performance internally */}
                    <PortfolioChart portfolio={portfolio} trades={trades} />
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-300 font-black text-[10px] tracking-widest uppercase">
                    Awaiting Telemetry...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <Card className="border-slate-200 shadow-2xl rounded-2xl overflow-hidden mb-12">
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
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Side</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Total</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {trades.map((trade, idx) => {
                     const executedPrice = getTradeField(trade, 'executedPrice', 'executed_price');
                     return (
                       <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase font-mono">{formatTradeDate(trade.timestamp)}</td>
                         <td className="px-6 py-4 font-black text-slate-900 tracking-tight">{trade.symbol}</td>
                         <td className="px-6 py-4">
                            <Badge className={trade.side === 'buy' ? 'bg-emerald-100 text-emerald-900 font-bold border-0' : 'bg-rose-100 text-rose-900 font-bold border-0'}>
                                {trade.side.toUpperCase()}
                            </Badge>
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">{trade.quantity}</td>
                         <td className="px-6 py-4 text-right font-black text-slate-900">${(executedPrice * trade.quantity).toLocaleString()}</td>
                         <td className="px-6 py-4 text-center">
                            <Badge className={`${getStatusBadge(trade.status)} text-[9px] uppercase font-black`}>{trade.status}</Badge>
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
