import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, TrendingUp, TrendingDown } from "lucide-react";

export default function TradeModal({ isOpen, onClose, onExecuteTrade, initialSymbol = "", initialQuantity = "" }) {
  const [tradeData, setTradeData] = useState({
    symbol: initialSymbol,
    quantity: initialQuantity ? initialQuantity.toString() : "",
    side: "buy",
    orderType: "market",
    limitPrice: ""
  });
  const [userConsent, setUserConsent] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTradeData({
        symbol: initialSymbol,
        quantity: initialQuantity ? initialQuantity.toString() : "",
        side: "buy",
        orderType: "market",
        limitPrice: ""
      });
      setUserConsent(false);
    }
  }, [isOpen, initialSymbol, initialQuantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userConsent) {
      alert("Please acknowledge that this is a simulated trade");
      return;
    }

    if (!tradeData.symbol || !tradeData.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    if (parseFloat(tradeData.quantity) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (tradeData.orderType === 'limit' && !tradeData.limitPrice) {
      alert("Please enter a limit price");
      return;
    }

    setIsExecuting(true);

    try {
      await onExecuteTrade({
        symbol: tradeData.symbol.toUpperCase(),
        quantity: parseFloat(tradeData.quantity),
        side: tradeData.side,
        orderType: tradeData.orderType,
        limitPrice: tradeData.limitPrice ? parseFloat(tradeData.limitPrice) : null
      });

      setTradeData({
        symbol: "",
        quantity: "",
        side: "buy",
        orderType: "market",
        limitPrice: ""
      });
      setUserConsent(false);
      onClose();
    } catch (error) {
      console.error("Trade execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {tradeData.side === 'buy' ? (
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-rose-600" />
            )}
            Paper Trading
          </DialogTitle>
          <DialogDescription>
            Execute simulated trades with live market prices
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong>Sandbox Mode:</strong> All trades are simulated - no real money involved.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Trade Side</Label>
              <Select 
                value={tradeData.side} 
                onValueChange={(value) => setTradeData({...tradeData, side: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Order Type</Label>
              <Select 
                value={tradeData.orderType} 
                onValueChange={(value) => setTradeData({...tradeData, orderType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="AAPL, GOOGL, etc."
              value={tradeData.symbol}
              onChange={(e) => setTradeData({...tradeData, symbol: e.target.value.toUpperCase()})}
              className="text-lg"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Number of shares"
              value={tradeData.quantity}
              onChange={(e) => setTradeData({...tradeData, quantity: e.target.value})}
              className="text-lg"
              required
            />
          </div>

          {tradeData.orderType === 'limit' && (
            <div>
              <Label htmlFor="limitPrice">Limit Price *</Label>
              <Input
                id="limitPrice"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Price per share"
                value={tradeData.limitPrice}
                onChange={(e) => setTradeData({...tradeData, limitPrice: e.target.value})}
                className="text-lg"
                required
              />
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={userConsent}
                onCheckedChange={setUserConsent}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm text-slate-700 cursor-pointer">
                I acknowledge this is a <strong>simulated paper trade</strong> for educational purposes only.
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${
                tradeData.side === 'buy' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600' 
                  : 'bg-gradient-to-r from-rose-600 to-red-600'
              }`}
              disabled={isExecuting || !userConsent}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>Execute {tradeData.side === 'buy' ? 'Buy' : 'Sell'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
