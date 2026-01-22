import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Info } from "lucide-react";

export default function PlatformPositioning({ variant = "compact" }) {
  if (variant === "compact") {
    return (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-900">
            <strong>StockSignal</strong> is an educational platform to help understand risk and uncertainty.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-slate-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 mb-2">What StockSignal Is</h4>
            <p className="text-sm text-slate-700">
              An educational platform for learning investment strategies with transparency about risk and uncertainty.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
