import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, LineChart, Brain, Target, Shield, Zap, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      window.location.href = createPageUrl("Dashboard");
    } else {
      base44.auth.redirectToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 px-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 flex-shrink-0"
              >
                <TrendingUp className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
              </motion.div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white drop-shadow-2xl text-center sm:text-left">
                StockSignal
              </h1>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Master Investing with AI-Powered Intelligence
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Transform your investment journey with cutting-edge AI analysis, risk-free paper trading, 
              and real-time market insights. Build wealth confidently with data-driven decisions.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center items-center"
            >
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-xl px-12 py-8 rounded-2xl shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:scale-105 font-bold"
              >
                Start Learning Free
                <TrendingUp className="w-6 h-6 ml-2" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20"
            >
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">500+</div>
                <div className="text-slate-400 text-sm md:text-base">Stocks & ETFs</div>
              </div>
              <div className="text-center border-l border-r border-slate-700">
                <div className="text-4xl md:text-5xl font-bold text-indigo-400 mb-2">AI</div>
                <div className="text-slate-400 text-sm md:text-base">Powered Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">Real-Time</div>
                <div className="text-slate-400 text-sm md:text-base">Market Data</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-center text-white mb-6">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16 max-w-3xl mx-auto">
            Professional-grade tools and insights designed to help you make smarter investment decisions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Brain, title: "AI-Powered Analysis", desc: "Advanced algorithms analyze market trends, company valuations, and risk factors to deliver actionable investment insights.", gradient: "from-blue-500 to-indigo-600" },
            { icon: TrendingUp, title: "Risk-Free Paper Trading", desc: "Practice trading strategies with virtual money. Learn, experiment, and master the markets without financial risk.", gradient: "from-emerald-500 to-teal-600" },
            { icon: LineChart, title: "Real-Time Market Data", desc: "Live quotes, charts, and analytics powered by Yahoo Finance. Stay ahead with up-to-the-second market information.", gradient: "from-purple-500 to-pink-600" },
            { icon: Target, title: "Smart Goal Planning", desc: "Set financial milestones and receive personalized portfolio recommendations to achieve your investment objectives.", gradient: "from-orange-500 to-red-600" },
            { icon: Shield, title: "Advanced Risk Analysis", desc: "Comprehensive portfolio health checks, volatility metrics, diversification scores, and behavioral bias detection.", gradient: "from-cyan-500 to-blue-600" },
            { icon: Zap, title: "Daily Market Insights", desc: "AI-generated market sentiment, sector performance analysis, and economic indicators delivered fresh every day.", gradient: "from-yellow-500 to-orange-600" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/30 transition-all h-full hover:shadow-2xl hover:shadow-blue-500/20">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-xl py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">Why Choose StockSignal?</h2>
            <p className="text-xl text-slate-300">The most comprehensive investment learning platform</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Learn investing without risking real money",
              "AI analyzes thousands of data points instantly",
              "Build portfolios aligned with your goals",
              "Track performance with professional metrics",
              "Understand risks before you invest",
              "Stay updated with daily market insights"
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10"
              >
                <CheckCircle className="w-7 h-7 text-green-400 flex-shrink-0" />
                <span className="text-lg text-white">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 animate-pulse"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center px-6 sm:px-8 relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Investing?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
            Join thousands learning to invest smarter with AI-powered insights and risk-free practice trading.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-base sm:text-lg md:text-2xl px-6 sm:px-10 md:px-14 py-6 sm:py-8 md:py-10 rounded-2xl shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:scale-105 font-bold w-full sm:w-auto max-w-full"
          >
            <span className="truncate">Start Your Journey Free</span>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ml-2 sm:ml-3 flex-shrink-0" />
          </Button>
          <p className="text-slate-300 mt-6 text-sm sm:text-base md:text-lg px-4">No credit card required • Get started in 30 seconds</p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
