import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-slate-600">Last Updated: December 26, 2025</p>
          <p className="text-slate-600 mt-2">Effective Date: December 26, 2025</p>
        </motion.div>

        <Card className="border-2 border-blue-300 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Lock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-3">Your Privacy Matters</h2>
                <p className="text-blue-800">
                  StockSignal ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational portfolio management and financial analytics platform.
                </p>
                <p className="text-blue-800 mt-3 font-semibold">
                  🎓 This platform is designed exclusively for <strong>educational, research, and demonstration purposes</strong>. We do not process financial transactions or operate as a commercial service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-600" />
                1. Information We Collect
              </h2>
              <div className="space-y-4 text-slate-700">
                <div>
                  <h3 className="font-bold text-lg mb-2">1.1 Personal Information You Provide</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Information:</strong> Name, email address, password</li>
                    <li><strong>Profile Information:</strong> Optional information you choose to provide</li>
                    <li><strong>Communications:</strong> Messages, feedback, or support requests you send us</li>
                  </ul>
                  <p className="text-sm text-blue-700 mt-3 font-semibold">
                    ℹ️ Note: We do not collect payment information as this is an educational platform with no financial transactions.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">1.2 Usage Information We Collect Automatically</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                    <li><strong>Cookies:</strong> Session data and preferences (see Cookie Policy below)</li>
                    <li><strong>Performance Data:</strong> Error logs, crash reports for service improvement</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">1.3 Educational Portfolio Data (Non-Financial)</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Practice Trading Records:</strong> Simulated trades using virtual currency for learning</li>
                    <li><strong>Analysis History:</strong> AI-generated educational analyses for research purposes</li>
                    <li><strong>Learning Goals & Preferences:</strong> Educational objectives and portfolio practice preferences</li>
                    <li><strong>Usage Metrics:</strong> Weekly usage limits for educational features (analyses, premium actions)</li>
                  </ul>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 mt-3">
                    <p className="text-sm font-semibold text-emerald-900">
                      ✅ All portfolio data is 100% simulated for educational purposes. No real money, actual investments, or financial transactions are involved.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-3 text-slate-700">
                <p>We use collected information for the following educational and research purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Educational Services:</strong> Enable access to learning features, simulations, and analytics tools</li>
                  <li><strong>Personalization:</strong> Customize educational experience based on learning preferences</li>
                  <li><strong>Communication:</strong> Send platform updates, educational content, support responses</li>
                  <li><strong>Usage Tracking:</strong> Monitor weekly usage limits for fair access to educational resources</li>
                  <li><strong>Platform Improvement:</strong> Analyze usage patterns to enhance educational functionality</li>
                  <li><strong>Security:</strong> Protect platform integrity and prevent abuse</li>
                  <li><strong>Research:</strong> Aggregate anonymized data for academic research and platform development</li>
                  <li><strong>Legal Compliance:</strong> Fulfill legal obligations and enforce educational use policies</li>
                </ul>
                <p className="text-sm text-blue-700 mt-3 font-semibold">
                  ℹ️ We do not process payments or financial transactions as this is a non-commercial educational platform.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Share Your Information</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-semibold">We do NOT sell your personal information to third parties.</p>
                <p className="mt-3">We may share information in the following limited circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> Trusted third parties who help operate our educational platform (e.g., hosting, analytics)</li>
                  <li><strong>AI Services:</strong> Anonymous data may be processed by AI providers for educational analysis generation</li>
                  <li><strong>Market Data Providers:</strong> For retrieving educational market information (no personal data shared)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                  <li><strong>Platform Transfers:</strong> In event of merger, acquisition, or asset sale</li>
                  <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
                </ul>
                <p className="text-sm text-blue-700 mt-3 font-semibold">
                  ℹ️ Note: We do not share data with payment processors as this platform does not process financial transactions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-blue-600" />
                4. Data Security
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>We implement industry-standard security measures to protect your data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Encryption:</strong> Data transmitted using SSL/TLS encryption</li>
                  <li><strong>Secure Storage:</strong> Passwords hashed, sensitive data encrypted at rest</li>
                  <li><strong>Access Controls:</strong> Restricted access to personal information</li>
                  <li><strong>Regular Audits:</strong> Security reviews and updates</li>
                </ul>
                <p className="mt-3 font-semibold text-amber-700">
                  However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Your Rights (GDPR Compliance)</h2>
              <div className="space-y-3 text-slate-700">
                <p>If you are in the European Economic Area (EEA), you have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your data</li>
                  <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Right to Object:</strong> Oppose processing of your data for certain purposes</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at: <strong className="text-blue-600">support@stocksignal.com</strong>
                </p>
                <p className="text-sm mt-2">We will respond within 30 days as required by GDPR.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookie Policy</h2>
              <div className="space-y-3 text-slate-700">
                <p>We use cookies and similar technologies to enhance user experience:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for platform functionality (login sessions)</li>
                  <li><strong>Analytics Cookies:</strong> Track usage patterns to improve services</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="mt-3">You can control cookies through your browser settings, but disabling them may affect platform functionality.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Data Retention</h2>
              <div className="space-y-3 text-slate-700">
                <p>We retain your information for as long as necessary to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide you with services</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
                <p className="mt-3">When you delete your account, we will delete or anonymize your personal data within 90 days, except as required by law.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Third-Party Services</h2>
              <div className="space-y-3 text-slate-700">
                <p>Our educational platform integrates with third-party services:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>AWS Amplify:</strong> Platform hosting and backend infrastructure</li>
                  <li><strong>AI Providers:</strong> For educational analysis generation (data anonymized)</li>
                  <li><strong>Yahoo Finance API:</strong> For market data used in educational demonstrations (no personal info shared)</li>
                  <li><strong>Email Services:</strong> For platform communications and support</li>
                </ul>
                <p className="mt-3">These services have their own privacy policies. We recommend reviewing them.</p>
                <p className="text-sm text-blue-700 mt-3 font-semibold">
                  ℹ️ We do not integrate with payment processors as this platform does not handle financial transactions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Children's Privacy</h2>
              <div className="space-y-3 text-slate-700">
                <p className="font-semibold">
                  StockSignal is NOT intended for children under 18 years of age.
                </p>
                <p>We do not knowingly collect personal information from children under 18. If you believe we have collected information from a child, please contact us immediately, and we will delete it.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. International Data Transfers</h2>
              <div className="space-y-3 text-slate-700">
                <p>Your information may be transferred to and processed in countries outside your country of residence, including the United States.</p>
                <p>We ensure appropriate safeguards are in place for international transfers, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                  <li>Adequacy decisions by relevant data protection authorities</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. California Privacy Rights (CCPA)</h2>
              <div className="space-y-3 text-slate-700">
                <p>If you are a California resident, you have additional rights:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Right to Know:</strong> What personal information we collect, use, and share</li>
                  <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                  <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information (we do not sell data)</li>
                  <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
                </ul>
                <p className="mt-3">Contact us to exercise these rights: <strong className="text-blue-600">support@stocksignal.com</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Email Communications & Opt-Out</h2>
              <div className="space-y-3 text-slate-700">
                <p>We may send you:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Emails:</strong> Account updates, security alerts (cannot opt-out)</li>
                  <li><strong>Marketing Emails:</strong> Newsletters, feature updates (can opt-out)</li>
                </ul>
                <p className="mt-3">To unsubscribe from marketing emails, click the "Unsubscribe" link in any email or update preferences in your account settings.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Changes to This Privacy Policy</h2>
              <div className="space-y-3 text-slate-700">
                <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.</p>
                <p className="font-semibold">Material changes will be notified via email or prominent notice on the platform.</p>
                <p>Your continued use after changes constitutes acceptance of the updated policy.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-300 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-green-600" />
                Contact Us About Privacy
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:</p>
                <div className="bg-white p-4 rounded-lg border border-green-200 mt-3">
                  <p className="font-semibold text-slate-900">Data Controller</p>
                  <p className="text-slate-900 mt-1">StockSignal Team</p>
                  <p className="text-blue-600 font-semibold mt-2">support@stocksignal.com</p>
                  <p className="text-sm text-slate-600 mt-2">StockSignal - Investment Learning Platform</p>
                </div>
                <p className="text-sm mt-4">We will respond to your inquiry within 30 days as required by applicable privacy laws.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
