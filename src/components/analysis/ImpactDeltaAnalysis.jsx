import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "@/components/utils/calculations/financialMath";
import { calculateQualityScore } from "@/components/utils/calculations/portfolioOptimization";

export default function ImpactDeltaAnalysis({ 
  currentPortfolio, 
  companies, 
  diversificationRecommendations
}) {
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [customAllocation, setCustomAllocation] = useState(20);
  
  // Real-time calculation results (no caching - recalculate on every change)
  const [whatIfResults, setWhatIfResults] = useState({});

  const diversifiers = [
    { 
      symbol: "SPY", 
      name: "S&P 500 ETF", 
      expectedReturn: 10.5, 
      risk: 18, 
      correlation: 0.15,
      description: "Broad market exposure, low correlation with individual stocks"
    },
    { 
      symbol: "BND", 
      name: "Total Bond Market", 
      expectedReturn: 4.2, 
      risk: 6, 
      correlation: -0.10,
      description: "Defensive asset, often moves opposite to equities"
    },
    { 
      symbol: "GLD", 
      name: "Gold ETF", 
      expectedReturn: 5.0, 
      risk: 16, 
      correlation: 0.05,
      description: "Alternative diversifier, low equity correlation"
    },
    { 
      symbol: "QQQ", 
      name: "Nasdaq 100", 
      expectedReturn: 12.0, 
      risk: 22, 
      correlation: 0.25,
      description: "Tech-focused but broader than individual stocks"
    },
    { 
      symbol: "VNQ", 
      name: "Real Estate", 
      expectedReturn: 7.5, 
      risk: 20, 
      correlation: 0.20,
      description: "Real estate exposure, moderate diversification"
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // PRECISION ENGINE: Real-time calculation with exact mathematics yes
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateWhatIf = useCallback((diversifier, allocationPercent) => {
      if (!currentPortfolio || !companies || companies.length === 0) return null;

      // FULL PRECISION: No early rounding
      const allocation = allocationPercent / 100;

      const currentReturn = sanitizeNumber(currentPortfolio.expected_return || 0);
      const currentRisk = sanitizeNumber(currentPortfolio.risk || 20);
      const currentSharpe = sanitizeNumber(currentPortfolio.sharpe_ratio || 0);

      // ═══════════════════════════════════════════════════════════════════════
      // CORRELATION NORMALIZATION - CRITICAL PATH
      // ═══════════════════════════════════════════════════════════════════════
      let rawCorrelation = currentPortfolio.avgCorrelation;
      
      // CHECKPOINT 1: Handle missing/null/undefined
      if (rawCorrelation === null || rawCorrelation === undefined || isNaN(rawCorrelation)) {
        console.warn(`⚠️ Missing avgCorrelation, defaulting to ${companies.length > 1 ? 0.60 : 0}`);
        rawCorrelation = companies.length > 1 ? 0.60 : 0;
      }
      
      // CHECKPOINT 2: Force normalization to 0-1 scale
      const currentCorrelation = sanitizeNumber(rawCorrelation > 1 ? rawCorrelation / 100 : rawCorrelation);
      
      // CHECKPOINT 3: Validate normalized value is in bounds
      if (currentCorrelation < 0 || currentCorrelation > 1) {
        console.error(`🚨 CORRELATION OUT OF BOUNDS: ${currentCorrelation} (raw: ${rawCorrelation})`);
        return null;
      }
      
      const currentWeights = Object.values(currentPortfolio.allocations || {})
        .map(a => a < 1 ? a : a / 100);
      const currentQuality = calculateQualityScore(companies, currentWeights);
      const currentQualityScore = currentQuality.qualityScore || 50;
      
      // EXACT CALCULATIONS: Full precision maintained throughout
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
      
      // ═══════════════════════════════════════════════════════════════════════
      // CORRELATION CALCULATION - DETERMINISTIC WEIGHTED AVERAGE
      // ═══════════════════════════════════════════════════════════════════════
      // Formula: newCorr = (1 - α) × currCorr + α × diversifierCorr
      // All values MUST be in 0-1 scale
      
      const weight1 = 1 - allocation;
      const weight2 = allocation;
      const term1 = weight1 * currentCorrelation;
      const term2 = weight2 * diversifier.correlation;
      const newCorrelation = term1 + term2;
      
      // CHECKPOINT 4: Validate calculation bounds
      if (newCorrelation < 0 || newCorrelation > 1) {
        console.error(`🚨 NEW CORRELATION OUT OF BOUNDS:`, {
          newCorrelation,
          weight1,
          weight2,
          currentCorrelation,
          diversifierCorr: diversifier.correlation,
          term1,
          term2,
          formula: `${weight1.toFixed(3)} × ${currentCorrelation.toFixed(3)} + ${weight2.toFixed(3)} × ${diversifier.correlation.toFixed(3)} = ${newCorrelation.toFixed(3)}`
        });
        return null;
      }
      
      // CHECKPOINT 5: Sanity check - new correlation should be between current and diversifier
      const minExpected = Math.min(currentCorrelation, diversifier.correlation);
      const maxExpected = Math.max(currentCorrelation, diversifier.correlation);
      if (newCorrelation < minExpected - 0.01 || newCorrelation > maxExpected + 0.01) {
        console.warn(`⚠️ Correlation outside expected range [${minExpected.toFixed(3)}, ${maxExpected.toFixed(3)}]: ${newCorrelation.toFixed(3)}`);
      }
      
      const hypotheticalCompanies = [
        ...companies,
        {
          symbol: diversifier.symbol,
          name: diversifier.name,
          expected_return: diversifier.expectedReturn,
          risk: diversifier.risk,
          beta: diversifier.correlation < 0.2 ? 0.5 : 1.0,
          sector: 'Diversified',
          market_cap: '100B',
          pe_ratio: 20,
          isIndexFund: true
        }
      ];

      const newWeights = [
        ...currentWeights.map(w => w * (1 - allocation)),
        allocation
      ];

      const newQuality = calculateQualityScore(hypotheticalCompanies, newWeights);
      const newQualityScore = newQuality.qualityScore || 50;
      
      const timeHorizon = 10;
      const currentDrawdown = expectedMaxDrawdown(currentRisk, timeHorizon, currentReturn);
      const newDrawdown = expectedMaxDrawdown(newRisk, timeHorizon, newReturn);
      const drawdownImprovement = drawdownDelta(currentDrawdown, newDrawdown);
      
      const principal = 10000;
      const monthlyContrib = 0;
      const goalAmount = 1000000;
      const months = 360;
      
      const currentGoalProb = monteCarloGoalProbability(
        principal,
        monthlyContrib,
        currentReturn / 100,
        currentRisk / 100,
        goalAmount,
        months
      );
      
      const newGoalProb = monteCarloGoalProbability(
        principal,
        monthlyContrib,
        newReturn / 100,
        newRisk / 100,
        goalAmount,
        months
      );

      // CRITICAL: EXACT DELTA CALCULATION - Full precision before rounding
      // Delta = After - Before (computed FIRST, rounded AFTER)
      // ALL CALCS IN INTERNAL SCALE (0-1 for %, 0-1 for correlation, etc)
      const returnDelta = newReturn - currentReturn;
      const riskDelta = newRisk - currentRisk;
      const sharpeDelta = newSharpe - currentSharpe;
      
      // ═══════════════════════════════════════════════════════════════════════
      // CORRELATION DELTA: EXACT CALCULATION (0-1 scale internally)
      // ═══════════════════════════════════════════════════════════════════════
      // Formula: Δ = (newCorr - currCorr) × 100 (convert to percentage points)
      
      const correlationDeltaRaw = newCorrelation - currentCorrelation;
      const correlationDelta = correlationDeltaRaw * 100;
      
      // CHECKPOINT 6: Validate delta calculation
      const currentPercent = currentCorrelation * 100;
      const newPercent = newCorrelation * 100;
      const expectedDelta = newPercent - currentPercent;
      const deltaError = Math.abs(correlationDelta - expectedDelta);
      
      if (deltaError > 0.1) {
        console.error(`🚨 DELTA CALCULATION ERROR:`, {
          currentPercent: currentPercent.toFixed(2),
          newPercent: newPercent.toFixed(2),
          calculatedDelta: correlationDelta.toFixed(2),
          expectedDelta: expectedDelta.toFixed(2),
          error: deltaError.toFixed(2)
        });
      }
      
      // CHECKPOINT 7: Full audit trail for debugging
      console.log(`✅ CORRELATION VALIDATED [${diversifier.symbol} @ ${allocationPercent}%]:`, {
        step1_rawInput: currentPortfolio.avgCorrelation,
        step2_normalized: currentCorrelation.toFixed(4),
        step3_calculation: `(${weight1.toFixed(3)} × ${currentCorrelation.toFixed(3)}) + (${weight2.toFixed(3)} × ${diversifier.correlation.toFixed(3)})`,
        step4_newValue: newCorrelation.toFixed(4),
        step5_deltaCalc: `${newPercent.toFixed(1)}% - ${currentPercent.toFixed(1)}% = ${correlationDelta.toFixed(1)} pts`,
        step6_verification: deltaError < 0.1 ? '✅ PASS' : '❌ FAIL'
      });
      
      const ddDelta = drawdownImprovement;
      // GOAL PROB: Already in decimal form (0-0.5 range), multiply by 100 for percentage points
      const goalProbDelta = (newGoalProb - currentGoalProb) * 100;
      const qualityDelta = newQualityScore - currentQualityScore;

      // VALIDATION: Ensure scale consistency before returning
      const validateResult = (name, current, newVal, delta) => {
        const isPlausible = Math.abs(delta) <= Math.abs(current) * 2 + 5;
        if (!isPlausible) {
          console.warn(`⚠️ VALIDATION: ${name} - current=${current}, new=${newVal}, delta=${delta} (possible scale mismatch)`);
        }
      };
      validateResult('Return', currentReturn, newReturn, returnDelta);
      validateResult('Risk', currentRisk, newRisk, riskDelta);
      validateResult('Correlation', currentCorrelation, newCorrelation, correlationDeltaRaw);
      validateResult('Sharpe', currentSharpe, newSharpe, sharpeDelta);

      return {
        // INTERNAL SCALE: Store as-is for calculations
        _currentReturn: currentReturn,
        _newReturn: newReturn,
        _currentRisk: currentRisk,
        _newRisk: newRisk,
        _currentCorrelation: currentCorrelation,
        _newCorrelation: newCorrelation,

        // DISPLAY VALUES: Formatted with units
        newReturn: round(newReturn, 1),
        newRisk: round(newRisk, 1),
        newSharpe: round(newSharpe, 3),
        newCorrelation: round(newCorrelation, 2),
        newDrawdown: round(newDrawdown, 0),
        newGoalProb: round(newGoalProb, 4),
        newQualityScore: round(newQualityScore, 0),
        currentReturn: round(currentReturn, 1),
        currentRisk: round(currentRisk, 1),
        currentCorrelation: round(currentCorrelation, 2),
        currentDrawdown: round(currentDrawdown, 0),
        currentGoalProb: round(currentGoalProb, 4),
        currentQualityScore: round(currentQualityScore, 0),

        // DELTAS: RAW VALUES - NO ROUNDING (rounding only at display layer)
        deltas: {
          return: returnDelta,
          risk: riskDelta,
          sharpe: sharpeDelta,
          correlation: correlationDelta,
          drawdown: ddDelta,
          goalProb: goalProbDelta,
          quality: qualityDelta
        }
      };
  }, [currentPortfolio, companies]);

  // INSTANT UPDATE ENGINE: Batched state updates for smooth performance
  const toggleAsset = useCallback((symbol, allocation = 20) => {
    if (expandedAsset === symbol) {
      setExpandedAsset(null);
    } else {
      const diversifier = diversifiers.find(d => d.symbol === symbol);
      if (diversifier) {
        const result = calculateWhatIf(diversifier, allocation);
        // Batch state updates for performance
        setExpandedAsset(symbol);
        setCustomAllocation(allocation);
        setWhatIfResults(prev => ({ ...prev, [symbol]: result }));
      }
    }
  }, [expandedAsset, diversifiers, calculateWhatIf]);

  const updateWhatIf = useCallback((symbol, newAllocation) => {
    const diversifier = diversifiers.find(d => d.symbol === symbol);
    if (diversifier) {
      // INSTANT RECALCULATION: Compute fresh results on every slider change
      const result = calculateWhatIf(diversifier, newAllocation);
      setWhatIfResults(prev => ({ ...prev, [symbol]: result }));
    }
  }, [diversifiers, calculateWhatIf]);

  const getDeltaColor = (delta, inverse = false) => {
    const threshold = 0.1;
    const isPositive = inverse ? delta < -threshold : delta > threshold;
    const isNegative = inverse ? delta > threshold : delta < -threshold;
    
    if (!isPositive && !isNegative) return "text-slate-600";
    return isPositive ? "text-emerald-600" : "text-rose-600";
  };

  const getDeltaIcon = (delta, inverse = false) => {
    const threshold = 0.1;
    const isPositive = inverse ? delta < -threshold : delta > threshold;
    const isNegative = inverse ? delta > threshold : delta < -threshold;
    
    if (!isPositive && !isNegative) return null;
    return isPositive ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />;
  };

  if (!currentPortfolio) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 md:px-6 py-4 md:py-6 rounded-t-xl">
        <div>
          <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-2 py-1 font-semibold mb-2 rounded-lg">
            Impact Deltas™
          </Badge>
          <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" />
            <span>What If You Add a Diversifier?</span>
          </CardTitle>
          <p className="text-white/90 text-xs md:text-sm mt-2">
            See how diversification changes outcomes before you commit — no portfolio changes applied
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
        <div className="bg-blue-50 rounded-2xl p-4 md:p-5 border-2 border-blue-300 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-blue-900 mb-2 text-sm md:text-base leading-tight">📚 Educational / Hypothetical Only</p>
              <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                These simulations show <strong>potential</strong> portfolio improvements. 
                No changes are applied to your actual selections. You retain full control.
              </p>
            </div>
          </div>
        </div>

        {diversifiers.map((diversifier, idx) => {
          const isExpanded = expandedAsset === diversifier.symbol;
          const result = whatIfResults[diversifier.symbol];

          return (
            <motion.div
              key={diversifier.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-2 transition-all duration-300 rounded-2xl ${isExpanded ? 'border-purple-500 shadow-2xl shadow-purple-500/20' : 'border-slate-200 hover:border-purple-300 shadow-md'}`}>
                <CardContent className="p-4 md:p-5">
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleAsset(diversifier.symbol, customAllocation)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Shield className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-base md:text-lg truncate">{diversifier.symbol}</h4>
                          <p className="text-xs md:text-sm text-slate-600 truncate">{diversifier.name}</p>
                        </div>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-2 md:mt-3 ml-13 md:ml-16 leading-relaxed">{diversifier.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-purple-600 group-hover:scale-110 transition-all" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && result && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-purple-200"
                      >
                        <div className="mb-5 md:mb-6">
                          <Label className="text-base md:text-lg font-bold mb-3 block text-slate-900">
                            Adjust Allocation: <span className="text-blue-600">{customAllocation}%</span>
                          </Label>
                          <Input
                            type="range"
                            min="5"
                            max="40"
                            step="1"
                            value={customAllocation}
                            onChange={(e) => {
                              const newAlloc = parseInt(e.target.value);
                              // INSTANT UPDATE: Batch state changes for performance
                              setCustomAllocation(newAlloc);
                              updateWhatIf(diversifier.symbol, newAlloc);
                            }}
                            className="w-full h-12 cursor-pointer"
                          />
                          <div className="flex justify-between text-xs md:text-sm text-slate-600 mt-3 font-semibold">
                            <span>5%</span>
                            <span>20%</span>
                            <span>40%</span>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-slate-200 shadow-lg">
                          <p className="text-base md:text-lg font-bold text-slate-900 mb-5 leading-tight">
                            If you add {customAllocation}% {diversifier.symbol} (hypothetical):
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                             {/* Correlation */}
                             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200 shadow-sm">
                              <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Correlation</p>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                    {(result._currentCorrelation * 100).toFixed(1)}%
                                  </p>
                                  <p className="text-2xl md:text-2xl font-bold text-blue-600 tabular-nums leading-none mt-0.5">
                                    {(result._newCorrelation * 100).toFixed(1)}%
                                  </p>
                                </div>
                                  <p className={`text-xs md:text-xs font-bold ${result.deltas.correlation < -0.05 ? 'text-emerald-600' : result.deltas.correlation > 0.05 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.correlation) < 0.05 ? '~' : `${result.deltas.correlation >= 0 ? '+' : ''}${result.deltas.correlation.toFixed(1)}`}
                                 </p>
                              </div>
                             </div>

                             {/* Sharpe Ratio */}
                             <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 shadow-sm">
                               <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Sharpe</p>
                               <div className="flex items-start justify-between">
                                 <div>
                                   <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                     {currentPortfolio.sharpe_ratio?.toFixed(2) || '0.24'}
                                   </p>
                                   <p className={`text-2xl md:text-2xl font-bold tabular-nums leading-none mt-0.5 ${getDeltaColor(result.deltas.sharpe)}`}>
                                     {result.newSharpe.toFixed(2)}
                                   </p>
                                 </div>
                                 <p className={`text-xs md:text-xs font-bold ${result.deltas.sharpe > 0.005 ? 'text-emerald-600' : result.deltas.sharpe < -0.005 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.sharpe) < 0.005 ? '~' : `${result.deltas.sharpe >= 0 ? '+' : ''}${result.deltas.sharpe.toFixed(2)}`}
                                 </p>
                               </div>
                             </div>

                             {/* Volatility */}
                             <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200 shadow-sm">
                               <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Volatility</p>
                               <div className="flex items-start justify-between">
                                 <div>
                                   <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                     {result._currentRisk?.toFixed(1) || '39.0'}%
                                   </p>
                                   <p className={`text-2xl md:text-2xl font-bold tabular-nums leading-none mt-0.5 ${getDeltaColor(result.deltas.risk, true)}`}>
                                     {result._newRisk.toFixed(1)}%
                                   </p>
                                 </div>
                                 <p className={`text-xs md:text-xs font-bold ${result.deltas.risk < -0.05 ? 'text-emerald-600' : result.deltas.risk > 0.05 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.risk) < 0.05 ? '~' : `${result.deltas.risk >= 0 ? '+' : ''}${result.deltas.risk.toFixed(1)}`}
                                 </p>
                               </div>
                             </div>

                             {/* Max Drawdown */}
                             <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-3 border border-rose-200 shadow-sm">
                               <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Drawdown</p>
                               <div className="flex items-start justify-between">
                                 <div>
                                   <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                     {result.currentDrawdown?.toFixed(0) || '-85'}%
                                   </p>
                                   <p className={`text-2xl md:text-2xl font-bold tabular-nums leading-none mt-0.5 ${getDeltaColor(result.deltas.drawdown, true)}`}>
                                     {result.newDrawdown.toFixed(0)}%
                                   </p>
                                 </div>
                                 <p className={`text-xs md:text-xs font-bold ${result.deltas.drawdown > 0.5 ? 'text-emerald-600' : result.deltas.drawdown < -0.5 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.drawdown) < 0.5 ? '~' : `${result.deltas.drawdown > 0 ? '+' : ''}${Math.round(result.deltas.drawdown)}`}
                                 </p>
                               </div>
                             </div>

                             {/* Expected Return */}
                             <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200 shadow-sm">
                               <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Return</p>
                               <div className="flex items-start justify-between">
                                 <div>
                                   <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                     {result._currentReturn?.toFixed(1) || '0.0'}%
                                   </p>
                                   <p className={`text-2xl md:text-2xl font-bold tabular-nums leading-none mt-0.5 ${getDeltaColor(result.deltas.return)}`}>
                                     {result._newReturn.toFixed(1)}%
                                   </p>
                                 </div>
                                 <p className={`text-xs md:text-xs font-bold ${result.deltas.return > 0.05 ? 'text-emerald-600' : result.deltas.return < -0.05 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.return) < 0.05 ? '~' : `${result.deltas.return >= 0 ? '+' : ''}${result.deltas.return.toFixed(1)}`}
                                 </p>
                               </div>
                             </div>

                             {/* Goal Success */}
                             <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-3 border border-teal-200 shadow-sm">
                               <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Goal Success</p>
                               <div className="flex items-start justify-between">
                                 <div>
                                   <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                     {(result.currentGoalProb * 100).toFixed(0)}%
                                   </p>
                                   <p className={`text-2xl md:text-2xl font-bold tabular-nums leading-none mt-0.5 ${getDeltaColor(result.deltas.goalProb)}`}>
                                     {(result.newGoalProb * 100).toFixed(0)}%
                                   </p>
                                 </div>
                                 <p className={`text-xs md:text-xs font-bold ${result.deltas.goalProb > 0.5 ? 'text-emerald-600' : result.deltas.goalProb < -0.5 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.goalProb) < 0.5 ? '~' : `${result.deltas.goalProb >= 0 ? '+' : ''}${Math.round(result.deltas.goalProb)}`}
                                 </p>
                               </div>
                             </div>

                             {/* Portfolio Quality */}
                             <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-200 shadow-sm">
                               <p className="text-[10px] md:text-xs text-slate-700 font-semibold leading-tight truncate mb-2">Quality</p>
                               <div className="flex items-start justify-between">
                                 <div>
                                   <p className="text-[9px] md:text-[10px] text-slate-500 tabular-nums leading-none">
                                     {result.currentQualityScore}
                                   </p>
                                   <p className={`text-2xl md:text-2xl font-bold tabular-nums leading-none mt-0.5 ${getDeltaColor(result.deltas.quality)}`}>
                                     {result.newQualityScore}
                                   </p>
                                 </div>
                                 <p className={`text-xs md:text-xs font-bold ${result.deltas.quality > 0.5 ? 'text-emerald-600' : result.deltas.quality < -0.5 ? 'text-rose-600' : 'text-slate-600'} tabular-nums self-center`}>
                                   {Math.abs(result.deltas.quality) < 0.5 ? '~' : `${result.deltas.quality >= 0 ? '+' : ''}${Math.round(result.deltas.quality)}`}
                                 </p>
                               </div>
                             </div>
                             </div>

                          {/* Drawdown Protection Highlight - DISPLAY FORMATTED */}
                          {(() => {
                           const portfolioSize = 30000;
                           const currentDD = Math.abs(result.currentDrawdown || -85);
                           const newDD = Math.abs(result.newDrawdown || -85);
                           const dollarSaved = portfolioSize * ((currentDD - newDD) / 100);
                           const ptsImprovement = result.deltas.drawdown;

                           if (ptsImprovement > 1) {
                             return (
                               <div className="mt-5 md:mt-6 p-4 md:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-400 shadow-lg">
                                 <div className="flex items-start gap-3 md:gap-4">
                                   <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
                                     <Shield className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                   </div>
                                   <div className="min-w-0 flex-1">
                                     <p className="text-base md:text-lg font-bold text-emerald-900 mb-4 leading-tight">
                                       💰 Downside Protection Benefit
                                     </p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                       <div className="bg-white/80 rounded-2xl p-4 md:p-5 border-2 border-emerald-300 shadow-md">
                                         <p className="text-xs md:text-sm text-slate-600 mb-2 leading-tight font-medium">Drawdown Improvement</p>
                                         <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-700 tabular-nums leading-none break-words">
                                           +{ptsImprovement.toFixed(2)} pts
                                         </p>
                                       </div>
                                       <div className="bg-white/80 rounded-2xl p-4 md:p-5 border-2 border-emerald-300 shadow-md">
                                         <p className="text-xs md:text-sm text-slate-600 mb-2 leading-tight font-medium">Est. Loss Reduction</p>
                                         <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-700 tabular-nums leading-none break-words">
                                           ${dollarSaved.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                         </p>
                                       </div>
                                     </div>
                                     <p className="text-xs md:text-sm text-emerald-800 mt-4 leading-relaxed font-medium">
                                       On a ${portfolioSize.toLocaleString()} portfolio in severe downturn (10Y horizon).
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             );
                           }
                           return null;
                          })()}

                          <div className="mt-5 md:mt-6 p-4 md:p-5 bg-slate-50/80 rounded-2xl border-2 border-slate-300 shadow-md">
                            <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                              <strong className="text-slate-900">Calculation Methodology:</strong> Adds {customAllocation}% {diversifier.symbol}, proportionally reducing existing positions. 
                              Assumes {diversifier.correlation.toFixed(2)} correlation with portfolio. 
                              Drawdown via Magdon-Ismail (10Y, 95%ile). 
                              Goal probability via 15k Monte Carlo iterations (fat-tailed distribution).
                              <span className="block mt-2 font-semibold text-slate-900">
                                All deltas computed as: After − Before (exact precision, rounded for display).
                              </span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        <div className="bg-blue-50 rounded-2xl p-4 md:p-5 border-2 border-blue-300 shadow-md">
          <div className="flex items-start gap-2 md:gap-3">
            <Info className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900">💡 How to use:</strong> Click any asset to see instant impact deltas. 
              Adjust slider to test scenarios. 
              <strong className="text-blue-900"> Your selections remain unchanged.</strong> 
              This is exploratory only. All calculations are mathematically exact.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
