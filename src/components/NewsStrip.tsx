import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, ExternalLink } from "lucide-react";
import { fetchCompanyNews } from "@/lib/api";

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

export const NewsStrip = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real news on component mount
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        // Fetch news for major indices
        const spyNews = await fetchCompanyNews('SPY');
        const qqqNews = await fetchCompanyNews('QQQ');
        
        // Convert to our format
        const allNews = [...spyNews, ...qqqNews].slice(0, 4).map((article, index) => ({
          id: `news-${index}`,
          headline: article.headline,
          source: article.source || 'Unknown',
          timestamp: new Date(article.datetime),
          sentiment: 'neutral' as const,
          symbols: index < spyNews.length ? ['SPY'] : ['QQQ'],
          impact: 'medium' as const,
          url: article.url
        }));

        setNewsItems(allNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNewsItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    if (newsItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % newsItems.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [newsItems.length]);

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

  if (isLoading) {
    return (
      <div className="h-12 bg-card/70 backdrop-blur-sm border-b border-border px-6 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-primary">LOADING NEWS</span>
          </div>
        </div>
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <div className="h-12 bg-card/70 backdrop-blur-sm border-b border-border px-6 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 bg-muted rounded-full"></div>
            <span className="text-xs font-semibold text-muted-foreground">NO NEWS AVAILABLE</span>
          </div>
        </div>
      </div>
    );
  }

  const currentNews = newsItems[currentIndex];

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
            <ExternalLink 
              className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer" 
              onClick={() => window.open(currentNews.url, '_blank')}
            />
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
          {newsItems.map((_, index) => (
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