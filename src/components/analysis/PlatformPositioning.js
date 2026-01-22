import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, AlertTriangle, Info } from "lucide-react";

/**
 * PLATFORM POSITIONING STATEMENT
 * 
 * Persistent copy that differentiates StockSignal from trading apps
 * Reinforces learning-first, uncertainty-aware positioning
 */

export default function PlatformPositioning({ variant = "compact" }) {
  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>StockSignal</strong> is an educational and decision-support platform designed to help users 
            <strong> understand risk, uncertainty, and trade-offs</strong> — not to predict markets or recommend trades.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-2">
                What StockSignal Is (And Isn't)
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-emerald-700 mb-2">✓ We Help You:</p>
                  <ul className="space-y-1 text-slate-700">
                    <li>• Understand risk and uncertainty</li>
                    <li>• Compare portfolio trade-offs</li>
                    <li>• Learn from simulations and scenarios</li>
                    <li>• Make informed decisions with transparency</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-rose-700 mb-2">✗ We Don't:</p>
                  <ul className="space-y-1 text-slate-700">
                    <li>• Predict market movements</li>
                    <li>• Guarantee investment outcomes</li>
                    <li>• Provide financial advice</li>
                    <li>• Recommend specific trades</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-4 italic">
                StockSignal is a learning and decision-support tool. All projections are model-based estimates. 
                Consult a licensed financial advisor for personalized investment advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Platform Philosophy
          </p>
          <p className="text-sm text-blue-800 leading-relaxed">
            StockSignal is an educational and decision-support platform designed to help users 
            <strong> understand risk, uncertainty, and trade-offs</strong> — not to predict markets or recommend trades.
            <br/><br/>
            Our tools help you <strong>explore scenarios</strong>, <strong>test assumptions</strong>, 
            and <strong>compare outcomes</strong> so you can make better-informed decisions with realistic expectations.
          </p>
        </div>
      </div>
    </div>
  );
}
