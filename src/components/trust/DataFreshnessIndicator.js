import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DataFreshnessIndicator({ 
  lastUpdated,
  dataSource = "Yahoo Finance",
  sourceUrl = null,
  metricName = "data",
  variant = "compact"
}) {
  if (!lastUpdated) return null;

  const now = new Date();
  const updatedDate = new Date(lastUpdated);
  const hoursSince = (now - updatedDate) / (1000 * 60 * 60);
  const daysSince = hoursSince / 24;

  const isStale = daysSince > 7;
  const isModeratelyStale = daysSince > 3;
  const isFresh = hoursSince < 24;

  const getFreshnessColor = () => {
    if (isFresh) return "emerald";
    if (isModeratelyStale) return "amber";
    if (isStale) return "rose";
    return "blue";
  };

  const getFreshnessIcon = () => {
    if (isFresh) return <CheckCircle className="w-3 h-3" />;
    if (isStale) return <AlertCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const getFreshnessText = () => {
    if (hoursSince < 1) return "Updated <1hr ago";
    if (hoursSince < 24) return `Updated ${Math.floor(hoursSince)}hr ago`;
    if (daysSince < 7) return `Updated ${Math.floor(daysSince)}d ago`;
    return `Updated ${Math.floor(daysSince)}d ago`;
  };

  const color = getFreshnessColor();

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className={`text-xs bg-${color}-100 text-${color}-700 border-${color}-300 cursor-help`}
            >
              {getFreshnessIcon()}
              <span className="ml-1">{getFreshnessText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <p className="text-xs font-semibold mb-1">Data Provenance</p>
            <p className="text-xs mb-2">
              <strong>Source:</strong> {dataSource}
            </p>
            <p className="text-xs mb-1">
              <strong>Last Updated:</strong> {updatedDate.toLocaleString()}
            </p>
            {isStale && (
              <p className="text-xs text-amber-700 mt-2">
                ⚠️ Data is {Math.floor(daysSince)} days old. Consider refreshing.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`p-3 rounded-lg border-2 border-${color}-200 bg-${color}-50`}>
      <div className="flex items-start gap-2">
        {getFreshnessIcon()}
        <div className="flex-1">
          <p className={`text-sm font-semibold text-${color}-900 mb-1`}>
            {metricName} {getFreshnessText()}
          </p>
          <p className={`text-xs text-${color}-800`}>
            <strong>Source:</strong> {dataSource}
          </p>
        </div>
      </div>
    </div>
  );
}
