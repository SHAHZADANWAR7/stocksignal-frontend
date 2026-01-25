import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
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
  const [user, setUser] = useState(null);
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
    loadUser();
    loadData();
    loadRemainingUsage();
  }, []);

  const loadUser = async () => {
    try {
      const data = await awsApi.getUser();
      setUser(data.user);
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
      const data = await awsApi.getSimulationLabData();
      setPortfolios(data.portfolios || []);
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addAssetToPortfolio = () => {
    if (!newAsset.symbol || newAsset.allocation_percent <= 0) {
      alert("Please enter valid asset details");
      return;
    }

    const totalAllocation = newPortfolio.assets.reduce((sum, a) => sum + a.allocation_percent, 0);
    if (totalAllocation + newAsset.allocation_percent > 100) {
      alert("Total allocation cannot exceed 100%");
      return;
    }

    setNewPortfolio({
      ...newPortfolio,
      assets: [...newPortfolio.assets, { ...newAsset }]
    });

    setNewAsset({
      symbol: "",
      name: "",
      asset_class: "stock",
      allocation_percent: 0
    });
  };

  const removeAsset = (index) => {
    setNewPortfolio({
      ...newPortfolio,
      assets: newPortfolio.assets.filter((_, i) => i !== index)
    });
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
      
      const dateRange = getScenarioDateRange(customScenario.name);
      let validationSummary = "";
      let allValidAssets = [];
      let allInvalidAssets = [];
      let allWarnings = [];
      
      if (dateRange) {
        portfoliosToSimulate.forEach(portfolio => {
          const validation = validateAssetsForPeriod(
            portfolio.assets || [],
            dateRange.start,
            dateRange.end
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
        
        validationSummary = `\n\n📊 DATA VALIDATION (${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}):\n` +
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

      const result = await awsApi.runScenarioSimulation(prompt, customScenario, portfoliosToSimulate);

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
    aggressive_growth: "from-red-600 to-orange-600",
    balanced: "from-blue-600 to-indigo-600",
    income_focused: "from-emerald-600 to-teal-600",
    thematic: "from-purple-600 to-pink-600",
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardContent className="p-4 md:p-6 text-center">
                <FlaskConical className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 md:mb-2 text-indigo-600" />
                <p className="text-2xl md:text-3xl font-bold text-slate-900 break-words">{portfolios.length}</p>
                <p className="text-xs md:text-sm text-slate-600">Experimental Portfolios</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-purple-600" />
                <p className="text-3xl font-bold text-slate-900">{challenges.length}</p>
                <p className="text-sm text-slate-600">Active Challenges</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-6 text-center">
                <Zap className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <p className="text-3xl font-bold text-slate-900">{selectedPortfolios.length}</p>
                <p className="text-sm text-slate-600">Selected for Compare</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-6 text-center">
                <Award className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                <p className="text-3xl font-bold text-slate-900">
                  {portfolios.filter(p => p.is_challenge_entry).length}
                </p>
                <p className="text-sm text-slate-600">Challenge Entries</p>
              </CardContent>
            </Card>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolios">My Portfolios</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="results">Simulation Results</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolios" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolios.map((portfolio, index) => {
                const StrategyIcon = strategyIcons[portfolio.strategy_type];
                const isSelected = selectedPortfolios.includes(portfolio.id);
                const pieData = portfolio.assets?.map(asset => ({
                  name: asset.symbol,
                  value: asset.allocation_percent
                })) || [];

                return (
                  <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="h-full"
                  >
                    <Card className={`border-2 transition-all h-full flex flex-col ${isSelected ? 'border-indigo-500 shadow-xl shadow-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'}`}>
                      <CardHeader className={`bg-gradient-to-r ${strategyColors[portfolio.strategy_type]} text-white`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <StrategyIcon className="w-5 h-5" />
                              <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                            </div>
                            <p className="text-white/90 text-sm">{portfolio.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePortfolioSelection(portfolio.id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="mb-4 min-h-[60px]">
                          <h3 className="font-semibold text-slate-900">{portfolio.name}</h3>
                          {portfolio.badges_earned && portfolio.badges_earned.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {portfolio.badges_earned.map((badge, idx) => (
                                <Badge key={idx} className="bg-amber-100 text-amber-700 text-xs">
                                  🏆 {badge}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Total Value</p>
                            <p className="text-lg font-bold text-slate-900">
                              ${(portfolio.total_value || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Assets</p>
                            <p className="text-lg font-bold text-slate-900">
                              {portfolio.assets?.length || 0}
                            </p>
                          </div>
                        </div>

                        {portfolio.assets && portfolio.assets.length > 0 && (
                          <div className="mb-4">
                            <ResponsiveContainer width="100%" height={150}>
                              <RePieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={60}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RePieChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm min-h-[60px]">
                          {portfolio.expected_return !== undefined && portfolio.expected_return !== null ? (
                            <>
                              <div className="bg-emerald-50 rounded p-2">
                                <p className="text-xs text-slate-600">Expected Return</p>
                                <p className="font-bold text-emerald-600">
                                  {(portfolio.expected_return || 0).toFixed(1)}%
                                </p>
                              </div>
                              <div className="bg-rose-50 rounded p-2">
                                <p className="text-xs text-slate-600">Risk Score</p>
                                <p className="font-bold text-rose-600">
                                  {(portfolio.risk_score || 0).toFixed(1)}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="col-span-2 text-center text-slate-400 text-sm">
                              No metrics calculated yet
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Button
                            onClick={() => setShowOptimizeDialog(portfolio.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
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
                            size="sm"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => deletePortfolio(portfolio.id)}
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
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
                    {scenarioResults.portfolios?.map((result, index) => (
                      <Card key={index} className="border-2 border-slate-200">
                        <CardHeader>
                          <CardTitle className="text-lg">{result.portfolio_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded p-3">
                              <p className="text-xs text-slate-600 mb-1">Initial Value</p>
                              <p className="text-lg font-bold text-slate-900">
                                ${result.initial_value?.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-indigo-50 rounded p-3">
                              <p className="text-xs text-slate-600 mb-1">Final Value</p>
                              <p className="text-lg font-bold text-slate-900">
                                ${result.final_value?.toLocaleString()}
                              </p>
                            </div>
                            <div className={`rounded p-3 ${(result.total_return_percent || 0) >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                              <p className="text-xs text-slate-600 mb-1">Total Return</p>
                              <p className={`text-lg font-bold ${(result.total_return_percent || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {(result.total_return_percent || 0) >= 0 ? '+' : ''}{(result.total_return_percent || 0).toFixed(2)}%
                              </p>
                            </div>
                            <div className="bg-orange-50 rounded p-3">
                              <p className="text-xs text-slate-600 mb-1">Max Drawdown</p>
                              <p className="text-lg font-bold text-orange-600">
                                {(result.max_drawdown_percent || 0).toFixed(2)}%
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Best Performers</p>
                            <div className="flex flex-wrap gap-2">
                              {result.best_performing_assets?.map((asset, i) => (
                                <Badge key={i} className="bg-emerald-100 text-emerald-700">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {asset}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Worst Performers</p>
                            <div className="flex flex-wrap gap-2">
                              {result.worst_performing_assets?.map((asset, i) => (
                                <Badge key={i} className="bg-rose-100 text-rose-700">
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  {asset}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200">
                            <p className="text-sm text-slate-700">{result.recommendations}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, total_value: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">Add Assets</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <Input
                    placeholder="Symbol"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value.toUpperCase() })}
                  />
                  <Input
                    placeholder="Name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  />
                  <Select
                    value={newAsset.asset_class}
                    onValueChange={(value) => setNewAsset({ ...newAsset, asset_class: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Allocation %"
                    value={newAsset.allocation_percent || ""}
                    onChange={(e) => setNewAsset({ ...newAsset, allocation_percent: parseFloat(e.target.value) })}
                  />
                </div>
                <Button onClick={addAssetToPortfolio} variant="outline" size="sm" className="w-full mb-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>

                {newPortfolio.assets.length > 0 && (
                  <div className="space-y-2">
                    {newPortfolio.assets.map((asset, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 rounded p-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{asset.symbol} - {asset.name}</p>
                          <p className="text-sm text-slate-600">{asset.asset_class} • {asset.allocation_percent}%</p>
                        </div>
                        <Button
                          onClick={() => removeAsset(index)}
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-sm text-slate-600 text-right">
                      Total: {newPortfolio.assets.reduce((sum, a) => sum + a.allocation_percent, 0).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              <Button onClick={createPortfolio} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                Create Portfolio
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
                  onChange={(e) => setNewChallenge({ ...newChallenge, target_metric: parseFloat(e.target.value) })}
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
                    onChange={(e) => setCustomScenario({ ...customScenario, market_crash_percent: parseFloat(e.target.value) })}
                    placeholder="-30"
                  />
                </div>
                <div>
                  <Label>Interest Rate Change (%)</Label>
                  <Input
                    type="number"
                    value={customScenario.interest_rate_change}
                    onChange={(e) => setCustomScenario({ ...customScenario, interest_rate_change: parseFloat(e.target.value) })}
                    placeholder="+2"
                  />
                </div>
                <div>
                  <Label>Inflation Rate (%)</Label>
                  <Input
                    type="number"
                    value={customScenario.inflation_rate}
                    onChange={(e) => setCustomScenario({ ...customScenario, inflation_rate: parseFloat(e.target.value) })}
                    placeholder="8"
                  />
                </div>
                <div>
                  <Label>Duration (Months)</Label>
                  <Input
                    type="number"
                    value={customScenario.duration_months}
                    onChange={(e) => setCustomScenario({ ...customScenario, duration_months: parseInt(e.target.value) })}
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
