import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, TrendingUp, AlertCircle, Clock, X, ShoppingCart, DollarSign, Loader2 } from "lucide-react";
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
      // Identity Bridge: Explicitly pass the ID from the session
      const response = await awsApi.getUserPortfolio({
        userId: localStorage.getItem('user_id')
      });
      
      const rawPF = response?.portfolio || response?.data?.portfolio || { holdings: {} };
      
      // UNIVERSAL FIX: Convert 'assets' (new user format) to 'holdings' (UI format)
      const holdings = rawPF.holdings || {};
      if (rawPF.assets && Array.isArray(rawPF.assets)) {
        rawPF.assets.forEach(a => { 
          if (a.symbol) holdings[a.symbol] = a; 
        });
      }

      setPortfolio({ ...rawPF, holdings });
      
      if (rawPF.lastUpdated || rawPF.updated_at) {
        setLastSync(new Date(rawPF.lastUpdated || rawPF.updated_at));
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
      setPortfolio({ holdings: {} });
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
      const response = await awsApi.syncPortfolio({
        userId: localStorage.getItem('user_id')
      });

      console.log('📦 Sync response:', response);

      if (response.success) {
        const rawPF = response.portfolio || response.data?.portfolio || response.data;
        
        // NORMALIZATION: Map assets to holdings so the Chart and Table "wake up"
        const holdings = rawPF?.holdings || {};
        if (rawPF?.assets && Array.isArray(rawPF.assets)) {
          rawPF.assets.forEach(a => { 
            if (a.symbol) holdings[a.symbol] = a; 
          });
        }

        setPortfolio(prev => ({
          ...(prev || {}),
          ...rawPF,
          holdings: Object.keys(holdings).length > 0 ? holdings : (prev?.holdings || {})
        }));
        
        setLastSync(new Date());
      } else {
        alert(response.error || 'Sync failed');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
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
                Practice Trading
              </h1>
              <p className="text-lg text-slate-600">
                Practice trading with live market prices - zero risk
              </p>
            </div>
            <Badge className="bg-emerald-600 text-white text-sm px-4 py-2">
              🎓 PRACTICE MODE
            </Badge>
          </div>

         {/* INDUSTRIAL PRACTICE MODE PROTOCOL */}
        <Card className="border-t-4 border-t-emerald-600 border-x border-b border-slate-200 shadow-2xl bg-white mb-8 overflow-hidden rounded-none">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* STATUS INDICATOR */}
              <div className="bg-slate-900 text-white p-6 md:w-64 flex flex-col justify-center items-center text-center space-y-3 border-r border-slate-800">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">Environment</h3>
                  <p className="text-lg font-mono font-bold text-white tracking-tighter uppercase">Simulated</p>
                </div>
              </div>

              {/* DATA LOG */}
              <div className="flex-1 p-6 flex items-center bg-slate-50/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">SYS-AUTH</span>
                    <div className="h-[1px] w-12 bg-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Clearance: Sandbox</p>
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900 uppercase tracking-tight">Active Protocol:</span> All executions are mirrored against live market feeds. Zero-capital exposure. No actual securities or currency will be transferred. Optimized for algorithmic strategy validation and tactical education.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            onClick={() => setIsTradeModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Initialize Execution
          </Button>
          <Button
            onClick={handleSyncPortfolio}
            disabled={isSyncing}
            variant="outline"
            className="border-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Synchronize Portfolio Assets
              </>
            )}
          </Button>
          {lastSync && (
            <div className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
              <Clock className="w-4 h-4" />
              Last synced: {format(lastSync, 'MMM d, h:mm a')}
            </div>
          )}
        </div>

        {recommendedAllocations.length > 0 && (
          <Card className="border-2 border-blue-500 shadow-xl bg-white mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <TrendingUp className="w-6 h-6" />
                    AI Scenario Suggestions
                  </CardTitle>
                  <p className="text-white/90 text-xs md:text-sm mt-2">
                    Explore these simulated allocation scenarios for learning purposes
                  </p>
                </div>
                <Badge className="bg-white text-blue-700 text-xs md:text-sm px-3 py-2 whitespace-nowrap">
                  ✨ {recommendedAllocations.filter(a => a.quantity > 0).length} to explore
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recommendedAllocations.map((allocation, index) => (
                  <Card key={index} className="border-2 border-slate-200 bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-bold text-lg text-slate-900">{allocation.symbol}</h4>
                            <Badge className="bg-blue-100 text-blue-700 text-xs md:text-sm">
                              ${allocation.price.toFixed(2)}/share
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                            <div>
                              <Label className="text-xs md:text-sm text-slate-600">Quantity (shares)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={allocation.quantity}
                                onChange={(e) => updateAllocationQuantity(index, e.target.value)}
                                className="mt-1 h-9 md:h-10 text-sm md:text-base"
                              />
                            </div>
                            <div>
                              <Label className="text-xs md:text-sm text-slate-600">Estimated Cost</Label>
                              <div className="mt-1 h-9 md:h-10 px-2 md:px-3 border border-slate-300 rounded-md bg-slate-100 flex items-center overflow-hidden">
                                <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-slate-500 mr-0.5 md:mr-1 flex-shrink-0" />
                                <span className="font-semibold text-slate-900 text-sm md:text-base truncate">
                                  {(allocation.quantity * allocation.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-auto">
                          <Button
                            onClick={() => executeSingleAllocation(allocation, index)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs md:text-sm"
                            size="sm"
                          >
                            <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Execute
                          </Button>
                          <Button
                            onClick={() => removeAllocation(index)}
                            variant="outline"
                            size="sm"
                            className="border-rose-300 text-rose-600 hover:bg-rose-50 text-xs md:text-sm"
                          >
                            <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mt-6 pt-6 border-t border-slate-200">
                <div className="text-base md:text-lg font-semibold text-slate-900 truncate">
                  Total Cost: ${recommendedAllocations.reduce((sum, a) => sum + (a.quantity * a.price), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => setRecommendedAllocations([])}
                    variant="outline"
                    className="border-2 text-xs md:text-sm"
                  >
                    Cancel All
                  </Button>
                  <Button
                    onClick={executeAllAllocations}
                    disabled={isExecutingBatch || recommendedAllocations.filter(a => a.quantity > 0).length === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-xs md:text-sm"
                  >
                    {isExecutingBatch ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Execute All Trades
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* ASSET DATABASE SECTION */}
        {!portfolio ? (
          <div className="bg-slate-900 border-x border-b border-t-4 border-t-blue-600 p-20 text-center shadow-2xl rounded-none mb-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin opacity-40" />
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Syncing Asset Database...</p>
          </div>
        ) : portfolio.holdings && Object.keys(portfolio.holdings).length > 0 ? (
          <div className="mb-8">
            <PortfolioChart portfolio={portfolio} trades={trades} />
          </div>
        ) : (
          <div className="bg-slate-900 border-x border-b border-t-4 border-t-blue-600 p-12 text-center shadow-2xl rounded-none relative overflow-hidden group mb-8">
            {/* AMBIENT TECH BACKGROUND */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all duration-700" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 border border-white/10 mx-auto mb-6 flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500">
                <ShoppingCart className="w-8 h-8 text-blue-400 -rotate-45 group-hover:-rotate-90 transition-transform duration-500" />
              </div>

              <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-white mb-3">
                Asset Database: Empty
              </h3>
              
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-[1px] w-8 bg-slate-700" />
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Awaiting Initial Acquisition
                </p>
                <div className="h-[1px] w-8 bg-slate-700" />
              </div>

              <p className="text-xs text-slate-400 mb-10 max-w-xs mx-auto leading-relaxed italic">
                System is operational. Market feeds connected. No simulated assets detected in current environment.
              </p>

              {/* FIXED VISIBILITY BUTTON: Changed to bg-indigo-600 for high contrast */}
              <Button
                onClick={() => setIsTradeModalOpen(true)}
                className="!bg-indigo-600 hover:!bg-indigo-500 !text-white font-black uppercase text-[10px] tracking-[0.2em] px-12 h-12 rounded-none border-b-4 border-indigo-900 shadow-2xl transition-all flex items-center justify-center mx-auto"
              >
                <Plus className="w-4 h-4 mr-2 !text-white" />
                Initialize First Acquisition
              </Button>
            </div>
            {/* STATUS BAR BOTTOM */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          </div>
        )}

        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Trade History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTrades ? (
              <div className="text-center py-20 bg-slate-50/30">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-slate-400 animate-spin opacity-40" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Accessing Archives...</p>
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 border-t border-slate-100">
                <div className="w-12 h-12 bg-slate-100 rounded-none mx-auto mb-4 flex items-center justify-center border border-slate-200">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 mb-2">No Historical Logs</h3>
                <p className="text-[11px] font-mono text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">System awaiting first data entry point. All executions will be archived here.</p>
                <Button
                  onClick={() => setIsTradeModalOpen(true)}
                  className="bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-[0.2em] px-8 h-10 hover:bg-black transition-all border-b-2 border-blue-600 shadow-lg"
                >
                  Place First Trade
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-800">
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-left border-r border-slate-800">Timestamp</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-left border-r border-slate-800">Asset</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-left border-r border-slate-800">Side</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-800">Units</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-800">Price</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-800">Total (USD)</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {trades.map((trade) => {
                      const executedPrice = getTradeField(trade, 'executedPrice', 'executed_price');
                      return (
                        <tr key={trade.id || trade.timestamp} className="hover:bg-blue-50/40 transition-colors font-mono text-[11px]">
                          <td className="py-4 px-4 text-slate-500 border-r border-slate-100 whitespace-nowrap">
                            {formatTradeDate(trade.timestamp)}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 border-r border-slate-100 uppercase tracking-tighter">{trade.symbol}</td>
                          <td className="py-4 px-4 border-r border-slate-100">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${trade.side === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100">{trade.quantity}</td>
                          <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100 font-medium">
                            ${executedPrice.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-slate-900 border-r border-slate-100">
                            ${(executedPrice * trade.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200 px-2 py-1 bg-slate-50">
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onExecuteTrade={handleExecuteTrade}
      />
    </div>
  );
}
