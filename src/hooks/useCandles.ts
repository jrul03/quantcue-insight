import { useEffect, useState } from "react";
import { getCandles } from "@/lib/priceService";

export function useCandles(symbol: string, resolution: "1"|"5"|"15"|"60"|"D"){
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{ if(!symbol) return; let live=true;
    (async()=>{ 
      setLoading(true); 
      try {
        const c=await getCandles(symbol, resolution); 
        if(live) setData(c); 
      } catch(e) {
        console.warn(`Failed to fetch candles for ${symbol}:`, e);
      }
      setLoading(false); 
    })();
    const id = setInterval(async()=>{ 
      try {
        const c=await getCandles(symbol, resolution); 
        if(live) setData(c); 
      } catch(e) {
        console.warn(`Failed to refresh candles for ${symbol}:`, e);
      }
    }, resolution==="D" ? 120_000 : 30_000);
    return ()=>{ live=false; clearInterval(id); };
  },[symbol,resolution]);
  return { data, loading };
}