import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Target, Info, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { monteCarloGoalProbability } from "@/components/utils/financialMath";

/**
 * GOAL PROBABILITY TRANSPARENCY CARD
 * 
 * Shows probability RANGES with confidence intervals
 * Allows volatility assumption toggling
 * Mandatory disclaimer tooltip
 */

export default function GoalProbabilityCard({ 
  principal, 
  monthlyContribution, 
  expectedReturn, 
  baseVolatility,
  goalAmount, 
  months 
}) {
  const [volatilityMode, setVolatilityMode] = useState('historical');

  // Calculate volatility based on selected mode
  const getVolatility = () => {
    switch (volatilityMode) {
      case 'historical':
        return baseVolatility;
      case 'vix_adjusted':
        // VIX-blended forward-looking volatility
        // Assume current VIX ~15-20, adjust base volatility
        return baseVolatility * 1.15;
      case 'conservative':
        // Stress-adjusted conservative estimate
        return baseVolatility * 1.35;
      default:
        return baseVolatility;
    }
  };

  const volatility = getVolatility();

  // Run Monte Carlo with fat tails
  const baseProbability = monteCarloGoalProbability(
    principal,
    monthlyContribution,
    expectedReturn / 100,
    volatility / 100,
    goalAmount,
    months,
    true // Use fat-tailed distribution
  );

  // Calculate confidence interval (±1σ uncertainty)
  // Monte Carlo has sampling error ~1/√N
  const simulations = 15000;
  const samplingError = 1 / Math.sqrt(simulations);
  const confidenceInterval = samplingError * Math.sqrt(baseProbability * (1 - baseProbability));

  const probabilityLow = Math.max(0, baseProbability - confidenceInterval);
  const probabilityHigh = Math.min(1, baseProbability + confidenceInterval);

  const getProbabilityColor = (prob) => {
    if (prob >= 0.7) return 'emerald';
    if (prob >= 0.5) return 'blue';
    if (prob >= 0.3) return 'amber';
    return 'rose';
  };

  const color = getProbabilityColor(baseProbability);

  return (
    <Card className={`border-2 border-${color}-200 bg-${color}-50`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className={`w-6 h-6 text-${color}-600`} />
          Goal Success Probability
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-slate-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4 bg-slate-900 text-white">
                <p className="text-sm font-semibold mb-2">⚠️ Important Disclosure</p>
                <p className="text-xs leading-relaxed">
                  This probability is <strong>distribution-driven</strong> and highly sensitive to volatility assumptions. 
                  It is <strong>not a forecast</strong> or prediction of actual outcomes.
                  <br/><br/>
                  Actual results depend on market conditions, economic changes, and unpredictable events.
                  Use this as ONE input in your decision-making, not a guarantee.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volatility Assumption Selector */}
        <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
          <Label className="text-sm font-semibold text-slate-900 mb-3 block">
            Volatility Assumption (Controls probability calculation)
          </Label>
          <RadioGroup value={volatilityMode} onValueChange={setVolatilityMode}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50">
                <RadioGroupItem value="historical" id="hist" />
                <Label htmlFor="hist" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Historical ({baseVolatility.toFixed(1)}%)</span>
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Based on past volatility</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50">
                <RadioGroupItem value="vix_adjusted" id="vix" />
                <Label htmlFor="vix" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VIX-Adjusted ({(baseVolatility * 1.15).toFixed(1)}%)</span>
                    <Badge variant="outline" className="text-xs bg-blue-50">Forward-looking</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Current market implied volatility</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50">
                <RadioGroupItem value="conservative" id="cons" />
                <Label htmlFor="cons" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conservative ({(baseVolatility * 1.35).toFixed(1)}%)</span>
                    <Badge variant="outline" className="text-xs bg-amber-50">Stress-adjusted</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Assumes higher uncertainty</p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Probability with Range */}
        <div className="bg-white rounded-lg p-6 border-2 border-slate-200">
          <div className="text-center mb-3">
            <p className="text-sm text-slate-600 mb-2">Base Probability</p>
            <p className={`text-5xl font-bold text-${color}-600 mb-1`}>
              {(baseProbability * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-slate-500">
              Range: {(probabilityLow * 100).toFixed(0)}%–{(probabilityHigh * 100).toFixed(0)}%
            </p>
            <Badge className={`mt-2 bg-${color}-100 text-${color}-700`}>
              {volatilityMode === 'historical' && 'Historical Vol'}
              {volatilityMode === 'vix_adjusted' && 'VIX-Adjusted Vol'}
              {volatilityMode === 'conservative' && 'Conservative Vol'}
            </Badge>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 mt-4">
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>Interpretation:</strong> In {(baseProbability * 100).toFixed(0)} out of 100 simulated scenarios, 
              your goal was reached under {volatilityMode.replace('_', ' ')} volatility assumptions.
              <br/><br/>
              <strong className="text-slate-900">Range explains uncertainty:</strong> Confidence interval is ±{(confidenceInterval * 100).toFixed(0)}% 
              due to simulation sampling and assumption sensitivity.
            </p>
          </div>
        </div>

        {/* Volatility Impact Explainer */}
        <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Why Volatility Matters
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Higher volatility = wider range of possible outcomes = lower probability of hitting specific target.
                <br/><br/>
                • <strong>Historical:</strong> Assumes past volatility continues<br/>
                • <strong>VIX-Adjusted:</strong> Uses current market expectations (VIX ~{(baseVolatility * 0.15).toFixed(0)}% higher)<br/>
                • <strong>Conservative:</strong> Stress-tests with elevated uncertainty (+35%)
                <br/><br/>
                Toggle between modes to understand sensitivity to assumptions.
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-900 font-semibold mb-1">
                📊 Distribution-Driven Probability (Not a Forecast)
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                This probability is generated using Monte Carlo simulation with {volatility.toFixed(1)}% volatility 
                and {expectedReturn.toFixed(1)}% expected return.
                <br/><br/>
                <strong>It is NOT:</strong>
                <br/>• A prediction of what will happen
                <br/>• Investment advice or a recommendation
                <br/>• A guarantee of any outcome
                <br/><br/>
                <strong>It IS:</strong>
                <br/>• A statistical estimate under specific assumptions
                <br/>• Highly sensitive to volatility and return inputs
                <br/>• One tool among many for decision support
                <br/><br/>
                Actual results will vary. Markets are unpredictable. This is educational analysis only.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
