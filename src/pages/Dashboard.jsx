import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, TrendingUp, Building2, Target, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import InvestmentDisclaimer from "@/components/legal/InvestmentDisclaimer";
import WelcomeModal from "@/components/tutorial/WelcomeModal";
import TutorialOverlay from "@/components/tutorial/TutorialOverlay";
import { dashboardSteps } from "@/components/tutorial/tutorialSteps";

export default function Dashboard() {
  const [analyses, setAnalyses] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    checkFirstVisit();
    loadDashboardData();
  }, []);

  const checkFirstVisit = () => {
    const hasVisited = localStorage.getItem('stocksignal_tutorial_completed');
    if (!hasVisited) {
      setShowWelcome(true);
    }
  };

  const handleStartTutorial = () => {
    setShowTutorial(true);
  };

  const handleSkipTutorial = () => {
    localStorage.setItem('stocksignal_tutorial_completed', 'true');
  };

  const handleCompleteTutorial = () => {
    localStorage.setItem('stocksignal_tutorial_completed', 'true');
  };

  const loadDashboardData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await awsApi.getUserDashboardData();
      
      if (response?.success && response?.data) {
        const dashboardData = response.data;
        setAnalyses(dashboardData.recentAnalyses || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      {showWelcome && (
        <WelcomeModal
          onStart={handleStartTutorial}
          onSkip={handleSkipTutorial}
        />
      )}

      {showTutorial && (
        <TutorialOverlay
          steps={dashboardSteps}
          onComplete={handleCompleteTutorial}
          onSkip={handleSkipTutorial}
          currentPage="dashboard"
        />
      )}

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 md:mb-3">
            Welcome to StockSignal
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-slate-600">
            AI-powered investment analysis with live market data
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* INDUSTRIAL DISCLAIMER PROTOCOL */}
          <Card className="border-t-4 border-t-amber-500 border-x border-b border-slate-200 shadow-2xl bg-white overflow-hidden rounded-none">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* STATUS INDICATOR */}
                <div className="bg-slate-900 text-white p-6 md:w-64 flex flex-col justify-center items-center text-center space-y-3 border-r border-slate-800">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border border-amber-500/30 flex items-center justify-center animate-pulse">
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">Classification</h3>
                    <p className="text-lg font-mono font-bold text-white tracking-tighter uppercase">Non-Commercial</p>
                  </div>
                </div>

                {/* DISCLAIMER LOG */}
                <div className="flex-1 p-6 flex items-center bg-slate-50/50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">Edu-Sandbox</span>
                      <div className="h-[1px] w-12 bg-slate-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Educational Platform Only</p>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                      <span className="font-bold text-slate-900 uppercase tracking-tight">System Notice:</span> This platform is a portfolio management and financial analytics tool developed solely for <span className="text-slate-900 font-bold underline decoration-amber-500/50 italic">educational, research, and demonstration purposes</span>. It is not intended for commercial use, investment advice, or monetary transactions. All analyses and simulations are provided for learning and academic exploration.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {portfolioSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {portfolioSummary.totalValue && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-slate-600 mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">${portfolioSummary.totalValue.toLocaleString()}</p>
                    </div>
                  )}
                  {portfolioSummary.totalGain !== undefined && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-slate-600 mb-1">Total Gain/Loss</p>
                      <p className={`text-2xl font-bold ${portfolioSummary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {portfolioSummary.totalGain >= 0 ? '+' : ''}{portfolioSummary.totalGain.toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {portfolioSummary.holdingsCount !== undefined && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-slate-600 mb-1">Holdings</p>
                      <p className="text-2xl font-bold text-slate-900">{portfolioSummary.holdingsCount}</p>
                    </div>
                  )}
                  {portfolioSummary.lastUpdated && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-slate-600 mb-1">Last Updated</p>
                      <p className="text-sm font-semibold text-slate-900">{format(new Date(portfolioSummary.lastUpdated), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* INDUSTRIAL NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Browse Investments", sub: "Select stocks and index funds for analysis", icon: <Building2 className="w-5 h-5 text-blue-400" />, link: "Companies", color: "border-t-blue-500" },
            { title: "AI Analysis", sub: "Get intelligent investment recommendations", icon: <LineChart className="w-5 h-5 text-purple-400" />, link: "Analysis", color: "border-t-purple-500" },
            { title: "My Portfolio", sub: "Track your current investments", icon: <Target className="w-5 h-5 text-emerald-400" />, link: "Holdings", color: "border-t-emerald-500" }
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 2) }} className="h-full">
              <Link to={createPageUrl(item.link)} className="h-full block group">
                <Card className={`h-full border-t-4 ${item.color} border-x border-b border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-none bg-white overflow-hidden relative flex flex-col`}>
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* TOP STATUS BAR */}
                    <div className="bg-slate-900 py-3 px-6 flex items-center justify-between border-b border-slate-800">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">System Link: 0{i + 1}</span>
                      {item.icon}
                    </div>
                    
                    {/* CONTENT BODY */}
                    <div className="p-8 flex-1 bg-slate-50/30 group-hover:bg-white transition-colors">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {item.sub}
                      </p>
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="px-6 py-3 bg-slate-100/50 border-t border-slate-200 flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Execute Protocol</span>
                      <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-blue-500 group-hover:animate-ping transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

       {/* INDUSTRIAL ANALYSES LOG */}
        <Card className="border-2 border-slate-200 shadow-xl bg-white overflow-hidden rounded-none">
          <CardHeader className="bg-slate-900 text-white rounded-none border-b border-slate-800 py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Recent Analyses: Data Archives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analyses.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300 opacity-40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 mb-2">No Historical Logs Found</h3>
                <p className="text-[11px] font-mono text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed uppercase">System awaiting first data entry point. All AI simulations will be archived here.</p>
                <Link to={createPageUrl("Companies")}>
                  <Button className="bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-[0.2em] px-8 h-10 hover:bg-black transition-all border-b-2 border-blue-600 shadow-lg">
                    Initialize First Analysis
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-200">
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-6 text-left border-r border-slate-200 text-slate-500">Asset Cluster</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Allocation (USD)</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Timestamp</th>
                      <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-6 text-center text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {analyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-blue-50/40 transition-colors font-mono text-[11px] group">
                        <td className="py-4 px-6 font-bold text-slate-900 border-r border-slate-100 truncate max-w-[200px] uppercase tracking-tighter">
                          {(analysis.selectedCompanies || []).join(', ')}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100 font-bold">
                          ${(analysis.totalInvestment || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-500 border-r border-slate-100">
                          {format(new Date(analysis.analysisDate), 'MMM d, yyyy')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Link to={`${createPageUrl("Analysis")}?id=${analysis.id}`}>
                            <Button variant="outline" size="sm" className="h-7 rounded-none border-slate-300 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                              View Report
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
