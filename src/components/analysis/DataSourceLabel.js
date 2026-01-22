import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DataSourceLabel({ 
  metricName,
  source, 
  confidence,
  details,
  compact = true
}) {
  if (!source) return null;

  const getSourceDisplay = () => {
    switch (source) {
      case "yahoo_finance_5yr": return "Yahoo Finance";
      case "market_cap_model": return "Market-cap model";
      case "liquidity_model": return "Liquidity model";
      default: return source;
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs cursor-help">
              <Database className="w-3 h-3 mr-1" />
              {getSourceDisplay()}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm p-3">
            <p className="font-semibold mb-1">{metricName || "Metric"}</p>
            <p className="text-xs">Source: {getSourceDisplay()}</p>
            {details && <p className="text-xs text-slate-600 mt-2">{details}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="text-xs bg-slate-50 p-2 rounded border">
      <Database className="w-3 h-3 inline mr-1" />
      <strong>Source:</strong> {getSourceDisplay()}
    </div>
  );
}
