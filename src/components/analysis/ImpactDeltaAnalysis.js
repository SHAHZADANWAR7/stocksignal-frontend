import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Shield,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  portfolioExpectedReturn,
  portfolioRisk,
  sharpeRatio,
  expectedMaxDrawdown,
  drawdownDelta,
  monteCarloGoalProbability,
  round,
  sanitizeNumber
} from "@/components/utils/financialMath";
import { calculateQualityScore } from "@/components/utils/portfolioOptimization";

export default function ImpactDeltaAnalysis({ 
  currentPortfolio, 
  companies, 
  diversificationRecommendations
}) {
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [customAllocation, setCustomAllocation] = useState(20);
  const [whatIfResults, setWhatIfResults] = useState({});

  const diversifiers = [
    { 
      symbol: "SPY", 
      name: "S&P 500 ETF", 
      expectedReturn: 10.5, 
      risk: 18, 
      correlation: 0.15,
      description: "Broad market exposure"
    },
    { 
      symbol: "BND", 
      name: "Total Bond Market", 
      expectedReturn: 4.2, 
      risk: 6, 
      correlation: -0.10,
      description: "Defensive asset"
    },
    { 
      symbol: "GLD", 
      name: "Gold ETF", 
      expectedReturn: 5.0, 
      risk: 16, 
      correlation: 0.05,
      description: "Alternative diversifier"
    }
  ];

  const calculateWhatIf = useCallback((diversifier, allocationPercent) => {
      if (!currentPortfolio || !companies || companies.length === 0) return null;

      const allocation = allocationPercent / 100;
      const currentReturn = sanitizeNumber(currentPortfolio.expected_return || 0);
      const currentRisk = sanitizeNumber(currentPortfolio.risk || 20);

      const weights = [1 - allocation, allocation];
      const expectedReturns = [currentReturn, diversifier.expectedReturn];
      const risks = [currentRisk, diversifier.risk];
      const correlationMatrix = [
        [1.0, diversifier.correlation],
        [diversifier.correlation, 1.0]
      ];
      
      const newReturn = portfolioExpectedReturn(weights, expectedReturns);
      const newRisk = portfolioRisk(weights, risks, correlationMatrix);
      const newSharpe = sharpeRatio(newReturn, newRisk);

      return {
        newReturn: round(newReturn, 1),
        newRisk: round(newRisk, 1),
        newSharpe: round(newSharpe, 3),
        deltas: {
          return: newReturn - currentReturn,
          risk: newRisk - currentRisk,
          sharpe: newSharpe - (currentPortfolio.sharpe_ratio || 0)
        }
      };
  }, [currentPortfolio, companies]);

  const toggleAsset = useCallback((symbol, allocation = 20) => {
    if (expandedAsset === symbol) {
      setExpandedAsset(null);
    } else {
      const diversifier = diversifiers.find(d => d.symbol === symbol);
      if (diversifier) {
        const result = calculateWhatIf(diversifier, allocation);
        setExpandedAsset(symbol);
        setCustomAllocation(allocation);
        setWhatIfResults(prev => ({ ...prev, [symbol]: result }));
      }
    }
  }, [expandedAsset, diversifiers, calculateWhatIf]);

  if (!currentPortfolio) return null;

  return (
    <Card className="border-2 border-purple-300 bg-purple-50">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          What If You Add a Diversifier?
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
          <p className="text-sm text-blue-800">
            These simulations show potential improvements. No changes applied to your selections.
          </p>
        </div>

        {diversifiers.map((diversifier) => {
          const isExpanded = expandedAsset === diversifier.symbol;
          const result = whatIfResults[diversifier.symbol];

          return (
            <Card key={diversifier.symbol} className="border-2 border-slate-200">
              <CardContent className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleAsset(diversifier.symbol, customAllocation)}
                >
                  <div>
                    <h4 className="font-bold text-lg">{diversifier.symbol}</h4>
                    <p className="text-sm text-slate-600">{diversifier.name}</p>
                  </div>
                  {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </div>

                <AnimatePresence>
                  {isExpanded && result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <Label className="mb-2 block">Allocation: {customAllocation}%</Label>
                      <Input
                        type="range"
                        min="5"
                        max="40"
                        value={customAllocation}
                        onChange={(e) => {
                          const newAlloc = parseInt(e.target.value);
                          setCustomAllocation(newAlloc);
                          const diversifier = diversifiers.find(d => d.symbol === expandedAsset);
                          if (diversifier) {
                            const newResult = calculateWhatIf(diversifier, newAlloc);
                            setWhatIfResults(prev => ({ ...prev, [expandedAsset]: newResult }));
                          }
                        }}
                        className="w-full"
                      />
                      
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600">Return</p>
                          <p className="text-2xl font-bold text-blue-600">{result.newReturn}%</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600">Risk</p>
                          <p className="text-2xl font-bold text-amber-600">{result.newRisk}%</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600">Sharpe</p>
                          <p className="text-2xl font-bold text-emerald-600">{result.newSharpe}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
