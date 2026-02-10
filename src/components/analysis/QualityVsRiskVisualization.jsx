import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Info } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label } from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Sector mapping for accurate labelingg
 */
const SECTOR_MAPPINGS = {
  'GOOGL': 'Technology',
  'GOOG': 'Technology',
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'META': 'Technology',
  'AMZN': 'Consumer Discretionary',
  'TSLA': 'Consumer Discretionary',
  'NFLX': 'Communication Services',
  'NVDA': 'Technology',
  'AMD': 'Technology',
  'INTC': 'Technology',
  'LOGI': 'Technology',
  'GPRO': 'Technology',
  'SOUN': 'Technology',
  'WW': 'Consumer Discretionary',
  'BA': 'Industrials',
  'CAT': 'Industrials',
  'XOM': 'Energy',
  'CVX': 'Energy',
  'JPM': 'Finance',
  'BAC': 'Finance',
  'JNJ': 'Healthcare',
  'PFE': 'Healthcare',
  'KO': 'Consumer',
  'PEP': 'Consumer',
  'WMT': 'Consumer',
  'TGT': 'Consumer Discretionary',
  'HD': 'Consumer Discretionary',
  'DIS': 'Communication Services',
  'V': 'Finance',
  'MA': 'Finance'
};

function getCorrectSector(symbol, fallbackSector) {
  if (SECTOR_MAPPINGS[symbol]) {
    return SECTOR_MAPPINGS[symbol];
  }
  return fallbackSector && fallbackSector !== 'Unknown' ? fallbackSector : 'Technology';
}

export default function QualityVsRiskVisualization({ qualityScore, portfolioRisk, expectedDrawdown, avgSharpe, avgCorrelation, speculativeRatio, companies }) {
  // Map quality scores to typical risk ranges for context
  const qualityRiskBenchmarks = [
    { quality: 95, typicalRisk: 12, label: "Institutional" },
    { quality: 80, typicalRisk: 16, label: "Exceptional" },
    { quality: 65, typicalRisk: 22, label: "Strong" },
    { quality: 45, typicalRisk: 30, label: "Acceptable" },
    { quality: 25, typicalRisk: 45, label: "Weak" },
    { quality: 10, typicalRisk: 65, label: "Poor" }
  ];

  const currentPoint = [{ quality: qualityScore, risk: portfolioRisk, label: "Your Portfolio" }];

  // Determine if portfolio is high quality with high risk (educational alert)
  const isHighQualityHighRisk = qualityScore >= 65 && portfolioRisk > 30;
  const isLowQualityHighRisk = qualityScore < 45 && portfolioRisk > 35;

  // Dynamic calculations from actual portfolio data with correct sector mapping
  const sectors = companies 
    ? companies
        .map(c => getCorrectSector(c.symbol, c.sector))
        .filter(s => s && s !== 'Unknown' && s.trim() !== '')
    : [];
  const sectorCount = new Set(sectors).size;
  
  // Calculate actual speculative count (matching Portfolio Quality Assessment logic)
  const speculativeCount = companies ? companies.filter(c => {
    const hasPositivePE = c.pe_ratio && c.pe_ratio > 0;
    const hasPositiveEPS = c.eps_ttm && c.eps_ttm > 0;
    const hasPositiveMargin = c.profit_margin && c.profit_margin > 0;
    const isProfitable = hasPositivePE || (hasPositiveEPS && hasPositiveMargin);
    
    const marketCap = c.market_cap || '';
    let capValue = 0;
    if (marketCap.includes('T')) capValue = parseFloat(marketCap) * 1000;
    else if (marketCap.includes('B')) capValue = parseFloat(marketCap);
    else if (marketCap.includes('M')) capValue = parseFloat(marketCap) / 1000;
    
    const isMicroCap = capValue > 0 && capValue < 0.3;
    const isSmallCapVolatile = capValue >= 0.3 && capValue < 2 && (c.beta && Math.abs(c.beta) > 1.5);
    
    return !isProfitable || isMicroCap || isSmallCapVolatile;
  }).length : 0;
  
  const actualSpeculativeRatio = companies && companies.length > 0 ? speculativeCount / companies.length : (speculativeRatio || 0);
  
  // S&P 500 benchmark for Sharpe comparison (historical average ~0.4-0.5)
  const sp500BenchmarkSharpe = 0.45;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-blue-900 mb-1">
              Quality Score vs Portfolio Risk
            </h4>
            <p className="text-sm text-blue-800">
              Quality measures diversification effectiveness (Sharpe, correlation, sector spread). Risk measures annualized volatility.
            </p>
          </div>
        </div>

        {/* Visualization */}
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 50, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="quality" 
              domain={[0, 100]}
              label={{ value: 'Quality Score', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="risk" 
              domain={[0, Math.max(80, portfolioRisk + 10)]}
              label={{ 
                value: 'Annualized Volatility (%)', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10,
                style: { 
                  textAnchor: 'middle', 
                  fontSize: '12px', 
                  fill: '#475569', 
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }
              }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border-2 border-blue-300 rounded-lg shadow-lg">
                      <p className="font-bold text-slate-900">{data.label}</p>
                      <p className="text-sm text-blue-700">Quality: {data.quality}/100</p>
                      <p className="text-sm text-rose-700">Risk: {typeof data.risk === "number" && Number.isFinite(data.risk) ? data.risk.toFixed(1) : "Not Available"}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Benchmark points */}
            <Scatter data={qualityRiskBenchmarks} fill="#cbd5e1" opacity={0.3} />
            {/* Current portfolio */}
            <Scatter data={currentPoint} fill="#3b82f6">
              <Label value="Your Portfolio" position="top" fill="#1e40af" />
            </Scatter>
            <ReferenceLine y={portfolioRisk} stroke="#ef4444" strokeDasharray="5 5" />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Key Insight */}
        <div className="mt-4 space-y-3">
          {isHighQualityHighRisk && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">High Quality ≠ Low Risk</p>
                  <p className="text-xs text-amber-800 mb-2">
                    Your {qualityScore}/100 quality score reflects <strong>effective diversification</strong> and 
                    balanced allocations. However, with {typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}% annualized volatility{actualSpeculativeRatio > 0 ? ` and ${typeof actualSpeculativeRatio === "number" && Number.isFinite(actualSpeculativeRatio) ? (actualSpeculativeRatio * 100).toFixed(0) : "Not Available"}% speculative exposure (${speculativeCount} of ${companies?.length || 0} assets)` : ''}, 
                    tail-risk drawdowns may be significant.
                  </p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded cursor-help">
                          <Info className="w-3 h-3" />
                          <span>Est. worst-case drawdown: {typeof expectedDrawdown === "number" && Number.isFinite(expectedDrawdown) ? expectedDrawdown.toFixed(0) : "Not Available"}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          This represents a <strong>tail-risk scenario</strong> (e.g., 2008-style market crash), 
                          not the typical expected drawdown. Based on 95th percentile statistical estimate using 
                          Cornish-Fisher VaR method and historical crisis data. Educational purposes only.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}

          {isLowQualityHighRisk && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-rose-900">
                  <p className="font-semibold mb-1">⚠️ High Risk + Limited Diversification</p>
                  <p className="text-xs text-rose-800 mb-2">
                    Quality score of {qualityScore}/100 combined with {typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}% annualized volatility indicates 
                    elevated portfolio fragility. Consider adding uncorrelated assets (bonds, index funds) to improve risk-adjusted returns.
                  </p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-100 px-2 py-1 rounded cursor-help">
                          <Info className="w-3 h-3" />
                          <span>Est. tail-risk drawdown: {typeof expectedDrawdown === "number" && Number.isFinite(expectedDrawdown) ? expectedDrawdown.toFixed(0) : "Not Available"}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          This represents a <strong>worst-case scenario</strong> based on historical market crashes 
                          and current portfolio composition. Not a typical expected drawdown. Used for stress testing only.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}

          {/* Always show educational context - fully dynamic */}
          <div className="p-3 bg-white/70 rounded-lg border border-slate-300 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-700">
                <p className="font-semibold mb-2">Understanding Quality vs Risk (Your Portfolio)</p>
                <div className="space-y-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="font-semibold mb-1">
                      <strong>Quality Score ({qualityScore}/100):</strong> Diversification effectiveness based on:
                    </p>
                    <ul className="ml-4 mt-1 space-y-1 list-disc">
                      <li>
                        <span className="font-medium">Sharpe ratio:</span> {typeof avgSharpe === "number" && Number.isFinite(avgSharpe) ? avgSharpe.toFixed(3) : "Not Available"} 
                        {avgSharpe >= sp500BenchmarkSharpe 
                          ? ` (Above S&P 500 avg ~${sp500BenchmarkSharpe.toFixed(2)})` 
                          : avgSharpe >= 0.3 
                          ? ' (Fair)' 
                          : ` (Below S&P 500 avg ~${sp500BenchmarkSharpe.toFixed(2)})`}
                      </li>
                      <li>
                        <span className="font-medium">Avg correlation:</span> {typeof avgCorrelation === "number" && Number.isFinite(avgCorrelation) ? ((avgCorrelation || 0) * 100).toFixed(0) : "Not Available"}% 
                        {avgCorrelation <= 0.5 ? ' (Low - good)' : avgCorrelation <= 0.7 ? ' (Moderate)' : ' (High - limited diversification)'}
                      </li>
                      <li>
                        <span className="font-medium">Sector diversity:</span> {sectorCount} unique sector{sectorCount !== 1 ? 's' : ''}
                        {sectorCount > 0 && (
                          <span className="text-slate-600 ml-1 font-semibold">
                            ({Array.from(new Set(sectors)).join(', ')})
                          </span>
                        )}
                        {sectorCount >= 3 ? ' ✓' : sectorCount >= 2 ? ' (consider adding more)' : ' (needs diversification)'}
                      </li>
                      <li>
                        <span className="font-medium">Speculative exposure:</span> {typeof actualSpeculativeRatio === "number" && Number.isFinite(actualSpeculativeRatio) ? (actualSpeculativeRatio * 100).toFixed(0) : "Not Available"}% ({speculativeCount} of {companies?.length || 0} assets) 
                        {actualSpeculativeRatio <= 0.2 ? ' (Low)' : actualSpeculativeRatio <= 0.5 ? ' (Moderate)' : ' (High)'}
                      </li>
                    </ul>
                  </div>
                  
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help bg-rose-50 p-2 rounded">
                          <p>
                            <strong>Portfolio Risk ({typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}%):</strong> Annualized volatility (σ) 
                            <Info className="w-3 h-3 inline ml-1 text-rose-600" />
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          <strong>Volatility Definition:</strong> Expected standard deviation of annual returns. 
                          With {typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}% volatility, in a typical year your portfolio might return 
                          ±{typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}% from the expected value. This measures normal fluctuations, 
                          NOT crash scenarios or drawdowns.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                  
                  <div className="bg-slate-50 p-2 rounded border-l-4 border-slate-400">
                    <p className="font-semibold text-slate-800 mb-1">
                      Key Insight: Quality and Risk are Independent
                    </p>
                    <p className="text-slate-600">
                      • High quality + high risk = well-diversified aggressive portfolio
                      <br/>• Low quality + low risk = concentrated but conservative
                      <br/>• Both can exist - quality ≠ safety
                    </p>
                  </div>

                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help bg-amber-50 p-2 rounded border border-amber-300">
                          <p className="text-amber-800 text-xs font-semibold">
                            💡 How to improve: Add low-correlation assets (bonds, gold, real estate ETFs) 
                            <Info className="w-3 h-3 inline ml-1" />
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-semibold mb-1">Projected Impact on Your Portfolio:</p>
                        <p className="text-xs mb-2">
                          Adding 20% bonds (BND, correlation ~0.1-0.2 with stocks):
                          <br/>• Quality score: {qualityScore} → {typeof qualityScore === "number" && Number.isFinite(qualityScore) ? Math.min(100, qualityScore + 10) : "Not Available"} (+{typeof qualityScore === "number" && Number.isFinite(qualityScore) ? Math.min(35, Math.round((100 - qualityScore) * 0.3)) : "Not Available"} pts)
                          <br/>• Avg correlation: {typeof avgCorrelation === "number" && Number.isFinite(avgCorrelation) ? ((avgCorrelation || 0) * 100).toFixed(0) : "Not Available"}% → {typeof avgCorrelation === "number" && Number.isFinite(avgCorrelation) ? Math.max(20, ((avgCorrelation || 0) * 100) - 15).toFixed(0) : "Not Available"}% (-10-20%)
                          <br/>• Portfolio volatility: {typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}% → {typeof portfolioRisk === "number" && Number.isFinite(portfolioRisk) ? Math.max(8, portfolioRisk * 0.85).toFixed(1) : "Not Available"}% (-10-15%)
                          <br/>• Tail-risk drawdown: {typeof expectedDrawdown === "number" && Number.isFinite(expectedDrawdown) ? expectedDrawdown.toFixed(0) : "Not Available"}% → {typeof expectedDrawdown === "number" && Number.isFinite(expectedDrawdown) ? Math.max(-60, expectedDrawdown * 0.75).toFixed(0) : "Not Available"}% (-20-30%)
                        </p>
                        <p className="text-xs text-slate-500 border-t border-amber-300 pt-2 mt-2">
                          💡 See "Impact Delta Analysis" below for precise, simulation-based calculations
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
