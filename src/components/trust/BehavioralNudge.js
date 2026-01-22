import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Target } from "lucide-react";

export default function BehavioralNudge({ trigger = "multi_analysis" }) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const analysisKey = `analysis_count_${today}`;
    const cooldownKey = `nudge_cooldown_${trigger}`;

    const lastNudge = localStorage.getItem(cooldownKey);
    if (lastNudge) {
      const minutesSinceLastNudge = (Date.now() - parseInt(lastNudge)) / (1000 * 60);
      if (minutesSinceLastNudge < 30) return;
    }

    if (trigger === "multi_analysis") {
      const count = parseInt(localStorage.getItem(analysisKey) || '0');
      const newCount = count + 1;
      localStorage.setItem(analysisKey, newCount.toString());

      if (newCount >= 4 && count < 4) {
        setShouldShow(true);
        localStorage.setItem(cooldownKey, Date.now().toString());
      }
    }
  }, [trigger]);

  if (!shouldShow) return null;

  const nudges = {
    multi_analysis: {
      icon: Clock,
      title: "Taking time to explore scenarios?",
      message: "Multiple analyses today. Portfolios are designed for multi-year horizons.",
      suggestion: "Consider letting your strategy settle."
    }
  };

  const nudge = nudges[trigger] || nudges.multi_analysis;
  const Icon = nudge.icon;

  return (
    <Card className="border-2 border-blue-300 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">{nudge.title}</p>
            <p className="text-sm text-blue-800 mb-2">{nudge.message}</p>
            <p className="text-xs text-blue-700 italic">💡 {nudge.suggestion}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
