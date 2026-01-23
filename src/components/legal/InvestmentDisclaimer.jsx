import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield } from "lucide-react";

export default function InvestmentDisclaimer() {
  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              Important Investment Disclaimer
            </h3>
            
            <div className="space-y-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                This app provides portfolio analysis and decision-support tools.
                All trades are user-directed and executed by a third-party regulated broker.
              </p>

              <div className="bg-white/80 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-900">No Investment Advice</p>
                <p>
                  StockSignal does NOT provide investment, financial, legal, or tax advice. 
                  All content, analysis, and recommendations are for informational and educational purposes only. 
                  You should consult with licensed financial advisors, accountants, and legal professionals before making investment decisions.
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-900">User Responsibility</p>
                <p>
                  You are solely responsible for all investment decisions made using this application. 
                  All trading activity requires your explicit approval and direction. 
                  Past performance does not guarantee future results.
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-900">No Fund Management or Custody</p>
                <p>
                  StockSignal does NOT manage, custody, hold, or control any user funds or securities. 
                  Trade execution, account custody, and regulatory compliance are handled exclusively by third-party, 
                  SEC-registered and FINRA-regulated brokerage partners.
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-900">Investment Risks</p>
                <p>
                  Investing involves substantial risk of loss. Market conditions, economic factors, and individual 
                  security performance can result in partial or total loss of invested capital. 
                  We make no guarantees regarding investment performance, profits, or returns.
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-900">Limitation of Liability</p>
                <p>
                  StockSignal and its creators are not liable for any losses, damages, or adverse outcomes resulting 
                  from your use of this application, including but not limited to market volatility, user decisions, 
                  data inaccuracies, or technical issues. Use this tool at your own risk.
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-900">AI-Generated Content</p>
                <p>
                  This application uses artificial intelligence to generate portfolio analysis and recommendations. 
                  AI outputs are approximations and may contain errors, biases, or inaccuracies. 
                  Always verify information independently and exercise your own judgment.
                </p>
              </div>

              <p className="text-xs text-slate-600 pt-3 border-t border-slate-300">
                By using StockSignal, you acknowledge that you have read, understood, and agree to this disclaimer. 
                If you do not agree, please discontinue use of this application immediately.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
