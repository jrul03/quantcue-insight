// Crypto data orchestrator - routes to appropriate providers
import { detectAssetClass } from './assets';
import { getLatestTrade, getLatestQuote, getSnapshot } from './polygon';
import { getTokenList, getQuoteUSDC } from './jupiter';
import { getManyMemePrices } from './memecoins';

export interface CryptoPriceResult {
  price: number | null;
  change?: number | null;
  changePct?: number | null;
  source: 'polygon' | 'jupiter' | 'coingecko';
  ts: number;
}

// Common mints for major cryptos that work with Jupiter
const MAJOR_CRYPTO_MINTS: Record<string, string> = {
  'BTC': 'So11111111111111111111111111111111111111112', // Wrapped SOL placeholder
  'ETH': 'So11111111111111111111111111111111111111112',
  'SOL': 'So11111111111111111111111111111111111111112',
};

/**
 * Get crypto price - routes to best provider based on symbol
 */
export async function getCryptoPrice(symbol: string): Promise<CryptoPriceResult | null> {
  try {
    const assetClass = detectAssetClass(symbol);
    
    if (assetClass !== 'crypto') {
      return null;
    }

    // Major cryptos: try Polygon first (better liquidity/accuracy)
    if (['BTC', 'ETH', 'SOL'].includes(symbol.toUpperCase())) {
      try {
        const price = await getLatestTrade(symbol) || await getLatestQuote(symbol);
        if (price !== null) {
          // Get change data from snapshot
          const snapshot = await getSnapshot(symbol);
          const prevClose = snapshot?.ticker?.prevDay?.c || null;
          const change = prevClose ? price - prevClose : null;
          const changePct = prevClose && change !== null ? (change / prevClose) * 100 : null;
          
          return {
            price,
            change,
            changePct,
            source: 'polygon',
            ts: Date.now()
          };
        }
      } catch (error) {
        console.warn(`Polygon failed for ${symbol}, trying Jupiter:`, error);
      }
    }

    // Fallback to meme coin pipeline (Jupiter + CoinGecko)
    const memeResults = await getManyMemePrices([symbol]);
    const result = memeResults[0];
    
    if (result?.price !== null) {
      return {
        price: result.price,
        source: result.source as any,
        ts: Date.now()
      };
    }

    return null;
  } catch (error) {
    console.warn(`Failed to get crypto price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get many crypto prices in batch
 */
export async function getManyCryptoPrices(symbols: string[]): Promise<Record<string, CryptoPriceResult>> {
  const results: Record<string, CryptoPriceResult> = {};
  
  // Separate majors from memes
  const majors: string[] = [];
  const memes: string[] = [];
  
  for (const symbol of symbols) {
    if (['BTC', 'ETH', 'SOL'].includes(symbol.toUpperCase())) {
      majors.push(symbol);
    } else {
      memes.push(symbol);
    }
  }
  
  // Fetch majors individually (could batch later)
  await Promise.allSettled(majors.map(async (symbol) => {
    const price = await getCryptoPrice(symbol);
    if (price) {
      results[symbol] = price;
    }
  }));
  
  // Batch fetch memes
  if (memes.length > 0) {
    try {
      const memeResults = await getManyMemePrices(memes);
      for (const result of memeResults) {
        if (result.price !== null) {
          results[result.key] = {
            price: result.price,
            source: result.source as any,
            ts: Date.now()
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch meme batch:', error);
    }
  }
  
  return results;
}