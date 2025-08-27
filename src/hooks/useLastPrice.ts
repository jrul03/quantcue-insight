import { useEffect, useState } from "react";
import { getLastPrice } from "@/lib/priceService";

export function useLastPrice(symbol: string, isActive: boolean){
  const [price,setPrice]=useState<number|null>(null);
  const [ts,setTs]=useState<number|null>(null);
  useEffect(()=>{ if(!symbol) return; let live=true, id:any;
    const tick=async()=>{ 
      try {
        const p=await getLastPrice(symbol); 
        if(live && p!=null){ setPrice(p); setTs(Date.now()); }
      } catch(e) {
        console.warn(`Failed to fetch price for ${symbol}:`, e);
      }
      id=setTimeout(tick, isActive ? 7000 : 45000);
    }; 
    tick(); 
    return ()=>{ live=false; clearTimeout(id); };
  },[symbol,isActive]);
  return { price, lastUpdated: ts };
}