export function validateShadowPortfolioResults(results) {
  return results && typeof results === 'object' && results.total_value !== undefined;
}

export function assertProjectionChartData(data) {
  return Array.isArray(data) && data.length > 0;
}

export function getSustainabilityLabel(score) {
  if (score >= 80) return 'Highly Sustainable';
  if (score >= 60) return 'Sustainable';
  if (score >= 40) return 'Moderately Sustainable';
  return 'Low Sustainability';
}

export function getSustainabilityColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export function validateBeforeRender(data) {
  return data && Object.keys(data).length > 0;
}

export function validateIncomeSource(source, monthlyAmount) {
  if (!source || source.trim() === '') {
    return { valid: false, error: 'Income source is required' };
  }
  if (!monthlyAmount || monthlyAmount <= 0) {
    return { valid: false, error: 'Monthly amount must be greater than 0' };
  }
  return { valid: true };
}
