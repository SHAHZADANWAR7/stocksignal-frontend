import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-10 h-10 text-rose-600" />
            <h1 className="text-4xl font-bold text-slate-900">Legal Disclaimer</h1>
          </div>
          <p className="text-slate-600">Effective Date: December 26, 2025</p>
        </motion.div>

        <Card className="border-4 border-rose-400 shadow-2xl bg-gradient-to-br from-rose-100 via-red-50 to-orange-50 mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-16 h-16 text-rose-600 flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-black text-rose-900 mb-4">⚠️ CRITICAL DISCLAIMER ⚠️</h2>
                <div className="space-y-3 text-rose-800 text-lg font-bold">
                  <p>🎓 EDUCATIONAL, RESEARCH & DEMONSTRATION PURPOSES ONLY</p>
                  <p>🚫 NOT A COMMERCIAL SERVICE - NO FINANCIAL TRANSACTIONS</p>
                  <p>🚨 NOT INVESTMENT ADVICE - CONSULT LICENSED PROFESSIONALS</p>
                  <p>💼 ALL TRADING IS SIMULATED - LEARNING TOOL ONLY</p>
                  <p>⚖️ USE AT YOUR OWN RISK - NO LIABILITY FOR INVESTMENT DECISIONS</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg border-2 border-rose-300 mt-6">
              <p className="text-center text-rose-900 font-bold text-xl">
                READ THIS ENTIRE DISCLAIMER BEFORE USING STOCKSIGNAL
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                1. Educational Platform - Not Investment Advice or Commercial Service
              </h2>
              <div className="space-y-3 text-slate-700">
                <p className="text-lg font-bold text-blue-900 mb-3">
                  STOCKSIGNAL IS A PORTFOLIO MANAGEMENT AND FINANCIAL ANALYTICS TOOL DEVELOPED EXCLUSIVELY FOR EDUCATIONAL, RESEARCH, AND DEMONSTRATION PURPOSES.
                </p>
                <p className="mt-4"><strong>Platform Purpose:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Educational Learning:</strong> Teach investment concepts, portfolio theory, and risk management</li>
                  <li><strong>Academic Research:</strong> Support research and study of financial markets and analytics</li>
                  <li><strong>Portfolio Practice:</strong> Provide a safe environment to practice portfolio management skills</li>
                  <li><strong>Demonstration Tool:</strong> Showcase AI-driven financial analytics and simulation techniques</li>
                </ul>
                <p className="mt-4"><strong>This platform is NOT:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Investment Advice:</strong> Does not provide personalized financial recommendations or guidance</li>
                  <li><strong>Commercial Service:</strong> Not intended for commercial use or monetary transactions</li>
                  <li><strong>Financial Institution:</strong> Not a broker, advisor, bank, or regulated financial entity</li>
                  <li><strong>Professional Service:</strong> Does not replace consultation with licensed financial advisors</li>
                  <li><strong>Self-Employment Platform:</strong> Not for operating a business or generating income</li>
                  <li><strong>Transactional System:</strong> Does not process real money or execute actual securities trades</li>
                </ul>
                <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300 mt-4">
                  <p className="font-semibold text-amber-900">
                    ⚠️ All content, analyses, suggestions, and information are provided for educational demonstration only. DO NOT make real-world investment decisions based solely on this platform. Always consult licensed financial professionals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Educational Simulation - No Financial Transactions</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold text-lg text-blue-900">StockSignal operates exclusively as an educational portfolio simulation platform:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li><strong>100% Virtual Practice:</strong> All trading uses simulated currency with zero real monetary value</li>
                  <li><strong>No Financial Transactions:</strong> Platform does not process payments, accept money, or handle funds</li>
                  <li><strong>No Real Securities:</strong> No actual stocks, ETFs, or assets are bought, sold, or held</li>
                  <li><strong>Educational Purpose:</strong> Designed exclusively for learning portfolio management and investment concepts</li>
                  <li><strong>Risk-Free Learning:</strong> Safe environment to practice without financial consequences</li>
                  <li><strong>Non-Commercial:</strong> Not a business, commercial service, or income-generating activity</li>
                  <li><strong>Not a Broker:</strong> Not a registered broker-dealer, financial institution, or investment company</li>
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
                  <p className="text-blue-900 font-bold">
                    🎓 Academic Purpose: This platform serves as a learning and research tool for understanding portfolio analytics, market dynamics, and investment strategies in a controlled educational environment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. AI-Generated Content Limitations</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold">Our platform uses Artificial Intelligence (AI) to generate analyses and suggestions. Users must understand:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li><strong>AI Can Make Errors:</strong> AI models may produce inaccurate, incomplete, or misleading information</li>
                  <li><strong>Hallucinations Possible:</strong> AI may generate plausible-sounding but factually incorrect content</li>
                  <li><strong>Not Professional Advice:</strong> AI outputs are NOT equivalent to advice from licensed professionals</li>
                  <li><strong>Outdated Information:</strong> AI analysis may not reflect the most current market conditions or events</li>
                  <li><strong>No Guarantee of Accuracy:</strong> We do not warrant the accuracy, completeness, or reliability of AI-generated content</li>
                  <li><strong>Independent Verification Required:</strong> Always verify AI-generated information through independent research</li>
                </ul>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
                  <p className="text-purple-900 font-semibold">
                    🤖 AI is a learning tool, not a financial advisor. Treat all AI outputs as educational examples only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Investment Risks Disclosure</h2>
              <div className="space-y-3 text-slate-700">
                <p className="text-lg font-bold text-rose-700 mb-3">
                  INVESTING IN SECURITIES INVOLVES SUBSTANTIAL RISK AND MAY RESULT IN COMPLETE LOSS OF CAPITAL.
                </p>
                <p><strong>Important Risk Factors:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Market Risk:</strong> Securities prices fluctuate; you may lose some or all of your investment</li>
                  <li><strong>No Guarantees:</strong> Past performance does NOT indicate future results</li>
                  <li><strong>Volatility:</strong> Markets can be highly volatile and unpredictable</li>
                  <li><strong>Economic Factors:</strong> Economic conditions, interest rates, and geopolitical events affect investments</li>
                  <li><strong>Company-Specific Risks:</strong> Individual companies may fail or underperform</li>
                  <li><strong>Liquidity Risk:</strong> Some investments may be difficult to sell quickly</li>
                  <li><strong>Currency Risk:</strong> International investments are subject to currency fluctuations</li>
                </ul>
                <div className="bg-rose-50 p-4 rounded-lg border-2 border-rose-300 mt-4">
                  <p className="font-bold text-rose-900">
                    ⚠️ Only invest money you can afford to lose. Never invest based solely on information from this platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Simulated vs. Real Trading Results</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold">Paper trading results DO NOT represent actual trading and have significant limitations:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li><strong>No Real Market Impact:</strong> Simulated trades don't affect real market prices or liquidity</li>
                  <li><strong>Instant Execution:</strong> Real trades may have delays, slippage, and partial fills</li>
                  <li><strong>No Emotional Factors:</strong> Virtual money doesn't trigger real fear, greed, or panic</li>
                  <li><strong>No Real Costs:</strong> Missing commissions, fees, taxes, and spread costs</li>
                  <li><strong>Perfect Information:</strong> Assumes data is accurate and available instantly</li>
                  <li><strong>Hindsight Bias:</strong> Easy to "succeed" in simulation without real consequences</li>
                </ul>
                <p className="font-semibold mt-4 text-amber-800">
                  Simulated performance is NOT indicative of actual trading results. Real trading is significantly more difficult.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Data Accuracy and Timeliness</h2>
              <div className="space-y-3 text-slate-700">
                <p>We strive to provide accurate market data, but:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>No Warranty:</strong> We do not guarantee data accuracy, completeness, or timeliness</li>
                  <li><strong>Delayed Data:</strong> Market data may be delayed by 15-20 minutes or more</li>
                  <li><strong>Third-Party Sources:</strong> Data comes from external APIs (Yahoo Finance, etc.) which may contain errors</li>
                  <li><strong>Outages Possible:</strong> Data feeds may become temporarily unavailable</li>
                  <li><strong>Not Real-Time:</strong> Platform does not provide real-time professional trading data</li>
                </ul>
                <p className="font-semibold mt-3">
                  Always verify critical information through official sources before making real investment decisions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. No Regulatory Registration</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold">StockSignal is NOT registered with any financial regulatory authority:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>NOT registered with the U.S. Securities and Exchange Commission (SEC)</li>
                  <li>NOT registered with the Financial Industry Regulatory Authority (FINRA)</li>
                  <li>NOT a Registered Investment Advisor (RIA)</li>
                  <li>NOT a licensed broker-dealer</li>
                  <li>NOT subject to financial regulatory oversight</li>
                  <li>NOT required to meet fiduciary standards</li>
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                  <p className="text-blue-900 font-semibold">
                    If you need regulated financial services, please consult a licensed, registered financial professional.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Limitation of Liability</h2>
              <div className="space-y-3 text-slate-700">
                <p className="text-lg font-bold text-rose-700 mb-3">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, STOCKSIGNAL AND ITS DEVELOPERS DISCLAIM ALL LIABILITY FOR ANY DAMAGES ARISING FROM USE OF THIS PLATFORM.
                </p>
                <p><strong>We are NOT liable for:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Financial losses from investment decisions</li>
                  <li>Damages from AI errors or inaccurate information</li>
                  <li>Loss of profits or opportunities</li>
                  <li>Data errors, delays, or outages</li>
                  <li>Service interruptions or platform downtime</li>
                  <li>Third-party service failures</li>
                  <li>Security breaches or unauthorized access</li>
                  <li>Any indirect, incidental, special, or consequential damages</li>
                </ul>
                <div className="bg-rose-100 p-4 rounded-lg border-2 border-rose-300 mt-4">
                  <p className="font-bold text-rose-900">
                    YOU USE THIS PLATFORM ENTIRELY AT YOUR OWN RISK AND ACCEPT FULL RESPONSIBILITY FOR ALL CONSEQUENCES.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. User Responsibilities</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold">By using StockSignal, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Conduct Independent Research:</strong> Perform your own due diligence before any real investment</li>
                  <li><strong>Consult Professionals:</strong> Seek advice from licensed financial advisors for personal situations</li>
                  <li><strong>Verify Information:</strong> Independently confirm all data and analyses</li>
                  <li><strong>Accept Risk:</strong> Understand and accept all investment risks</li>
                  <li><strong>No Reliance:</strong> Not rely solely on this platform for investment decisions</li>
                  <li><strong>Educational Use:</strong> Use the platform for learning purposes only</li>
                  <li><strong>Understand Limitations:</strong> Recognize simulation limitations vs. real trading</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Forward-Looking Statements</h2>
              <div className="space-y-3 text-slate-700">
                <p>Any projections, forecasts, or forward-looking statements on this platform:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Are based on assumptions that may prove incorrect</li>
                  <li>Involve known and unknown risks and uncertainties</li>
                  <li>Are NOT guarantees of future performance</li>
                  <li>Should not be relied upon for investment decisions</li>
                  <li>May differ materially from actual results</li>
                </ul>
                <p className="font-semibold mt-3">
                  Future market conditions are inherently unpredictable.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Tax and Legal Considerations</h2>
              <div className="space-y-3 text-slate-700">
                <p>This platform does NOT provide:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tax advice or guidance</li>
                  <li>Legal advice or recommendations</li>
                  <li>Accounting services</li>
                  <li>Estate planning advice</li>
                </ul>
                <p className="font-semibold mt-3">
                  Consult qualified tax and legal professionals for personal situations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. STEM OPT and Immigration Compliance</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold text-lg">For International Students and STEM OPT Participants:</p>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-3">
                  <p className="font-semibold text-blue-900 mb-2">
                    ✅ This platform is designed to comply with STEM OPT regulations:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-blue-900">
                    <li>Platform is for <strong>educational and research purposes only</strong></li>
                    <li><strong>No commercial activity</strong> or business operations are conducted</li>
                    <li><strong>No financial transactions</strong> or monetary services are provided</li>
                    <li>Does <strong>not constitute self-employment</strong> or unauthorized work</li>
                    <li>Serves as an <strong>academic learning tool</strong> for portfolio management education</li>
                  </ul>
                </div>
                <p className="mt-4 font-semibold text-amber-800">
                  ⚠️ Important: If you are on STEM OPT or any visa status, ensure your use of this platform complies with all applicable immigration regulations. Consult an immigration attorney if you have questions about permissible educational activities.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. No Endorsements</h2>
              <div className="space-y-3 text-slate-700">
                <p>Mention of specific companies, securities, or investment products does NOT constitute:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Endorsement or recommendation to buy or sell</li>
                  <li>Suggestion that any security is suitable for any investor</li>
                  <li>Opinion on valuation or future performance</li>
                  <li>Professional investment analysis or guidance</li>
                </ul>
                <p className="mt-3 font-semibold">All company names, tickers, and analyses are used exclusively for educational demonstration and learning purposes.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-300 shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. User Acknowledgment and Agreement</h2>
              <div className="space-y-3 text-slate-700">
                <p className="text-lg font-bold mb-3">BY USING STOCKSIGNAL, YOU EXPLICITLY ACKNOWLEDGE AND AGREE THAT:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You have read and understood this entire disclaimer</li>
                  <li>This platform is for <strong>educational, research, and demonstration purposes ONLY</strong></li>
                  <li>This is <strong>NOT a commercial service</strong> and involves no real financial transactions</li>
                  <li>All trading is simulated with virtual money for learning purposes</li>
                  <li>No investment advice, financial guidance, or monetary services are provided</li>
                  <li>AI-generated content may contain errors and is not professional advice</li>
                  <li>You will NOT use this platform for commercial purposes or self-employment</li>
                  <li>You accept all risks if you choose to make real-world investments</li>
                  <li>You are solely responsible for your investment decisions</li>
                  <li>You will consult licensed financial professionals before investing real money</li>
                  <li>We disclaim all liability for any losses or damages</li>
                  <li>Simulated results do not represent real trading outcomes</li>
                  <li>This platform complies with educational use requirements for STEM OPT and visa holders</li>
                </ul>
                <div className="bg-rose-100 p-4 rounded-lg border-2 border-rose-300 mt-4">
                  <p className="text-center text-rose-900 font-bold text-lg">
                    IF YOU DO NOT AGREE WITH THESE TERMS, DO NOT USE THIS PLATFORM.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Questions or Concerns?</h2>
              <p className="text-slate-700 mb-3">
                If you have questions about this disclaimer or need clarification, please contact:
              </p>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-blue-600 font-semibold text-lg">support@stocksignal.com</p>
                <p className="text-sm text-slate-600 mt-2">StockSignal Support Team</p>
                <p className="text-sm text-slate-600">Educational Portfolio Management Platform</p>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Last Updated: December 26, 2025
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
