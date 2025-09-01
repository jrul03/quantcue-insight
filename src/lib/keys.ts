/**
 * API Key Management
 * Provides centralized access to external API keys
 */

const FINNHUB_API_KEY = "d2na3qpr01qn3vmk5lo0d2na3qpr01qn3vmk5log";

/**
 * Get Finnhub API key
 * @returns {string} The Finnhub API key
 */
export const getFinnhubKey = (): string => {
  if (!FINNHUB_API_KEY) {
    console.warn("⚠️ Finnhub API key is not configured");
    return "";
  }
  return FINNHUB_API_KEY;
};

/**
 * Get Polygon API key - DEPRECATED: Use polygon.ts client instead
 * @returns {string} The Polygon API key
 */
export const getPolygonKey = (): string => {
  const envKey = import.meta.env.VITE_POLYGON_KEY;
  
  console.log("🔑 Polygon API Key check (DEPRECATED):", {
    envKey: envKey ? "✅ Available" : "❌ Missing"
  });
  
  if (!envKey) {
    console.warn("⚠️ VITE_POLYGON_KEY environment variable not set");
    return "";
  }
  return envKey;
};

/**
 * Check if API keys are available
 * @returns {object} Object with availability status for each API
 */
export const checkApiKeys = () => {
  return {
    finnhub: !!FINNHUB_API_KEY,
    polygon: !!getPolygonKey(),
  };
};