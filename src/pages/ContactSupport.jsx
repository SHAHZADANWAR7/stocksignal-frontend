import React, { useState } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, ShieldCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Updated to match your verified 'support@stocksignal.io' identity
      await awsApi.sendEmail({
        to: "support@stocksignal.io", 
        subject: formData.subject || "New Support Inquiry",
        body: formData.message,
        from_name: formData.name,
        userEmail: formData.email // This triggers the 'Reply-To' logic in your Lambda
      });
      
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Support Submission Error:", error);
      alert("System temporarily unavailable. Please email support@stocksignal.io directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 lg:p-24 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* Left Side: Industrial Context */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-8"
        >
          <div>
            <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Priority Support
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Have a technical question or need assistance with your portfolio? Our engineering team is standing by.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-blue-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Rapid Response</h4>
                <p className="text-sm text-slate-500">Typical response time: Under 12 hours.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-emerald-100 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Secure Handling</h4>
                <p className="text-sm text-slate-500">Your data is encrypted via AWS SES industrial protocols.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: The Form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-none shadow-2xl bg-white overflow-hidden">
                  <div className="h-2 bg-emerald-500" />
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Message Logged</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                      We have received your request. A confirmation has been sent to your inbox, and a specialist will review your case shortly.
                    </p>
                    <Button
                      onClick={() => setSubmitted(false)}
                      variant="outline"
                      className="border-slate-200 hover:bg-slate-50 text-slate-600 px-8"
                    >
                      Return to Form
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 bg-white border-none">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-bold text-slate-800">Submit a Request</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                          <Input
                            required
                            className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Kevin Pieterson"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                          <Input
                            required
                            type="email"
                            className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="kevin@yahoo.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
                        <Input
                          required
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="How can we assist you today?"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Inquiry Details</label>
                        <Textarea
                          required
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-all min-h-[150px] resize-none"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Please provide as much detail as possible..."
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white transition-all duration-300 rounded-lg flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span className="font-bold uppercase tracking-widest text-sm">Initialize Support Ticket</span>
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="mt-8 text-center text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
            StockSignal Industrial Support Infrastructure v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
