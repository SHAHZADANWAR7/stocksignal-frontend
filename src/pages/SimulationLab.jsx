import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Plus,
  Trash2,
  Play,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Award,
  Trophy,
  BarChart3,
  LineChart,
  PieChart,
  Sparkles,
  AlertTriangle,
  Shield,
  Flame,
  Loader2,
  Repeat,
  GitCompare,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkUsageLimit, incrementUsage, getRemainingUsage } from "@/components/utils/usageLimit";
import { validateAssetsForPeriod, getScenarioDateRange, assetExistedAt } from "@/components/utils/assetInceptionDates";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

export default function SimulationLab() {
 const [user, setUser] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScenarioDialog, setShowScenarioDialog] = useState(false);
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [showCreateChallengeDialog, setShowCreateChallengeDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEnterChallengeDialog, setShowEnterChallengeDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [scenarioResults, setScenarioResults] = useState(null);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [remainingUsage, setRemainingUsage] = useState(null);

  const [newPortfolio, setNewPortfolio] = useState({
    name: "",
    description: "",
    strategy_type: "balanced",
    total_value: 100000,
    assets: []
  });

  const [newAsset, setNewAsset] = useState({
    symbol: "",
    name: "",
    asset_class: "stock",
    allocation_percent: 0
  });

  const [customScenario, setCustomScenario] = useState({
    name: "",
    market_crash_percent: 0,
    interest_rate_change: 0,
    inflation_rate: 0,
    sector_impact: {},
    duration_months: 12
  });

  const [newChallenge, setNewChallenge] = useState({
    name: "",
    description: "",
    challenge_type: "highest_return",
    target_metric: 0,
    duration_months: 3,
    badge_reward: ""
  });

useEffect(() => {
    // We call these directly. awsClient.js handles the security/session.
    loadUser();
    loadData();
    loadRemainingUsage();
  }, []);

const loadUser = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // We send a flat object. 
      // awsClient.js will wrap this into event.body.payload
      // Then Lambda will see event.body.payload.userId
      const data = await awsApi.getUser({ 
        userId: localStorage.getItem('user_id'),
        cognitoSub: localStorage.getItem('user_id') 
      }); 
      
      if (data && data.email) {
        setUser(data);
        console.log("✅ Profile Sync Successful");
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

const loadData = async () => {
    try {
      // 1. Fetch portfolios (Working: Status 200)
      const response = await awsApi.getSimulationPortfolio({}); 
      const portfolioList = response?.data || [];
      
      // ✅ UPDATE STATE IMMEDIATELY - This makes the portfolios appear!
      setPortfolios(portfolioList);

      // 2. Fetch challenges/summary (Failing: Status 400)
      // Wrap this in a separate try/catch so its failure doesn't affect the portfolios
      try {
        const labResponse = await awsApi.getSimulationLabData({});
        const challengeList = labResponse?.data?.challenges || 
                              labResponse?.data?.lab_summary?.challenges || [];
        setChallenges(challengeList);
      } catch (labError) {
        console.warn("⚠️ Lab Summary failed to load, but portfolios are safe.", labError);
      }
      
      console.log(`✅ Sync Success: ${portfolioList.length} Portfolios Loaded`);
    } catch (error) {
      console.error("❌ Critical Sync Error in loadData:", error);
    }
  };

  const addAssetToPortfolio = () => {
    // We simply add a blank row to the assets array so you can type directly into it
    setNewPortfolio({
      ...newPortfolio,
      assets: [
        ...newPortfolio.assets, 
        { symbol: "", name: "", asset_class: "stock", allocation_percent: 0 }
      ]
    });
  };

  const removeAsset = (index) => {
    setNewPortfolio({
      ...newPortfolio,
      assets: newPortfolio.assets.filter((_, i) => i !== index)
    });
  };

  const handleAssetChange = (index, field, value) => {
    const updatedAssets = [...newPortfolio.assets];
    let finalValue = value;
    if (field === 'symbol') finalValue = value.toUpperCase();
    if (field === 'allocation_percent') finalValue = parseFloat(value) || 0;

    updatedAssets[index][field] = finalValue;
    setNewPortfolio({ ...newPortfolio, assets: updatedAssets });
  };

  const createPortfolio = async () => {
    if (!newPortfolio.name || newPortfolio.assets.length === 0) {
      alert("Please enter portfolio name and add at least one asset");
      return;
    }

    const totalAllocation = newPortfolio.assets.reduce((sum, a) => sum + a.allocation_percent, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      alert("Total allocation must equal 100%");
      return;
    }

    try {
      await awsApi.createSimulationPortfolio(newPortfolio);
      setShowCreateDialog(false);
      setNewPortfolio({
        name: "",
        description: "",
        strategy_type: "balanced",
        total_value: 100000,
        assets: []
      });
      loadData();
      alert("✅ Portfolio created!");
    } catch (error) {
      console.error("Error creating portfolio:", error);
      alert("Error creating portfolio");
    }
  };

  const deletePortfolio = async (id) => {
    if (!confirm("Delete this simulation portfolio?")) return;
    await awsApi.deleteSimulationPortfolio(id);
    loadData();
  };

  const runScenarioSimulation = async () => {
    if (selectedPortfolios.length === 0) {
      alert("Select at least one portfolio to simulate");
      return;
    }

    const limitCheck = await checkUsageLimit('premium');
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    setIsSimulating(true);
    try {
      const portfoliosToSimulate = portfolios.filter(p => selectedPortfolios.includes(p.id));
      
      // NEW: Collect all unique symbols from selected portfolios
      const allSelectedSymbols = [...new Set(portfoliosToSimulate.flatMap(p => (p.assets || []).map(a => a.symbol)))];
      
      // FIX: Pass the array of symbols instead of the scenario name string
      const dateRange = getScenarioDateRange(allSelectedSymbols);

      let validationSummary = "";
      let allValidAssets = [];
      let allInvalidAssets = [];
      let allWarnings = [];
      
      if (dateRange) {
        portfoliosToSimulate.forEach(portfolio => {
          const validation = validateAssetsForPeriod(
            portfolio.assets || [],
            dateRange.startDate, // Note: utility returns startDate/endDate
            dateRange.endDate
          );
          
          allValidAssets.push(...validation.validAssets.map(a => ({ ...a, portfolio: portfolio.name })));
          allInvalidAssets.push(...validation.invalidAssets.map(a => ({ ...a, portfolio: portfolio.name })));
          allWarnings.push(...validation.warnings);
        });
        
        const criticalWarnings = allWarnings.filter(w => w.severity === 'critical');
        if (criticalWarnings.length > 0) {
          const invalidSymbols = criticalWarnings.map(w => w.symbol).join(', ');
          alert(`❌ Historical Validation Failed\n\n` +
                `These assets did not exist during "${customScenario.name}":\n${invalidSymbols}\n\n` +
                `Simulation blocked to ensure data integrity.\n\n` +
                `Please remove these assets or choose a different scenario period.`);
          setIsSimulating(false);
          return;
        }
        
        const mediumWarnings = allWarnings.filter(w => w.severity === 'medium');
        if (mediumWarnings.length > 0) {
          const partialSymbols = mediumWarnings.map(w => `${w.symbol} (${w.message})`).join('\n');
          const proceed = confirm(`⚠️ Partial Period Coverage\n\n` +
                                   `These assets entered mid-period:\n${partialSymbols}\n\n` +
                                   `Results will be pro-rated for actual trading days.\n\n` +
                                   `Continue with simulation?`);
          if (!proceed) {
            setIsSimulating(false);
            return;
          }
        }
        
       validationSummary = `\n\n📊 DATA VALIDATION (${dateRange.startDate} to ${dateRange.endDate}):\n` +
          `- Valid assets: ${allValidAssets.length}\n` +
          `- Assets excluded: ${allInvalidAssets.length}\n` +
          `- Warnings: ${allWarnings.length}\n`;
      }
      
      const prompt = `Run a detailed investment portfolio simulation under this custom market scenario:

Scenario: ${customScenario.name}
Market Conditions:
- Market crash: ${customScenario.market_crash_percent}%
- Interest rate change: ${customScenario.interest_rate_change}%
- Inflation rate: ${customScenario.inflation_rate}%
- Duration: ${customScenario.duration_months} months

Portfolios to simulate:
${portfoliosToSimulate.map(p => `
Portfolio: ${p.name}
Strategy: ${p.strategy_type}
Assets: ${p.assets.map(a => `${a.symbol} (${a.allocation_percent}%)`).join(", ")}
`).join("\n")}
${validationSummary}

METHODOLOGY REQUIREMENTS:
1. Use ONLY assets that existed during the entire scenario period
2. Asset-level returns must be historically accurate or research-backed estimates
3. Clearly identify if any asset data is synthetic/estimated
4. Portfolio is rebalanced to target allocations monthly (no drift)
5. All returns are price-only (no dividends unless explicitly modeled)

For each portfolio, calculate:
1. Final portfolio value after scenario
2. Total return %
3. Maximum drawdown %
4. Recovery time (months)
5. Volatility score (0-100)
6. Risk-adjusted return (Sharpe-like metric)
7. Which assets performed best/worst
8. Recommended portfolio adjustments

Return JSON with detailed metrics for each portfolio.`;

     // Bundling your data into one object so the Backend can parse it
      const result = await awsApi.runScenarioSimulation({
        portfolio_id: selectedPortfolios[0],
        scenario_type: "custom",
        prompt: prompt,
        customScenario: customScenario
      });

      setScenarioResults(result);
      
      await incrementUsage('premium');
      loadRemainingUsage();
      
      setShowScenarioDialog(false);
    } catch (error) {
      console.error("Error running simulation:", error);
      alert("Error running simulation");
    }
    setIsSimulating(false);
  };

  const optimizePortfolio = async (portfolioId, optimizationType) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) return;

    setIsSimulating(true);
    try {
      const prompt = `Optimize this investment portfolio using ${optimizationType} strategy:

Current Portfolio: ${portfolio.name}
Assets: ${portfolio.assets.map(a => `${a.symbol} (${a.allocation_percent}%)`).join(", ")}

Optimization Goal: ${
  optimizationType === "max_sharpe" ? "Maximize Sharpe Ratio (best risk-adjusted returns)" :
  optimizationType === "min_volatility" ? "Minimize Volatility (lowest risk)" :
  "Maximize Expected Returns (highest growth potential)"
}

Provide:
1. New optimal allocation percentages for each asset
2. Expected portfolio return %
3. Expected volatility/risk %
4. Sharpe ratio
5. Reasoning for changes

Return JSON with optimized allocations.`;

      const result = await awsApi.optimizePortfolio(portfolioId, prompt);

      const updatedAssets = portfolio.assets.map(asset => {
        const optimized = result.optimized_allocations.find(o => o.symbol === asset.symbol);
        return optimized ? { ...asset, allocation_percent: optimized.allocation_percent } : asset;
      });

      await awsApi.updateSimulationPortfolio(portfolioId, {
        assets: updatedAssets,
        expected_return: result.expected_return,
        risk_score: result.expected_volatility,
        sharpe_ratio: result.sharpe_ratio
      });

      alert(`✅ Portfolio optimized! ${result.reasoning}`);
      loadData();
    } catch (error) {
      console.error("Error optimizing:", error);
      alert("Error optimizing portfolio");
    }
    setIsSimulating(false);
  };

  const togglePortfolioSelection = (id) => {
    setSelectedPortfolios(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const createChallenge = async () => {
    if (!newChallenge.name || !newChallenge.description) {
      alert("Please enter challenge name and description");
      return;
    }

    try {
      await awsApi.createSimulationChallenge({
        ...newChallenge,
        scenario_conditions: { custom_scenario: customScenario }
      });

      setShowCreateChallengeDialog(false);
      setNewChallenge({
        name: "",
        description: "",
        challenge_type: "highest_return",
        target_metric: 0,
        duration_months: 3,
        badge_reward: ""
      });
      loadData();
      alert("✅ Challenge created!");
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Error creating challenge");
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail || !selectedChallenge) return;

    try {
      await awsApi.inviteUserToChallenge(selectedChallenge.id, inviteEmail);
      setInviteEmail("");
      setShowInviteDialog(false);
      loadData();
      alert("✅ User invited!");
    } catch (error) {
      console.error("Error inviting user:", error);
      alert("Error inviting user");
    }
  };

  const enterChallenge = async (portfolioId) => {
    if (!selectedChallenge || !portfolioId) return;

    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) return;

    setIsSimulating(true);
    try {
      const scenario = selectedChallenge.scenario_conditions?.custom_scenario || {};
      
      const prompt = `Score this portfolio for a ${selectedChallenge.challenge_type} challenge:

Portfolio: ${portfolio.name}
Assets: ${portfolio.assets.map(a => `${a.symbol} (${a.allocation_percent}%)`).join(", ")}

Challenge Scenario:
${scenario.name || "Standard market conditions"}
- Market crash: ${scenario.market_crash_percent || 0}%
- Interest rate change: ${scenario.interest_rate_change || 0}%
- Duration: ${selectedChallenge.duration_months} months

Calculate:
1. Final return %
2. Maximum drawdown %
3. Sharpe ratio
4. Challenge score (0-100 based on meeting the challenge goal)

Target: ${selectedChallenge.target_metric}`;

      const result = await awsApi.enterChallengeWithPortfolio(selectedChallenge.id, portfolioId, prompt);

      setShowEnterChallengeDialog(false);
      loadData();
      
      if (result.badge_earned) {
        alert(`🏆 Challenge entered! Score: ${result.score}/100\n\nBadge Earned: ${selectedChallenge.badge_reward}`);
      } else {
        alert(`✅ Challenge entered! Score: ${result.score}/100\n\nKeep trying to earn the badge!`);
      }
    } catch (error) {
      console.error("Error entering challenge:", error);
      alert("Error entering challenge");
    }
    setIsSimulating(false);
  };

  const strategyColors = {
    aggressive_growth: "from-slate-900 to-slate-800",
    balanced: "from-indigo-600 to-indigo-700",
    income_focused: "from-emerald-600 to-emerald-700",
    thematic: "from-purple-600 to-purple-700",
    custom: "from-slate-600 to-slate-700"
  };

  const strategyIcons = {
    aggressive_growth: Flame,
    balanced: Shield,
    income_focused: Target,
    thematic: Sparkles,
    custom: Zap
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
                <FlaskConical className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-indigo-600" />
                Simulation Lab
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-slate-600 mb-1 md:mb-2">
                Build, test, and compete with portfolio strategies
              </p>
              {remainingUsage && (
                <p className="text-sm text-blue-600">
                  {remainingUsage.premium_remaining} simulations remaining this week
                </p>
              )}
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Portfolio
            </Button>
          </div>

          {/* 🚀 INDUSTRIAL SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { 
                label: "Experimental Portfolios", 
                value: portfolios.length, 
                icon: FlaskConical, 
                color: "text-indigo-600", 
                border: "border-indigo-600", 
                bg: "bg-indigo-50/50" 
              },
              { 
                label: "Active Challenges", 
                value: challenges.length, 
                icon: Trophy, 
                color: "text-purple-600", 
                border: "border-purple-600", 
                bg: "bg-purple-50/50" 
              },
              { 
                label: "Selected for Compare", 
                value: selectedPortfolios.length, 
                icon: Zap, 
                color: "text-emerald-600", 
                border: "border-emerald-600", 
                bg: "bg-emerald-50/50" 
              },
              { 
                label: "Challenge Entries", 
                value: portfolios.filter(p => p.is_challenge_entry).length, 
                icon: Award, 
                color: "text-amber-600", 
                border: "border-amber-600", 
                bg: "bg-amber-50/50" 
              },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -2 }}
                className={`bg-white border border-slate-200 ${stat.border} border-l-4 rounded-xl p-5 shadow-sm relative overflow-hidden group transition-all hover:shadow-md`}
              >
                {/* Ghost Background Icon for Industrial Depth */}
                <stat.icon className="absolute -right-2 -bottom-2 w-16 h-16 opacity-[0.03] group-hover:scale-110 transition-transform" />
                
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] mb-1 relative z-10">
                  {stat.label}
                </p>
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">
                    {stat.value}
                  </span>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        {selectedPortfolios.length > 0 && (
          <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-slate-900 mb-1">
                    {selectedPortfolios.length} Portfolio{selectedPortfolios.length > 1 ? 's' : ''} Selected
                  </p>
                  <p className="text-sm text-slate-600">Run simulations or compare strategies</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowScenarioDialog(true)}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Scenario
                  </Button>
                  <Button
                    onClick={() => setSelectedPortfolios([])}
                    variant="outline"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="portfolios" className="mb-8">
          {/* 🛠 INDUSTRIAL TAB NAVIGATION (Replacement for lines 655-659) */}
          <TabsList className="grid w-full grid-cols-3 bg-slate-200/60 p-1.5 rounded-xl h-14 border border-slate-300/50 shadow-inner">
            <TabsTrigger 
              value="portfolios" 
              className="px-8 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg uppercase text-[10px] font-black tracking-[0.2em] transition-all duration-200"
            >
              My Strategies
            </TabsTrigger>
            <TabsTrigger 
              value="challenges" 
              className="px-8 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg uppercase text-[10px] font-black tracking-[0.2em] transition-all duration-200"
            >
              War Games
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className="px-8 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg uppercase text-[10px] font-black tracking-[0.2em] transition-all duration-200"
            >
              Terminal Output
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolios" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 🚀 INDUSTRIAL PORTFOLIO MAPPING (Replaces lines 679 to 820) */}
{portfolios.map((portfolio, index) => {
  // Use the shield icon as a reliable fallback
  const StrategyIcon = strategyIcons[portfolio.strategy_type] || Shield;
  const isSelected = selectedPortfolios.includes(portfolio.id);

  return (
    <motion.div
      key={portfolio.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className={`group relative border-2 transition-all h-full flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
        {/* Industrial Top Accent Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${strategyColors[portfolio.strategy_type]}`} />
        
        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
                  <StrategyIcon className="w-4 h-4" />
                </div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
                  {portfolio.name}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-slate-50 border-slate-200 text-slate-500">
                {portfolio.strategy_type ? portfolio.strategy_type.replace(/_/g, ' ') : 'STRATEGY'}
              </Badge>
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => togglePortfolioSelection(portfolio.id)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer transition-transform active:scale-90 mt-1"
            />
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 flex-1 flex flex-col space-y-4">
          {/* DESCRIPTION: Fallback text removed. Min-height ensures alignment if empty */}
          <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {portfolio.description || ""}
          </p>

          {/* Technical Metrics readout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 text-center">AUM Position</p>
              <p className="text-lg font-black text-slate-900 text-center">
                ${(portfolio.total_value || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 text-center">Risk Rating</p>
              <p className="text-lg font-black text-slate-900 text-center">
                {portfolio.risk_score && portfolio.risk_score > 0 ? portfolio.risk_score.toFixed(2) : "UNRATED"}
              </p>
            </div>
          </div>

          {/* Allocation Bar with IMMEDIATE Visual Legend on Hover */}
          {portfolio.assets && portfolio.assets.length > 0 && (
            <div 
              className="py-2 group/assets-container cursor-help relative"
              title={portfolio.assets.map(a => `${a.symbol}: ${a.allocation_percent}%`).join('\n')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Allocation Distribution</span>
                <span className="text-[9px] font-bold text-slate-500">{portfolio.assets.length} Units</span>
              </div>
              
              {/* Added 'group' here to ensure the legend below triggers on ANY hover in this section */}
              <div className="group/bar-section">
                <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200">
                  {portfolio.assets.map((asset, i) => (
                    <div 
                      key={i}
                      style={{ width: `${asset.allocation_percent}%` }}
                      className={`h-full border-r border-white/20 transition-opacity hover:opacity-80 ${['bg-indigo-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-500', 'bg-slate-400'][i % 5]}`}
                    />
                  ))}
                </div>

                {/* TECHNICAL LEGEND: Using standard group-hover for maximum compatibility */}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 opacity-0 group-hover/assets-container:opacity-100 transition-opacity duration-200">
                  {portfolio.assets.map((asset, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${['bg-indigo-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-500', 'bg-slate-400'][i % 5]}`} />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                        {asset.symbol} <span className="text-slate-400">{asset.allocation_percent}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Command Bar */}
          <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
            <Button 
              onClick={() => setShowOptimizeDialog(portfolio.id)}
              variant="outline" 
              className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest border-2 hover:bg-slate-900 hover:text-white transition-all"
            >
              <Repeat className="w-3 h-3 mr-1" />
              Optimize
            </Button>
            <Button 
              onClick={() => {
                setEditingPortfolio(portfolio);
                setShowCreateDialog(true);
              }}
              variant="outline" 
              size="icon" 
              className="h-9 w-9 border-2 hover:bg-slate-100"
            >
              <Pencil className="w-3 h-3 text-slate-600" />
            </Button>
            <Button 
              onClick={() => deletePortfolio(portfolio.id)}
              variant="outline" 
              size="icon" 
              className="h-9 w-9 border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
})}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6 mt-6">
            <Card className="border-2 border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="w-6 h-6" />
                    My Challenges
                  </CardTitle>
                  <Button
                    onClick={() => setShowCreateChallengeDialog(true)}
                    className="bg-white text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {challenges.filter(c => c.created_by_email === user?.email).length === 0 ? (
                  <p className="text-center text-slate-500 py-8">You haven't created any challenges yet</p>
                ) : (
                  <div className="space-y-4">
                    {challenges.filter(c => c.created_by_email === user?.email).map(challenge => {
                      const myEntry = challenge.entries?.find(e => e.user_email === user?.email);
                      const sortedEntries = (challenge.entries || []).sort((a, b) => b.score - a.score);
                      
                      return (
                        <Card key={challenge.id} className="border border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 mb-1">{challenge.name}</h3>
                                <p className="text-sm text-slate-600 mb-2">{challenge.description}</p>
                                <div className="flex gap-2 mb-2">
                                  <Badge className="bg-purple-100 text-purple-700">
                                    {challenge.challenge_type.replace(/_/g, ' ')}
                                  </Badge>
                                  <Badge variant="outline">
                                    {challenge.duration_months} months
                                  </Badge>
                                  <Badge variant="outline">
                                    Target: {challenge.target_metric}
                                  </Badge>
                                  {challenge.badge_reward && (
                                    <Badge className="bg-amber-100 text-amber-700">
                                      🏆 {challenge.badge_reward}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {(challenge.invited_users?.length || 0)} invited • {(challenge.entries?.length || 0)} entries
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedChallenge(challenge);
                                  setShowInviteDialog(true);
                                }}
                              >
                                Invite Users
                              </Button>
                            </div>

                            {sortedEntries.length > 0 && (
                              <div className="border-t pt-3">
                                <p className="text-sm font-semibold text-slate-700 mb-2">Leaderboard</p>
                                <div className="space-y-2">
                                  {sortedEntries.slice(0, 3).map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 rounded p-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">#{idx + 1}</span>
                                        <span className="text-sm text-slate-600">
                                          {entry.user_email === user?.email ? "You" : entry.user_email}
                                        </span>
                                        {entry.badge_earned && (
                                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                                            🏆
                                          </Badge>
                                        )}
                                      </div>
                                      <Badge className="bg-purple-600 text-white">
                                        {entry.score}/100
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Award className="w-6 h-6" />
                  Challenges I'm Invited To
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {challenges.filter(c => c.invited_users?.includes(user?.email)).length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No invitations yet</p>
                ) : (
                  <div className="space-y-4">
                    {challenges.filter(c => c.invited_users?.includes(user?.email)).map(challenge => {
                      const myEntry = challenge.entries?.find(e => e.user_email === user?.email);
                      
                      return (
                        <Card key={challenge.id} className="border border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 mb-1">{challenge.name}</h3>
                                <p className="text-sm text-slate-600 mb-2">{challenge.description}</p>
                                <div className="flex gap-2 mb-2">
                                  <Badge className="bg-blue-100 text-blue-700">
                                    {challenge.challenge_type.replace(/_/g, ' ')}
                                  </Badge>
                                  <Badge variant="outline">
                                    {challenge.duration_months} months
                                  </Badge>
                                  <Badge variant="outline">
                                    Target: {challenge.target_metric}
                                  </Badge>
                                </div>
                                {myEntry && (
                                  <div className="flex gap-2">
                                    <Badge className="bg-emerald-100 text-emerald-700">
                                      Entered • Score: {myEntry.score}/100
                                    </Badge>
                                    {myEntry.badge_earned && (
                                      <Badge className="bg-amber-100 text-amber-700">
                                        🏆 Badge Earned
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  setSelectedChallenge(challenge);
                                  setShowEnterChallengeDialog(true);
                                }}
                              >
                                {myEntry ? "Re-enter" : "Enter Challenge"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-6">
            {!scenarioResults ? (
              <Card className="border-2 border-slate-200">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Simulation Results Yet</h3>
                  <p className="text-slate-500">Select portfolios and run a scenario simulation to see results</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-blue-300 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="text-2xl">
                    {scenarioResults.scenario_name} - Simulation Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Simulation Methodology
                      </h3>
                      <div className="space-y-2 text-sm text-slate-700">
                        <p><strong>Scenario Period:</strong> {customScenario.name} - {customScenario.duration_months} months</p>
                        <p><strong>Asset Validation:</strong> Only assets that existed during the scenario period are included</p>
                        <p><strong>Rebalancing:</strong> Monthly rebalancing to target allocations</p>
                        <p><strong>Returns:</strong> Price-only (no dividends unless explicitly stated)</p>
                        <p><strong>Data Source:</strong> AI-estimated returns based on historical market behavior patterns</p>
                        <p><strong>Limitations:</strong> Past scenarios do not predict future results. Asset correlations may differ in future crises.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Support both new single 'data' object and old 'portfolios' array */}
                    {(scenarioResults.data ? [scenarioResults.data] : scenarioResults.portfolios || [])?.map((result, index) => {
                      // Standardize data source: New backend uses 'outcome', old uses the root object
                      const outcome = result.outcome || result;
                      const analysisText = result.analysis?.scenario_analysis || result.ai_analysis || result.recommendations || "Analysis processing...";
                      const isPositive = Number(outcome.total_impact_percent || outcome.total_return_percent || 0) >= 0;

                      return (
                        <Card key={index} className="border-2 border-slate-200 overflow-hidden">
                          <div className={`h-1.5 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between items-center">
                              {result.portfolio_name || (outcome.scenario_type ? outcome.scenario_type.replace('_', ' ').toUpperCase() : "Portfolio Simulation")}
                              <Badge variant="secondary" className="font-mono text-[10px]">
                                {result.model || 'CLAUDE-3.5'}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50/50 border border-blue-100 rounded p-3">
                                <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-1">Initial Value</p>
                                <p className="text-lg font-bold text-slate-900">
                                  ${Number(outcome.base_portfolio_value || outcome.initial_value || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-indigo-50/50 border border-indigo-100 rounded p-3">
                                <p className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold mb-1">Final Value</p>
                                <p className="text-lg font-bold text-slate-900">
                                  ${Number(outcome.scenario_portfolio_value || outcome.final_value || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className={`border rounded p-3 ${isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>Total Return</p>
                                <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isPositive ? '+' : ''}{Number(outcome.total_impact_percent || outcome.total_return_percent || 0).toFixed(2)}%
                                </p>
                              </div>
                              <div className="bg-orange-50/50 border border-orange-100 rounded p-3">
                                <p className="text-[10px] uppercase tracking-wider text-orange-600 font-bold mb-1">Stress Factor</p>
                                <p className="text-lg font-bold text-orange-600">
                                  {outcome.correlation_impact || outcome.max_drawdown_percent || "0"}%
                                </p>
                              </div>
                            </div>

                            {/* AI ANALYSIS BLOCK */}
                            <div className="bg-slate-900 rounded-lg p-4 shadow-inner">
                              <div className="flex items-center mb-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Market Intelligence</p>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed font-serif italic">
                                "{analysisText}"
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Portfolio Impact Summary</p>
                                <div className="flex flex-wrap gap-2">
                                  {(outcome.worst_affected_assets || outcome.best_performing_assets || []).map((asset, i) => (
                                    <Badge key={i} variant="outline" className="border-rose-200 text-rose-600 bg-rose-50/30">
                                      <TrendingDown className="w-3 h-3 mr-1" />
                                      {asset.symbol || asset} {asset.impact_percent ? `(${asset.impact_percent}%)` : ''}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create Simulation Portfolio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Portfolio Name</Label>
                <Input
                  value={newPortfolio.name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
                  placeholder="e.g., Aggressive Tech Portfolio"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                  placeholder="What's the strategy?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Strategy Type</Label>
                 <Select
                    value={newPortfolio.strategy_type}
                    onValueChange={(value) => setNewPortfolio({ ...newPortfolio, strategy_type: value })}
                  >
                    <SelectTrigger className="border-slate-300 bg-white text-slate-900 font-bold shadow-sm h-10 w-full px-3 flex justify-between items-center">
                      <span className="text-slate-900 uppercase text-[10px] tracking-widest font-black">
                        {newPortfolio.strategy_type ? newPortfolio.strategy_type.replace(/_/g, ' ') : "Select Strategy"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-xl">
                      <SelectItem value="aggressive_growth">Aggressive Growth</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="income_focused">Income Focused</SelectItem>
                      <SelectItem value="thematic">Thematic</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Total Value ($)</Label>
                  <Input
                    type="number"
                    value={newPortfolio.total_value}
                    onChange={(e) => setNewPortfolio({ 
                      ...newPortfolio, 
                      total_value: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                    })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Portfolio Composition</h3>
                    <Badge variant="outline" className="text-[9px] font-bold">Total: {newPortfolio.assets.reduce((sum, a) => sum + a.allocation_percent, 0).toFixed(1)}%</Badge>
                  </div>
                  
                 <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setNewPortfolio({
                    ...newPortfolio,
                    assets: [...newPortfolio.assets, { symbol: "", name: "", asset_class: "stock", allocation_percent: 0 }]
                  })} 
                  className="w-full border-2 border-dashed border-slate-300 py-6 hover:bg-slate-50 transition-all font-bold text-slate-600 uppercase tracking-widest text-[10px] mb-6"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Asset Row
                </Button>

                {newPortfolio.assets.length > 0 && (
                  <div className="space-y-2">
                    {newPortfolio.assets.map((asset, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 items-end shadow-sm">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-[9px] uppercase font-black text-slate-400">Ticker</Label>
                          <Input
                            className="border-slate-300 bg-white font-black uppercase text-slate-900 h-10"
                            placeholder="AAPL"
                            value={asset.symbol} 
                            onChange={(e) => handleAssetChange(index, 'symbol', e.target.value)}
                          />
                        </div>
                        <div className="col-span-5 space-y-1">
                          <Label className="text-[9px] uppercase font-black text-slate-400">Alloc %</Label>
                          <Input
                            type="number"
                            className="border-slate-300 bg-white font-bold text-slate-900 h-10"
                            value={asset.allocation_percent}
                            onChange={(e) => handleAssetChange(index, 'allocation_percent', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex justify-center pb-1">
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="text-rose-500 hover:bg-rose-100 rounded-full h-10 w-10"
                            onClick={() => removeAsset(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Visual indicator for the total allocation */}
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-900 rounded-lg text-white shadow-inner">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Weight</span>
                      <span className={`font-mono font-bold text-sm ${newPortfolio.assets.reduce((sum, a) => sum + a.allocation_percent, 0) > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {newPortfolio.assets.reduce((sum, a) => sum + a.allocation_percent, 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={createPortfolio} 
                className="w-full bg-[#4353FF] hover:bg-[#3544CC] text-white font-black uppercase tracking-widest text-xs h-12 shadow-xl transition-all"
              >
                Create Simulation Portfolio
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCreateChallengeDialog} onOpenChange={setShowCreateChallengeDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Challenge Name</Label>
                <Input
                  value={newChallenge.name}
                  onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                  placeholder="e.g., Bear Market Survival Challenge"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  placeholder="Test your portfolio in a market downturn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Challenge Type</Label>
                  <Select
                    value={newChallenge.challenge_type}
                    onValueChange={(value) => setNewChallenge({ ...newChallenge, challenge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highest_return">Highest Return</SelectItem>
                      <SelectItem value="lowest_drawdown">Lowest Drawdown</SelectItem>
                      <SelectItem value="best_sharpe">Best Sharpe Ratio</SelectItem>
                      <SelectItem value="target_return">Target Return</SelectItem>
                      <SelectItem value="crisis_survival">Crisis Survival</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duration (Months)</Label>
                  <Input
                    type="number"
                    value={newChallenge.duration_months}
                    onChange={(e) => setNewChallenge({ ...newChallenge, duration_months: parseInt(e.target.value) })}
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <Label>Target Metric</Label>
                <Input
                  type="number"
                  value={newChallenge.target_metric}
                  onChange={(e) => setNewChallenge({ 
                    ...newChallenge, 
                    target_metric: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                  })}
                  placeholder={
                    newChallenge.challenge_type === "highest_return" ? "e.g., 15 for 15% return" :
                    newChallenge.challenge_type === "lowest_drawdown" ? "e.g., -10 for max 10% loss" :
                    newChallenge.challenge_type === "best_sharpe" ? "e.g., 1.5 for Sharpe ratio" :
                    newChallenge.challenge_type === "target_return" ? "e.g., 12 for exact 12% return" :
                    "e.g., -20 for max 20% loss allowed"
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  {newChallenge.challenge_type === "highest_return" && "The minimum return % participants must beat"}
                  {newChallenge.challenge_type === "lowest_drawdown" && "The maximum drawdown % allowed (negative number)"}
                  {newChallenge.challenge_type === "best_sharpe" && "The minimum Sharpe ratio to achieve"}
                  {newChallenge.challenge_type === "target_return" && "The exact return % to hit (closest wins)"}
                  {newChallenge.challenge_type === "crisis_survival" && "The maximum portfolio loss % allowed"}
                </p>
              </div>

              <div>
                <Label>Badge Reward</Label>
                <Input
                  value={newChallenge.badge_reward}
                  onChange={(e) => setNewChallenge({ ...newChallenge, badge_reward: e.target.value })}
                  placeholder="e.g., Bear Market Survivor"
                />
              </div>

              <Button
                onClick={createChallenge}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite User to Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>User Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              {selectedChallenge?.invited_users && selectedChallenge.invited_users.length > 0 && (
                <div>
                  <Label className="mb-2 block">Already Invited</Label>
                  <div className="space-y-1">
                    {selectedChallenge.invited_users.map((email, idx) => (
                      <Badge key={idx} variant="outline" className="mr-2">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={inviteUser} className="w-full bg-purple-600 hover:bg-purple-700">
                Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEnterChallengeDialog} onOpenChange={setShowEnterChallengeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Challenge with Portfolio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-600">
                Select a portfolio to enter into <strong>{selectedChallenge?.name}</strong>
              </p>

              <div className="space-y-2 max-h-64 overflow-auto">
                {portfolios.map(portfolio => (
                  <Button
                    key={portfolio.id}
                    onClick={() => enterChallenge(portfolio.id)}
                    disabled={isSimulating}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <div className="text-left">
                      <p className="font-semibold">{portfolio.name}</p>
                      <p className="text-xs text-slate-500">
                        {portfolio.assets?.length || 0} assets • ${(portfolio.total_value || 0).toLocaleString()}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>

              {isSimulating && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-slate-600">Calculating score...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showScenarioDialog} onOpenChange={setShowScenarioDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Run Market Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Scenario Name</Label>
                <Input
                  value={customScenario.name}
                  onChange={(e) => setCustomScenario({ ...customScenario, name: e.target.value })}
                  placeholder="e.g., 2008 Financial Crisis"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Market Crash (%)</Label>
                  <Input
                    type="number"
                    value={customScenario.market_crash_percent}
                    onChange={(e) => setCustomScenario({ 
                      ...customScenario, 
                      market_crash_percent: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                    })}
                    placeholder="-30"
                  />
                </div>
                <div>
                  <Label>Interest Rate Change (%)</Label>
                  <Input
                    type="number"
                    value={customScenario.interest_rate_change}
                    onChange={(e) => setCustomScenario({ 
                      ...customScenario, 
                      interest_rate_change: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                    })}
                    placeholder="+2"
                  />
                </div>
                <div>
                  <Label>Inflation Rate (%)</Label>
                  <Input
                    type="number"
                    value={customScenario.inflation_rate}
                    onChange={(e) => setCustomScenario({ 
                      ...customScenario, 
                      inflation_rate: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                    })}
                    placeholder="8"
                  />
                </div>
                <div>
                  <Label>Duration (Months)</Label>
                  <Input
                    type="number"
                    value={customScenario.duration_months}
                    onChange={(e) => setCustomScenario({ 
                      ...customScenario, 
                      duration_months: e.target.value === "" ? 0 : parseInt(e.target.value) 
                    })}
                    placeholder="12"
                  />
                </div>
              </div>

              <Button
                onClick={runScenarioSimulation}
                disabled={isSimulating}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
