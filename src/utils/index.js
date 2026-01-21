/**
 * Creates a page URL for navigation
 * @param {string} pageName - The page name (e.g., "Dashboard", "Holdings")
 * @param {string} params - Optional URL parameters (e.g., "?id=123&sort=asc")
 * @returns {string} - The page URL path
 */
export const createPageUrl = (pageName, params = '') => {
  return `/${pageName}${params}`;
};
