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

  return (
    <Card className="border-2 border-amber-500 bg-amber-50 mb-8">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-amber-900">
                  {skippedCompanies.length} {skippedCompanies.length === 1 ? 'Company' : 'Companies'} Removed
                </h3>
                <p className="text-sm text-amber-800 mt-1">
                  These symbols couldn't be analyzed due to data issues
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {skippedCompanies.map(symbol => (
                <Badge key={symbol} className="bg-amber-200 text-amber-900">
                  {symbol}
                </Badge>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={onDismiss} className="bg-amber-600">
                Continue Analysis
              </Button>
              <Button onClick={onRemoveFromSelection} variant="outline">
                Remove & Reselect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
