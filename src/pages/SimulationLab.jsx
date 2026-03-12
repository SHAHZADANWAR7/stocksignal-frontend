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
  ShieldAlert,
  Flame,
  Loader2,
  Repeat,
  GitCompare,
  Pencil,
  Mail,
  Activity,
  Clock,
  FileText,
  Terminal,
  Database
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
  const [selectedPortfolioForOpt, setSelectedPortfolioForOpt] = useState(null);
const [isOptimizing, setIsOptimizing] = useState(false);

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
      const loginEmail = (localStorage.getItem('user_email') || "").toLowerCase().trim();
      const data = await awsApi.getUser({ 
        userId: localStorage.getItem('user_id'),
        cognitoSub: localStorage.getItem('user_id') 
      }); 
      
      if (data) {
        // We force the email to be the loginEmail to fix the "4 vs 40" typo
        setUser({ 
          ...data, 
          email: loginEmail || data.email,
          attributes: { email: loginEmail || data.email }
        });
        console.log("✅ Profile Sync Successful");
      }
    } catch (error) {
      if (error.message?.includes('404')) {
        const fallback = (localStorage.getItem('user_email') || "").toLowerCase().trim();
        setUser({ email: fallback, attributes: { email: fallback } });
      } else {
        console.error("Error loading user:", error);
      }
    }
  };


  const loadRemainingUsage = async () => {
    const usage = await getRemainingUsage();
    setRemainingUsage(usage);
  };

const loadData = async () => {
    try {
      // 1. Fetch portfolios
      const response = await awsApi.getSimulationPortfolio({}); 
      const portfolioList = Array.isArray(response?.data) ? response.data : [];
      setPortfolios(portfolioList);

      // 2. Fetch challenges 
      try {
        const labResponse = await awsApi.getSimulationLabData({});
        const rawData = labResponse?.data;

        // --- THE UNIVERSAL IDENTITY PATCH ---
        // Your logs show rawData.user_email is the CORRECT '40' version.
        // We use this to 'patch' the user state every time, 
        // fixing both Kevin's 404 and your '4 vs 40' typo automatically.
        const verifiedEmail = rawData?.user_email || localStorage.getItem('user_email');
        
        if (verifiedEmail) {
          setUser(prev => ({
            ...(prev || {}),
            email: verifiedEmail,
            attributes: { ...(prev?.attributes || {}), email: verifiedEmail }
          }));
        }

        const challengeList = 
          rawData?.challenges || 
          rawData?.lab_summary?.challenges || 
          (Array.isArray(rawData) ? rawData : []);

        setChallenges(Array.isArray(challengeList) ? challengeList : []);
        
        console.log(`📡 [System] Sync: ${portfolioList.length} Portfolios | ${challengeList.length} Challenges Captured`);
      } catch (labError) {
        console.warn("⚠️ Challenge registry sync failed.", labError);
      }
    } catch (error) {
      console.error("❌ Critical Global Sync Error:", error);
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

  const handleTacticalOptimize = async (strategy) => {
    if (!selectedPortfolioForOpt || !user?.email) {
      alert("Tactical Error: Identity or Portfolio link lost.");
      return;
    }
    
    setIsOptimizing(true);
    try {
      // 1. Target the specific portfolio from state
      const portfolio = portfolios.find(p => p.id === selectedPortfolioForOpt);

      // 2. Execute Backend Quantitative Rebalance
      // Passes email and portfolio_id to match the simulation_portfolios keys
      const result = await awsApi.optimizePortfolio({
        email: user.email,
        portfolio_id: selectedPortfolioForOpt,
        strategy: strategy,
        total_investment: portfolio.total_value
      });

      if (result && result.optimization) {
        const { optimized_allocations, reasoning } = result.optimization;

        // 3. Map new math-based weights to the local portfolio structure
        const updatedAssets = portfolio.assets.map(asset => {
          const match = optimized_allocations.find(a => a.symbol === asset.symbol);
          return match ? { ...asset, allocation_percent: match.allocation_percent } : asset;
        });

        // 4. Update the simulation_portfolios table with the new weights
        await awsApi.updateSimulationPortfolio(selectedPortfolioForOpt, {
          assets: updatedAssets,
          updated_at: new Date().toISOString()
        });

        // 5. Success cleanup and UI refresh
        await loadData();
        setShowOptimizeDialog(false);
        setSelectedPortfolioForOpt(null);
        alert(`✅ Tactical Optimization Complete: ${reasoning}`);
      }
    } catch (error) {
      console.error("❌ Optimization Engine Failure:", error);
      alert("System Error: Optimization engine timed out or failed to find record.");
    } finally {
      setIsOptimizing(false);
    }
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
        {/* 🛰️ INDUSTRIAL SELECTION COMMAND BAR (Replace lines 631 to 659) */}
<AnimatePresence>
  {selectedPortfolios.length > 0 && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="mb-10"
    >
      <Card className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white">
        {/* Top Tactical Accent */}
        <div className="h-1.5 w-full bg-slate-900" />
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Tactical Ready Indicator */}
              <div className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600"></span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
                  {selectedPortfolios.length} Strateg{selectedPortfolios.length > 1 ? 'ies' : 'y'} Linked
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-slate-200" />
                  System Ready for Tactical Deployment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => setSelectedPortfolios([])}
                className="flex-1 md:flex-none border-2 border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest h-12 px-8 hover:bg-slate-50 hover:border-slate-300 transition-all rounded-xl"
              >
                Reset Selection
              </Button>
              <Button
                onClick={() => setShowScenarioDialog(true)}
                className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl transition-all shadow-lg active:translate-y-0.5 flex items-center gap-3"
              >
                <Play className="w-4 h-4 fill-current" />
                Initialize Scenario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )}
</AnimatePresence>

       {/* 🛠️ RESPONSIVE INDUSTRIAL NAVIGATION (Replacement for Navigation Block) */}
<Tabs defaultValue="portfolios" className="mb-8 md:mb-10">
  <div className="bg-slate-900 p-1 md:p-1.5 rounded-xl md:rounded-2xl border-b-4 border-slate-800 shadow-xl overflow-hidden">
    {/* MOBILE FIX: 
        - Changed 'grid' to 'flex' on mobile to allow horizontal swiping.
        - Added 'overflow-x-auto' and 'no-scrollbar' for smooth touch interaction.
        - Restores 'md:grid' on desktop for the original layout.
    */}
    <TabsList className="flex md:grid md:grid-cols-3 bg-slate-800 p-1 rounded-lg md:rounded-xl h-12 md:h-14 border border-slate-700/50 overflow-x-auto no-scrollbar">
      <TabsTrigger 
        value="portfolios" 
        className="flex-1 min-w-[130px] md:min-w-0 px-3 md:px-8 rounded-md md:rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] transition-all duration-300 text-slate-400 group shrink-0"
      >
        <div className="flex items-center justify-center gap-1.5 md:gap-2">
          <Database className="w-3 md:w-3.5 h-3 md:h-3.5 group-data-[state=active]:text-indigo-600" />
          <span className="whitespace-nowrap">My Strategies</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger 
        value="challenges" 
        className="flex-1 min-w-[130px] md:min-w-0 px-3 md:px-8 rounded-md md:rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] transition-all duration-300 text-slate-400 group shrink-0"
      >
        <div className="flex items-center justify-center gap-1.5 md:gap-2">
          <Shield className="w-3 md:w-3.5 h-3 md:h-3.5 group-data-[state=active]:text-indigo-600" />
          <span className="whitespace-nowrap">Challenges</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger 
        value="results" 
        className="flex-1 min-w-[130px] md:min-w-0 px-3 md:px-8 rounded-md md:rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] transition-all duration-300 text-slate-400 group shrink-0"
      >
        <div className="flex items-center justify-center gap-1.5 md:gap-2">
          <Terminal className="w-3 md:w-3.5 h-3 md:h-3.5 group-data-[state=active]:text-indigo-600" />
          <span className="whitespace-nowrap">Terminal Output</span>
        </div>
      </TabsTrigger>
    </TabsList>
  </div>


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
              onClick={() => {
                  setSelectedPortfolioForOpt(portfolio.id);
                  setShowOptimizeDialog(true);
                }}
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
  {/* Tactical Operations (My Challenges) */}
  <Card className="border-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
    {/* Dark Industrial Accent */}
    <div className="h-1.5 w-full bg-slate-900" />
    <CardHeader className="bg-slate-50 border-b border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-900">
            Tactical Operations
          </CardTitle>
        </div>
        <Button
          onClick={() => setShowCreateChallengeDialog(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] px-6 py-5 rounded-xl transition-all shadow-lg active:translate-y-0.5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Initialize Challenge
        </Button>
      </div>
    </CardHeader>
   <CardContent className="p-6">
      {/* --- TACTICAL OPERATIONS LOGIC --- */}
      {(() => {
        // Identity Recovery: Check all possible variants of your email
        const cognitoEmail = (user?.email || "").toLowerCase().trim();
        const profileEmail = (user?.profile_email || "").toLowerCase().trim();
        const cachedEmail = (localStorage.getItem('user_email') || "").toLowerCase().trim();
        
        // Filter: If the creator matches ANY of your known identities
        const myChallenges = (challenges || []).filter(c => {
          const creator = (c.created_by_email || c.email || "").toLowerCase().trim();
          if (creator === "") return false;

          // Check for exact matches OR the specific "dr.shahzadanwar4/40" mismatch
          const isExactMatch = creator === cognitoEmail || creator === profileEmail || creator === cachedEmail;
          const isMismatchVariant = (creator.includes("dr.shahzadanwar4") && cognitoEmail.includes("dr.shahzadanwar4"));

          return isExactMatch || isMismatchVariant;
        });

        if (myChallenges.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Shield className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Status: No Active Deployments
              </p>
              <p className="text-sm text-slate-400 mt-1 font-medium">Create a challenge to stress-test regional strategy resilience.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {myChallenges.map(challenge => {
              const sortedEntries = (challenge.entries || []).sort((a, b) => (b.score || 0) - (a.score || 0));
              return (
                <Card key={challenge.id} className="border-2 border-slate-100 hover:border-indigo-200 transition-all rounded-xl overflow-hidden group">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg group-hover:text-indigo-600 transition-colors">
                            {challenge.name}
                          </h3>
                          <Badge variant="outline" className="text-[9px] uppercase font-black border-slate-200 text-slate-500 bg-slate-50">
                            {challenge.challenge_type ? challenge.challenge_type.replace(/_/g, ' ') : 'STRATEGY'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-4 font-medium">{challenge.description || 'Active Simulation Lab Challenge'}</p>
                        <div className="flex flex-wrap gap-2">
                          <div className="px-2.5 py-1 bg-slate-50 rounded border border-slate-100 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                              {challenge.duration_days || 90} Days
                            </span>
                          </div>
                          <div className="px-2.5 py-1 bg-slate-50 rounded border border-slate-100 flex items-center gap-2">
                            <Target className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                              Cap: ${Number(challenge.starting_capital || 100000).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 border-l border-slate-100 pl-6 h-full min-w-[240px]">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Participants</p>
                          <div className="flex -space-x-2 overflow-hidden mb-1 justify-center">
                            {sortedEntries.length > 0 ? sortedEntries.slice(0, 3).map((entry, i) => (
                               <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black ${['bg-indigo-500', 'bg-purple-500', 'bg-slate-800'][i % 3]} text-white shadow-sm`}>
                                 {(entry.user_email || "U").charAt(0).toUpperCase()}
                               </div>
                            )) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 font-black">0</div>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            setSelectedChallenge(challenge);
                            setShowInviteDialog(true);
                          }}
                          variant="outline" 
                          className="border-2 font-black uppercase text-[10px] tracking-widest h-10 px-6 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          Invite
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}
    </CardContent>
  </Card>

 {/* Inbound Protocols (Invitations) */}
  <Card className="border-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white mt-6">
    <div className="h-1.5 w-full bg-indigo-600" />
    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
      <div className="flex items-center gap-3">
        <Activity className="w-4 h-4 text-indigo-600" />
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Inbound Invitations
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent className="p-8">
      {(() => {
        try {
          // Resolve Identity from all possible signals
          const rawEmail = user?.attributes?.email || user?.email || localStorage.getItem('user_email') || "";
          const myEmail = String(rawEmail).toLowerCase().trim();

          // Filter challenges
          const invitations = (challenges || []).filter(c => {
            const invitedList = (c.invited_users || []).map(u => String(u || "").toLowerCase().trim());
            const creator = String(c.created_by_email || c.email || "").toLowerCase().trim();
            
            const isInvited = myEmail !== "" && invitedList.includes(myEmail);
            const isOwner = myEmail !== "" && creator === myEmail;

            // Debug log if we find a match
            if (isInvited && !isOwner) console.log(`✅ [UI Match] Found invitation for Kevin: ${c.name}`);

            return isInvited && !isOwner;
          });

          if (invitations.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  No Pending Signals Detected
                </p>
                <p className="text-[9px] text-slate-400 uppercase mt-1 tracking-tighter">
                  Monitoring encrypted channels for authorization...
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {invitations.map(challenge => (
                <div key={challenge.id} className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl bg-slate-50/30 group hover:bg-white hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-indigo-200 transition-all">
                      <Activity className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{challenge.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest uppercase">
                        Invitation Verified
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedChallenge(challenge);
                      setShowEnterChallengeDialog(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg"
                  >
                    Accept Deployment
                  </Button>
                </div>
              ))}
            </div>
          );
        } catch (error) {
          console.error("UI Filter Logic Error:", error);
          return null;
        }
      })()}
    </CardContent>
  </Card>
</TabsContent>
        {/* 🖥️ INDUSTRIAL COMMAND INTEL (Replace from line 1030 to 1210) */}
<TabsContent value="results" className="space-y-6 mt-6">
  {!scenarioResults ? (
    <Card className="border-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
      <div className="h-1.5 w-full bg-slate-300" />
      <CardContent className="p-16 flex flex-col items-center justify-center text-center">
        <div className="p-5 bg-slate-50 rounded-full mb-6 border border-slate-100">
          <BarChart3 className="w-12 h-12 text-slate-300" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          System State: Awaiting Input
        </p>
        <p className="text-sm text-slate-400 mt-2 max-w-xs font-medium">
          Select portfolios and execute a scenario simulation to generate tactical analytics.
        </p>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-6">
      {/* Simulation Header & Methodology Dossier */}
      <Card className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white">
        <div className="h-1.5 w-full bg-slate-900" />
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg">
                <Terminal className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                  {scenarioResults.scenario_name || "Simulation Results"}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tactical Feed Active</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="border-2 font-black uppercase text-[10px] tracking-widest h-10 px-6 border-slate-200 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              Download Intel
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 bg-slate-50/50">
          <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Simulation Methodology & Controls
            </h3>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-3 text-[11px] font-medium text-slate-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                <p><span className="font-black text-slate-900 uppercase">Scenario:</span> {customScenario.name} ({customScenario.duration_months} Months)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                <p><span className="font-black text-slate-900 uppercase">Rebalancing:</span> Monthly drift correction to target weightings.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                <p><span className="font-black text-slate-900 uppercase">Valuation:</span> AI-estimated pricing based on volatility clusters.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                <p><span className="font-black text-slate-900 uppercase">Data Source:</span> Cross-referenced AI vs Historical behavior.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Grid Breakdown */}
      <div className="space-y-6">
        {(scenarioResults.data ? [scenarioResults.data] : scenarioResults.portfolios || [])?.map((result, index) => {
          const outcome = result.outcome || result;
          
          // AI TEXT CLEANUP: Stripping JSON and raw text fragments
          let cleanAnalysis = result.analysis?.scenario_analysis || result.ai_analysis || result.recommendations || "Analysis processing...";
          if (cleanAnalysis.includes('}')) {
             cleanAnalysis = cleanAnalysis.split('}').pop().replace(/^[^a-zA-Z]+/, '').trim();
          }

          const isPositive = Number(outcome.total_impact_percent || outcome.total_return_percent || 0) >= 0;
          const initialCapital = Number(outcome.base_portfolio_value || outcome.initial_value || 0);
          const returnPercent = Number(outcome.total_impact_percent || outcome.total_return_percent || 0);
          
          // 🛠️ SMART CALCULATION: If Valuation is 0, calculate it manually from return %
          let finalValuation = Number(outcome.scenario_portfolio_value || outcome.final_value || 0);
          if (finalValuation === 0 && initialCapital > 0) {
             finalValuation = initialCapital * (1 + (returnPercent / 100));
          }

          return (
            <Card key={index} className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-slate-300 transition-all">
              <div className={`h-1.5 w-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              <CardHeader className="pb-4 pt-5 border-b border-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {result.portfolio_name || (outcome.scenario_type ? outcome.scenario_type.replace('_', ' ').toUpperCase() : "Portfolio Simulation")}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1 text-[9px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 text-slate-500">
                      Processing Engine: {result.model || 'SONNET-3.5'}
                    </Badge>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Valuation</p>
                     <p className="text-xl font-black text-slate-900 font-mono">
                        ${finalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Return</p>
                    <p className={`text-xl font-black font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}{returnPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Volatility</p>
                    <p className="text-xl font-black text-slate-900 font-mono">
                      {Number(outcome.volatility || outcome.volatility_score || outcome.risk_score || 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sharpe Ratio</p>
                    <p className="text-xl font-black text-indigo-600 font-mono">
                      {Number(outcome.sharpe_ratio || outcome.sharpe || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Drawdown</p>
                    <p className="text-xl font-black text-rose-600 font-mono">
                      {Number(outcome.max_drawdown || outcome.max_drawdown_percent || 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stress Factor</p>
                    <p className="text-xl font-black text-orange-600 font-mono">
                      {Number(outcome.stress_factor || outcome.correlation_impact || 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Initial Capital</p>
                    <p className="text-xl font-black text-slate-900 font-mono">
                      ${initialCapital.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 rounded-xl relative overflow-hidden group/intel">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Activity className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategic AI Intelligence</p>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                    "{cleanAnalysis}"
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Portfolio Impact Summary</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Logic to show Worst Affected Assets if data exists, otherwise show placeholder badges based on AI text keywords */}
                    {(outcome.worst_affected_assets && outcome.worst_affected_assets.length > 0) ? (
                      outcome.worst_affected_assets.map((asset, i) => (
                        <Badge key={i} variant="outline" className="border-rose-200 text-rose-600 bg-rose-50/50 text-[10px] font-black uppercase">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {asset.symbol || asset} {asset.impact_percent ? `(${asset.impact_percent}%)` : ''}
                        </Badge>
                      ))
                    ) : (
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="border-slate-200 text-slate-400 text-[9px] uppercase font-black">
                           Analysis Complete: Review AI Intelligence for Detail
                         </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
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
  <DialogContent className="max-w-xl bg-white border-2 border-slate-900 rounded-2xl p-0 overflow-hidden shadow-2xl">
    {/* Industrial Top Accent */}
    <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
    
    <div className="p-8">
      <DialogHeader className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-slate-900 rounded-xl shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              Initialize Challenge
            </DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
              Strategic Deployment Protocol v4.2
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Challenge Name</Label>
          <Input
            className="border-2 border-slate-200 h-12 rounded-xl focus:border-slate-900 transition-all font-bold text-slate-900 shadow-sm"
            value={newChallenge.name}
            onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
            placeholder="e.g., Q1 ALPHA SURVIVAL"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Strategic Description</Label>
          <Input
            className="border-2 border-slate-200 h-12 rounded-xl focus:border-slate-900 transition-all font-medium text-slate-600"
            value={newChallenge.description}
            onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
            placeholder="Operational parameters for this resilience test..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Challenge Type</Label>
            <Select
              value={newChallenge.challenge_type}
              onValueChange={(value) => setNewChallenge({ ...newChallenge, challenge_type: value })}
            >
              <SelectTrigger className="border-2 border-slate-200 h-12 bg-white text-slate-900 font-bold px-4 rounded-xl flex justify-between items-center shadow-sm">
                {/* MANUAL RENDERER FIX: This forces the selected label to show in the UI */}
                <span className="text-slate-900 uppercase text-[11px] font-black tracking-widest">
                  {newChallenge.challenge_type === "highest_return" ? "Highest Return" :
                   newChallenge.challenge_type === "lowest_drawdown" ? "Lowest Drawdown" :
                   newChallenge.challenge_type === "best_sharpe" ? "Best Sharpe Ratio" :
                   newChallenge.challenge_type === "target_return" ? "Target Return" :
                   newChallenge.challenge_type === "crisis_survival" ? "Crisis Survival" :
                   "Select Protocol"}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-slate-900 rounded-xl shadow-2xl">
                <SelectItem value="highest_return" className="font-bold text-[11px] uppercase tracking-widest">Highest Return</SelectItem>
                <SelectItem value="lowest_drawdown" className="font-bold text-[11px] uppercase tracking-widest">Lowest Drawdown</SelectItem>
                <SelectItem value="best_sharpe" className="font-bold text-[11px] uppercase tracking-widest">Best Sharpe Ratio</SelectItem>
                <SelectItem value="target_return" className="font-bold text-[11px] uppercase tracking-widest">Target Return</SelectItem>
                <SelectItem value="crisis_survival" className="font-bold text-[11px] uppercase tracking-widest">Crisis Survival</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Duration (Months)</Label>
            <Input
              type="number"
              className="border-2 border-slate-200 h-12 rounded-xl font-mono font-bold text-slate-900"
              value={newChallenge.duration_months}
              onChange={(e) => setNewChallenge({ ...newChallenge, duration_months: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl relative overflow-hidden group">
          <Activity className="absolute -right-4 -bottom-4 w-20 h-20 text-slate-200/50 group-hover:scale-110 transition-transform" />
          <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
            <Target className="w-3 h-3" /> Target Metric
          </Label>
          <Input
            type="number"
            className="border-2 border-slate-200 bg-white h-12 rounded-xl font-mono font-black text-indigo-600 text-lg shadow-inner"
            value={newChallenge.target_metric}
            onChange={(e) => setNewChallenge({ 
              ...newChallenge, 
              target_metric: e.target.value === "" ? 0 : parseFloat(e.target.value) 
            })}
          />
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">
            {newChallenge.challenge_type === "highest_return" && "Minimum ROI benchmark for clearance"}
            {newChallenge.challenge_type === "lowest_drawdown" && "Max allowable peak-to-trough decline"}
            {newChallenge.challenge_type === "best_sharpe" && "Minimum efficiency score (Risk/Return)"}
            {newChallenge.challenge_type === "target_return" && "Precision targeting for specific yield"}
            {newChallenge.challenge_type === "crisis_survival" && "Maximum portfolio breach tolerance"}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Badge Reward</Label>
          <div className="relative">
            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <Input
              className="border-2 border-slate-200 h-12 pl-12 rounded-xl font-bold text-slate-900 bg-amber-50/30 border-amber-100"
              value={newChallenge.badge_reward}
              onChange={(e) => setNewChallenge({ ...newChallenge, badge_reward: e.target.value })}
              placeholder="e.g., BLACK SWAN SURVIVOR"
            />
          </div>
        </div>

        <Button
          onClick={createChallenge}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-[11px] h-14 rounded-2xl shadow-xl active:translate-y-0.5 transition-all mt-4 flex items-center gap-3 border-0"
        >
          <Play className="w-4 h-4 fill-current" />
          Commit Challenge Deployment
        </Button>
      </div>
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
        {/* 🛠️ TACTICAL OPTIMIZER DIALOG (Insert at Line 1634) */}
        <Dialog 
          open={showOptimizeDialog} 
          onOpenChange={(open) => {
            setShowOptimizeDialog(open);
            if (!open) setSelectedPortfolioForOpt(null);
          }}
        >
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white p-0 overflow-hidden">
            {/* Top Industrial Accent */}
            <div className="h-1.5 w-full bg-indigo-500" />
            
            <div className="p-6">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Repeat className="w-5 h-5 text-indigo-400" />
                  </div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                    Tactical Optimizer
                  </DialogTitle>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">
                  Select a mathematical strategy to rebalance your experimental assets.
                </p>
              </DialogHeader>

              {/* Strategy Grid */}
              <div className="grid gap-3 mt-6">
                {[
                  { id: 'max_sharpe', label: 'Max Sharpe Ratio', desc: 'Optimal risk-adjusted returns', icon: Target },
                  { id: 'min_volatility', label: 'Minimum Volatility', desc: 'Prioritize capital safety', icon: Shield },
                  { id: 'max_returns', label: 'Maximum Growth', desc: 'Aggressive alpha seeking', icon: Flame },
                ].map((strat) => (
                  <button
                    key={strat.id}
                    disabled={isOptimizing}
                    onClick={() => handleTacticalOptimize(strat.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-indigo-600 transition-colors">
                      <strat.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black uppercase text-[10px] tracking-widest">{strat.label}</p>
                      <p className="text-[9px] text-slate-500 font-bold group-hover:text-slate-300 uppercase mt-0.5">
                        {strat.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Engine Status */}
              {isOptimizing && (
                <div className="mt-6 flex items-center justify-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Quantitative Models...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

