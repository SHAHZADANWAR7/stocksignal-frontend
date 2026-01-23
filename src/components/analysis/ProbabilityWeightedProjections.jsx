import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle } from "lucide-react";

export default function ProbabilityWeightedProjections({ 
  expectedValue, 
  volatility, 
  years, 
  principal, 
  monthlyContribution 
}) {
  // Calculate probability-weighted ranges
  // Uses lognormal distribution assumptions
  const annualReturn = expectedValue / 100;
  const annualVolatility = volatility / 100;
  const monthlyRate = annualReturn / 12;
  const monthlyVol = annualVolatility / Math.sqrt(12);
  
  // Total contributions
  const totalContributions = principal + (monthlyContribution * 12 * years);
  
  // Expected value (median scenario - 50th percentile)
  let expectedBalance = principal;
  for (let month = 0; month < years * 12; month++) {
    expectedBalance = expectedBalance * (1 + monthlyRate) + monthlyContribution;
  }
  
  // Pessimistic scenario (16th percentile = -1 standard deviation)
  // Accounts for downside volatility over time
  const downside1SD = Math.exp((annualReturn - 0.5 * annualVolatility * annualVolatility - annualVolatility) * years);
  let pessimisticBalance = principal * downside1SD;
  for (let month = 0; month < years * 12; month++) {
    pessimisticBalance = pessimisticBalance * (1 + monthlyRate - monthlyVol) + monthlyContribution;
  }
  pessimisticBalance = Math.max(totalContributions * 0.3, pessimisticBalance); // Floor at 30% of contributions
  
  // Optimistic scenario (84th percentile = +1 standard deviation)
  const upside1SD = Math.exp((annualReturn - 0.5 * annualVolatility * annualVolatility + annualVolatility) * years);
  let optimisticBalance = principal * upside1SD;
  for (let month = 0; month < years * 12; month++) {
    optimisticBalance = optimisticBalance * (1 + monthlyRate + monthlyVol) + monthlyContribution;
  }
  
  // REALISM CAP: For long horizons (20+ years), cap optimistic projection at economically plausible ceiling
  // Formula: Max = contributions × 50 (assumes 50x multiple, equivalent to 13-14% CAGR over 30 years)
  // This prevents astronomically large tail values while preserving statistical calculation
  const economicCeiling = totalContributions * 50;
  const isOptimisticCapped = optimisticBalance > economicCeiling;
  if (isOptimisticCapped && years >= 20) {
    optimisticBalance = economicCeiling;
  }
  
  // Worst-case scenario (5th percentile = ~-1.65 SD)
  const worstCase = Math.exp((annualReturn - 0.5 * annualVolatility * annualVolatility - 1.65 * annualVolatility) * years);
  let worstBalance = principal * worstCase;
  for (let month = 0; month < years * 12; month++) {
    worstBalance = worstBalance * (1 + monthlyRate - 1.65 * monthlyVol) + monthlyContribution;
  }
  worstBalance = Math.max(totalContributions * 0.15, worstBalance); // Floor at 15% of contributions

  const ranges = [
    { 
      label: "Worst Case (5th %ile)", 
      value: worstBalance, 
      probability: 5,
      color: "bg-rose-100 text-rose-800 border-rose-300",
      isCapped: false
    },
    { 
      label: "Pessimistic (16th %ile)", 
      value: pessimisticBalance, 
      probability: 16,
      color: "bg-orange-100 text-orange-800 border-orange-300",
      isCapped: false
    },
    { 
      label: "Expected (50th %ile)", 
      value: expectedBalance, 
      probability: 50,
      color: "bg-blue-100 text-blue-800 border-blue-300",
      isCapped: false
    },
    { 
      label: "Optimistic (84th %ile)", 
      value: optimisticBalance, 
      probability: 84,
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      isCapped: isOptimisticCapped
    }
  ];

  const isExtremeProjection = expectedBalance > 10000000; // $10M+

  return (
    <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          Probability-Weighted Growth Ranges ({years} Years)
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Accounting for volatility ({volatility.toFixed(1)}%), expected outcomes span a wide range
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-3 md:px-6">
        {/* Range Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {ranges.map(range => (
            <div key={range.label} className={`p-3 md:p-4 rounded-xl border-2 ${range.color} flex flex-col`}>
              <p className="text-[10px] md:text-xs font-bold mb-1 md:mb-2 leading-tight">
                {range.label}
                {range.isCapped && <span className="ml-1 text-slate-600 block md:inline">(capped)</span>}
              </p>
              <p className="text-lg md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2 leading-none break-all">
                ${range.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[9px] md:text-xs opacity-80 leading-tight">
                {range.probability}% of outcomes
              </p>
              {range.value < totalContributions && (
                <Badge className="mt-1.5 md:mt-2 bg-rose-200 text-rose-900 text-[9px] md:text-xs px-1.5 py-0.5">
                  Below contributions
                </Badge>
              )}
              {range.isCapped && (
                <Badge className="mt-1.5 md:mt-2 bg-slate-200 text-slate-700 text-[9px] md:text-xs px-1.5 py-0.5">
                  Realistic ceiling
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Contribution Breakdown */}
        <div className="p-3 bg-white/70 rounded-lg border border-slate-300">
          <p className="text-sm text-slate-700">
            <strong>Total Contributions:</strong> ${totalContributions.toLocaleString()} 
            ({principal > 0 ? `$${principal.toLocaleString()} initial` : ''}
            {monthlyContribution > 0 ? ` + $${monthlyContribution.toLocaleString()}/mo × ${years} years` : ''})
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Expected growth: ${(expectedBalance - totalContributions).toLocaleString()} 
            ({((expectedBalance / totalContributions - 1) * 100).toFixed(0)}% gain on contributions)
          </p>
        </div>

        {/* Extreme Projection Warning */}
        {isExtremeProjection && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">⚠️ Educational Projection Warning</p>
                <p className="text-xs text-amber-800">
                  {years}-year projection of ${(expectedBalance/1000000).toFixed(1)}M is <strong>illustrative only</strong>. 
                  Actual results may differ significantly due to:
                </p>
                <ul className="text-xs text-amber-800 mt-2 space-y-0.5 list-disc list-inside">
                  <li>Market crashes and recessions (2008, 2020, future unknown events)</li>
                  <li>Company-specific failures (bankruptcy, fraud, disruption)</li>
                  <li>Changing market regimes (inflation, interest rates, regulation)</li>
                  <li>Extreme tail events (black swans) not captured by normal distribution</li>
                </ul>
                <p className="text-xs text-amber-900 mt-2 font-semibold italic">
                  Use these projections for educational exploration only, not financial planning. 
                  Consult a licensed advisor for retirement/goal planning.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Methodology */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-300">
          <p className="text-xs text-slate-700">
            <strong>Calculation Method:</strong> Percentiles calculated using lognormal distribution 
            assumptions with annualized return ({expectedValue.toFixed(1)}%) and volatility ({volatility.toFixed(1)}%). 
            Does not account for sequence risk, correlation breakdown during crises, or tail events beyond ±2 standard deviations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
