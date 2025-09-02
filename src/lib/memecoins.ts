import { getJupiterPrices } from './jupiterPrice';
import { resolveMint, isSolMint } from './jupiterTokens';
import { getJSON } from './apiClient';
import { COINGECKO_IDS } from './assets';

export interface MemePriceResult {
  key: string;
  price: number | null;
  source: 'jupiter' | 'coingecko' | 'unknown';
  mint?: string;
  symbol?: string;
}

/**
 * Get prices for multiple meme coins using Jupiter (primary) and CoinGecko (fallback)
 */
export async function getManyMemePrices(ids: string[]): Promise<MemePriceResult[]> {
  if (!ids.length) return [];

  const results: MemePriceResult[] = [];
  const mintMap = new Map<string, { key: string; symbol: string }>();
  
  // Step 1: Resolve all symbols/mints to mint addresses
  for (const id of ids) {
    const resolved = await resolveMint(id);
    if (resolved) {
      mintMap.set(resolved.mint, { key: id, symbol: resolved.symbol });
      results.push({
        key: id,
        price: null,
        source: 'unknown',
        mint: resolved.mint,
        symbol: resolved.symbol
      });
    } else {
      // Add placeholder for CoinGecko fallback
      results.push({
        key: id,
        price: null,
        source: 'unknown',
        symbol: id.toUpperCase()
      });
    }
  }

  // Step 2: Batch fetch Jupiter prices for resolved mints
  const mints = Array.from(mintMap.keys());
  if (mints.length > 0) {
    try {
      const jupiterPrices = await getJupiterPrices(mints);
      
      // Update results with Jupiter data
      for (const result of results) {
        if (result.mint && jupiterPrices[result.mint]) {
          result.price = jupiterPrices[result.mint].usdPrice;
          result.source = 'jupiter';
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Jupiter prices:', error);
    }
  }

  // Step 3: Fallback to CoinGecko for missing prices
  for (const result of results) {
    if (result.price === null && result.symbol) {
      const coinId = COINGECKO_IDS[result.symbol];
      if (coinId) {
        try {
          const cgData = await getJSON<Record<string, { usd: number }>>(
            `coingecko-${coinId}`,
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
            15_000 // 15s TTL
          );
          
          if (cgData[coinId]?.usd) {
            result.price = cgData[coinId].usd;
            result.source = 'coingecko';
          }
        } catch (error) {
          console.warn(`Failed to fetch CoinGecko price for ${result.symbol}:`, error);
        }
      }
    }
  }

  return results;
}

/**
 * Get price for single meme coin
 */
export async function getMemePrice(id: string): Promise<number | null> {
  const results = await getManyMemePrices([id]);
  return results[0]?.price ?? null;
}