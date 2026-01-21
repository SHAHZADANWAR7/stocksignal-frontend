import React from "react";
import { AlertCircle, TrendingUp, Info } from "lucide-react";

export function SavingsOnlyNarrative() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 mb-1">About This Plan</p>
          <p className="text-sm text-blue-800">
            This plan focuses on disciplined savings with no assumed investment returns. 
            It guarantees you'll reach your goal through consistent contributions, regardless 
            of market performance. This is the most reliable baseline for financial planning.
          </p>
        </div>
      </div>
    </div>
  );
}

export function InvestmentProjectionsNarrative() {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
      <div className="flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-purple-900 mb-1">Investment Growth Scenarios</p>
          <p className="text-sm text-purple-800">
            The projections below assume different annual returns based on your portfolio risk profile. 
            These are <strong>estimates only</strong> and actual results will vary. Past performance 
            does not guarantee future results. Market conditions change, and returns depend on many 
            unpredictable factors.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AllocationDisclaimerNarrative({ usedFallback = false }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 mb-1">
            {usedFallback ? "Generic Allocation Example" : "Example Allocation"}
          </p>
          <p className="text-sm text-amber-800">
            This allocation is <strong>illustrative only</strong> and not a personalized 
            recommendation. It demonstrates one possible portfolio structure consistent 
            with this risk/return profile. 
            <strong> This is not financial advice.</strong> Consult with a licensed 
            financial advisor before investing. Actual allocations should be tailored 
            to your specific situation, goals, and risk tolerance.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StressTestNarrative() {
  return (
    <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-lg p-4 border border-rose-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-rose-900 mb-1">Stress Test Scenarios</p>
          <p className="text-sm text-rose-800">
            These scenarios show how your portfolio would perform if the market declined by various 
            amounts at the 18-month mark. The projections assume you continue making monthly contributions 
            throughout the downturn. This helps you understand potential risks and your recovery timeline.
          </p>
        </div>
      </div>
    </div>
  );
}

export function DownturnTimingNarrative() {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900 mb-1">Downturn Timing Impact</p>
          <p className="text-sm text-slate-700">
            The timing of a market downturn significantly affects your outcome. A decline early 
            in your goal timeline gives more time for recovery, while a late decline is more damaging. 
            However, consistent monthly contributions during downturns ("dollar-cost averaging") 
            can help lower your average cost per share and improve long-term results.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PortfolioRiskNarrative() {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
      <div className="flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-indigo-900 mb-1">Portfolio Risk Considerations</p>
          <p className="text-sm text-indigo-800">
            Shorter goal timelines require lower-risk allocations to avoid losses right when you 
            need the money. Longer timelines allow for more equity exposure to capture growth. 
            If your portfolio is heavily weighted toward stocks with a short timeline, you may 
            face significant losses right before your goal date.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ComprehensiveInvestmentDisclaimer() {
  return (
    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-6 border-2 border-red-200">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-red-900 mb-3">Important Investment Disclaimer</h4>
          <ul className="space-y-2 text-sm text-red-800">
            <li>
              <strong>Not Financial Advice:</strong> All recommendations and allocations are for 
              educational purposes only. They do not constitute financial, investment, legal, or 
              tax advice.
            </li>
            <li>
              <strong>Consult Professionals:</strong> Before investing, consult with a licensed 
              financial advisor, accountant, and legal professional.
            </li>
            <li>
              <strong>No Guarantees:</strong> Past performance does not guarantee future results. 
              Market conditions are unpredictable and returns vary widely.
            </li>
            <li>
              <strong>AI-Generated Content:</strong> Allocations are generated by artificial 
              intelligence and may contain errors or biases. Always verify independently.
            </li>
            <li>
              <strong>Risk of Loss:</strong> Investing involves risk of substantial loss, 
              including loss of principal. No investment is guaranteed.
            </li>
            <li>
              <strong>Your Responsibility:</strong> You are solely responsible for all investment 
              decisions and their outcomes. Use this tool at your own risk.
            </li>
          </ul>
          <p className="text-xs text-red-700 mt-4 italic">
            By using StockSignal, you acknowledge these disclaimers and assume all investment risks.
          </p>
        </div>
      </div>
    </div>
  );
}
