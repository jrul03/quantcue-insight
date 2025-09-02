import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  TrendingUp, 
  TrendingDown,
  Clock,
  ExternalLink,
  BarChart3,
  Users,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CandleData {
  timestamp: number;
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
  timestamp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  url?: string;
}

interface CandleNewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  candle: CandleData | null;
  symbol: string;
}

export const CandleNewsPanel = ({ isOpen, onClose, candle, symbol }: CandleNewsPanelProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock news data generation
  useEffect(() => {
    if (isOpen && candle) {
      setLoading(true);
      
      // Simulate API call delay
      const timer = setTimeout(() => {
        const mockNews: NewsItem[] = [
          {
            id: '1',
            title: `${symbol} beats quarterly earnings expectations by 12%`,
            source: 'Reuters',
            timestamp: candle.timestamp - 300000, // 5 minutes before
            sentiment: 'positive',
            confidence: 87,
            url: 'https://reuters.com'
          },
          {
            id: '2',
            title: 'Federal Reserve hints at potential rate cuts in upcoming meeting',
            source: 'Bloomberg',
            timestamp: candle.timestamp - 180000, // 3 minutes before
            sentiment: 'positive',
            confidence: 72,
            url: 'https://bloomberg.com'
          },
          {
            id: '3',
            title: 'Institutional buying surge detected in tech sector',
            source: 'MarketWatch',
            timestamp: candle.timestamp - 60000, // 1 minute before
            sentiment: 'positive',
            confidence: 65
          }
        ];
        
        // Randomize whether we have news or not
        if (Math.random() > 0.3) {
          setNewsItems(mockNews);
        } else {
          setNewsItems([]);
        }
        
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, candle, symbol]);

  if (!isOpen) return null;

  const getSentimentColor = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getSentimentIcon = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3" />;
      case 'negative': return <TrendingDown className="w-3 h-3" />;
      default: return <BarChart3 className="w-3 h-3" />;
    }
  };

  const formatTimeDiff = (timestamp: number) => {
    if (!candle) return '';
    const diff = candle.timestamp - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes === 0) return 'Same time';
    return `${minutes}m before`;
  };

  const priceChange = candle ? ((candle.close - candle.open) / candle.open) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50 animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                What moved this bar?
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {candle && (
              <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Candle Movement</span>
                  <span className="text-xs text-slate-500">
                    {new Date(candle.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "text-xl font-bold flex items-center gap-1",
                    isPositive ? "text-green-400" : "text-red-400"
                  )}>
                    {isPositive ? 
                      <TrendingUp className="w-5 h-5" /> : 
                      <TrendingDown className="w-5 h-5" />
                    }
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-400">
                    ${candle.open.toFixed(2)} → ${candle.close.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center animate-pulse">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full mx-auto mb-3 animate-spin border-2 border-blue-500 border-t-transparent"></div>
                  <p className="text-slate-300">Analyzing market drivers...</p>
                </div>
              </div>
            ) : newsItems.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div className="text-sm text-slate-400 mb-4">
                    Found {newsItems.length} potential drivers around this time:
                  </div>
                  
                  {newsItems.map((item) => (
                    <Card key={item.id} className="p-4 bg-slate-800/50 border-slate-600/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("flex items-center gap-1", getSentimentColor(item.sentiment))}>
                            {getSentimentIcon(item.sentiment)}
                            <span className="text-xs font-medium capitalize">{item.sentiment}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.confidence}% confidence
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatTimeDiff(item.timestamp)}
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-medium text-white mb-2 leading-relaxed">
                        {item.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{item.source}</span>
                        {item.url && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs h-6 px-2 text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Read more
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                  
                  <div className="mt-6 p-3 bg-slate-800/30 rounded-lg border border-slate-600/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400">Social sentiment:</span>
                      <span className="font-bold text-green-400">68% bullish</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Based on 1,247 social mentions in the last hour
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No drivers found</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    This appears to be a technical or volatility-driven move. 
                    No significant news or social events were detected around this timeframe.
                  </p>
                  <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600/20">
                    <div className="text-xs text-slate-400">
                      <div>• Check support/resistance levels</div>
                      <div>• Look for algorithmic trading patterns</div>
                      <div>• Consider broader market correlation</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};