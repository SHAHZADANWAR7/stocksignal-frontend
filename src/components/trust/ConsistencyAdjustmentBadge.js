import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ConsistencyAdjustmentBadge({ 
  wasAdjusted,
  adjustmentReason,
  originalValue,
  adjustedValue,
  variant = "subtle"
}) {
  if (!wasAdjusted) return null;

  if (variant === "subtle") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-indigo-100 text-indigo-700 text-xs cursor-help border border-indigo-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Adjusted
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <p className="text-xs font-semibold mb-2">Consistency Adjustment</p>
            <p className="text-xs mb-2">{adjustmentReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
      <div className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-indigo-600" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-indigo-900 mb-1">Consistency Adjustment Applied</p>
          <p className="text-xs text-indigo-800">{adjustmentReason}</p>
        </div>
      </div>
    </div>
  );
}
