/**
 * API Key Management
 * Provides centralized access to external API keys
 */

const FINNHUB_API_KEY = "d2na3qpr01qn3vmk5lo0d2na3qpr01qn3vmk5log";
export const POLYGON_KEY: string = import.meta.env.VITE_POLYGON_KEY || "";

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
 * Get Polygon API key
 * @returns {string} The Polygon API key
 */
export const getPolygonKey = (): string => {
  if (!POLYGON_KEY) {
    console.warn("⚠️ Polygon API key is not configured");
    return "";
  }
  return POLYGON_KEY;
};

/**
 * Check if API keys are available
 * @returns {object} Object with availability status for each API
 */
export const checkApiKeys = () => {
  return {
    finnhub: !!FINNHUB_API_KEY,
    polygon: !!POLYGON_KEY,
  };
};