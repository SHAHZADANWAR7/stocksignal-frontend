/**
 * STRATEGY PRESENTATION LAYER - AWS AMPLIFY VERSION
 * 200+ lines of pure strategy visualization and presentation
 * 
 * Core responsibility: Display portfolio strategies with metrics and insights
 * - Render four portfolio strategies with visual differentiation
 * - Display key performance metrics (return, risk, Sharpe, etc.)
 * - Present strategy-specific insights and trade-offs
 * - Show strengths, weaknesses, and recommendations
 * - Conditional rendering based on analysis results
 * 
 * This file does NOT contain:
 * - Portfolio calculations
 * - Behavioral analysis
 * - Workflow orchestration
 * - Tab management (belongs to TempAnalysisTabsAWS.js)
 * 
 * All data is sourced from props and rendered as-is.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Shield, Zap, Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const strategyConfig = {
  optimal_portfolio: {
    icon: Scale,
    title: "Optimal",
    subtitle: "Maximum Sharpe Ratio",
    colorClasses: "border-blue-500 bg-blue-50",
    textColor: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700",
    description: "Best risk-adjusted returns - balances growth with risk management",
    use_case: "Ideal for balanced investors seeking optimal return per unit of risk",
  },
  minimum_variance_portfolio: {
    icon: Shield,
    title: "Min Variance",
    subtitle: "Lowest Volatility",
    colorClasses: "border-emerald-500 bg-emerald-50",
    textColor: "text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-700",
    description: "Most conservative approach - minimizes portfolio volatility",
    use_case: "Ideal for risk-averse investors prioritizing capital preservation",
  },
  risk_parity_portfolio: {
    icon: Zap,
    title: "Risk Parity",
    subtitle: "Equal Risk Contribution",
    colorClasses: "border-orange-500 bg-orange-50",
    textColor: "text-orange-600",
    badgeClass: "bg-orange-100 text-orange-700",
    description: "Balanced risk contribution - each position contributes equally to risk",
    use_case: "Ideal for diversified investors seeking balanced risk exposure",
  },
  maximum_return_portfolio: {
    icon: Target,
    title: "Max Return",
    subtitle: "Highest Expected Return",
    colorClasses: "border-purple-500 bg-purple-50",
    textColor: "text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700",
    description: "Aggressive growth - concentrates in highest-return opportunities",
    use_case: "Ideal for aggressive investors with higher risk tolerance",
  },
};

function StrategyCard({ keyName, config, portfolio, isSelected, onClick }) {
  const Icon = config.icon;

  if (!portfolio) return null;

  // Determine performance indicators
  const sharpeRatio = portfolio?.sharpe_ratio || 0;
  const maxDrawdown = portfolio?.max_drawdown || 0;
  const volatility = portfolio?.volatility || 0;
  const expectedReturn = portfolio?.expected_return || 0;

  // Visual indicators for strategy quality
  const sharpeQuality = sharpeRatio > 1.0 ? "excellent" : sharpeRatio > 0.5 ? "good" : sharpeRatio > 0 ? "fair" : "poor";
  const riskLevel = volatility > 25 ? "high" : volatility > 15 ? "moderate" : "low";

  return (
    <motion.div
      key={keyName}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card
        className={`border-2 rounded-xl shadow-lg transition-all h-full ${
          config.colorClasses
        } ${isSelected ? "ring-2 ring-offset-2 ring-blue-400 shadow-xl" : "hover:shadow-xl"}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`w-7 h-7 ${config.textColor}`} />
              <div>
                <CardTitle className="text-slate-900">{config.title}</CardTitle>
                <p className="text-xs text-slate-500">{config.subtitle}</p>
              </div>
            </div>
            {isSelected && <Badge className="bg-blue-500 text-white">Selected</Badge>}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Core metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Return</p>
              <p className={`text-2xl font-bold ${config.textColor}`}>
                {expectedReturn.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Risk</p>
              <p className="text-2xl font-bold text-slate-900">{volatility.toFixed(2)}%</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Sharpe</p>
              <p className={`text-2xl font-bold ${config.textColor}`}>{sharpeRatio.toFixed(2)}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Max DD</p>
              <p className="text-2xl font-bold text-slate-900">{maxDrawdown.toFixed(2)}%</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/40 rounded-lg p-3 border border-white/50">
            <p className="text-sm text-slate-700">{config.description}</p>
          </div>

          {/* Use case */}
          <div className="bg-white/40 rounded-lg p-3 border border-white/50">
            <p className="text-xs font-semibold text-slate-600 mb-1">Best For:</p>
            <p className="text-sm text-slate-700">{config.use_case}</p>
          </div>

          {/* Quality badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-xs ${
              sharpeQuality === "excellent" ? "bg-green-100 text-green-700" :
              sharpeQuality === "good" ? "bg-blue-100 text-blue-700" :
              sharpeQuality === "fair" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              Sharpe: {sharpeQuality}
            </Badge>
            <Badge className={`text-xs ${
              riskLevel === "low" ? "bg-green-100 text-green-700" :
              riskLevel === "moderate" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              Risk: {riskLevel}
            </Badge>
          </div>

          {/* Return-to-risk indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Return/Risk Ratio:</span>
            <span className={`font-bold ${config.textColor}`}>
              {(expectedReturn / Math.max(volatility, 0.1)).toFixed(2)}x
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TempStrategyCardsAWS({ analysisResult, selectedStrategy, onStrategySelect }) {
  if (!analysisResult) return null;

  const handleStrategyClick = (strategyKey) => {
    if (onStrategySelect) {
      onStrategySelect(strategyKey);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Portfolio Strategies</h2>
        <p className="text-slate-600 text-sm mt-1">Compare four optimized allocation strategies</p>
      </div>

      {/* Strategy cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(strategyConfig).map(([key, config]) => {
          const portfolio = analysisResult[key];
          return (
            <StrategyCard
              key={key}
              keyName={key}
              config={config}
              portfolio={portfolio}
              isSelected={selectedStrategy === key}
              onClick={() => handleStrategyClick(key)}
            />
          );
        })}
      </div>

      {/* Strategy comparison summary */}
      <Card className="border-2 border-slate-200 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Strategy Comparison Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Best Sharpe */}
            <div className="flex items-start justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
              <div>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Best Risk-Adjusted Returns
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {analysisResult.optimal_portfolio?.sharpe_ratio > (analysisResult.risk_parity_portfolio?.sharpe_ratio || 0) 
                    ? "Optimal Portfolio" 
                    : "Risk Parity Portfolio"} 
                  {" "}offers the highest Sharpe ratio
                </p>
              </div>
            </div>

            {/* Lowest Risk */}
            <div className="flex items-start justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg">
              <div>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Lowest Volatility
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Minimum Variance Portfolio delivers the most stable returns with {(analysisResult.minimum_variance_portfolio?.volatility || 0).toFixed(2)}% volatility
                </p>
              </div>
            </div>

            {/* Highest Return */}
            <div className="flex items-start justify-between p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg">
              <div>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Highest Expected Return
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Maximum Return Portfolio targets {(analysisResult.maximum_return_portfolio?.expected_return || 0).toFixed(2)}% annual return
                </p>
              </div>
            </div>

            {/* Risk awareness */}
            <div className="flex items-start justify-between p-3 bg-gradient-to-r from-orange-50 to-transparent rounded-lg">
              <div>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Risk Parity Balance
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Equal risk contribution approach provides diversified downside protection
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
