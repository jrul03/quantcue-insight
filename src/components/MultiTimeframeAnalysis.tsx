import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeframeData {
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  rsi: number;
  macd: number;
  support: number;
  resistance: number;
  volume: number;
  lastUpdate: number;
}

interface MultiTimeframeAnalysisProps {
  symbol: string;
  timeframes: string[];
}

export const MultiTimeframeAnalysis = ({ symbol, timeframes }: MultiTimeframeAnalysisProps) => {
  const [timeframeData, setTimeframeData] = useState<TimeframeData[]>([]);
  const [selectedTF, setSelectedTF] = useState<string>('all');

  const allTimeframes = ['5m', '15m', '1H', '4H', '1D', '1W'];

  useEffect(() => {
    const generateTimeframeData = () => {
      const data: TimeframeData[] = allTimeframes.map(tf => {
        const trend = Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral';
        const strength = Math.random() * 100;
        const basePrice = 175 + (Math.random() - 0.5) * 10;
        
        return {
          timeframe: tf,
          trend,
          strength,
          rsi: 30 + Math.random() * 40,
          macd: (Math.random() - 0.5) * 2,
          support: basePrice * (0.97 + Math.random() * 0.02),
          resistance: basePrice * (1.01 + Math.random() * 0.02),
          volume: Math.random() * 2,
          lastUpdate: Date.now()
        };
      });
      
      setTimeframeData(data);
    };

    generateTimeframeData();
    const interval = setInterval(generateTimeframeData, 10000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'border-green-400/30 bg-green-400/10';
      case 'bearish': return 'border-red-400/30 bg-red-400/10';
      default: return 'border-yellow-400/30 bg-yellow-400/10';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 70) return 'text-green-400';
    if (strength >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredData = selectedTF === 'all' ? timeframeData : timeframeData.filter(d => d.timeframe === selectedTF);

  // Calculate overall sentiment
  const bullishCount = timeframeData.filter(d => d.trend === 'bullish').length;
  const bearishCount = timeframeData.filter(d => d.trend === 'bearish').length;
  const overallSentiment = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-slate-300">Multi-Timeframe</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-slate-400 cursor-help">What's this?</span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs max-w-[220px]">At-a-glance trend and strength across multiple timeframes with key levels.</div>
            </TooltipContent>
          </Tooltip>
        </div>
        <Badge variant="outline" className="border-blue-400/50 text-blue-400 text-xs">
          {symbol}
        </Badge>
      </div>

      {/* Overall Sentiment */}
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Overall Sentiment</span>
          {getTrendIcon(overallSentiment)}
        </div>
        <div className="text-lg font-bold capitalize mb-1">
          <span className={
            overallSentiment === 'bullish' ? 'text-green-400' :
            overallSentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'
          }>
            {overallSentiment}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          {bullishCount} bullish • {bearishCount} bearish • {timeframeData.length - bullishCount - bearishCount} neutral
        </div>
      </Card>

      {/* Timeframe Filter */}
      <div className="flex gap-1 p-1 bg-slate-800/30 rounded-lg">
        <Button
          size="sm"
          variant={selectedTF === 'all' ? "default" : "ghost"}
          onClick={() => setSelectedTF('all')}
          className="text-xs h-7 px-2 flex-1"
        >
          All
        </Button>
        {allTimeframes.slice(0, 3).map((tf) => (
          <Button
            key={tf}
            size="sm"
            variant={selectedTF === tf ? "default" : "ghost"}
            onClick={() => setSelectedTF(tf)}
            className="text-xs h-7 px-2 flex-1"
          >
            {tf}
          </Button>
        ))}
      </div>

      {/* Timeframe Analysis */}
      <ScrollArea className="h-80">
        <div className="space-y-3">
          {filteredData.length === 0 && (
            <Card className="p-3 bg-slate-900/50 border-slate-700/50 text-xs text-slate-400">
              No analysis available yet. Try changing the selected timeframes.
            </Card>
          )}
          {filteredData.map((data) => (
            <Card key={data.timeframe} className={`p-3 border ${getTrendColor(data.trend)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTrendIcon(data.trend)}
                  <div>
                    <div className="font-semibold text-sm">{data.timeframe}</div>
                    <div className="text-xs text-slate-400 capitalize">{data.trend} trend</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${getStrengthColor(data.strength)}`}>
                    {data.strength.toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400">strength</div>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <div className="text-slate-400">RSI</div>
                  <div className={`font-mono ${
                    data.rsi > 70 ? 'text-red-400' : 
                    data.rsi < 30 ? 'text-green-400' : 'text-slate-300'
                  }`}>
                    {data.rsi.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">MACD</div>
                  <div className={`font-mono ${data.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.macd.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Support/Resistance */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-red-400/10 rounded p-2">
                  <div className="text-slate-400">Support</div>
                  <div className="font-mono text-red-400">${data.support.toFixed(2)}</div>
                </div>
                <div className="bg-green-400/10 rounded p-2">
                  <div className="text-slate-400">Resistance</div>
                  <div className="font-mono text-green-400">${data.resistance.toFixed(2)}</div>
                </div>
              </div>

              {/* Volume & Strength Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Volume</span>
                  <span className={`${data.volume > 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.volume > 1 ? 'Above Avg' : 'Below Avg'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all ${
                      data.strength >= 70 ? 'bg-green-400' :
                      data.strength >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${data.strength}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Confluence Analysis */}
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">Confluence</span>
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          <div>• Higher timeframes show {overallSentiment} bias</div>
          <div>• Short-term: {timeframeData.slice(0, 2).filter(d => d.trend === 'bullish').length}/2 bullish</div>
          <div>• Medium-term: {timeframeData.slice(2, 4).filter(d => d.trend === 'bullish').length}/2 bullish</div>
          <div>• Long-term: {timeframeData.slice(4, 6).filter(d => d.trend === 'bullish').length}/2 bullish</div>
        </div>
      </Card>
    </div>
  );
};
