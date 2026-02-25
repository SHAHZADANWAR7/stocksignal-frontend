import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, TrendingUp, AlertCircle, Clock, X, ShoppingCart, DollarSign, Loader2, Target } from "lucide-react";
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

          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-slate-700">
                  <strong>Practice Mode:</strong> All trades are simulated using live market data. 
                  No real money or securities are involved. Perfect for learning and testing strategies.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* INDUSTRIAL GRID: AI SUGGESTIONS & CHART SIDE-BY-SIDE */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8 items-start">
          
          {/* LEFT COLUMN: AI SUGGESTIONS */}
          <div className="space-y-6">
            {recommendedAllocations.length > 0 ? (
              <Card className="border-2 border-blue-500 shadow-xl bg-white h-full">
                <CardHeader className="bg-slate-900 text-white p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest font-black">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Tactical Suggestions
                    </CardTitle>
                    <Badge className="bg-blue-600">{recommendedAllocations.length} Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-h-[500px] overflow-y-auto">
                  <div className="space-y-3">
                    {recommendedAllocations.map((allocation, index) => (
                      <div key={index} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900">{allocation.symbol}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">${allocation.price.toFixed(2)}/share</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={allocation.quantity}
                            onChange={(e) => updateAllocationQuantity(index, e.target.value)}
                            className="w-20 h-8 text-xs font-bold border-slate-300"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => executeSingleAllocation(allocation, index)}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 px-2"
                          >
                            <ShoppingCart className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeAllocation(index)}
                            className="h-8 text-slate-400 hover:text-rose-600 px-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* COMPACT BATCH FOOTER */}
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase">Total: ${recommendedAllocations.reduce((sum, a) => sum + (a.quantity * a.price), 0).toLocaleString()}</span>
                    <Button 
                      size="sm" 
                      onClick={executeAllAllocations}
                      className="bg-blue-600 text-[10px] font-black uppercase tracking-tighter h-8"
                    >
                      Execute Batch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 h-[300px] flex flex-col items-center justify-center text-center p-6">
                <Target className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active AI Suggestions</p>
                <p className="text-[10px] text-slate-400 mt-1">Run a Portfolio Health check to generate scenarios.</p>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: PORTFOLIO CHART */}
          <div className="h-full">
            {trades.length > 0 && portfolio ? (
              <PortfolioChart portfolio={portfolio} trades={trades} />
            ) : (
              <Card className="h-[300px] flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Trade Data for Charting</p>
              </Card>
            )}
          </div>
        </div>

        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Trade History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTrades ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-slate-500">Loading trades...</p>
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No trades yet</h3>
                <p className="text-slate-500 mb-6">Execute your first practice trade to get started</p>
                <Button
                  onClick={() => setIsTradeModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Place First Trade
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Symbol</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Side</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Price</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const executedPrice = getTradeField(trade, 'executedPrice', 'executed_price');
                      return (
                        <tr key={trade.id || trade.timestamp} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatTradeDate(trade.timestamp)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{trade.symbol}</td>
                          <td className="py-3 px-4">
                            <Badge className={trade.side === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                              {trade.side.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">{trade.quantity}</td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            ${executedPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            ${(executedPrice * trade.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`${getStatusBadge(trade.status)} border`}>
                              {trade.status}
                            </Badge>
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
