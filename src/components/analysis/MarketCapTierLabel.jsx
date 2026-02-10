import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Market Cap Tier Context Label Yes
 * Provides intuitive risk context through market capitalization
 */
export default function MarketCapTierLabel({ marketCap, compact = true }) {
  if (!marketCap) return null;

  const getTier = () => {
    if (marketCap.includes('M')) {
      const val = parseFloat(marketCap);
      return val < 300 ? 'Micro' : 'Small';
    }
    if (marketCap.includes('B')) {
      const val = parseFloat(marketCap);
      if (val < 2) return 'Small';
      if (val < 10) return 'Mid';
      if (val < 50) return 'Large';
      return 'Mega';
    }
    return 'Unknown';
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Mega': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Large': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Mid': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Small': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Micro': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getTierContext = (tier) => {
    switch (tier) {
      case 'Mega':
        return 'Mega-cap companies (>$50B) typically have lower volatility, established business models, and global market presence.';
      case 'Large':
        return 'Large-cap companies ($10B-$50B) offer stability with moderate growth potential.';
      case 'Mid':
        return 'Mid-cap companies ($2B-$10B) balance growth potential with moderate volatility.';
      case 'Small':
        return 'Small-cap companies ($300M-$2B) offer higher growth potential with increased volatility.';
      case 'Micro':
        return 'Micro-cap companies (<$300M) carry high volatility and liquidity risk but potential for significant growth.';
      default:
        return 'Market capitalization context unavailable.';
    }
  };

  const tier = getTier();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${getTierColor(tier)} border text-xs cursor-help`}>
              {typeof marketCap === "string" && marketCap ? marketCap : "Not Available"} • {tier}-cap
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <p className="font-semibold mb-1">{tier}-Cap Context</p>
            <p className="text-xs">{getTierContext(tier)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`text-xs p-2 rounded border ${getTierColor(tier)}`}>
      <span className="font-semibold">{tier}-Cap:</span> {typeof marketCap === "string" && marketCap ? marketCap : "Not Available"}
      <p className="text-xs mt-1 opacity-80">{getTierContext(tier)}</p>
    </div>
  );
}
