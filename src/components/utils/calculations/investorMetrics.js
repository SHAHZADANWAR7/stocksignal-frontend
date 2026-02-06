// Precise calculations for Investor IQ metrics

import { herfindahlIndex, round } from "./financialMath";

export function calculateInvestorMetrics(trades, portfolio) {
  const filledTrades = trades.filter(t => t.status === 'filled');
  const buyTrades = filledTrades.filter(t => t.side === 'buy');
  const sellTrades = filledTrades.filter(t => t.side === 'sell');
  
  // 1. Calculate win rate and performance
  const closedPositions = [];
  buyTrades.forEach(buy => {
    const matchingSells = sellTrades.filter(sell => 
      sell.symbol === buy.symbol && 
      new Date(sell.timestamp) > new Date(buy.timestamp)
    );
    matchingSells.forEach(sell => {
      const buyValue = buy.quantity * buy.executedPrice;
      const sellValue = sell.quantity * sell.executedPrice;
      const profit = sellValue - buyValue;
      const profitPercent = (profit / buyValue) * 100;
      const holdingDays = Math.floor((new Date(sell.timestamp) - new Date(buy.timestamp)) / (1000 * 60 * 60 * 24));
      
      closedPositions.push({
        symbol: buy.symbol,
        profit,
        profitPercent,
        holdingDays,
        buyDate: buy.timestamp,
        sellDate: sell.timestamp
      });
    });
  });

  const winRate = closedPositions.length > 0 
    ? (closedPositions.filter(p => p.profit > 0).length / closedPositions.length) * 100 
    : 0;

  // 2. Discipline Score (win rate + avg holding period)
  const avgHoldingDays = closedPositions.length > 0
    ? closedPositions.reduce((sum, p) => sum + p.holdingDays, 0) / closedPositions.length
    : 0;
  
  // Ideal holding period is 30-90 days for short-term, penalize day trading
  const holdingPeriodScore = avgHoldingDays < 7 ? 40 : 
                              avgHoldingDays < 30 ? 70 : 
                              avgHoldingDays < 90 ? 90 : 85;
  
  const disciplineScore = (winRate * 0.6) + (holdingPeriodScore * 0.4);

  // 3. Overtrading Score (penalize excessive trading)
  const totalTrades = filledTrades.length;
  const daysActive = trades.length > 1 
    ? Math.max(1, Math.floor((new Date(trades[0].timestamp) - new Date(trades[trades.length - 1].timestamp)) / (1000 * 60 * 60 * 24)))
    : 1;
  
  const tradesPerDay = totalTrades / daysActive;
  
  // Optimal is 1-2 trades per week (0.14-0.28 per day)
  // Penalize overtrading (>1 trade/day) and undertrading (<1 trade/month)
  const overtradingScore = tradesPerDay > 1 ? 40 :
                            tradesPerDay > 0.5 ? 60 :
                            tradesPerDay > 0.14 ? 90 :
                            tradesPerDay > 0.03 ? 80 : 65;

  // 4. Emotional Control Score (based on loss-taking behavior)
  const losingTrades = closedPositions.filter(p => p.profit < 0);
  const avgLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, p) => sum + p.profitPercent, 0) / losingTrades.length 
    : 0;
  
  const avgWin = closedPositions.filter(p => p.profit > 0).length > 0
    ? closedPositions.filter(p => p.profit > 0).reduce((sum, p) => sum + p.profitPercent, 0) / closedPositions.filter(p => p.profit > 0).length
    : 0;

  // Check if cutting losses quickly (good) vs holding losers (bad)
  const avgLosingHoldDays = losingTrades.length > 0
    ? losingTrades.reduce((sum, p) => sum + p.holdingDays, 0) / losingTrades.length
    : 0;
  
  const avgWinningHoldDays = closedPositions.filter(p => p.profit > 0).length > 0
    ? closedPositions.filter(p => p.profit > 0).reduce((sum, p) => sum + p.holdingDays, 0) / closedPositions.filter(p => p.profit > 0).length
    : 0;

  // Good: cut losses fast, let winners run
  const cutLossesFast = avgLosingHoldDays > 0 && avgWinningHoldDays > avgLosingHoldDays;
  const panicSellingScore = cutLossesFast ? 85 : 
                             avgLoss < -10 ? 50 : // Big losses = panic
                             avgLoss < -5 ? 70 : 85;

  // 5. Concentration Score (Herfindahl Index for diversification)
  const assets = portfolio?.assets || [];
  const totalValue = portfolio?.totalValue || 1;
  
  const assetWeights = assets.map(asset => {
    const value = asset.quantity * asset.currentPrice;
    return value / totalValue;
  });
  
  const hhi = herfindahlIndex(assetWeights);
  
  // HHI: 1 = complete concentration, 0 = perfect diversification
  // 5-10 stocks is optimal (HHI ~0.1-0.2)
  const concentrationScore = hhi > 0.5 ? 40 :
                              hhi > 0.3 ? 60 :
                              hhi > 0.2 ? 80 :
                              hhi > 0.1 ? 95 : 90;

  // 6. Overall Score (weighted average)
  const overallScore = (
    disciplineScore * 0.3 +
    overtradingScore * 0.2 +
    panicSellingScore * 0.3 +
    concentrationScore * 0.2
  );

  return {
    overall_score: Math.round(overallScore),
    discipline_score: Math.round(disciplineScore),
    overtrading_score: Math.round(overtradingScore),
    panic_selling_score: Math.round(panicSellingScore),
    concentration_score: Math.round(concentrationScore),
    
    // Raw metrics for LLM context
    metrics: {
      winRate,
      avgHoldingDays,
      tradesPerDay,
      totalTrades,
      closedPositions: closedPositions.length,
      avgLoss,
      avgWin,
      herfindahlIndex: hhi,
      avgLosingHoldDays,
      avgWinningHoldDays
    }
  };
}
