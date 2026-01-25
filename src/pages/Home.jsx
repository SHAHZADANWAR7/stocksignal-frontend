import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Target, Shield, Brain, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8">
              <TrendingUp className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              StockSignal
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl mx-auto">
              AI-Powered Investment Learning Platform
            </p>
            <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto">
              Master investment strategies through intelligent analysis, portfolio simulations, and risk assessment tools
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Powerful Learning Tools
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Goal Intelligence</h3>
              <p className="text-slate-300">
                Connect investments to life goals with AI-powered analysis and tracking
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20">
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">AI Analysis</h3>
              <p className="text-slate-300">
                Advanced portfolio optimization and risk assessment powered by AI
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Practice Trading</h3>
              <p className="text-slate-300">
                Paper trading simulator to practice strategies risk-free
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Portfolio Health</h3>
              <p className="text-slate-300">
                Real-time monitoring of diversification, risk, and performance metrics
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20">
            <CardContent className="p-8 text-center">
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Simulation Lab</h3>
              <p className="text-slate-300">
                Test strategies across market scenarios and stress conditions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Market Insights</h3>
              <p className="text-slate-300">
                Daily market analysis, news, and economic indicators
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Your Investment Learning Journey
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users mastering investment strategies
          </p>
          <Link to="/dashboard">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg shadow-xl">
              Launch Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
