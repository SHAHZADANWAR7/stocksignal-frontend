import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, ScrollText } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
          </div>
          <p className="text-slate-600">Last Updated: December 26, 2025</p>
        </motion.div>

        <Card className="border-2 border-rose-300 shadow-xl bg-gradient-to-br from-rose-50 to-red-50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-rose-900 mb-3">CRITICAL DISCLAIMERS</h2>
                <div className="space-y-2 text-rose-800">
                  <p className="font-semibold">⚠️ EDUCATIONAL, RESEARCH & DEMONSTRATION PURPOSES ONLY</p>
                  <p className="font-semibold">⚠️ NOT A COMMERCIAL SERVICE - NO REAL MONEY INVOLVED</p>
                  <p className="font-semibold">⚠️ NOT INVESTMENT ADVICE - CONSULT LICENSED PROFESSIONALS</p>
                  <p className="font-semibold">⚠️ NO FINANCIAL TRANSACTIONS OR MONETARY SERVICES PROVIDED</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                1. Educational & Non-Commercial Nature
              </h2>
              <div className="space-y-3 text-slate-700">
                <p className="text-lg font-bold text-blue-900 mb-3">
                  StockSignal is a portfolio management and financial analytics tool developed exclusively for <strong>educational, research, and demonstration purposes</strong>.
                </p>
                <p><strong>This platform is:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Educational Tool:</strong> Designed for learning investment concepts and portfolio management strategies</li>
                  <li><strong>Research Platform:</strong> For academic exploration and analysis of financial markets</li>
                  <li><strong>Demonstration System:</strong> To showcase portfolio analytics and AI-driven insights</li>
                  <li><strong>Non-Commercial:</strong> NOT intended for commercial use, monetary gain, or business operations</li>
                  <li><strong>Simulation-Based:</strong> All trading is simulated using virtual currency only</li>
                </ul>
                <p className="mt-4"><strong>This platform does NOT:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Process Financial Transactions:</strong> No real money is accepted, managed, or invested</li>
                  <li><strong>Provide Investment Advice:</strong> Not financial advice, recommendations, or guidance</li>
                  <li><strong>Operate Commercially:</strong> Not a for-profit business or commercial service</li>
                  <li><strong>Constitute Self-Employment:</strong> Platform is for educational practice only</li>
                  <li><strong>Execute Real Trades:</strong> No actual securities are bought, sold, or held</li>
                  <li><strong>Require Regulatory Registration:</strong> Not a registered investment advisor, broker-dealer, or financial institution</li>
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
                  <p className="font-bold text-blue-900">
                    🎓 Purpose Statement: This platform serves as an educational resource for students, researchers, and individuals learning about portfolio management and financial analytics. All features are designed for academic and demonstration purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. No Investment Advice</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-semibold text-rose-700">
                  NOTHING ON THIS PLATFORM CONSTITUTES INVESTMENT ADVICE OR A RECOMMENDATION TO BUY OR SELL ANY SECURITY.
                </p>
                <p>All content, analysis, suggestions, and information provided are:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>For <strong>educational demonstration purposes only</strong></li>
                  <li><strong>Not personalized</strong> to your individual financial situation</li>
                  <li><strong>Not guaranteed to be accurate, complete, or current</strong></li>
                  <li><strong>Generated by AI</strong> which may produce errors or hallucinations</li>
                  <li>Should <strong>NEVER be relied upon for actual investment decisions</strong></li>
                </ul>
                <p className="font-semibold mt-4">
                  Before making any real investment decisions, consult with a qualified, licensed financial advisor who understands your specific circumstances.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Risk Disclosure</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-semibold text-amber-700">
                  INVESTING IN SECURITIES INVOLVES SUBSTANTIAL RISK OF LOSS.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You may lose some or all of your invested capital</li>
                  <li>Past performance does NOT guarantee future results</li>
                  <li>Historical returns are NOT indicative of future performance</li>
                  <li>Simulated or hypothetical trading results have inherent limitations</li>
                  <li>Paper trading results DO NOT represent actual trading and may not reflect real market conditions</li>
                  <li>Market conditions can change rapidly and unpredictably</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. AI-Generated Content Disclaimer</h2>
              <div className="space-y-3 text-slate-700">
                <p>This platform uses Artificial Intelligence (AI) to generate analysis, commentary, and suggestions. Users acknowledge that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>AI can make mistakes, produce "hallucinations," or generate incorrect information</strong></li>
                  <li>AI analysis is <strong>NOT professional financial advice</strong></li>
                  <li>AI outputs should be <strong>independently verified</strong> before any use</li>
                  <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
                  <li>AI analysis may not reflect current market conditions or recent events</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Accuracy and Timeliness</h2>
              <div className="space-y-3 text-slate-700">
                <p>While we use Yahoo Finance APIs and other data sources:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>We do NOT guarantee data accuracy</strong></li>
                  <li>Market data may be <strong>delayed or contain errors</strong></li>
                  <li>Stock prices and financial metrics may not reflect real-time conditions</li>
                  <li>Users should verify all data independently before making decisions</li>
                  <li>We are not responsible for data provider errors or outages</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. No Liability</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-semibold text-rose-700">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, STOCKSIGNAL AND ITS DEVELOPERS DISCLAIM ALL LIABILITY.
                </p>
                <p>We are NOT liable for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Financial losses resulting from use of this platform</li>
                  <li>Investment decisions made based on information provided</li>
                  <li>Errors, inaccuracies, or omissions in content or data</li>
                  <li>Service interruptions, outages, or technical failures</li>
                  <li>Third-party data provider errors</li>
                  <li>AI-generated content inaccuracies or mistakes</li>
                  <li>Any direct, indirect, incidental, or consequential damages</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. User Responsibility</h2>
              <div className="space-y-3 text-slate-700">
                <p>By using StockSignal, you acknowledge and agree that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are solely responsible for your investment decisions</li>
                  <li>You will NOT rely on this platform for investment advice</li>
                  <li>You will conduct your own research and due diligence</li>
                  <li>You will consult licensed financial professionals before investing real money</li>
                  <li>You understand the difference between simulated and real trading</li>
                  <li>You accept all risks associated with securities investing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. No Financial Transactions or Commercial Activity</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-bold text-lg text-rose-700 mb-3">
                  STOCKSIGNAL DOES NOT PROCESS ANY FINANCIAL TRANSACTIONS OR ENGAGE IN COMMERCIAL ACTIVITIES.
                </p>
                <p><strong>Specifically, this platform does NOT:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Accept, manage, hold, or invest real money or assets</li>
                  <li>Execute real securities, stock, ETF, or cryptocurrency transactions</li>
                  <li>Process payments for investment purposes</li>
                  <li>Operate as a registered investment company, fund, or financial institution</li>
                  <li>Provide discretionary portfolio management or wealth management services</li>
                  <li>Facilitate commercial transactions between users or third parties</li>
                  <li>Generate revenue from investment activities or user trading</li>
                  <li>Constitute a business, self-employment, or commercial enterprise</li>
                </ul>
                <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-300 mt-4">
                  <p className="font-bold text-emerald-900">
                    ✅ All trading is 100% simulated using virtual currency for educational practice only. No real financial value is involved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Regulatory Compliance</h2>
              <div className="space-y-3 text-slate-700">
                <p>This platform:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Is NOT registered with the SEC, FINRA, or any regulatory body</li>
                  <li>Does NOT operate under securities regulations</li>
                  <li>Is NOT subject to investment advisor regulations</li>
                  <li>Does NOT provide services requiring licensing</li>
                </ul>
                <p className="mt-3 font-semibold">
                  If you require regulated financial services, please contact a licensed financial professional.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Acceptable Use Policy</h2>
              <div className="space-y-3 text-slate-700">
                <p><strong>Users agree to use StockSignal only for:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Personal educational learning and skill development</li>
                  <li>Academic research and study purposes</li>
                  <li>Demonstration and exploration of portfolio analytics</li>
                  <li>Practice simulations in a risk-free environment</li>
                </ul>
                <p className="mt-4"><strong>Users agree NOT to use StockSignal for:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Commercial purposes or business operations</li>
                  <li>Providing investment advice to others for compensation</li>
                  <li>Self-employment or income-generating activities</li>
                  <li>Operating a financial advisory service</li>
                  <li>Any activity that violates STEM OPT or visa regulations (if applicable)</li>
                  <li>Any unlawful or unauthorized purpose</li>
                </ul>
                <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300 mt-4">
                  <p className="font-bold text-amber-900">
                    ⚠️ STEM OPT Compliance: International students on STEM OPT must ensure their use of this platform complies with all visa and employment authorization requirements. This platform is designed for educational purposes only and should not be used in any manner that constitutes unauthorized self-employment or commercial activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Modification and Termination</h2>
              <div className="space-y-3 text-slate-700">
                <p>We reserve the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Modify, suspend, or discontinue the service at any time</li>
                  <li>Update these Terms of Service without prior notice</li>
                  <li>Terminate user access for any reason</li>
                  <li>Change features or functionality</li>
                </ul>
                <p className="mt-3">
                  Your continued use of the platform constitutes acceptance of any modifications.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Indemnification</h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  You agree to indemnify and hold harmless StockSignal, its developers, and affiliates from any claims, damages, losses, or expenses arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use of the platform</li>
                  <li>Investment decisions made based on platform content</li>
                  <li>Violation of these Terms of Service or Acceptable Use Policy</li>
                  <li>Any breach of applicable laws or regulations</li>
                  <li>Unauthorized commercial use or self-employment activities</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Governing Law</h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-300 shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. User Acknowledgment</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-semibold text-lg">By using StockSignal, you explicitly acknowledge that you have read, understood, and agree to ALL terms above, including:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>This platform is for <strong>educational, research, and demonstration purposes ONLY</strong></li>
                  <li>This is <strong>NOT a commercial service</strong> and does not involve real financial transactions</li>
                  <li>No investment advice, financial guidance, or monetary services are provided</li>
                  <li>All trading is simulated for learning purposes only</li>
                  <li>You will NOT use this platform for commercial purposes or self-employment</li>
                  <li>You accept full responsibility for any real-world investment decisions</li>
                  <li>You understand the risks of securities investing</li>
                  <li>AI-generated content may contain errors and should not be relied upon</li>
                  <li>We disclaim all liability for losses or damages</li>
                  <li>You will consult licensed professionals before making real investments</li>
                </ul>
                <p className="mt-4 text-amber-800 font-semibold">
                  IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THIS PLATFORM.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Contact Information</h2>
              <p className="text-slate-700">
                For questions about these Terms of Service, please contact:
              </p>
              <p className="text-blue-600 font-semibold mt-2">
                support@stocksignal.com
              </p>
              <p className="text-xs text-slate-500 mt-4">
                StockSignal Support Team
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
