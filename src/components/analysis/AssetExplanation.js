import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, AlertCircle, TrendingUp, Shield } from "lucide-react";

/**
 * Display AI adjustment reasoning for a single asset
 * Shows why expected return, risk, or other metrics were adjusted
 */
export default function AssetExplanation({ asset, adjustments, compact = false }) {
  if (!adjustments || adjustments.length === 0) {
    return null;
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'speculative':
      case 'high_volatility':
        return <AlertCircle className="w-3 h-3" />;
      case 'valuation':
      case 'overvaluation':
      case 'undervaluation':
        return <TrendingUp className="w-3 h-3" />;
      case 'market_cap':
      case 'profitability':
      case 'momentum':
        return <Info className="w-3 h-3" />;
      case 'diversifier':
      case 'low_correlation':
        return <Shield className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'speculative':
      case 'high_volatility':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'overvaluation':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'undervaluation':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'diversifier':
      case 'low_correlation':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700">
              <Info className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              {adjustments.map((adj, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    {getCategoryIcon(adj.category)}
                    <span className="font-semibold">{adj.metric}:</span>
                    {adj.delta && (
                      <Badge variant="outline" className="text-xs">
                        {adj.delta >= 0 ? '+' : ''}{adj.delta.toFixed(2)}{adj.unit || '%'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-700">{adj.explanation}</p>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
        <Info className="w-3 h-3" />
        AI Adjustments
      </p>
      {adjustments.map((adj, idx) => (
        <div key={idx} className={`p-2 rounded-lg border ${getCategoryColor(adj.category)}`}>
          <div className="flex items-start gap-2">
            {getCategoryIcon(adj.category)}
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{adj.metric}</span>
                {adj.delta && (
                  <Badge variant="outline" className="text-xs">
                    {adj.delta >= 0 ? '+' : ''}{adj.delta.toFixed(2)}{adj.unit || '%'}
                  </Badge>
                )}
              </div>
              <p className="leading-relaxed">{adj.explanation}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
