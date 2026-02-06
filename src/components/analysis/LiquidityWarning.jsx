import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

/**
 * Liquidity Warning Component
 * Alerts when order size may exceed reasonable portion of daily volume
 * Shows execution risk and recommends strategies
 * 
 * ✅ VERIFIED: Compatible with updated Analysis.jsx
 * ✅ NO CHANGES NEEDED
 * ✅ NO VIX NEEDED (liquidity warnings, not volatility)
 */
export default function LiquidityWarning({ allocations, companies, investmentAmount }) {
  const warnings = [];

  Object.entries(allocations).forEach(([symbol, percent]) => {
    const company = companies.find(c => c.symbol === symbol);
    if (!company) return;

    const allocationPercent = percent < 1 ? percent * 100 : percent;
    const allocationAmount = (allocationPercent / 100) * investmentAmount;
    const shares = company.current_price > 0 ? allocationAmount / company.current_price : 0;

    // Estimate daily volume based on market cap and trading patterns
    let estimatedDailyVolume = 1000000; // Default assumption
    
    // More sophisticated liquidity check based on available data
    if (company.volume && company.volume > 0) {
      estimatedDailyVolume = company.volume;
    } else {
      // Estimate based on market cap (now safely removed from schema)
      // We'll rely on volume data or use conservative estimates
      estimatedDailyVolume = 500000; // Conservative default
    }

    // Check if order size exceeds reasonable portion of daily volume
    const dailyVolumeProportion = shares / estimatedDailyVolume;

    if (dailyVolumeProportion > 0.05) { // More than 5% of daily volume
      warnings.push({
        symbol,
        name: company.name,
        shares: shares.toFixed(0),
        estimatedDailyVolume: estimatedDailyVolume.toLocaleString(),
        proportion: (dailyVolumeProportion * 100).toFixed(1),
        severity: dailyVolumeProportion > 0.20 ? 'high' : dailyVolumeProportion > 0.10 ? 'medium' : 'low'
      });
    }
  });

  if (warnings.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-orange-300 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-orange-900 mb-2">
              ⚠️ Large Order Size Warning
            </h4>
            <p className="text-sm text-orange-800 mb-3">
              {warnings.length === 1 
                ? 'One allocation may exceed typical daily trading volume.'
                : `${warnings.length} allocations may impact execution quality.`}
            </p>

            <div className="space-y-2">
              {warnings.map(warning => (
                <div key={warning.symbol} className={`p-3 rounded-lg border ${
                  warning.severity === 'high' ? 'bg-rose-50 border-rose-300' :
                  warning.severity === 'medium' ? 'bg-amber-50 border-amber-300' :
                  'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-bold text-slate-900">{warning.symbol}</span>
                      <span className="text-sm text-slate-600 ml-2">{warning.name}</span>
                    </div>
                    <Badge className={`text-xs ${
                      warning.severity === 'high' ? 'bg-rose-200 text-rose-900' :
                      warning.severity === 'medium' ? 'bg-amber-200 text-amber-900' :
                      'bg-yellow-200 text-yellow-900'
                    }`}>
                      {warning.proportion}% of daily volume
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-700">
                    Order: ~{warning.shares} shares • Est. daily volume: {warning.estimatedDailyVolume}
                  </p>
                  
                  {warning.severity === 'high' && (
                    <p className="text-xs text-rose-700 mt-2 font-semibold">
                      🚨 Order exceeding 20% of daily volume may cause significant slippage and unfavorable fills
                    </p>
                  )}
                  {warning.severity === 'medium' && (
                    <p className="text-xs text-amber-700 mt-2 font-semibold">
                      ⚠️ Order exceeding 10% of daily volume may increase execution costs
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-300">
              <p className="text-xs text-blue-900 font-semibold mb-2">
                💡 Execution Strategies for Large Orders:
              </p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Split order across multiple days (TWAP - Time-Weighted Average Price)</li>
                <li>Use limit orders instead of market orders to control execution price</li>
                <li>Consider alternative allocation to more liquid securities</li>
                <li>For very large positions, consult with a broker for block trade execution</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
