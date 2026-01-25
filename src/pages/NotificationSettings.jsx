import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, TrendingUp, Calendar, CheckCircle, AlertCircle, Send, Loader2, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [settings, setSettings] = useState({
    daily_alerts: false,
    weekly_summary: true,
    monthly_report: true
  });
  const [newsletterData, setNewsletterData] = useState({
    email: "",
    frequency: "weekly",
    interests: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      if (!userId) return;

      const currentUser = await awsApi.getUser(userId);
      setUser(currentUser);
      
      // Load existing settings from user entity
      if (currentUser.newsletter_preferences) {
        setSettings(currentUser.newsletter_preferences);
      }

      // Load newsletter subscription
      const subscriptions = await awsApi.getSubscriptions(userId);
      const userSubscription = subscriptions?.find(s => s.email === userEmail);
      
      if (userSubscription) {
        setSubscription(userSubscription);
        setNewsletterData({
          email: userSubscription.email,
          frequency: userSubscription.frequency,
          interests: userSubscription.interests || []
        });
      } else {
        setNewsletterData(prev => ({ ...prev, email: userEmail }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const userId = localStorage.getItem('user_id');
      await awsApi.updateUser(userId, {
        newsletter_preferences: settings
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert("Error saving settings: " + error.message);
    }
    
    setIsSaving(false);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInterestToggle = (interest) => {
    setNewsletterData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleNewsletterSave = async () => {
    setIsSaving(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (subscription) {
        await awsApi.updateSubscription(userId, subscription.id, newsletterData);
      } else {
        const created = await awsApi.createSubscription({ ...newsletterData, userId });
        setSubscription(created);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert("Error saving newsletter preferences: " + error.message);
    }
    setIsSaving(false);
  };

  const handleSendTestEmail = async () => {
    if (newsletterData.interests.length === 0) {
      alert("Please select at least one topic of interest first.");
      return;
    }
    
    setIsSendingTest(true);
    try {
      const content = await awsApi.invokeLLM(
        `Generate a brief personalized financial newsletter for topics: ${newsletterData.interests.join(', ')}. Include market overview and 2-3 insights per topic. Keep it concise.`,
        true
      );

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
  <div className="container">
    <div className="header">
      <h1>📊 StockSignal</h1>
      <p>Your ${newsletterData.frequency} Investment Digest</p>
    </div>
    <div className="content">
      ${typeof content === 'string' ? content.replace(/\n/g, '<br>') : content}
    </div>
  </div>
</body>
</html>`;

      await awsApi.sendEmail({
        to: newsletterData.email,
        subject: `📈 Your ${newsletterData.frequency} StockSignal Digest - Test`,
        body: emailBody,
        from_name: "StockSignal"
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Notification Settings
          </h1>
          <p className="text-lg text-slate-600">
            Control how and when StockSignal keeps you informed
          </p>
        </motion.div>

        <Alert className="mb-8 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg mb-2">How It Works</h3>
              <AlertDescription className="text-blue-800 leading-relaxed">
                Subscribe once, customize your preferences, and receive personalized newsletters at your chosen frequency. 
                Each email is powered by AI and includes live market data, trend analysis, and actionable investment insights 
                tailored specifically to your interests and portfolio goals.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Newsletter Subscription */}
        <Card className="border-2 border-slate-200 shadow-xl bg-white mb-8">
          <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Bell className="w-7 h-7" />
              Newsletter Subscription
            </CardTitle>
            <p className="text-white/95 text-sm mt-2">
              Personalize your investment newsletter preferences
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={newsletterData.email}
                onChange={(e) => setNewsletterData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="mt-2 h-12 text-base"
              />
            </div>

            <div>
              <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4" />
                Delivery Frequency
              </Label>
              <Select value={newsletterData.frequency} onValueChange={(value) => setNewsletterData(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Updates</SelectItem>
                  <SelectItem value="weekly">Weekly Digest (Recommended)</SelectItem>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold mb-4 block">
                Topics of Interest
              </Label>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { value: "stocks", label: "Stock Analysis", icon: TrendingUp },
                  { value: "crypto", label: "Cryptocurrency", icon: Sparkles },
                  { value: "economy", label: "Economic News", icon: Calendar },
                  { value: "analysis", label: "AI Insights", icon: Star },
                  { value: "news", label: "Market News", icon: Mail }
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = newsletterData.interests.includes(option.value);
                  return (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-blue-500 bg-blue-50 shadow-md'
                          : 'border-2 border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => handleInterestToggle(option.value)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-600'}`} />
                        <p className="font-semibold text-sm flex-1">{option.label}</p>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleInterestToggle(option.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {newsletterData.interests.length > 0 && (
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-900 mb-1">Preview Your Newsletter</p>
                      <p className="text-sm text-emerald-700">
                        See what your {newsletterData.frequency} emails will look like
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest}
                      variant="outline"
                      className="bg-white border-emerald-300 hover:bg-emerald-50"
                    >
                      {isSendingTest ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Test
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleNewsletterSave}
              disabled={isSaving || newsletterData.interests.length === 0}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {subscription ? "Update Newsletter Preferences" : "Subscribe to Newsletter"}
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">App Notifications</h2>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  Free newsletters for everyone
                </p>
                <p className="text-sm text-slate-700">
                  All insights and summaries are completely free. Premium unlocks deeper analysis inside the app, never in emails.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Weekly Summary */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" />
                  <div>
                    <CardTitle className="text-xl">Weekly Investor Summary</CardTitle>
                    <p className="text-white/90 text-sm mt-1">Every Monday morning</p>
                  </div>
                </div>
                <Badge className="bg-white text-blue-700 text-sm">
                  Recommended
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-slate-700 mb-3">
                    Your primary engagement driver. Get a weekly snapshot of:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4">
                    <li>• Portfolio Health Grade (A–F)</li>
                    <li>• Investor IQ score trend</li>
                    <li>• Risk & correlation changes</li>
                    <li>• One educational insight</li>
                    <li>• What changed this week</li>
                  </ul>
                </div>
                <Switch
                  checked={settings.weekly_summary}
                  onCheckedChange={() => toggleSetting('weekly_summary')}
                  className="ml-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Report */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <CardTitle className="text-xl">Monthly Portfolio Report</CardTitle>
                    <p className="text-white/90 text-sm mt-1">First day of each month</p>
                  </div>
                </div>
                <Badge className="bg-white text-purple-700 text-sm">
                  Reflection
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-slate-700 mb-3">
                    Designed for reflection and tracking long-term progress:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4">
                    <li>• Portfolio progress vs goals</li>
                    <li>• Risk & drawdown summary</li>
                    <li>• Contribution vs growth breakdown</li>
                    <li>• Achievement badges earned</li>
                    <li>• Monthly performance recap</li>
                  </ul>
                </div>
                <Switch
                  checked={settings.monthly_report}
                  onCheckedChange={() => toggleSetting('monthly_report')}
                  className="ml-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Daily Alerts */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <div>
                    <CardTitle className="text-xl">Daily Alerts</CardTitle>
                    <p className="text-white/90 text-sm mt-1">Only when significant changes occur</p>
                  </div>
                </div>
                <Badge className="bg-white text-amber-700 text-sm">
                  Optional
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-slate-700 mb-3">
                    Get notified only when meaningful changes happen:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4">
                    <li>• Portfolio health updates (significant changes only)</li>
                    <li>• Risk increase detection</li>
                    <li>• Goal drift warnings</li>
                    <li>• Correlation spikes</li>
                  </ul>
                  <p className="text-xs text-amber-700 mt-3 font-semibold">
                    ⚠️ Rate-limited to prevent spam. Maximum 1 alert per day.
                  </p>
                </div>
                <Switch
                  checked={settings.daily_alerts}
                  onCheckedChange={() => toggleSetting('daily_alerts')}
                  className="ml-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            You can unsubscribe from any email using the link at the bottom
          </p>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            {isSaving ? (
              "Saving..."
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
