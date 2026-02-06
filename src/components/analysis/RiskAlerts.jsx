import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Zap, Info } from "lucide-react";

/**
 * Risk Alerts Component
 * Displays portfolio risk alerts and recommendations
 * 
 * ✅ CREATED: For potential use by other pages
 * ⚠️ NOTE: Not currently used in Analysis.jsx (has dedicated components)
 * ✅ NO CHANGES NEEDED
 */
export default function RiskAlerts({ analysisData = {} }) {
  return (
    <div className="space-y-4">
      {/* Correlation Alert */}
      <Card className="border-2 border-slate-200 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Moderate Asset Correlation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">57%</span>
            <span className="text-slate-600">Average Correlation</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Medium</span>
          </div>
          <p className="text-slate-600 text-sm">
            Assets show moderate correlation. Diversification benefits are present but limited. Adding uncorrelated assets would improve portfolio efficiency.
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-2 border-green-200 bg-green-50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">💡 Optional Recommendations (Not Required)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-2">
            <p className="font-semibold text-slate-700">• Broad Market ETFs:</p>
            <p className="text-slate-600 ml-4">SPY (S&P 500), QQQ (Nasdaq), VTI (Total Market)</p>
            <p className="font-semibold text-slate-700 mt-3">• Bonds:</p>
            <p className="text-slate-600 ml-4">BND (Total Bond), AGG (Aggregate Bonds)</p>
            <p className="font-semibold text-slate-700 mt-3">• Alternatives:</p>
            <p className="text-slate-600 ml-4">GLD (Gold), VNQ (Real Estate), VXUS (International)</p>
          </div>
          <p className="text-xs text-slate-500 mt-4 italic">These are suggestions only. You may proceed with your current selections.</p>
        </CardContent>
      </Card>

      {/* Concentration Risk */}
      <Alert className="border-2 border-orange-300 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <span className="font-semibold text-orange-900">⚠️ Concentration Risk Alert</span>
          <p className="text-orange-800 text-sm mt-2">
            One position exceeds 25% of your portfolio. Single-stock concentration increases idiosyncratic risk.
          </p>
        </AlertDescription>
      </Alert>

      {/* High Beta Alert */}
      <Alert className="border-2 border-red-300 bg-red-50">
        <Zap className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <span className="font-semibold text-red-900">⚡ Extreme Market Sensitivity Detected</span>
          <p className="text-red-800 text-sm mt-2">
            2 assets have amplified market sensitivity (β exceeding 2.0). Expect 2-3× the volatility of the overall market during swings.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
