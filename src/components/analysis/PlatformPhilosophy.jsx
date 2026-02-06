import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, BookOpen } from "lucide-react";

/**
 * Platform Philosophy Component
 * Static informational card about platform methodology and disclaimers
 * 
 * ✅ VERIFIED: Code is clean and functional
 * ⚠️ NOTE: NOT currently used in Analysis.jsx
 * ✅ NO CHANGES NEEDED
 */
export default function PlatformPhilosophy() {
  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-blue-50 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Platform Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-slate-700 font-semibold">
              StockSignal is an educational and decision-support platform designed to help users understand risk, uncertainty, and trade-offs — not to predict markets or recommend trades.
            </p>
            <p className="text-slate-600">
              Our tools help you explore scenarios, test assumptions, and compare outcomes so you can make better-informed decisions with realistic expectations.
            </p>
          </div>

          <div className="border-t border-blue-300 pt-4">
            <h4 className="font-semibold text-slate-800 mb-2">Industry-Standard Portfolio Analysis Methodology</h4>
            <p className="text-slate-600 text-sm">
              Analysis uses <span className="font-semibold">CAPM, Modern Portfolio Theory (MPT), and Monte Carlo simulations</span> with real market data from Yahoo Finance.
            </p>
            <a href="#" className="text-blue-600 font-semibold hover:underline text-sm mt-2 inline-block">
              Learn More →
            </a>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200 mt-2">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Disclaimer:</span> This analysis is educational only. Past performance does not guarantee future results. Consult a financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
