import React, { useState, useEffect } from "react";
import { awsApi } from "@/utils/awsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, ArrowDownCircle, Plus, BookOpen, Loader2 } from "lucide-react";
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
      const userId = localStorage.getItem('user_id');
      const [txData, holdingsData, journalData] = await Promise.all([
        awsApi.getTransactions(userId),
        awsApi.getHoldings(userId),
        awsApi.getInvestmentJournals(userId)
      ]);
      
      setTransactions(txData ? txData.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)) : []);
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
      const userId = localStorage.getItem('user_id');
      const transactionData = {
        userId,
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
        userId,
        transaction_id: createdTx.id,
        symbol: formData.symbol,
        action: formData.type,
        why_bought_sold: formData.why_reason || "No reason provided",
        emotional_state: formData.emotional_state,
        entry_date: formData.transaction_date
      };

      await awsApi.createInvestmentJournal(journalData);

      const existingHolding = holdings.find(h => h.symbol === formData.symbol);

      if (formData.type === "buy") {
        if (existingHolding) {
          const newQuantity = existingHolding.quantity + parseFloat(formData.quantity);
          const newCost = (existingHolding.quantity * existingHolding.average_cost) + 
                         (parseFloat(formData.quantity) * parseFloat(formData.price)) +
                         parseFloat(formData.fees || 0);
          await awsApi.updateHolding(existingHolding.id, { quantity: newQuantity, average_cost: newCost / newQuantity });
        } else {
          await awsApi.createHolding({
            userId,
            symbol: formData.symbol,
            name: formData.asset_name,
            quantity: parseFloat(formData.quantity),
            average_cost: parseFloat(formData.price),
            current_price: parseFloat(formData.price)
          });
        }
      } else if (formData.type === "sell" && existingHolding) {
        const newQuantity = existingHolding.quantity - parseFloat(formData.quantity);
        if (newQuantity > 0) {
          await awsApi.updateHolding(existingHolding.id, { quantity: newQuantity });
        } else {
          await awsApi.deleteHolding(existingHolding.id);
        }
      }

      setFormData({
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

      loadData();
    } catch (error) {
      console.error("Error submitting transaction:", error);
      alert('Error: ' + error.message);
    }
    setIsSubmitting(false);
  };

  const generateBehavioralInsights = async () => {
    setIsGeneratingInsights(true);
    setShowJournalInsights(true);

    try {
      const recentJournals = journals.slice(0, 20);
      const prompt = `Analyze behavioral patterns from this investor's journal entries:\n\n${JSON.stringify(recentJournals)}\n\nIdentify: 1) Chasing returns after green days 2) Panic selling 3) Emotional patterns 4) Time patterns 5) Other biases`;
      
      const result = await awsApi.analyzeBehavioralPatterns(prompt);
      setJournalInsights(result || { patterns: ["Unable to generate"], recommendations: [] });
    } catch (error) {
      console.error("Error generating insights:", error);
      setJournalInsights({ patterns: ["Unable to generate insights"], recommendations: [] });
    }
    setIsGeneratingInsights(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Transactions</h1>
          <p className="text-slate-500 mb-8">Record your buy and sell orders</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Transaction Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Symbol</Label>
                    <Input placeholder="AAPL, BTC, etc." value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
                  </div>

                  <div>
                    <Label>Asset Name</Label>
                    <Input placeholder="Apple Inc., Bitcoin, etc." value={formData.asset_name} onChange={(e) => setFormData({...formData, asset_name: e.target.value})} required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantity</Label>
                      <Input type="number" step="0.0001" placeholder="10" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input type="number" step="0.01" placeholder="150.00" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Fees</Label>
                      <Input type="number" step="0.01" placeholder="0.00" value={formData.fees} onChange={(e) => setFormData({...formData, fees: e.target.value})} />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Investment Journal
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Why this trade?</Label>
                        <Textarea placeholder="e.g., Strong earnings, market dip..." value={formData.why_reason} onChange={(e) => setFormData({...formData, why_reason: e.target.value})} rows={2} />
                      </div>
                      <div>
                        <Label>Emotional State</Label>
                        <Select value={formData.emotional_state} onValueChange={(value) => setFormData({...formData, emotional_state: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confident">😌 Confident</SelectItem>
                            <SelectItem value="uncertain">🤔 Uncertain</SelectItem>
                            <SelectItem value="excited">🤩 Excited</SelectItem>
                            <SelectItem value="fearful">😰 Fearful</SelectItem>
                            <SelectItem value="neutral">😐 Neutral</SelectItem>
                            <SelectItem value="fomo">😱 FOMO</SelectItem>
                            <SelectItem value="panic">😨 Panic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea placeholder="Add any notes..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} />
                  </div>

                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Add Transaction"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {journals.length > 0 && (
              <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      AI Investment Journal
                    </CardTitle>
                    <Button onClick={generateBehavioralInsights} disabled={isGeneratingInsights} size="sm" variant="outline" className="border-blue-200 hover:bg-blue-100">
                      {isGeneratingInsights ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "View Patterns"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {showJournalInsights && journalInsights && (
                  <CardContent>
                    <div className="bg-white rounded-lg p-4 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Detected Patterns:</h4>
                        <ul className="space-y-2">
                          {journalInsights.patterns.map((pattern, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-blue-600 font-bold">•</span>
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {journalInsights.recommendations && journalInsights.recommendations.length > 0 && (
                        <div className="pt-3 border-t border-slate-200">
                          <h4 className="font-semibold text-slate-900 mb-2">Recommendations:</h4>
                          <ul className="space-y-2">
                            {journalInsights.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Symbol</TableHead>
                        <TableHead className="font-semibold">Asset</TableHead>
                        <TableHead className="font-semibold text-right">Quantity</TableHead>
                        <TableHead className="font-semibold text-right">Price</TableHead>
                        <TableHead className="font-semibold text-right">Total</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-b border-slate-100">
                          <TableCell>
                            <Badge className={tx.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}>
                              {tx.type === 'buy' ? <ArrowUpCircle className="w-3 h-3 mr-1" /> : <ArrowDownCircle className="w-3 h-3 mr-1" />}
                              {tx.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">{tx.symbol}</TableCell>
                          <TableCell className="text-slate-600">{tx.asset_name}</TableCell>
                          <TableCell className="text-right text-slate-900">{tx.quantity}</TableCell>
                          <TableCell className="text-right text-slate-900">${tx.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">${(tx.quantity * tx.price + (tx.fees || 0)).toFixed(2)}</TableCell>
                          <TableCell className="text-slate-600">{format(new Date(tx.transaction_date), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
