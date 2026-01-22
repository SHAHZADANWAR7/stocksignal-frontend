import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

export default function ConcentrationAlert({ allocations, companies, threshold = 25 }) {
  const allocationArray = Object.entries(allocations).map(([symbol, percent]) => ({
    symbol,
    percent: percent < 1 ? percent * 100 : percent,
    company: companies.find(c => c.symbol === symbol)
  }));

  const concentratedPositions = allocationArray.filter(item => item.percent > threshold);
  
  if (concentratedPositions.length === 0) {
    return null;
  }

  // Generate rebalancing suggestions
  const totalOverweight = concentratedPositions.reduce((sum, item) => sum + (item.percent - threshold), 0);
  const underweightPositions = allocationArray.filter(item => item.percent <= threshold);
  
  const suggestions = concentratedPositions.map(item => {
    const excess = item.percent - threshold;
    const redistribution = underweightPositions.map(target => ({
      from: item.symbol,
      to: target.symbol,
      amount: (excess / underweightPositions.length)
    }));
    
    return {
      symbol: item.symbol,
      current: item.percent,
      suggested: threshold,
      reduce: excess,
      redistribution
    };
  });

  return (
    <Card className="border-2 border-amber-300 bg-amber-50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-amber-900 mb-2">
              ⚠️ Concentration Risk Alert
            </h4>
            <p className="text-sm text-amber-800 mb-3">
              {concentratedPositions.length === 1 
                ? `One position exceeds ${threshold}% of your portfolio. Single-stock concentration increases idiosyncratic risk.`
                : `${concentratedPositions.length} positions exceed ${threshold}% each. This reduces diversification benefits.`}
            </p>

            {/* Concentrated Positions */}
            <div className="mb-4 space-y-2">
              {concentratedPositions.map(item => (
                <div key={item.symbol} className="p-4 rounded-xl bg-white/70 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.symbol}</p>
                      {item.company && <p className="text-sm text-slate-600">{item.company.name}</p>}
                    </div>
                    <Badge className="text-lg px-3 py-1 bg-amber-200 text-amber-900">
                      {item.percent.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-800">
                    {item.percent > 40 && '🚨 Extremely concentrated - consider reducing to 25-30%'}
                    {item.percent <= 40 && item.percent > 30 && '⚠️ High concentration - industry best practice is under 30%'}
                    {item.percent <= 30 && '⚠️ Above recommended threshold'}
                  </p>
                </div>
              ))}
            </div>

            {/* Optional Rebalancing Suggestions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-700" />
                <h5 className="font-semibold text-blue-900 text-sm">Optional Rebalancing Suggestions</h5>
              </div>
              
              <p className="text-xs text-blue-800 mb-3">
                Consider reducing concentrated positions to ≤{threshold}% and reallocating to other holdings:
              </p>

              {suggestions.map(suggestion => (
                <div key={suggestion.symbol} className="text-xs text-blue-800 mb-2 last:mb-0">
                  <p className="font-semibold">
                    {suggestion.symbol}: {suggestion.current.toFixed(1)}% → {suggestion.suggested.toFixed(1)}% 
                    <span className="text-blue-700"> (reduce by {suggestion.reduce.toFixed(1)}%)</span>
                  </p>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {suggestion.redistribution.slice(0, 3).map((redist, idx) => (
                      <li key={idx}>
                        • Add {redist.amount.toFixed(1)}% to {redist.to}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <p className="text-xs text-blue-600 mt-3 italic">
                💡 Note: These are suggestions only. Your current allocation remains valid and compatible with all analysis features.
              </p>
            </div>

            {/* Educational Note */}
            <div className="mt-3 p-3 bg-white/50 rounded-lg border border-slate-300">
              <p className="text-xs text-slate-700">
                <strong>Why this matters:</strong> Industry research shows portfolios with single positions exceeding 30% 
                experience higher volatility and drawdowns. Diversification reduces company-specific risk while 
                maintaining market exposure.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
