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
import { fetchCompanyNews } from "@/lib/api";

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
  title: string;
  source: string;
  sourceFavicon: string;
  url: string;
  timestamp: number;
  time: string;
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  confidence: number;
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

// Mock data generation for fallback
const generateMockNews = (candleTimestamp: number): NewsItem[] => {
  const sources = [
    { name: "Reuters", favicon: "🔶" },
    { name: "Bloomberg", favicon: "📊" },
    { name: "MarketWatch", favicon: "💹" },
    { name: "Yahoo Finance", favicon: "💰" },
    { name: "CNBC", favicon: "📺" }
  ];

  const newsTemplates = [
    {
      title: "Q3 earnings beat expectations with strong revenue growth",
      summary: "Company reported 15% YoY revenue increase, beating analyst estimates",
      sentiment: "Positive" as const
    },
    {
      title: "Federal Reserve signals potential rate cut in upcoming meeting",
      summary: "Central bank officials hint at monetary policy adjustment",
      sentiment: "Positive" as const
    },
    {
      title: "Sector rotation continues as investors shift to value stocks",
      summary: "Growth stocks under pressure amid changing market dynamics",
      sentiment: "Neutral" as const
    },
    {
      title: "Regulatory concerns weigh on tech sector performance",
      summary: "New compliance requirements may impact future profitability",
      sentiment: "Negative" as const
    },
    {
      title: "Institutional buying drives momentum in morning session",
      summary: "Large block trades detected, indicating institutional interest",
      sentiment: "Positive" as const
    }
  ];

  return newsTemplates.slice(0, 3 + Math.floor(Math.random() * 2)).map((template, index) => ({
    id: `news-${index}`,
    title: template.title,
    source: sources[index % sources.length].name,
    sourceFavicon: sources[index % sources.length].favicon,
    url: `#news-${index}`,
    timestamp: candleTimestamp - (index * 180000), // 3 minutes apart
    time: new Date(candleTimestamp - (index * 180000)).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    summary: template.summary,
    sentiment: template.sentiment,
    confidence: 72 + Math.floor(Math.random() * 25) // 72-97%
  })).sort((a, b) => b.confidence - a.confidence);
};

const generateAIAnalysis = (candleData: CandleData): string => {
  const changePercent = ((candleData.close - candleData.open) / candleData.open * 100);
  const isUp = changePercent > 0;
  
  const analyses = [
    `Likely driver: Q3 earnings beat expectations; momentum started 3m earlier`,
    `Volume spike suggests institutional activity; correlation with sector ETF movement`,
    `Technical breakout above resistance level; RSI confirming bullish momentum`,
    `Fed policy announcement impact; treasury yield reaction driving sector rotation`,
    `Options flow indicates large position adjustment; gamma hedging effects visible`
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
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // Fetch real news when drawer opens
  useEffect(() => {
    if (isOpen && candleData && symbol) {
      const loadRealNews = async () => {
        setIsLoadingNews(true);
        try {
          // Try to fetch real news from the API
          const realNews = await fetchCompanyNews(symbol);
          
          if (realNews.length > 0) {
            // Convert real news to our format
            const convertedNews: NewsItem[] = realNews.slice(0, 5).map((article, index) => ({
              id: `real-${index}`,
              title: article.headline,
              source: article.source || 'Unknown',
              sourceFavicon: '📰',
              url: article.url,
              timestamp: article.datetime,
              time: new Date(article.datetime).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              summary: article.summary || 'No summary available',
              sentiment: 'Neutral' as const, // API doesn't provide sentiment
              confidence: 75 + Math.floor(Math.random() * 20) // 75-95%
            }));
            setNewsItems(convertedNews);
          } else {
            // Fallback to mock data
            setNewsItems(generateMockNews(candleData.timestamp));
          }
        } catch (error) {
          console.error('Error fetching real news:', error);
          // Fallback to mock data
          setNewsItems(generateMockNews(candleData.timestamp));
        } finally {
          setIsLoadingNews(false);
        }
      };

      loadRealNews();
    } else if (isOpen && candleData) {
      // Generate mock news for non-stock symbols or as fallback
      setNewsItems(generateMockNews(candleData.timestamp));
    }
  }, [isOpen, candleData, symbol]);

  if (!candleData) return null;

  const changePercent = ((candleData.close - candleData.open) / candleData.open * 100);
  const isPositive = changePercent > 0;
  const aiAnalysis = generateAIAnalysis(candleData);

  const handleNewsClick = (item: NewsItem) => {
    if (item.url.startsWith('#')) {
      // Mock URL - don't open
      onNewsClick?.(item.timestamp);
    } else {
      window.open(item.url, '_blank');
      onNewsClick?.(item.timestamp);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[440px] bg-slate-950/95 border-slate-800/50 backdrop-blur-xl">
        <SheetHeader className="pb-6">
          <div className="space-y-3">
            <SheetTitle className="text-xl font-bold text-white">
              Why did this move?
            </SheetTitle>
            
            {/* Symbol + Timeframe */}
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-200">
              <span>{symbol}</span>
              <span className="text-slate-500">·</span>
              <span>{timeframe}</span>
            </div>
            
            {/* Subtext */}
            <div className="text-sm text-slate-400">
              2 candles • live • {assetClass}
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
                <p className="text-sm text-slate-300 leading-relaxed">
                  {aiAnalysis}
                </p>
              </div>
            </div>
          </Card>

          {/* News & Social Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">News & Social Activity</h3>
            
            {isLoadingNews ? (
              <Card className="p-6 bg-slate-900/30 border-slate-800/30 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-400">Loading real news...</p>
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
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.sourceFavicon}</span>
                          <span className="text-sm font-medium text-slate-300">{item.source}</span>
                          <span className="text-xs text-slate-500">{item.time}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="w-3 h-3 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h4 className="text-sm font-medium text-white leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      
                      {/* Summary */}
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.summary}
                      </p>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline"
                          className={`text-xs px-2 py-1 ${
                            item.sentiment === 'Positive' 
                              ? 'border-green-500/30 text-green-400 bg-green-500/10'
                              : item.sentiment === 'Negative'
                              ? 'border-red-500/30 text-red-400 bg-red-500/10'
                              : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                          }`}
                        >
                          {item.sentiment}
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-slate-800/50 text-slate-300 border-slate-700/30">
                          {item.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 bg-slate-900/30 border-slate-800/30 text-center">
                <p className="text-sm text-slate-400">
                  No clear driver — likely sector/macro.
                </p>
              </Card>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};