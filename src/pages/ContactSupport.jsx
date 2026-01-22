import React, { useState } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

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
      await awsApi.sendEmail({
        to: "support@stocksignal.com",
        subject: `Support Request: ${formData.subject}`,
        body: `
          <h2>Support Request from ${formData.name}</h2>
          <p><strong>From:</strong> ${formData.email}</p>
          <p><strong>Subject:</strong> ${formData.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${formData.message.replace(/\n/g, '<br>')}</p>
        `,
        from_name: "StockSignal Support"
      });
      
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      alert("Failed to send message. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Contact Support</h1>
          </div>
          <p className="text-lg text-slate-600">
            Have questions? We're here to help!
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-emerald-300 bg-emerald-50 shadow-xl">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                  Message Sent!
                </h2>
                <p className="text-emerald-700 mb-6">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="border-2 border-slate-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Your Name
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subject
                  </label>
                  <Input
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Message
                  </label>
                  <Textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what's on your mind..."
                    className="h-32"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            You can also reach us directly at{" "}
            <a href__="mailto:support@stocksignal.com" className="text-blue-600 hover:underline font-semibold">
              support@stocksignal.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
