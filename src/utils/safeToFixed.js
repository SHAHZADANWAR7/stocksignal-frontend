/**
 * Formats a number safely using .toFixed, handles null and non-number cases gracefully.
 *
 * @param {any} value - The value to format.
 * @param {number} digits - Number of decimal places (default 2).
 * @param {string} fallback - Fallback string if value can't be formatted (default "—").
 * @returns {string}
 */
function safeToFixed(value, digits = 2, fallback = "—") {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : fallback;
}

export { safeToFixed };
