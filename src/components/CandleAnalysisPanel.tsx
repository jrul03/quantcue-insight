import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ExternalLink, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

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
  type: 'news' | 'social' | 'pr';
}

interface CandleAnalysisPanelProps {
  candle: CandleData | null;
  asset: { symbol: string; assetClass: string };
  onClose: () => void;
  onHighlightCandle: (timestamp: number) => void;
}

export const CandleAnalysisPanel = ({ candle, asset, onClose, onHighlightCandle }: CandleAnalysisPanelProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'news' | 'social'>('all');
  const [aiSummary, setAiSummary] = useState<string>("");

  // Mock news/social data generation
  const generateMockNews = (candleData: CandleData): NewsItem[] => {
    const isPositive = candleData.close > candleData.open;
    const volatility = Math.abs((candleData.high - candleData.low) / candleData.open);
    const volumeSpike = candleData.volume > 1000000;

    const mockItems: NewsItem[] = [];
    
    // Generate relevant news based on asset type and price movement
    if (asset.assetClass === 'stocks') {
      if (isPositive && volatility > 0.02) {
        mockItems.push({
          id: '1',
          headline: `${asset.symbol} surges on positive earnings guidance`,
          summary: 'Company raises Q4 revenue forecast, citing strong demand and operational efficiency gains',
          source: 'Reuters',
          timestamp: candleData.timestamp - 240000, // 4 minutes before
          sentiment: 0.78,
          confidence: 0.92,
          relevanceScore: 0.95,
          url: '#',
          type: 'news'
        });
      } else if (!isPositive && volatility > 0.02) {
        mockItems.push({
          id: '2',
          headline: `${asset.symbol} drops on regulatory concerns`,
          summary: 'SEC announces investigation into accounting practices, shares fall in pre-market trading',
          source: 'Bloomberg',
          timestamp: candleData.timestamp - 180000, // 3 minutes before
          sentiment: -0.62,
          confidence: 0.88,
          relevanceScore: 0.91,
          url: '#',
          type: 'news'
        });
      }
    }

    if (volumeSpike) {
      mockItems.push({
        id: '3',
        headline: `Unusual ${asset.symbol} activity detected`,
        summary: '@TraderPro: Seeing massive volume spike in $${asset.symbol} - something big happening',
        source: 'Twitter',
        timestamp: candleData.timestamp - 120000, // 2 minutes before
        sentiment: isPositive ? 0.45 : -0.35,
        confidence: 0.67,
        relevanceScore: 0.74,
        url: '#',
        type: 'social'
      });
    }

    // Add macro events for forex/crypto
    if (asset.assetClass === 'forex' || asset.assetClass === 'crypto') {
      mockItems.push({
        id: '4',
        headline: 'Federal Reserve hints at policy shift',
        summary: 'Fed officials suggest potential changes to interest rate trajectory in upcoming meeting',
        source: 'MarketWatch',
        timestamp: candleData.timestamp - 300000, // 5 minutes before
        sentiment: isPositive ? 0.32 : -0.28,
        confidence: 0.85,
        relevanceScore: 0.68,
        url: '#',
        type: 'news'
      });
    }

    return mockItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const generateAISummary = (items: NewsItem[], candleData: CandleData): string => {
    if (items.length === 0) {
      return "No clear driver identified; potential factors include normal market volatility or algorithmic trading.";
    }

    const topItem = items[0];
    const timeDiff = Math.floor((candleData.timestamp - topItem.timestamp) / 60000);
    const direction = candleData.close > candleData.open ? "spike" : "drop";
    
    return `Likely driver: ${topItem.headline.split(' ').slice(0, 6).join(' ')}...; sentiment ${topItem.sentiment.toFixed(2)}; ${direction} started ${timeDiff}m after first post.`;
  };

  useEffect(() => {
    if (!candle) return;

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const items = generateMockNews(candle);
      setNewsItems(items);
      setAiSummary(generateAISummary(items, candle));
      setLoading(false);
    }, 1000);
  }, [candle, asset]);

  const filteredItems = newsItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'news') return item.type === 'news' || item.type === 'pr';
    if (filter === 'social') return item.type === 'social';
    return true;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <TrendingUp className="h-4 w-4" />;
    if (sentiment < -0.3) return <TrendingDown className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (!candle) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">What moved this bar?</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm text-slate-300 mb-3">
          <div className="flex justify-between">
            <span>{asset.symbol} - {formatTime(candle.timestamp)}</span>
            <Badge variant="outline" className="text-xs">
              ${candle.close.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* AI Summary */}
        {aiSummary && (
          <Card className="p-3 bg-blue-950/30 border-blue-500/30">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-100">{aiSummary}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-700/50">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="all" className="text-xs">Both</TabsTrigger>
            <TabsTrigger value="news" className="text-xs">News</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-700/50 rounded mb-2" />
                <div className="h-3 bg-slate-700/30 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="p-4 space-y-3">
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className="p-3 bg-slate-800/30 border-slate-600/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onMouseEnter={() => onHighlightCandle(item.timestamp)}
                onClick={() => onHighlightCandle(item.timestamp)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-white leading-tight">
                      {item.headline}
                    </h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{item.source}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-slate-500">{formatTime(item.timestamp)}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-500" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${getSentimentColor(item.sentiment)}`}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="text-xs">{item.sentiment.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Conf: {(item.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        Rel: {(item.relevanceScore * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        item.type === 'news' ? 'bg-blue-500/20 text-blue-300' :
                        item.type === 'social' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <Card className="p-4 bg-slate-800/30 border-slate-600/30 text-center">
              <div className="space-y-3">
                <div className="text-slate-400 text-sm">No driver found</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Potential factors: Normal market volatility, algorithmic trading, 
                  technical levels, or macro economic conditions.
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};