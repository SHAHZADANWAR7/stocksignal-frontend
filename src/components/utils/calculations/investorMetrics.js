/**
 * Investor Behavior Metrics
 * Calculates Investor IQ score based on trading patterns and portfolio composition
 */

/**
 * Calculate comprehensive investor metrics
 * @param {Array} trades - Array of trade objects with buy/sell, prices, dates
 * @param {Array} holdings - Current portfolio holdings
 * @returns {Object} Investor metrics including IQ score and sub-scores
 */
export function calculateInvestorMetrics(trades, holdings) {
  if (!trades || trades.length === 0) {
    return {
      overallScore: 0,
      disciplineScore: 0,
      overtradingScore: 0,
      panicSellingScore: 0,
      concentrationScore: 0,
      message: 'Insufficient trading data to calculate metrics'
    };
  }

  // Calculate closed positions (buy + corresponding sell)
  const closedPositions = identifyClosedPositions(trades);
  
  // Performance metrics
  const winRate = calculateWinRate(closedPositions);
  const avgHoldingDays = calculateAvgHoldingPeriod(closedPositions);
  
  // Discipline score (0-100): Based on win rate and holding period
  let disciplineScore = 0;
  if (closedPositions.length > 0) {
    // Win rate component (0-50 points)
    disciplineScore += winRate * 50;
    
    // Holding period component (0-50 points)
    // Penalize day trading (<7 days) and very long holds (>365 days)
    if (avgHoldingDays < 7) {
      disciplineScore += 10; // Day trading penalty
    } else if (avgHoldingDays > 365) {
      disciplineScore += 25; // Too long, potential loss aversion
    } else if (avgHoldingDays >= 30 && avgHoldingDays <= 180) {
      disciplineScore += 50; // Optimal range
    } else {
      disciplineScore += 35;
    }
  } else {
    disciplineScore = 50; // Neutral if no closed positions
  }

  // Overtrading score (0-100)
  const tradesPerDay = calculateTradesPerDay(trades);
  let overtradingScore = 100;
  if (tradesPerDay > 5) {
    overtradingScore = 20; // Excessive trading
  } else if (tradesPerDay > 2) {
    overtradingScore = 50;
  } else if (tradesPerDay > 1) {
    overtradingScore = 75;
  } else if (tradesPerDay >= 0.1) {
    overtradingScore = 100; // Healthy frequency
  } else {
    overtradingScore = 60; // Too inactive
  }

  // Emotional control score (panic selling detection)
  const panicSellingScore = detectPanicSelling(closedPositions);

  // Concentration score (diversification)
  const concentrationScore = calculateConcentrationScore(holdings);

  // Overall Investor IQ (weighted average)
  const overallScore = Math.round(
    disciplineScore * 0.3 +
    overtradingScore * 0.2 +
    panicSellingScore * 0.25 +
    concentrationScore * 0.25
  );

  return {
    overallScore,
    disciplineScore: Math.round(disciplineScore),
    overtradingScore: Math.round(overtradingScore),
    panicSellingScore: Math.round(panicSellingScore),
    concentrationScore: Math.round(concentrationScore),
    winRate: Math.round(winRate * 100),
    avgHoldingDays: Math.round(avgHoldingDays),
    tradesPerDay: Math.round(tradesPerDay * 100) / 100,
    closedPositions: closedPositions.length
  };
}

function identifyClosedPositions(trades) {
  const positions = [];
  const holdings = {};

  trades.forEach(trade => {
    const { symbol, type, quantity, price, transaction_date } = trade;
    
    if (type === 'buy') {
      if (!holdings[symbol]) holdings[symbol] = [];
      holdings[symbol].push({ quantity, price, date: transaction_date });
    } else if (type === 'sell') {
      if (holdings[symbol] && holdings[symbol].length > 0) {
        const buy = holdings[symbol].shift();
        const profit = (price - buy.price) * Math.min(quantity, buy.quantity);
        const profitPercent = ((price - buy.price) / buy.price) * 100;
        const holdingDays = Math.abs(
          (new Date(transaction_date) - new Date(buy.date)) / (1000 * 60 * 60 * 24)
        );
        
        positions.push({
          symbol,
          buyPrice: buy.price,
          sellPrice: price,
          profit,
          profitPercent,
          holdingDays
        });
      }
    }
  });

  return positions;
}

function calculateWinRate(closedPositions) {
  if (closedPositions.length === 0) return 0.5;
  const wins = closedPositions.filter(p => p.profit > 0).length;
  return wins / closedPositions.length;
}

function calculateAvgHoldingPeriod(closedPositions) {
  if (closedPositions.length === 0) return 0;
  const totalDays = closedPositions.reduce((sum, p) => sum + p.holdingDays, 0);
  return totalDays / closedPositions.length;
}

function calculateTradesPerDay(trades) {
  if (trades.length === 0) return 0;
  
  const dates = trades.map(t => new Date(t.transaction_date).toDateString());
  const uniqueDays = new Set(dates).size;
  
  return trades.length / uniqueDays;
}

function detectPanicSelling(closedPositions) {
  if (closedPositions.length === 0) return 100;
  
  const losers = closedPositions.filter(p => p.profit < 0);
  const winners = closedPositions.filter(p => p.profit > 0);
  
  if (losers.length === 0) return 100;
  
  const avgLoserHoldDays = losers.reduce((sum, p) => sum + p.holdingDays, 0) / losers.length;
  const avgWinnerHoldDays = winners.length > 0 
    ? winners.reduce((sum, p) => sum + p.holdingDays, 0) / winners.length 
    : avgLoserHoldDays;
  
  const avgLoserPercent = Math.abs(losers.reduce((sum, p) => sum + p.profitPercent, 0) / losers.length);
  const avgWinnerPercent = winners.length > 0
    ? winners.reduce((sum, p) => sum + p.profitPercent, 0) / winners.length
    : 0;
  
  // Panic selling indicators:
  // 1. Cutting losses too quickly (< 30 days)
  // 2. Letting winners run much longer than losers
  // 3. Small average loss % but quick exit
  
  let score = 100;
  
  if (avgLoserHoldDays < 30 && avgWinnerHoldDays > avgLoserHoldDays * 2) {
    score -= 40; // Strong panic selling signal
  } else if (avgLoserHoldDays < 60) {
    score -= 20;
  }
  
  if (avgLoserPercent < 10 && avgLoserHoldDays < 45) {
    score -= 20; // Cutting small losses quickly = emotional
  }
  
  return Math.max(0, score);
}

function calculateConcentrationScore(holdings) {
  if (!holdings || holdings.length === 0) return 50;
  
  const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * (h.current_price || h.average_cost)), 0);
  
  if (totalValue === 0) return 50;
  
  // Calculate Herfindahl Index (concentration measure)
  const weights = holdings.map(h => (h.quantity * (h.current_price || h.average_cost)) / totalValue);
  const hhi = weights.reduce((sum, w) => sum + w * w, 0);
  
  // HHI ranges from 1/n (perfectly diversified) to 1 (single asset)
  // Convert to score: lower HHI = higher score
  const score = (1 - hhi) * 100 / (1 - 1 / holdings.length);
  
  return Math.min(100, Math.max(0, score));
}
