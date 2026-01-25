/**
 * TAB LAYOUT & NAVIGATION LAYER - AWS AMPLIFY VERSION
 * 350+ lines of pure tab presentation and navigation
 * 
 * Core responsibility: Tab interface and analysis result visualization
 * - Tab navigation for different analysis views
 * - Rendering of strategy-specific analysis results
 * - Visualization of portfolio metrics and allocations
 * - Strategy comparison presentation
 * - Props-driven rendering with no calculations
 * 
 * This file does NOT contain:
 * - Portfolio calculations
 * - Behavioral analysis
 * - Workflow orchestration
 * - Strategy card logic (belongs to TempStrategyCardsAWS.js)
 * 
 * All data is sourced from props and rendered as-is.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  PieChart as PieChartRechart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Info } from "lucide-react";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
];

export default function TempAnalysisTabsAWS({
  analysisResult,
  selectedStrategy,
  activeTab,
  setActiveTab,
}) {
  if (!analysisResult) return null;

  const portfolioKey = selectedStrategy;
  const portfolio = analysisResult[portfolioKey];
  const allocations = portfolio?.allocations || {};

  // Prepare allocation data for pie chart
  const allocationData = Object.entries(allocations)
    .filter(([_, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value,
    }));

  // Prepare comparison data for all four strategies
  const comparisonData = [
    {
      name: "Optimal",
      return: analysisResult.optimal_portfolio?.expected_return || 0,
      risk: analysisResult.optimal_portfolio?.volatility || 0,
      sharpe: analysisResult.optimal_portfolio?.sharpe_ratio || 0,
      sortino: analysisResult.optimal_portfolio?.sortino_ratio || 0,
    },
    {
      name: "Min Var",
      return: analysisResult.minimum_variance_portfolio?.expected_return || 0,
      risk: analysisResult.minimum_variance_portfolio?.volatility || 0,
      sharpe: analysisResult.minimum_variance_portfolio?.sharpe_ratio || 0,
      sortino: analysisResult.minimum_variance_portfolio?.sortino_ratio || 0,
    },
    {
      name: "Risk Parity",
      return: analysisResult.risk_parity_portfolio?.expected_return || 0,
      risk: analysisResult.risk_parity_portfolio?.volatility || 0,
      sharpe: analysisResult.risk_parity_portfolio?.sharpe_ratio || 0,
      sortino: analysisResult.risk_parity_portfolio?.sortino_ratio || 0,
    },
    {
      name: "Max Return",
      return: analysisResult.maximum_return_portfolio?.expected_return || 0,
      risk: analysisResult.maximum_return_portfolio?.volatility || 0,
      sharpe: analysisResult.maximum_return_portfolio?.sharpe_ratio || 0,
      sortino: analysisResult.maximum_return_portfolio?.sortino_ratio || 0,
    },
  ];

  // Prepare risk metrics data
  const riskMetricsData = [
    { name: "Expected Return", value: (portfolio?.expected_return || 0).toFixed(2), unit: "%" },
    { name: "Volatility (Annual)", value: (portfolio?.volatility || 0).toFixed(2), unit: "%" },
    { name: "VaR (95%)", value: (portfolio?.var_95 || 0).toFixed(2), unit: "%" },
    { name: "CVaR (95%)", value: (portfolio?.cvar_95 || 0).toFixed(2), unit: "%" },
    { name: "Beta", value: (portfolio?.beta_portfolio || 0).toFixed(2), unit: "" },
    { name: "Alpha", value: (portfolio?.alpha_portfolio || 0).toFixed(2), unit: "%" },
    { name: "Max Drawdown", value: (portfolio?.max_drawdown || 0).toFixed(2), unit: "%" },
    { name: "Sharpe Ratio", value: (portfolio?.sharpe_ratio || 0).toFixed(3), unit: "" },
    { name: "Sortino Ratio", value: (portfolio?.sortino_ratio || 0).toFixed(3), unit: "" },
  ];

  // Prepare sector analysis data
  const correlationMatrix = analysisResult.correlation_matrix || [];
  const companies = analysisResult.companies || [];

  const sectorAnalysis = companies.reduce((acc, c) => {
    const sector = c.sector || "Other";
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push({ symbol: c.symbol, allocation: allocations[c.symbol] || 0 });
    return acc;
  }, {});

  const sectorData = Object.entries(sectorAnalysis).map(([sector, assets]) => ({
    name: sector,
    assets: assets.length,
    totalAllocation: assets.reduce((sum, a) => sum + a.allocation, 0),
    companies: assets.map(a => a.symbol).join(", "),
  }));

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 text-xs bg-slate-100 rounded-lg p-1">
        <TabsTrigger value="overview" className="rounded-md transition-all">
          Overview
        </TabsTrigger>
        <TabsTrigger value="allocations" className="rounded-md transition-all">
          Allocations
        </TabsTrigger>
        <TabsTrigger value="comparison" className="rounded-md transition-all">
          Comparison
        </TabsTrigger>
        <TabsTrigger value="risk" className="rounded-md transition-all">
          Risk Metrics
        </TabsTrigger>
        <TabsTrigger value="sector" className="rounded-md transition-all">
          Sectors
        </TabsTrigger>
        <TabsTrigger value="correlation" className="rounded-md transition-all">
          Correlation
        </TabsTrigger>
        <TabsTrigger value="efficient" className="rounded-md transition-all">
          Efficient Frontier
        </TabsTrigger>
      </TabsList>

      {/* OVERVIEW TAB — Key metrics and holdings */}
      <TabsContent value="overview" className="space-y-6 mt-6">
        {/* Portfolio Metrics Card */}
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Portfolio Metrics</span>
              <Info className="w-4 h-4 text-slate-400" />
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Key performance indicators for {portfolio?.description || "selected strategy"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  label: "Expected Return",
                  value: (portfolio?.expected_return || 0).toFixed(2) + "%",
                  color: "blue",
                },
                {
                  label: "Volatility",
                  value: (portfolio?.volatility || 0).toFixed(2) + "%",
                  color: "orange",
                },
                {
                  label: "Sharpe Ratio",
                  value: (portfolio?.sharpe_ratio || 0).toFixed(3),
                  color: "green",
                },
                {
                  label: "Beta",
                  value: (portfolio?.beta_portfolio || 0).toFixed(2),
                  color: "purple",
                },
                {
                  label: "Max Drawdown",
                  value: (portfolio?.max_drawdown || 0).toFixed(2) + "%",
                  color: "red",
                },
                {
                  label: "Sortino Ratio",
                  value: (portfolio?.sortino_ratio || 0).toFixed(3),
                  color: "blue",
                },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className={`p-4 bg-${metric.color}-50 rounded-lg border border-${metric.color}-200`}
                >
                  <p className="text-xs font-semibold text-slate-600 uppercase">
                    {metric.label}
                  </p>
                  <p className={`text-2xl font-bold text-${metric.color}-600 mt-1`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Component Holdings Table */}
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Component Holdings</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Asset allocation and individual holding metrics
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold">Symbol</th>
                    <th className="text-right py-3 px-4 font-semibold">Allocation</th>
                    <th className="text-right py-3 px-4 font-semibold">Return</th>
                    <th className="text-right py-3 px-4 font-semibold">Risk</th>
                    <th className="text-right py-3 px-4 font-semibold">Beta</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.companies?.map((company) => (
                    <tr
                      key={company.symbol}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {company.symbol}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {(allocations[company.symbol] || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">
                        {company.expected_return.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">
                        {company.risk.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">
                        {company.beta.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ALLOCATIONS TAB — Visual allocation breakdown */}
      <TabsContent value="allocations" className="space-y-6 mt-6">
        {/* Pie Chart */}
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Portfolio Allocation Distribution</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Pie chart showing asset weights in the portfolio
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChartRechart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              </PieChartRechart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Allocation Details */}
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Allocation Details</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Detailed breakdown of each position
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocationData.map((asset, idx) => (
                <div
                  key={asset.name}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    ></div>
                    <span className="font-semibold flex-1 text-slate-900">{asset.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 w-20 text-right">
                    {asset.value.toFixed(2)}%
                  </span>
                  <div className="w-40 bg-slate-300 rounded-full h-2 ml-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${asset.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* COMPARISON TAB — Cross-strategy comparison */}
      <TabsContent value="comparison" className="space-y-6 mt-6">
        {/* Strategy Comparison Chart */}
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Strategy Comparison</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Risk-return trade-offs across all four strategies
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="return" fill="#3b82f6" name="Return %" radius={[8, 8, 0, 0]} />
                <Bar dataKey="risk" fill="#ef4444" name="Risk %" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Individual Strategy Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {comparisonData.map((strategy) => (
            <Card
              key={strategy.name}
              className={`border-2 rounded-xl transition-all ${
                selectedStrategy ===
                (strategy.name === "Optimal"
                  ? "optimal_portfolio"
                  : strategy.name === "Min Var"
                  ? "minimum_variance_portfolio"
                  : strategy.name === "Risk Parity"
                  ? "risk_parity_portfolio"
                  : "maximum_return_portfolio")
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200"
              }`}
            >
              <CardContent className="p-6">
                <h4 className="font-bold text-lg mb-4 text-slate-900">{strategy.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Expected Return</span>
                    <span className="font-semibold text-green-600">
                      {strategy.return.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Volatility</span>
                    <span className="font-semibold text-orange-600">
                      {strategy.risk.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Sharpe Ratio</span>
                    <span className="font-semibold text-blue-600">
                      {strategy.sharpe.toFixed(3)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 mt-3 flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Return/Risk</span>
                    <span className="font-bold text-slate-900">
                      {(strategy.return / Math.max(strategy.risk, 0.1)).toFixed(2)}x
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* RISK METRICS TAB */}
      <TabsContent value="risk" className="space-y-6 mt-6">
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Comprehensive Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {riskMetricsData.map((metric, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}{metric.unit}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {metric.name === "VaR (95%)" && "Worst expected loss (95% conf)"}
                    {metric.name === "CVaR (95%)" && "Expected loss in tail events"}
                    {metric.name === "Beta" && "Market sensitivity"}
                    {metric.name === "Alpha" && "Risk-adjusted excess return"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Value at Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm font-semibold text-red-900">95% Value at Risk</p>
                  <p className="text-xs text-red-700">Max expected loss in bad 5% of scenarios</p>
                </div>
                <span className="text-2xl font-bold text-red-600">{(portfolio?.var_95 || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="text-sm font-semibold text-orange-900">Conditional VaR (CVaR)</p>
                  <p className="text-xs text-orange-700">Average loss in worst 5% scenarios</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">{(portfolio?.cvar_95 || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Expected Drawdown</p>
                  <p className="text-xs text-yellow-700">Peak-to-trough decline expectation</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{(portfolio?.max_drawdown || 0).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SECTOR ANALYSIS TAB */}
      <TabsContent value="sector" className="space-y-6 mt-6">
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Sector Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold">Sector</th>
                    <th className="text-right py-3 px-4 font-semibold">Assets</th>
                    <th className="text-right py-3 px-4 font-semibold">Allocation %</th>
                    <th className="text-left py-3 px-4 font-semibold">Companies</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((sector, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{sector.name}</td>
                      <td className="text-right py-3 px-4">{sector.assets}</td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {sector.totalAllocation.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{sector.companies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Sector Allocation Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChartRechart data={sectorData}>
                <Pie dataKey="totalAllocation" data={sectorData} cx="50%" cy="50%" labelLine={false} label={({ name, totalAllocation }) => `${name}: ${totalAllocation.toFixed(1)}%`} outerRadius={80} fill="#8884d8">
                  {sectorData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              </PieChartRechart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* CORRELATION TAB */}
      <TabsContent value="correlation" className="space-y-6 mt-6">
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Asset Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="border border-slate-200 p-2 bg-slate-100 font-semibold">Symbol</th>
                    {companies.map((c) => (
                      <th key={c.symbol} className="border border-slate-200 p-2 bg-slate-100 text-center w-12 font-semibold">{c.symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c1, i) => (
                    <tr key={c1.symbol}>
                      <td className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900">{c1.symbol}</td>
                      {companies.map((c2, j) => {
                        const corr = correlationMatrix[i]?.[j] || 0;
                        const bgColor = corr > 0.5 ? "bg-red-100" : corr > 0.2 ? "bg-yellow-100" : corr < -0.2 ? "bg-blue-100" : "bg-slate-50";
                        return (
                          <td key={`${c1.symbol}-${c2.symbol}`} className={`border border-slate-200 p-2 text-center ${bgColor} text-slate-900`}>
                            {corr.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-4">Red = High positive correlation | Yellow = Moderate correlation | Blue = Negative correlation | Gray = Low correlation</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Diversification Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-2">Average Correlation: {(correlationMatrix.flat().reduce((a, b) => a + b, 0) / (correlationMatrix.length * correlationMatrix.length)).toFixed(3)}</p>
                <p className="text-xs text-green-700">Lower correlations = better diversification</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Number of Assets: {companies.length}</p>
                <p className="text-xs text-blue-700">More assets = potential for better diversification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* EFFICIENT FRONTIER TAB */}
      <TabsContent value="efficient" className="space-y-6 mt-6">
        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Efficient Frontier Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="risk" label={{ value: "Risk (%)", position: "insideBottomRight", offset: -10 }} />
                <YAxis type="number" dataKey="return" label={{ value: "Expected Return (%)", angle: -90, position: "insideLeft" }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Optimal" data={[{ risk: analysisResult.optimal_portfolio?.volatility || 0, return: analysisResult.optimal_portfolio?.expected_return || 0 }]} fill="#3b82f6" />
                <Scatter name="Min Variance" data={[{ risk: analysisResult.minimum_variance_portfolio?.volatility || 0, return: analysisResult.minimum_variance_portfolio?.expected_return || 0 }]} fill="#8b5cf6" />
                <Scatter name="Risk Parity" data={[{ risk: analysisResult.risk_parity_portfolio?.volatility || 0, return: analysisResult.risk_parity_portfolio?.expected_return || 0 }]} fill="#f59e0b" />
                <Scatter name="Max Return" data={[{ risk: analysisResult.maximum_return_portfolio?.volatility || 0, return: analysisResult.maximum_return_portfolio?.expected_return || 0 }]} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Risk-Return Profile Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {comparisonData.map((strategy) => {
                const riskReturnRatio = strategy.return / Math.max(strategy.risk, 0.1);
                return (
                  <div key={strategy.name} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all">
                    <h4 className="font-bold text-slate-900 mb-3">{strategy.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-600">Return/Risk Ratio:</span><span className="font-semibold text-slate-900">{riskReturnRatio.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Sharpe Ratio:</span><span className="font-semibold text-green-600">{strategy.sharpe.toFixed(3)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Sortino Ratio:</span><span className="font-semibold text-blue-600">{strategy.sortino.toFixed(3)}</span></div>
                      <div className="w-full h-2 bg-slate-200 rounded mt-3">
                        <div className="h-full bg-blue-500 rounded" style={{ width: `${Math.min(strategy.return * 2, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
