import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Clock,
  X,
  ShoppingCart,
  DollarSign,
  Loader2,
} from "lucide-react";
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

    const storedAllocations = sessionStorage.getItem("recommendedAllocations");
    if (storedAllocations) {
      const allocations = JSON.parse(storedAllocations);
      setRecommendedAllocations(allocations);
      sessionStorage.removeItem("recommendedAllocations");
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
      const tradesArray =
        response?.trades?.trades || response?.trades || [];
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
        alert(response.error || response.message || "Trade was rejected");
      }
    } catch (error) {
      console.error("❌ Trade error:", error);
      alert("Error executing trade: " + (error.message || "Unknown error"));
    }
  };

  const updateAllocationQuantity = (index, newQuantity) => {
    const updated = [...recommendedAllocations];
    updated[index].quantity = parseFloat(newQuantity) || 0;
    setRecommendedAllocations(updated);
  };

  const removeAllocation = (index) => {
    setRecommendedAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const executeAllAllocations = async () => {
    if (recommendedAllocations.length === 0) return;

    const validAllocations = recommendedAllocations.filter(
      (a) => a.quantity > 0
    );
    if (validAllocations.length === 0) {
      alert("No valid trades to execute");
      return;
    }

    const confirmed = confirm(
      `Execute ${validAllocations.length} trades?\n\n` +
        validAllocations
          .map(
            (t) =>
              `${t.symbol}: ${t.quantity} shares @ $${t.price.toFixed(2)}`
          )
          .join("\n")
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
          side: "buy",
          orderType: "market",
        });

        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error("❌ Batch trade error:", error);
        failCount++;
      }
    }

    await loadData();
    setIsExecutingBatch(false);
    setRecommendedAllocations([]);

    alert(
      `Batch execution complete!\n✓ ${successCount} successful\n${
        failCount > 0 ? `✗ ${failCount} failed` : ""
      }`
    );
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
        side: "buy",
        orderType: "market",
      });

      if (response.success) {
        alert(response.message);
        await loadData();
        removeAllocation(index);
      } else {
        alert(
          response.error || response.message || "Trade was rejected"
        );
      }
    } catch (error) {
      console.error("❌ Trade error:", error);
      alert("Error executing trade: " + error.message);
    }
  };

  const handleSyncPortfolio = async () => {
    setIsSyncing(true);
    try {
      const response = await awsApi.syncPortfolio({});

      if (response.success) {
        setPortfolio((prev) => ({
          ...prev,
          ...response.portfolio,
        }));
        setLastSync(new Date());
      } else {
        alert(response.error || "Sync failed");
      }
    } catch (error) {
      console.error("❌ Sync error:", error);
      alert("Error syncing portfolio: " + error.message);
    }
    setIsSyncing(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      filled: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      rejected: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return styles[status] || styles.pending;
  };

  const formatTradeDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "MMM d, h:mm a");
  };

  // get field value (supports both camelCase and snake_case)
  const getTradeField = (trade, camelCase, snakeCase) => {
    return trade[camelCase] ?? trade[snakeCase] ?? 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 md:mb-3">
                Practice Trading Terminal
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-slate-600">
                Simulate trading in real-time with industrial-grade portfolio UX
              </p>
            </div>
            <Badge className="bg-emerald-600 text-white text-sm px-4 py-2 shadow-md rounded">
              🎓 PRACTICE MODE
            </Badge>
          </div>

          {/* Simulation Info Callout */}
          <Card className="border-2 border-emerald-200 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardContent className="p-5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-slate-700">
                <strong>Simulation Only:</strong> All practice trades use live market prices, but are risk-free. Use this environment to sharpen your skills with real data and instant results!
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <Button
            onClick={() => setIsTradeModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-base md:text-base"
          >
            <Plus className="w-4 h-4 mr-2" />
            Place Trade
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
                Sync Prices
              </>
            )}
          </Button>
          {lastSync && (
            <div className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
              <Clock className="w-4 h-4" />
              Last synced: {format(lastSync, "MMM d, h:mm a")}
            </div>
          )}
        </div>

        {/* AI Scenario Allocations Card */}
        {recommendedAllocations.length > 0 && (
          <Card className="border-2 border-blue-500 shadow-xl bg-white/90 mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <TrendingUp className="w-6 h-6" />
                    Suggested Allocations
                  </CardTitle>
                  <p className="text-white/90 text-xs md:text-sm mt-2 font-normal opacity-80">
                    Explore these simulated allocation scenarios as recommended by market AI models.
                  </p>
                </div>
                <Badge className="bg-white text-blue-700 text-xs md:text-sm px-3 py-2 whitespace-nowrap shadow border">
                  {recommendedAllocations.filter((a) => a.quantity > 0).length} scenarios
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recommendedAllocations.map((allocation, index) => (
                  <Card
                    key={index}
                    className="border-2 border-slate-200 bg-slate-50 shadow-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-bold text-lg text-slate-900">
                              {allocation.symbol}
                            </h4>
                            <Badge className="bg-blue-100 text-blue-700 text-xs md:text-sm">
                              ${allocation.price.toFixed(2)}/share
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                            <div>
                              <Label className="text-xs md:text-sm text-slate-600">
                                Quantity (shares)
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={allocation.quantity}
                                onChange={(e) =>
                                  updateAllocationQuantity(index, e.target.value)
                                }
                                className="mt-1 h-9 md:h-10 text-sm md:text-base"
                              />
                            </div>
                            <div>
                              <Label className="text-xs md:text-sm text-slate-600">
                                Estimated Cost
                              </Label>
                              <div className="mt-1 h-9 md:h-10 px-2 md:px-3 border border-slate-300 rounded-md bg-slate-100 flex items-center overflow-hidden">
                                <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-slate-500 mr-0.5 md:mr-1 flex-shrink-0" />
                                <span className="font-semibold text-slate-900 text-sm md:text-base truncate">
                                  {(
                                    allocation.quantity * allocation.price
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-auto">
                          <Button
                            onClick={() =>
                              executeSingleAllocation(allocation, index)
                            }
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs md:text-sm"
                            size="sm"
                          >
                            <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Run Trade
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
                  Total Cost: $
                  {recommendedAllocations
                    .reduce((sum, a) => sum + a.quantity * a.price, 0)
                    .toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
                    disabled={
                      isExecutingBatch ||
                      recommendedAllocations.filter((a) => a.quantity > 0)
                        .length === 0
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-xs md:text-sm"
                  >
                    {isExecutingBatch ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Run All Trades
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Chart */}
        {trades.length > 0 && portfolio && (
          <div className="mb-8">
            <PortfolioChart portfolio={portfolio} trades={trades} />
          </div>
        )}

        {/* Trade History Table */}
        <Card className="border-2 border-slate-200 shadow-lg bg-white/95">
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
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No trades yet
                </h3>
                <p className="text-slate-500 mb-6">
                  Execute your first practice trade to get started
                </p>
                <Button
                  onClick={() => setIsTradeModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Place Trade
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Symbol
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Side
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const executedPrice = getTradeField(
                        trade,
                        "executedPrice",
                        "executed_price"
                      );
                      return (
                        <tr
                          key={trade.id || trade.timestamp}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatTradeDate(trade.timestamp)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {trade.symbol}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                trade.side === "buy"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }
                            >
                              {trade.side?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {trade.quantity}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            ${executedPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            $
                            {(executedPrice * trade.quantity).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              className={`${getStatusBadge(trade.status)} border`}
                            >
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

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onExecuteTrade={handleExecuteTrade}
      />
    </div>
  );
}
