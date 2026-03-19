import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, TrendingUp, Calendar, CheckCircle, AlertCircle, Send, Loader2, Sparkles, Star, RefreshCw, ShieldCheck, Database } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    daily_alerts: false,
    weekly_summary: true,
    monthly_report: true,
  });
  const [newsletterData, setNewsletterData] = useState({
    email: "",
    frequency: "weekly",
    interests: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTriggering, setIsTriggering] = useState(""); // Tracks which button is loading

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSyncPortfolio = async () => {
    setIsSyncing(true);
    try {
      const result = await awsApi.syncPortfolio();
      alert(
        `Sync Complete! Updated ${result.portfolio.assets.length} assets. Total Value: $${result.portfolio.totalValue.toLocaleString()}`
      );
    } catch (error) {
      alert("Sync Failed: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadSettings = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const userEmail = localStorage.getItem("user_email");
      if (!userId) return;

      const currentUser = await awsApi.getUser(userId);
      setUser(currentUser);

      if (currentUser.newsletter_preferences) {
        setSettings(currentUser.newsletter_preferences);
        setNewsletterData((prev) => ({
          ...prev,
          email: userEmail || "",
          interests: currentUser.newsletter_preferences.interests || [],
        }));
      } else {
        setNewsletterData((prev) => ({
          ...prev,
          email: userEmail || "",
        }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = localStorage.getItem("user_id");

      const updatedPrefs = {
        ...settings,
        interests: newsletterData.interests,
      };

      await awsApi.updateUser(userId, {
        newsletter_preferences: updatedPrefs,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert("Error saving settings: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInterestToggle = (topic) => {
    setNewsletterData((prev) => ({
      ...prev,
      interests: prev.interests.includes(topic)
        ? prev.interests.filter((i) => i !== topic)
        : [...prev.interests, topic],
    }));
  };

  // Handles real lambda triggers for newsletter and notification manual dispatch/testing
 // Handles real lambda triggers for newsletter and notification manual dispatch/testing
  const handleManualTrigger = async (type) => {
    setIsTriggering(type);
    try {
      const userId = localStorage.getItem("user_id");
      
      // Industrial logic: Ensure we have the user ID before calling the cloud
      if (!userId) throw new Error("Terminal Session Expired: Please re-login.");

      switch (type) {
        case "daily":
          await awsApi.sendDailyAlert({ userId });
          break;
        case "weekly":
          await awsApi.sendWeeklySummary({ userId });
          break;
        case "monthly":
          await awsApi.sendMonthlyReport({ userId });
          break;
        case "newsletter":
          await awsApi.sendNewsletter({ userId, interests: newsletterData.interests });
          break;
        default:
          break;
      }
      
      // Success State Trigger
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error(`❌ System Error [${type}]:`, error.message);
      // We keep a single alert only for critical failures
      alert(`SYSTEM FAILURE: ${error.message}`);
    } finally {
      setIsTriggering("");
    }
  };

  // You may keep this legacy test preview for LLM/test email, or remove if not wanted anymore
  const handleSendTestEmail = async () => {
    if (newsletterData.interests.length === 0) {
      alert("Please select at least one topic of interest first.");
      return;
    }

    setIsSendingTest(true);
    try {
      const content = await awsApi.invokeLLM(
        `Generate a brief personalized financial newsletter for topics: ${newsletterData.interests.join(
          ", "
        )}. Include market overview and 2-3 insights per topic. Keep it concise.`,
        true
      );

      // Use class (not className) for all HTML in email!
      const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 StockSignal</h1>
      <p>Your ${newsletterData.frequency} Investment Digest</p>
    </div>
    <div class="content">
      ${typeof content === "string" ? content.replace(/\n/g, "<br>") : content}
    </div>
  </div>
</body>
</html>`;

      await awsApi.sendEmail({
        to: newsletterData.email,
        subject: `📈 Your ${newsletterData.frequency} StockSignal Digest - Test`,
        body: emailBody,
        from_name: "StockSignal",
      });

      alert("Test email sent! Check your inbox.");
    } catch (error) {
      alert("Error sending test email: " + error.message);
    }
    setIsSendingTest(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* INDUSTRIAL HEADER WITH FORCE SYNC */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              System Control
            </h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">
              v5.4 Notification & Data Management
            </p>
          </div>
          <Button
            onClick={handleSyncPortfolio}
            disabled={isSyncing}
            className="border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl h-14 px-8"
          >
            {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 w-5 h-5" />}
            FORCE PRICE SYNC
          </Button>
        </div>

        {/* How It Works Alert */}
        <Alert className="mb-8 border-4 border-slate-900 rounded-[2rem] bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <AlertDescription className="font-bold text-slate-700 ml-2">
            System operates on a strict privacy model. Your newsletter is generated locally via LLM and dispatched via SES. No 3rd party subscription trackers are active.
          </AlertDescription>
        </Alert>

        {/* Newsletter Subscription Card (with industrial styling) */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden bg-white mb-8">
          <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Bell className="w-7 h-7" />
              Newsletter Subscription
            </CardTitle>
            <p className="text-white/95 text-sm mt-2 font-medium">
              Personalize your investment newsletter preferences
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2">
                <Mail className="w-3 h-3" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={newsletterData.email}
                onChange={(e) =>
                  setNewsletterData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="your@email.com"
                className="h-12 text-base border-2 border-slate-200 focus:border-slate-900 rounded-xl font-bold"
              />
            </div>

            {/* Frequency Selection */}
            <div>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3" />
                Delivery Frequency
              </Label>
              <Select
                value={newsletterData.frequency}
                onValueChange={(value) =>
                  setNewsletterData((prev) => ({
                    ...prev,
                    frequency: value,
                  }))
                }
              >
                <SelectTrigger className="h-12 border-2 border-slate-900 bg-white text-slate-900 font-bold rounded-xl px-4 flex justify-between items-center shadow-sm">
                  <span className="uppercase text-xs tracking-widest font-black">
                    {newsletterData.frequency === "daily" ? "Daily Updates" : 
                     newsletterData.frequency === "weekly" ? "Weekly Digest" : 
                     newsletterData.frequency === "monthly" ? "Monthly Summary" : "Select Frequency"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-slate-900 rounded-xl shadow-xl">
                  <SelectItem value="daily" className="font-bold uppercase text-xs">Daily Updates</SelectItem>
                  <SelectItem value="weekly" className="font-bold uppercase text-xs">Weekly Digest</SelectItem>
                  <SelectItem value="monthly" className="font-bold uppercase text-xs">Monthly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Intelligence Focus Grid */}
            <div>
              <Label className="font-black uppercase text-[10px] text-slate-400 mb-4 block tracking-[0.2em]">
                Intelligence Focus Areas
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {["stocks", "crypto", "economy", "analysis", "news"].map((topic) => (
                  <div
                    key={topic}
                    onClick={() => handleInterestToggle(topic)}
                    className={`cursor-pointer p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                      newsletterData.interests.includes(topic)
                        ? "border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-900"
                    }`}
                  >
                    <span className="font-black uppercase text-[9px] tracking-widest">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t-2 border-slate-100 flex flex-col md:flex-row gap-4">
              <Button
                onClick={() => handleManualTrigger("newsletter")}
                disabled={isTriggering === "newsletter"}
                variant="outline"
                className="border-2 border-slate-900 font-black uppercase text-[10px] tracking-widest rounded-2xl h-12 flex-1 hover:bg-slate-50 transition-all active:scale-95"
              >
                {isTriggering === "newsletter" ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : saveSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4" /> DISPATCHED
                  </div>
                ) : (
                  <>
                    <Send className="mr-2 w-4 h-4" />
                    Dispatch Newsletter Now
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl h-12 flex-1 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : saveSuccess ? (
                  "Configuration Synced"
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* App Notifications Header */}
        <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter italic">
          System Triggers
        </h2>

        {/* Weekly Summary */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden mb-8 bg-white">
          <CardHeader className="bg-slate-900 text-white py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  Weekly Investor Summary
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleManualTrigger("weekly")}
                disabled={isTriggering === "weekly"}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase rounded-lg h-8 transition-all active:scale-95 shadow-sm"
              >
                {isTriggering === "weekly" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Test Dispatch"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <p className="text-[11px] font-bold text-slate-500 max-w-md uppercase tracking-tight leading-tight">
              Protocol: Portfolio Health, IQ score trends, and risk correlation updates every Monday morning.
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest ${!settings.weekly_summary ? 'text-slate-900' : 'text-slate-300'}`}>OFF</span>
              <Switch
                checked={!!settings.weekly_summary}
                onCheckedChange={() => toggleSetting("weekly_summary")}
                className="border-2 border-slate-900 data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-slate-200 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
              />
              <span className={`text-[10px] font-black uppercase tracking-widest ${settings.weekly_summary ? 'text-indigo-600' : 'text-slate-300'}`}>ON</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Report */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden mb-8 bg-white">
          <CardHeader className="bg-slate-900 text-white py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  Monthly Portfolio Report
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleManualTrigger("monthly")}
                disabled={isTriggering === "monthly"}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase rounded-lg h-8 transition-all active:scale-95 shadow-sm"
              >
                {isTriggering === "monthly" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Test Dispatch"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <p className="text-[11px] font-bold text-slate-500 max-w-md uppercase tracking-tight leading-tight">
              Audit: Comprehensive progress vs goals, drawdown summary, and achievement badges on the 1st.
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest ${!settings.monthly_report ? 'text-slate-900' : 'text-slate-300'}`}>OFF</span>
              <Switch
                checked={!!settings.monthly_report}
                onCheckedChange={() => toggleSetting("monthly_report")}
                className="border-2 border-slate-900 data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-slate-200 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
              />
              <span className={`text-[10px] font-black uppercase tracking-widest ${settings.monthly_report ? 'text-purple-600' : 'text-slate-300'}`}>ON</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Alerts */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2.5rem] overflow-hidden mb-8 bg-white">
          <CardHeader className="bg-slate-900 text-white py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  Daily Critical Alerts
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleManualTrigger("daily")}
                disabled={isTriggering === "daily"}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase rounded-lg h-8 transition-all active:scale-95 shadow-sm"
              >
                {isTriggering === "daily" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Test Dispatch"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <p className="text-[11px] font-bold text-slate-500 max-w-md uppercase tracking-tight leading-tight">
              On Demand: High-priority alerts triggered by significant risk increases or goal drift detected.
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest ${!settings.daily_alerts ? 'text-slate-900' : 'text-slate-300'}`}>OFF</span>
              <Switch
                checked={!!settings.daily_alerts}
                onCheckedChange={() => toggleSetting("daily_alerts")}
                className="border-2 border-slate-900 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-200 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
              />
              <span className={`text-[10px] font-black uppercase tracking-widest ${settings.daily_alerts ? 'text-amber-600' : 'text-slate-300'}`}>ON</span>
            </div>
          </CardContent>
        </Card>

        {/* End of System Configuration */}
        <div className="mt-8 flex items-center justify-center p-6 border-t-4 border-slate-900/10">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            End of System Configuration — Terminal v5.4
          </p>
        </div>
      </div>
    </div>
  );
}
