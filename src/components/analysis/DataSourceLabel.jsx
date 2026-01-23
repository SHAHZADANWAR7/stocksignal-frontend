import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Database, TrendingUp } from "lucide-react";

/**
 * Data Source & Confidence Transparency Labels
 * Shows where values come from and confidence level
 */
export default function DataSourceLabel({ 
  metricName,
  source, 
  confidence,
  details,
  compact = true
}) {
  if (!source) return null;

  const getConfidenceColor = () => {
    switch (confidence) {
      case "high":
      case "very_high":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "low":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "very_low":
        return "bg-rose-100 text-rose-700 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getSourceDisplay = () => {
    // Clean up source names for readability
    switch (source) {
      case "yahoo_finance_5yr":
        return "Yahoo Finance";
      case "calculated_5yr_daily":
        return "RapidAPI (calculated)";
      case "sector_estimate":
        return "Sector estimate";
      case "llm_estimate":
        return "AI estimate";
      case "market_cap_model":
        return "Market-cap model";
      case "liquidity_model":
        return "Liquidity model";
      case "default_fallback":
        return "Default estimate";
      default:
        return source;
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-xs cursor-help ${getConfidenceColor()}`}>
              <Database className="w-3 h-3 mr-1" />
              {getSourceDisplay()}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm p-3">
            <p className="font-semibold mb-1">{metricName || "Metric"}</p>
            <p className="text-xs mb-1">
              <strong>Source:</strong> {getSourceDisplay()}
            </p>
            {confidence && (
              <p className="text-xs mb-1">
                <strong>Confidence:</strong> {confidence.replace('_', ' ')}
              </p>
            )}
            {details && (
              <p className="text-xs text-slate-600 mt-2 italic">
                {details}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant
  return (
    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
      <div className="flex items-center gap-2 mb-1">
        <Database className="w-3 h-3 text-slate-600" />
        <span className="font-semibold text-slate-700">{metricName || "Data Source"}</span>
      </div>
      <p className="text-slate-600">
        <strong>Source:</strong> {getSourceDisplay()}
        {confidence && (
          <span className="ml-2">
            • <strong>Confidence:</strong> <span className={
              confidence === 'high' || confidence === 'very_high' ? 'text-emerald-700' :
              confidence === 'medium' ? 'text-blue-700' :
              'text-amber-700'
            }>{confidence.replace('_', ' ')}</span>
          </span>
        )}
      </p>
      {details && (
        <p className="text-slate-500 mt-1 italic">{details}</p>
      )}
    </div>
  );
}
