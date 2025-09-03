import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useTopMovers } from "@/hooks/useTopMovers";

type Kind = "stocks" | "crypto";

interface TopMoversPanelProps {
  assetClass: Kind;
  onSelectSymbol?: (symbol: string, lastPrice?: number, change?: number) => void;
}

export const TopMoversPanel = ({ assetClass, onSelectSymbol }: TopMoversPanelProps) => {
  const [direction, setDirection] = useState<"gainers"|"losers">("gainers");
  const { data, isLoading, refetch, isFetching } = useTopMovers(assetClass, direction);

  const movers = data || [];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-600/30 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {direction === 'gainers' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <h3 className="text-sm font-semibold text-white">Top {direction === 'gainers' ? 'Gainers' : 'Losers'}</h3>
            <Badge variant="outline" className="text-[10px] border-slate-600/60">
              {assetClass.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={direction === 'gainers' ? 'default' : 'ghost'}
              className="h-7 px-2 text-xs"
              onClick={() => setDirection('gainers')}
            >
              Gainers
            </Button>
            <Button
              size="sm"
              variant={direction === 'losers' ? 'default' : 'ghost'}
              className="h-7 px-2 text-xs"
              onClick={() => setDirection('losers')}
            >
              Losers
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading && (
            <div className="text-xs text-slate-400">Loading movers…</div>
          )}
          {!isLoading && movers.length === 0 && (
            <div className="text-xs text-slate-400">No data available.</div>
          )}
          {!isLoading && movers.map((m) => (
            <button
              key={m.symbol}
              onClick={() => onSelectSymbol?.(m.symbol, m.lastPrice, m.change)}
              className="w-full text-left"
            >
              <Card className="p-2.5 bg-slate-900/40 border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white">{m.symbol}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${m.changePct >= 0 ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400'}`}
                      >
                        {m.changePct >= 0 ? '+' : ''}{m.changePct.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400">Vol: {Intl.NumberFormat('en', { notation: 'compact' }).format(m.volume)}</div>
                  </div>
                  <div className={`font-mono font-bold ${m.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${m.lastPrice.toFixed(m.lastPrice < 1 ? 6 : 2)}
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

