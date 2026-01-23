import React from "react";
import { TrendingUp, Building2, LineChart, Target, Briefcase } from "lucide-react";

export const dashboardSteps = [
  {
    title: "Welcome to Your Dashboard",
    description: "This is your home base. From here, you can access all features: browse investments, run AI analysis, track your portfolio, and more.",
    icon: <TrendingUp className="w-5 h-5 text-white" />,
    position: { top: '20%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "Browse Investments",
    description: "Click here to explore stocks and index funds. Select companies you're interested in to get AI-powered analysis.",
    icon: <Building2 className="w-5 h-5 text-white" />,
    position: { top: '35%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "AI Analysis",
    description: "Get intelligent investment recommendations. Select stocks, set your investment amount, and let AI build an optimized portfolio for you.",
    icon: <LineChart className="w-5 h-5 text-white" />,
    position: { top: '35%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "Track Your Portfolio",
    description: "View your paper trading positions and performance. Practice trading with virtual money before investing real funds.",
    icon: <Briefcase className="w-5 h-5 text-white" />,
    position: { top: '35%', left: '50%', transform: 'translate(-50%, 0)' }
  }
];

export const companiesSteps = [
  {
    title: "Search & Add Investments",
    description: "Enter any stock ticker (like AAPL, TSLA, MSFT) to add it to your list. We'll fetch real data from financial markets.",
    icon: <Building2 className="w-5 h-5 text-white" />,
    position: { top: '25%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "Quick Stock Analysis",
    description: "Use this tool to get instant AI analysis of any stock, plus discover better alternatives and similar companies.",
    icon: <LineChart className="w-5 h-5 text-white" />,
    position: { top: '30%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "Select for Analysis",
    description: "Click checkboxes to select multiple companies, then hit 'Analyze Portfolio' to get AI recommendations for optimal allocation.",
    icon: <Target className="w-5 h-5 text-white" />,
    position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
];

export const analysisSteps = [
  {
    title: "Set Your Investment Parameters",
    description: "Enter how much you want to invest and your financial goals. This helps AI tailor recommendations to your specific situation.",
    icon: <Target className="w-5 h-5 text-white" />,
    position: { top: '25%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "AI-Powered Strategies",
    description: "Review three AI-generated strategies: Optimal (balanced), Min Variance (safest), and Max Return (aggressive). Each is optimized differently.",
    icon: <LineChart className="w-5 h-5 text-white" />,
    position: { top: '40%', left: '50%', transform: 'translate(-50%, 0)' }
  },
  {
    title: "Execute Trades",
    description: "Once you've chosen a strategy, execute paper trades to practice without risking real money. Track your performance over time.",
    icon: <TrendingUp className="w-5 h-5 text-white" />,
    position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
];
