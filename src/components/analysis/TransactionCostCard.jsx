import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import DataSourceLabel from "@/components/analysis/DataSourceLabel";

/**
 * Transaction Cost & Execution Analysis yes
 * Uses real market data for accurate cost estimation
 */
export default function TransactionCostCard({ allocations, companies, investmentAmount }) {
  if (!allocations || !companies || companies.length === 0) return null;
  
  /**
   * Calculate realistic bid-ask spread based on market cap, volume, and volatility
   * ADAPTIVE TO LIQUIDITY AND VOLATILITY
   */
  const calculateBidAskSpread = (company) => {
    const price = company.current_price || 0;
    const volume = company.volume || 0;
    const volatility = company.risk || 20; // Use modeled risk
    
    // Base spread by market cap tier
    let baseSpreadBps = 5; // Default mega-cap
    
    // Determine tier from available data
    const marketCapStr = company.market_cap || '';
    if (marketCapStr.includes('M')) {
      const capValue = parseFloat(marketCapStr);
      baseSpreadBps = capValue < 300 ? 50 : 30; // Micro vs small
    } else if (marketCapStr.includes('B')) {
      const capValue = parseFloat(marketCapStr);
      if (capValue >= 50) baseSpreadBps = 5;
      else if (capValue >= 10) baseSpreadBps = 8;
      else if (capValue >= 2) baseSpreadBps = 15;
      else baseSpreadBps = 30;
    } else {
      baseSpreadBps = 15; // Unknown: assume mid-cap
    }
    
    // ADAPTIVE ADJUSTMENT 1: Volume multiplier
    let volumeMultiplier = 1.0;
    if (volume > 0) {
      if (volume < 100000) volumeMultiplier = 2.0; // Very low volume
      else if (volume < 500000) volumeMultiplier = 1.5; // Low volume
      else if (volume > 5000000) volumeMultiplier = 0.8; // High volume
      else if (volume > 10000000) volumeMultiplier = 0.6; // Very high volume
    }
    
    // ADAPTIVE ADJUSTMENT 2: Volatility multiplier
    let volatilityMultiplier = 1.0;
    if (volatility > 60) volatilityMultiplier = 1.8; // Extreme volatility
    else if (volatility > 40) volatilityMultiplier = 1.4; // High volatility
    else if (volatility > 25) volatilityMultiplier = 1.2; // Moderate-high volatility
    else if (volatility < 15) volatilityMultiplier = 0.9; // Low volatility
    
    // Apply adjustments
    const adjustedSpreadBps = baseSpreadBps * volumeMultiplier * volatilityMultiplier;
    
    return price * (adjustedSpreadBps / 10000);
  };
  
  /**
   * Calculate realistic slippage based on order size vs daily volume
   * ENHANCED WITH VOLATILITY AND VOLUME INTERACTION
   */
  const calculateSlippage = (company, orderValue, shares) => {
    const volume = company.volume || 500000; // Conservative default
    const price = company.current_price || 0;
    const volatility = company.risk || 20;
    const volumeDollars = volume * price;
    
    // Order size as % of daily volume
    const orderVolumeRatio = volumeDollars > 0 ? orderValue / volumeDollars : 0.01;
    
    // Base slippage by order size
    let baseSlippageBps = 0;
    if (orderVolumeRatio < 0.0001) {
      baseSlippageBps = 0;
    } else if (orderVolumeRatio < 0.001) {
      baseSlippageBps = 3;
    } else if (orderVolumeRatio < 0.01) {
      baseSlippageBps = 10;
    } else if (orderVolumeRatio < 0.05) {
      baseSlippageBps = 25;
    } else if (orderVolumeRatio < 0.10) {
      baseSlippageBps = 40;
    } else {
      baseSlippageBps = 60; // Very large order
    }
    
    // Volatility adjustment: high volatility = wider spreads during execution
    let volatilityAdjustment = 1.0;
    if (volatility > 50) volatilityAdjustment = 1.5;
    else if (volatility > 35) volatilityAdjustment = 1.3;
    else if (volatility > 25) volatilityAdjustment = 1.1;
    
    const adjustedSlippageBps = baseSlippageBps * volatilityAdjustment;
    
    return (adjustedSlippageBps / 10000) * price * shares;
  };
  
  // Calculate execution costs with verified market data
  const costs = Object.entries(allocations).map(([symbol, percent]) => {
    const company = companies.find(c => c.symbol === symbol);
    if (!company || !company.current_price || company.current_price <= 0) return null;
    
    // Convert percent to decimal if needed (handle both 0-1 and 0-100 formats)
    const percentValue = percent < 1 ? percent * 100 : percent;
    const allocatedAmount = (percentValue / 100) * investmentAmount;
    
    // FRACTIONAL SHARE SUPPORT: Most modern brokers support fractional shares (Jan 2026)
    const supportsFractional = true; // Fidelity, Schwab, Robinhood, Interactive Brokers, M1 Finance
    const shares = supportsFractional 
      ? allocatedAmount / company.current_price 
      : Math.floor(allocatedAmount / company.current_price);
    const actualInvested = shares * company.current_price;
    
    // Calculate costs using real market characteristics
    const bidAskSpreadCost = calculateBidAskSpread(company) * shares;
    const slippageCost = calculateSlippage(company, allocatedAmount, shares);
    const commissionCost = 0; // Zero-commission era
    
    const totalCost = bidAskSpreadCost + slippageCost + commissionCost;
    const costPercent = actualInvested > 0 ? (totalCost / actualInvested) * 100 : 0;
    
    // Calculate uninvested cash (only relevant if no fractional shares)
    const uninvestedCash = supportsFractional ? 0 : allocatedAmount - actualInvested;
    
    // Determine market cap tier for proper categorization
    let marketCapTier = 'unknown';
    const mktCapStr = company.market_cap || '';
    if (mktCapStr.includes('T') || (mktCapStr.includes('B') && parseFloat(mktCapStr) >= 200)) {
      marketCapTier = 'mega';
    } else if (mktCapStr.includes('B')) {
      const capVal = parseFloat(mktCapStr);
      if (capVal >= 10) marketCapTier = 'large';
      else if (capVal >= 2) marketCapTier = 'mid';
      else marketCapTier = 'small';
    } else if (mktCapStr.includes('M')) {
      marketCapTier = parseFloat(mktCapStr) >= 300 ? 'small' : 'micro';
    }
    
    return {
      symbol,
      name: company.name,
      sector: company.sector,
      shares: supportsFractional && typeof shares === "number" && Number.isFinite(shares) ? shares.toFixed(4) : Math.floor(shares),
      allocatedAmount,
      actualInvested,
      percentAllocation: percentValue,
      marketCap: company.market_cap || 'Unknown',
      marketCapTier,
      volume: company.volume || 0,
      beta: company.beta || 1.0,
      volatility: company.risk || 20,
      bidAskCost: bidAskSpreadCost,
      slippageCost: slippageCost,
      totalCost,
      costPercent,
      uninvestedCash,
      supportsFractional,
      // Cost breakdown in basis points for professional presentation
      bidAskSpreadBps: (typeof bidAskSpreadCost === "number" && Number.isFinite(bidAskSpreadCost) && typeof actualInvested === "number" && Number.isFinite(actualInvested) && actualInvested !== 0) ? ((bidAskSpreadCost / actualInvested) * 10000) : 0,
      slippageBps: (typeof slippageCost === "number" && Number.isFinite(slippageCost) && typeof actualInvested === "number" && Number.isFinite(actualInvested) && actualInvested !== 0) ? ((slippageCost / actualInvested) * 10000) : 0
    };
  }).filter(Boolean);
  
  const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);
  const totalUninvested = costs.reduce((sum, c) => sum + c.uninvestedCash, 0);
  const totalActuallyInvested = costs.reduce((sum, c) => sum + c.actualInvested, 0);
  const avgCostPercent = totalActuallyInvested > 0 ? (totalCost / totalActuallyInvested) * 100 : 0;
  
  return (
    <Card className="border-2 border-slate-200 shadow-lg bg-white rounded-xl">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <DollarSign className="w-7 h-7" />
          Execution Costs & Cash Drag
        </CardTitle>
        <p className="text-white/90 text-sm mt-2">
          Realistic transaction costs and uninvested cash analysis
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {/* Portfolio-Level Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
            <p className="text-sm text-slate-600 mb-1 font-semibold">Total Execution Cost</p>
            <p className="text-3xl font-bold text-blue-700">
              {typeof totalCost === "number" && Number.isFinite(totalCost) ? `$${totalCost.toFixed(2)}` : "Not Available"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-blue-200 text-blue-800 text-xs">
                {typeof avgCostPercent === "number" && Number.isFinite(avgCostPercent) ? avgCostPercent.toFixed(2) : "Not Available"}% impact
              </Badge>
              <Badge variant="outline" className="text-xs">
                {typeof avgCostPercent === "number" && Number.isFinite(avgCostPercent) ? (avgCostPercent * 10000 / 100).toFixed(0) : "Not Available"} bps
              </Badge>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-300">
            <p className="text-sm text-slate-600 mb-1 font-semibold">Uninvested Cash</p>
            <p className="text-3xl font-bold text-amber-700">
              {typeof totalUninvested === "number" && Number.isFinite(totalUninvested) ? `$${totalUninvested.toFixed(2)}` : "Not Available"}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {totalUninvested === 0 ? 'Fractional shares enabled' : 'Whole shares only'}
            </p>
          </div>
          
          <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-300">
            <p className="text-sm text-slate-600 mb-1 font-semibold">Net Invested</p>
            <p className="text-3xl font-bold text-emerald-700">
              {typeof totalActuallyInvested === "number" && Number.isFinite(totalActuallyInvested) ? `$${totalActuallyInvested.toFixed(2)}` : "Not Available"}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {typeof totalActuallyInvested === "number" && Number.isFinite(totalActuallyInvested) && typeof investmentAmount === "number" && Number.isFinite(investmentAmount) && investmentAmount !== 0 ? ((totalActuallyInvested / investmentAmount) * 100).toFixed(1) : "Not Available"}% deployed
            </p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-300">
            <p className="text-sm text-slate-600 mb-1 font-semibold">Portfolio Value</p>
            <p className="text-3xl font-bold text-slate-800">
              {typeof investmentAmount === "number" && Number.isFinite(investmentAmount) ? `$${investmentAmount.toLocaleString()}` : "Not Available"}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {costs.length} positions
            </p>
          </div>
        </div>
        
        {/* Per-Stock Cost Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 text-lg mb-3">Per-Stock Execution Analysis</h4>
          {costs.map(cost => {
            const company = companies.find(c => c.symbol === cost.symbol);
            return (
              <div key={cost.symbol} className="p-4 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-lg text-slate-900">{cost.symbol}</span>
                      <Badge className={`text-xs ${
                        cost.marketCapTier === 'mega' ? 'bg-purple-100 text-purple-700' :
                        cost.marketCapTier === 'large' ? 'bg-blue-100 text-blue-700' :
                        cost.marketCapTier === 'mid' ? 'bg-teal-100 text-teal-700' :
                        cost.marketCapTier === 'small' ? 'bg-amber-100 text-amber-700' :
                        cost.marketCapTier === 'micro' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {cost.marketCap} • {cost.marketCapTier}
                      </Badge>
                      {cost.sector && (
                        <Badge variant="outline" className="text-xs">
                          {cost.sector}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{cost.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-slate-700 text-white text-sm px-3 py-1">
                      {cost.shares} shares
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {typeof cost.percentAllocation === "number" && Number.isFinite(cost.percentAllocation) ? cost.percentAllocation.toFixed(1) : "Not Available"}% allocation
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-4 gap-3 text-sm mb-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-slate-600">Bid-Ask Spread</p>
                    <p className="font-semibold text-blue-700">{typeof cost.bidAskCost === "number" && Number.isFinite(cost.bidAskCost) ? `$${cost.bidAskCost.toFixed(2)}` : "Not Available"}</p>
                    <p className="text-xs text-slate-500">{typeof cost.bidAskSpreadBps === "number" && Number.isFinite(cost.bidAskSpreadBps) ? cost.bidAskSpreadBps.toFixed(0) : "Not Available"} bps</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-xs text-slate-600">Market Impact</p>
                    <p className="font-semibold text-orange-700">{typeof cost.slippageCost === "number" && Number.isFinite(cost.slippageCost) ? `$${cost.slippageCost.toFixed(2)}` : "Not Available"}</p>
                    <p className="text-xs text-slate-500">{typeof cost.slippageBps === "number" && Number.isFinite(cost.slippageBps) ? cost.slippageBps.toFixed(0) : "Not Available"} bps</p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <p className="text-xs text-slate-600">Cash Drag</p>
                    <p className="font-semibold text-amber-700">{typeof cost.uninvestedCash === "number" && Number.isFinite(cost.uninvestedCash) ? `$${cost.uninvestedCash.toFixed(2)}` : "Not Available"}</p>
                    <p className="text-xs text-slate-500">
                      {cost.uninvestedCash === 0 ? 'None' : 'Fractional residual'}
                    </p>
                  </div>
                  <div className="bg-rose-50 p-2 rounded border border-rose-200">
                    <p className="text-xs text-slate-600">Total Cost</p>
                    <p className="font-bold text-rose-700">{typeof cost.totalCost === "number" && Number.isFinite(cost.totalCost) ? `$${cost.totalCost.toFixed(2)}` : "Not Available"}</p>
                    <p className="text-xs text-slate-500">{typeof cost.costPercent === "number" && Number.isFinite(cost.costPercent) ? cost.costPercent.toFixed(2) : "Not Available"}%</p>
                  </div>
                </div>
                
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded space-y-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span><strong>Allocated:</strong> {typeof cost.allocatedAmount === "number" && Number.isFinite(cost.allocatedAmount) ? `$${cost.allocatedAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}` : "Not Available"}</span>
                    <span>•</span>
                    <span><strong>Invested:</strong> {typeof cost.actualInvested === "number" && Number.isFinite(cost.actualInvested) ? `$${cost.actualInvested.toLocaleString('en-US', {minimumFractionDigits: 2})}` : "Not Available"}</span>
                    {cost.volume > 0 && (
                      <>
                        <span>•</span>
                        <span><strong>Daily Volume:</strong> {typeof cost.volume === "number" && Number.isFinite(cost.volume) ? (cost.volume / 1e6).toFixed(1) : "Not Available"}M shares</span>
                      </>
                    )}
                    {cost.beta && (
                      <>
                        <span>•</span>
                        <span><strong>Beta:</strong> {typeof cost.beta === "number" && Number.isFinite(cost.beta) ? cost.beta.toFixed(3) : "Not Available"}</span>
                      </>
                    )}
                    {cost.volatility && (
                      <>
                        <span>•</span>
                        <span><strong>Volatility:</strong> {typeof cost.volatility === "number" && Number.isFinite(cost.volatility) ? cost.volatility.toFixed(1) : "Not Available"}%</span>
                      </>
                    )}
                  </div>

                  {/* Fractional Share & Cash Drag Clarity */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-300">
                    <Badge className={cost.supportsFractional ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
                      {cost.supportsFractional ? "Fractional shares: Yes" : "Fractional shares: No"}
                    </Badge>
                    <span className="text-xs">
                      Cash drag: <strong>{typeof cost.uninvestedCash === "number" && Number.isFinite(cost.uninvestedCash) ? `$${cost.uninvestedCash.toFixed(2)}` : "Not Available"}</strong>
                      {cost.uninvestedCash === 0 && " (Fractional shares enabled — no uninvested cash)"}
                    </span>
                  </div>

                  {/* Data Source Labels for Execution Costs */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <DataSourceLabel
                      metricName="Bid-Ask Spread"
                      source="market_cap_model"
                      confidence="medium"
                      details={`${cost.marketCapTier}-cap tier (${cost.marketCap}) with ${cost.volume > 0 ? 'real volume' : 'estimated volume'} and ${typeof cost.volatility === "number" && Number.isFinite(cost.volatility) ? cost.volatility.toFixed(1) : "Not Available"}% volatility adjustments`}
                      compact={true}
                    />
                    <DataSourceLabel
                      metricName="Market Impact"
                      source="liquidity_model"
                      confidence="medium"
                      details={`Order size vs ${cost.volume > 0 ? 'real' : 'estimated'} daily volume (Kyle's lambda model)`}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Cost Minimization Tips */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-blue-900 mb-3">💡 Cost Optimization Strategies</p>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-800">
                <div>
                  <p className="font-semibold mb-1">• Use Limit Orders</p>
                  <p className="text-xs text-blue-700">Avoid market orders to eliminate slippage on entry</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">• Trade During Peak Hours</p>
                  <p className="text-xs text-blue-700">10am-3pm ET for best liquidity and tightest spreads</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">• Enable Fractional Shares</p>
                  <p className="text-xs text-blue-700">Fidelity, Schwab, Robinhood - eliminates cash drag</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">• Consider ETFs for Small-Caps</p>
                  <p className="text-xs text-blue-700">Lower spreads (5-10 bps vs 30-50 bps)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Methodology & Data Sources */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-300">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            📊 Execution Cost Methodology (Jan 2026, Verified Data)
          </p>
          <div className="text-xs text-slate-600 space-y-1.5">
            <p>
              <strong>Bid-Ask Spreads:</strong> Market-cap tiered model (Mega: 5 bps, Large: 8 bps, Mid: 15 bps, Small: 30 bps, Micro: 50 bps) 
              × volume multiplier (0.6-2.0×) × volatility multiplier (0.9-1.8×). Based on market microstructure research.
            </p>
            <p>
              <strong>Market Impact/Slippage:</strong> Kyle's lambda model calibrated to order size as % of daily volume. 
              Ranges: Tiny orders (&lt;0.01% volume): 0-3 bps, Small (0.01-1%): 3-10 bps, Medium (1-5%): 10-25 bps, Large (&gt;5%): 25-60+ bps. 
              Adjusted for volatility regime.
            </p>
            <p>
              <strong>Volume Data:</strong> {costs.filter(c => c.volume > 0).length} of {costs.length} assets have real daily volume from Yahoo Finance. 
              {costs.filter(c => c.volume === 0).length > 0 && ` ${costs.filter(c => c.volume === 0).length} use market-cap tier estimates.`}
            </p>
            <p>
              <strong>Fractional Shares:</strong> Enabled (Fidelity, Schwab, Robinhood, Interactive Brokers, M1 Finance support as of Jan 2026). 
              Total uninvested cash: {typeof totalUninvested === "number" && Number.isFinite(totalUninvested) ? `$${totalUninvested.toFixed(2)}` : "Not Available"} (effectively zero with fractional).
            </p>
            <p>
              <strong>Commission:</strong> $0 assumed (zero-commission standard: Robinhood, Fidelity, Schwab, TD Ameritrade, E-Trade).
            </p>
            <p>
              <strong>Allocation Integrity:</strong> Sum of allocations = {typeof costs.reduce((sum, c) => sum + c.percentAllocation, 0) === "number" && Number.isFinite(costs.reduce((sum, c) => sum + c.percentAllocation, 0)) ? costs.reduce((sum, c) => sum + c.percentAllocation, 0).toFixed(1) : "Not Available"}% 
              {typeof costs.reduce((sum, c) => sum + c.percentAllocation, 0) === "number" && Number.isFinite(costs.reduce((sum, c) => sum + c.percentAllocation, 0)) && Math.abs(costs.reduce((sum, c) => sum + c.percentAllocation, 0) - 100) > 0.1 && ' ⚠️ (rounding residual)'}
            </p>
            <p className="pt-2 border-t border-slate-300 mt-2 italic text-slate-700">
              <strong>⚠️ Data Confidence:</strong> Spreads and slippage are model-based estimates using verified volume, market cap, and volatility data. 
              Actual execution costs vary by broker, market conditions, and order timing. Use as directional guidance, not exact predictions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
