import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MarketCapTierLabel({ marketCap, compact = true }) {
  if (!marketCap) return null;

  const getTier = () => {
    if (marketCap.includes('M')) return parseFloat(marketCap) < 300 ? 'Micro' : 'Small';
    if (marketCap.includes('B')) {
      const val = parseFloat(marketCap);
      if (val < 2) return 'Small';
      if (val < 10) return 'Mid';
      if (val < 50) return 'Large';
      return 'Mega';
    }
    return 'Unknown';
  };

  const tier = getTier();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="text-xs cursor-help">
            {marketCap} • {tier}-cap
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tier}-cap: {marketCap} market capitalization</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
