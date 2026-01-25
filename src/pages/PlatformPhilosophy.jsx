import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Shield, Brain, Users, Lightbulb } from "lucide-react";

export default function PlatformPhilosophy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">Platform Philosophy</h1>
        <p className="text-xl text-slate-600 mb-12">
          Our mission is to democratize investment education through AI-powered learning and simulation
        </p>

        <div className="space-y-8">
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600" />
                Education First
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                StockSignal is an <strong>educational platform</strong>, not a brokerage or financial advisor. 
                We provide tools, simulations, and AI-powered insights to help you learn investment concepts.
              </p>
              <p>
                All recommendations, analyses, and projections are for <strong>educational purposes only</strong> 
                and should not be considered financial advice.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-green-600" />
                Practice Without Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                Our paper trading simulator allows you to test investment strategies with <strong>virtual money</strong>. 
                Experience market dynamics, test theories, and learn from mistakes without financial risk.
              </p>
              <p>
                Practice builds confidence and competence before real-world investing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                AI-Powered Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                We leverage artificial intelligence to provide <strong>personalized insights</strong>, 
                portfolio analysis, risk assessment, and scenario simulations.
              </p>
              <p>
                AI accelerates learning by showing you patterns, risks, and opportunities you might miss on your own.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
                Transparency & Honesty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                We're transparent about limitations, assumptions, and uncertainty in all projections. 
                <strong>Past performance doesn't guarantee future results.</strong>
              </p>
              <p>
                Markets are unpredictable. We teach you to manage risk, not eliminate it.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-amber-600" />
                Critical Thinking Over Hype
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                We emphasize <strong>long-term thinking</strong>, diversification, and disciplined strategy 
                over market timing and speculation.
              </p>
              <p>
                Successful investing is about behavior, patience, and learning from data—not chasing trends.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-rose-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-8 h-8 text-rose-600" />
                Community Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                Through challenges, simulations, and shared insights, we foster a <strong>community of learners</strong> 
                helping each other improve investment skills.
              </p>
              <p>
                Learning is better together. Share strategies, compare results, and grow collectively.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Commitment</h2>
          <p className="text-slate-700 leading-relaxed">
            StockSignal exists to empower individuals with knowledge, tools, and confidence to make informed investment decisions. 
            We believe financial literacy should be accessible, engaging, and grounded in real data and AI-driven insights. 
            Our platform is designed to teach, not to sell products or push specific investments. 
            Your learning journey is our priority.
          </p>
        </div>
      </div>
    </div>
  );
}
