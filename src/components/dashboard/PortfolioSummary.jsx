import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { motion } from "framer-motion";

export default function PortfolioSummary({ totalValue, totalCost, totalGainLoss, holdings }) {
  const gainLossPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  const isPositive = totalGainLoss >= 0;

  const stats = [
    {
      label: "Total Value",
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      bgColor: "bg-slate-100",
      iconColor: "text-slate-700"
    },
    {
      label: "Total Gain/Loss",
      value: `${isPositive ? '+' : ''}$${Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: `${isPositive ? '+' : ''}${gainLossPercent.toFixed(2)}%`,
      icon: isPositive ? TrendingUp : TrendingDown,
      bgColor: isPositive ? "bg-emerald-50" : "bg-rose-50",
      iconColor: isPositive ? "text-emerald-600" : "text-rose-600",
      valueColor: isPositive ? "text-emerald-600" : "text-rose-600"
    },
    {
      label: "Total Holdings",
      value: holdings.length.toString(),
      icon: PieChart,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 mb-2">{stat.label}</p>
                <p className={`text-3xl font-semibold ${stat.valueColor || 'text-slate-900'}`}>
                  {stat.value}
                </p>
                {stat.subValue && (
                  <p className={`text-sm font-medium mt-1 ${stat.valueColor}`}>
                    {stat.subValue}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
