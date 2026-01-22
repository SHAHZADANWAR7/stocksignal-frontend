import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumGate({ 
  feature, 
  description, 
  triggerReason,
  benefit,
  children,
  showUpgrade = true,
  variant = "card"
}) {
  
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-purple-900">{feature}</p>
          <p className="text-xs text-purple-700">{description}</p>
        </div>
        {showUpgrade && (
          <Link to={createPageUrl("Subscribe")}>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    );
  }
  
  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-4 rounded-xl shadow-lg mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <p className="font-bold text-lg">{feature}</p>
              <p className="text-sm text-white/90">{description}</p>
            </div>
          </div>
          {showUpgrade && (
            <Link to={createPageUrl("Subscribe")}>
              <Button variant="outline" className="bg-white text-purple-600 hover:bg-purple-50">
                Unlock Pro
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-purple-900">{feature}</h3>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                Pro
              </Badge>
            </div>
            <p className="text-purple-700 mb-3">{description}</p>
            
            {triggerReason && (
              <div className="bg-white/60 p-3 rounded-lg mb-3 border border-purple-200">
                <p className="text-sm text-purple-800">
                  <Lock className="w-4 h-4 inline mr-1" />
                  <strong>Why upgrade now:</strong> {triggerReason}
                </p>
              </div>
            )}
            
            {benefit && (
              <div className="bg-purple-100 p-3 rounded-lg mb-4 border border-purple-300">
                <p className="text-sm text-purple-900">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  <strong>What you'll unlock:</strong> {benefit}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {children && (
          <div className="bg-white/60 p-4 rounded-lg mb-4 border border-purple-200">
            {children}
          </div>
        )}
        
        {showUpgrade && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={createPageUrl("Subscribe")} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-base h-12">
                <Sparkles className="w-5 h-5 mr-2" />
                Upgrade to Pro - $5.99/mo
              </Button>
            </Link>
            <Button variant="outline" onClick={() => console.log("Premium gate dismissed")} className="border-purple-300 text-purple-700 hover:bg-purple-50">
              Maybe Later
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
