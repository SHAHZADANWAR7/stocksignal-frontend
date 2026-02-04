import React, { useState, useEffect } from "react";
import { awsApi } from "@/components/utils/api/awsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, TrendingUp, Building2, Target } from "lucide-react";
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

  // Transform Lambda response fields from snake_case to camelCase
  const transformDashboardData = (data) => {
    return {
      portfolioSummary: data.portfolio_summary ? {
        totalValue: data.portfolio_summary.total_value,
        totalGain: data.portfolio_summary.total_gain,
        holdingsCount: data.portfolio_summary.holdings_count,
        lastUpdated: data.portfolio_summary.last_updated
      } : null,
      recentAnalyses: (data.recent_analyses || []).map(analysis => ({
        id: analysis.id,
        selected_companies: analysis.selected_companies,
        total_investment: analysis.total_investment,
        analysis_date: analysis.analysis_date
      }))
    };
  };

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
      // awsApi methods auto-extract cognito_sub and user_email from JWT
      const portfolio = await awsApi.getPortfolio();
      const analyses = await awsApi.getPortfolioAnalyses();
      
      if (portfolio || analyses) {
        const transformed = transformDashboardData({
          portfolio_summary: portfolio?.summary || null,
          recent_analyses: analyses || []
        });
        setAnalyses(transformed.recentAnalyses || []);
        setPortfolioSummary(transformed.portfolioSummary || null);
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
          <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Educational Platform Only</h3>
                  <p className="text-slate-700 leading-relaxed">
                    This platform is a portfolio management and financial analytics tool developed solely for <strong>educational, research, and demonstration purposes</strong>. 
                    It is not intended for commercial use, investment advice, or monetary transactions. All analyses and simulations are provided for learning, portfolio management practice, and academic exploration.
                  </p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
            <Link to={createPageUrl("Companies")} className="h-full block">
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl group rounded-3xl h-full">
                <CardContent className="p-6 md:p-8 text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Building2 className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-2">Browse Investments</h3>
                  <p className="text-sm md:text-base text-slate-600">Select stocks and index funds for analysis</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
            <Link to={createPageUrl("Analysis")} className="h-full block">
              <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl group rounded-3xl h-full">
                <CardContent className="p-6 md:p-8 text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <LineChart className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-2">AI Analysis</h3>
                  <p className="text-sm md:text-base text-slate-600">Get intelligent investment recommendations</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="h-full">
            <Link to={createPageUrl("Holdings")} className="h-full block">
              <Card className="border-2 border-emerald-200 hover:border-emerald-400 transition-all cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-xl group rounded-3xl h-full">
                <CardContent className="p-6 md:p-8 text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-2">My Portfolio</h3>
                  <p className="text-sm md:text-base text-slate-600">Track your current investments</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        <Card className="border-2 border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No analyses yet</h3>
                <p className="text-slate-500 mb-6">Start by browsing investments and running your first AI analysis</p>
                <Link to={createPageUrl("Companies")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <Link key={analysis.id} to={`${createPageUrl("Analysis")}?id=${analysis.id}`}>
                    <Card className="border border-slate-200 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 rounded-2xl">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 mb-2 break-words">
                              {(analysis.selected_companies || []).join(', ')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs md:text-sm text-slate-600">
                              <span className="break-words">Investment: ${(analysis.total_investment || 0).toLocaleString()}</span>
                              <span className="break-words">Date: {format(new Date(analysis.analysis_date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
