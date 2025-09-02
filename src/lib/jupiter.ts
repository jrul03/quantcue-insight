// src/lib/jupiter.ts
import { fetchWithBackoff, getFromCache, setCache } from "./providers";

const JUP_BASE = (import.meta.env.VITE_JUPITER_BASE as string) || "https://quote-api.jup.ag/v6";
const JUP_KEY = import.meta.env.VITE_JUPITER_KEY as string;
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export async function getTokenList() {
  const key = "jup:tokenlist";
  const cached = getFromCache<any[]>(key);
  if (cached) return cached;
  const res = await fetchWithBackoff("https://token.jup.ag/all", {}, { retries: 2 });
  const json = await res.json();
  setCache(key, json, 24 * 3600_000); // 24h
  return json as Array<{ address: string; symbol: string; name?: string; decimals?: number; verified?: boolean }>;
}

/**
 * Quote price in USDC for a baseMint.
 * outAmount is in USDC minor units (6 decimals). price = outAmount / 1e6 for 1 base unit.
 */
export async function getQuoteUSDC(baseMint: string) {
  const key = `jup:quote:${baseMint}`;
  const cached = getFromCache<any>(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    inputMint: baseMint,
    outputMint: USDC_MINT,
    amount: String(1_000_000), // 1 base token * 1e6 if token has 6 decimals; for simplicity
    slippageBps: "25",
    onlyDirectRoutes: "true",
  });

  const headers: HeadersInit = {};
  if (JUP_KEY) headers["Authorization"] = `Bearer ${JUP_KEY}`;

  const res = await fetchWithBackoff(`${JUP_BASE}/quote?${params.toString()}`, { headers }, { retries: 2, baseDelayMs: 250 });
  const json = await res.json();

  // Jupiter v6: best route in "data" or "routePlan"; normalize
  const outAmount = Number(json?.outAmount ?? json?.data?.[0]?.outAmount);
  if (!outAmount || Number.isNaN(outAmount)) return null;

  const out = {
    price: outAmount / 1e6, // USDC has 6 decimals
    ts: Date.now(),
    source: "jupiter" as const,
  };
  setCache(key, out, 10_000); // 10s
  return out;
}