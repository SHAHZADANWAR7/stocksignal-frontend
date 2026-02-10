import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionChangeSummary({ currentMetrics }) {
  const [changes, setChanges] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const lastSessionKey = 'last_session_metrics';
    const dismissalKey = `dismissed_changes_${new Date().toDateString()}`;
    
    if (localStorage.getItem(dismissalKey)) {
      setIsDismissed(true);
      return;
    }

    const lastSession = JSON.parse(localStorage.getItem(lastSessionKey) || '{}');
    
    if (!lastSession.timestamp) {
      localStorage.setItem(lastSessionKey, JSON.stringify({
        timestamp: Date.now(),
        ...currentMetrics
      }));
      return;
    }

    const detectedChanges = [];

    if (currentMetrics.portfolioBeta && lastSession.portfolioBeta) {
      const betaChange = Math.abs(currentMetrics.portfolioBeta - lastSession.portfolioBeta);
      if (betaChange > 0.1) {
        detectedChanges.push({
          message: 'Portfolio beta updated',
          details:
            `${typeof lastSession.portfolioBeta === "number" && Number.isFinite(lastSession.portfolioBeta) ? lastSession.portfolioBeta.toFixed(2) : "Not Available"} → ${typeof currentMetrics.portfolioBeta === "number" && Number.isFinite(currentMetrics.portfolioBeta) ? currentMetrics.portfolioBeta.toFixed(2) : "Not Available"}`
        });
      }
    }

    setChanges(detectedChanges);

    localStorage.setItem(lastSessionKey, JSON.stringify({
      timestamp: Date.now(),
      ...currentMetrics
    }));
  }, [currentMetrics]);

  const handleDismiss = () => {
    const dismissalKey = `dismissed_changes_${new Date().toDateString()}`;
    localStorage.setItem(dismissalKey, 'true');
    setIsDismissed(true);
  };

  if (isDismissed || changes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-900">Changes Since Last Visit</p>
                  <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {changes.map((change, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-semibold text-blue-900">{change.message}</p>
                      <p className="text-xs text-blue-800">{change.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
