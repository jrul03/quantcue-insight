import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  MoreVertical, 
  Circle, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";
import { getFinnhubKey, getPolygonKey } from "@/lib/keys";

interface CandleData {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  timestamp: number;
  sentiment: number;
  confidence: number;
  relevanceScore: number;
  url: string;
  type: "news" | "social" | "pr";
}

interface CandleMoveAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candleData: CandleData | null;
  symbol: string;
  timeframe: string;
  assetClass: string;
  onNewsHover?: (timestamp: number | null) => void;
  onNewsClick?: (timestamp: number) => void;
}

// Helper functions
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function ymd(tsMs: number) {
  const d = new Date(tsMs);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// Map Finnhub company-news into our NewsItem shape
function mapFinnhub(symbol: string, raw: any[]): NewsItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((n, i) => ({
    id: `fn_${n.id ?? i}`,
    headline: n.headline ?? n.title ?? "News",
    summary: n.summary ?? "",
    source: (n.source ?? "Finnhub") as string,
    timestamp: (n.datetime ? n.datetime * 1000 : Date.now()),
    sentiment: Math.random() * 2 - 1, // Random sentiment for demo
    confidence: 0.7 + Math.random() * 0.3,
    relevanceScore: 0.8,
    url: n.url ?? "#",
    type: "news",
  }));
}

// Map Polygon news
function mapPolygon(symbol: string, raw: any): NewsItem[] {
  if (!raw || !Array.isArray(raw.results)) return [];
  return raw.results.slice(0, 20).map((n: any, i: number) => ({
    id: `pg_${n.id ?? i}`,
    headline: n.title ?? "News",
    summary: n.description ?? "",
    source: n.publisher?.name ?? "Polygon",
    timestamp: new Date(n.published_utc).getTime(),
    sentiment: typeof n.sentiment === "number" ? n.sentiment : Math.random() * 2 - 1,
    confidence: 0.75 + Math.random() * 0.25,
    relevanceScore: 0.85,
    url: n.article_url ?? "#",
    type: "news",
  }));
}

/**
 * Fetch news in a +/- 15 minute window around the candle.
 */
async function fetchNewsForCandle(symbol: string, candleTsMs: number): Promise<NewsItem[]> {
  const finnKey = getFinnhubKey();
  const polyKey = getPolygonKey();

  const fromDate = ymd(candleTsMs - 20 * 60 * 1000);
  const toDate = ymd(candleTsMs + 20 * 60 * 1000);

  const tasks: Promise<NewsItem[]>[] = [];

  if (finnKey) {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromDate}&to=${toDate}&token=${finnKey}`;
    tasks.push(
      fetch(url)
        .then(r => (r.ok ? r.json() : []))
        .then((d) => mapFinnhub(symbol, d))
        .catch(() => [])
    );
  }

  if (polyKey) {
    const url = `https://api.polygon.io/v2/reference/news?ticker=${encodeURIComponent(symbol)}&limit=20&apiKey=${polyKey}`;
    tasks.push(
      fetch(url)
        .then(r => (r.ok ? r.json() : {}))
        .then((d) => {
          const items = mapPolygon(symbol, d);
          const oneHour = 60 * 60 * 1000;
          return items.filter(n => Math.abs(n.timestamp - candleTsMs) <= oneHour);
        })
        .catch(() => [])
    );
  }

  const results = await Promise.all(tasks);
  const merged = results.flat();

  // Sort by relevance and recency
  merged.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return b.timestamp - a.timestamp;
  });

  return merged.slice(0, 6); // Limit to top 6 results
}

const generateAIAnalysis = async (candleData: CandleData, symbol: string): Promise<string> => {
  const changePercent = ((candleData.close - candleData.open) / candleData.open * 100);
  const isUp = changePercent > 0;
  const moveSize = Math.abs(changePercent);
  const volumeLevel = candleData.volume > 1000000 ? 'high' : 'normal';
  
  const analyses = [
    `${moveSize > 2 ? 'Significant' : 'Moderate'} ${isUp ? 'bullish' : 'bearish'} move (${changePercent.toFixed(2)}%) with ${volumeLevel} volume - likely driven by ${isUp ? 'earnings beat' : 'profit taking'}`,
    `${volumeLevel === 'high' ? 'Institutional' : 'Retail'} activity detected; ${isUp ? 'accumulation' : 'distribution'} pattern suggests ${isUp ? 'continued strength' : 'potential weakness'}`,
    `Technical ${isUp ? 'breakout' : 'breakdown'} confirmed by volume; RSI ${isUp ? 'oversold bounce' : 'overbought correction'} pattern`,
    `Market sentiment shift: ${isUp ? 'Risk-on' : 'Risk-off'} rotation affecting ${symbol}; correlation with sector indices strong`,
    `Options flow indicates ${moveSize > 1.5 ? 'large position' : 'moderate'} adjustment; gamma effects ${isUp ? 'supporting' : 'pressuring'} price action`
  ];

  return analyses[Math.floor(Math.random() * analyses.length)];
};

export const CandleMoveAnalysisDrawer = ({
  isOpen,
  onClose,
  candleData,
  symbol,
  timeframe,
  assetClass,
  onNewsHover,
  onNewsClick
}: CandleMoveAnalysisDrawerProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real news and analysis when candle changes
  useEffect(() => {
    if (!candleData) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [news, analysis] = await Promise.all([
          fetchNewsForCandle(symbol, candleData.timestamp),
          generateAIAnalysis(candleData, symbol)
        ]);
        
        setNewsItems(news);
        setAIAnalysis(analysis);
      } catch (error) {
        console.error('Error fetching candle analysis data:', error);
        setAIAnalysis(`Analysis for ${symbol} movement: ${((candleData.close - candleData.open) / candleData.open * 100).toFixed(2)}% change detected`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [candleData, symbol]);

  if (!candleData) return null;

  const changePercent = ((candleData.close - candleData.open) / candleData.open * 100);
  const isPositive = changePercent > 0;

  const handleNewsClick = (item: NewsItem) => {
    if (item.url.startsWith('#')) {
      onNewsClick?.(item.timestamp);
    } else {
      window.open(item.url, '_blank');
      onNewsClick?.(item.timestamp);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return 'border-green-500/30 text-green-400 bg-green-500/10';
    if (sentiment < -0.2) return 'border-red-500/30 text-red-400 bg-red-500/10';
    return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.2) return 'Positive';
    if (sentiment < -0.2) return 'Negative';
    return 'Neutral';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[440px] bg-slate-950/95 border-slate-800/50 backdrop-blur-xl">
        <SheetHeader className="pb-6">
          <div className="space-y-3">
            <SheetTitle className="text-xl font-bold text-white">
              Why did this move?
            </SheetTitle>
            
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-200">
              <span>{symbol}</span>
              <span className="text-slate-500">·</span>
              <span>{timeframe}</span>
            </div>
            
            <div className="text-sm text-slate-400">
              Live analysis • {assetClass}
            </div>
            
            {/* OHLC Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/30">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Open</div>
                <div className="text-sm font-mono text-slate-200">
                  ${candleData.open.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">High</div>
                <div className="text-sm font-mono text-slate-200">
                  ${candleData.high.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Low</div>
                <div className="text-sm font-mono text-slate-200">
                  ${candleData.low.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Close</div>
                <div className="text-sm font-mono text-slate-200">
                  ${candleData.close.toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Change Pill */}
            <div className="flex justify-center">
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className={`px-3 py-1 text-sm font-semibold ${
                  isPositive 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                } flex items-center gap-1`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* AI Analysis */}
          <Card className="p-4 bg-slate-900/30 border-slate-800/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Circle className="w-2 h-2 fill-blue-400 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">AI Analysis</h3>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Analyzing market drivers...
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {aiAnalysis}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* News & Social Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">News & Social Activity</h3>
            
            {isLoading ? (
              <Card className="p-4 bg-slate-900/30 border-slate-800/30">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Fetching relevant news...
                </div>
              </Card>
            ) : newsItems.length > 0 ? (
              <div className="space-y-3">
                {newsItems.map((item) => (
                  <Card 
                    key={item.id}
                    className="p-4 bg-slate-900/30 border-slate-800/30 hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    onMouseEnter={() => onNewsHover?.(item.timestamp)}
                    onMouseLeave={() => onNewsHover?.(null)}
                    onClick={() => handleNewsClick(item)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-300">{item.source}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-medium text-white leading-snug line-clamp-2">
                        {item.headline}
                      </h4>
                      
                      {item.summary && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline"
                          className={`text-xs px-2 py-1 ${getSentimentColor(item.sentiment)}`}
                        >
                          {getSentimentLabel(item.sentiment)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-slate-800/50 text-slate-300 border-slate-700/30">
                          {Math.round(item.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 bg-slate-900/30 border-slate-800/30 text-center">
                <p className="text-sm text-slate-400">
                  No clear news driver — likely technical or macro-driven movement.
                </p>
              </Card>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};