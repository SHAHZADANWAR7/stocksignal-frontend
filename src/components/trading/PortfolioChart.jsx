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
      {/* INDUSTRIAL METRIC GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Portfolio Value", value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-4 h-4 text-blue-400" />, sub: "Total Balance" },
          { label: "Total Gain/Loss", value: `${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: totalGainLoss >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />, sub: `${totalGainLossPercent.toFixed(2)}%`, color: totalGainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500' },
          { label: "Daily Change", value: `${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss * 0.02).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: <Activity className="w-4 h-4 text-blue-400" />, sub: `${(totalGainLossPercent * 0.02).toFixed(2)}%`, color: 'text-blue-500' },
          { label: "Asset Count", value: portfolio.assets.length, icon: <Target className="w-4 h-4 text-purple-400" />, sub: `Basis: $${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` }
        ].map((item, i) => (
          <Card key={i} className="border-2 border-slate-200 shadow-sm rounded-none overflow-hidden bg-white">
            <div className="bg-slate-900 py-2 px-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</span>
              {item.icon}
            </div>
            <CardContent className="p-4 bg-slate-50/50">
              <p className={`text-xl md:text-2xl font-mono font-bold tracking-tighter ${item.color || 'text-slate-900'}`}>
                {item.value}
              </p>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-tight">
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
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

      <Card className="border-2 border-slate-200 shadow-lg overflow-hidden rounded-none">
        <CardHeader className="bg-slate-900 text-white rounded-none border-b border-slate-800 py-4 px-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Position Details: Asset Database
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-6 text-left border-r border-slate-200 text-slate-500">Symbol</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Quantity</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Avg Cost</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Current</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-4 text-right border-r border-slate-200 text-slate-500">Value</th>
                  <th className="text-[9px] font-black uppercase tracking-[0.2em] py-4 px-6 text-center text-slate-500">Gain/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {portfolio.assets.map((asset, index) => {
                  const currentValue = asset.quantity * asset.currentPrice;
                  const costBasis = asset.quantity * asset.avgCost;
                  const gainLoss = currentValue - costBasis;
                  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
                  const isPositive = gainLoss >= 0;

                  return (
                    <tr key={index} className="hover:bg-blue-50/40 transition-colors font-mono text-[11px]">
                      <td className="py-4 px-6 font-bold text-slate-900 border-r border-slate-100 uppercase tracking-tighter">
                        {asset.symbol}
                      </td>
                      <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100">
                        {asset.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100">
                        ${asset.avgCost.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right text-slate-700 border-r border-slate-100">
                        ${asset.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900 border-r border-slate-100">
                        ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className={`inline-block px-3 py-1.5 text-[10px] font-black rounded-none border-l-4 ${
                          isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500' 
                          : 'bg-rose-50 text-rose-700 border-rose-500'
                        }`}>
                          <div className="flex flex-col items-center leading-none gap-1">
                            <span>{isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%</span>
                            <span className="text-[8px] opacity-60">
                              {isPositive ? '+' : '-'}${Math.abs(gainLoss).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
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
