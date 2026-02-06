import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

/**
 * Extreme Beta Warning Component
 * Alerts when assets have β > 2.0 (2× market volatility)
 * Shows beta interpretation and practical impact
 * 
 * ✅ VERIFIED: Compatible with updated Analysis.jsx
 * ✅ NO CHANGES NEEDED
 * ✅ NO VIX NEEDED (beta measures market sensitivity, not implied volatility)
 */
export default function ExtremeBetaWarning({ companies }) {
  const extremeBetaAssets = companies.filter(c => Math.abs(c.beta) > 2.0);
  
  if (extremeBetaAssets.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-300 bg-purple-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-purple-900 mb-2">
              ⚡ Extreme Market Sensitivity Detected
            </h4>
            <p className="text-sm text-purple-800 mb-3">
              {extremeBetaAssets.length === 1 
                ? 'One asset has amplified market sensitivity (β exceeding 2.0).'
                : `${extremeBetaAssets.length} assets have amplified market sensitivity (β exceeding 2.0).`}
            </p>

            <div className="space-y-2">
              {extremeBetaAssets.map(asset => {
                const marketSensitivity = ((Math.abs(asset.beta) - 1) * 100).toFixed(0);
                const direction = asset.beta > 0 ? 'same' : 'opposite';
                
                return (
                  <div key={asset.symbol} className="bg-white/70 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-slate-900">{asset.symbol}</span>
                        <span className="text-sm text-slate-600 ml-2">{asset.name}</span>
                      </div>
                      <Badge className="bg-purple-200 text-purple-900 font-bold">
                        β = {asset.beta.toFixed(3)}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-purple-800 space-y-1">
                      <p>
                        <strong>Interpretation:</strong> Moves in the <strong>{direction}</strong> direction as S&P 500, 
                        but <strong>{marketSensitivity}% more volatile</strong>
                      </p>
                      <p>
                        <strong>Practical Impact:</strong> When market moves ±10%, expect {asset.symbol} to move 
                        ±{(Math.abs(asset.beta) * 10).toFixed(1)}%
                      </p>
                      {asset.beta_1year && Math.abs(asset.beta_1year - asset.beta) > 0.5 && (
                        <p className="text-amber-700 font-semibold">
                          ⚠️ Beta shift: 1Y={asset.beta_1year.toFixed(3)} vs 5Y={asset.beta.toFixed(3)} 
                          (risk regime may be changing)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Educational Context */}
            <div className="mt-3 p-3 bg-white/50 rounded-lg border border-slate-300">
              <p className="text-xs text-slate-700">
                <strong>What is Beta?</strong> Beta measures systematic risk (market sensitivity). 
                β=1.0 means moves with market. β exceeding 2.0 means 2× market volatility. 
                High-beta assets amplify both gains AND losses during market swings.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
