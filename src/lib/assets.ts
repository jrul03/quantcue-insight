/**
 * Asset class detection and symbol normalization for different providers
 */

export type AssetClass = 'stocks' | 'crypto' | 'fx';

export function detectAssetClass(symbol: string): AssetClass {
  const s = symbol.toUpperCase().trim();
  
  // FX detection: Contains /FX or matches XXX/XXX pattern
  if (s.includes('/FX') || /^[A-Z]{3}\/[A-Z]{3}$/.test(s)) return 'fx';
  
  // Crypto detection: X: prefix, crypto suffixes, or known crypto symbols
  if (/^X:/.test(s) || 
      /^[A-Z0-9]{2,10}(-|:)?(USD|USDT|USDC)$/.test(s) || 
      ['BTC','ETH','DOGE','SHIB','PEPE','BONK','FLOKI','WIF','SOL','ADA','XRP','BNB'].includes(s)) {
    return 'crypto';
  }
  
  return 'stocks';
}

/**
 * Normalize symbols to provider formats
 */
export function toPolygonSymbol(symbol: string, cls: AssetClass): string {
  const s = symbol.toUpperCase().trim();
  
  if (cls === 'crypto') {
    // Accept BTC, BTCUSD, BTC-USD, BTC/USDT, X:BTCUSD → normalize to X:BASEQUOTE (USD/USDT resolve to USD)
    const base = s.replace(/^X:/,'').replace('-','').replace('/','').replace(':','');
    const m = base.match(/^([A-Z0-9]+)(USD|USDT|USDC)?$/);
    const b = m?.[1] || s;
    const q = (m?.[2] || 'USD').replace('USDT','USD').replace('USDC','USD');
    return `X:${b}${q}`;
  }
  
  if (cls === 'fx') {
    // EURUSD → C:EURUSD for Polygon FX
    const pair = s.replace('/','');
    return `C:${pair}`;
  }
  
  return s; // stocks unchanged
}

/**
 * Minimal CoinGecko id map for meme coins not on Polygon
 */
export const COINGECKO_IDS: Record<string, string> = {
  'PEPE': 'pepe',
  'SHIB': 'shiba-inu',
  'FLOKI': 'floki',
  'BONK': 'bonk',
  'WIF': 'dogwifcoin',
  'DOGE': 'dogecoin'
};

/**
 * Get CoinGecko price for meme coins not supported by Polygon
 */
export async function getCoinGeckoPrice(symbol: string): Promise<number | null> {
  try {
    const cleanSymbol = symbol.replace('-USD', '').replace('USD', '');
    const coinId = COINGECKO_IDS[cleanSymbol];
    
    if (!coinId) return null;
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data[coinId]?.usd || null;
  } catch (error) {
    console.warn(`Failed to fetch CoinGecko price for ${symbol}:`, error);
    return null;
  }
}