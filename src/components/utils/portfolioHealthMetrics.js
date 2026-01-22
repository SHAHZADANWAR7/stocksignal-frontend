/**
 * Portfolio Health Metrics
 * Calculates diversification, fragility, dependency, and overall health scores
 */

/**
 * Calculate comprehensive portfolio health metrics
 * @param {Array} holdings - Array of holding objects with symbol, quantity, current_price
 * @returns {Object} Health metrics including scores and alerts
 */
export function calculatePortfolioHealthMetrics(holdings) {
  if (!holdings || holdings.length === 0) {
    return {
      diversificationScore: 0,
      fragilityIndex: 0,
      dependencyScore: 0,
      riskLevel: 0,
      correlationCoefficient: 0,
      healthAlerts: [],
      rawMetrics: {}
    };
  }

  // Calculate total portfolio value
  const totalValue = holdings.reduce((sum, h) => {
    const value = h.quantity * (h.current_price || h.average_cost || 0);
    return sum + value;
  }, 0);

  if (totalValue === 0) {
    return {
      diversificationScore: 0,
      fragilityIndex: 0,
      dependencyScore: 0,
      riskLevel: 0,
      correlationCoefficient: 0,
      healthAlerts: [],
      rawMetrics: {}
    };
  }

  // Calculate position weights
  const weights = holdings.map(h => {
    const value = h.quantity * (h.current_price || h.average_cost || 0);
    return value / totalValue;
  });

  // Diversification Score (0-100): Based on Herfindahl-Hirschman Index (HHI)
  // HHI = sum of squared weights
  const hhi = weights.reduce((sum, w) => sum + w * w, 0);
  
  // Convert HHI to diversification score (inverse relationship)
  // HHI ranges from 1/n (perfect diversification) to 1 (single asset)
  // Score: 100 = highly diversified, 0 = concentrated
  const maxHHI = 1;
  const minHHI = 1 / holdings.length;
  const diversificationScore = ((maxHHI - hhi) / (maxHHI - minHHI)) * 100;

  // Fragility Index (0-100): Measure of single-asset risk
  // Based on largest single position
  const maxWeight = Math.max(...weights);
  const fragilityIndex = maxWeight * 100;

  // Dependency Score (0-100): Number of unique assets
  // More assets = lower dependency
  const uniqueAssets = holdings.length;
  const dependencyScore = Math.max(0, 100 - (uniqueAssets * 5));

  // Risk Level (0-100): Composite of concentration and count
  const riskLevel = (hhi * 50 + (1 / uniqueAssets) * 50);

  // Correlation Coefficient (approximation based on diversification)
  // Higher diversification typically means lower correlation
  const correlationCoefficient = Math.max(0, Math.min(1, 1 - diversificationScore / 100));

  // Generate health alerts
  const healthAlerts = [];

  if (maxWeight > 0.3) {
    healthAlerts.push({
      type: 'concentration_risk',
      severity: maxWeight > 0.5 ? 'high' : 'medium',
      message: `${(maxWeight * 100).toFixed(1)}% concentrated in single asset`
    });
  }

  if (diversificationScore < 40) {
    healthAlerts.push({
      type: 'risk_drift',
      severity: 'medium',
      message: 'Portfolio diversification below recommended level'
    });
  }

  if (fragilityIndex > 50) {
    healthAlerts.push({
      type: 'fragility_increase',
      severity: 'high',
      message: 'High fragility - vulnerable to single-asset shocks'
    });
  }

  if (correlationCoefficient > 0.7) {
    healthAlerts.push({
      type: 'correlation_creep',
      severity: 'medium',
      message: 'Assets may be highly correlated - diversification benefit reduced'
    });
  }

  return {
    diversificationScore: Math.round(diversificationScore),
    fragilityIndex: Math.round(fragilityIndex),
    dependencyScore: Math.round(dependencyScore),
    riskLevel: Math.round(riskLevel),
    correlationCoefficient: Math.round(correlationCoefficient * 100) / 100,
    healthAlerts,
    rawMetrics: {
      hhi: Math.round(hhi * 10000) / 10000,
      maxConcentration: Math.round(maxWeight * 1000) / 10,
      uniqueAssets,
      totalAssetCount: holdings.length
    }
  };
}
