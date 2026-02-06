/**
 * GLOBAL CONSISTENCY REGISTRY
 * 
 * Single source of truth for risk labels, confidence tags, and volatility classifications
 * Ensures no page displays conflicting signals
 */

// ============================================================================
// RISK LEVEL CLASSIFICATION (SYSTEM-WIDE)
// ============================================================================

export function classifyRiskLevel(volatility) {
  if (volatility < 12) return { level: 'Low', color: 'emerald', badge: 'bg-emerald-100 text-emerald-700' };
  if (volatility < 18) return { level: 'Moderate', color: 'blue', badge: 'bg-blue-100 text-blue-700' };
  if (volatility < 25) return { level: 'Elevated', color: 'amber', badge: 'bg-amber-100 text-amber-700' };
  return { level: 'High', color: 'rose', badge: 'bg-rose-100 text-rose-700' };
}

// ============================================================================
// CONFIDENCE TIER CLASSIFICATION (SYSTEM-WIDE)
// ============================================================================

export function classifyConfidenceTier(confidence) {
  const normalized = typeof confidence === 'string' ? confidence.toLowerCase() : '';
  
  if (normalized === 'high' || confidence >= 0.8) {
    return { tier: 'high', label: 'High Confidence', badge: 'bg-emerald-100 text-emerald-700' };
  }
  if (normalized === 'medium' || confidence >= 0.5) {
    return { tier: 'medium', label: 'Medium Confidence', badge: 'bg-blue-100 text-blue-700' };
  }
  return { tier: 'low', label: 'Low Confidence', badge: 'bg-amber-100 text-amber-700' };
}

// ============================================================================
// VOLATILITY REGIME CLASSIFICATION (SYSTEM-WIDE)
// ============================================================================

export function classifyVolatilityRegime(vix) {
  if (vix < 15) return { regime: 'low', label: 'Low Volatility', badge: 'bg-emerald-100 text-emerald-700' };
  if (vix < 20) return { regime: 'normal', label: 'Normal Volatility', badge: 'bg-blue-100 text-blue-700' };
  if (vix < 30) return { regime: 'elevated', label: 'Elevated Volatility', badge: 'bg-amber-100 text-amber-700' };
  return { regime: 'high', label: 'High Volatility', badge: 'bg-rose-100 text-rose-700' };
}

// ============================================================================
// CRASH EXPOSURE CLASSIFICATION (SYSTEM-WIDE)
// ============================================================================

export function classifyCrashExposure(portfolioBeta, avgCorrelation, aggressiveBetaPct) {
  const score = (portfolioBeta * 0.4) + (avgCorrelation * 0.3) + (aggressiveBetaPct / 100 * 0.3);
  
  if (score > 1.2) return { level: 'High', badge: 'bg-rose-100 text-rose-700', description: 'Portfolio highly sensitive to market crashes' };
  if (score > 0.9) return { level: 'Moderate-High', badge: 'bg-amber-100 text-amber-700', description: 'Above-average crash sensitivity' };
  if (score > 0.7) return { level: 'Moderate', badge: 'bg-blue-100 text-blue-700', description: 'Average crash sensitivity' };
  return { level: 'Low', badge: 'bg-emerald-100 text-emerald-700', description: 'Below-average crash sensitivity' };
}

// ============================================================================
// CONSISTENCY REGISTRY (CACHED)
// ============================================================================

let consistencyRegistry = {};

export function registerMetric(key, value, source = 'calculated') {
  consistencyRegistry[key] = {
    value,
    source,
    timestamp: Date.now(),
    page: window.location.pathname
  };
}

export function getRegisteredMetric(key) {
  return consistencyRegistry[key];
}

export function clearRegistry() {
  consistencyRegistry = {};
}

// ============================================================================
// CONSISTENCY ENFORCEMENT
// ============================================================================

export function enforceConsistency(metricType, rawValue, context = {}) {
  const registryKey = `${metricType}_${context.symbol || 'portfolio'}`;
  const existing = getRegisteredMetric(registryKey);
  
  let adjustedValue = rawValue;
  let wasAdjusted = false;
  let adjustmentReason = null;
  
  // If metric exists in registry and differs significantly, normalize
  if (existing && Math.abs(existing.value - rawValue) > 0.01) {
    adjustedValue = existing.value;
    wasAdjusted = true;
    adjustmentReason = `Normalized to match ${existing.source} (calculated on ${existing.page})`;
  } else {
    // Register this as the canonical value
    registerMetric(registryKey, rawValue, context.source || 'current');
  }
  
  return {
    original: rawValue,
    adjusted: adjustedValue,
    wasAdjusted,
    adjustmentReason
  };
}

// ============================================================================
// CROSS-PAGE VALIDATION
// ============================================================================

export function validateCrossPageConsistency(metrics) {
  const issues = [];
  
  // Check for conflicting risk labels
  const riskClassifications = new Set();
  if (metrics.portfolioRisk) {
    riskClassifications.add(classifyRiskLevel(metrics.portfolioRisk).level);
  }
  
  // Check for conflicting confidence tiers
  const confidenceTiers = new Set();
  if (metrics.confidence) {
    confidenceTiers.add(classifyConfidenceTier(metrics.confidence).tier);
  }
  
  // Flag inconsistencies
  if (riskClassifications.size > 1) {
    issues.push({
      type: 'risk_label_conflict',
      message: 'Risk level classified differently across pages',
      severity: 'high'
    });
  }
  
  if (confidenceTiers.size > 1) {
    issues.push({
      type: 'confidence_conflict',
      message: 'Confidence tier inconsistent across pages',
      severity: 'medium'
    });
  }
  
  return {
    isConsistent: issues.length === 0,
    issues
  };
}
