import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TopPerformers({ holdings }) {
  const holdingsWithGains = holdings.map(holding => {
    const currentValue = holding.quantity * (holding.current_price || holding.average_cost);
    const costBasis = holding.quantity * holding.average_cost;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = (gainLoss / costBasis) * 100;
    
    return {
      ...holding,
      gainLoss,
      gainLossPercent
    };
  });

  const sorted = [...holdingsWithGains].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
  const topPerformers = sorted.slice(0, 5);

  if (holdings.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-400">No holdings to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPerformers.map((holding, index) => {
            const isPositive = holding.gainLoss >= 0;
            return (
              <div key={holding.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <span className="text-xs font-semibold text-slate-700">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{holding.symbol}</p>
                    <p className="text-xs text-slate-500">{holding.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    )}
                    <Badge 
                      variant="secondary"
                      className={`${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'} border font-semibold`}
                    >
                      {isPositive ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <p className={`text-sm font-medium mt-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}${Math.abs(holding.gainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
