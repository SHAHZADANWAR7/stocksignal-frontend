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
import { Bell, Mail, TrendingUp, Calendar, CheckCircle, AlertCircle, Send, Loader2, Sparkles, Star, RefreshCw, ShieldCheck, Database, Zap } from "lucide-react";
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
      console.log("📡 [System] Initializing User Configuration...");
      const currentUser = await awsApi.getUser();

      if (!currentUser) {
        console.warn("⚠️ User not found in database.");
        return;
      }

      // Safeguard: Extract email and ID from whatever field the DB uses
      const userEmail = currentUser.email || currentUser.userEmail || "";
      const userId = currentUser.cognito_sub || currentUser.userId || currentUser.sub;
      
      setUser({ ...currentUser, email: userEmail, userId: userId });

      if (currentUser.newsletter_preferences) {
        setSettings(currentUser.newsletter_preferences);
        setNewsletterData({
          email: userEmail,
          interests: currentUser.newsletter_preferences.interests || [],
          frequency: currentUser.newsletter_preferences.frequency || 'weekly'
        });
      } else {
        setNewsletterData((prev) => ({ ...prev, email: userEmail }));
      }
      
      console.log("✅ [System] Configuration loaded for:", userEmail);
    } catch (error) {
      console.error("❌ Error loading settings:", error);
    }
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare the payload using current state
      const updatedPrefs = {
        ...settings,
        interests: newsletterData.interests,
        frequency: newsletterData.frequency
      };

      // awsClient.js handles the ID injection, so we just send the data
      await awsApi.updateUser({
        newsletter_preferences: updatedPrefs,
      });

      console.log("💾 [System] Remote configuration synchronized.");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("❌ Save Failed:", error.message);
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
  const handleManualTrigger = async (type) => {
    // Industrial validation: Check interests before dispatching newsletter
    if (type === "newsletter" && (!newsletterData.interests || newsletterData.interests.length === 0)) {
      alert("TERMINAL ERROR: No Intelligence Focus Areas selected for Newsletter dispatch.");
      return;
    }

    setIsTriggering(type);
    try {
      console.log(`📡 [System] Manual Protocol Override: ${type.toUpperCase()}`);

      /**
       * PAYLOAD SANITIZATION
       * We pull the IDs from the 'user' state loaded via DynamoDB.
       * Your awsClient.js will wrap this entire object into a 'payload' key.
       */
      const payload = { 
        userId: user?.cognito_sub || user?.userId, // Map both naming possibilities
        userEmail: newsletterData.email,           // Explicitly pass email for Lambda validation
        interests: newsletterData.interests,
        frequency: newsletterData.frequency 
      };

      console.log(`🛠️ [System] Dispatch Payload Check:`, payload);

      // Execute via the authenticated awsApi Wrapper
      switch (type) {
        case "daily":
          await awsApi.sendDailyAlert(payload);
          break;
        case "weekly":
          await awsApi.sendWeeklySummary(payload);
          break;
        case "monthly":
          await awsApi.sendMonthlyReport(payload);
          break;
        case "newsletter":
          await awsApi.sendNewsletter(payload);
          break;
        default:
          break;
      }
      
      // SUCCESS: Trigger the "Sync" confirmation toast
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      console.log(`✅ [System] ${type.toUpperCase()} execution successful.`);
      
    } catch (error) {
      console.error(`❌ [System] Protocol Failure [${type}]:`, error.message);
      // Secondary alert for industrial transparency
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
        <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-[0.2em] italic flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-500" />
          System Triggers
        </h2>

        {/* Weekly Summary */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2rem] overflow-hidden mb-6 bg-white transition-all hover:translate-y-[-2px]">
          <CardHeader className="bg-slate-900 text-white py-3 px-6 border-b-4 border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Weekly Investor Summary
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleManualTrigger("weekly")}
                disabled={isTriggering === "weekly"}
                className="bg-indigo-500/20 hover:bg-indigo-500 hover:text-white border-2 border-indigo-500/50 text-[9px] font-black uppercase rounded-full h-7 px-4 transition-all active:scale-95"
              >
                {isTriggering === "weekly" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Manual Dispatch"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50/30">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Intelligence</p>
              <p className="text-[11px] font-bold text-slate-700 max-w-md leading-relaxed">
                Portfolio Health, IQ score trends, and risk correlation updates every Monday morning.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white p-3 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!settings.weekly_summary ? 'text-rose-500' : 'text-slate-300'}`}>Offline</span>
              <Switch
                checked={!!settings.weekly_summary}
                onCheckedChange={() => toggleSetting("weekly_summary")}
                className="w-12 h-6 border-2 border-slate-900 data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-slate-200"
              />
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${settings.weekly_summary ? 'text-emerald-500' : 'text-slate-300'}`}>Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Report */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2rem] overflow-hidden mb-6 bg-white transition-all hover:translate-y-[-2px]">
          <CardHeader className="bg-slate-900 text-white py-3 px-6 border-b-4 border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Monthly Portfolio Report
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleManualTrigger("monthly")}
                disabled={isTriggering === "monthly"}
                className="bg-purple-500/20 hover:bg-purple-500 hover:text-white border-2 border-purple-500/50 text-[9px] font-black uppercase rounded-full h-7 px-4 transition-all active:scale-95"
              >
                {isTriggering === "monthly" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Manual Dispatch"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50/30">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Schedule</p>
              <p className="text-[11px] font-bold text-slate-700 max-w-md leading-relaxed">
                Comprehensive progress vs goals, drawdown summary, and achievement badges on the 1st.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white p-3 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!settings.monthly_report ? 'text-rose-500' : 'text-slate-300'}`}>Offline</span>
              <Switch
                checked={!!settings.monthly_report}
                onCheckedChange={() => toggleSetting("monthly_report")}
                className="w-12 h-6 border-2 border-slate-900 data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-slate-200"
              />
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${settings.monthly_report ? 'text-emerald-500' : 'text-slate-300'}`}>Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Alerts */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-[2rem] overflow-hidden mb-10 bg-white transition-all hover:translate-y-[-2px]">
          <CardHeader className="bg-slate-900 text-white py-3 px-6 border-b-4 border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Daily Critical Alerts
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleManualTrigger("daily")}
                disabled={isTriggering === "daily"}
                className="bg-amber-500/20 hover:bg-amber-500 hover:text-white border-2 border-amber-500/50 text-[9px] font-black uppercase rounded-full h-7 px-4 transition-all active:scale-95"
              >
                {isTriggering === "daily" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Manual Dispatch"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50/30">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On-Demand Monitoring</p>
              <p className="text-[11px] font-bold text-slate-700 max-w-md leading-relaxed">
                High-priority alerts triggered by significant risk increases or goal drift detected.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white p-3 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!settings.daily_alerts ? 'text-rose-500' : 'text-slate-300'}`}>Offline</span>
              <Switch
                checked={!!settings.daily_alerts}
                onCheckedChange={() => toggleSetting("daily_alerts")}
                className="w-12 h-6 border-2 border-slate-900 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-200"
              />
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${settings.daily_alerts ? 'text-emerald-500' : 'text-slate-300'}`}>Active</span>
            </div>
          </CardContent>
        </Card>

        {/* End of System Configuration */}
        <div className="mt-8 flex items-center justify-center p-6 border-t-4 border-slate-900/10">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
            End of System Configuration — Terminal v5.4
          </p>
        </div>
      </div>
    </div>
  );
}
