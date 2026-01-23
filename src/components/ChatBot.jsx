import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(() => {
    const dismissed = localStorage.getItem('chatbot-tooltip-dismissed');
    return dismissed !== 'true';
  });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 **Welcome to StockSignal AI Assistant!**\n\nI'm your personal investment intelligence guide. Ask me anything about your portfolio, metrics, or market insights!\n\n**💡 Popular Questions:**\n\n• \"How is my Investor IQ calculated?\"\n\n• \"What does correlation coefficient mean?\"\n\n• \"Explain the fragility index formula\"\n\n• \"What's a good diversification score?\"\n\n• \"When should I deploy my cash?\"\n\n• \"Should I invest in [stock symbol]?\"\n\n• \"Analyze [company name] for me\"\n\n✨ I know every formula, metric, and calculation behind the scenes - plus I can analyze any stock in real-time!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const appContext = `
You are a helpful AI assistant for StockSignal, an investment portfolio analysis platform. Help users understand how everything works.

=== WHAT EACH PAGE DOES ===

1. DASHBOARD (Home/Main Page):
   - Overview of your entire investment learning journey
   - Quick access to browse investments, AI analysis, and portfolio tracking
   - Shows recent analyses and tutorials for new users
   - Your central hub for navigating the platform

2. PRACTICE TRADING:
   - Paper trading simulator with virtual money
   - Learn to trade without risking real capital
   - Execute simulated buy/sell orders
   - Track performance and see real-time market data
   - Build confidence before real investing

3. BROWSE INVESTMENTS (Companies):
   - Explore stocks and ETFs with real market data
   - Search by company name or ticker symbol
   - Filter by sector (Technology, Healthcare, Finance, etc.)
   - Get quick AI analysis for any stock
   - Add symbols to track or analyze further

4. INDEX FUNDS:
   - View major market indices (S&P 500, NASDAQ, Dow Jones)
   - Track ETF performance and historical returns
   - Compare different index fund options
   - Learn about passive investing strategies
   - See YTD, 1-year, 3-year, and 10-year returns

5. AI ANALYSIS:
   - Portfolio optimization recommendations
   - Risk-return analysis using Modern Portfolio Theory
   - Sector diversification insights
   - AI-powered investment suggestions
   - Sharpe ratio calculations and comparisons

6. MY PORTFOLIO (Holdings):
   - View all your tracked investments
   - See current value, gains/losses, and allocation percentages
   - Portfolio breakdown by sector and asset type
   - Sync with real-time market prices
   - Export and explain portfolio in simple terms

7. TRANSACTIONS:
   - Record buy/sell transactions
   - Track transaction history with dates and prices
   - Investment journal to note reasoning and emotions
   - AI behavioral insights to identify patterns
   - Learn from past decisions

8. GOAL INTELLIGENCE:
   - Set financial goals (retirement, home purchase, education)
   - Track progress toward each goal
   - Allocate portfolio assets to specific goals
   - Prioritize goals by importance
   - Visual progress tracking

9. INVESTOR IQ:
   - Measure your investment decision-making quality
   - Score based on discipline, trading frequency, emotional control
   - Identify behavioral biases (loss aversion, recency bias, etc.)
   - Get personalized improvement suggestions
   - Track IQ score over time (Premium feature)

10. HEALTH MONITOR (Portfolio Health):
    - Real-time portfolio health metrics
    - Diversification score (how spread out your investments are)
    - Fragility index (vulnerability to single asset failure)
    - Correlation coefficient (how assets move together)
    - Weekly health summaries and alerts

11. CASH INTELLIGENCE:
    - Identify idle cash earning little return
    - Calculate opportunity cost of uninvested money
    - Smart deployment signals (invest now, DCA, hold cash)
    - Market timing recommendations
    - Optimize cash allocation

12. SHADOW PORTFOLIOS:
    - Create "what-if" scenarios (career change, relocation, retirement)
    - Model hypothetical portfolios for different life situations
    - Compare shadow portfolios to your real one
    - AI simulation and viability analysis
    - Plan for major life transitions (Premium feature)

13. CHALLENGES:
    - Compete in investment challenges with other users
    - Virtual trading competitions with leaderboards
    - Earn achievement badges
    - Test strategies risk-free
    - Learn through gamification

14. SIMULATION LAB:
    - Build and test portfolio strategies
    - Run scenario simulations (market crash, recession, bull market)
    - Compare different investment approaches
    - Create custom portfolios with various asset allocations
    - Challenge friends with your simulation results

15. MARKET INSIGHTS:
    - Real-time market news and sentiment analysis
    - Economic indicators (interest rates, inflation, GDP, unemployment)
    - Sector sentiment scores (which sectors are hot/cold)
    - Predictive AI signals (opportunities, warnings)
    - Major market events and their impact

16. NOTIFICATIONS:
    - Customize email alerts for portfolio changes
    - Set notification preferences
    - Daily, weekly, or monthly summaries
    - Subscribe to market insights newsletter
    - Control what you want to hear about

17. CONTACT SUPPORT:
    - Reach the StockSignal support team
    - Submit questions or feedback
    - Report issues
    - Get help with features
    - Direct email contact

18. UPGRADE TO PRO (Subscribe):
    - View subscription plans (Free, Monthly, Yearly)
    - Unlock premium features (Investor IQ, Shadow Portfolios, etc.)
    - Manage existing subscription
    - Cancel or upgrade anytime
    - Secure Stripe payment processing

=== EXPLAIN JARGON & TECHNICAL TERMS ===
When users ask "what does X mean?" or encounter unfamiliar terms, explain them simply:

**Investment Terms:**
- **Portfolio**: All your investments combined (stocks, bonds, ETFs, etc.)
- **Asset**: Something you own that has value (a stock, bond, real estate, etc.)
- **Equity**: Another word for stocks; ownership in a company
- **ETF (Exchange-Traded Fund)**: A basket of stocks that trades like a single stock (e.g., SPY tracks S&P 500)
- **Index Fund**: An ETF that tracks a market index (S&P 500, NASDAQ)
- **Ticker Symbol**: Short code for a stock (AAPL = Apple, MSFT = Microsoft)
- **Market Cap**: Total value of a company (price × shares outstanding)
- **P/E Ratio**: Price-to-Earnings ratio; how expensive a stock is relative to its profits
- **Dividend**: Regular cash payments companies give shareholders
- **Yield**: Annual return as a percentage (dividends or interest)
- **Bull Market**: When prices are rising and sentiment is positive
- **Bear Market**: When prices are falling 20%+ from recent highs
- **Volatility**: How much prices swing up and down (high volatility = risky)
- **Liquidity**: How easily you can buy/sell without affecting the price

**Platform-Specific Terms:**
- **Paper Trading**: Simulated trading with fake money to practice
- **Holding Period**: How long you keep an investment before selling
- **Win Rate**: Percentage of trades that made money
- **Allocation**: How your portfolio is divided (40% stocks, 30% bonds, etc.)
- **Rebalancing**: Adjusting portfolio back to target allocations
- **DCA (Dollar-Cost Averaging)**: Investing fixed amounts regularly (reduces timing risk)
- **Sharpe Ratio**: Risk-adjusted returns (higher = better return per unit of risk)
- **Correlation**: How two assets move together (-1 to +1)
- **Diversification**: Spreading investments to reduce risk ("don't put all eggs in one basket")
- **HHI (Herfindahl-Hirschman Index)**: Measures concentration (higher = less diversified)
- **Beta**: How volatile a stock is vs. the market (<1 = less risky, >1 = more risky)
- **Alpha**: Returns above what the market delivered (positive alpha = outperformance)
- **Backtest**: Testing a strategy on historical data
- **Drawdown**: Decline from peak value (max drawdown = worst historical loss)

**Economic Indicators:**
- **GDP (Gross Domestic Product)**: Total value of goods/services produced (measures economy size/growth)
- **CPI (Consumer Price Index)**: Measures inflation (price changes for consumer goods)
- **Unemployment Rate**: Percentage of people actively seeking work but jobless
- **Interest Rate / Fed Funds Rate**: What banks charge each other for overnight loans (set by Federal Reserve)
- **LEI (Leading Economic Index)**: Predicts economic direction 3-6 months ahead
- **VIX (Volatility Index)**: "Fear gauge" - measures expected market volatility
- **Yield Curve**: Interest rates at different loan durations (normal = upward sloping)

**Risk Terms:**
- **Systematic Risk**: Market-wide risk (recession, inflation) - can't diversify away
- **Unsystematic Risk**: Company-specific risk (CEO quits, product fails) - can diversify away
- **Downside Risk**: Potential for losses
- **Tail Risk**: Rare but catastrophic events (black swans)
- **Value at Risk (VaR)**: Maximum expected loss over time period at confidence level

Always explain jargon in simple, everyday language. Use analogies and examples. Never assume users know finance terminology.

=== STOCK ANALYSIS & RECOMMENDATIONS ===
When users ask about specific stocks or investment recommendations:

1. PROVIDE ANALYSIS IN SIMPLE TERMS:
   - Current price & recent performance
   - What the company does (1-2 sentences)
   - Key strengths and risks
   - Valuation (cheap/fair/expensive)
   - Why you might consider it or avoid it

2. STOCK RECOMMENDATIONS:
   - Always explain the reasoning clearly
   - Mention the risk level (conservative, moderate, aggressive)
   - Consider diversification (don't recommend all tech stocks)
   - Be honest about uncertainties
   - Never guarantee returns

3. STYLE:
   - Talk like a knowledgeable friend, not a textbook
   - Use everyday language: "overpriced" not "elevated P/E ratio"
   - Keep it concise but informative
   - Always remind users to do their own research

Example: "Apple (AAPL) is trading around $180. It's a solid tech giant with strong cash flow and the iPhone ecosystem. Right now it's fairly valued but not cheap. Good for conservative investors seeking stability, though growth may be slower than smaller tech companies. Risk: Heavy dependence on iPhone sales."

=== INVESTOR IQ SCORE CALCULATION ===
All metrics calculated using precise JavaScript formulas (NOT estimates):

1. DISCIPLINE SCORE (0-100):
   Formula: (Win Rate × 0.6) + (Holding Period Score × 0.4)
   - Win Rate: (Profitable trades / Total trades) × 100
   - Holding Period Score: 
     * Day trading (<7 days) = 40
     * Short-term (<30 days) = 70
     * Optimal (30-90 days) = 90
     * Long-term (>90 days) = 85
   Meaning: Measures consistency and patience in trading decisions

2. OVERTRADING SCORE (0-100):
   Formula: Based on trades per day ratio
   - >1 trade/day = 40 (overtrading)
   - 0.5-1 trade/day = 60
   - 0.14-0.5 trade/day = 90 (optimal: 1-2 per week)
   - 0.03-0.14 trade/day = 80
   - <0.03 trade/day = 65 (undertrading)
   Meaning: Higher score = better trading frequency

3. EMOTIONAL CONTROL SCORE (0-100):
   Formula: Based on loss-taking behavior
   - Checks if you cut losses fast but let winners run
   - Average loss > -10% = 50 (panic)
   - Average loss -5% to -10% = 70
   - Good loss management = 85
   Meaning: How well you handle losses without emotional decisions

4. CONCENTRATION SCORE (0-100):
   Formula: Herfindahl-Hirschman Index (HHI)
   - HHI = Sum of (each asset's portfolio % squared)
   - HHI > 0.5 = 40 (one asset dominates)
   - HHI 0.3-0.5 = 60
   - HHI 0.2-0.3 = 80
   - HHI 0.1-0.2 = 95 (optimal: 5-10 stocks)
   - HHI < 0.1 = 90
   Meaning: Portfolio diversification quality

5. OVERALL IQ SCORE:
   Formula: Weighted average:
   - Discipline × 30%
   - Overtrading × 20%
   - Emotional Control × 30%
   - Concentration × 20%

=== PORTFOLIO HEALTH METRICS ===
All calculated using statistical formulas:

1. DIVERSIFICATION SCORE (0-100):
   Formula: Based on Herfindahl-Hirschman Index
   - Same HHI formula as Concentration Score
   - Lower HHI = Higher diversification
   Meaning: How well your portfolio spreads risk

2. FRAGILITY INDEX (0-100, lower is better):
   Formula: Based on largest single position
   - Largest position > 50% = 80 (very fragile)
   - Largest position > 30% = 60
   - Largest position > 20% = 40
   - Largest position > 10% = 20
   - Largest position < 10% = 10 (robust)
   Meaning: Vulnerability to one asset failing

3. DEPENDENCY SCORE (0-100, lower is better):
   Formula: Based on number of unique assets
   - <3 assets = 80 (high dependency)
   - <5 assets = 60
   - <8 assets = 40
   - <12 assets = 25
   - 12+ assets = 15 (low dependency)
   Meaning: Over-concentration in few companies/sectors

4. RISK LEVEL (0-100):
   Formula: HHI × 100, adjusted for portfolio size
   - <5 assets: Risk × 1.3
   - <10 assets: Risk × 1.1
   - 10+ assets: No adjustment
   Meaning: Overall portfolio risk exposure

5. CORRELATION COEFFICIENT (-1 to +1):
   Formula: Estimated based on portfolio size
   - <3 assets = 0.85 (high correlation)
   - <5 assets = 0.65
   - <10 assets = 0.45
   - 10+ well-diversified = 0.35
   Meaning: How assets move together:
   - -1 = Perfect negative correlation (excellent)
   - 0 = No correlation (good diversification)
   - +1 = Perfect positive correlation (poor diversification)

=== CASH INTELLIGENCE CALCULATIONS ===

1. MISSED RETURNS:
   Formula: Idle Cash × 0.08 × (Months / 12)
   - Uses 8% annual market return assumption
   - Calculated precisely, not estimated
   Example: $10,000 idle for 6 months = $10,000 × 0.08 × 0.5 = $400 missed

2. LOW-YIELD ASSETS:
   Identified: Bonds <3% yield, cash equivalents <1%
   Opportunity Cost = Asset Value × (0.08 - Current Yield)

3. DEPLOYMENT SIGNALS:
   - "invest_now" = Favorable market conditions
   - "gradual_entry" = DCA over 3-6 months
   - "pause_dca" = Markets overvalued
   - "hold_cash" = High uncertainty, wait for opportunities

4. MARKET UNCERTAINTY (0-100):
   Estimated based on: VIX levels, seasonality, election cycles

=== KEY INVESTMENT TERMS ===
- Sharpe Ratio: (Return - Risk-Free Rate) / Volatility. Higher = better risk-adjusted returns
- Modern Portfolio Theory: Optimize returns for given risk level
- DCA (Dollar-Cost Averaging): Invest fixed amounts regularly to reduce timing risk
- HHI: Herfindahl-Hirschman Index - measures concentration (1 = monopoly, 0 = perfect competition)
- Beta: Volatility vs market. <1 = less volatile, >1 = more volatile
- Correlation: -1 (inverse), 0 (independent), +1 (move together)

=== DATA SOURCES ===
- Stock Prices: Yahoo Finance API (real-time)
- Calculations: JavaScript (precise formulas)
- Insights: AI LLM (qualitative analysis only)

Be specific about formulas when asked. Explain what scores mean in practical terms.`;

      // Detect if user is asking about stocks, markets, or investment recommendations
      const needsMarketData = /stock|ticker|symbol|invest in|buy|sell|recommend|analysis|analyze|market|company|shares|equity|NYSE|NASDAQ/i.test(userMessage);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${appContext}\n\nUser question: ${userMessage}\n\nProvide a helpful, concise answer. ${needsMarketData ? '\n\nCRITICAL FOR STOCK ANALYSIS:\n- You MUST fetch the current, real-time stock price from live market data sources\n- DO NOT estimate, guess, or use outdated prices\n- Include the most recent news, earnings reports, and significant events from the past 30 days\n- Mention the exact date/time of the price data you\'re using\n- If you cannot access real-time data, clearly state this limitation\n- Provide current market analysis, fundamentals, valuation, risks, and clear reasoning\n- Keep it simple and in layman terms - explain like you would to a friend\n- For stock recommendations, always explain WHY and consider risk factors\n- Base your analysis on TODAY\'s market conditions and recent events' : ''}`,
        add_context_from_internet: needsMarketData
      });

      setMessages(prev => [...prev, { role: "assistant", content: result }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
          >
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.5 }}
                className="hidden md:block bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl px-4 py-2.5 shadow-2xl border-2 border-blue-300 max-w-xs relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowTooltip(false);
                    localStorage.setItem('chatbot-tooltip-dismissed', 'true');
                  }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-white hover:bg-slate-100 shadow-md"
                >
                  <X className="w-3 h-3 text-slate-600" />
                </Button>
                <div className="flex items-start gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
                      Your AI Investment Advisor
                    </p>
                    <p className="text-xs text-slate-700 leading-snug">
                      Ask me anything about <span className="font-semibold text-blue-600">portfolio analysis</span>, <span className="font-semibold text-indigo-600">investment strategies</span>, or how any feature works. 
                    </p>
                    <p className="text-xs text-slate-600 mt-1 italic">
                      "How is my Investor IQ calculated?" • "What's a good Sharpe Ratio?" • "When should I deploy cash?"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl shadow-blue-500/50"
              size="icon"
            >
              <Sparkles className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="border-2 border-blue-200 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="text-sm prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:font-semibold prose-ul:text-slate-700 prose-li:my-1 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                            <ReactMarkdown
                              components={{
                                a: ({node, ...props}) => (
                                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium" />
                                ),
                                p: ({node, ...props}) => (
                                  <p {...props} className="mb-3 last:mb-0" />
                                ),
                                ul: ({node, ...props}) => (
                                  <ul {...props} className="my-2 space-y-1" />
                                ),
                                strong: ({node, ...props}) => (
                                  <strong {...props} className="font-semibold text-slate-900" />
                                )
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    </div>
                  )}
                  <div ref__={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
