import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";

/**
 * Per-Stock Speculative Contribution Indicator yes
 * Shows which holdings drive speculative risk
 */
export default function SpeculativeContributionBadge({ company }) {
  if (!company) return null;

  // Calculate speculative contribution (0-100%)
  const calculateSpeculativeScore = () => {
    let score = 0;
    const factors = [];

    // Factor 1: Profitability (0-35 points)
    if (!company.pe_ratio || company.pe_ratio < 0) {
      score += 35;
      factors.push("Unprofitable (35 pts)");
    } else if (company.pe_ratio > 50) {
      score += 25;
      factors.push("High P/E >50 (25 pts)");
    } else if (company.pe_ratio > 30) {
      score += 15;
      factors.push("Elevated P/E >30 (15 pts)");
    }

    // Factor 2: Market Cap (0-30 points)
    const marketCap = company.market_cap;
    if (marketCap) {
      if (marketCap.includes('M')) {
        const val = parseFloat(marketCap);
        if (val < 300) {
          score += 30;
          factors.push("Micro-cap <$300M (30 pts)");
        } else {
          score += 25;
          factors.push("Small-cap <$2B (25 pts)");
        }
      } else if (marketCap.includes('B')) {
        const val = parseFloat(marketCap);
        if (val < 2) {
          score += 20;
          factors.push("Small-cap <$2B (20 pts)");
        } else if (val < 10) {
          score += 10;
          factors.push("Mid-cap <$10B (10 pts)");
        }
      }
    }

    // Factor 3: Beta Magnitude (0-20 points)
    const beta = Math.abs(company.beta || 1.0);
    if (beta > 2.0) {
      score += 20;
      factors.push(`Extreme beta ${beta.toFixed(2)} (20 pts)`);
    } else if (beta > 1.5) {
      score += 15;
      factors.push(`High beta ${beta.toFixed(2)} (15 pts)`);
    } else if (beta > 1.2) {
      score += 10;
      factors.push(`Above-avg beta ${beta.toFixed(2)} (10 pts)`);
    }

    // Factor 4: Revenue Stability (0-15 points)
    // Proxy: recent return volatility
    if (company.ytd_return !== undefined && company.one_year_return !== undefined) {
      const returnVariance = Math.abs(company.ytd_return - company.one_year_return);
      if (returnVariance > 50) {
        score += 15;
        factors.push("High return variance (15 pts)");
      } else if (returnVariance > 30) {
        score += 10;
        factors.push("Moderate return variance (10 pts)");
      }
    }

    return {
      score: Math.min(100, score),
      factors,
      tier: score >= 80 ? "Very High" : score >= 60 ? "High" : score >= 40 ? "Moderate" : score >= 20 ? "Low" : "Very Low"
    };
  };

  const result = calculateSpeculativeScore();

  const getBadgeColor = (tier) => {
    switch (tier) {
      case "Very High": return "bg-rose-100 text-rose-800 border-rose-300";
      case "High": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Moderate": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Low": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Very Low": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${getBadgeColor(result.tier)} border text-xs cursor-help`}>
            {result.tier} Speculative ({result.score}%)
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4">
          <p className="font-semibold mb-2">Speculative Contribution: {result.score}%</p>
          <p className="text-xs mb-2">
            Reflects volatility, profitability, and market-cap risk — not expected return.
          </p>
          {result.factors.length > 0 && (
            <>
              <p className="text-xs font-semibold mt-2 mb-1">Risk Factors:</p>
              <ul className="text-xs space-y-1">
                {result.factors.map((factor, idx) => (
                  <li key={idx}>• {factor}</li>
                ))}
              </ul>
            </>
          )}
          <p className="text-xs text-slate-500 mt-2 italic">
            This helps you understand which positions drive portfolio speculative exposure.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
