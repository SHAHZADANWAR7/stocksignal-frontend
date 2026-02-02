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

  const safeName = pageName || "";
  const path = pathMapping[safeName] || safeName.toLowerCase().replace(/\s+/g, '-');
  return `/${path}`;
}

export * from "./awsClient.js";
