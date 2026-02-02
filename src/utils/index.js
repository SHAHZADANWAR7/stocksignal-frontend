export function createPageUrl(pageName) {
  const pathMapping = {
    "Dashboard": "dashboard",
    "Practice Simulator": "practice-trading",
    "Browse Investments": "companies",
    "Index Funds": "index-funds",
    "AI Analysis": "analysis",
    "My Portfolio": "holdings",
    "Transactions": "transactions",
    "Goal Intelligence": "goal-intelligence",
    "Investor IQ": "investor-score",
    "Health Monitor": "portfolio-health",
    "Cash Intelligence": "cash-intelligence",
    "Shadow Portfolios": "shadow-portfolios",
    "Challenges": "challenges",
    "Simulation Lab": "simulation-lab",
    "Market Insights": "market-insights",
    "Platform Philosophy": "platform-philosophy",
    "Notification Settings": "notification-settings",
    "Contact Support": "contact-support",
    "Home": "home",
    "Login": "login",
    "TermsOfService": "terms-of-service",
    "PrivacyPolicy": "privacy-policy",
    "Disclaimer": "disclaimer",
  };

  const safeName = (pageName || "").trim();

  // 1) Exact mapping match
  if (pathMapping[safeName]) {
    return `/${pathMapping[safeName]}`;
  }

  // 2) Normalize camelCase/PascalCase into space-separated words, e.g. "PracticeTrading" -> "Practice Trading"
  const splitCamel = safeName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")     // aB -> a B
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")   // XMLHttp -> XML Http
    .trim();

  // 3) Check mapping for the split form (e.g. if mapping uses "Practice Simulator" vs "Practice Simulator")
  if (pathMapping[splitCamel]) {
    return `/${pathMapping[splitCamel]}`;
  }

  // 4) Fallback: lower-case and replace spaces with hyphens
  const path = splitCamel.toLowerCase().replace(/\s+/g, '-');

  return `/${path}`;
}

export * from "./awsClient.js";
