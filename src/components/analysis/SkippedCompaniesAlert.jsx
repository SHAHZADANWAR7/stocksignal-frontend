import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X } from "lucide-react";

export default function SkippedCompaniesAlert({ 
  skippedCompanies, 
  onDismiss, 
  onRemoveFromSelection 
}) {
  if (!skippedCompanies || skippedCompanies.length === 0) return null;

  const reasons = {
    delisted: "Company delisted or suspended from trading",
    noData: "No current market data available",
    invalid: "Invalid ticker symbol"
  };

  return (
    <Card className="border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 mb-8 rounded-xl shadow-lg">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-amber-900">
                  {skippedCompanies.length === 1 
                    ? "1 Company Removed" 
                    : `${skippedCompanies.length} Companies Removed`}
                </h3>
                <p className="text-sm text-amber-800 mt-1">
                  These symbols couldn't be analyzed due to data issues
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-amber-600 hover:bg-amber-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {skippedCompanies.map(symbol => (
                <Badge 
                  key={symbol} 
                  className="bg-amber-200 text-amber-900 text-sm px-3 py-1.5 font-medium"
                >
                  {symbol}
                </Badge>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              <div className="bg-white/60 p-3 rounded-lg border border-amber-200">
                <p className="text-xs md:text-sm text-amber-900 leading-relaxed">
                  <strong>Why removed:</strong> These companies likely have been delisted, suspended from trading, or have missing market data in available sources.
                </p>
              </div>
              
              <div className="bg-white/60 p-3 rounded-lg border border-amber-200">
                <p className="text-xs md:text-sm text-amber-900">
                  <strong>What to do:</strong> Proceed with remaining valid stocks, or update your selection in Browse Investments with active companies.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onDismiss}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Continue Analysis
              </Button>
              <Button
                onClick={onRemoveFromSelection}
                variant="outline"
                className="border-2 border-amber-400 text-amber-600 hover:bg-amber-50 font-semibold"
              >
                Remove & Reselect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
