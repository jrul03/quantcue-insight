import { getJSON } from './apiClient';

interface JupiterToken {
  address: string;
  symbol: string;
  name?: string;
  decimals?: number;
  verified?: boolean;
  tags?: string[];
}

/**
 * Get Jupiter token list with 24h cache
 */
export async function getJupiterTokenList(): Promise<JupiterToken[]> {
  try {
    const tokens = await getJSON<JupiterToken[]>(
      'jupiter-tokens-all',
      'https://token.jup.ag/all',
      24 * 60 * 60 * 1000 // 24h TTL
    );
    return tokens || [];
  } catch (error) {
    console.warn('Failed to fetch Jupiter token list:', error);
    return [];
  }
}

/**
 * Check if string is a Solana mint address (base58, 32-44 chars)
 */
export function isSolMint(input: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.trim());
}

/**
 * Resolve symbol or mint to canonical mint address and symbol
 */
export async function resolveMint(input: string): Promise<{mint: string; symbol: string} | null> {
  const trimmed = input.trim();
  
  // If already a mint address, return as-is with truncated symbol
  if (isSolMint(trimmed)) {
    return {
      mint: trimmed,
      symbol: trimmed.slice(0, 6).toUpperCase()
    };
  }
  
  // Otherwise, look up by symbol in token list
  try {
    const tokens = await getJupiterTokenList();
    const normalizedInput = trimmed.toUpperCase();
    
    // Find matching tokens (case-insensitive symbol match)
    const candidates = tokens.filter(token => 
      token.symbol.toUpperCase() === normalizedInput
    );
    
    if (!candidates.length) return null;
    
    // Prefer verified tokens, then fall back to first match
    const chosen = candidates.find(t => t.verified) || candidates[0];
    
    return {
      mint: chosen.address,
      symbol: chosen.symbol.toUpperCase()
    };
  } catch (error) {
    console.warn(`Failed to resolve mint for ${input}:`, error);
    return null;
  }
}
