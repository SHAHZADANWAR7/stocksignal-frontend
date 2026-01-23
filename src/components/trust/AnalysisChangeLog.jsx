import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export default function AnalysisChangeLog({ analysisResult }) {
  const [changes, setChanges] = useState([]);
  const [showChanges, setShowChanges] = useState(false);

  useEffect(() => {
    if (!analysisResult) return;

    const lastVisitKey = 'last_analysis_visit';
    const lastVisitTime = localStorage.getItem(lastVisitKey);

    if (lastVisitTime) {
      const newChanges = [];
      
      if (analysisResult.companies) {
        analysisResult.companies.forEach(company => {
          if (company.last_analyzed_date) {
            const analyzedDate = new Date(company.last_analyzed_date);
            const lastVisitDate = new Date(lastVisitTime);
            
            if (analyzedDate > lastVisitDate) {
              newChanges.push({
                message: `${company.symbol} data refreshed`,
                details: `Price: $${company.current_price?.toFixed(2)}`
              });
            }
          }
        });
      }
      
      setChanges(newChanges);
      setShowChanges(newChanges.length > 0);
    }

    localStorage.setItem(lastVisitKey, new Date().toISOString());
  }, [analysisResult]);

  if (!showChanges || changes.length === 0) return null;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              What's Changed Since Your Last Visit
            </p>
            <div className="space-y-2">
              {changes.slice(0, 5).map((change, idx) => (
                <div key={idx} className="text-xs">
                  <p className="text-blue-900 font-semibold">{change.message}</p>
                  <p className="text-blue-800">{change.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
