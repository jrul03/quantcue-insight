import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Brain,
  Clock,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Target,
  BarChart3,
  PieChart
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

interface MarketData {
  sentiment: number;
  volatility: number;
  momentum: number;
  volume: number;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  timestamp: number;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: string;
  relevance: number;
}

interface SocialItem {
  id: string;
  platform: string;
  content: string;
  author: string;
  timestamp: number;
  engagement: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface TechnicalInsight {
  id: string;
  type: 'support' | 'resistance' | 'pattern' | 'indicator';
  title: string;
  description: string;
  confidence: number;
  price?: number;
  timeframe: string;
}

interface InsightsPanelProps {
  market: Market;
  marketData: MarketData;
  timeframe: string;
}

// Mock data generators
const generateMockNews = (symbol: string): NewsItem[] => [
  {
    id: '1',
    title: `${symbol} Q3 Earnings Beat Expectations by 12%`,
    summary: 'Strong revenue growth driven by increased demand and operational efficiency improvements.',
    timestamp: Date.now() - 15 * 60 * 1000,
    impact: 'high',
    sentiment: 'bullish',
    source: 'MarketWatch',
    relevance: 95
  },
  {
    id: '2',
    title: `Federal Reserve Signals Potential Rate Changes`,
    summary: 'FOMC minutes suggest dovish stance may impact broader market sentiment.',
    timestamp: Date.now() - 45 * 60 * 1000,
    impact: 'medium',
    sentiment: 'neutral',
    source: 'Reuters',
    relevance: 78
  },
  {
    id: '3',
    title: `Sector Rotation Continues as Tech Leads`,
    summary: 'Technology sector showing strength amid broader market uncertainty.',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    impact: 'medium',
    sentiment: 'bullish',
    source: 'Bloomberg',
    relevance: 82
  }
];

const generateMockSocial = (symbol: string): SocialItem[] => [
  {
    id: '1',
    platform: 'Twitter',
    content: `$${symbol} breaking above key resistance at $${(Math.random() * 500 + 100).toFixed(2)}. Volume confirming the move. 🚀`,
    author: '@TradingGuru',
    timestamp: Date.now() - 10 * 60 * 1000,
    engagement: 247,
    sentiment: 'bullish'
  },
  {
    id: '2',
    platform: 'Reddit',
    content: `Technical analysis on ${symbol}: RSI showing divergence, could signal reversal`,
    author: 'u/MarketAnalyst',
    timestamp: Date.now() - 25 * 60 * 1000,
    engagement: 156,
    sentiment: 'bearish'
  },
  {
    id: '3',
    platform: 'StockTwits',
    content: `${symbol} looking strong on the daily chart. Watching for breakout above $${(Math.random() * 500 + 100).toFixed(2)}`,
    author: 'ProTrader42',
    timestamp: Date.now() - 40 * 60 * 1000,
    engagement: 89,
    sentiment: 'bullish'
  }
];

const generateTechnicalInsights = (market: Market, timeframe: string): TechnicalInsight[] => [
  {
    id: '1',
    type: 'support',
    title: `Strong Support at $${(market.price * 0.98).toFixed(2)}`,
    description: 'Multiple touches with high volume rejection. Historical significance as previous resistance.',
    confidence: 87,
    price: market.price * 0.98,
    timeframe
  },
  {
    id: '2',
    type: 'pattern',
    title: 'Ascending Triangle Formation',
    description: 'Pattern developing over the last 5 sessions. Target projection suggests 3.2% upside.',
    confidence: 72,
    timeframe
  },
  {
    id: '3',
    type: 'indicator',
    title: 'RSI Bullish Divergence',
    description: 'Price making lower lows while RSI shows higher lows. Potential reversal signal.',
    confidence: 68,
    timeframe
  }
];

export const InsightsPanel = ({ market, marketData, timeframe }: InsightsPanelProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [socialItems, setSocialItems] = useState<SocialItem[]>([]);
  const [technicalInsights, setTechnicalInsights] = useState<TechnicalInsight[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');

  // Initialize data
  useEffect(() => {
    setNewsItems(generateMockNews(market.symbol));
    setSocialItems(generateMockSocial(market.symbol));
    setTechnicalInsights(generateTechnicalInsights(market, timeframe));
    
    // Generate AI summary
    const sentiment = marketData.sentiment > 0.6 ? 'bullish' : marketData.sentiment < 0.4 ? 'bearish' : 'neutral';
    setAiSummary(
      `${market.symbol} is showing ${sentiment} signals on the ${timeframe} timeframe. ` +
      `Current price action suggests ${marketData.momentum > 0.6 ? 'strong momentum' : 'consolidation'} ` +
      `with ${marketData.volatility > 0.5 ? 'elevated' : 'normal'} volatility. ` +
      `Key level to watch: $${(market.price + (market.changePercent > 0 ? 2 : -2)).toFixed(2)}.`
    );
  }, [market, marketData, timeframe]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-3 h-3 text-bullish" />;
      case 'bearish': return <TrendingDown className="w-3 h-3 text-bearish" />;
      default: return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Market Insights</h2>
          <Badge variant="outline" className="text-xs">
            {market.symbol} • {timeframe}
          </Badge>
        </div>
      </div>

      {/* AI Summary */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">AI Analysis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="news" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4 grid w-[calc(100%-2rem)] grid-cols-3">
            <TabsTrigger value="news" className="text-xs">News</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
            <TabsTrigger value="technical" className="text-xs">Technical</TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {newsItems.map((item) => (
                  <Card key={item.id} className="p-3 hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(item.sentiment)}
                        <Badge variant="outline" className={`text-xs ${getImpactColor(item.impact)}`}>
                          {item.impact.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.relevance}%
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-2 leading-tight">
                      {item.title}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {item.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-xs">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {socialItems.map((item) => (
                  <Card key={item.id} className="p-3 hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(item.sentiment)}
                        <Badge variant="secondary" className="text-xs">
                          {item.platform}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.engagement} reactions
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 leading-relaxed">
                      {item.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.author}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-xs">
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {technicalInsights.map((insight) => (
                  <Card key={insight.id} className="p-3 hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          insight.type === 'support' ? 'bg-bullish' :
                          insight.type === 'resistance' ? 'bg-bearish' :
                          insight.type === 'pattern' ? 'bg-primary' :
                          'bg-orange-500'
                        }`} />
                        <Badge variant="outline" className="text-xs">
                          {insight.type.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {insight.confidence}%
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-2">
                      {insight.title}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {insight.timeframe} timeframe
                      </div>
                      {insight.price && (
                        <div className="flex items-center gap-1 text-xs">
                          <Target className="w-3 h-3" />
                          <span className="font-mono">${insight.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Quick Stats */}
                <Card className="p-3 bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RSI:</span>
                      <span className="font-mono">{(marketData.sentiment * 100).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volatility:</span>
                      <span className="font-mono">{(marketData.volatility * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Momentum:</span>
                      <span className="font-mono">{(marketData.momentum * 100).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-mono">{marketData.volume.toFixed(2)}x</span>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};