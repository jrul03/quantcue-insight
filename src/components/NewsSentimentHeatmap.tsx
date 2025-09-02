import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SentimentDataPoint {
  timestamp: number;
  sentiment: number; // -1 to 1
  headline: string;
  score: number; // 0-100
  source: string;
}

interface NewsSentimentHeatmapProps {
  symbol: string;
  onTimeClick: (timestamp: number) => void;
  className?: string;
}

export const NewsSentimentHeatmap = ({ symbol, onTimeClick, className }: NewsSentimentHeatmapProps) => {
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<SentimentDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate mock sentiment data for the last 24 hours
  useEffect(() => {
    const generateSentimentData = (): SentimentDataPoint[] => {
      const data: SentimentDataPoint[] = [];
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const headlines = [
        `${symbol} beats Q3 earnings expectations by 15%`,
        `Analysts upgrade ${symbol} to strong buy`,
        `${symbol} announces new product line expansion`,
        `Regulatory concerns weigh on ${symbol} stock`,  
        `${symbol} CEO optimistic about market conditions`,
        `Supply chain issues impact ${symbol} production`,
        `${symbol} partners with major tech company`,
        `Insider trading activity detected in ${symbol}`,
        `${symbol} dividend increase announced`,
        `Market volatility affects ${symbol} performance`,
        `${symbol} stock splits 2-for-1`,
        `Institutional investors increase ${symbol} holdings`,
        `${symbol} faces class action lawsuit`,
        `Strong demand drives ${symbol} revenue growth`,
        `${symbol} expands into international markets`,
        `Economic headwinds challenge ${symbol} outlook`,
        `${symbol} reports record quarterly profits`,
        `Technical analysis suggests ${symbol} breakout`,
        `${symbol} management shakeup announced`,
        `Positive analyst coverage boosts ${symbol}`,
        `${symbol} weaker than expected guidance`,
        `Social media buzz around ${symbol} peaks`,
        `${symbol} benefiting from sector rotation`,
        `Options activity surges in ${symbol}`
      ];

      // Generate 50-100 data points over 24 hours
      const numPoints = 60 + Math.floor(Math.random() * 40);
      
      for (let i = 0; i < numPoints; i++) {
        const timestamp = now - (24 * oneHour) + (i * (24 * oneHour) / numPoints);
        
        // Create sentiment waves - some periods more positive/negative
        const timeOfDay = (timestamp % (24 * oneHour)) / oneHour;
        let baseSentiment = 0;
        
        // Market hours tend to be more volatile
        if (timeOfDay >= 9.5 && timeOfDay <= 16) {
          baseSentiment = Math.sin((timeOfDay - 9.5) / 6.5 * Math.PI) * 0.3;
        }
        
        // Add some random events
        const randomEvent = Math.random();
        let eventSentiment = 0;
        if (randomEvent > 0.95) eventSentiment = 0.8; // Very positive news
        else if (randomEvent < 0.05) eventSentiment = -0.8; // Very negative news
        else eventSentiment = (Math.random() - 0.5) * 0.4;
        
        const sentiment = Math.max(-1, Math.min(1, baseSentiment + eventSentiment));
        const score = Math.round(50 + sentiment * 50);
        
        data.push({
          timestamp,
          sentiment,
          headline: headlines[Math.floor(Math.random() * headlines.length)],
          score,
          source: ['Reuters', 'Bloomberg', 'WSJ', 'CNBC', 'Twitter', 'Reddit'][Math.floor(Math.random() * 6)]
        });
      }
      
      return data.sort((a, b) => a.timestamp - b.timestamp);
    };

    setSentimentData(generateSentimentData());
  }, [symbol]);

  // Create gradient segments based on sentiment data
  const gradientSegments = useMemo(() => {
    if (sentimentData.length === 0) return [];
    
    return sentimentData.map((point, index) => {
      const percentage = (index / (sentimentData.length - 1)) * 100;
      const hue = point.sentiment >= 0 
        ? 120 * point.sentiment // Green for positive (0-120)
        : 0 + (120 * (1 + point.sentiment)); // Red for negative (0-120)
      
      const saturation = Math.abs(point.sentiment) * 70 + 30; // 30-100%
      const lightness = 50; // Fixed lightness
      
      return {
        percentage,
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        point
      };
    });
  }, [sentimentData]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // Find closest data point
    const closest = sentimentData.reduce((prev, curr, index) => {
      const currPercentage = (index / (sentimentData.length - 1)) * 100;
      const prevPercentage = (sentimentData.indexOf(prev) / (sentimentData.length - 1)) * 100;
      
      return Math.abs(currPercentage - percentage) < Math.abs(prevPercentage - percentage) ? curr : prev;
    });
    
    setHoveredPoint(closest);
    
    // Smart tooltip positioning to prevent overflow
    const tooltipWidth = 320; // Expected tooltip width
    const tooltipHeight = 120; // Expected tooltip height
    const padding = 10;
    
    let tooltipX = e.clientX + padding;
    let tooltipY = e.clientY - tooltipHeight - padding;
    
    // Prevent right overflow
    if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = e.clientX - tooltipWidth - padding;
    }
    
    // Prevent top overflow
    if (tooltipY < 0) {
      tooltipY = e.clientY + padding;
    }
    
    // Prevent bottom overflow
    if (tooltipY + tooltipHeight > window.innerHeight) {
      tooltipY = window.innerHeight - tooltipHeight - padding;
    }
    
    setMousePosition({ x: tooltipX, y: tooltipY });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoveredPoint) {
      onTimeClick(hoveredPoint.timestamp);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positive';
    if (sentiment < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment < -0.3) return 'text-red-400';
    return 'text-slate-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return '📈';
    if (sentiment < -0.3) return '📉';
    return '➡️';
  };

  const getImpactLevel = (sentiment: number) => {
    const absValue = Math.abs(sentiment);
    if (absValue > 0.7) return 'High Impact';
    if (absValue > 0.3) return 'Medium Impact';
    return 'Low Impact';
  };

  if (sentimentData.length === 0) {
    return (
      <div className={cn("h-8 bg-slate-800/30 rounded border border-slate-700/50 animate-pulse", className)} />
    );
  }

  const gradientStyle = {
    background: `linear-gradient(to right, ${gradientSegments.map(segment => 
      `${segment.color} ${segment.percentage}%`
    ).join(', ')})`
  };

  return (
    <>
      <div className={cn("relative", className)}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-slate-400 font-medium">24h Sentiment:</span>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-slate-500">Bearish</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              <span className="text-slate-500">Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-500">Bullish</span>
            </div>
          </div>
        </div>
        
        <div 
          className="h-6 rounded border border-slate-700/50 cursor-pointer transition-all duration-200 hover:border-slate-600/50 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105"
          style={gradientStyle}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          onClick={handleClick}
        />
      </div>

      {/* Enhanced Tooltip */}
      {hoveredPoint && (
        <div 
          className="fixed z-50 pointer-events-none animate-fade-in"
          style={{ 
            left: mousePosition.x, 
            top: mousePosition.y
          }}
        >
          <Card className="p-4 bg-slate-900/98 border-slate-700/50 backdrop-blur-md shadow-2xl max-w-sm border-l-2"
                style={{ borderLeftColor: hoveredPoint.sentiment > 0 ? '#10b981' : hoveredPoint.sentiment < 0 ? '#ef4444' : '#64748b' }}>
            <div className="space-y-3">
              {/* Header with time and impact */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSentimentIcon(hoveredPoint.sentiment)}</span>
                  <span className="text-xs text-slate-400 font-medium">{formatTime(hoveredPoint.timestamp)}</span>
                </div>
                <div className="text-right">
                  <div className={cn("text-xs font-semibold", getSentimentColor(hoveredPoint.sentiment))}>
                    {getSentimentLabel(hoveredPoint.sentiment)}
                  </div>
                  <div className="text-xs text-slate-500">{getImpactLevel(hoveredPoint.sentiment)}</div>
                </div>
              </div>
              
              {/* News headline with better formatting */}
              <div className="bg-slate-800/50 rounded p-2 border border-slate-700/30">
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {hoveredPoint.headline}
                </p>
              </div>
              
              {/* Footer with source and action */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{hoveredPoint.source}</span>
                  <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                  <span className="text-xs text-slate-500">Score: {hoveredPoint.score}%</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                  <span className="text-xs font-medium">Click to jump to chart</span>
                  <span className="text-xs">→</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};