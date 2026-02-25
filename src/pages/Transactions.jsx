import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  BookOpen, 
  Loader2, 
  Activity, 
  History, 
  Target,
  Clock,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJournalInsights, setShowJournalInsights] = useState(false);
  const [journalInsights, setJournalInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [formData, setFormData] = useState({
    type: "buy",
    symbol: "",
    asset_name: "",
    quantity: "",
    price: "",
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    fees: "0",
    notes: "",
    why_reason: "",
    emotional_state: "neutral"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txData, holdingsData, journalData] = await Promise.all([
        awsApi.getTransactions(),
        awsApi.getHoldings(),
        awsApi.getInvestmentJournals()
      ]);
      const transactionArr = txData || [];
      setTransactions(
        transactionArr.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      );
      setHoldings(holdingsData || []);
      setJournals(journalData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const transactionData = {
        type: formData.type,
        symbol: formData.symbol,
        asset_name: formData.asset_name,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fees: parseFloat(formData.fees || 0),
        transaction_date: formData.transaction_date,
        notes: formData.notes
      };
      const createdTx = await awsApi.createTransaction(transactionData);
      const journalData = {
        transaction_id: createdTx.id,
        symbol: formData.symbol,
        action: formData.type,
        why_bought_sold: formData.why_reason || "No reason provided",
        emotional_state: formData.emotional_state,
        entry_date: formData.transaction_date
      };
      await awsApi.createInvestmentJournal(journalData);
      loadData();
      setFormData({
        type: "buy", symbol: "", asset_name: "", quantity: "", price: "",
        transaction_date: format(new Date(), 'yyyy-MM-dd'), fees: "0",
        notes: "", why_reason: "", emotional_state: "neutral"
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
    setIsSubmitting(false);
  };

  // Industrial "robust" behavioral audit function with strict JSON extraction
  const generateBehavioralInsights = async () => {
    setIsGeneratingInsights(true);
    setShowJournalInsights(true);
    try {
      const recentJournals = journals.slice(0, 20);
      // Forced Zero-Entropy Prompt
      const prompt = `[NO_PROSE]
      Analyze behavioral patterns: ${JSON.stringify(recentJournals)}
      Return ONLY a JSON object. No intro. No summary.
      REQUIRED SCHEMA: {"patterns": ["bias 1", "bias 2"], "recommendations": ["action 1", "action 2"]}`;
      
      const aiResponse = await awsApi.invokeLLM(prompt);
      const raw = aiResponse?.response || aiResponse?.analysis || "";
      // Industrial Grade JSON Extraction
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}') + 1;
      const jsonString = raw.slice(jsonStart, jsonEnd);
      
      const parsed = JSON.parse(jsonString);
      setJournalInsights(parsed);
    } catch (error) {
      console.error("Audit Failure:", error);
      setJournalInsights({ patterns: ["Pattern analysis timeout"], recommendations: ["Ensure journals are populated"] });
    }
    setIsGeneratingInsights(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-slate-900 text-[10px] tracking-widest uppercase">System Ledger</Badge>
              <div className="h-1 w-1 rounded-full bg-slate-400" />
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Real-Time Sync</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Execution History</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Internal log of verified buy and sell orders.</p>
          </motion.div>
          
          <Button 
            onClick={generateBehavioralInsights} 
            disabled={isGeneratingInsights}
            className="bg-[#4353FF] hover:bg-[#3544CC] text-white font-medium px-6 py-2 rounded-lg transition-all flex items-center gap-2 shadow-md border-0"
          >
            {isGeneratingInsights ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span className="text-[16px]">Behavioral Audit</span>
          </Button>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar Entry Form */}
          <div className="lg:col-span-4">
            <Card className="border-slate-200 shadow-xl bg-white sticky top-10">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                  <Plus className="w-4 h-4" /> Order Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Transaction Type Select (manual render) */}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400">Type</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 font-bold shadow-sm h-10 w-full px-3 flex justify-between items-center">
                          {/* We manually display the state here so it CANNOT be invisible */}
                          <span className="text-slate-900 uppercase">
                            {formData.type === "buy"
                              ? "BUY"
                              : formData.type === "sell"
                              ? "SELL"
                              : "Select Type"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 shadow-xl">
                          <SelectItem value="buy">BUY</SelectItem>
                          <SelectItem value="sell">SELL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400">Symbol</Label>
                      <Input className="border-slate-200 uppercase font-bold" placeholder="TSLA" value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value})} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-slate-400">Asset Full Name</Label>
                    <Input className="border-slate-200" placeholder="Tesla, Inc." value={formData.asset_name} onChange={(e) => setFormData({...formData, asset_name: e.target.value})} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400">Quantity</Label>
                      <Input type="number" step="any" className="border-slate-200" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400">Entry Price</Label>
                      <Input type="number" step="any" className="border-slate-200" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 text-[10px] font-black uppercase tracking-widest">
                      <BookOpen className="w-3 h-3" /> Journaling
                    </div>
                    <Textarea className="bg-white border-slate-200 text-xs" placeholder="Rational for this execution..." value={formData.why_reason} onChange={(e) => setFormData({...formData, why_reason: e.target.value})} />
                    {/* Emotional State Select (manual render) */}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400">Emotional State</Label>
                      <Select value={formData.emotional_state} onValueChange={(v) => setFormData({...formData, emotional_state: v})}>
                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 font-bold shadow-sm h-10 w-full px-3 flex justify-between items-center">
                          <span className="text-slate-900 text-xs">
                            {formData.emotional_state
                              ? formData.emotional_state.charAt(0).toUpperCase() + formData.emotional_state.slice(1)
                              : "Select Emotion"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 shadow-xl">
                          <SelectItem value="confident">Confident</SelectItem>
                          <SelectItem value="uncertain">Uncertain</SelectItem>
                          <SelectItem value="fomo">FOMO / High Alert</SelectItem>
                          <SelectItem value="neutral">Neutral / Balanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-slate-900 text-white font-bold tracking-widest uppercase text-xs h-12 shadow-lg hover:bg-slate-800" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting Order..." : "Commit Transaction"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Ledger */}
          <div className="lg:col-span-8 space-y-6">
            {showJournalInsights && journalInsights && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border border-blue-100 shadow-sm bg-blue-50/30 overflow-hidden">
                  <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3" /> Strategic Behavioral Audit
                    </h4>
                    <span className="text-[10px] font-bold text-blue-400">AI-GENERATED REPORT</span>
                  </div>
                  <CardContent className="p-6 grid md:grid-cols-2 gap-6 bg-white/80 backdrop-blur-sm">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Detected Biases</p>
                      <ul className="space-y-2">
                        {journalInsights.patterns.map((p, i) => (
                          <li key={i} className="text-sm font-bold text-slate-900 flex items-start gap-2">
                            <div className="h-1.5 w-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Adjustments</p>
                      <ul className="space-y-2">
                        {journalInsights.recommendations.map((r, i) => (
                          <li key={i} className="text-sm font-bold text-emerald-800 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100 shadow-sm">
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="border-slate-200 shadow-xl bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4" /> Logged Executions
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sorted by Recency</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total (Net)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <Badge className={tx.type === 'buy' 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200 shadow-none font-black' 
                              : 'bg-rose-100 text-rose-900 border-rose-200 shadow-none font-black'}>
                              {tx.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900 leading-none">{tx.symbol}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-1">{tx.asset_name}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm text-slate-600">{tx.quantity}</td>
                          <td className="px-6 py-4 text-right font-mono text-sm text-slate-600">${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-slate-900">${(tx.quantity * tx.price + (tx.fees || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[11px] font-bold">
                            {format(new Date(tx.transaction_date), "dd MMM yyyy").toUpperCase()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <div className="py-20 text-center">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Ledger is currently empty</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
