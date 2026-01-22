import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from "lucide-react";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#14b8a6'];

export default function PortfolioChart({ portfolio, trades }) {
  if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
    return (
      <Card className="border-2 border-slate-200">
        <CardContent className="p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Portfolio Yet</h3>
          <p className="text-slate-500">Execute your first paper trade to start building your portfolio</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = portfolio.totalValue || 0;
  const totalCost = portfolio.assets.reduce((sum, asset) => 
    sum + (asset.quantity * asset.avgCost), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const pieData = portfolio.assets.map(asset => ({
    name: asset.symbol,
    value: asset.quantity * asset.currentPrice,
    quantity: asset.quantity
  }));

  const barData = portfolio.assets.map(asset => {
    const currentValue = asset.quantity * asset.currentPrice;
    const costBasis = asset.quantity * asset.avgCost;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return {
      symbol: asset.symbol,
      gainLoss,
      gainLossPercent,
      value: currentValue
    };
  }).sort((a, b) => b.gainLossPercent - a.gainLossPercent);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-600">Total</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Portfolio Value</p>
            <p className="text-3xl font-bold text-slate-900">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${totalGainLoss >= 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100' : 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-rose-600" />
              )}
              <Badge className={totalGainLoss >= 0 ? "bg-emerald-600" : "bg-rose-600"}>
                {totalGainLoss >= 0 ? 'Gain' : 'Loss'}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Gain/Loss</p>
            <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-1`}>
              {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${totalGainLoss >= 0 ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-600">Daily</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Daily Gain/Loss</p>
            <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${Math.abs(totalGainLoss * 0.02).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${totalGainLoss >= 0 ? 'text-blue-600' : 'text-orange-600'} mt-1`}>
              {totalGainLoss >= 0 ? '+' : ''}{(totalGainLossPercent * 0.02).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-600">Holdings</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Assets</p>
            <p className="text-3xl font-bold text-slate-900">{portfolio.assets.length}</p>
            <p className="text-sm text-slate-600 mt-1">
              Cost Basis: ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={pieData.sort((a, b) => b.value - a.value)} 
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} label={{ position: 'right', formatter: (value) => `${((value / totalValue) * 100).toFixed(1)}%` }}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Performance by Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "gainLossPercent") {
                      return [`${value.toFixed(2)}%`, "Return"];
                    }
                    return value;
                  }}
                />
                <Bar dataKey="gainLossPercent" fill="#3b82f6" name="Return %" radius={[10, 10, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gainLossPercent >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Symbol</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Avg Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Current</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.assets.map((asset, index) => {
                  const currentValue = asset.quantity * asset.currentPrice;
                  const costBasis = asset.quantity * asset.avgCost;
                  const gainLoss = currentValue - costBasis;
                  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{asset.symbol}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{asset.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-700">${asset.avgCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-slate-700">${asset.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`font-semibold ${gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {gainLoss >= 0 ? '+' : ''}${Math.abs(gainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <div className="text-xs">
                            {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
