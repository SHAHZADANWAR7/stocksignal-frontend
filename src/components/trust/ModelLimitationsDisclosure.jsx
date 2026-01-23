import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

const MODEL_LIMITATIONS = {
  expected_return: {
    title: "Expected Return Model Limitations",
    icon: AlertTriangle,
    color: "blue",
    limitations: [
      {
        issue: "Historical bias",
        explanation: "Past returns don't predict future performance."
      },
      {
        issue: "CAPM assumptions",
        explanation: "Assumes markets are efficient and beta is stable."
      }
    ]
  }
};

export default function ModelLimitationsDisclosure({ modelType = "expected_return" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const model = MODEL_LIMITATIONS[modelType];
  if (!model) return null;

  const Icon = model.icon;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Model Limitations & Assumptions
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {model.limitations.map((limit, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-sm font-semibold mb-1">⚠️ {limit.issue}</p>
                <p className="text-xs text-slate-700">{limit.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
