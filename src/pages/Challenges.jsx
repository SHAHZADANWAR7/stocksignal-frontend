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
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Zap,
  Award,
  Crown,
  Medal,
  Star,
  Flame,
  DollarSign,
  BarChart3,
  Clock,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";

export default function Challenges() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [aiStrategy, setAiStrategy] = useState(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [lastSyncTimes, setLastSyncTimes] = useState({});

  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    challenge_type: "growth",
    starting_capital: 10000,
    start_date: "",
    end_date: "",
    prize_description: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await awsApi.getChallenges();
      setUser(data.user);
      setChallenges(data.challenges || []);
      setMyChallenges(data.my_challenges || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const loadLeaderboard = async (challengeId) => {
    const lastSync = lastSyncTimes[challengeId];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (!lastSync || (now - lastSync) > oneHour) {
      await syncParticipantPortfolio(challengeId, true);
    }
    
    const data = await awsApi.getChallengeLeaderboard(challengeId);
    const sorted = (data.participants || []).sort((a, b) => (b.return_percent || 0) - (a.return_percent || 0));
    const ranked = sorted.map((p, index) => ({ ...p, rank: index + 1 }));
    
    setLeaderboard(ranked);
  };

  const syncParticipantPortfolio = async (challengeId, silent = false) => {
    try {
      await awsApi.syncChallengePortfolios(challengeId);
      setLastSyncTimes(prev => ({ ...prev, [challengeId]: Date.now() }));
      
      if (!silent) {
        alert("✅ Portfolios synced and badges awarded!");
      }
    } catch (error) {
      console.error("Error syncing portfolios:", error);
      if (!silent) {
        alert("Error syncing portfolios. Please try again.");
      }
    }
  };

  const handleJoinChallenge = async (challenge) => {
    setIsJoining(true);
    try {
      await awsApi.joinChallenge(challenge.id);
      alert("You've joined the challenge! Good luck! 🎉");
      loadData();
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Error joining challenge. Please try again.");
    }
    setIsJoining(false);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      await awsApi.createChallenge(newChallenge);
      alert("Challenge created successfully! 🚀");
      setShowCreateForm(false);
      setNewChallenge({
        title: "",
        description: "",
        challenge_type: "growth",
        starting_capital: 10000,
        start_date: "",
        end_date: "",
        prize_description: ""
      });
      loadData();
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Error creating challenge. Please try again.");
    }
  };

  const generateAIStrategy = async (challenge) => {
    setIsGeneratingStrategy(true);
    try {
      const prompt = `Generate a winning strategy for this investment challenge:

Challenge: ${challenge.title}
Type: ${challenge.challenge_type}
Starting Capital: $${challenge.starting_capital.toLocaleString()}
Duration: ${format(new Date(challenge.start_date), 'MMM d')} - ${format(new Date(challenge.end_date), 'MMM d, yyyy')}

Provide:
1. Overall strategy approach
2. 3-5 specific stock/ETF recommendations with reasoning
3. Risk management tips
4. Expected returns range
5. Key metrics to track

Be specific and actionable.`;

      const strategy = await awsApi.generateChallengeStrategy(prompt);
      setAiStrategy({ challenge: challenge.id, content: strategy });
    } catch (error) {
      console.error("Error generating strategy:", error);
      alert("Error generating strategy. Please try again.");
    }
    setIsGeneratingStrategy(false);
  };

  const getChallengeStatus = (challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);

    if (isBefore(now, start)) return { status: "upcoming", label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (isAfter(now, end)) return { status: "completed", label: "Completed", color: "bg-gray-100 text-gray-700" };
    return { status: "active", label: "Active Now", color: "bg-emerald-100 text-emerald-700" };
  };

  const getChallengeIcon = (type) => {
    switch(type) {
      case "growth": return TrendingUp;
      case "returns": return DollarSign;
      case "consistency": return BarChart3;
      case "risk_adjusted": return Target;
      case "sector_specific": return Sparkles;
      default: return Trophy;
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Crown, color: "text-yellow-600", bg: "bg-yellow-100" };
    if (rank === 2) return { icon: Medal, color: "text-gray-400", bg: "bg-gray-100" };
    if (rank === 3) return { icon: Medal, color: "text-amber-600", bg: "bg-amber-100" };
    return { icon: Star, color: "text-blue-600", bg: "bg-blue-100" };
  };

  const badgeDefinitions = [
    { id: "first_trade", name: "First Trade", icon: Zap, description: "Made your first trade" },
    { id: "hot_streak", name: "Hot Streak", icon: Flame, description: "3 profitable trades in a row" },
    { id: "diamond_hands", name: "Diamond Hands", icon: Crown, description: "Held position through 10%+ dip" },
    { id: "early_bird", name: "Early Bird", icon: Sparkles, description: "Joined challenge within 24 hours" },
    { id: "top_performer", name: "Top Performer", icon: Trophy, description: "Ranked in top 10%" }
  ];

  const activeChallenges = challenges.filter(c => getChallengeStatus(c).status === "active");
  const upcomingChallenges = challenges.filter(c => getChallengeStatus(c).status === "upcoming");
  const completedChallenges = challenges.filter(c => getChallengeStatus(c).status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 md:mb-3">
                🏆 Investment Challenges
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-slate-600">
                Compete with others, level up your skills, and win recognition
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-sm md:text-base self-start md:self-auto"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Create Challenge
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4 md:p-6 text-center">
                <Trophy className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 md:mb-2 text-purple-600" />
                <p className="text-2xl md:text-3xl font-bold text-slate-900 break-words">{myChallenges.length}</p>
                <p className="text-xs md:text-sm text-slate-600">Active Challenges</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-6 text-center">
                <Award className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <p className="text-3xl font-bold text-slate-900">
                  {myChallenges.filter(c => c.badges_earned?.length > 0).reduce((acc, c) => acc + c.badges_earned.length, 0)}
                </p>
                <p className="text-sm text-slate-600">Badges Earned</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-6 text-center">
                <Crown className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                <p className="text-3xl font-bold text-slate-900">
                  {myChallenges.filter(c => c.rank && c.rank <= 3).length}
                </p>
                <p className="text-sm text-slate-600">Top 3 Finishes</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                <p className="text-3xl font-bold text-slate-900">{challenges.reduce((acc, c) => acc + (c.participant_count || 0), 0)}</p>
                <p className="text-sm text-slate-600">Total Competitors</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="border-2 border-purple-300 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="text-2xl">Create New Challenge</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleCreateChallenge} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Challenge Title</Label>
                        <Input
                          value={newChallenge.title}
                          onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                          placeholder="e.g., Grow $10k in 3 Months"
                          required
                        />
                      </div>
                      <div>
                        <Label>Starting Capital</Label>
                        <Input
                          type="number"
                          value={newChallenge.starting_capital}
                          onChange={(e) => setNewChallenge({ ...newChallenge, starting_capital: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newChallenge.description}
                        onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                        placeholder="Challenge rules and objectives"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Challenge Type</Label>
                        <select
                          className="w-full h-10 px-3 border border-slate-300 rounded-md"
                          value={newChallenge.challenge_type}
                          onChange={(e) => setNewChallenge({ ...newChallenge, challenge_type: e.target.value })}
                        >
                          <option value="growth">Growth</option>
                          <option value="returns">Returns</option>
                          <option value="consistency">Consistency</option>
                          <option value="risk_adjusted">Risk Adjusted</option>
                          <option value="sector_specific">Sector Specific</option>
                        </select>
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newChallenge.start_date}
                          onChange={(e) => setNewChallenge({ ...newChallenge, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={newChallenge.end_date}
                          onChange={(e) => setNewChallenge({ ...newChallenge, end_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Prize/Recognition</Label>
                      <Input
                        value={newChallenge.prize_description}
                        onChange={(e) => setNewChallenge({ ...newChallenge, prize_description: e.target.value })}
                        placeholder="e.g., Winner gets featured on leaderboard"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
                        Create Challenge
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue="active" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active ({activeChallenges.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingChallenges.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedChallenges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6 mt-6">
            {activeChallenges.length === 0 ? (
              <Card className="border-2 border-slate-200">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Challenges</h3>
                  <p className="text-slate-500 mb-4">Create a new challenge or wait for upcoming ones to start!</p>
                  <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    Create Challenge
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activeChallenges.map((challenge) => {
                  const Icon = getChallengeIcon(challenge.challenge_type);
                  const statusInfo = getChallengeStatus(challenge);
                  const isParticipating = myChallenges.some(mc => mc.challenge_id === challenge.id);
                  const myParticipation = myChallenges.find(mc => mc.challenge_id === challenge.id);
                  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-2 border-emerald-300 shadow-xl hover:shadow-2xl transition-shadow rounded-2xl h-full">
                        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-6 h-6" />
                                <CardTitle className="text-xl">{challenge.title}</CardTitle>
                              </div>
                              <p className="text-white/90 text-sm">{challenge.description}</p>
                            </div>
                            <Badge className={`${statusInfo.color} border-0 font-semibold`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Starting Capital</p>
                              <p className="text-lg font-bold text-slate-900">
                                ${challenge.starting_capital.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Participants</p>
                              <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {challenge.participant_count || 0}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>{daysLeft} days remaining</span>
                            <span className="mx-2">•</span>
                            <Calendar className="w-4 h-4" />
                            <span>Ends {format(new Date(challenge.end_date), 'MMM d')}</span>
                          </div>

                          {isParticipating && myParticipation && (
                            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-4">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-slate-700">Your Performance</p>
                                  <Badge className="bg-blue-600 text-white">
                                    Rank #{myParticipation.rank || "TBD"}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                  <div>
                                    <p className="text-xs text-slate-500">Starting</p>
                                    <p className="font-bold text-slate-900">${myParticipation.starting_value.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Current</p>
                                    <p className="font-bold text-slate-900">${myParticipation.current_value.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Return</p>
                                    <p className={`font-bold ${myParticipation.return_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {myParticipation.return_percent >= 0 ? '+' : ''}{myParticipation.return_percent?.toFixed(2)}%
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          <div className="flex gap-2">
                            {!isParticipating ? (
                              <Button
                                onClick={() => handleJoinChallenge(challenge)}
                                disabled={isJoining}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                              >
                                {isJoining ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Joining...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Join Challenge
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  setSelectedChallenge(challenge);
                                  loadLeaderboard(challenge.id);
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <Trophy className="w-4 h-4 mr-2" />
                                View Leaderboard
                              </Button>
                            )}
                            <Button
                              onClick={() => generateAIStrategy(challenge)}
                              disabled={isGeneratingStrategy}
                              variant="outline"
                              className="border-2 border-purple-300"
                            >
                              {isGeneratingStrategy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingChallenges.map((challenge) => {
                const Icon = getChallengeIcon(challenge.challenge_type);
                const daysUntilStart = differenceInDays(new Date(challenge.start_date), new Date());

                return (
                  <Card key={challenge.id} className="border-2 border-blue-200 shadow-lg rounded-2xl h-full">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6" />
                        <CardTitle>{challenge.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-slate-600 mb-4">{challenge.description}</p>
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <Badge className="bg-blue-100 text-blue-700">
                          Starts in {daysUntilStart} days
                        </Badge>
                        <Badge variant="outline">
                          ${challenge.starting_capital.toLocaleString()}
                        </Badge>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Register Interest
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {completedChallenges.map((challenge) => (
                <Card key={challenge.id} className="border-2 border-gray-200 shadow-lg rounded-2xl h-full">
                  <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-2xl">
                    <CardTitle>{challenge.title}</CardTitle>
                    <Badge className="bg-gray-100 text-gray-700 w-fit">Completed</Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-slate-600 mb-4">{challenge.description}</p>
                    <Button
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        loadLeaderboard(challenge.id);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      View Final Results
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <AnimatePresence>
          {aiStrategy && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="border-2 border-purple-300 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      AI-Generated Winning Strategy
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setAiStrategy(null)} className="text-white hover:bg-white/20">
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 whitespace-pre-line">{aiStrategy.content}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedChallenge && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedChallenge(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              >
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 sticky top-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Trophy className="w-8 h-8" />
                        Leaderboard
                      </h2>
                      <p className="text-white/90 mt-1">{selectedChallenge.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => syncParticipantPortfolio(selectedChallenge.id)}
                        className="text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sync All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChallenge(null)} className="text-white hover:bg-white/20">
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {leaderboard.map((participant, index) => {
                    const rankInfo = getRankBadge(participant.rank);
                    const RankIcon = rankInfo.icon;
                    const isCurrentUser = participant.user_email === user?.email;

                    return (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border-2 ${isCurrentUser ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 ${rankInfo.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <RankIcon className={`w-6 h-6 ${rankInfo.color}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-slate-900">
                                    {isCurrentUser ? "You" : `Investor ${participant.id.slice(0, 8)}`}
                                  </p>
                                  {isCurrentUser && (
                                    <Badge className="bg-blue-600 text-white text-xs">Your Position</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <span>Rank #{participant.rank}</span>
                                  <span>•</span>
                                  <span>{participant.trades_count || 0} trades</span>
                                  {participant.badges_earned?.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        {participant.badges_earned.length}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500 mb-1">Return</p>
                                <p className={`text-2xl font-bold ${participant.return_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {participant.return_percent >= 0 ? '+' : ''}{participant.return_percent?.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="border-2 border-amber-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Award className="w-7 h-7" />
              Achievement Badges
            </CardTitle>
            <p className="text-white/90 text-sm mt-2">Earn badges by reaching milestones and competing in challenges</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-5 gap-4">
              {badgeDefinitions.map((badge) => {
                const Icon = badge.icon;
                const earned = myChallenges.some(mc => mc.badges_earned?.includes(badge.id));

                return (
                  <Card key={badge.id} className={`border-2 rounded-xl h-full ${earned ? 'border-amber-300 bg-amber-50' : 'border-slate-200 opacity-50'}`}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${earned ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <Icon className={`w-8 h-8 ${earned ? 'text-amber-600' : 'text-slate-400'}`} />
                      </div>
                      <p className="font-bold text-sm text-slate-900 mb-1">{badge.name}</p>
                      <p className="text-xs text-slate-600">{badge.description}</p>
                      {earned && (
                        <Badge className="bg-amber-600 text-white mt-2 text-xs">Earned</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
