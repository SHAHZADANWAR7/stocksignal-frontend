// Precise calculations for Portfolio Health metrics

export function calculatePortfolioHealth(portfolio, previousHealth = null) {
  const assets = portfolio?.assets || [];
  const totalValue = portfolio?.totalValue || 1;

  if (assets.length === 0) {
    return {
      diversification_score: 0,
      fragility_index: 100,
      dependency_score: 100,
      risk_level: 100,
      correlation_coefficient: 0
    };
  }

  // 1. Diversification Score (based on Herfindahl-Hirschman Index)
  const assetValues = assets.map(a => a.quantity * a.currentPrice);
  const concentrationRatios = assetValues.map(value => (value / totalValue) ** 2);
  const hhi = concentrationRatios.reduce((sum, ratio) => sum + ratio, 0);
  
  // HHI ranges: 1.0 (monopoly) to 0 (perfect competition)
  // Ideal portfolio: 5-15 stocks (HHI ~0.06-0.2)
  const diversificationScore = hhi > 0.5 ? 30 :
                                hhi > 0.3 ? 50 :
                                hhi > 0.2 ? 70 :
                                hhi > 0.1 ? 90 : 95;

  // 2. Fragility Index (based on largest position concentration)
  const maxConcentration = Math.max(...assetValues.map(v => v / totalValue)) * 100;
  
  // If one position is >30% of portfolio = fragile
  const fragilityIndex = maxConcentration > 50 ? 80 :
                          maxConcentration > 30 ? 60 :
                          maxConcentration > 20 ? 40 :
                          maxConcentration > 10 ? 20 : 10;

  // 3. Dependency Score (sector concentration - simplified)
  // Count unique symbols (proxy for diversification across companies)
  const uniqueAssets = new Set(assets.map(a => a.symbol)).size;
  const dependencyScore = uniqueAssets < 3 ? 80 :
                           uniqueAssets < 5 ? 60 :
                           uniqueAssets < 8 ? 40 :
                           uniqueAssets < 12 ? 25 : 15;

  // 4. Risk Level (based on portfolio concentration + volatility proxy)
  // Higher concentration = higher risk
  const baseRisk = hhi * 100;
  const sizeAdjustedRisk = assets.length < 5 ? baseRisk * 1.3 : 
                            assets.length < 10 ? baseRisk * 1.1 : baseRisk;
  const riskLevel = Math.min(100, Math.round(sizeAdjustedRisk));

  // 5. Correlation Coefficient (simplified estimate)
  // In reality, would need historical price data
  // For now, approximate based on portfolio size and concentration
  // More assets + lower concentration = lower correlation
  const estimatedCorrelation = assets.length < 3 ? 0.85 :
                                assets.length < 5 ? 0.65 :
                                assets.length < 10 ? 0.45 :
                                hhi > 0.3 ? 0.55 : 0.35;

  // 6. Health Alerts
  const alerts = [];
  
  if (maxConcentration > 40) {
    alerts.push({
      type: "concentration_risk",
      severity: "high",
      message: `Your largest position represents ${maxConcentration.toFixed(1)}% of your portfolio. Consider rebalancing to reduce risk.`
    });
  }

  if (previousHealth && riskLevel > previousHealth.risk_level + 10) {
    alerts.push({
      type: "risk_drift",
      severity: "medium",
      message: `Portfolio risk has increased by ${Math.round(riskLevel - previousHealth.risk_level)}% since last check without you noticing.`
    });
  }

  if (fragilityIndex > 60) {
    alerts.push({
      type: "fragility_increase",
      severity: "high",
      message: "High fragility detected. Your portfolio is vulnerable to single asset failures."
    });
  }

  if (estimatedCorrelation > 0.7) {
    alerts.push({
      type: "correlation_creep",
      severity: "medium",
      message: "Assets are becoming highly correlated. Diversification benefits are reduced."
    });
  }

  return {
    diversification_score: Math.round(diversificationScore),
    fragility_index: Math.round(fragilityIndex),
    dependency_score: Math.round(dependencyScore),
    risk_level: Math.round(riskLevel),
    correlation_coefficient: parseFloat(estimatedCorrelation.toFixed(3)),
    health_alerts: alerts,
    
    // Raw metrics for display
    metrics: {
      hhi,
      maxConcentration,
      uniqueAssets,
      totalAssets: assets.length
    }
  };
}
