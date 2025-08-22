import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, ExternalLink } from "lucide-react";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  timestamp: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  symbols: string[];
  impact: 'high' | 'medium' | 'low';
  url: string;
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    headline: 'Fed Chair Powell signals potential rate cuts amid cooling inflation data',
    source: 'Reuters',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    sentiment: 'bullish',
    symbols: ['SPY', 'QQQ', 'TLT'],
    impact: 'high',
    url: '#'
  },
  {
    id: '2',
    headline: 'Tech earnings season kicks off with mixed results from semiconductor sector',
    source: 'Bloomberg',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    sentiment: 'neutral',
    symbols: ['QQQ', 'SMH', 'NVDA'],
    impact: 'medium',
    url: '#'
  },
  {
    id: '3',
    headline: 'Oil prices surge 3% on Middle East tensions and supply concerns',
    source: 'CNBC',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    sentiment: 'bullish',
    symbols: ['XLE', 'USO', 'XOM'],
    impact: 'high',
    url: '#'
  },
  {
    id: '4',
    headline: 'Banking sector under pressure as regional banks report loan losses',
    source: 'Financial Times',
    timestamp: new Date(Date.now() - 65 * 60 * 1000),
    sentiment: 'bearish',
    symbols: ['XLF', 'KRE', 'BAC'],
    impact: 'medium',
    url: '#'
  }
];

export const NewsStrip = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockNews.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentIcon = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-bullish" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-bearish" />;
      case 'neutral': return <AlertCircle className="w-4 h-4 text-neon-orange" />;
    }
  };

  const getImpactColor = (impact: NewsItem['impact']) => {
    switch (impact) {
      case 'high': return 'bg-bearish/20 text-bearish border-bearish/30';
      case 'medium': return 'bg-neon-orange/20 text-neon-orange border-neon-orange/30';
      case 'low': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const currentNews = mockNews[currentIndex];

  return (
    <div className="h-12 bg-card/70 backdrop-blur-sm border-b border-border px-6 flex items-center justify-between overflow-hidden">
      {/* News Ticker */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-primary">LIVE NEWS</span>
        </div>
        
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {getSentimentIcon(currentNews.sentiment)}
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm truncate">{currentNews.headline}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer" />
          </div>
          
          <Badge variant="outline" className={`text-xs flex-shrink-0 ${getImpactColor(currentNews.impact)}`}>
            {currentNews.impact.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* News Meta */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex gap-1">
          {currentNews.symbols.slice(0, 3).map((symbol) => (
            <Badge key={symbol} variant="secondary" className="text-xs font-mono">
              {symbol}
            </Badge>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {currentNews.source} • {formatTime(currentNews.timestamp)}
        </div>

        {/* News Navigation */}
        <div className="flex gap-1">
          {mockNews.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};