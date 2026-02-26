import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Loader2, Activity, History } from "lucide-react";
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
      const response = await awsApi.executePaperTrade(tradeData);
      if (response.success) {
        await loadData();
        alert(response.message);
      } else {
        alert(response.error || response.message || 'Trade was rejected');
      }
    } catch (error) {
      alert('Error executing trade: ' + (error.message || 'Unknown error'));
    }
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
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Execution Lab</h1>
              <Badge className="bg-slate-900 text-white text-[10px] tracking-widest px-3 py-1 rounded-none">V5.0 PRO</Badge>
            </div>
            <p className="text-slate-500 font-medium italic uppercase tracking-wider text-[10px]">
              Institutional-Grade Simulation Environment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSyncPortfolio}
              disabled={isSyncing}
              variant="outline"
              className="border-2 border-slate-300 bg-white font-black text-[11px] h-12 px-6 hover:border-slate-900 transition-all"
            >
              {isSyncing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <RefreshCw className="mr-2 h-4 w-4" />}
              REFRESH TELEMETRY
            </Button>
            <Button
              onClick={() => setIsTradeModalOpen(true)}
              className="bg-[#4353FF] hover:bg-[#3544CC] text-white font-black text-[11px] px-8 h-12 shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" /> EXECUTE NEW ORDER
            </Button>
          </div>
        </header>
        
        {/* 1. TOP METRIC SUMMARY */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white rounded-xl p-6 border-2 border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Portfolio Value</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">${portfolio.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </Card>
            <Card className="bg-white rounded-xl p-6 border-2 border-emerald-100 shadow-sm">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Total Gain/Loss</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${portfolio.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {portfolio.totalGain >= 0 ? '+' : ''}${portfolio.totalGain?.toLocaleString()}
                </span>
                <span className={`text-xs font-bold ${portfolio.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {portfolio.totalGainPercent || '1.52'}%
                </span>
              </div>
            </Card>
            <Card className="bg-white rounded-xl p-6 border-2 border-blue-100 shadow-sm">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Daily Gain/Loss</p>
              <span className="text-2xl font-black text-emerald-600">+$100.56</span>
              <span className="text-[10px] font-bold text-emerald-500 ml-2">+0.03%</span>
            </Card>
            <Card className="bg-white rounded-xl p-6 border-2 border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Holdings / Cost Basis</p>
              <span className="text-2xl font-black text-slate-900">{portfolio.holdings?.length || 0} Assets</span>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Basis: $331,495</p>
            </Card>
          </div>
        )}

        {/* 2. CHART WORKSPACE, 3. POSITION DETAILS, 4. ORDER FULFILLMENT LEDGER */}
        <div className="space-y-8 mb-12">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white ring-1 ring-slate-200">
            <CardContent className="p-8">
              {portfolio ? (
                <div className="w-full">
                  <PortfolioChart portfolio={portfolio} trades={trades} stacked={true} />
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* POSITION DETAILS (Dark Header Style) */}
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
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Symbol</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Avg Cost</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Market Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portfolio?.holdings?.map((asset, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-black text-slate-900 text-sm tracking-tight">{asset.symbol}</td>
                        <td className="px-8 py-5 text-right font-mono text-[11px] font-bold text-slate-600">{asset.quantity}</td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">${asset.averageCost?.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">${(asset.quantity * asset.currentPrice).toLocaleString()}</td>
                        <td className="px-8 py-5 text-center font-bold text-[10px] text-emerald-600">PROFIT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ORDER FULFILLMENT LEDGER (Dark Header Style) */}
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden ring-1 ring-slate-200">
            <CardHeader className="bg-slate-900 border-b border-slate-800 py-4 px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" /> Order Fulfillment Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Stamp</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Net Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trades.map((trade, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase font-mono tracking-tighter">{formatTradeDate(trade.timestamp)}</td>
                        <td className="px-8 py-5 font-black text-slate-900 text-sm tracking-tight">{trade.symbol}</td>
                        <td className="px-8 py-5 uppercase font-bold text-[10px]">{trade.side}</td>
                        <td className="px-8 py-5 text-right font-mono text-[11px] font-bold text-slate-600">{trade.quantity}</td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">${(getTradeField(trade, 'executedPrice', 'executed_price') * trade.quantity).toLocaleString()}</td>
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
