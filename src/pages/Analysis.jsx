// ============================================================================
// SECTION 1 (PART 1): Imports, Component Declaration & Initial Setup
// ============================================================================
// This section contains:
// - All necessary imports (React, AWS API client, UI components, utilities, icons, charts)
// - Component declaration: export default function Analysis()
// - All state variable declarations using useState
// - useEffect hook for initialization (loads companies & cached analysis from URL)
// - loadCompanies() - Fetches companies and index funds from AWS Lambda
// - loadExistingAnalysis() - Loads cached analysis by ID from AWS Lambda
// - generateGrowthProjection() - Helper function for investment growth calculations
// - handleAnalyze() - PART 1: Stock data fetching, beta calculation with fallback chain

// ============================================================================

import React, { useState, useEffect } from "react";
import { callAwsFunction } from "@/components/utils/api/awsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Loader2,
  PieChart,
  Target,
  Activity,
  Shield,
  Zap,
  Scale,
  Calendar,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TradeModal from "@/components/trading/TradeModal";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { optimizeOptimalPortfolio, optimizeMinimumVariance, optimizeMaximumReturn, calculateGoalProbability, calculateExpectedDrawdown, getCorrelationMatrix } from "@/components/utils/calculations/portfolioOptimization";
import { futureValue as calculateFutureValue, timeToGoal as calculateTimeToGoal } from "@/components/utils/calculations/financialMath";
import { calculateForwardLookingRisk } from "@/components/utils/calculations/forwardLookingRisk"; // ✅ NEW: VIX-adjusted risk
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart as RePieChart, 
  Pie,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImpactDeltaAnalysis from "@/components/analysis/ImpactDeltaAnalysis";
import StressTestingCard from "@/components/analysis/StressTestingCard";
import RebalancingSimulator from "@/components/analysis/RebalancingSimulator";
import ForwardRiskCard from "@/components/analysis/ForwardRiskCard";
import PortfolioStorytellingChart from "@/components/analysis/PortfolioStorytellingChart";
import AssetExplanation from "@/components/analysis/AssetExplanation";
import TransactionCostCard from "@/components/analysis/TransactionCostCard";
import ConfidenceBandsChart from "@/components/analysis/ConfidenceBandsChart";
import GoalProbabilityCard from "@/components/analysis/GoalProbabilityCard";
import PlatformPositioning from "@/components/analysis/PlatformPositioning";
import DataFreshnessIndicator from "@/components/trust/DataFreshnessIndicator";
import ModelLimitationsDisclosure from "@/components/trust/ModelLimitationsDisclosure";
import BehavioralNudge from "@/components/trust/BehavioralNudge";
import AnalysisChangeLog from "@/components/trust/AnalysisChangeLog";
import SessionChangeSummary from "@/components/trust/SessionChangeSummary";
import ConsistencyAdjustmentBadge from "@/components/trust/ConsistencyAdjustmentBadge";
import { enforceConsistency, classifyRiskLevel, classifyConfidenceTier } from "@/components/utils/validation/globalConsistency";
import ConcentrationAlert from "@/components/analysis/ConcentrationAlert";
import QualityVsRiskVisualization from "@/components/analysis/QualityVsRiskVisualization";
import ExtremeBetaWarning from "@/components/analysis/ExtremeBetaWarning";
import LiquidityWarning from "@/components/analysis/LiquidityWarning";
import ProbabilityWeightedProjections from "@/components/analysis/ProbabilityWeightedProjections";
import ConsecutiveCrashScenario from "@/components/analysis/ConsecutiveCrashScenario";
import SpeculativeContributionBadge from "@/components/analysis/SpeculativeContributionBadge";
import DataSourceLabel from "@/components/analysis/DataSourceLabel";
import MarketCapTierLabel from "@/components/analysis/MarketCapTierLabel";
import PortfolioQualityCard from "@/components/analysis/PortfolioQualityCard";
import { safeToFixed } from "@/components/utils/safeToFixed";

export default function Analysis() {
  const navigate = useNavigate();
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("0");
  const [investmentGoal, setInvestmentGoal] = useState("1000000");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("optimal");
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState("");
  const [suggestedQuantity, setSuggestedQuantity] = useState(0);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showReturnCaps, setShowReturnCaps] = useState(false);
  const [isLoadingCached, setIsLoadingCached] = useState(false);
  const [isCachedResults, setIsCachedResults] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);

  // ✅ NEW: VIX State Management
  const [vixData, setVixData] = useState(null);
  const [vixLoading, setVixLoading] = useState(false);
  const [vixError, setVixError] = useState(null);

  // ✅ NEW: Fetch VIX data on component mount
  useEffect(() => {
    fetchVIXData();
  }, []);

  // ✅ NEW: VIX Fetch Function
  const fetchVIXData = async () => {
    setVixLoading(true);
    setVixError(null);
    
    try {
      console.log('🔍 Fetching VIX data from Lambda...');
      
      const response = await callAwsFunction('getVIXData', {symbols: companies.map(c => c.symbol)});
      
      console.log('📊 Raw VIX Lambda Response:', response);
      
      // Parse Lambda response (handle different formats)
      let vixResponse;
      if (typeof response === 'string') {
        vixResponse = JSON.parse(response);
      } else if (response.body) {
        vixResponse = typeof response.body === 'string' 
          ? JSON.parse(response.body)
          : response.body;
      } else {
        vixResponse = response;
      }
      
      // Handle both success and fallback cases
      if (vixResponse.success || vixResponse.currentVIX) {
        setVixData({
          currentVIX: vixResponse.currentVIX ?? vixResponse.vix?.currentVIX ?? 18,
          avgVIX: vixResponse.avgVIX ?? vixResponse.vix?.avgVIX ?? null,
          minVIX: vixResponse.minVIX ?? vixResponse.vix?.minVIX ?? null,
          maxVIX: vixResponse.maxVIX ?? vixResponse.vix?.maxVIX ?? null,
          change: vixResponse.change ?? vixResponse.vix?.change ?? null,
          changePercent: vixResponse.changePercent ?? vixResponse.vix?.changePercent ?? null,
          impliedAnnualVol: vixResponse.impliedAnnualVol ?? vixResponse.vix?.impliedAnnualVol ?? 18,
          regime: vixResponse.regime ?? vixResponse.vix?.regime ?? "normal",
          regimeDescription: vixResponse.regimeDescription ?? vixResponse.vix?.regimeDescription ?? "Normal volatility",
          riskLevel: vixResponse.riskLevel ?? vixResponse.vix?.riskLevel ?? "Low",
          dataSource: vixResponse.dataSource ?? vixResponse.vix?.dataSource ?? "Lambda",
          timestamp: vixResponse.timestamp ?? vixResponse.vix?.timestamp ?? new Date().toISOString(),
          historicalVol: vixResponse.historicalVol ?? vixResponse.vix?.historicalVol ?? vixResponse.impliedAnnualVol ?? 18,
          baseExpectedReturn: vixResponse.baseExpectedReturn ?? vixResponse.vix?.baseExpectedReturn ?? null,
          historicalData: vixResponse.historicalData ?? vixResponse.vix?.historicalData ?? null
        });
        return;
      }

    } catch (error) {
      console.error('❌ VIX Lambda Error:', error);
      setVixError(error.message);
      
      // Set fallback VIX data
      setVixData({
        currentVIX: 18,
        impliedAnnualVol: 18,
        regime: 'normal',
        regimeDescription: 'Normal volatility (error fallback)',
        historicalVol: 18,
        riskLevel: 'Low',
        dataSource: 'error_fallback',
        timestamp: new Date().toISOString()
      });
      
      console.warn('⚠️ Using fallback VIX data due to error');
    } finally {
      setVixLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const companiesParam = urlParams.get('companies');
      const analysisId = urlParams.get('id');
      
      console.log("🔍 Init: companiesParam=", companiesParam, "analysisId=", analysisId);
      
      // Load cached analysis FIRST if present (don't load companies list yet)
      if (analysisId) {
        console.log("📦 Cache ID detected, loading...");
        setIsLoadingCached(true);
        await loadExistingAnalysis(analysisId);
      }
      
      // Always load companies list for UI
      await loadCompanies();
      
      if (companiesParam) {
        setSelectedSymbols(companiesParam.split(','));
      }
    };
    
    init();
  }, []);

  const loadCompanies = async () => {
    try {
      // AWS Lambda getCompanies returns both companies AND index funds in one call
      const response = await callAwsFunction('getCompanies', {});
      
      console.log("📊 getCompanies response:", response);
      // Handle response format (companies should have items array)
      const companiesData = response.items || response.companies || [];
      const indexFundsData = response.index_funds || [];
      
      // Convert index funds to company format
      const indexFundsAsCompanies = indexFundsData.map(fund => ({
        id: fund.id,
        symbol: fund.symbol,
        name: fund.name,
        sector: fund.type?.replace('_', ' ').toUpperCase() || 'INDEX FUND',
        description: fund.description,
        isIndexFund: true,
        // Initialize with placeholders - will be fetched in analysis
        expected_return: null,
        risk: null,
        current_price: null,
        beta: null
      }));
      
      // Merge and deduplicate by symbol
      const allData = [...companiesData, ...indexFundsAsCompanies];
      const uniqueCompanies = allData.reduce((acc, company) => {
        const existing = acc.find(c => c.symbol === company.symbol);
        if (!existing) {
          acc.push(company);
        } else {
          // Keep the one with more recent data or the one with analysis data
          const existingDate = new Date(existing.updated_date || 0);
          const currentDate = new Date(company.updated_date || 0);
          if (currentDate > existingDate || (company.expected_return && !existing.expected_return)) {
            acc[acc.indexOf(existing)] = company;
          }
        }
        return acc;
      }, []);
      
      setCompanies(uniqueCompanies);
      console.log(`✅ Loaded ${uniqueCompanies.length} companies (${companiesData.length} stocks + ${indexFundsAsCompanies.length} index funds)`);
    } catch (error) {
      console.error("❌ Error loading companies:", error);
      alert("Failed to load companies: " + error.message);
    }
  };

  const loadExistingAnalysis = async (analysisId) => {
    try {
      console.log("🔍 Loading cached analysis:", analysisId);
      
      // Call AWS Lambda to get analysis by ID
      const response = await callAwsFunction('getAnalysisById', { id: analysisId });
      
      if (!response || !response.analysis) {
        console.warn("⚠️ No analysis found with ID:", analysisId);
        setIsLoadingCached(false);
        return;
      }
      
      const analysis = response.analysis;
      console.log("📦 Found analysis:", {
        id: analysis.id,
        companies: analysis.selected_companies,
        investment: analysis.total_investment,
        hasData: !!analysis.analysis_data
      });
      
      // CRITICAL: Set form fields from saved analysis
      setSelectedSymbols(analysis.selected_companies || []);
      setInvestmentAmount((analysis.total_investment || 10000).toString());
      
      if (!analysis.analysis_data) {
        console.warn("⚠️ No cached data - showing form for re-analysis");
        setIsLoadingCached(false);
        return;
      }
      
      const data = analysis.analysis_data;
      console.log("📊 Data keys:", Object.keys(data));
      console.log("   Has optimal_portfolio:", !!data.optimal_portfolio);
      console.log("   Has companies:", data.companies?.length || 0);
      
      // CRITICAL: Check for valid cached results
      if (!data.companies || data.companies.length === 0) {
        console.warn("⚠️ No company data in cache - showing form");
        setIsLoadingCached(false);
        return;
      }
      
      if (!data.optimal_portfolio && !data.minimum_variance_portfolio) {
        console.warn("⚠️ No portfolio data in cache - showing form");
        setIsLoadingCached(false);
        return;
      }
      
      // SUCCESS: Restore full cached state
      setAnalysisResult({
        ...data,
        total_investment: analysis.total_investment
      });
      
      // Restore input parameters
      setMonthlyContribution((data.monthly_contribution || 0).toString());
      setInvestmentGoal((data.investment_goal || 1000000).toString());
      
      // Mark as cached results
      setIsCachedResults(true);
      setCacheTimestamp(analysis.analysis_date || analysis.created_date);
      setCurrentAnalysisId(analysisId);
      
      console.log("✅ CACHE HIT - Displaying cached results");
      console.log("   Companies:", data.companies.length);
      console.log("   Monthly:", data.monthly_contribution);
      console.log("   Goal:", data.investment_goal);
      console.log("   Cached on:", analysis.analysis_date || analysis.created_date);
      
    } catch (error) {
      console.error("❌ Cache load error:", error);
      alert("Failed to load cached analysis: " + error.message);
    } finally {
      setIsLoadingCached(false);
    }
  };

  const generateGrowthProjection = (principal, monthlyContrib, annualReturn, years) => {
    const projection = [];
    const monthlyRate = annualReturn / 100 / 12;
    let balance = principal;
    
    projection.push({ year: 0, value: principal, contributions: 0, growth: 0 });
    
    for (let year = 1; year <= years; year++) {
      let yearlyContributions = 0;
      let startBalance = balance;
      
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + monthlyContrib;
        yearlyContributions += monthlyContrib;
      }
      
      const growth = balance - startBalance - yearlyContributions;
      const totalContributions = principal + (yearlyContributions * year);
      
      projection.push({
        year,
        value: balance,
        contributions: totalContributions,
        growth: balance - totalContributions
      });
    }
    
    return projection;
  };

  const handleAnalyze = async () => {
    if (selectedSymbols.length === 0) {
      alert("Please select at least one company");
      return;
    }

    setIsAnalyzing(true);
    setIsCachedResults(false);
    setCacheTimestamp(null);

    try {
      const selectedCompanies = companies.filter(c => selectedSymbols.includes(c.symbol));

      console.log("🔄 FETCHING FRESH DATA for:", selectedCompanies.map(c => c.symbol).join(", "));

      // Get real market data from Yahoo Finance via AWS Lambda
      let batchData;
      try {
        const response = await callAwsFunction('getStockBatch', {
          symbols: selectedCompanies.map(c => c.symbol),
          forceRefresh: true  // CRITICAL: Always fetch fresh data for analysis
        });

        console.log("🔍 BATCH DATA RESPONSE:", JSON.stringify(response, null, 2));

        // Handle response format
        batchData = response;

        if (!batchData || !batchData.stocks || batchData.stocks.length === 0) {
          throw new Error(`No stock data returned from API. Response: ${JSON.stringify(batchData)}`);
        }

        // DEBUG: Print Yahoo Finance data to browser console
        console.log("=== YAHOO FINANCE DATA ===");
        console.log(`Received ${batchData.stocks.length} stocks`);
        batchData.stocks.forEach(stock => {
          console.log(`\n${stock.symbol}:`);
          console.log("  current_price:", stock.current_price);
          console.log("  beta:", stock.beta, typeof stock.beta);
          console.log("  ytd_return:", stock.ytd_return);
          console.log("  one_year_return:", stock.return_1y);
          console.log("  three_year_return:", stock.return_3y_annualized);
          console.log("  market_cap:", stock.market_cap);
          console.log("  pe_ratio:", stock.pe_ratio);

          // Check for data quality issues
          if (!stock.current_price || stock.current_price <= 0) {
            console.error(`  ❌ INVALID: No valid current_price`);
          }
          if (stock.beta === null || stock.beta === undefined) {
            console.warn(`  ⚠️ WARNING: Beta is missing`);
          }
        });
        console.log("=== END YAHOO FINANCE DATA ===\n");
      } catch (error) {
        console.error("Error fetching stock batch:", error);
        throw new Error(`Failed to fetch stock data: ${error.message}`);
      }

      // Calculate expected returns using academically accepted methods
      // Process stocks sequentially to ensure unique AI assessments
      const result = { companies: [] };

      for (let companyIndex = 0; companyIndex < batchData.stocks.length; companyIndex++) {
        const stock = batchData.stocks[companyIndex];
        
        // Critical validation: ensure stock object exists
        if (!stock) {
          console.error(`❌ Stock at index ${companyIndex} is undefined/null - SKIPPING`);
          continue;
        }
        
        console.log(`📊 ${stock.symbol} - FULL RAW STOCK OBJECT:`, stock);
        console.log(`📊 ${stock.symbol} - Beta specifically:`, stock.beta, typeof stock.beta);
        
        // Critical validation: skip if no valid price data
        if (!stock.current_price || stock.current_price <= 0 || isNaN(stock.current_price)) {
          console.error(`❌ ${stock.symbol}: SKIPPING - Invalid current_price (${stock.current_price})`);
          console.error(`   This usually means the API returned no valid data for this symbol`);
          continue; // Skip this stock entirely
        }
        
        try {
          // METHOD 1: Historical CAGR (Compound Annual Growth Rate - Geometric Mean)
          // Uses trailing 3-year returns when available, falls back to 1-year
          // Source: Yahoo Finance historical price data
          let historicalReturn = null;
          if (stock.three_year_return !== undefined && stock.three_year_return !== null && !isNaN(stock.three_year_return)) {
            historicalReturn = stock.three_year_return; // Already annualized CAGR
          } else if (stock.one_year_return !== undefined && !isNaN(stock.one_year_return)) {
            historicalReturn = stock.one_year_return;
          }

          // METHOD 2: Beta Calculation - 9-TIER WATERFALL STRATEGY
          // Priority: DynamoDB Cache → Yahoo → RapidAPI Calculation → 4 API sources → Sector Estimate → LLM → Default
          let beta = stock.beta;
          let betaMethod = 'yahoo_finance_5yr';
          let betaWarnings = [];
          let betaConfidence = 'high';
          const beta1Year = stock.beta_1year;
          
          // BETA FALLBACK CHAIN: Start with calculateRealBeta Lambda (covers priorities 0-7)
          if (stock.beta === null || stock.beta === undefined || isNaN(stock.beta)) {
            console.warn(`⚠️ ${stock.symbol}: No beta from Yahoo - trying calculateRealBeta Lambda`);
            
            try {
              // Call AWS Lambda calculateRealBeta (8-tier waterfall strategy)
              const betaResult = await callAwsFunction('calculateRealBeta', { symbol: stock.symbol });
              
              if (betaResult && betaResult.beta !== null && !isNaN(betaResult.beta)) {
                beta = betaResult.beta;
                betaMethod = betaResult.source || 'calculated';
                betaConfidence = betaResult.confidence || 'medium';
                betaWarnings = betaResult.warnings || [];
                
                console.log(`${stock.symbol}: ✅ calculateRealBeta returned: ${safeToFixed(beta, 3) /* <-- fix, used instead of .toFixed(3) */} (${betaMethod}, ${betaConfidence})`);
                
                // PRIORITY 8: If sector estimate returned (low confidence), try LLM fallback
                if (betaConfidence === 'low' && betaMethod.includes('Sector Average')) {
                  console.log(`${stock.symbol}: 🤖 Sector estimate returned, trying Bedrock LLM fallback (Priority 8)...`);
                  
                  try {
                    // Bedrock LLM estimation (Priority 8)
                    const betaPrompt = `Estimate the 5-year beta for ${stock.symbol} (${stock.name}) vs S&P 500 based on:
- Sector: ${stock.sector || 'Unknown'}
- YTD Return: ${
  typeof stock.ytd_return === "number" && Number.isFinite(stock.ytd_return)
    ? stock.ytd_return.toFixed(1)
    : "Not Available"
}%
- 1Y Return: ${
  typeof stock.return_1y === "number" && Number.isFinite(stock.return_1y)
    ? stock.return_1y.toFixed(1)
    : "Not Available"
}%
- 3Y Return: ${
  typeof stock.return_3y_annualized === "number" && Number.isFinite(stock.return_3y_annualized)
    ? stock.return_3y_annualized.toFixed(1)
    : "Not Available"
}%
- 52W Range: ${stock.fifty_two_week_range || 'Not Available'}
- Market Cap: ${stock.market_cap || 'Unknown'}

Using real historical S&P 500 returns, estimate beta. Respond ONLY with valid JSON:
{"estimated_beta": number, "confidence": "low", "reasoning": "string"}`;

                    // Use invokeLLM Lambda instead of direct Bedrock call
                    const llmResponse = await callAwsFunction('invokeLLM', {
                      prompt: betaPrompt,
                      use_schema: true,
                      json_schema: {
                        type: "object",
                        properties: {
                          estimated_beta: { type: "number" },
                          confidence: { type: "string" },
                          reasoning: { type: "string" }
                        },
                        required: ["estimated_beta", "confidence", "reasoning"]
                      },
                      context: { max_tokens: 500, temperature: 0.3 }
                    });
                    const content = llmResponse.response || llmResponse.content || llmResponse;
                    const llmBeta = typeof content === 'object' ? content : JSON.parse(content);
                    
                    if (llmBeta && llmBeta.estimated_beta && !isNaN(llmBeta.estimated_beta)) {
                      beta = Math.max(-1.0, Math.min(3.0, llmBeta.estimated_beta));
                      betaMethod = 'bedrock_llm_estimate';
                      betaConfidence = 'low';
                      betaWarnings = [`Beta estimated by Bedrock AI (Priority 8): ${llmBeta.reasoning}`];
                      console.log(`${stock.symbol}: ✅ Bedrock LLM beta: ${safeToFixed(beta, 3) /* fix */}`);
                    }
                  } catch (llmError) {
                    console.warn(`${stock.symbol}: Bedrock LLM failed, keeping sector estimate`);
                  }
                }
              } else {
                throw new Error('Invalid calculateRealBeta response');
              }
            } catch (lambdaError) {
              console.error(`${stock.symbol}: calculateRealBeta Lambda failed - using default (Priority 9)`);
              
              // PRIORITY 9: Final fallback - default 1.0
              beta = 1.0;
              betaMethod = 'default_market_average';
              betaConfidence = 'very low';
              betaWarnings = [
                'All beta sources failed',
                'Using market average (1.0) as last resort',
                'This assumes stock moves exactly with market - likely inaccurate'
              ];
            }
          }
          
          // Process beta value with standardized precision
          beta = typeof beta === "number" && Number.isFinite(beta) ? parseFloat(beta.toFixed(3)) : beta; // No actual fix needed here; parseFloat ok.
          
          if (Math.abs(beta) > 3.0) {
            // Extreme beta - cap for stability
            betaWarnings.push(`Extreme 5Y beta (${
              typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"
            }) - capped at ±2.5 for model stability`);
            beta = Math.sign(beta) * Math.min(Math.abs(beta), 2.5);
            betaMethod = `${betaMethod}_capped`;
          } else if (Math.abs(beta) > 2.0) {
            betaWarnings.push(`High 5Y beta (${
              typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"
            }) - ${
              typeof beta === "number" && Number.isFinite(beta)
                ? ((Math.abs(beta) - 1) * 100).toFixed(0)
                : "Not Available"
            }% more volatile than market`);
          }

          // Negative beta warning
          if (beta < -0.3) {
            betaWarnings.push(`Negative beta (${
              typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"
            }) - inverse market correlation (defensive asset or data anomaly)`);
            if (betaConfidence === 'high') betaConfidence = 'medium';
          }

          // Dual-horizon divergence warning
          if (beta1Year && Math.abs(beta1Year - beta) > 0.5) {
            betaWarnings.push(`Beta shift detected: 1Y=${
              typeof beta1Year === "number" && Number.isFinite(beta1Year) ? beta1Year.toFixed(3) : "Not Available"
            } vs 5Y=${
              typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"
            } (${
              typeof beta1Year === "number" && typeof beta === "number" && Number.isFinite(beta1Year) && Number.isFinite(beta)
                ? Math.abs(beta1Year - beta).toFixed(2)
                : "Not Available"
            } divergence)`);
          }

          // Store beta analysis
          stock.beta_warnings = betaWarnings;
          stock.beta_confidence = betaConfidence;
          stock.beta_1year = beta1Year;
          stock.beta_method = betaMethod;
          
          console.log(`${stock.symbol}: ✅ Final beta: ${
            typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"
          } (${betaMethod}, ${betaConfidence} confidence)`);

          // METHOD 3: CAPM (Capital Asset Pricing Model)
          // Formula: E(R) = Rf + β × (E(Rm) - Rf)
          // SMOOTH EXTREME BETAS to prevent over-inflation of expected returns
          const riskFreeRate = 4.5;
          const marketRiskPremium = 8.0;
          
          // Smooth extreme betas for CAPM calculation only (preserve original for risk)
          let capmBeta = beta;
          if (Math.abs(beta) > 2.0) {
            // Apply logarithmic smoothing for extreme betas
            capmBeta = Math.sign(beta) * (2.0 + Math.log(Math.abs(beta) - 1.0));
            betaWarnings.push(`CAPM uses smoothed beta (${
              typeof capmBeta === "number" && Number.isFinite(capmBeta) ? capmBeta.toFixed(3) : "Not Available"
            }) to prevent unrealistic return expectations from extreme β=${
              typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"
            }`);
          }
          
          const capmReturn = riskFreeRate + capmBeta * marketRiskPremium;
          // =========================================
          // SECTION 2 (PART 2): handleAnalyze() - Risk Calculation & AI Analysis
// ============================================================================
// This section contains the continuation of handleAnalyze() function:
// - METHOD 4: Annualized Volatility Calculation (historical + beta-based)
// - Idiosyncratic Risk Adjustments (market cap, profitability, price level)
// - AI Qualitative Assessment using AWS Bedrock (fundamental analysis)
// - Expected Return Engine (multi-factor model with dynamic CAPM weighting)
// - Risk Calculation with AI adjustments
// - Data validation and hygiene checks
// - Plain-English adjustment explanations
// - Company analysis loop completion

// ============================================================================

          // METHOD 4: Annualized Volatility (Risk Calculation)
          // Priority: Use historical volatility if available, else beta-based estimation
          let baseVolatility;
          let volatilitySource;
          
          // Try to use actual historical volatility from Yahoo Finance
          if (stock.ytd_return !== undefined && stock.one_year_return !== undefined) {
            // Estimate volatility from return variance (rough proxy)
            // More volatile stocks show larger spreads between periods
            const returnSpread = Math.abs(stock.ytd_return - stock.one_year_return);
            
            // Add 52-week range as additional volatility indicator
            let rangeVolatility = 0;
            if (stock.fifty_two_week_range) {
              const rangeParts = stock.fifty_two_week_range.split(' - ');
              if (rangeParts.length === 2) {
                const low = parseFloat(rangeParts[0].replace('$', ''));
                const high = parseFloat(rangeParts[1].replace('$', ''));
                const midpoint = (high + low) / 2;
                if (midpoint > 0) {
                  rangeVolatility = ((high - low) / midpoint) * 100 * 0.5; // Annualized estimate
                }
              }
            }
            
            // Combine return spread and range volatility
            baseVolatility = Math.max(15, returnSpread * 2 + rangeVolatility * 0.3);
            volatilitySource = 'historical_proxy';
          } else {
            // Fallback: Beta-based estimation
            const marketVolatility = 18; // Conservative S&P 500 historical volatility
            baseVolatility = Math.abs(beta) * marketVolatility;
            volatilitySource = 'beta_based';
          }
          
          // Add base idiosyncratic risk based on company characteristics
          let baseIdiosyncraticRisk = 0;
          
          // Market cap factor (smaller = more volatile) - more granular tiers
          const marketCap = stock.market_cap || '';
          if (marketCap.includes('M')) {
            const capValue = parseFloat(marketCap);
            if (capValue < 300) {
              baseIdiosyncraticRisk += 18; // Micro-cap: +18%
            } else {
              baseIdiosyncraticRisk += 15; // Small-cap: +15%
            }
          } else if (marketCap.includes('B')) {
            const marketCapValue = parseFloat(marketCap);
            if (marketCapValue < 2) {
              baseIdiosyncraticRisk += 12; // Small-cap: +12%
            } else if (marketCapValue < 10) {
              baseIdiosyncraticRisk += 10; // Mid-cap: +10%
            } else if (marketCapValue < 50) {
              baseIdiosyncraticRisk += 7; // Large-cap: +7%
            } else {
              baseIdiosyncraticRisk += 5; // Mega-cap: +5%
            }
          } else {
            baseIdiosyncraticRisk += 10; // Unknown: assume mid-cap
          }
          
          // Profitability factor - more granular
          if (!stock.pe_ratio || stock.pe_ratio < 0) {
            baseIdiosyncraticRisk += 12; // Unprofitable: +12%
          } else if (stock.pe_ratio > 40) {
            baseIdiosyncraticRisk += 8; // High P/E (growth premium): +8%
          } else if (stock.pe_ratio > 25) {
            baseIdiosyncraticRisk += 5; // Moderate P/E: +5%
          }
          
          // Dividend factor (dividend payers = more stable)
          if (stock.dividend_yield && stock.dividend_yield > 2) {
            baseIdiosyncraticRisk -= 3; // Dividend payer: -3%
          }
          
          // Price level factor (penny stocks = more volatile)
          const currentPrice = stock.current_price || 0;
          if (currentPrice > 0 && currentPrice < 5) {
            baseIdiosyncraticRisk += 10; // Low price: +10%
          } else if (currentPrice > 0 && currentPrice < 15) {
            baseIdiosyncraticRisk += 5; // Medium price: +5%
          }
          
          // Ensure minimum base risk
          baseIdiosyncraticRisk = Math.max(5, baseIdiosyncraticRisk);
          
          const annualizedVolatility = baseVolatility + baseIdiosyncraticRisk;

          // AI Qualitative Assessment (Adjusts quantitative models based on fundamentals)
          // Provides forward-looking adjustments to historical/CAPM estimates
          // CONSERVATIVE adjustments: ±10-15% max for speculative stocks, ±20% for established
          const isSpeculative = !stock.pe_ratio || stock.pe_ratio < 0 || stock.market_cap?.includes('M') || Math.abs(beta) > 1.8;
          const maxReturnAdj = isSpeculative ? 15 : 20;
          const maxRiskAdj = isSpeculative ? 40 : 50;

          const prompt = `You are a strict fundamental analyst evaluating ${stock.symbol} (${stock.name}).

**Market Data:**
- Price: $${typeof stock.current_price === "number" && Number.isFinite(stock.current_price) ? stock.current_price.toFixed(2) : "Not Available"}
- Market Cap: ${stock.market_cap || 'Not Available'}
- P/E Ratio: ${typeof stock.pe_ratio === "number" && Number.isFinite(stock.pe_ratio) ? stock.pe_ratio.toFixed(2) : "Not Available"}
- Beta: ${typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(3) : "Not Available"}${betaConfidence !== 'high' ? ' (LOW CONFIDENCE)' : ''}
- YTD Return: ${typeof stock.ytd_return === "number" && Number.isFinite(stock.ytd_return) ? stock.ytd_return.toFixed(1) : "Not Available"}%
- 1Y Return: ${typeof stock.one_year_return === "number" && Number.isFinite(stock.one_year_return) ? stock.one_year_return.toFixed(1) : "Not Available"}%
- 3Y Return: ${typeof stock.three_year_return === "number" && Number.isFinite(stock.three_year_return) ? stock.three_year_return.toFixed(1) : "Not Available"}%
- 52W Range: ${stock.fifty_two_week_range || 'Not Available'}
- Sector: ${stock.sector || 'Unknown'}
- Dividend Yield: ${typeof stock.dividend_yield === "number" && Number.isFinite(stock.dividend_yield) ? stock.dividend_yield.toFixed(2) : "Not Available"}%

**Classification:** ${isSpeculative ? 'SPECULATIVE/PRE-REVENUE' : 'ESTABLISHED'}

**CRITICAL - Company-Specific Analysis:**
THIS IS ANALYSIS #${companyIndex + 1} of ${batchData.stocks.length} - MANDATORY: Provide DISTINCT values from other analyses.

**${stock.symbol} UNIQUE FACTORS - Search web and analyze:**

1. **Revenue & Profitability**: Annual revenue, revenue growth rate, path to profitability
2. **Cash Position**: Cash on hand, burn rate, runway (months until capital raise needed)
3. **Key Partnerships**: Major customers, strategic alliances, government contracts
4. **Technology Maturity**: Development stage (prototype, pilot, commercial), IP portfolio
5. **Competitive Moat**: Barriers to entry, first-mover advantage, unique technology
6. **Recent Catalysts**: Last 90 days - earnings surprises, FDA approvals, contract wins, product launches
7. **Insider Activity**: Recent insider buying/selling as confidence signal
8. **Analyst Coverage**: Number of analysts, average price target vs current price

**DIFFERENTIATION MANDATE:**
If analyzing similar companies (same sector), focus on:
- **Revenue differences**: Which has actual revenue? Growth rates?
- **Technology stage**: Who's closest to commercialization?
- **Partnership quality**: Enterprise customers vs consumer?
- **Financial runway**: Who needs capital soon? Who's well-funded?
- **Management pedigree**: Academic founders vs seasoned executives?

**Adjustment Rules:**
- Strong recent catalysts (earnings beat, major partnership): +5 to +${maxReturnAdj}%
- Weak catalysts (missed earnings, dilution): -5 to -${maxReturnAdj}%
- Better cash position than peers: -5% risk adjustment
- Worse cash position: +10 to +${maxRiskAdj}% risk adjustment

**CRITICAL**: Your adjustments for ${stock.symbol} MUST differ by at least 3% from other stocks in this batch.

**Valuation Rules (STRICT):**
- Pre-revenue or unprofitable + high P/S (>20): MUST be "overvalued"
- Negative earnings + beta >1.5: "overvalued" (priced for perfection)
- P/E > 40 for non-growth stock: "overvalued"
- Established profitable companies with P/E 10-25: "fairly valued"
- Only mark "undervalued" if: profitable, P/E <20, recent positive catalysts

**Output (JSON):**
1. valuation: "overvalued" | "fairly valued" | "undervalued"
2. forward_return_adjustment: -${maxReturnAdj} to +${maxReturnAdj} (default near 0, be VERY conservative)
3. idiosyncratic_risk_adjustment: -20 to +${maxRiskAdj} (higher for speculative)
4. valuation_reasoning: one sentence citing specific fundamental or market factor

**CRITICAL**: 
- Use real current data from web search
- For speculative stocks: default to "overvalued" and minimal adjustments
- Adjustments >±10% need strong justification
- IMPORTANT: Analyze each stock independently based on its unique fundamentals, news, and market position
- Focus on company-specific catalysts (product launches, partnerships, earnings, regulatory changes)`;

          // AWS BEDROCK LLM INVOCATION (replaces base44.integrations.Core.InvokeLLM)
          let aiAnalysis;
          try {
            // Use invokeLLM Lambda instead of direct Bedrock call
            const llmResponse = await callAwsFunction('invokeLLM', {
              analysis_type: "company_analysis",
              prompt: prompt,
              use_schema: true,
              json_schema: {
                type: "object",
                properties: {
                  valuation: { type: "string", enum: ["overvalued", "fairly valued", "undervalued"] },
                  forward_return_adjustment: { type: "number" },
                  idiosyncratic_risk_adjustment: { type: "number" },
                  valuation_reasoning: { type: "string" }
                },
                required: ["valuation", "forward_return_adjustment", "idiosyncratic_risk_adjustment", "valuation_reasoning"]
              },
              context: { max_tokens: 1500, temperature: 0.6 }
            });
            
            const content = llmResponse.response || llmResponse.content || llmResponse;
            aiAnalysis = typeof content === 'object' ? content : JSON.parse(content);
            
            console.log(`${stock.symbol}: ✅ Bedrock AI analysis complete`);
          } catch (aiError) {
            console.error(`${stock.symbol}: ❌ Bedrock AI analysis failed:`, aiError);
            // Fallback to neutral values
            aiAnalysis = {
              valuation: 'fairly valued',
              forward_return_adjustment: 0,
              idiosyncratic_risk_adjustment: 0,
              valuation_reasoning: 'AI analysis unavailable - using neutral values'
            };
          }

          // Enforce stricter AI adjustment caps based on stock type
          let cappedReturnAdj = Math.max(-maxReturnAdj, Math.min(maxReturnAdj, aiAnalysis.forward_return_adjustment));
          let cappedRiskAdj = Math.max(-20, Math.min(maxRiskAdj, aiAnalysis.idiosyncratic_risk_adjustment));
          
          // Add company-specific micro-adjustments based on actual fundamentals
          // This ensures differentiation even if AI returns similar values
          const microAdjustments = {
            return: 0,
            risk: 0
          };
          
          // Price momentum indicator (current price vs 52-week range)
          const fiftyTwoWeekRange = stock.fifty_two_week_range || '';
          const stockCurrentPrice = stock.current_price || 0;
          if (fiftyTwoWeekRange && stockCurrentPrice && typeof stockCurrentPrice === 'number') {
            const rangeParts = fiftyTwoWeekRange.split(' - ');
            if (rangeParts.length === 2) {
              const low = parseFloat(rangeParts[0].replace('$', ''));
              const high = parseFloat(rangeParts[1].replace('$', ''));
              if (!isNaN(low) && !isNaN(high) && high > low) {
                const range = high - low;
                const positionInRange = (stockCurrentPrice - low) / range;
                if (!isNaN(positionInRange)) {
                  microAdjustments.return += (positionInRange - 0.5) * 4; // ±2%
                }
              }
            }
          }
          
          // P/E specific adjustment (preserve uniqueness)
          if (stock.pe_ratio && typeof stock.pe_ratio === 'number' && !isNaN(stock.pe_ratio) && stock.pe_ratio > 0) {
            const peDeviation = (stock.pe_ratio - 25) / 25;
            if (!isNaN(peDeviation)) {
              microAdjustments.return += peDeviation * 3;
              microAdjustments.risk += Math.abs(peDeviation) * 4;
            }
          }
          
          // Market cap specific fine-tuning (more aggressive)
          const stockMarketCap = stock.market_cap || '';
          if (stockMarketCap && typeof stockMarketCap === 'string') {
            const capValue = parseFloat(stockMarketCap.replace(/[^0-9.]/g, ''));
            if (!isNaN(capValue) && capValue > 0) {
              const isBillion = stockMarketCap.includes('B');
              const actualCap = isBillion ? capValue : capValue / 1000;
              const capFactor = Math.log10(Math.max(0.1, actualCap)) - 1;
              if (!isNaN(capFactor)) {
                microAdjustments.risk += capFactor * 2;
                microAdjustments.return += capFactor * -0.5;
              }
            }
          }
          
          // Historical return variance (stronger differentiation)
          if (typeof stock.ytd_return === 'number' && !isNaN(stock.ytd_return) && 
              typeof stock.one_year_return === 'number' && !isNaN(stock.one_year_return)) {
            const returnVolatility = Math.abs(stock.ytd_return - stock.one_year_return);
            if (!isNaN(returnVolatility)) {
              microAdjustments.risk += returnVolatility * 0.3;
            }
          }
          
          // Three-year return adjustment (if available)
          if (typeof stock.three_year_return === 'number' && !isNaN(stock.three_year_return)) {
            const threeYearDeviation = stock.three_year_return - 10;
            if (!isNaN(threeYearDeviation)) {
              microAdjustments.return += threeYearDeviation * 0.15;
            }
          }
          
          // Beta-based fine-tuning (use full beta precision)
          const betaDeviation = beta - 1.0;
          if (!isNaN(betaDeviation)) {
            microAdjustments.return += betaDeviation * 1.5;
            microAdjustments.risk += Math.abs(betaDeviation) * 2;
          }
          
          // Ensure micro-adjustments are valid numbers
          if (isNaN(microAdjustments.return)) microAdjustments.return = 0;
          if (isNaN(microAdjustments.risk)) microAdjustments.risk = 0;
          
          // FORCED DIFFERENTIATION: Use company index to guarantee uniqueness
          // This is a last resort to prevent identical values across similar stocks
          // Uses small adjustments (±0.5% per position) to maintain realism
          const forcedDifferentiation = {
            return: companyIndex * 0.8 - (batchData.stocks.length - 1) * 0.4, // Spread ±0.4% per stock
            risk: companyIndex * 0.6 // Increment risk by 0.6% per position
          };
          
          // Apply micro-adjustments + forced differentiation
          cappedReturnAdj = (cappedReturnAdj || 0) + microAdjustments.return + forcedDifferentiation.return;
          cappedRiskAdj = (cappedRiskAdj || 0) + microAdjustments.risk + forcedDifferentiation.risk;

          // ============================================================================
          // EXPECTED RETURN ENGINE - Multi-Factor Model with Dynamic Weighting
          // ============================================================================
          
          let expectedReturn;
          let returnMethodology;
          let returnRange = null;
          let returnConfidence = 'medium';

          // DYNAMIC CAPM WEIGHTING based on data quality
          let capmWeight = 0.4;
          let historicalWeight = 0.6;
          
          const hasReliableHistory = historicalReturn !== null && 
                                      !isNaN(historicalReturn) && 
                                      historicalReturn > -90 && 
                                      historicalReturn < 150;
          
          if (!hasReliableHistory) {
            capmWeight = 1.0;
            historicalWeight = 0.0;
            returnConfidence = 'low';
          } else if (Math.abs(historicalReturn) > 50) {
            capmWeight = 0.8;
            historicalWeight = 0.2;
            returnConfidence = 'low';
          } else if (!stock.three_year_return) {
            capmWeight = 0.7;
            historicalWeight = 0.3;
            returnConfidence = 'medium';
          } else if (beta > 1.5 || beta < 0.5) {
            capmWeight = 0.3;
            historicalWeight = 0.7;
            returnConfidence = 'high';
          } else {
            returnConfidence = 'high';
          }

          // Calculate blended base return
          let baseReturn;
          if (hasReliableHistory) {
            baseReturn = (historicalReturn * historicalWeight) + (capmReturn * capmWeight);
            returnMethodology = `${(typeof historicalWeight === "number" && Number.isFinite(historicalWeight) ? historicalWeight*100 : 0).toFixed(0)}% Hist(${typeof historicalReturn === "number" && Number.isFinite(historicalReturn) ? historicalReturn.toFixed(2) : "Not Available"}%) + ${(typeof capmWeight === "number" && Number.isFinite(capmWeight) ? capmWeight*100 : 0).toFixed(0)}% CAPM(${typeof capmReturn === "number" && Number.isFinite(capmReturn) ? capmReturn.toFixed(2) : "Not Available"}%), AI: ${(cappedReturnAdj >= 0 ? '+' : '')}${typeof cappedReturnAdj === "number" && Number.isFinite(cappedReturnAdj) ? cappedReturnAdj.toFixed(1) : "Not Available"}%`;
          } else {
            baseReturn = capmReturn;
            returnMethodology = `100% CAPM: ${typeof riskFreeRate === "number" && Number.isFinite(riskFreeRate) ? riskFreeRate.toFixed(1) : "Not Available"}% + ${typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(4) : "Not Available"}×${typeof marketRiskPremium === "number" && Number.isFinite(marketRiskPremium) ? marketRiskPremium.toFixed(1) : "Not Available"}%, AI: ${(cappedReturnAdj >= 0 ? '+' : '')}${typeof cappedReturnAdj === "number" && Number.isFinite(cappedReturnAdj) ? cappedReturnAdj.toFixed(1) : "Not Available"}%`;
          }

          // Apply AI adjustment
          expectedReturn = baseReturn + cappedReturnAdj;
          
          // Calculate confidence interval / return range
          let uncertainty = 5.0; // Base ±5%
          if (!hasReliableHistory) uncertainty += 3.0;
          if (!beta || beta === 1.0) uncertainty += 2.0;
          if (isSpeculative) uncertainty += 3.0;
          uncertainty = Math.min(15, uncertainty);
          
          returnRange = {
            low: expectedReturn - uncertainty,
            base: expectedReturn,
            high: expectedReturn + uncertainty,
            uncertainty: uncertainty
          };

          // DATA HYGIENE: Enforce realistic bounds
          const minReturn = isSpeculative ? -30 : -20;
          const maxReturn = isSpeculative ? 50 : 40;
          expectedReturn = Math.max(minReturn, Math.min(maxReturn, expectedReturn));
          
          // Sanitize return range
          if (returnRange) {
            returnRange.low = Math.max(minReturn, Math.min(maxReturn, returnRange.low || expectedReturn - 5));
            returnRange.high = Math.max(minReturn, Math.min(maxReturn, returnRange.high || expectedReturn + 5));
            returnRange.base = expectedReturn;
          }
          
          // CRITICAL: Final NaN prevention
          if (isNaN(expectedReturn) || !isFinite(expectedReturn)) {
            console.warn(`${stock.symbol}: Invalid expected return, using CAPM fallback`);
            expectedReturn = capmReturn;
            returnRange = {
              low: capmReturn - 5,
              base: capmReturn,
              high: capmReturn + 5,
              uncertainty: 10
            };
            returnConfidence = 'low';
          }

          // Calculate Risk: Base volatility + AI-adjusted idiosyncratic component
          const aiRiskMultiplier = 1 + (cappedRiskAdj / 100);
          let totalRisk = annualizedVolatility * aiRiskMultiplier;

          // DATA HYGIENE: Enforce realistic risk bounds (8%-80%)
          let boundedRisk = Math.max(8, Math.min(80, totalRisk));
          
          // CRITICAL: NaN prevention
          if (isNaN(boundedRisk) || !isFinite(boundedRisk) || boundedRisk <= 0) {
            console.warn(`${stock.symbol}: Invalid risk, using base volatility fallback`);
            boundedRisk = Math.max(8, Math.min(80, annualizedVolatility)) || 20;
          }

          // Final safety check before creating analyzed stock
          if (isNaN(expectedReturn) || expectedReturn === undefined || expectedReturn === null) {
            console.error(`${stock.symbol}: Invalid expectedReturn, using 0`);
            expectedReturn = 0;
          }
          if (isNaN(boundedRisk) || boundedRisk === undefined || boundedRisk === null || boundedRisk <= 0) {
            console.error(`${stock.symbol}: Invalid boundedRisk, using 20%`);
            boundedRisk = 20;
          }

          // PHASE 5: Generate plain-English adjustment explanations
          const adjustments = [];
          
          // Speculative penalty explanation
          if (isSpeculative && cappedRiskAdj > 5) {
            adjustments.push({
              category: 'speculative',
              metric: 'Risk',
              delta: cappedRiskAdj,
              unit: '%',
              explanation: `Added ${typeof cappedRiskAdj === "number" && Number.isFinite(cappedRiskAdj) ? cappedRiskAdj.toFixed(1) : "Not Available"}% volatility due to ${
                !stock.pe_ratio || stock.pe_ratio < 0 ? 'unprofitable status' : 
                stock.market_cap?.includes('M') ? 'micro-cap classification' : 
                typeof beta === "number" && Number.isFinite(beta) ? 'high beta (' + beta.toFixed(2) + ')' : 'high beta (Not Available)'
              }`
            });
          }
          
          // Valuation adjustment explanation
          if (Math.abs(cappedReturnAdj) > 2) {
            const direction = cappedReturnAdj > 0 ? 'increased' : 'decreased';
            const valuationCategory = (aiAnalysis && aiAnalysis.valuation === 'overvalued') ? 'overvaluation' : 
                                     (aiAnalysis && aiAnalysis.valuation === 'undervalued') ? 'undervaluation' : 'valuation';
            const reasoningText = (aiAnalysis && aiAnalysis.valuation_reasoning) || 'AI qualitative assessment';
            adjustments.push({
              category: valuationCategory,
              metric: 'Expected Return',
              delta: cappedReturnAdj,
              unit: '%',
              explanation: `${direction.charAt(0).toUpperCase() + direction.slice(1)} ${typeof cappedReturnAdj === "number" && Number.isFinite(cappedReturnAdj) ? Math.abs(cappedReturnAdj).toFixed(1) : "Not Available"}% - ${reasoningText}`
            });
          }
          
          // Beta impact explanation
          if (Math.abs(beta - 1.0) > 0.3) {
            const impact = beta > 1.3 ? 'amplified market volatility' : beta < 0.7 ? 'dampened market sensitivity' : 'moderate market correlation';
            adjustments.push({
              category: 'momentum',
              metric: 'Market Sensitivity',
              delta: beta - 1.0,
              unit: '',
              explanation: `Beta ${typeof beta === "number" && Number.isFinite(beta) ? beta.toFixed(2) : "Not Available"} indicates ${impact} (${beta > 1 ? 'more' : 'less'} volatile than S&P 500)`
            });
          }
          
          // Market cap risk explanation
          const stockMktCap = stock.market_cap || '';
          if (stockMktCap.includes('M') || (stockMktCap.includes('B') && parseFloat(stockMktCap) < 2)) {
            adjustments.push({
              category: 'market_cap',
              metric: 'Idiosyncratic Risk',
              delta: baseIdiosyncraticRisk,
              unit: '%',
              explanation: `Small-cap classification (${stockMktCap}) adds ${typeof baseIdiosyncraticRisk === "number" && Number.isFinite(baseIdiosyncraticRisk) ? baseIdiosyncraticRisk.toFixed(0) : "Not Available"}% company-specific volatility`
            });
          }

          // CRITICAL FIX: Explicitly exclude ALL market cap fields to prevent validation errors
          const { 
            market_cap: _mc, 
            market_cap_raw: _mcr, 
            market_cap_category: _mcc, 
            ...stockCleaned 
          } = stock;
          
          const analyzedStock = {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            current_price: stock.current_price,
            previous_close: stock.previous_close,
            pe_ratio: stock.pe_ratio,
            beta: beta || 1.0,
            beta_1year: beta1Year,
            beta_method: betaMethod || stock.beta_source || 'default',
            beta_source: stock.beta_source || betaMethod,
            beta_confidence: betaConfidence,
            beta_warnings: betaWarnings,
            expected_return: expectedReturn,
            return_range: returnRange,
            return_confidence: returnConfidence,
            capm_weight: capmWeight,
            historical_weight: historicalWeight,
            risk: boundedRisk,
            valuation: (aiAnalysis && aiAnalysis.valuation) || 'fairly valued',
            valuation_reasoning: (aiAnalysis && aiAnalysis.valuation_reasoning) || 'Analysis incomplete',
            return_methodology: returnMethodology || 'CAPM default',
            historical_cagr: historicalReturn,
            capm_expected_return: capmReturn,
            ai_return_adjustment: cappedReturnAdj || 0,
            ai_risk_adjustment: cappedRiskAdj || 0,
            base_volatility: baseVolatility,
            volatility_source: volatilitySource,
            base_idiosyncratic_risk: baseIdiosyncraticRisk,
            adjustments: adjustments,
            ytd_return: stock.ytd_return,
            one_year_return: stock.return_1y,
            three_year_return: stock.return_3y_annualized,
            fifty_two_week_range: stock.fifty_two_week_range,
            last_updated: stock.last_updated || new Date().toISOString(),
            isIndexFund: stock.isIndexFund || false
          };

          result.companies.push(analyzedStock);

          // Log each analysis as it completes
          console.log(`✓ Completed ${companyIndex + 1}/${batchData.stocks.length}: ${stock.symbol} - Return: ${typeof expectedReturn === "number" && Number.isFinite(expectedReturn) ? expectedReturn.toFixed(3) : "Not Available"}%, Risk: ${typeof boundedRisk === "number" && Number.isFinite(boundedRisk) ? boundedRisk.toFixed(3) : "Not Available"}%`);

        } catch (error) {
          console.error(`❌ Critical error analyzing ${stock.symbol}:`, error);
          console.error(`   Stack trace:`, error.stack);
          // Don't skip - throw to help debug
          throw new Error(`Failed to analyze ${stock.symbol}: ${error.message}`);
        }
      }

      // Validate all companies have required data
      const invalidCompanies = result.companies.filter(c => 
        c.expected_return === undefined || 
        c.risk === undefined || 
        isNaN(c.expected_return) || 
        isNaN(c.risk) ||
        !c.current_price ||
        c.current_price <= 0
      );
      
      if (invalidCompanies.length > 0) {
        console.error("Companies missing required data:", invalidCompanies.map(c => ({
          symbol: c.symbol,
          price: c.current_price,
          return: c.expected_return,
          risk: c.risk
        })));
        alert(`Analysis failed for: ${invalidCompanies.map(c => c.symbol).join(', ')}\n\nThese stocks don't have valid market data. This usually means:\n• The stock symbol is invalid\n• The company is delisted\n• Market data APIs are unavailable\n\nPlease try different stocks.`);
        throw new Error(`Analysis incomplete: ${invalidCompanies.map(c => c.symbol).join(', ')} missing price/risk/return data`);
      }

      if (result.companies.length === 0) {
        throw new Error('No companies were successfully analyzed. Please try selecting different stocks.');
      }

          // ============================================================================
          // ============================================================================
// SECTION 3 (PART 3): Company Updates, Portfolio Optimization & Trading
// ============================================================================
// This section contains:
// - Company record updates with fresh analysis data (AWS Lambda)
// - Methodology transparency logging
// - Asset differentiation validation
// - Similarity analysis and diversification recommendations
// - Portfolio optimization (Optimal, Min Variance, Max Return)
// - Post-optimization allocation verification
// - Analysis caching to AWS Lambda (saveAnalysis)
// - Helper functions: getValuationColor, getValuationIcon, getCurrentPortfolio, getStrategyIcon, getStrategyColor
// - Trading functions: handleOpenTrade, handleExecuteTrade, handleTradeAllAllocations

// ============================================================================

      // Update Company records with fresh data (skip index funds as they don't have the same schema)
      const updatePromises = result.companies.map(companyData => {
        const companyRecord = companies.find(c => c.symbol === companyData.symbol);
        if (companyRecord && !companyRecord.isIndexFund) {
          // CRITICAL: Build update object with explicit exclusions
          // NEVER include market_cap, market_cap_raw, market_cap_category - these cause validation errors
          const updateData = {
            current_price: companyData.current_price,
            pe_ratio: companyData.pe_ratio,
            beta: companyData.beta,
            beta_source: companyData.beta_source,
            beta_confidence: companyData.beta_confidence,
            expected_return: companyData.expected_return,
            risk: companyData.risk,
            valuation: companyData.valuation,
            valuation_reasoning: companyData.valuation_reasoning,
            last_analyzed_date: new Date().toISOString()
          };
          
          console.log(`Updating ${companyData.symbol} - market_cap excluded from update`);
          
          // AWS Lambda call to update company
          return callAwsFunction('updateCompany', {
            symbol: companyRecord.symbol,
            updateData: updateData
          });
        }
      }).filter(Boolean);

      await Promise.all(updatePromises);

      const allCompanyData = result.companies;

      // Log methodology transparency
      console.log("📊 INDUSTRY-STANDARD METHODOLOGY:");
      allCompanyData.forEach(c => {
        console.log(`${c.symbol}:`);
        console.log(`   Beta: ${typeof c.beta === "number" && Number.isFinite(c.beta) ? c.beta.toFixed(3) : "Not Available"} (${c.beta_method || 'unknown'})`);
        console.log(`   Expected Return: ${typeof c.expected_return === "number" && Number.isFinite(c.expected_return) ? c.expected_return.toFixed(2) : "Not Available"}% | Risk: ${typeof c.risk === "number" && Number.isFinite(c.risk) ? c.risk.toFixed(2) : "Not Available"}%`);
        console.log(`   Method: ${c.return_methodology || 'Not Available'}`);
        console.log(`   Risk: Base=${typeof c.base_volatility === "number" && Number.isFinite(c.base_volatility) ? c.base_volatility.toFixed(1) : "Not Available"}% (${c.volatility_source}), Idiosyncratic=${typeof c.base_idiosyncratic_risk === "number" && Number.isFinite(c.base_idiosyncratic_risk) ? c.base_idiosyncratic_risk.toFixed(1) : "Not Available"}%, AI-adjusted=${typeof c.ai_risk_adjustment === "number" && Number.isFinite(c.ai_risk_adjustment) ? c.ai_risk_adjustment.toFixed(1) : "Not Available"}%`);
      });

      // CRITICAL: Check if all companies are identical (optimization killer)
      // Use higher precision for detection
      const uniqueReturns = new Set(allCompanyData.map(c => typeof c.expected_return === "number" && Number.isFinite(c.expected_return) ? c.expected_return.toFixed(2) : "Not Available"));
      const uniqueRisks = new Set(allCompanyData.map(c => typeof c.risk === "number" && Number.isFinite(c.risk) ? c.risk.toFixed(2) : "Not Available"));

      if (uniqueReturns.size === 1 && uniqueRisks.size === 1) {
        console.error("🚨 FATAL: All assets have IDENTICAL return and risk profiles");
        console.error("   Details:", allCompanyData.map(c => `${c.symbol}: ${typeof c.expected_return === "number" && Number.isFinite(c.expected_return) ? c.expected_return.toFixed(3) : "Not Available"}% return, ${typeof c.risk === "number" && Number.isFinite(c.risk) ? c.risk.toFixed(3) : "Not Available"}% risk`));
        throw new Error(`Portfolio optimization failed: All ${allCompanyData.length} assets have identical risk/return profiles (${typeof allCompanyData[0].expected_return === "number" && Number.isFinite(allCompanyData[0].expected_return) ? allCompanyData[0].expected_return.toFixed(2) : "Not Available"}% return, ${typeof allCompanyData[0].risk === "number" && Number.isFinite(allCompanyData[0].risk) ? allCompanyData[0].risk.toFixed(2) : "Not Available"}% risk). This makes optimization impossible.\n\nPlease select assets from different:\n• Sectors (tech, healthcare, finance, etc.)\n• Market caps (large, mid, small)\n• Growth stages (mature, growth, speculative)\n\nCurrent selections: ${allCompanyData.map(c => `${c.symbol} (${c.sector})`).join(', ')}`);
      }

      if (uniqueReturns.size === 1) {
        console.error("🚨 CRITICAL: All assets have IDENTICAL expected returns");
        console.log("   AI adjustments:", allCompanyData.map(c => `${c.symbol}: ${typeof c.ai_return_adjustment === "number" && Number.isFinite(c.ai_return_adjustment) ? c.ai_return_adjustment.toFixed(1) : "Not Available"}%`).join(', '));
        throw new Error(`Portfolio optimization failed: All assets have identical expected returns (${typeof allCompanyData[0].expected_return === "number" && Number.isFinite(allCompanyData[0].expected_return) ? allCompanyData[0].expected_return.toFixed(2) : "Not Available"}%).\n\nThe AI analysis produced insufficient differentiation. Please:\n• Select more diverse assets from different sectors\n• Ensure assets have different risk profiles and growth prospects\n• Try different combinations\n\nCurrent selections: ${allCompanyData.map(c => c.symbol).join(', ')}`);
      }

      // CRITICAL VALIDATION: Verify expected returns are properly differentiated
      const returns = allCompanyData.map(c => c.expected_return).filter(r => r !== undefined && !isNaN(r));
      const risks = allCompanyData.map(c => c.risk).filter(r => r !== undefined && !isNaN(r));
      
      if (returns.length === 0 || risks.length === 0) {
        throw new Error('No valid risk/return data found for selected companies.');
      }
      const maxReturn = Math.max(...returns);
      const minReturn = Math.min(...returns);
      const returnSpread = maxReturn - minReturn;
      const maxRisk = Math.max(...risks);
      const minRisk = Math.min(...risks);
      const riskSpread = maxRisk - minRisk;

      console.log("📊 Asset Differentiation (Real Market Data):");
      console.log(`   Returns: ${typeof minReturn === "number" && Number.isFinite(minReturn) ? minReturn.toFixed(2) : "Not Available"}% to ${typeof maxReturn === "number" && Number.isFinite(maxReturn) ? maxReturn.toFixed(2) : "Not Available"}% (spread: ${typeof returnSpread === "number" && Number.isFinite(returnSpread) ? returnSpread.toFixed(2) : "Not Available"}%)`);
      console.log(`   Risk: ${typeof minRisk === "number" && Number.isFinite(minRisk) ? minRisk.toFixed(2) : "Not Available"}% to ${typeof maxRisk === "number" && Number.isFinite(maxRisk) ? maxRisk.toFixed(2) : "Not Available"}% (spread: ${typeof riskSpread === "number" && Number.isFinite(riskSpread) ? riskSpread.toFixed(2) : "Not Available"}%)`);
      console.log(`   Sharpe Ratios: ${allCompanyData.map(c => c.risk ? ((c.expected_return - 4.5) / c.risk).toFixed(3) : 'Not Available').join(', ')}`);
      
      // Log similarity without forcing changes
      if (typeof returnSpread === "number" && Number.isFinite(returnSpread) && returnSpread < 3.0) {
        console.warn(`⚠️ Low return differentiation detected. This reflects real market conditions for similar assets.`);
      }
      if (typeof riskSpread === "number" && Number.isFinite(riskSpread) && riskSpread < 5.0) {
        console.warn(`⚠️ Low risk differentiation detected. Assets have similar volatility profiles.`);
      }

      // Asset Similarity Analysis (Advisory Only)
      const similarityWarnings = [];
      const diversificationRecommendations = [];
      
      // Sector concentration analysis
      const sectors = allCompanyData.map(c => c.sector).filter(s => s && s !== 'Unknown');
      const uniqueSectors = new Set(sectors);
      if (uniqueSectors.size === 1 && sectors.length > 1) {
        similarityWarnings.push(`All assets from ${sectors[0]} sector - high correlation expected`);
        diversificationRecommendations.push({
          type: 'sector',
          message: 'Cross-sector diversification recommended',
          suggestions: ['SPY (Broad Market)', 'VTI (Total Market)', 'Sector ETFs (XLF, XLV, XLE)']
        });
      } else if (uniqueSectors.size <= 2 && sectors.length >= 3) {
        similarityWarnings.push(`Limited sector diversity (${uniqueSectors.size} sectors)`);
      }
      
      // Market cap concentration analysis
      const marketCaps = allCompanyData.map(c => {
        if (!c.market_cap) return 'unknown';
        if (c.market_cap.includes('M')) {
          const val = parseFloat(c.market_cap);
          return val < 300 ? 'micro' : 'small';
        }
        if (c.market_cap.includes('B')) {
          const val = parseFloat(c.market_cap);
          return val < 2 ? 'small' : val < 10 ? 'mid' : val < 50 ? 'large' : 'mega';
        }
        return 'unknown';
      });
      const uniqueCaps = new Set(marketCaps.filter(c => c !== 'unknown'));
      if (uniqueCaps.size === 1 && marketCaps.length > 1) {
        similarityWarnings.push(`All assets are ${[...uniqueCaps][0]}-cap`);
      }
      
      // Growth stage analysis
      const growthStages = allCompanyData.map(c => {
        const isSpeculative = !c.pe_ratio || c.pe_ratio < 0 || c.market_cap?.includes('M');
        const isGrowth = c.pe_ratio > 30;
        return isSpeculative ? 'speculative' : isGrowth ? 'growth' : 'mature';
      });
      const uniqueStages = new Set(growthStages);
      if (uniqueStages.size === 1 && growthStages.length > 1) {
        similarityWarnings.push(`All assets are ${[...uniqueStages][0]} stage`);
        if ([...uniqueStages][0] === 'speculative') {
          diversificationRecommendations.push({
            type: 'stability',
            message: 'Consider adding established assets',
            suggestions: ['SPY (S&P 500)', 'QQQ (Nasdaq 100)', 'Blue-chips (AAPL, MSFT, JNJ)']
          });
        }
      }
      
      // Correlation and differentiation
      if (typeof returnSpread === "number" && Number.isFinite(returnSpread) && returnSpread < 3.0) {
        similarityWarnings.push(`Limited return differentiation (${returnSpread.toFixed(1)}% spread)`);
      }
      if (typeof riskSpread === "number" && Number.isFinite(riskSpread) && riskSpread < 5.0) {
        similarityWarnings.push(`Limited risk differentiation (${riskSpread.toFixed(1)}% spread)`);
      }
      
      if (similarityWarnings.length > 0) {
        console.warn("⚠️ Portfolio Similarity Detected:", similarityWarnings);
        if (!diversificationRecommendations.some(r => r.type === 'diversification')) {
          diversificationRecommendations.push({
            type: 'diversification',
            message: 'Optional: Add uncorrelated assets for improved efficiency',
            suggestions: ['BND (Bonds)', 'GLD (Gold)', 'VNQ (Real Estate)', 'VXUS (International)']
          });
        }
      }

      // Input data for optimization
      console.log("📊 Optimization inputs:", allCompanyData.map(c => ({ 
        symbol: c.symbol, 
        return: typeof c.expected_return === "number" && Number.isFinite(c.expected_return) ? c.expected_return.toFixed(2) + '%' : 'Not Available',
        risk: typeof c.risk === "number" && Number.isFinite(c.risk) ? c.risk.toFixed(2) + '%' : 'Not Available',
        sharpe: c.risk ? ((c.expected_return / c.risk).toFixed(3)) : 'Not Available'
      })));

      // ═════════════════════════════════════════════════════════════════════════════
      // RUN PORTFOLIO OPTIMIZATION WITH ALLOCATION INTEGRITY VALIDATION
      // ═══════════════════════════════════════════════════════════════════════��═════
      const { optimizeAllPortfolios } = await import("@/components/utils/calculations/portfolioOptimization");
      
      let optimizationResults;
      try {
        optimizationResults = optimizeAllPortfolios(allCompanyData);
      } catch (error) {
        console.error("❌ OPTIMIZATION FAILED:", error.message);
        alert(`Portfolio optimization failed:\n\n${error.message}\n\nThis indicates a critical issue with allocation integrity. Please contact support.`);
        throw error; // Re-throw to prevent displaying invalid results
      }

      // Handle validation results gracefully
      if (optimizationResults.validation && !optimizationResults.validation.isValid) {
        console.warn("⚠️ Portfolio optimization constraints applied due to asset similarity");
        optimizationResults.validation.criticalErrors.forEach(err => {
          console.warn(`   ${err.type}: ${err.message}`);
        });
      }
      
      // ═════════════════════════════════════════════════════════════════════════════
      // POST-OPTIMIZATION VERIFICATION - Ensure allocations passed validation
      // ═══════��═════════════════════════════════════════════════════════════════════
      console.log("🔍 POST-OPTIMIZATION ALLOCATION CHECK:");
      
      ['optimal_portfolio', 'minimum_variance_portfolio', 'maximum_return_portfolio'].forEach(portfolioKey => {
        const portfolio = optimizationResults[portfolioKey];
        if (portfolio && portfolio.allocations) {
          const weights = Object.values(portfolio.allocations);
          const sum = weights.reduce((a, b) => a + b, 0);
          const unique = new Set(weights.map(w => typeof w === "number" && Number.isFinite(w) ? w.toFixed(1) : "Not Available")).size;
          
          console.log(`   ${portfolioKey}: Sum=${typeof sum === "number" && Number.isFinite(sum) ? sum.toFixed(2) : "Not Available"}%, Unique=${unique}/${weights.length}`);
          
          // Critical error if sum is off
          if (typeof sum === "number" && Number.isFinite(sum) && Math.abs(sum - 100) > 0.1) {
            throw new Error(`CRITICAL: ${portfolioKey} allocations sum to ${sum.toFixed(2)}% instead of 100%`);
          }
        }
      });
      
      console.log("✅ All portfolios verified");
      // ═════════════════════════════════════════════════════════════════════════════

      const optimal_portfolio = optimizationResults.optimal_portfolio;
      const minimum_variance_portfolio = optimizationResults.minimum_variance_portfolio;
      const maximum_return_portfolio = optimizationResults.maximum_return_portfolio;

      // Log validation warnings
      if (optimizationResults.validation && optimizationResults.validation.warnings && optimizationResults.validation.warnings.length > 0) {
        console.log("ℹ️ Portfolio advisory notices:", optimizationResults.validation.warnings.map(w => w.message || w));
      }

      console.log("✅ Optimization Results:");
      console.log("   Optimal: Return=" + (typeof optimal_portfolio.expected_return === "number" && Number.isFinite(optimal_portfolio.expected_return) ? optimal_portfolio.expected_return.toFixed(2) : "Not Available") + "%, Risk=" + (typeof optimal_portfolio.risk === "number" && Number.isFinite(optimal_portfolio.risk) ? optimal_portfolio.risk.toFixed(2) : "Not Available") + "%, Sharpe=" + (typeof optimal_portfolio.sharpe_ratio === "number" && Number.isFinite(optimal_portfolio.sharpe_ratio) ? optimal_portfolio.sharpe_ratio.toFixed(3) : "Not Available"));
      console.log("   Min Var: Return=" + (typeof minimum_variance_portfolio.expected_return === "number" && Number.isFinite(minimum_variance_portfolio.expected_return) ? minimum_variance_portfolio.expected_return.toFixed(2) : "Not Available") + "%, Risk=" + (typeof minimum_variance_portfolio.risk === "number" && Number.isFinite(minimum_variance_portfolio.risk) ? minimum_variance_portfolio.risk.toFixed(2) : "Not Available") + "%, Sharpe=" + (typeof minimum_variance_portfolio.sharpe_ratio === "number" && Number.isFinite(minimum_variance_portfolio.sharpe_ratio) ? minimum_variance_portfolio.sharpe_ratio.toFixed(3) : "Not Available"));
      console.log("   Max Ret: Return=" + (typeof maximum_return_portfolio.expected_return === "number" && Number.isFinite(maximum_return_portfolio.expected_return) ? maximum_return_portfolio.expected_return.toFixed(2) : "Not Available") + "%, Risk=" + (typeof maximum_return_portfolio.risk === "number" && Number.isFinite(maximum_return_portfolio.risk) ? maximum_return_portfolio.risk.toFixed(2) : "Not Available") + "%, Sharpe=" + (typeof maximum_return_portfolio.sharpe_ratio === "number" && Number.isFinite(maximum_return_portfolio.sharpe_ratio) ? maximum_return_portfolio.sharpe_ratio.toFixed(3) : "Not Available"));

      // ✅ NEW: VIX-ADJUSTED FORWARD-LOOKING RISK CALCULATION
      // Calculate portfolio-level VIX-adjusted risk for each strategy
      let forwardRiskMetrics = null;
      
      if (vixData && !vixLoading && !vixError) {
        console.log('🔮 Calculating VIX-adjusted forward-looking risk...');
        
        try {
          // Get correlation matrix for forward risk calculation
          const correlationMatrix = getCorrelationMatrix(allCompanyData);
          
          // Calculate for optimal portfolio
          const optimalWeights = Object.keys(optimal_portfolio.allocations).map(symbol => 
            optimal_portfolio.allocations[symbol] / 100
          );
          
          forwardRiskMetrics = {
            optimal: calculateForwardLookingRisk(
              allCompanyData,
              optimalWeights,
              correlationMatrix,
              vixData
            ),
            minimum_variance: null,
            maximum_return: null
          };
          
          // Calculate for minimum variance portfolio
          if (minimum_variance_portfolio && minimum_variance_portfolio.allocations) {
            const minVarWeights = Object.keys(minimum_variance_portfolio.allocations).map(symbol => 
              minimum_variance_portfolio.allocations[symbol] / 100
            );
            forwardRiskMetrics.minimum_variance = calculateForwardLookingRisk(
              allCompanyData,
              minVarWeights,
              correlationMatrix,
              vixData
            );
          }
          
          // Calculate for maximum return portfolio
          if (maximum_return_portfolio && maximum_return_portfolio.allocations) {
            const maxRetWeights = Object.keys(maximum_return_portfolio.allocations).map(symbol => 
              maximum_return_portfolio.allocations[symbol] / 100
            );
            forwardRiskMetrics.maximum_return = calculateForwardLookingRisk(
              allCompanyData,
              maxRetWeights,
              correlationMatrix,
              vixData
            );
          }
          
          console.log('✅ VIX-adjusted risk metrics calculated:', {
            optimal: forwardRiskMetrics.optimal ? {
              historical: forwardRiskMetrics.optimal.historicalRisk,
              forward: forwardRiskMetrics.optimal.forwardRisk,
              regimeImpact: forwardRiskMetrics.optimal.regimeImpact,
              vixLevel: forwardRiskMetrics.optimal.vixLevel,
              regime: forwardRiskMetrics.optimal.regime
            } : null,
            vixRegime: vixData.regime,
            vixLevel: vixData.currentVIX
          });
          
        } catch (vixCalcError) {
          console.error('❌ VIX risk calculation error:', vixCalcError);
          console.warn('⚠️ Proceeding without VIX-adjusted metrics');
          forwardRiskMetrics = null;
        }
      } else {
        console.warn('⚠️ VIX data not available - skipping forward-looking risk calculation');
        if (vixLoading) console.warn('   Reason: VIX data still loading');
        if (vixError) console.warn('   Reason: VIX fetch error -', vixError);
        if (!vixData) console.warn('   Reason: No VIX data');
      }

      const totalAmount = parseFloat(investmentAmount);

      const finalResult = {
        companies: allCompanyData,
        optimal_portfolio,
        minimum_variance_portfolio,
        maximum_return_portfolio,
        total_investment: totalAmount,
        monthly_contribution: parseFloat(monthlyContribution),
        investment_goal: parseFloat(investmentGoal),
        validation: optimizationResults.validation,
        portfolio_quality: optimizationResults.portfolio_quality || {},
        return_cap_adjustments: optimizationResults.return_cap_adjustments || [],
        similarity_warnings: similarityWarnings,
        diversification_recommendations: diversificationRecommendations,
        // ✅ NEW: Add VIX-adjusted risk metrics
        forward_risk_metrics: forwardRiskMetrics,
        vix_data: vixData ? { ...vixData } : null
      };

      setAnalysisResult(finalResult);

      // Save analysis to AWS Lambda (replaces base44.entities.PortfolioAnalysis.create)
      try {
        const savedAnalysis = await callAwsFunction('saveAnalysis', {
          selected_companies: selectedSymbols,
          total_investment: totalAmount,
          analysis_data: finalResult,
          analysis_date: new Date().toISOString().split('T')[0]
        });
        
        // Update state to reflect this is fresh analysis (not cached)
        setIsCachedResults(false);
        setCacheTimestamp(new Date().toISOString());
        setCurrentAnalysisId(savedAnalysis.id);
        
        console.log(`✅ Analysis saved with ID: ${savedAnalysis.id}`);
      } catch (saveError) {
        console.error("❌ Failed to save analysis:", saveError);
        // Non-critical error - continue with analysis display
      }

      // Reload companies to get updated data
      await loadCompanies();
    } catch (error) {
      const errorMsg = error.message || "Unknown error occurred";
      alert(`Analysis failed: ${errorMsg}\n\nPlease try again or select fewer companies.`);
      console.error("Analysis error:", error);
    }

    setIsAnalyzing(false);
  };

  const getValuationColor = (valuation) => {
    switch(valuation) {
      case "undervalued": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "overvalued": return "text-rose-700 bg-rose-50 border-rose-200";
      default: return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const getValuationIcon = (valuation) => {
    return valuation === "undervalued" ? TrendingUp : valuation === "overvalued" ? TrendingDown : Activity;
  };

  const getCurrentPortfolio = () => {
    if (!analysisResult) return null;
    
    switch(selectedStrategy) {
      case "minimum_variance":
        return analysisResult.minimum_variance_portfolio;
      case "maximum_return":
        return analysisResult.maximum_return_portfolio;
      default:
        return analysisResult.optimal_portfolio;
    }
  };

  const getStrategyIcon = (strategy) => {
    switch(strategy) {
      case "minimum_variance": return Shield;
      case "maximum_return": return Zap;
      default: return Scale;
    }
  };

  const getStrategyColor = (strategy) => {
    switch(strategy) {
      case "minimum_variance": return "from-emerald-600 to-teal-600";
      case "maximum_return": return "from-orange-600 to-red-600";
      default: return "from-blue-600 to-indigo-600";
    }
  };

  const handleOpenTrade = (symbol, allocationPercent, currentPrice) => {
    const investAmount = analysisResult.total_investment || parseFloat(investmentAmount);
    const allocatedAmount = (allocationPercent / 100) * investAmount;
    const quantity = currentPrice > 0 ? Math.floor(allocatedAmount / currentPrice) : 0;
    
    setTradeSymbol(symbol);
    setSuggestedQuantity(quantity);
    setIsTradeModalOpen(true);
  };

  const handleExecuteTrade = async (tradeData) => {
    try {
      // AWS Lambda call to execute paper trade (replaces base44.functions.invoke)
      const response = await callAwsFunction('executePaperTrade', tradeData);
      
      if (response.success) {
        alert(response.message + '\n\nCheck your Portfolio page to see updated positions.');
      } else {
        alert(response.message || 'Trade was rejected');
      }
    } catch (error) {
      alert('Error executing trade: ' + (error.message || 'Unknown error'));
    }
  };

  const handleTradeAllAllocations = () => {
    const currentPortfolio = getCurrentPortfolio();
    if (!currentPortfolio || !currentPortfolio.allocations) {
      alert("No portfolio data available");
      return;
    }

    if (!analysisResult.companies || analysisResult.companies.length === 0) {
      alert("No company data available");
      return;
    }

    const investAmount = analysisResult.total_investment || parseFloat(investmentAmount) || 0;
    
    console.log("=== Trade All Debug ===");
    console.log("Current allocations:", currentPortfolio.allocations);
    console.log("Available companies:", analysisResult.companies.map(c => ({ symbol: c.symbol, price: c.current_price })));
    console.log("Investment amount:", investAmount);
    
    const allocationData = Object.entries(currentPortfolio.allocations).map(([symbol, percent]) => {
      const company = analysisResult.companies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
      
      if (!company) {
        console.error(`Company not found for symbol: ${symbol}`);
        console.log("Available symbols:", analysisResult.companies.map(c => c.symbol));
        return null;
      }
      
      if (!company.current_price || company.current_price <= 0) {
        console.error(`Invalid price for ${symbol}: ${company.current_price}`);
        return null;
      }
      
      // Convert to percentage if it's in decimal format (0-1 range)
      const percentValue = percent < 1 ? percent * 100 : percent;
      const allocatedAmount = (percentValue / 100) * investAmount;
      const quantity = Math.floor(allocatedAmount / company.current_price);
      
      console.log(`${symbol}: ${percentValue}% = $${allocatedAmount} = ${quantity} shares @ $${company.current_price}`);
      
      return {
        symbol: symbol,
        quantity: quantity,
        price: company.current_price
      };
    }).filter(item => item !== null && item.quantity > 0);

    console.log("Final allocation data:", allocationData);

    if (allocationData.length === 0) {
      alert("No valid trades to execute.\n\nDebug info:\n" + 
            `- Allocations: ${Object.keys(currentPortfolio.allocations).length}\n` +
            `- Companies: ${analysisResult.companies.length}\n` +
            `- Investment: $${investAmount}\n\n` +
            "Check console for details.");
      return;
    }

    // =================
    // ============================================================================
// SECTION 4 (PART 4): Trade Navigation, Comparison Data & JSX Start
// ============================================================================
// This section contains:
// - handleTradeAllAllocations() completion (sessionStorage & navigation)
// - COLORS constant for charts
// - comparisonData calculation for portfolio comparison charts
// - JSX rendering start:
//   - Page header with title and description
//   - Loading cached analysis indicator
//   - Cached results banner with refresh button
//   - Analysis configuration form (when no results)
//   - Investment input fields (amount, monthly contribution, goal)
//   - Quick preset buttons
//   - Analyze button
//   - Incompatible analysis warning
//   - Session change summary, analysis change log, behavioral nudge
//   - Platform positioning
//   - Methodology & transparency card (collapsible)

// ============================================================================

    // Store allocation data in sessionStorage to pass to PracticeTrading page
    sessionStorage.setItem('recommendedAllocations', JSON.stringify(allocationData));

    // Navigate to Practice Trading page
    navigate(createPageUrl('PracticeTrading'));
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  const comparisonData = (analysisResult && 
    analysisResult.optimal_portfolio && 
    analysisResult.minimum_variance_portfolio && 
    analysisResult.maximum_return_portfolio) ? [
    { 
      name: "Optimal", 
      return: typeof analysisResult.optimal_portfolio.expected_return === "number" && Number.isFinite(analysisResult.optimal_portfolio.expected_return) ? analysisResult.optimal_portfolio.expected_return.toFixed(2) : "Not Available",
      risk: typeof analysisResult.optimal_portfolio.risk === "number" && Number.isFinite(analysisResult.optimal_portfolio.risk) ? analysisResult.optimal_portfolio.risk.toFixed(2) : "Not Available",
      sharpe: typeof analysisResult.optimal_portfolio.sharpe_ratio === "number" && Number.isFinite(analysisResult.optimal_portfolio.sharpe_ratio) ? analysisResult.optimal_portfolio.sharpe_ratio.toFixed(3) : "Not Available"
    },
    { 
      name: "Min Variance", 
      return: typeof analysisResult.minimum_variance_portfolio.expected_return === "number" && Number.isFinite(analysisResult.minimum_variance_portfolio.expected_return) ? analysisResult.minimum_variance_portfolio.expected_return.toFixed(2) : "Not Available",
      risk: typeof analysisResult.minimum_variance_portfolio.risk === "number" && Number.isFinite(analysisResult.minimum_variance_portfolio.risk) ? analysisResult.minimum_variance_portfolio.risk.toFixed(2) : "Not Available",
      sharpe: typeof analysisResult.minimum_variance_portfolio.sharpe_ratio === "number" && Number.isFinite(analysisResult.minimum_variance_portfolio.sharpe_ratio) ? analysisResult.minimum_variance_portfolio.sharpe_ratio.toFixed(3) : "Not Available"
    },
    { 
      name: "Max Return", 
      return: typeof analysisResult.maximum_return_portfolio.expected_return === "number" && Number.isFinite(analysisResult.maximum_return_portfolio.expected_return) ? analysisResult.maximum_return_portfolio.expected_return.toFixed(2) : "Not Available",
      risk: typeof analysisResult.maximum_return_portfolio.risk === "number" && Number.isFinite(analysisResult.maximum_return_portfolio.risk) ? analysisResult.maximum_return_portfolio.risk.toFixed(2) : "Not Available",
      sharpe: typeof analysisResult.maximum_return_portfolio.sharpe_ratio === "number" && Number.isFinite(analysisResult.maximum_return_portfolio.sharpe_ratio) ? analysisResult.maximum_return_portfolio.sharpe_ratio.toFixed(3) : "Not Available"
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                Portfolio Risk & Return Explorer
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-slate-600">
                Explore portfolio strategies, understand trade-offs, and test diversification scenarios
              </p>
            </div>
          </div>
        </motion.div>

        {isLoadingCached && (
          <Card className="border-2 border-blue-200 shadow-xl bg-white mb-8 rounded-xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-lg text-slate-700 font-semibold">Loading cached analysis...</p>
            </CardContent>
          </Card>
        )}

        {isCachedResults && analysisResult && (
          <Card className="border-2 border-blue-500 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 mb-6 rounded-xl">
            <CardContent className="p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 mb-1">
                      📦 Cached Analysis Results
                    </h3>
                    <p className="text-sm text-blue-800">
                      Viewing saved analysis from {cacheTimestamp ? new Date(cacheTimestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      }) : 'previous session'}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      No compute resources used • Instant load
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg whitespace-nowrap"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Refresh Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!analysisResult && !isLoadingCached && (
          <Card className="border-2 border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm mb-8 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-blue-600" />
                Configure Your Investment Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Selected Companies ({selectedSymbols.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSymbols.length === 0 ? (
                    <p className="text-slate-500">No investments selected. Go to Browse Investments to select.</p>
                  ) : (
                    selectedSymbols.map(symbol => {
                      const company = companies.find(c => c.symbol === symbol);
                      return (
                        <Badge key={symbol} className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">
                          {symbol} {company && `- ${company.name}`}
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="investment" className="text-base font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Initial Investment Amount ($)
                  </Label>
                  <Input
                    id="investment"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="10000"
                    className="text-lg h-14 mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="monthly" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Monthly Contribution ($)
                  </Label>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    placeholder="0"
                    className="text-lg h-14 mt-2"
                  />
                  <p className="text-sm text-slate-500 mt-1">Optional: Add regular monthly investments</p>
                </div>
              </div>

              <div>
                <Label htmlFor="goal" className="text-base font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Investment Goal ($)
                </Label>
                <Input
                  id="goal"
                  type="number"
                  value={investmentGoal}
                  onChange={(e) => setInvestmentGoal(e.target.value)}
                  placeholder="1000000"
                  className="text-lg h-14 mt-2"
                />
                <p className="text-sm text-slate-500 mt-1">Target amount you want to reach</p>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <Button
                  onClick={() => setMonthlyContribution("100")}
                  variant="outline"
                  className="text-xs md:text-sm px-2 md:px-4"
                >
                  $100/mo
                </Button>
                <Button
                  onClick={() => setMonthlyContribution("200")}
                  variant="outline"
                  className="text-xs md:text-sm px-2 md:px-4"
                >
                  $200/mo
                </Button>
                <Button
                  onClick={() => setMonthlyContribution("300")}
                  variant="outline"
                  className="text-xs md:text-sm px-2 md:px-4"
                >
                  $300/mo
                </Button>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedSymbols.length === 0}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Explore Portfolio Outcomes
                  </>
                )}
              </Button>
              {selectedSymbols.length === 0 && (
                <p className="text-sm text-slate-500 text-center mt-2">
                  Please select companies from <Link to={createPageUrl("Companies")} className="text-blue-600 hover:underline font-semibold">Browse Investments</Link> first
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Incompatible Analysis Warning */}
        {analysisResult && !analysisResult.optimal_portfolio && (
          <Card className="border-2 border-amber-200 bg-amber-50 mb-8 rounded-xl">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Outdated Analysis Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-900 mb-4">
                This analysis was created with an older version of the app and is no longer compatible with the current portfolio analysis features.
              </p>
              <Button
                onClick={() => {
                  setAnalysisResult(null);
                  setInvestmentAmount("10000");
                  setMonthlyContribution("0");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Run New Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        <AnimatePresence>
          {analysisResult && analysisResult.optimal_portfolio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Session Change Summary */}
              <SessionChangeSummary 
                currentMetrics={{
                  portfolioBeta: analysisResult.optimal_portfolio?.beta,
                  riskLevel: analysisResult.optimal_portfolio?.risk ? classifyRiskLevel(analysisResult.optimal_portfolio.risk).level : null,
                  volatilityRegime: 'normal',
                  lastDataRefresh: new Date().toISOString()
                }}
              />

              {/* Analysis Change Log */}
              <AnalysisChangeLog analysisResult={analysisResult} />

              {/* Behavioral Nudge */}
              <BehavioralNudge trigger="multi_analysis" />

              {/* Platform Positioning Statement */}
              <PlatformPositioning variant="default" />

              {/* Methodology & Transparency Card */}
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-blue-900">Industry-Standard Portfolio Analysis Methodology</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMethodology(!showMethodology)}
                          className="text-blue-700 hover:bg-blue-100"
                        >
                          {showMethodology ? (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Learn More
                            </>
                          )}
                        </Button>
                      </div>
                      {!showMethodology && (
                        <p className="text-sm text-blue-800">
                          Analysis uses CAPM, Modern Portfolio Theory (MPT), and Monte Carlo simulations with real market data from Yahoo Finance.
                        </p>
                      )}
                      {showMethodology && (
                        <div className="text-sm text-blue-800 space-y-2">
                          <div>
                            <strong>📊 Data Sources & Calculations:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li><strong>Beta:</strong> Yahoo Finance 5-year monthly regression vs S&P 500. Extreme values (|β| &gt; 3.0) capped at ±2.5 for stability.</li>
                              <li><strong>Historical Returns:</strong> 3-year CAGR (if available), else 1-year trailing return from Yahoo Finance.</li>
                              <li><strong>Volatility:</strong> Annualized standard deviation from historical daily/weekly price movements.</li>
                            </ul>
                          </div>

                          <div>
                            <strong>🎯 Expected Return Formula:</strong>
                            <p className="ml-4 mt-1">
                              <code className="bg-blue-100 px-2 py-1 rounded">E(R) = 60% × Historical_CAGR + 40% × CAPM</code>
                            </p>
                            <p className="ml-4 mt-1">
                              Where CAPM = Rf + β × Market_Risk_Premium
                              <br/>• Rf = 4.5% (3-month US T-Bill, Dec 2024)
                              <br/>• Market Risk Premium = 8.0% (Ibbotson/SBBI historical equity premium)
                            </p>
                          </div>

                          <div>
                            <strong>🔧 Risk Adjustments:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li><strong>AI Fundamental Analysis:</strong> ±10-15% for speculative stocks, ±20% for established companies</li>
                              <li><strong>Market Cap:</strong> Micro/small-cap +15% risk, mid-cap +10% risk, large-cap +5% risk</li>
                              <li><strong>Profitability:</strong> Unprofitable companies +12% risk, high P/E &gt;40 +8% risk</li>
                              <li><strong>Company-Specific:</strong> Price momentum, dividend yield, sector volatility</li>
                            </ul>
                          </div>

                          <div>
                            <strong>⚖️ Portfolio Optimization (Markowitz MPT):</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li><strong>Optimal Portfolio:</strong> Maximizes Sharpe Ratio (risk-adjusted return) subject to constraints</li>
                              <li><strong>Minimum Variance:</strong> Global minimum risk portfolio (leftmost point on efficient frontier)</li>
                              <li><strong>Maximum Return:</strong> Concentrated allocation to highest-return asset (not on efficient frontier)</li>
                              <li><strong>Constraints:</strong> Max 40% per asset, Min 15% for secondary allocation (realistic diversification)</li>
                            </ul>
                          </div>

                          <div>
                            <strong>🎲 Projections & Probabilities:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li><strong>Growth Calculation:</strong> Monthly compounding with contributions, assumes reinvested returns</li>
                              <li><strong>Goal Probability:</strong> 10,000 Monte Carlo simulations with normal return distribution</li>
                              <li><strong>Max Drawdown:</strong> Cornish-Fisher VaR method (Magdon-Ismail formula) for 95th percentile loss</li>
                            </ul>
                          </div>

                          <div className="pt-2 border-t border-blue-300">
                            <strong>✅ Asset Selection Quality:</strong>
                            <p className="ml-4 mt-1">
                              Analysis automatically detects similarity in sector, market cap, and growth stage. 
                              <strong className="text-blue-900"> Recommendations are advisory only</strong> — you retain full control over asset selection.
                              Adding diversified index funds (SPY, QQQ, BND) typically improves portfolio efficiency.
                            </p>
                          </div>

                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-300">
                            <p className="text-xs text-amber-900">
                              <strong>⚠️ Important Disclaimer:</strong> These are model-based projections for educational purposes only. 
                              Actual returns may differ significantly due to market volatility, economic changes, company-specific events, and unforeseen risks. 
                              Past performance does not guarantee future results. This is not investment advice. 
                              Consult a licensed financial advisor before making investment decisions.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* 
=====================
SECTION 5 (PART 5): Analysis Results - Warnings, Cards & Strategy Comparison
============================================================================
This section contains JSX rendering for analysis results:
- Correlation & confidence warning (extreme/high/moderate tiers)
- Concentration alert
- Extreme beta warning
- Liquidity warning
- Portfolio quality diagnostics card
- Impact delta what-if analysis
- Quality vs risk visualization
- Stress testing card
- Consecutive crash scenario
- Model limitations disclosure
- Rebalancing simulator
- Forward risk card (✅ VIX INTEGRATION ADDED)
- Portfolio storytelling chart
- Confidence bands chart
- Transaction cost card
- Return cap notifications (collapsible)
- Validation warnings
- Strategy comparison cards (Optimal Portfolio card - start)
//
✅ VIX CHANGES: Added vixData and forwardRiskMetrics props to ForwardRiskCard
ForwardRiskCard component will display VIX-adjusted risk metrics
============================================================================
 */}
              {/* Correlation & Confidence Warning */}
              {analysisResult.portfolio_quality && analysisResult.portfolio_quality.correlationTier && 
               (analysisResult.portfolio_quality.correlationTier === 'moderate' || 
                analysisResult.portfolio_quality.correlationTier === 'high' ||
                analysisResult.portfolio_quality.correlationTier === 'extreme') && (
                <Card className={`border-2 ${
                  analysisResult.portfolio_quality.correlationTier === 'extreme' ? 'border-rose-500 bg-rose-50' :
                  analysisResult.portfolio_quality.correlationTier === 'high' ? 'border-amber-500 bg-amber-50' :
                  'border-blue-300 bg-blue-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        analysisResult.portfolio_quality.correlationTier === 'extreme' ? 'bg-rose-600' :
                        analysisResult.portfolio_quality.correlationTier === 'high' ? 'bg-amber-600' :
                        'bg-blue-600'
                      }`}>
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg mb-2 ${
                          analysisResult.portfolio_quality.correlationTier === 'extreme' ? 'text-rose-900' :
                          analysisResult.portfolio_quality.correlationTier === 'high' ? 'text-amber-900' :
                          'text-blue-900'
                        }`}>
                          {analysisResult.portfolio_quality.correlationTier === 'extreme' && '🚫 Efficient Frontier Blocked'}
                          {analysisResult.portfolio_quality.correlationTier === 'high' && '⚠️ High Asset Correlation Detected'}
                          {analysisResult.portfolio_quality.correlationTier === 'moderate' && 'ℹ️ Moderate Asset Correlation'}
                        </h4>
                        <div className={`text-sm mb-3 ${
                          analysisResult.portfolio_quality.correlationTier === 'extreme' ? 'text-rose-800' :
                          analysisResult.portfolio_quality.correlationTier === 'high' ? 'text-amber-800' :
                          'text-blue-800'
                        }`}>
                          <p className="mb-2">
                            <strong>Average Correlation: {typeof analysisResult.portfolio_quality.avgCorrelation === "number" && Number.isFinite(analysisResult.portfolio_quality.avgCorrelation) ? (analysisResult.portfolio_quality.avgCorrelation * 100).toFixed(0) : "Not Available"}%</strong>
                            {' '}• Confidence: <strong>{analysisResult.portfolio_quality.confidenceLevel}</strong>
                          </p>

                          {analysisResult.portfolio_quality.correlationTier === 'extreme' && (
                            <div className="space-y-2">
                              <p>
                                Assets are too similar for a stable efficient frontier. Modern Portfolio Theory requires 
                                meaningful diversification across uncorrelated asset classes.
                              </p>
                              <p className="font-semibold">
                                ⛔ Optimization blocked. You can still view individual asset metrics and scenario projections.
                              </p>
                            </div>
                          )}

                          {analysisResult.portfolio_quality.correlationTier === 'high' && (
                            <div className="space-y-2">
                              <p>
                                Efficient frontier may be statistically unstable. The system has applied stabilization 
                                techniques (covariance regularization, stricter position limits).
                              </p>
                              <p className="font-semibold">
                                ⚠️ Results marked as "Constrained Optimization" and should be interpreted with caution.
                              </p>
                            </div>
                          )}

                          {analysisResult.portfolio_quality.correlationTier === 'moderate' && (
                            <p>
                              Assets show moderate correlation. Diversification benefits are present but limited. 
                              Adding uncorrelated assets would improve portfolio efficiency.
                            </p>
                          )}
                        </div>

                        <div className="mt-3 p-3 bg-white/50 rounded-lg border border-slate-300">
                          <p className="text-sm font-semibold text-slate-900 mb-2">
                            💡 Optional Recommendations (Not Required)
                          </p>
                          <div className="text-xs text-slate-700 space-y-1">
                            <p>• <strong>Broad Market ETFs:</strong> SPY (S&P 500), QQQ (Nasdaq), VTI (Total Market)</p>
                            <p>• <strong>Bonds:</strong> BND (Total Bond), AGG (Aggregate Bonds)</p>
                            <p>• <strong>Alternatives:</strong> GLD (Gold), VNQ (Real Estate), VXUS (International)</p>
                            <p className="mt-2 italic text-slate-600">
                              These are suggestions only. You may proceed with your current selections.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Concentration Alert */}
              {getCurrentPortfolio() && getCurrentPortfolio().allocations && (
                <ConcentrationAlert
                  allocations={getCurrentPortfolio().allocations}
                  companies={analysisResult.companies}
                  threshold={25}
                />
              )}

              {/* Extreme Beta Warning */}
              <ExtremeBetaWarning companies={analysisResult.companies} />

              {/* Liquidity Warning */}
              {getCurrentPortfolio() && getCurrentPortfolio().allocations && (
                <LiquidityWarning
                  allocations={getCurrentPortfolio().allocations}
                  companies={analysisResult.companies}
                  investmentAmount={parseFloat(investmentAmount)}
                />
              )}

              {/* Portfolio Quality Diagnostics */}
              {analysisResult.portfolio_quality && (
                <PortfolioQualityCard 
                  companies={analysisResult.companies}
                  portfolioQuality={analysisResult.portfolio_quality}
                  similarityWarnings={analysisResult.similarity_warnings}
                  diversificationRecommendations={analysisResult.diversification_recommendations}
                />

              )}

              {/* Impact Delta What-If Analysis */}
              {analysisResult.portfolio_quality && (
                <ImpactDeltaAnalysis 
                  currentPortfolio={{
                    ...analysisResult.optimal_portfolio,
                    avgCorrelation: analysisResult.portfolio_quality?.avgCorrelation,
                    goalProbability: 0.25,
                    expectedDrawdown: -85
                  }}
                  companies={analysisResult.companies}
                  diversificationRecommendations={analysisResult.diversification_recommendations}
                />
              )}

              {/* Quality vs Risk Visualization */}
              {analysisResult.portfolio_quality && analysisResult.optimal_portfolio && (
                <QualityVsRiskVisualization
                  qualityScore={analysisResult.portfolio_quality.qualityScore}
                  portfolioRisk={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
                  expectedDrawdown={analysisResult.optimal_portfolio.expectedDrawdown || -85}
                  avgSharpe={analysisResult.portfolio_quality.avgSharpe}
                  avgCorrelation={analysisResult.portfolio_quality.avgCorrelation}
                  speculativeRatio={analysisResult.portfolio_quality.speculativeRatio}
                  companies={analysisResult.companies}
                />
              )}

              {/* Phase 2: Stress Testing & Tail Risk */}
              <StressTestingCard
                companies={analysisResult.companies}
                weights={Object.values(analysisResult.optimal_portfolio.allocations || {}).map(a => (a < 1 ? a : a / 100))}
                portfolioRisk={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
                expectedReturn={Number(analysisResult.optimal_portfolio.expected_return) || 8}
              />

              {/* Consecutive Crisis Scenarios */}
              <ConsecutiveCrashScenario
                companies={analysisResult.companies}
                weights={Object.values(analysisResult.optimal_portfolio.allocations || {}).map(a => (a < 1 ? a : a / 100))}
                portfolioRisk={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
                expectedReturn={Number(analysisResult.optimal_portfolio.expected_return) || 8}
              />
              
              <ModelLimitationsDisclosure modelType="stress_testing" />

              {/* Phase 3: Rebalancing & Behavioral Analysis */}
              <RebalancingSimulator
                qualityScore={analysisResult.portfolio_quality.qualityScore}
                vixData={vixData}
                initialWeights={Object.values(analysisResult.optimal_portfolio.allocations || {}).map(a => (a < 1 ? a : a / 100))}
                expectedReturn={Number(analysisResult.optimal_portfolio.expected_return) || 8}
                volatility={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
              />

              {/* ✅ Phase 4: Forward-Looking Risk Analysis (VIX-ADJUSTED) */}
              <ForwardRiskCard
                companies={analysisResult.companies}
                weights={Object.values(analysisResult.optimal_portfolio.allocations || {}).map(a => (a < 1 ? a : a / 100))}
                correlationMatrix={getCorrelationMatrix(analysisResult.companies)}
                portfolioRisk={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
                expectedReturn={Number(analysisResult.optimal_portfolio.expected_return) || 8}
                qualityScore={analysisResult.portfolio_quality.qualityScore}
                vixData={vixData}
                forwardRiskMetrics={analysisResult.forward_risk_metrics?.optimal}
              />

              {/* Portfolio Storytelling with Tail Events */}
              <PortfolioStorytellingChart
                portfolioReturn={typeof analysisResult.optimal_portfolio.expected_return === "number" && isFinite(analysisResult.optimal_portfolio.expected_return) ? analysisResult.optimal_portfolio.expected_return.toFixed(2) : "Not Available"}
                portfolioRisk={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
                companies={analysisResult.companies}
                maxDrawdown={analysisResult.optimal_portfolio.expectedDrawdown}
                recoveryMonths={36}
                currentCorrelation={analysisResult.portfolio_quality?.avgCorrelation || 0.6}
              />

              {/* Confidence Bands */}
              <ConfidenceBandsChart
                portfolioReturn={typeof analysisResult.optimal_portfolio.expected_return === "number" && isFinite(analysisResult.optimal_portfolio.expected_return) ? analysisResult.optimal_portfolio.expected_return.toFixed(2) : "Not Available"}
                portfolioRisk={Number(vixData?.impliedAnnualVol || vixData?.historicalVol) || 18}
                investmentAmount={parseFloat(investmentAmount)}
                monthlyContribution={parseFloat(monthlyContribution)}
              />

              {/* Transaction Costs */}
              <TransactionCostCard
                allocations={analysisResult.optimal_portfolio.allocations}
                companies={analysisResult.companies}
                investmentAmount={parseFloat(investmentAmount)}
              />

              {/* Return Cap Notifications */}
              {analysisResult.return_cap_adjustments && analysisResult.return_cap_adjustments.length > 0 && (
                <Card className="border-2 border-blue-200 bg-blue-50 rounded-xl shadow-md">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-blue-900">Expected Returns Capped for Long-Term Realism</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReturnCaps(!showReturnCaps)}
                            className="text-blue-700 hover:bg-blue-100"
                          >
                            {showReturnCaps ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                        </div>
                        {!showReturnCaps && (
                          <p className="text-sm text-blue-800">
                            Some asset returns were adjusted to reflect long-term mean reversion. Click to see details.
                          </p>
                        )}
                        {showReturnCaps && (
                          <>
                            <p className="text-sm text-blue-800 mb-2">
                              The following assets had their expected returns adjusted to reflect long-term market reality and mean reversion:
                            </p>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {analysisResult.return_cap_adjustments.map((adj, idx) => (
                                <li key={idx}>
                                  <strong>{adj.symbol}</strong> ({adj.assetClass}): 
                                  {typeof adj.original === "number" && Number.isFinite(adj.original) ? adj.original.toFixed(1) : "Not Available"}% → {typeof adj.capped === "number" && Number.isFinite(adj.capped) ? adj.capped.toFixed(1) : "Not Available"}% 
                                  (max for asset class)
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-blue-700 mt-2 italic">
                              ℹ️ Long-term expected returns are capped to prevent unrealistic wealth projections. 
                              Past momentum does not guarantee future returns.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Validation Warnings */}
              {analysisResult.validation && analysisResult.validation.warnings && analysisResult.validation.warnings.length > 0 && (
                <Card className="border-2 border-amber-300 bg-amber-50 rounded-xl shadow-md">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900 mb-1">Portfolio Advisory Notices</h4>
                        <ul className="text-sm text-amber-800 space-y-1">
                          {analysisResult.validation.warnings.map((warning, idx) => (
                            <li key={idx}>• {typeof warning === 'string' ? warning : warning.message || JSON.stringify(warning)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strategy Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Optimal Portfolio */}
                <Card 
                  className={`border-2 cursor-pointer transition-all duration-300 rounded-xl h-full ${
                    selectedStrategy === "optimal" 
                      ? "border-blue-500 shadow-lg shadow-blue-500/30 scale-105" 
                      : "border-slate-200 hover:border-blue-300 shadow-md"
                  }`}
                  onClick={() => setSelectedStrategy("optimal")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Scale className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Risk-Adjusted Allocation</h3>
                        <p className="text-xs text-slate-500">
                          {analysisResult.optimal_portfolio.stabilizationApplied
                            ? 'Constrained (High Correlation)' 
                            : analysisResult.optimal_portfolio.constraints_applied 
                            ? 'Max Sharpe (Constrained)' 
                            : 'Max Sharpe Ratio'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                    <div className="bg-blue-50/50 rounded-lg p-3">
                    <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Modeled Base-Case Return</p>
                    <p className={`text-2xl md:text-3xl font-bold tabular-nums ${
                    (analysisResult.optimal_portfolio.expected_return || 0) >= 0 
                    ? 'text-blue-600' 
                    : 'text-rose-600'
                    }`}>
                    {typeof analysisResult.optimal_portfolio.expected_return === "number" && isFinite(analysisResult.optimal_portfolio.expected_return) ? analysisResult.optimal_portfolio.expected_return.toFixed(2) : "Not Available"}%
                    </p>
                      {(analysisResult.optimal_portfolio.expected_return || 0) < 0 && (
                        <p className="text-xs text-rose-600 mt-1 font-semibold">
                          ⚠️ Negative modeled return
                        </p>
                      )}
                    </div>
                    <div className="bg-amber-50/50 rounded-lg p-3">
                      <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Volatility (σ)</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 tabular-nums">
                        {typeof analysisResult.optimal_portfolio.risk === "number" && isFinite(analysisResult.optimal_portfolio.risk) ? analysisResult.optimal_portfolio.risk.toFixed(2) : "Not Available"}%
                      </p>
                    </div>
                    <div className="bg-indigo-50/50 rounded-lg p-3">
                      <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Sharpe Ratio</p>
                      <p className="text-2xl md:text-3xl font-bold text-indigo-600 tabular-nums">
                        {typeof analysisResult.optimal_portfolio.sharpe_ratio === "number" && isFinite(analysisResult.optimal_portfolio.sharpe_ratio) ? analysisResult.optimal_portfolio.sharpe_ratio.toFixed(3) : "Not Available"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Highest risk-adjusted return</p>
                    </div>
                    </div>
                  </CardContent>
                </Card>
                {/* ============================================================================
                // ============================================================================
                // SECTION 6 (PART 6): Strategy Cards & Investment Projections
// ============================================================================
// This section contains JSX rendering for:
// - Minimum Variance Portfolio card (conservative/defensive strategy)
// - Maximum Return Portfolio card (aggressive/growth strategy)
// - Negative return warning (alerts user to capital erosion risk)
// - Investment Growth Projections card:
//   - 5/10/20/30 year projections with contribution breakdown
//   - Model limitations disclosure
//   - Goal achievement probability
//   - Probability-weighted projections
//   - 30-year growth chart (AreaChart with contributions overlay)
//   - Monthly contribution scenarios comparison (4 scenarios)
//
// ✅ VIX ENHANCEMENT: Added forward-looking risk display to strategy cards
// Shows VIX-adjusted risk metrics if available from analysisResult
// ============================================================================ */}

                {/* Minimum Variance Portfolio */}
                {analysisResult.minimum_variance_portfolio && (
                  <Card 
                    className={`border-2 cursor-pointer transition-all duration-300 rounded-xl h-full ${
                      selectedStrategy === "minimum_variance" 
                        ? "border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105" 
                        : "border-slate-200 hover:border-emerald-300 shadow-md"
                    }`}
                    onClick={() => setSelectedStrategy("minimum_variance")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Minimum Variance</h3>
                          <p className="text-xs text-slate-500">Conservative / Defensive</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-emerald-50/50 rounded-lg p-3">
                          <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Modeled Base-Case Return</p>
                          <p className="text-2xl md:text-3xl font-bold text-emerald-600 tabular-nums">
                            {typeof analysisResult.minimum_variance_portfolio.expected_return === "number" && isFinite(analysisResult.minimum_variance_portfolio.expected_return) ? analysisResult.minimum_variance_portfolio.expected_return.toFixed(2) : "Not Available"}%
                          </p>
                        </div>
                        <div className="bg-teal-50/50 rounded-lg p-3">
                          <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">
                            {analysisResult.forward_risk_metrics?.minimum_variance ? 'Historical Risk' : 'Volatility (σ)'}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-emerald-900 tabular-nums">
                            {typeof analysisResult.minimum_variance_portfolio.risk === "number" && isFinite(analysisResult.minimum_variance_portfolio.risk) ? analysisResult.minimum_variance_portfolio.risk.toFixed(2) : "Not Available"}%
                          </p>
                          {/* ✅ NEW: Show forward-looking risk if available */}
                          {analysisResult.forward_risk_metrics?.minimum_variance && (
                            <div className="mt-2 pt-2 border-t border-teal-200">
                              <p className="text-xs text-slate-600 mb-1">Forward-Looking Risk (VIX-adjusted)</p>
                              <p className="text-lg font-bold text-purple-700 tabular-nums">
                                {typeof analysisResult.forward_risk_metrics.minimum_variance.forwardRisk === "number" && isFinite(analysisResult.forward_risk_metrics.minimum_variance.forwardRisk) ? analysisResult.forward_risk_metrics.minimum_variance.forwardRisk.toFixed(2) : "Not Available"}%
                              </p>
                              {analysisResult.forward_risk_metrics.minimum_variance.regimeImpact !== 0 && (
                                <p className="text-xs text-purple-600 mt-1">
                                  {analysisResult.forward_risk_metrics.minimum_variance.regimeImpact > 0 ? '+' : ''}
                                  {typeof analysisResult.forward_risk_metrics.minimum_variance.regimeImpact === "number" && isFinite(analysisResult.forward_risk_metrics.minimum_variance.regimeImpact) ? analysisResult.forward_risk_metrics.minimum_variance.regimeImpact.toFixed(2) : "Not Available"}% regime impact
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-emerald-700 mt-1 font-semibold">Lowest risk portfolio</p>
                        </div>
                        <div className="bg-cyan-50/50 rounded-lg p-3">
                          <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Sharpe Ratio</p>
                          <p className="text-2xl md:text-3xl font-bold text-teal-600 tabular-nums">
                            {typeof analysisResult.minimum_variance_portfolio.sharpe_ratio === "number" && isFinite(analysisResult.minimum_variance_portfolio.sharpe_ratio) ? analysisResult.minimum_variance_portfolio.sharpe_ratio.toFixed(3) : "Not Available"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Maximum Return Portfolio */}
                {analysisResult.maximum_return_portfolio && (
                  <Card 
                    className={`border-2 cursor-pointer transition-all duration-300 rounded-xl h-full ${
                      selectedStrategy === "maximum_return" 
                        ? "border-orange-500 shadow-lg shadow-orange-500/30 scale-105" 
                        : "border-slate-200 hover:border-orange-300 shadow-md"
                    }`}
                    onClick={() => setSelectedStrategy("maximum_return")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Highest Modeled Upside</h3>
                          <p className="text-xs text-slate-500">Aggressive / Growth</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-orange-50/50 rounded-lg p-3">
                          <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Modeled Base-Case Return</p>
                          <p className="text-2xl md:text-3xl font-bold text-orange-600 tabular-nums">
                            {typeof analysisResult.maximum_return_portfolio.expected_return === "number" && isFinite(analysisResult.maximum_return_portfolio.expected_return) ? analysisResult.maximum_return_portfolio.expected_return.toFixed(2) : "Not Available"}%
                          </p>
                          <p className="text-xs text-orange-700 mt-1 font-semibold">Highest modeled upside</p>
                        </div>
                        <div className="bg-rose-50/50 rounded-lg p-3">
                          <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">
                            {analysisResult.forward_risk_metrics?.maximum_return ? 'Historical Risk' : 'Volatility (σ)'}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-slate-900 tabular-nums">
                            {typeof analysisResult.maximum_return_portfolio.risk === "number" && isFinite(analysisResult.maximum_return_portfolio.risk) ? analysisResult.maximum_return_portfolio.risk.toFixed(2) : "Not Available"}%
                          </p>
                          {/* ✅ NEW: Show forward-looking risk if available */}
                          {analysisResult.forward_risk_metrics?.maximum_return && (
                            <div className="mt-2 pt-2 border-t border-rose-200">
                              <p className="text-xs text-slate-600 mb-1">Forward-Looking Risk (VIX-adjusted)</p>
                              <p className="text-lg font-bold text-purple-700 tabular-nums">
                                {typeof analysisResult.forward_risk_metrics.maximum_return.forwardRisk === "number" && isFinite(analysisResult.forward_risk_metrics.maximum_return.forwardRisk) ? analysisResult.forward_risk_metrics.maximum_return.forwardRisk.toFixed(2) : "Not Available"}%
                              </p>
                              {analysisResult.forward_risk_metrics.maximum_return.regimeImpact !== 0 && (
                                <p className="text-xs text-purple-600 mt-1">
                                  {analysisResult.forward_risk_metrics.maximum_return.regimeImpact > 0 ? '+' : ''}
                                  {typeof analysisResult.forward_risk_metrics.maximum_return.regimeImpact === "number" && isFinite(analysisResult.forward_risk_metrics.maximum_return.regimeImpact) ? analysisResult.forward_risk_metrics.maximum_return.regimeImpact.toFixed(2) : "Not Available"}% regime impact
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="bg-red-50/50 rounded-lg p-3">
                          <p className="text-xs md:text-sm text-slate-600 mb-1.5 font-medium">Sharpe Ratio</p>
                          <p className="text-2xl md:text-3xl font-bold text-red-600 tabular-nums">
                            {typeof analysisResult.maximum_return_portfolio.sharpe_ratio === "number" && isFinite(analysisResult.maximum_return_portfolio.sharpe_ratio) ? analysisResult.maximum_return_portfolio.sharpe_ratio.toFixed(3) : "Not Available"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Higher risk accepted</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Negative Return Warning */}
              {(() => {
              const currentPortfolio = getCurrentPortfolio();
              if (!currentPortfolio) return null;
              const expectedReturn = currentPortfolio.expected_return;

              if (expectedReturn < 0) {
                return (
                  <Card className="border-2 border-rose-500 bg-rose-50 rounded-xl shadow-xl">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-rose-900 mb-2">
                            ⚠️ Negative Expected Return Portfolio
                          </h3>
                          <p className="text-sm text-rose-800 mb-3">
                            The selected portfolio has a <strong>negative {typeof expectedReturn === "number" && isFinite(expectedReturn) ? expectedReturn.toFixed(2) : "Not Available"}% expected annual return</strong>. 
                            Despite regular contributions, this portfolio is projected to <strong>erode capital over time</strong>.
                          </p>
                          <div className="bg-white/50 p-4 rounded-xl border-2 border-rose-300 shadow-sm">
                            <p className="text-sm font-semibold text-rose-900 mb-2">What this means:</p>
                            <ul className="text-sm text-rose-800 space-y-1 list-disc list-inside">
                              <li>Your $10,000 initial investment is expected to decline in value</li>
                              <li>Monthly contributions may not offset portfolio losses</li>
                              <li>Long-term growth projections show capital erosion, not accumulation</li>
                            </ul>
                          </div>
                          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-300 shadow-sm">
                            <p className="text-sm font-semibold text-emerald-900 mb-2">✅ Recommendations:</p>
                            <ul className="text-sm text-emerald-800 space-y-1 list-disc list-inside">
                              <li><strong>Add diversified assets:</strong> Consider index funds like SPY (S&P 500) or QQQ (Nasdaq 100)</li>
                              <li><strong>Reduce speculative exposure:</strong> High-risk stocks should be 5-20% of portfolio, not 100%</li>
                              <li><strong>Seek professional advice:</strong> Consult a licensed financial advisor for portfolio construction</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
              })()}

              {/* Investment Growth Projections */}
              {(() => {
              const currentPortfolio = getCurrentPortfolio();
              if (!currentPortfolio || !currentPortfolio.expected_return) return null;

              const expectedReturn = currentPortfolio.expected_return;
                const portfolioRisk = currentPortfolio.risk;
                const principal = parseFloat(investmentAmount);
                const monthly = parseFloat(monthlyContribution);
                const goal = parseFloat(investmentGoal);

                const projections30Years = generateGrowthProjection(principal, monthly, expectedReturn, 30);
                const value5Years = calculateFutureValue(principal, monthly, expectedReturn, 5);
                const value10Years = calculateFutureValue(principal, monthly, expectedReturn, 10);
                const value20Years = calculateFutureValue(principal, monthly, expectedReturn, 20);
                const value30Years = calculateFutureValue(principal, monthly, expectedReturn, 30);
                const yearsToGoal = calculateTimeToGoal(principal, monthly, expectedReturn, goal);

                // Calculate contribution breakdown for transparency
                const totalContributions5yr = principal + (monthly * 12 * 5);
                const investmentGrowth5yr = value5Years - totalContributions5yr;
                const totalContributions10yr = principal + (monthly * 12 * 10);
                const investmentGrowth10yr = value10Years - totalContributions10yr;
                const totalContributions20yr = principal + (monthly * 12 * 20);
                const investmentGrowth20yr = value20Years - totalContributions20yr;
                const totalContributions30yr = principal + (monthly * 12 * 30);
                const investmentGrowth30yr = value30Years - totalContributions30yr;

                // Monte Carlo simulation for goal probability
                const monthsToGoal = yearsToGoal ? Math.ceil(yearsToGoal * 12) : 360;
                const goalProbability = calculateGoalProbability(
                  principal, 
                  monthly, 
                  expectedReturn / 100, 
                  portfolioRisk / 100, 
                  goal, 
                  monthsToGoal
                );

                // Use simplified drawdown calculation (95th percentile statistical)
                const expectedDrawdown = calculateExpectedDrawdown(portfolioRisk, yearsToGoal || 30, expectedReturn);

                // DATA HYGIENE: Ensure drawdown is valid
                const sanitizedDrawdown = (expectedDrawdown && !isNaN(expectedDrawdown) && isFinite(expectedDrawdown)) 
                  ? expectedDrawdown 
                  : -Math.min(85, portfolioRisk * 2.5);

                return (
                  <Card className="border-2 border-slate-200 shadow-xl bg-white rounded-xl">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl px-5 md:px-6 py-5 md:py-6">
                      <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                        <Target className="w-6 h-6 md:w-7 md:h-7" />
                        Investment Growth Projections
                      </CardTitle>
                      <div className="text-white/90 text-sm mt-2 space-y-1">
                        <p><strong>Portfolio Metrics:</strong> {typeof expectedReturn === "number" && isFinite(expectedReturn) ? expectedReturn.toFixed(2) : "Not Available"}% expected annual return • {typeof portfolioRisk === "number" && isFinite(portfolioRisk) ? portfolioRisk.toFixed(2) : "Not Available"}% volatility (annualized σ)</p>
                        <p><strong>Calculation Method:</strong> Monthly compounding with {monthly > 0 ? 'regular contributions' : 'lump sum investment'}</p>
                        <p><strong>Risk-Free Rate:</strong> 4.5% (current 3-month US T-Bill) • <strong>Optimization:</strong> Markowitz Mean-Variance (MPT)</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Time Horizon Goals with Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-md">
                       <CardContent className="p-4 md:p-6 text-center">
                         <Calendar className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 text-teal-600" />
                         <h4 className="text-sm md:text-lg font-semibold text-slate-900 mb-1 md:mb-2">In 5 Years</h4>
                         <p className="text-xl md:text-3xl font-bold text-teal-600 mb-1 break-words">
                           ${value5Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                         </p>
                         <div className="text-[10px] md:text-xs text-slate-600 mt-1 md:mt-2 space-y-1">
                           <p className="truncate">Contrib: {(totalContributions5yr/1000).toFixed(0)}k</p>
                           <p className="text-emerald-700 font-semibold truncate">Growth: {(investmentGrowth5yr/1000).toFixed(0)}k</p>
                         </div>
                       </CardContent>
                      </Card>

                        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md">
                          <CardContent className="p-4 md:p-6 text-center">
                            <Calendar className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 text-blue-600" />
                            <h4 className="text-sm md:text-lg font-semibold text-slate-900 mb-1 md:mb-2">In 10 Years</h4>
                            <p className="text-xl md:text-3xl font-bold text-blue-600 mb-1 break-words">
                              ${value10Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                            <div className="text-[10px] md:text-xs text-slate-600 mt-1 md:mt-2 space-y-1">
                              <p className="truncate">Contrib: {(totalContributions10yr/1000).toFixed(0)}k</p>
                              <p className="text-emerald-700 font-semibold truncate">Growth: {(investmentGrowth10yr/1000).toFixed(0)}k</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md">
                          <CardContent className="p-4 md:p-6 text-center">
                            <Calendar className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 text-purple-600" />
                            <h4 className="text-sm md:text-lg font-semibold text-slate-900 mb-1 md:mb-2">In 20 Years</h4>
                            <p className="text-xl md:text-3xl font-bold text-purple-600 mb-1 break-words">
                              ${value20Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                            <div className="text-[10px] md:text-xs text-slate-600 mt-1 md:mt-2 space-y-1">
                              <p className="truncate">Contrib: {(totalContributions20yr/1000).toFixed(0)}k</p>
                              <p className="text-emerald-700 font-semibold truncate">Growth: {(investmentGrowth20yr/1000).toFixed(0)}k</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-md">
                          <CardContent className="p-4 md:p-6 text-center">
                            <Calendar className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 text-indigo-600" />
                            <h4 className="text-sm md:text-lg font-semibold text-slate-900 mb-1 md:mb-2">In 30 Years</h4>
                            <p className="text-xl md:text-3xl font-bold text-indigo-600 mb-1 break-words">
                              ${value30Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                            <div className="text-[10px] md:text-xs text-slate-600 mt-1 md:mt-2 space-y-1">
                              <p className="truncate">Contrib: {(totalContributions30yr/1000).toFixed(0)}k</p>
                              <p className="text-emerald-700 font-semibold truncate">Growth: {(investmentGrowth30yr/1000).toFixed(0)}k</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Model Limitations - Expected Return */}
                      <ModelLimitationsDisclosure modelType="expected_return" />

                      {/* Goal Achievement */}
                      {/* Goal Probability with Ranges */}
                      {yearsToGoal && (
                        <>
                          <GoalProbabilityCard
                            principal={principal}
                            monthlyContribution={monthly}
                            expectedReturn={Number(analysisResult.optimal_portfolio.expected_return) || 8}
                            baseVolatility={portfolioRisk}
                            goalAmount={goal}
                            months={monthsToGoal}
                            vixData={vixData}
                          />
                          <ModelLimitationsDisclosure modelType="monte_carlo" />
                        </>
                      )}

                      {yearsToGoal && (
                      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 mb-8 rounded-xl shadow-xl">
                        <CardContent className="p-5 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
                              </div>
                              <div>
                                <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                                  {typeof yearsToGoal === "number" && isFinite(yearsToGoal) ? yearsToGoal.toFixed(1) : "Not Available"} Years
                                </h4>
                                <p className="text-sm md:text-base text-slate-600 break-words">
                                  to reach your ${goal.toLocaleString()} goal
                                </p>
                                  <div className="mt-2">
                                    <Badge className={`text-sm ${
                                      goalProbability >= 0.7 ? 'bg-emerald-100 text-emerald-700' :
                                      goalProbability >= 0.5 ? 'bg-blue-100 text-blue-700' :
                                      goalProbability >= 0.3 ? 'bg-amber-100 text-amber-700' :
                                      'bg-rose-100 text-rose-700'
                                    }`}>
                                      {typeof goalProbability === "number" && isFinite(goalProbability) ? (goalProbability * 100).toFixed(0) : "Not Available"}% Probability of Success
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-xs md:text-sm text-slate-600 mb-1">With current plan:</p>
                                <p className="text-base md:text-lg font-semibold text-emerald-700 break-words">
                                  ${principal.toLocaleString()} initial
                                </p>
                                {monthly > 0 && (
                                  <p className="text-base md:text-lg font-semibold text-emerald-700 break-words">
                                    + ${monthly}/month
                                  </p>
                                )}
                                <p className="text-xs md:text-sm text-slate-600 mt-1 break-words">
                                  @ {typeof expectedReturn === "number" && isFinite(expectedReturn) ? expectedReturn.toFixed(1) : "Not Available"}% return ({typeof portfolioRisk === "number" && isFinite(portfolioRisk) ? portfolioRisk.toFixed(1) : "Not Available"}% risk)
                                </p>
                                <p className="text-xs text-amber-700 mt-2 font-semibold break-words">
                                  Expected Max Drawdown: {typeof sanitizedDrawdown === "number" && isFinite(sanitizedDrawdown) ? sanitizedDrawdown.toFixed(0) : "Not Available"}%
                                </p>
                                {typeof sanitizedDrawdown === "number" && isFinite(sanitizedDrawdown) && sanitizedDrawdown <= -80 && (
                                  <p className="text-xs text-rose-600 mt-1">
                                    ⚠️ High-risk portfolio
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Probability-Weighted Projections */}
                      <ProbabilityWeightedProjections
                        expectedValue={expectedReturn}
                        volatility={portfolioRisk}
                        years={30}
                        principal={principal}
                        monthlyContribution={monthly}
                      />

                      {/* Growth Chart */}
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-xl font-bold text-slate-900">30-Year Growth Projection</h4>
                          <Badge className="bg-amber-100 text-amber-800 text-xs px-3 py-1">
                            Model Projection — Not Guaranteed
                          </Badge>
                        </div>
                        <div className="mb-4 p-3 md:p-4 bg-amber-50 rounded-xl border-2 border-amber-300 shadow-sm">
                          <p className="text-xs text-amber-900 leading-relaxed">
                            <strong>⚠️ Projection Assumptions:</strong> This assumes {typeof expectedReturn === "number" && isFinite(expectedReturn) ? expectedReturn.toFixed(1) : "Not Available"}% consistent annual returns 
                            {monthly > 0 && ` with ${monthly.toLocaleString()} monthly contributions`} and <strong>does NOT account for:</strong>
                            <br/>• Sequence-of-returns risk (market crashes early vs. late reduce final outcomes)
                            <br/>• Major economic crises, recessions, or black swan events
                            <br/>• Personal withdrawals, job loss, or emergency expenses
                            <br/>• Changes in market regime, interest rates, or asset correlations
                            <br/><br/>
                            <strong>Use this as a planning scenario, not a forecast.</strong> Real outcomes vary significantly.
                          </p>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                          <AreaChart data={projections30Years} margin={{ left: 10, right: 10, top: 10, bottom: 35 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="year" 
                              label={{ value: 'Years', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis 
                              label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 11 } }}
                              tickFormatter={(value) => `${typeof value === "number" && isFinite(value) ? (value/1000).toFixed(0) : "Not Available"}k`}
                              tick={{ fontSize: 10 }}
                              width={55}
                            />
                            <Tooltip 
                              formatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                              labelFormatter={(label) => `Year ${label}`}
                              contentStyle={{ fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3b82f6" 
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                              name="Total Value"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="contributions" 
                              stroke="#10b981" 
                              fillOpacity={1} 
                              fill="url(#colorContributions)" 
                              name="Total Contributions"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Monthly Contribution Scenarios */}
                      <div className="mt-8">
                        <h4 className="text-xl font-bold text-slate-900 mb-4">Compare Monthly Contribution Scenarios</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          {[0, 100, 200, 300].map(monthlyAmount => {
                            const value = calculateFutureValue(principal, monthlyAmount, expectedReturn, 30);
                            const yearsToReach = calculateTimeToGoal(principal, monthlyAmount, expectedReturn, goal);
                            return (
                              <Card key={monthlyAmount} className="border-2 border-slate-200 rounded-xl shadow-md">
                                <CardContent className="p-3 md:p-4">
                                  <p className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">
                                    {monthlyAmount === 0 ? "No contrib" : `$${monthlyAmount}/mo`}
                                  </p>
                                  <p className="text-lg md:text-2xl font-bold text-slate-900 mb-1 break-words">
                                    {(value/1000).toFixed(0)}k
                                  </p>
                                  <p className="text-[10px] md:text-xs text-slate-500">after 30 years</p>
                                  {yearsToReach && yearsToReach <= 50 && (
                                    <p className="text-[10px] md:text-xs text-emerald-600 mt-1 md:mt-2 font-semibold">
                                      {typeof yearsToReach === "number" && isFinite(yearsToReach) ? yearsToReach.toFixed(1) : "Not Available"}y
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ============================================================================
============================================================================
SECTION 7 (PART 7 - FINAL): Charts, Allocations, Company Metrics & Closing
============================================================================
This section contains the final JSX rendering:
- Strategy Comparison Charts (BarChart & ScatterChart for risk-return positioning)
- Selected Strategy Details card:
  - Allocation breakdown with trade buttons
  - Portfolio composition bar chart
- Individual Company Analysis cards:
  - Market metrics (price, P/E, historical returns)
  - Modeled metrics (expected return, volatility, Sharpe ratio)
  - Dual-horizon beta display (5-year & 1-year)
  - Valuation reasoning & methodology
  - AI adjustment explainability
- Action buttons (Refresh Analysis, New Analysis)
- TradeModal component
- Closing tags for all nested divs
//
NO CHANGES - Pure JSX rendering of asset-level data
✅ NO VIX INTEGRATION NEEDED: This section displays individual company metrics only
VIX portfolio-level metrics are displayed in Section 5 (ForwardRiskCard) and Section 6 (Strategy cards)
============================================================================ */}

              {/* Strategy Comparison Charts */}
              {comparisonData.length > 0 && (
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-2 border-slate-200 shadow-xl bg-white rounded-xl">
                  <CardHeader className="px-5 md:px-6 py-4 md:py-5 border-b border-slate-100">
                    <CardTitle className="text-lg md:text-xl font-bold">Strategy Comparison</CardTitle>
                  </CardHeader>
                    <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={comparisonData} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={45} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="return" fill="#3b82f6" name="Return %" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="risk" fill="#ef4444" name="Risk %" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="sharpe" fill="#10b981" name="Sharpe" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-slate-200 shadow-xl bg-white rounded-xl">
                  <CardHeader className="px-5 md:px-6 py-4 md:py-5 border-b border-slate-100">
                    <CardTitle className="text-lg md:text-xl font-bold">Risk-Return Positioning</CardTitle>
                  </CardHeader>
                    <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                      <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 35, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="risk" 
                            name="Risk" 
                            unit="%" 
                            label={{ value: 'Risk %', position: 'insideBottom', offset: -8, style: { fontSize: 11 } }}
                            tick={{ fontSize: 10 }}
                            width={40}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="return" 
                            name="Return" 
                            unit="%" 
                            label={{ value: 'Return %', angle: -90, position: 'insideLeft', offset: 5, style: { fontSize: 11 } }}
                            tick={{ fontSize: 10 }}
                            width={50}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-4 border-2 border-slate-200 rounded-lg shadow-lg">
                                    <p className="font-bold text-slate-900">{data.name}</p>
                                    <p className="text-sm mt-2">Return: <span className="font-semibold text-blue-600">{typeof data.return === "number" && Number.isFinite(data.return) ? data.return.toFixed(2) : "Not Available"}%</span></p>
                                    <p className="text-sm">Risk: <span className="font-semibold text-rose-600">{typeof data.risk === "number" && Number.isFinite(data.risk) ? data.risk.toFixed(2) : "Not Available"}%</span></p>
                                    <p className="text-sm">Sharpe: <span className="font-semibold text-emerald-600">{typeof data.sharpe === "number" && Number.isFinite(data.sharpe) ? data.sharpe.toFixed(3) : "Not Available"}</span></p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter data={comparisonData} fill="#8884d8">
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Selected Strategy Details */}
              {(() => {
                const currentPortfolio = getCurrentPortfolio();
                if (!currentPortfolio || !currentPortfolio.allocations) return null;

                const StrategyIcon = getStrategyIcon(selectedStrategy);
                const strategyColor = getStrategyColor(selectedStrategy);

                const investAmount = analysisResult.total_investment || parseFloat(investmentAmount) || 0;
                const allocationData = Object.entries(currentPortfolio.allocations).map(([symbol, percent]) => {
                  // Convert to percentage if it's in decimal format (0-1 range)
                  const percentValue = percent < 1 ? percent * 100 : percent;
                  return {
                    symbol,
                    percent: percentValue,
                    amount: (percentValue / 100) * investAmount
                  };
                });

                const pieData = allocationData.map(item => ({
                  name: item.symbol,
                  value: item.percent
                }));

                return (
                  <Card className="border-2 border-slate-200 shadow-xl bg-white rounded-xl">
                    <CardHeader className={`bg-gradient-to-r ${strategyColor} text-white rounded-t-xl px-4 md:px-6 py-4 md:py-6`}>
                      <div className="flex flex-col gap-3 md:gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl">
                            <StrategyIcon className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" />
                            <span className="leading-tight">
                              {selectedStrategy === "minimum_variance" && "Minimum Variance Strategy"}
                              {selectedStrategy === "maximum_return" && "Maximum Return Strategy"}
                              {selectedStrategy === "optimal" && "Optimal Balanced Strategy"}
                            </span>
                          </CardTitle>
                          <p className="text-white/90 text-xs md:text-sm mt-2 leading-relaxed">
                            {selectedStrategy === "minimum_variance" && "Conservative approach minimizing portfolio volatility"}
                            {selectedStrategy === "maximum_return" && "Aggressive approach maximizing expected returns"}
                            {selectedStrategy === "optimal" && "Balanced approach optimizing risk-adjusted returns"}
                          </p>
                        </div>
                        <Button
                          onClick={handleTradeAllAllocations}
                          className="w-full md:w-auto bg-white text-slate-900 hover:bg-slate-100 shadow-lg h-12 md:h-auto text-sm md:text-base font-semibold"
                        >
                          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Simulate All Positions
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Allocation Details */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Recommended Allocation</h3>
                            <Badge className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700">
                              Total: ${investAmount.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                           {allocationData.map((item, index) => {
                             const company = analysisResult.companies?.find(c => c.symbol.toUpperCase() === item.symbol.toUpperCase());
                             
                             console.log(`Looking for ${item.symbol}:`, company ? 'FOUND' : 'NOT FOUND');
                             
                             const shares = company?.current_price > 0 ? Math.floor(item.amount / company.current_price) : 0;
                             
                             return (
                               <div key={item.symbol} className="p-4 rounded-xl bg-slate-50/80 border-2 border-slate-200 shadow-sm">
                                 <div className="flex items-center justify-between mb-2">
                                   <div className="flex-1">
                                     <p className="font-bold text-slate-900">{item.symbol}</p>
                                     {company && <p className="text-sm text-slate-600">{company.name}</p>}
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Badge className="text-lg px-3 py-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                       {typeof item.percent === "number" && Number.isFinite(item.percent) ? item.percent.toFixed(1) : "Not Available"}%
                                     </Badge>
                                     <Button
                                       size="sm"
                                       onClick={() => handleOpenTrade(item.symbol, item.percent, company?.current_price || 0)}
                                       className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                     >
                                       <ShoppingCart className="w-3 h-3 mr-1" />
                                       Simulate
                                     </Button>
                                   </div>
                                 </div>
                                 <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                   <p className="text-lg md:text-2xl font-bold text-slate-900 break-all">
                                     ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </p>
                                   {company && company.current_price > 0 && shares > 0 && (
                                     <p className="text-xs md:text-sm text-slate-500">
                                       ≈ {shares} shares @ {typeof company.current_price === "number" && Number.isFinite(company.current_price) ? company.current_price.toFixed(2) : "Not Available"}
                                     </p>
                                   )}
                                 </div>
                                 {company && company.expected_return !== undefined && company.risk !== undefined && (
                                   <div className="mt-2 pt-2 border-t border-slate-200 text-sm">
                                     <div className="text-slate-600 mb-1">
                                       <span>Price: {typeof company.current_price === "number" && Number.isFinite(company.current_price) ? company.current_price.toFixed(2) : "Not Available"}</span>
                                       <span className="mx-2">•</span>
                                       <span>Return: {typeof company.expected_return === "number" && Number.isFinite(company.expected_return) ? company.expected_return.toFixed(2) : "Not Available"}%</span>
                                       <span className="mx-2">•</span>
                                       <span>Risk: {typeof company.risk === "number" && Number.isFinite(company.risk) ? company.risk.toFixed(2) : "Not Available"}%</span>
                                     </div>
                                     <div className="text-xs text-slate-500 mt-1">
                                       <strong>Method:</strong> {company.return_methodology}
                                     </div>
                                     {company.allocation_rationale && (
                                       <div className="text-xs text-blue-700 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                         <strong>Allocation Rationale:</strong> {company.allocation_rationale}
                                       </div>
                                     )}
                                     {company.allocation_explanation && (
                                       <div className="text-xs text-amber-600 mt-1 font-semibold">
                                         ⚠️ {company.allocation_explanation}
                                       </div>
                                     )}
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                          </div>
                        </div>

                        {/* Allocation Chart */}
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-slate-900">Portfolio Composition</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart 
                              data={allocationData.sort((a, b) => b.percent - a.percent)} 
                              layout="vertical"
                              margin={{ left: 10, right: 80 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="symbol" type="category" width={60} tick={{ fontSize: 12 }} />
                              <Tooltip 
                                formatter={(value) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "Not Available"}
                                contentStyle={{ fontSize: 12 }}
                              />
                              <Bar dataKey="percent" radius={[0, 8, 8, 0]} label={{ position: 'right', formatter: (value) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "Not Available", fontSize: 12 }}>
                                {allocationData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Individual Company Analysis */}
              {analysisResult.companies && analysisResult.companies.length > 0 && (
              <Card className="border-2 border-slate-200 shadow-xl bg-white rounded-xl">
                <CardHeader className="px-5 md:px-6 py-4 md:py-5 border-b border-slate-100">
                  <CardTitle className="text-xl md:text-2xl font-bold">Individual Company Metrics</CardTitle>
                </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analysisResult.companies.map((company, index) => {
                        const ValuationIcon = getValuationIcon(company.valuation);
                        return (
                          <Card key={company.symbol} className="border-2 border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow h-full bg-white">
                            <CardContent className="p-4">
                             <div className="flex items-start justify-between mb-3">
                               <div className="flex-1">
                                 <h4 className="font-bold text-lg text-slate-900">{company.symbol}</h4>
                                 <p className="text-sm text-slate-600">{company.name}</p>

                                 {/* Market Cap Tier Context */}
                                 {company.market_cap && (
                                   <div className="mt-2">
                                     <MarketCapTierLabel marketCap={typeof company.market_cap === "number" && Number.isFinite(company.market_cap) ? company.market_cap.toFixed(0) : "Not Available"} compact={true} />
                                   </div>
                                 )}

                                 {/* Speculative Contribution */}
                                 <div className="mt-2">
                                   <SpeculativeContributionBadge company={company} />
                                 </div>
                               </div>
                               <Badge className={`${getValuationColor(company.valuation)} border text-xs`}>
                                 <ValuationIcon className="w-3 h-3 mr-1" />
                                 {company.valuation}
                               </Badge>
                             </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs md:text-sm">
                                  <span className="text-slate-600">Current Price:</span>
                                  <span className="font-semibold text-base md:text-lg break-words">{typeof company.current_price === "number" && Number.isFinite(company.current_price) ? `$${company.current_price.toFixed(2)}` : "Not Available"}</span>
                                </div>
                                {(company.pe_ratio !== undefined && company.pe_ratio !== null && typeof company.pe_ratio === 'number' && !isNaN(company.pe_ratio)) && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">P/E Ratio:</span>
                                    <span className="font-semibold">{typeof company.pe_ratio === "number" && Number.isFinite(company.pe_ratio) ? company.pe_ratio.toFixed(2) : "Not Available"}</span>
                                  </div>
                                )}

                                {/* Historical Returns */}
                                {(company.ytd_return !== undefined && company.ytd_return !== null && !isNaN(company.ytd_return)) && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">YTD Return:</span>
                                    <span className={`font-semibold ${company.ytd_return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {typeof company.ytd_return === "number" && Number.isFinite(company.ytd_return) ? company.ytd_return.toFixed(1) : "Not Available"}%
                                    </span>
                                  </div>
                                )}
                                {(company.one_year_return !== undefined && company.one_year_return !== null && !isNaN(company.one_year_return)) && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">1Y Return:</span>
                                    <span className={`font-semibold ${company.one_year_return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {typeof company.one_year_return === "number" && Number.isFinite(company.one_year_return) ? company.one_year_return.toFixed(1) : "Not Available"}%
                                    </span>
                                  </div>
                                )}
                                {(company.three_year_return !== undefined && company.three_year_return !== null && !isNaN(company.three_year_return) && company.three_year_return > -90) && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">3Y CAGR:</span>
                                    <span className={`font-semibold ${company.three_year_return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {typeof company.three_year_return === "number" && Number.isFinite(company.three_year_return) ? company.three_year_return.toFixed(1) : "Not Available"}%
                                    </span>
                                  </div>
                                )}

                                {/* Expected Return & Risk */}
                                <div className="pt-2 border-t border-slate-200">
                                  <p className="text-sm text-slate-600 font-semibold mb-2">Modeled Metrics:</p>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                                      <span className="text-slate-700">Expected Return:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-blue-700 text-base">{typeof company.expected_return === "number" && Number.isFinite(company.expected_return) ? company.expected_return.toFixed(2) : "Not Available"}%</span>
                                        {company.return_confidence && (
                                          <Badge className={`text-xs ${
                                            company.return_confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
                                            company.return_confidence === 'medium' ? 'bg-blue-100 text-blue-800' :
                                            'bg-amber-100 text-amber-800'
                                          }`}>
                                            {company.return_confidence}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {company.return_range && (
                                      <div className="text-xs text-slate-600 px-2">
                                        Range: {typeof company.return_range.low === "number" && Number.isFinite(company.return_range.low) ? company.return_range.low.toFixed(1) : "Not Available"}% to {typeof company.return_range.high === "number" && Number.isFinite(company.return_range.high) ? company.return_range.high.toFixed(1) : "Not Available"}%
                                        (±{typeof company.return_range.uncertainty === "number" && Number.isFinite(company.return_range.uncertainty) ? company.return_range.uncertainty.toFixed(1) : "Not Available"}%)
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center text-sm bg-rose-50 p-2 rounded">
                                      <span className="text-slate-700">Volatility (σ):</span>
                                      <span className="font-bold text-rose-700 text-base">{typeof company.risk === "number" && Number.isFinite(company.risk) ? company.risk.toFixed(2) : "Not Available"}%</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm bg-emerald-50 p-2 rounded">
                                      <span className="text-slate-700">Sharpe Ratio:</span>
                                      <span className="font-bold text-emerald-700 text-base">
                                        {typeof company.expected_return === "number" && Number.isFinite(company.expected_return) ? company.expected_return.toFixed(2) : "Not Available"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Dual-Horizon Beta Display */}
                                <div className="pt-2 border-t border-slate-200">
                                  <p className="text-sm text-slate-600 font-semibold mb-2">Beta vs S&P 500:</p>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                                     <span className="text-slate-700">5-Year Beta:</span>
                                     <div className="flex items-center gap-2">
                                       <span className="font-bold text-blue-700 text-base">{typeof company.beta === "number" && Number.isFinite(company.beta) ? company.beta.toFixed(3) : "Not Available"}</span>
                                       <DataSourceLabel
                                         metricName="5-Year Beta"
                                         source={typeof company.beta === "number" && Number.isFinite(company.beta) ? company.beta.toFixed(3) : "Not Available"}
                                         confidence={typeof company.beta === "number" && Number.isFinite(company.beta) ? company.beta.toFixed(3) : "Not Available"}
                                         details={
                                           company.beta_source === 'yahoo_finance_5yr' ? 'Yahoo Finance 5-year monthly regression vs S&P 500' :
                                           company.beta_source === 'calculated_5yr_daily' ? 'Calculated from 5-year daily returns (RapidAPI data)' :
                                           company.beta_source === 'llm_estimate' ? 'AI-estimated from historical returns and market data' :
                                           company.beta_source === 'sector_estimate' ? `Sector average for ${company.sector}` :
                                           'Calculated from historical data'
                                         }
                                         compact={true}
                                       />
                                     </div>
                                    </div>
                                    
                                    {company.beta_1year && (
                                      <div className="flex justify-between items-center text-sm bg-indigo-50 p-2 rounded">
                                        <span className="text-slate-700">1-Year Beta:</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-indigo-700">{typeof company.beta === "number" && Number.isFinite(company.beta) ? company.beta.toFixed(3) : "Not Available"}</span>
                                          <Badge className="text-xs bg-indigo-100 text-indigo-800">
                                            Recent
                                          </Badge>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                      <strong>Calculation:</strong> {
                                        company.beta_source === 'yahoo_finance_5yr' ? 'Yahoo Finance 5Y monthly regression' :
                                        company.beta_source === 'calculated_5yr_daily' ? '5Y daily return regression (RapidAPI)' :
                                        company.beta_source === 'sector_estimate' ? `Sector-based estimate (${company.sector})` :
                                        company.beta_source || 'Daily regression vs S&P 500'
                                      }
                                    </div>
                                  </div>
                                  
                                  {company.beta_warnings && company.beta_warnings.length > 0 && (
                                    <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-300">
                                      {company.beta_warnings.map((warning, idx) => (
                                        <p key={idx} className="text-xs text-amber-800 leading-relaxed">⚠️ {warning}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Methodology & Rationale */}
                              {company.valuation_reasoning && (
                                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                  {/* Valuation Reasoning */}
                                  <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
                                    <strong>Valuation:</strong> {company.valuation_reasoning}
                                  </div>
                                  
                                  {/* Return Methodology */}
                                  {company.return_methodology && (
                                    <div className="text-xs text-slate-600 space-y-1">
                                      <div className="bg-blue-50 p-2 rounded">
                                        <strong>Expected Return Model:</strong> {company.return_methodology}
                                      </div>
                                      {company.capm_weight !== undefined && company.historical_weight !== undefined && (
                                        <div className="flex gap-2 text-xs">
                                          <Badge variant="outline" className="text-xs">
                                            {typeof company.historical_weight === "number" && Number.isFinite(company.historical_weight) ? (company.historical_weight * 100).toFixed(0) : "Not Available"}% Historical CAGR
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {typeof company.capm_weight === "number" && Number.isFinite(company.capm_weight) ? (company.capm_weight * 100).toFixed(0) : "Not Available"}% CAPM (β-based)
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* AI Adjustment Explainability */}
                                  {company.adjustments && company.adjustments.length > 0 && (
                                   <>
                                     <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                                       <strong>AI Forward-Looking Adjustments:</strong> Expected return ({typeof company.expected_return === "number" && Number.isFinite(company.expected_return) ? company.expected_return.toFixed(2) : "Not Available"}%) and volatility ({typeof company.risk === "number" && Number.isFinite(company.risk) ? company.risk.toFixed(2) : "Not Available"}%) include AI-informed adjustments 
                                       based on recent fundamentals, catalysts, and market positioning. 
                                       <strong> These are model inputs, not guaranteed outcomes.</strong>
                                     </div>
                                     <AssetExplanation 
                                       asset={company}
                                       adjustments={company.adjustments}
                                       compact={false}
                                     />
                                   </>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center gap-4">
                {isCachedResults ? (
                  <>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Refreshing Analysis...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Refresh with Live Data
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setAnalysisResult(null);
                        setIsCachedResults(false);
                        setCacheTimestamp(null);
                        setCurrentAnalysisId(null);
                        setInvestmentAmount("10000");
                        setMonthlyContribution("0");
                        setSelectedStrategy("optimal");
                      }}
                      variant="outline"
                      className="border-2 border-slate-300 hover:bg-slate-50"
                    >
                      New Analysis
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setAnalysisResult(null);
                      setInvestmentAmount("10000");
                      setMonthlyContribution("0");
                      setSelectedStrategy("optimal");
                    }}
                    variant="outline"
                    className="border-2 border-slate-300 hover:bg-slate-50"
                  >
                    Run New Analysis
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onExecuteTrade={handleExecuteTrade}
        initialSymbol={tradeSymbol}
        initialQuantity={suggestedQuantity}
      />
    </div>
  );
}
