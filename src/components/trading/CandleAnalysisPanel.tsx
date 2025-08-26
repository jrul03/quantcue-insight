import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, 
  ExternalLink, MessageSquare, Twitter, Globe,
  Clock, Activity, Target, Zap, X
} from "lucide-react";

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
  source: 'twitter' | 'reddit' | 'news' | 'pr';
  title: string;
  content: string;
  url: string;
  timestamp: number;
  sentiment: number; // -1 to 1
  relevance: number; // 0 to 1
  engagement: number; // 0 to 1
  priceAlignment: number; // How well it aligns with price movement
}

interface AIAnalysis {
  likelyDriver: string;
  confidence: number;
  sentiment: number;
  timeOffset: string; // e.g., "2m after first post"
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface CandleAnalysisPanelProps {
  candle: CandleData;
  symbol: string;
  onClose: () => void;
  className?: string;
}

export const CandleAnalysisPanel = ({ 
  candle, 
  symbol, 
  onClose, 
  className = "" 
}: CandleAnalysisPanelProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate candle metrics
  const candleMetrics = {
    change: candle.close - candle.open,
    changePercent: ((candle.close - candle.open) / candle.open) * 100,
    range: candle.high - candle.low,
    bodySize: Math.abs(candle.close - candle.open),
    upperWick: candle.high - Math.max(candle.open, candle.close),
    lowerWick: Math.min(candle.open, candle.close) - candle.low,
    isUp: candle.close > candle.open,
    volumeProfile: 'high' // This would be calculated from actual volume data
  };

  // Mock news data (in real implementation, this would fetch from APIs)
  useEffect(() => {
    const fetchNewsData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock news items around the candle time
      const mockNews: NewsItem[] = [
        {
          id: '1',
          source: 'twitter',
          title: 'Breaking: Fed signals potential rate cut sooner than expected',
          content: 'Federal Reserve officials hint at more dovish stance in latest meeting minutes...',
          url: 'https://twitter.com/example/123',
          timestamp: candle.timestamp - 120000, // 2 minutes before
          sentiment: 0.7,
          relevance: 0.95,
          engagement: 0.85,
          priceAlignment: 0.9
        },
        {
          id: '2',
          source: 'news',
          title: `${symbol} Beats Q3 Earnings Expectations`,
          content: 'Company reports stronger than expected quarterly results with revenue up 15%...',
          url: 'https://example.com/news/123',
          timestamp: candle.timestamp + 60000, // 1 minute after
          sentiment: 0.8,
          relevance: 0.9,
          engagement: 0.7,
          priceAlignment: 0.85
        },
        {
          id: '3',
          source: 'reddit',
          title: 'Unusual options activity spotted in SPY',
          content: 'Large volume of calls purchased at strike $420, expiring this week...',
          url: 'https://reddit.com/r/wallstreetbets/abc123',
          timestamp: candle.timestamp - 300000, // 5 minutes before
          sentiment: 0.4,
          relevance: 0.6,
          engagement: 0.9,
          priceAlignment: 0.3
        },
        {
          id: '4',
          source: 'pr',
          title: `${symbol} Announces Strategic Partnership`,
          content: 'Major technology partnership expected to drive revenue growth in 2024...',
          url: 'https://example.com/pr/456',
          timestamp: candle.timestamp - 600000, // 10 minutes before
          sentiment: 0.6,
          relevance: 0.8,
          engagement: 0.5,
          priceAlignment: 0.7
        }
      ];

      // Sort by relevance and price alignment
      const sortedNews = mockNews.sort((a, b) => 
        (b.relevance * b.priceAlignment) - (a.relevance * a.priceAlignment)
      );

      setNewsItems(sortedNews);

      // Generate AI analysis
      const analysis: AIAnalysis = {
        likelyDriver: 'Fed dovish signals',
        confidence: 0.87,
        sentiment: 0.72,
        timeOffset: '2m before bar formation',
        keyFactors: [
          'Fed rate cut speculation increased',
          'Strong earnings momentum',
          'Technical breakout above resistance',
          'High institutional volume'
        ],
        riskLevel: candleMetrics.changePercent > 2 ? 'high' : 
                  candleMetrics.changePercent > 1 ? 'medium' : 'low'
      };

      setAIAnalysis(analysis);
      setIsLoading(false);
    };

    fetchNewsData();
  }, [candle, symbol, candleMetrics.changePercent]);

  const getSourceIcon = (source: NewsItem['source']) => {
    switch (source) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'reddit': return <MessageSquare className="w-4 h-4" />;
      case 'news': return <Globe className="w-4 h-4" />;
      case 'pr': return <ExternalLink className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date(candle.timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins === 0) return 'same time';
    if (diffMins > 0) return `${diffMins}m before`;
    return `${Math.abs(diffMins)}m after`;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-success';
    if (sentiment < -0.3) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">What moved this bar?</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Candle Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Price Movement</div>
            <div className={`text-lg font-mono font-semibold ${candleMetrics.isUp ? 'text-success' : 'text-destructive'}`}>
              {candleMetrics.isUp ? '+' : ''}{candleMetrics.changePercent.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">
              ${candleMetrics.change.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Volume</div>
            <div className="text-lg font-mono font-semibold">
              {(candle.volume / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-muted-foreground">
              {candleMetrics.volumeProfile} volume
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* AI Analysis */}
            {aiAnalysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">AI Analysis</h4>
                  <Badge variant="secondary" className="text-xs">
                    {(aiAnalysis.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
                
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="font-medium text-primary mb-2">
                    Likely driver: {aiAnalysis.likelyDriver}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sentiment:</span>
                      <span className={`ml-1 font-mono ${getSentimentColor(aiAnalysis.sentiment)}`}>
                        {aiAnalysis.sentiment > 0 ? '+' : ''}{aiAnalysis.sentiment.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timing:</span>
                      <span className="ml-1 font-mono text-foreground">
                        {aiAnalysis.timeOffset}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk:</span>
                      <span className={`ml-1 font-mono ${getRiskColor(aiAnalysis.riskLevel)}`}>
                        {aiAnalysis.riskLevel}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Key Factors:</div>
                    <div className="flex flex-wrap gap-1">
                      {aiAnalysis.keyFactors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* News Items */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Market Events</h4>
                <Badge variant="outline" className="text-xs">
                  {newsItems.length} items found
                </Badge>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {newsItems.map((item) => (
                    <div key={item.id} className="p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(item.source)}
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {item.source}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatTimestamp(item.timestamp)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-6 w-6 p-0"
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                      
                      <h5 className="font-medium text-sm mb-1 line-clamp-2">
                        {item.title}
                      </h5>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {item.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Relevance:</span>
                          <span className="font-mono text-primary">
                            {(item.relevance * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Sentiment:</span>
                          <span className={`font-mono ${getSentimentColor(item.sentiment)}`}>
                            {item.sentiment > 0 ? '+' : ''}{item.sentiment.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Alignment:</span>
                          <span className="font-mono text-secondary">
                            {(item.priceAlignment * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};