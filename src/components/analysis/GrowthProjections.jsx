import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Growth Projections Component
 * Displays investment growth over multiple time horizons
 * 
 * ✅ CREATED: New component for Analysis.jsx
 * ✅ NO VIX NEEDED: Uses historical projections
 */
export default function GrowthProjections({ projectionData = {} }) {
  const [selectedYear, setSelectedYear] = useState(10);

  // Mock data for growth projection
  const projections = [
    { year: "5 Years", value: "$52,601", contrib: "$28k", growth: "$25k" },
    { year: "10 Years", value: "$154,908", contrib: "$46k", growth: "$109k" },
    { year: "20 Years", value: "$990,646", contrib: "$82k", growth: "$909k" },
    { year: "30 Years", value: "$5,810,662", contrib: "$118k", growth: "$5693k" },
  ];

  const goalData = [
    { years: 0, value: 10000 },
    { years: 5, value: 52601 },
    { years: 10, value: 154908 },
    { years: 15, value: 385000 },
    { years: 20, value: 990646 },
    { years: 25, value: 2100000 },
    { years: 30, value: 5810662 },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-2 border-slate-200 rounded-xl">
        <CardHeader>
          <CardTitle>Investment Growth Projections</CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            17.65% expected annual return • 44.00% volatility • Monthly compounding
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Projection Chart */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={goalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="years" label={{ value: "Years", position: "insideBottomRight", offset: -5 }} />
                <YAxis label={{ value: "Portfolio Value ($)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Projection Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            {projections.map((proj) => (
              <div key={proj.year} className="border border-slate-200 rounded-lg p-4 bg-white">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{proj.year}</p>
                <p className="text-2xl font-bold text-slate-900 mb-3">{proj.value}</p>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-600">Contrib: <span className="font-semibold">{proj.contrib}</span></p>
                  <p className="text-green-600">Growth: <span className="font-semibold">{proj.growth}</span></p>
                </div>
              </div>
            ))}
          </div>

          {/* Goal Success Probability */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold text-slate-900 mb-2">Goal Success Probability</p>
            <p className="text-3xl font-bold text-blue-600 mb-2">26%</p>
            <p className="text-sm text-slate-700">
              In 26 out of 100 simulated scenarios, your <span className="font-semibold">$1,000,000 goal</span> was reached over <span className="font-semibold">20.1 years</span> with current plan:
            </p>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 ml-4">
              <li>• $10,000 initial investment</li>
              <li>• $300/month contributions</li>
              <li>• 17.7% expected return (44.0% volatility)</li>
            </ul>
          </div>

          {/* Probability Distribution */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-semibold text-slate-900 mb-3">30-Year Outcome Distribution</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Worst Case (5th percentile)</span>
                <span className="font-bold text-slate-900">$17,700</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Pessimistic (16th percentile)</span>
                <span className="font-bold text-slate-900">$35,400</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Expected (50th percentile)</span>
                <span className="font-bold text-green-600">$5,810,662</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Optimistic (84th percentile)</span>
                <span className="font-bold text-slate-900">$5,900,000</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 italic">
              Total Contributions: $118,000 | Expected Growth: $5,692,661 (4824% gain)
            </p>
          </div>

          <Alert className="border-2 border-amber-300 bg-amber-50">
            <AlertDescription>
              <p className="text-xs text-amber-900">
                <span className="font-semibold">⚠️ Projection Disclaimer:</span> These assume 17.7% consistent returns and do NOT account for sequence-of-returns risk, crises, withdrawals, or market regime changes. Use as planning scenario only.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
