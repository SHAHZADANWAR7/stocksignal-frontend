import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard,
  Building2,
  LineChart,
  Briefcase,
  TrendingUp,
  Bell,
  BarChart3,
  Target,
  Brain,
  Heart,
  DollarSign,
  GitBranch,
  ArrowLeftRight,
  Trophy,
  FlaskConical,
  Newspaper,
  User,
  LogOut,
  Mail,
  BookOpen
} from "lucide-react";
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

const PUBLIC_PAGES = [
  "Home",
  "Login",
  "TermsOfService",
  "PrivacyPolicy",
  "Disclaimer",
  "ContactSupport"
];

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Practice Simulator", url: createPageUrl("PracticeTrading"), icon: TrendingUp },
  { title: "Browse Investments", url: createPageUrl("Companies"), icon: Building2 },
  { title: "Index Funds", url: createPageUrl("IndexFunds"), icon: BarChart3 },
  { title: "AI Analysis", url: createPageUrl("Analysis"), icon: LineChart },
  { title: "My Portfolio", url: createPageUrl("Holdings"), icon: Briefcase },
  { title: "Transactions", url: createPageUrl("Transactions"), icon: ArrowLeftRight },
  { title: "Goal Intelligence", url: createPageUrl("GoalIntelligence"), icon: Target },
  { title: "Investor IQ", url: createPageUrl("InvestorScore"), icon: Brain },
  { title: "Health Monitor", url: createPageUrl("PortfolioHealth"), icon: Heart },
  { title: "Cash Intelligence", url: createPageUrl("CashIntelligence"), icon: DollarSign },
  { title: "Shadow Portfolios", url: createPageUrl("ShadowPortfolios"), icon: GitBranch },
  { title: "Challenges", url: createPageUrl("Challenges"), icon: Trophy },
  { title: "Simulation Lab", url: createPageUrl("SimulationLab"), icon: FlaskConical },
  { title: "Market Insights", url: createPageUrl("MarketInsights"), icon: Newspaper },
  { title: "Platform Philosophy", url: createPageUrl("PlatformPhilosophy"), icon: BookOpen },
  { title: "Notification Settings", url: createPageUrl("NotificationSettings"), icon: Bell },
  { title: "Contact Support", url: createPageUrl("ContactSupport"), icon: Mail }
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPublicPage = PUBLIC_PAGES.some((page) => {
    const pageUrl = createPageUrl(page);
    return (
      location.pathname === pageUrl ||
      location.pathname === `/${page.toLowerCase()}` ||
      location.pathname === "/" ||
      location.pathname === "/home"
    );
  });

  console.log("[Layout] Current pathname:", location.pathname);
  console.log("[Layout] Is public page:", isPublicPage);

  useEffect(() => {
    console.log("[Layout] useEffect - initAuth starting");
    let unsubscribe;

    const initAuth = async () => {
      console.log("[Layout] initAuth - Calling getCurrentUser()");
      try {
        const currentUser = await getCurrentUser();
        console.log("[Layout] initAuth - getCurrentUser SUCCESS:", currentUser);
        setUser(currentUser);
      } catch (error) {
        console.log("[Layout] initAuth - getCurrentUser FAILED:", error);
        setUser(null);
      } finally {
        console.log("[Layout] initAuth - Setting isLoading to false");
        setIsLoading(false);
      }
    };

    initAuth();

    console.log("[Layout] Setting up Hub.listen for auth events");
    unsubscribe = Hub.listen("auth", ({ payload }) => {
      console.log("[Layout] Hub.listen - Auth event received:", payload.event);
      if (payload.event === "signIn") {
        console.log("[Layout] Hub.listen - signIn event, fetching current user");
        getCurrentUser()
          .then((currentUser) => {
            console.log("[Layout] Hub.listen - getCurrentUser after signIn SUCCESS:", currentUser);
            setUser(currentUser);
          })
          .catch((error) => {
            console.log("[Layout] Hub.listen - getCurrentUser after signIn FAILED:", error);
            setUser(null);
          });
      }
      if (payload.event === "signOut") {
        console.log("[Layout] Hub.listen - signOut event");
        setUser(null);
      }
    });

    return () => {
      console.log("[Layout] Cleanup - Unsubscribing from Hub");
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("[Layout] Redirect check - isLoading:", isLoading, "user:", !!user, "isPublicPage:", isPublicPage);
    if (!isLoading && !user && !isPublicPage) {
      const redirectUrl = encodeURIComponent(location.pathname);
      console.log("[Layout] REDIRECTING to Login with redirect:", redirectUrl);
      navigate(`${createPageUrl("Login")}?redirect=${redirectUrl}`, { replace: true });
    }
  }, [isLoading, user, isPublicPage, location.pathname, navigate]);

  const handleLogout = async () => {
    console.log("[Layout] handleLogout - Starting logout");
    try {
      await signOut();
      console.log("[Layout] handleLogout - signOut SUCCESS");
      setUser(null);
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("[Layout] handleLogout - signOut ERROR:", error);
      navigate(createPageUrl("Home"));
    }
  };

  if (isPublicPage) {
    console.log("[Layout] Rendering public page");
    return <>{children}</>;
  }

  if (isLoading) {
    console.log("[Layout] Rendering loading screen");
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
    console.log("[Layout] No user and not loading - should redirect (returning null)");
    return null;
  }

  console.log("[Layout] Rendering authenticated layout for user:", user.attributes?.name || user.attributes?.email);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-700">
                  {user?.attributes?.name || user?.attributes?.email || "User"}
                </span>
              </div>
              <button onClick={handleLogout} className="text-rose-600 hover:text-rose-700">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="p-4 md:p-8">{children}</main>

        <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700/50 backdrop-blur-xl rounded-3xl mx-6 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-indigo-600/5"></div>

          <div className="relative max-w-full mx-auto px-6 py-12">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Branding */}
              <div className="text-center md:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-3 justify-center md:justify-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      StockSignal
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Investment Learning Platform</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                  Educational platform for learning investment strategies with AI-powered simulations
                </p>
              </div>

              {/* Support & Contact */}
              <div className="text-center border-l border-r border-slate-700/50 py-4 px-6">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-semibold">
                  Support & Contact
                </p>
                <h4 className="text-xl font-bold text-white mb-1">
                  StockSignal Team
                </h4>
                <p className="text-slate-300 text-sm mb-4">
                  We're here to help with your investment learning journey
                </p>
                <Link 
                  to={createPageUrl("ContactSupport")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </Link>
              </div>

              {/* Legal & Links */}
              <div className="text-center md:text-right">
                <p className="text-slate-400 text-sm mb-3">
                  © {new Date().getFullYear()} StockSignal
                </p>
                <p className="text-slate-500 text-xs mb-4">
                  All rights reserved
                </p>
                <div className="flex flex-wrap justify-center md:justify-end gap-4 text-xs">
                  <Link to={createPageUrl("TermsOfService")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Terms of Service
                  </Link>
                  <span className="text-slate-700">•</span>
                  <Link to={createPageUrl("PrivacyPolicy")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Privacy Policy
                  </Link>
                  <span className="text-slate-700">•</span>
                  <Link to={createPageUrl("Disclaimer")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Legal Disclaimer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
