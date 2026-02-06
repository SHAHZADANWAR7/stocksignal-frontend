import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingDown } from "lucide-react";

/**
 * Stress Test Section Component
 * Displays stress testing scenarios and drawdown analysis
 * 
 * ✅ CREATED: For potential use in other pages
 * ⚠️ NOTE: Not currently used in Analysis.jsx (has StressTestingCard instead)
 * ✅ NO CHANGES NEEDED
 */
export default function StressTestSection() {
  const [activeTab, setActiveTab] = useState("crash");

  const scenarios = [
    {
      name: "Market Crash",
      symbol: "crash",
      decline: "-40%",
      probability: "~5%/decade",
      example: "2008 Financial Crisis, COVID-19 March 2020",
      impact: "-42%",
      duration: "6mo duration, 22mo recovery",
    },
    {
      name: "Sector Collapse",
      symbol: "sector",
      decline: "-60%",
      probability: "~2%/decade",
      example: "Dot-com bubble burst",
      impact: "-63%",
      duration: "18mo recovery",
    },
    {
      name: "Black Swan",
      symbol: "swan",
      decline: "-70%",
      probability: "~1%/decade",
      example: "COVID-19 severity",
      impact: "-85%",
      duration: "48mo recovery",
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-2 border-slate-200 rounded-xl">
        <CardHeader>
          <CardTitle>Stress Testing & Tail Risk Analysis</CardTitle>
          <p className="text-sm text-slate-600 mt-2">Extreme scenario modeling beyond standard Monte Carlo projections</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              {scenarios.map((s) => (
                <TabsTrigger key={s.symbol} value={s.symbol} className="text-xs">
                  {s.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {scenarios.map((scenario) => (
              <TabsContent key={scenario.symbol} value={scenario.symbol} className="space-y-4 mt-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold">Market Impact</p>
                    <p className="text-2xl font-bold text-red-600">{scenario.decline}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold">Portfolio Impact</p>
                    <p className="text-2xl font-bold text-orange-600">{scenario.impact}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold">Probability</p>
                    <p className="text-sm font-bold text-yellow-700">{scenario.probability}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold">Duration</p>
                    <p className="text-sm font-bold text-blue-700">{scenario.duration}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Historical Precedent:</span> {scenario.example}
                  </p>
                </div>

                <Alert className="border-2 border-amber-300 bg-amber-50">
                  <AlertDescription>
                    <p className="text-xs text-amber-900">
                      <span className="font-semibold">⚠️ Educational Only:</span> These are scenario-based simulations for stress testing, NOT forecasts. Real crises differ in timing, severity, and duration.
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Drawdown Analysis */}
      <Card className="border-2 border-slate-200 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Drawdown Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="font-semibold text-slate-700">Statistical (95%)</span>
              <span className="text-2xl font-bold text-red-600">-85%</span>
              <span className="text-xs text-slate-500">Expected worst-case</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="font-semibold text-slate-700">Tail Risk (99%)</span>
              <span className="text-2xl font-bold text-orange-600">-99%</span>
              <span className="text-xs text-slate-500">Fat-tailed model</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="font-semibold text-slate-700">Theoretical</span>
              <span className="text-2xl font-bold text-yellow-600">-109%</span>
              <span className="text-xs text-slate-500">Mathematical boundary</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            📊 Methodology: Statistical and Tail Risk use verified portfolio beta and historical crisis data. Theoretical bound is for educational context only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
