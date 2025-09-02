import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Brain,
  Globe,
  Twitter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: number; // -1 to 1
  relevance: number; // 0 to 1
  source: string;
  timestamp: number;
  url?: string;
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleMoveAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candle: CandleData | null;
  symbol: string;
}

// Mock news generator for demo
const generateMockNews = (symbol: string, candle: CandleData): NewsItem[] => {
  const movePercent = ((candle.close - candle.open) / candle.open) * 100;
  const isBullish = movePercent > 0;
  
  const templates = {
    bullish: [
      `${symbol} surges on institutional buying pressure`,
      `Strong earnings outlook drives ${symbol} higher`,
      `Analysts upgrade ${symbol} target price`,
      `${symbol} benefits from sector rotation`,
      `Positive market sentiment lifts ${symbol}`
    ],
    bearish: [
      `${symbol} falls on profit-taking activity`,
      `Market concerns weigh on ${symbol}`,
      `Technical resistance limits ${symbol} gains`,
      `${symbol} faces selling pressure from institutions`,
      `Risk-off sentiment impacts ${symbol}`
    ]
  };
  
  const headlines = isBullish ? templates.bullish : templates.bearish;
  const baseTime = candle.timestamp;
  
  return [
    {
      id: '1',
      headline: headlines[0],
      summary: `Market analysts report ${isBullish ? 'increased buying interest' : 'profit-taking activity'} in ${symbol} following ${isBullish ? 'positive momentum' : 'recent volatility'}. The ${Math.abs(movePercent).toFixed(2)}% move reflects ${isBullish ? 'strong institutional support' : 'cautious market sentiment'}.`,
      sentiment: isBullish ? 0.7 : -0.6,
      relevance: 0.95,
      source: 'Bloomberg',
      timestamp: baseTime - 120000, // 2 min before
      url: '#'
    },
    {
      id: '2',
      headline: headlines[1],
      summary: `Technical analysis suggests ${symbol} is ${isBullish ? 'breaking key resistance levels' : 'testing important support zones'}. Volume patterns indicate ${isBullish ? 'continued bullish momentum' : 'potential consolidation ahead'}.`,
      sentiment: isBullish ? 0.5 : -0.4,
      relevance: 0.8,
      source: 'MarketWatch',
      timestamp: baseTime - 300000, // 5 min before
      url: '#'
    },
    {
      id: '3',
      headline: headlines[2],
      summary: `Social sentiment around ${symbol} shows ${isBullish ? 'increasing optimism' : 'growing caution'} among retail traders. Options flow suggests ${isBullish ? 'bullish positioning' : 'defensive strategies'}.`,
      sentiment: isBullish ? 0.6 : -0.5,
      relevance: 0.7,
      source: 'Fintwit',
      timestamp: baseTime - 480000, // 8 min before
      url: '#'
    },
    {
      id: '4',
      headline: `Market structure analysis: ${symbol} ${isBullish ? 'momentum surge' : 'pressure build'}`,
      summary: `Order flow data reveals ${isBullish ? 'strong buying interest at key levels' : 'selling pressure near resistance'}. The current price action aligns with ${isBullish ? 'bullish' : 'bearish'} market microstructure patterns.`,
      sentiment: isBullish ? 0.4 : -0.3,
      relevance: 0.85,
      source: 'Trade Ideas',
      timestamp: baseTime - 600000, // 10 min before
      url: '#'
    }
  ].sort((a, b) => b.relevance - a.relevance); // Sort by relevance
};

const getSentimentColor = (sentiment: number) => {
  if (sentiment > 0.3) return 'text-green-400 bg-green-500/10';
  if (sentiment < -0.3) return 'text-red-400 bg-red-500/10';
  return 'text-yellow-400 bg-yellow-500/10';
};

const getSentimentIcon = (sentiment: number) => {
  if (sentiment > 0.3) return TrendingUp;
  if (sentiment < -0.3) return TrendingDown;
  return Clock;
};

const getSourceIcon = (source: string) => {
  if (source.includes('Fintwit') || source.includes('Twitter')) return Twitter;
  return Globe;
};

export const CandleMoveAnalysisDrawer = ({ 
  isOpen, 
  onClose, 
  candle, 
  symbol 
}: CandleMoveAnalysisDrawerProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');

  useEffect(() => {
    if (candle && isOpen) {
      // Generate mock news for the candle
      const mockNews = generateMockNews(symbol, candle);
      setNewsItems(mockNews);
      
      // Generate AI summary
      const movePercent = ((candle.close - candle.open) / candle.open) * 100;
      const isBullish = movePercent > 0;
      const avgSentiment = mockNews.reduce((acc, item) => acc + item.sentiment, 0) / mockNews.length;
      
      const summary = `${symbol} moved ${isBullish ? '+' : ''}${movePercent.toFixed(2)}% in this candle. Primary drivers appear to be ${isBullish ? 'institutional buying and positive momentum' : 'profit-taking and market caution'}. Overall news sentiment: ${avgSentiment > 0 ? 'Positive' : avgSentiment < 0 ? 'Negative' : 'Neutral'} (${(avgSentiment * 100).toFixed(0)}%). Volume of ${candle.volume.toLocaleString()} suggests ${candle.volume > 1000 ? 'high' : candle.volume > 500 ? 'moderate' : 'low'} conviction in the move.`;
      
      setAiSummary(summary);
    }
  }, [candle, symbol, isOpen]);

  if (!candle) return null;

  const movePercent = ((candle.close - candle.open) / candle.open) * 100;
  const isBullish = movePercent > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] bg-slate-900 border-slate-700">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-slate-300">
            <Clock className="w-5 h-5" />
            What moved this bar?
            <Badge variant="outline" className="ml-auto">
              {symbol}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Candle Info */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                {new Date(candle.timestamp).toLocaleTimeString()}
              </span>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isBullish ? "text-green-400" : "text-red-400"
              )}>
                {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isBullish ? '+' : ''}{movePercent.toFixed(2)}%
              </div>
            </div>
            <div className="text-xs text-slate-500 grid grid-cols-4 gap-2">
              <div>O: ${candle.open.toFixed(2)}</div>
              <div>H: ${candle.high.toFixed(2)}</div>
              <div>L: ${candle.low.toFixed(2)}</div>
              <div>C: ${candle.close.toFixed(2)}</div>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Vol: {candle.volume.toLocaleString()}
            </div>
          </Card>

          {/* AI Summary */}
          <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">AI Analysis</span>
            </div>
            <p className="text-sm text-slate-300">{aiSummary}</p>
          </Card>

          {/* News Items */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              Ranked News & Social Drivers
            </h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {newsItems.map((item, index) => {
                  const SentimentIcon = getSentimentIcon(item.sentiment);
                  const SourceIcon = getSourceIcon(item.source);
                  
                  return (
                    <Card key={item.id} className="p-3 bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            getSentimentColor(item.sentiment)
                          )}>
                            <SentimentIcon className="w-3 h-3" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <SourceIcon className="w-3 h-3" />
                              {item.source}
                            </div>
                            <div className="text-xs text-slate-500">
                              {Math.floor((candle.timestamp - item.timestamp) / 60000)}m ago
                            </div>
                            <div className="text-xs text-slate-400">
                              {(item.relevance * 100).toFixed(0)}% relevant
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-medium text-slate-200 mb-1">
                            {item.headline}
                          </h4>
                          
                          <p className="text-xs text-slate-400 mb-2">
                            {item.summary}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn("text-xs", getSentimentColor(item.sentiment))}>
                              Sentiment: {(item.sentiment * 100).toFixed(0)}%
                            </Badge>
                            
                            {item.url && (
                              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Read more
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};