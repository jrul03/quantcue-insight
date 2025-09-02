import { getJSON } from './apiClient';

interface JupiterPriceData {
  usdPrice: number;
  decimals?: number;
  priceChange24h?: number;
  blockId?: number;
}

/**
 * Fetch Jupiter prices in batches of up to 50 mints
 */
export async function getJupiterPrices(mints: string[]): Promise<Record<string, JupiterPriceData>> {
  if (!mints.length) return {};

  const results: Record<string, JupiterPriceData> = {};
  
  // Process in chunks of 50
  for (let i = 0; i < mints.length; i += 50) {
    const chunk = mints.slice(i, i + 50);
    const ids = chunk.join(',');
    const key = `jupiter-price-${ids}`;
    const url = `https://lite-api.jup.ag/price/v3?ids=${ids}`;
    
    try {
      const data = await getJSON<Record<string, { price: string; priceChange24h?: string; blockId?: number }>>(
        key, 
        url, 
        10_000 // 10s TTL
      );
      
      // Transform to expected format
      for (const [mint, priceData] of Object.entries(data)) {
        if (priceData?.price) {
          results[mint] = {
            usdPrice: parseFloat(priceData.price),
            priceChange24h: priceData.priceChange24h ? parseFloat(priceData.priceChange24h) : undefined,
            blockId: priceData.blockId
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch Jupiter prices for chunk ${i}-${i + chunk.length}:`, error);
    }
  }
  
  return results;
}