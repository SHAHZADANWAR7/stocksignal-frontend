import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, GitMerge, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Multi-dimensional asset risk classification (100% data-driven)
const classifyAssetRiskProfile = (company) => {
  const traits = {
    profitability: null,
    valuation: null,
    stability: null,
    stage: null,
    financial: null,
    metrics: {}, // Store actual metrics for tooltips
    dataSources: company.data_sources || []
  };

  // 1. PROFITABILITY (Evidence-based: TTM EPS, Net Income, Profit Margin)
  // PRIMARY: P/E ratio is the most reliable indicator
  // P/E > 0 = company has positive earnings (profitable) yes
  // P/E < 0 = company has negative earnings (loss-making)
  // P/E = null/undefined = no earnings data or not applicable
  
  const hasPositivePE = company.pe_ratio && company.pe_ratio > 0;
  const hasNegativePE = company.pe_ratio && company.pe_ratio < 0;
  const hasPositiveEPS = company.eps_ttm && company.eps_ttm > 0;
  const hasPositiveMargin = company.profit_margin && company.profit_margin > 0;
  
  // PROFITABLE: If P/E is positive OR multiple profitability indicators
  if (hasPositivePE || (hasPositiveEPS && hasPositiveMargin)) {
    traits.profitability = { 
      status: 'profitable', 
      label: 'Profitable', 
      icon: CheckCircle, 
      color: 'emerald',
      tooltip: `P/E: ${company.pe_ratio?.toFixed(2) || 'N/A'}, TTM EPS: $${company.eps_ttm?.toFixed(2) || 'N/A'}, Profit Margin: ${(company.profit_margin * 100)?.toFixed(1) || 'N/A'}%`
    };
  } 
  // LOSS-MAKING: Negative P/E or negative EPS
  else if (hasNegativePE || (company.eps_ttm && company.eps_ttm < 0)) {
    traits.profitability = { 
      status: 'loss_making', 
      label: 'Loss-making', 
      icon: XCircle, 
      color: 'rose',
      tooltip: `TTM EPS: $${company.eps_ttm?.toFixed(2) || 'negative'}, Operating at a loss`
    };
  } 
  // PRE-PROFIT: No P/E data or unclear profitability
  else {
    traits.profitability = { 
      status: 'pre_profit', 
      label: 'Pre-profit', 
      icon: XCircle, 
      color: 'amber',
      tooltip: `No P/E ratio available. May be early-stage or lacking consistent earnings.`
    };
  }
  
  traits.metrics.profitability = {
    eps_ttm: company.eps_ttm,
    net_income: company.net_income,
    profit_margin: company.profit_margin,
    operating_margin: company.operating_margin,
    pe_ratio: company.pe_ratio
  };

  // 2. VALUATION SENSITIVITY (Multi-metric)
  const peRatio = company.pe_ratio || 0;
  const pegRatio = company.peg_ratio;
  const psRatio = company.price_to_sales || 0;
  const pbRatio = company.price_to_book || 0;
  
  if (peRatio > 40 || psRatio > 10 || (pegRatio && pegRatio > 2.5)) {
    traits.valuation = { 
      label: 'High valuation multiple', 
      color: 'amber',
      tooltip: `P/E: ${peRatio.toFixed(1)}, P/S: ${psRatio.toFixed(2)}, P/B: ${pbRatio.toFixed(2)}${pegRatio ? `, PEG: ${pegRatio.toFixed(2)}` : ''}`
    };
  } else if (peRatio > 25 || psRatio > 5) {
    traits.valuation = { 
      label: 'Growth-weighted valuation', 
      color: 'blue',
      tooltip: `P/E: ${peRatio.toFixed(1)}, P/S: ${psRatio.toFixed(2)} - priced for growth`
    };
  }
  
  traits.metrics.valuation = {
    pe_ratio: company.pe_ratio,
    peg_ratio: company.peg_ratio,
    price_to_sales: company.price_to_sales,
    price_to_book: company.price_to_book
  };

  // 3. EARNINGS STABILITY (Beta + Earnings Volatility)
  const betaValue = Math.abs(company.beta || 1);
  const earningsVol = company.earnings_volatility;
  const earningsGrowthVol = company.earnings_growth;
  
  if (betaValue > 1.8 || (earningsVol && earningsVol > 0.5)) {
    traits.stability = { 
      label: 'High volatility', 
      color: 'rose',
      tooltip: `5Y Beta: ${betaValue.toFixed(2)}${earningsVol ? `, EPS StdDev: ${earningsVol.toFixed(2)}` : ''} - significant price/earnings swings`
    };
  } else if (company.sector === 'Automotive' || company.sector === 'Energy') {
    traits.stability = { 
      label: 'Cyclical sector', 
      color: 'amber',
      tooltip: `${company.sector} sector - sensitive to economic cycles. Beta: ${betaValue.toFixed(2)}`
    };
  } else if (betaValue > 1.3 || (earningsGrowthVol && Math.abs(earningsGrowthVol) > 0.3)) {
    traits.stability = { 
      label: 'Moderate volatility', 
      color: 'amber',
      tooltip: `Beta: ${betaValue.toFixed(2)} - above-market volatility`
    };
  }
  
  traits.metrics.stability = {
    beta: company.beta,
    earnings_volatility: company.earnings_volatility,
    earnings_growth: company.earnings_growth
  };

  // 4. BUSINESS STAGE (Market Cap)
  const marketCap = company.market_cap || '';
  let capValue = 0;
  if (marketCap.includes('T')) {
    capValue = parseFloat(marketCap) * 1000;
  } else if (marketCap.includes('B')) {
    capValue = parseFloat(marketCap);
  } else if (marketCap.includes('M')) {
    capValue = parseFloat(marketCap) / 1000;
  }
  
  if (capValue > 0) {
    if (capValue < 0.3) {
      traits.stage = { 
        label: 'Micro-cap', 
        color: 'orange',
        tooltip: `Market cap: $${marketCap} - early stage, higher risk`
      };
    } else if (capValue < 2) {
      traits.stage = { 
        label: 'Small-cap', 
        color: 'amber',
        tooltip: `Market cap: $${marketCap} - emerging company`
      };
    } else if (capValue < 10) {
      traits.stage = { 
        label: 'Mid-cap', 
        color: 'blue',
        tooltip: `Market cap: $${marketCap} - established growth stage`
      };
    } else if (capValue < 200) {
      traits.stage = { 
        label: 'Large-cap', 
        color: 'emerald',
        tooltip: `Market cap: $${marketCap} - mature, established`
      };
    } else {
      traits.stage = { 
        label: 'Mega-cap', 
        color: 'purple',
        tooltip: `Market cap: $${marketCap} - market leader`
      };
    }
  }
  
  traits.metrics.stage = {
    market_cap: company.market_cap,
    market_cap_value: capValue
  };

  // 5. FINANCIAL HEALTH (Only flag if truly distressed)
  const isUnprofitable = traits.profitability.status !== 'profitable';
  const isSmall = capValue < 2;
  const hasNegativeMargins = company.operating_margin && company.operating_margin < 0;
  const hasVeryLowMargins = company.operating_margin && company.operating_margin > 0 && company.operating_margin < 0.05;
  
  // Only flag financial stress if BOTH unprofitable AND small-cap with negative margins
  if (isUnprofitable && isSmall && hasNegativeMargins) {
    traits.financial = { 
      label: 'Financial stress risk', 
      color: 'rose',
      tooltip: `Pre-profit small-cap with negative operating margin: ${(company.operating_margin * 100)?.toFixed(1)}%`
    };
  } 
  // Flag margin pressure only if unprofitable with very low margins
  else if (isUnprofitable && hasVeryLowMargins) {
    traits.financial = { 
      label: 'Margin pressure', 
      color: 'amber',
      tooltip: `Operating margin: ${(company.operating_margin * 100)?.toFixed(1)}% - profitability challenges`
    };
  }
  
  traits.metrics.financial = {
    operating_margin: company.operating_margin,
    profit_margin: company.profit_margin,
    revenue_growth: company.revenue_growth
  };

  return traits;
};

// Count elevated risk assets (excluding mere profitability status)
const countElevatedRiskAssets = (companies) => {
  return companies.filter(c => {
    const traits = classifyAssetRiskProfile(c);
    // Asset has elevated risk if it has any warning trait OR is not profitable
    const hasRiskTraits = traits.valuation || traits.stability || traits.financial;
    const isNotProfitable = traits.profitability.status !== 'profitable';
    // Count micro/small-cap as elevated only if also unprofitable or has other risks
    const hasStageRisk = traits.stage && (traits.stage.label === 'Micro-cap' || traits.stage.label === 'Small-cap') && (isNotProfitable || hasRiskTraits);
    return hasRiskTraits || isNotProfitable || hasStageRisk;
  }).length;
};

// Calculate truly speculative allocation (strict definition)
const calculateSpeculativeAllocation = (companies) => {
  const speculative = companies.filter(c => {
    const traits = classifyAssetRiskProfile(c);
    const marketCap = c.market_cap || '';
    let capValue = 0;
    
    if (marketCap.includes('T')) capValue = parseFloat(marketCap) * 1000;
    else if (marketCap.includes('B')) capValue = parseFloat(marketCap);
    else if (marketCap.includes('M')) capValue = parseFloat(marketCap) / 1000;
    
    // Speculative = NOT profitable (loss-making or pre-profit)
    // EXCLUDE profitable companies regardless of size or volatility
    const isUnprofitable = traits.profitability.status === 'loss_making' || traits.profitability.status === 'pre_profit';
    
    // Additional speculative factors (only if unprofitable)
    const isMicroCap = capValue > 0 && capValue < 0.3;
    const isSmallCapVolatile = capValue >= 0.3 && capValue < 2 && (traits.stability?.label === 'High volatility');
    
    return isUnprofitable || isMicroCap || isSmallCapVolatile;
  });
  
  return {
    count: speculative.length,
    ratio: companies.length > 0 ? speculative.length / companies.length : 0,
    assets: speculative.map(c => {
      const traits = classifyAssetRiskProfile(c);
      const reasons = [];
      if (traits.profitability.status !== 'profitable') reasons.push(traits.profitability.label);
      if (traits.stage?.label === 'Micro-cap') reasons.push('Micro-cap');
      if (traits.stage?.label === 'Small-cap' && traits.stability?.label === 'High volatility') reasons.push('Small-cap + High volatility');
      return {
        symbol: c.symbol,
        reasons
      };
    })
  };
};

export default function PortfolioQualityCard({ companies, portfolioQuality, similarityWarnings, diversificationRecommendations }) {
  const elevatedRiskCount = countElevatedRiskAssets(companies);
  const elevatedRiskRatio = companies.length > 0 ? elevatedRiskCount / companies.length : 0;
  const speculativeData = calculateSpeculativeAllocation(companies);
  
  // Data freshness indicator
  const dataDate = companies[0]?.last_updated ? new Date(companies[0].last_updated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';

  // Group risk warnings by category
  const riskDrivers = {
    concentration: [],
    correlation: [],
    volatility: []
  };

  if (portfolioQuality.warnings) {
    portfolioQuality.warnings.forEach(warning => {
      if (warning.includes('concentration') || warning.includes('concentrated')) {
        riskDrivers.concentration.push(warning);
      } else if (warning.includes('correlation') || warning.includes('similar')) {
        riskDrivers.correlation.push(warning);
      } else {
        riskDrivers.volatility.push(warning);
      }
    });
  }

  return (
    <Card className={`border-2 rounded-xl shadow-lg ${
      portfolioQuality.qualityScore >= 65 ? 'border-emerald-300 bg-emerald-50' :
      portfolioQuality.qualityScore >= 45 ? 'border-amber-300 bg-amber-50' :
      'border-rose-300 bg-rose-50'
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            portfolioQuality.qualityScore >= 65 ? 'bg-gradient-to-br from-emerald-600 to-teal-600' :
            portfolioQuality.qualityScore >= 45 ? 'bg-gradient-to-br from-amber-600 to-orange-600' :
            'bg-gradient-to-br from-rose-600 to-red-600'
          }`}>
            <Activity className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h4 className={`font-bold text-xl ${
                portfolioQuality.qualityScore >= 65 ? 'text-emerald-900' :
                portfolioQuality.qualityScore >= 45 ? 'text-amber-900' :
                'text-rose-900'
              }`}>
                Portfolio Quality Assessment
              </h4>
              <div className="flex items-center gap-2">
                <Badge className={`text-xl font-bold px-4 py-1.5 ${
                  portfolioQuality.qualityScore >= 80 ? 'bg-emerald-200 text-emerald-900 border-2 border-emerald-400' :
                  portfolioQuality.qualityScore >= 65 ? 'bg-blue-200 text-blue-900 border-2 border-blue-400' :
                  portfolioQuality.qualityScore >= 45 ? 'bg-amber-200 text-amber-900 border-2 border-amber-400' :
                  portfolioQuality.qualityScore >= 25 ? 'bg-orange-200 text-orange-900 border-2 border-orange-400' :
                  'bg-rose-200 text-rose-900 border-2 border-rose-400'
                }`}>
                  {portfolioQuality.qualityScore}/100
                </Badge>
                <Badge className={`text-sm px-3 py-1 border-2 ${
                  portfolioQuality.qualityScore >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  portfolioQuality.qualityScore >= 65 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  portfolioQuality.qualityScore >= 45 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {portfolioQuality.qualityBand}
                </Badge>
              </div>
            </div>
            
            {/* Score explanation */}
            <p className={`text-sm mb-3 italic ${
              portfolioQuality.qualityScore >= 65 ? 'text-emerald-800' :
              portfolioQuality.qualityScore >= 45 ? 'text-amber-800' :
              'text-rose-800'
            }`}>
              {portfolioQuality.bandExplanation}
            </p>

            {/* Score justification */}
            {portfolioQuality.scoreJustification && (
              <div className="mb-3 p-3 bg-white/60 rounded-lg border border-slate-300">
                <p className="text-xs text-slate-700">
                  <strong>Score Rationale:</strong> {portfolioQuality.scoreJustification}
                </p>
              </div>
            )}

            {/* KPI Tiles - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Sharpe Ratio KPI */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`bg-white/80 p-3 rounded-lg border-2 cursor-help ${
                      (portfolioQuality.avgSharpe || 0) >= 0.5 ? 'border-emerald-300' :
                      (portfolioQuality.avgSharpe || 0) >= 0.3 ? 'border-blue-300' :
                      (portfolioQuality.avgSharpe || 0) >= 0 ? 'border-amber-300' :
                      'border-rose-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                        <p className="text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-wide">Avg Sharpe</p>
                      </div>
                      <p className={`text-xl md:text-2xl font-bold break-words ${
                        (portfolioQuality.avgSharpe || 0) >= 0.5 ? 'text-emerald-700' :
                        (portfolioQuality.avgSharpe || 0) >= 0.3 ? 'text-blue-700' :
                        (portfolioQuality.avgSharpe || 0) >= 0 ? 'text-amber-700' :
                        'text-rose-700'
                      }`}>
                        {portfolioQuality.avgSharpe?.toFixed(3) || 'N/A'}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-1">
                        {(portfolioQuality.avgSharpe || 0) >= 0.5 ? 'Good' :
                         (portfolioQuality.avgSharpe || 0) >= 0.3 ? 'Fair' :
                         (portfolioQuality.avgSharpe || 0) >= 0 ? 'Below avg' :
                         'Negative'}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Risk-adjusted return: (Return - Risk-Free Rate) / Volatility. Higher is better. &gt;0.5 is good, &gt;1.0 is excellent.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Correlation KPI */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`bg-white/80 p-3 rounded-lg border-2 cursor-help ${
                      (portfolioQuality.avgCorrelation || 0) <= 0.5 ? 'border-emerald-300' :
                      (portfolioQuality.avgCorrelation || 0) <= 0.7 ? 'border-amber-300' :
                      'border-rose-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <GitMerge className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                        <p className="text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-wide">Correlation</p>
                      </div>
                      <p className={`text-xl md:text-2xl font-bold break-words ${
                        (portfolioQuality.avgCorrelation || 0) <= 0.5 ? 'text-emerald-700' :
                        (portfolioQuality.avgCorrelation || 0) <= 0.7 ? 'text-amber-700' :
                        'text-rose-700'
                      }`}>
                        {((portfolioQuality.avgCorrelation || 0) * 100).toFixed(0)}%
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">
                        {(portfolioQuality.avgCorrelation || 0) <= 0.5 ? 'Well diversified' :
                         (portfolioQuality.avgCorrelation || 0) <= 0.7 ? 'Moderate' :
                         'High overlap'}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Average correlation between assets. Lower is better for diversification. &lt;50% is good, &gt;75% reduces diversification benefits.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Speculative Exposure KPI */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`bg-white/80 p-3 rounded-lg border-2 cursor-help ${
                      speculativeData.ratio <= 0.2 ? 'border-emerald-300' :
                      speculativeData.ratio <= 0.5 ? 'border-amber-300' :
                      'border-rose-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                        <p className="text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-wide">Speculative</p>
                      </div>
                      <p className={`text-xl md:text-2xl font-bold break-words ${
                        speculativeData.ratio <= 0.2 ? 'text-emerald-700' :
                        speculativeData.ratio <= 0.5 ? 'text-amber-700' :
                        'text-rose-700'
                      }`}>
                        {(speculativeData.ratio * 100).toFixed(0)}%
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-1">
                        {speculativeData.count} of {companies.length} assets
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs max-w-xs">
                      <p className="font-semibold mb-1">Speculative Assets ({speculativeData.count}):</p>
                      {speculativeData.assets.length > 0 ? (
                        <ul className="space-y-1">
                          {speculativeData.assets.map(asset => (
                            <li key={asset.symbol}>
                              <span className="font-semibold">{asset.symbol}:</span> {asset.reasons.join(', ')}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No speculative assets detected. All holdings are profitable.</p>
                      )}
                      <p className="mt-2 text-slate-400">
                        Definition: Unprofitable, micro-cap, or small-cap with high volatility
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Asset Risk Profile Breakdown */}
            <div className="mt-4 p-4 bg-white/70 rounded-lg border border-slate-300">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Asset Risk Profile Breakdown
                </h5>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-help">
                        Data: {dataDate}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Sources: {companies[0]?.data_sources?.join(', ') || 'Yahoo Finance, Finnhub'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {companies.map(company => {
                  const traits = classifyAssetRiskProfile(company);
                  const Profitability = traits.profitability.icon;
                  
                  return (
                    <div key={company.symbol} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{company.symbol}</p>
                          <p className="text-xs text-slate-600 truncate">{company.name}</p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <Profitability className={`w-5 h-5 ${
                                  traits.profitability.status === 'profitable' ? 'text-emerald-600' : 'text-rose-600'
                                }`} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs max-w-xs">
                                <p className="font-semibold mb-1">{traits.profitability.label}</p>
                                <p>{traits.profitability.tooltip}</p>
                                <p className="text-slate-400 mt-1 text-[10px]">Source: {traits.dataSources.join(', ')}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Profitability Status */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className={`text-xs cursor-help ${
                                traits.profitability.status === 'profitable' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : traits.profitability.status === 'loss_making'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {traits.profitability.label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs max-w-xs">
                                <p className="font-semibold mb-1">Profitability Metrics</p>
                                <p>TTM EPS: ${traits.metrics.profitability.eps_ttm?.toFixed(2) || 'N/A'}</p>
                                <p>Profit Margin: {(traits.metrics.profitability.profit_margin * 100)?.toFixed(1) || 'N/A'}%</p>
                                <p>P/E Ratio: {traits.metrics.profitability.pe_ratio?.toFixed(2) || 'N/A'}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* Valuation Trait */}
                        {traits.valuation && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={`text-xs cursor-help bg-${traits.valuation.color}-100 text-${traits.valuation.color}-800`}>
                                  ⚠ {traits.valuation.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs max-w-xs">
                                  <p className="font-semibold mb-1">Valuation Metrics</p>
                                  <p>{traits.valuation.tooltip}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {/* Stability Trait */}
                        {traits.stability && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={`text-xs cursor-help bg-${traits.stability.color}-100 text-${traits.stability.color}-800`}>
                                  ⚠ {traits.stability.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs max-w-xs">
                                  <p className="font-semibold mb-1">Volatility Analysis</p>
                                  <p>{traits.stability.tooltip}</p>
                                  {traits.metrics.stability.earnings_volatility && (
                                    <p className="mt-1">EPS Std Dev: {traits.metrics.stability.earnings_volatility.toFixed(2)}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {/* Stage Trait */}
                        {traits.stage && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={`text-xs cursor-help bg-${traits.stage.color}-100 text-${traits.stage.color}-800`}>
                                  {traits.stage.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs max-w-xs">
                                  <p>{traits.stage.tooltip}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {/* Financial Health Trait */}
                        {traits.financial && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={`text-xs cursor-help bg-${traits.financial.color}-100 text-${traits.financial.color}-800`}>
                                  ⚠ {traits.financial.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs max-w-xs">
                                  <p className="font-semibold mb-1">Financial Health</p>
                                  <p>{traits.financial.tooltip}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-slate-700 font-semibold mb-1">
                  📊 Data-Driven Classification
                </p>
                <p className="text-xs text-slate-600">
                  All metrics sourced from {companies[0]?.data_sources?.join(', ') || 'Yahoo Finance, Finnhub'} using TTM financial data, 
                  5-year beta calculations, and latest quarterly earnings. Profitability based on P/E ratio, TTM EPS, and profit margins. 
                  Hover over any badge for detailed metrics and explanations.
                </p>
              </div>
            </div>

            {/* Primary Risk Drivers */}
            {(riskDrivers.concentration.length > 0 || riskDrivers.correlation.length > 0 || riskDrivers.volatility.length > 0) && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-300">
                <h5 className="text-sm font-bold text-amber-900 mb-3">Primary Risk Drivers</h5>
                <div className="space-y-2 text-sm text-amber-800">
                  {riskDrivers.concentration.map((warning, idx) => (
                    <div key={`conc-${idx}`} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold flex-shrink-0">🔴</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                  {riskDrivers.correlation.map((warning, idx) => (
                    <div key={`corr-${idx}`} className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold flex-shrink-0">🟠</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                  {riskDrivers.volatility.map((warning, idx) => (
                    <div key={`vol-${idx}`} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold flex-shrink-0">🟡</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similarity Warnings */}
            {similarityWarnings && similarityWarnings.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-300">
                <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <GitMerge className="w-4 h-4" />
                  Asset Similarity Analysis
                </h5>
                <div className="mb-2">
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${Math.min(100, (portfolioQuality.avgCorrelation || 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {(portfolioQuality.avgCorrelation || 0) >= 0.75 ? 'High overlap in risk & growth characteristics' :
                     (portfolioQuality.avgCorrelation || 0) >= 0.6 ? 'Moderate overlap in asset profiles' :
                     'Reasonable asset differentiation'}
                  </p>
                </div>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  {similarityWarnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diversification Recommendations */}
            {diversificationRecommendations && diversificationRecommendations.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-300">
                <p className="text-sm font-semibold text-emerald-900 mb-2">
                  💡 Suggested Improvements (Optional)
                </p>
                {diversificationRecommendations.map((rec, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <p className="text-xs text-emerald-800 font-semibold">{rec.message}:</p>
                    <p className="text-xs text-emerald-700 ml-3">
                      {rec.suggestions.join(' • ')}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-emerald-600 mt-2 italic">
                  Note: These are suggestions only. You're free to proceed with your current selections.
                </p>
              </div>
            )}

            {portfolioQuality.avgSharpe < 0 && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg border border-rose-300">
                <p className="text-sm font-semibold text-rose-900">
                  ⚠️ <strong>Advisory:</strong> Selected assets show negative risk-adjusted returns. 
                  Results reflect best allocation among current choices, not guaranteed positive returns.
                </p>
                <p className="text-xs text-rose-800 mt-2">
                  <strong>Why:</strong> When all assets have poor Sharpe ratios (return/risk), even optimal allocation may underperform.
                  Consider adding stable, profitable assets or broad market ETFs.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
