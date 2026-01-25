import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { LayoutDashboard, Building2, LineChart, Briefcase, TrendingUp, Bell, BarChart3, Target, Brain, Heart, DollarSign, GitBranch, ArrowLeftRight, Trophy, FlaskConical, Newspaper, User, LogOut, LogIn, Mail, BookOpen } from "lucide-react";
import { getCurrentUser, signOut } from 'aws-amplify/auth';

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Practice Simulator", url: "/practice-trading", icon: TrendingUp },
  { title: "Browse Investments", url: "/companies", icon: Building2 },
  { title: "Index Funds", url: "/index-funds", icon: BarChart3 },
  { title: "AI Analysis", url: "/analysis", icon: LineChart },
  { title: "My Portfolio", url: "/holdings", icon: Briefcase },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Goal Intelligence", url: "/goal-intelligence", icon: Target },
  { title: "Investor IQ", url: "/investor-score", icon: Brain },
  { title: "Health Monitor", url: "/portfolio-health", icon: Heart },
  { title: "Cash Intelligence", url: "/cash-intelligence", icon: DollarSign },
  { title: "Shadow Portfolios", url: "/shadow-portfolios", icon: GitBranch },
  { title: "Challenges", url: "/challenges", icon: Trophy },
  { title: "Simulation Lab", url: "/simulation-lab", icon: FlaskConical },
  { title: "Market Insights", url: "/market-insights", icon: Newspaper },
  { title: "Platform Philosophy", url: "/platform-philosophy", icon: BookOpen },
  { title: "Notification Settings", url: "/notification-settings", icon: Bell },
  { title: "Contact Support", url: "/contact-support", icon: Mail },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
      if (!isHomePage) {
        window.location.href = '/home';
      }
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    window.location.href = '/home';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  if (isHomePage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/home';
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">StockSignal</h2>
                <p className="text-xs text-slate-500">Investment Platform</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                  location.pathname === item.url
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            {user && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-700">{user.attributes?.email}</span>
                </div>
                <button onClick={handleLogout} className="text-rose-600 hover:text-rose-700">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="p-4 md:p-8">{children}</main>

        <footer className="bg-slate-900 text-white p-6 m-6 rounded-2xl">
          <div className="text-center">
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} StockSignal - Investment Learning Platform</p>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <Link to="/terms-of-service" className="text-slate-400 hover:text-white">Terms</Link>
              <Link to="/privacy-policy" className="text-slate-400 hover:text-white">Privacy</Link>
              <Link to="/disclaimer" className="text-slate-400 hover:text-white">Disclaimer</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
