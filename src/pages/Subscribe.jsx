import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Sparkles,
  Loader2,
  AlertCircle,
  Zap,
  Shield,
  BarChart3,
  Crown,
  Target,
  Brain,
  GitBranch,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export default function Subscribe() {
  const [stripeSubscription, setStripeSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);

  const handleUpgrade = async (priceId, planType) => {
    setUpgradingPlan(planType);
    
    try {
      const response = await awsApi.createCheckoutSession({
        priceId,
        mode: 'subscription'
      });
      
      if (response?.url) {
        window.top.location.href = response.url;
      } else {
        alert(`Error: No checkout URL received.`);
        setUpgradingPlan(null);
      }
    } catch (error) {
      alert(`Failed to start checkout: ${error.message || error.toString()}`);
      setUpgradingPlan(null);
    }
  };

  useEffect(() => {
    loadData();
    
    // Check for Stripe success/cancel
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 3000);
    }
    
    // Check if returning from login to complete checkout
    const checkoutPriceId = urlParams.get('checkout');
    if (checkoutPriceId) {
      const planType = checkoutPriceId.includes('yearly') ? 'yearly' : 'monthly';
      handleUpgrade(checkoutPriceId, planType);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await awsApi.checkSubscription();
      setStripeSubscription(data);
    } catch (error) {
      console.error("Error loading subscription data:", error);
    }
    setIsLoading(false);
  };

  const handleManageSubscription = async () => {
    try {
      const data = await awsApi.createPortalSession();
      if (data?.url) {
        window.top.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open subscription management. Please try again.");
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const showSuccess = urlParams.get('success') === 'true';
  const showCanceled = urlParams.get('canceled') === 'true';

  const freeFeatures = [
    { text: "7 AI analyses/week", icon: BarChart3 },
    { text: "Unlimited portfolio tracking", icon: TrendingUp },
    { text: "Basic health monitoring", icon: Shield },
    { text: "Practice trading", icon: Zap },
    { text: "Market insights", icon: Sparkles }
  ];

  const proFeatures = [
    { text: "Unlimited AI analyses", icon: BarChart3 },
    { text: "Black Swan stress tests", icon: AlertCircle },
    { text: "Shadow Portfolios", icon: GitBranch },
    { text: "Goal Intelligence", icon: Target },
    { text: "Investor IQ deep dive", icon: Brain },
    { text: "Advanced risk metrics", icon: Shield },
    { text: "Priority support", icon: Crown }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {showSuccess && (
          <Alert className="mb-8 border-2 border-emerald-300 bg-emerald-50">
            <Check className="w-5 h-5 text-emerald-600" />
            <AlertDescription className="text-emerald-900 font-semibold">
              🎉 Welcome to StockSignal Pro! Your subscription is now active.
            </AlertDescription>
          </Alert>
        )}

        {showCanceled && (
          <Alert className="mb-8 border-2 border-amber-300 bg-amber-50">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <AlertDescription className="text-amber-900">
              Checkout was canceled. No charges were made.
            </AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            Upgrade to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              StockSignal Pro
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Unlock unlimited AI analyses, advanced features, and premium investment tools
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 mb-4">
              <Crown className="w-4 h-4 mr-2" />
              StockSignal Pro
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Upgrade for Advanced Features
            </h2>
            <p className="text-lg text-slate-600">
              Unlock unlimited analyses, priority support, and premium tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-slate-300 shadow-xl flex flex-col">
              <CardHeader className="bg-gradient-to-br from-slate-100 to-slate-200 border-b border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl font-bold">Free</CardTitle>
                  <Badge className="bg-slate-700 text-white font-semibold">Starter</Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">$0</span>
                  <span className="text-slate-700">/forever</span>
                </div>
                <p className="text-sm text-slate-700 mt-1 font-semibold">Perfect to get started</p>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-1">
                <ul className="space-y-3 mb-6 flex-1">
                  {freeFeatures.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Icon className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4 text-center">
                  <Check className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900">Current Plan</p>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="border-2 border-blue-300 shadow-xl flex flex-col transform scale-105 z-10">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Monthly</CardTitle>
                  <div className="h-6"></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">$5.99</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 opacity-0">Placeholder</p>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-1">
                <ul className="space-y-3 mb-6 flex-1">
                  {proFeatures.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
                {!stripeSubscription?.isPro ? (
                  <Button
                    onClick={() => handleUpgrade('price_1SfwbTHLqtGKOUKDzGmtcQd7', 'monthly')}
                    disabled={upgradingPlan === 'monthly'}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {upgradingPlan === 'monthly' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upgrade to Monthly'}
                  </Button>
                ) : stripeSubscription.plan === 'monthly' ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
                      <Check className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-emerald-900">Current Plan</p>
                    </div>
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                      className="w-full border-2 border-slate-300 hover:bg-slate-50"
                    >
                      Manage Subscription
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-2 border-purple-300 shadow-xl flex flex-col">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">Yearly</CardTitle>
                    <Crown className="w-6 h-6 text-amber-500" />
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">
                    SAVE $11.89
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600">$59.99</span>
                  <span className="text-slate-600">/year</span>
                </div>
                <p className="text-sm text-purple-700 mt-1 font-semibold">Best value • 2 months free</p>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-1">
                <ul className="space-y-3 mb-6 flex-1">
                  {proFeatures.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
                {!stripeSubscription?.isPro ? (
                  <Button
                    onClick={() => handleUpgrade('price_1SfwbTHLqtGKOUKD0o7miivV', 'yearly')}
                    disabled={upgradingPlan === 'yearly'}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {upgradingPlan === 'yearly' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upgrade to Yearly'}
                  </Button>
                ) : stripeSubscription.plan === 'yearly' ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
                      <Check className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-emerald-900">Current Plan</p>
                    </div>
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                      className="w-full border-2 border-slate-300 hover:bg-slate-50"
                    >
                      Manage Subscription
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              💳 Secure checkout powered by Stripe • Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
