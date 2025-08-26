import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  ChevronUp, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  Target,
  Zap
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: string;
}

interface MarketData {
  sentiment: number;
  volatility: number;
  momentum: number;
  volume: number;
}

interface AIInsight {
  id: string;
  type: 'signal' | 'trend' | 'risk' | 'momentum';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  timestamp: Date;
  action?: 'buy' | 'sell' | 'hold' | 'watch';
}

interface AILiveAnalyzerHUDProps {
  market: Market;
  marketData: MarketData;
  isVisible: boolean;
  onToggle: () => void;
}

export const AILiveAnalyzerHUD = ({ market, marketData, isVisible, onToggle }: AILiveAnalyzerHUDProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Generate AI insights based on market data
  const generateInsight = (): AIInsight => {
    const insights = [
      {
        type: 'trend' as const,
        title: 'Bullish EMA Crossover Detected',
        description: 'EMA50 crossing above EMA200 with RSI rising from oversold; trend momentum bullish',
        evidence: ['EMA50 > EMA200', 'RSI trending up from 28', 'Volume spike +45%'],
        action: 'buy' as const
      },
      {
        type: 'momentum' as const,
        title: 'Momentum Divergence Warning',
        description: 'Price making higher highs but momentum indicators declining; potential reversal setup',
        evidence: ['RSI < 50 while price up 2%', 'MACD histogram declining', 'Volume below average'],
        action: 'watch' as const
      },
      {
        type: 'risk' as const,
        title: 'Volatility Spike Alert',
        description: 'ATR increased 35% in last 4 periods; expect wider price swings',
        evidence: ['ATR(14) = 2.8 vs avg 2.1', 'BB bands expanding', 'VIX correlation +0.82'],
        action: 'hold' as const
      },
      {
        type: 'signal' as const,
        title: 'Support Level Test',
        description: 'Price approaching key support at $174.20; bounce probability high',
        evidence: ['3 previous bounces at this level', 'Volume increasing on approach', 'Stoch RSI oversold'],
        action: 'buy' as const
      }
    ];

    const baseInsight = insights[Math.floor(Math.random() * insights.length)];
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...baseInsight,
      confidence: Math.floor(Math.random() * 30) + 65, // 65-95%
      timestamp: new Date()
    };
  };

  // Simulate real-time analysis
  useEffect(() => {
    if (!isVisible) return;

    const analyzeMarket = () => {
      setIsAnalyzing(true);
      
      setTimeout(() => {
        const newInsight = generateInsight();
        setCurrentInsight(newInsight);
        setIsAnalyzing(false);

        // Add alert if confidence is high or action is urgent
        if (newInsight.confidence > 80 || newInsight.action === 'buy' || newInsight.action === 'sell') {
          setAlerts(prev => [...prev.slice(-2), `${newInsight.action?.toUpperCase()}: ${newInsight.title}`]);
        }
      }, 1500);
    };

    analyzeMarket();
    const interval = setInterval(analyzeMarket, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [isVisible, market.symbol, marketData]);

  // Clear alerts after some time
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        setAlerts(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'momentum': return <Activity className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'signal': return <Target className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'buy': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'sell': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'hold': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'watch': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-md">
      {/* Alert Notifications */}
      {alerts.map((alert, index) => (
        <div
          key={index}
          className="mb-2 p-3 bg-primary/20 border border-primary/40 rounded-lg backdrop-blur-lg animate-in slide-in-from-right-5 fade-in"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{alert}</span>
          </div>
        </div>
      ))}

      {/* Main HUD Panel */}
      <Card className="hud-panel">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className="w-5 h-5 text-primary" />
                {isAnalyzing && (
                  <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Live Analyzer</h3>
                <div className="text-xs text-muted-foreground">
                  Monitoring {market.symbol}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>

          {/* Current Insight - Collapsed View */}
          {!isExpanded && currentInsight && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getInsightIcon(currentInsight.type)}
                <span className="text-sm font-medium text-foreground">
                  {currentInsight.title}
                </span>
                <Badge variant="outline" className={getActionColor(currentInsight.action)}>
                  {currentInsight.action?.toUpperCase()}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground leading-relaxed">
                {currentInsight.description}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <Progress value={currentInsight.confidence} className="w-16 h-2" />
                  <span className="text-xs font-mono text-primary">
                    {currentInsight.confidence}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentInsight.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Expanded View */}
          {isExpanded && currentInsight && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getInsightIcon(currentInsight.type)}
                  <span className="font-medium text-foreground">
                    {currentInsight.title}
                  </span>
                  <Badge variant="outline" className={getActionColor(currentInsight.action)}>
                    {currentInsight.action?.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {currentInsight.description}
                </div>
                
                {/* Evidence Bullets */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Evidence:</div>
                  {currentInsight.evidence.map((evidence, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      <span className="text-muted-foreground">{evidence}</span>
                    </div>
                  ))}
                </div>
                
                {/* Confidence and Timestamp */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Progress value={currentInsight.confidence} className="w-20 h-2" />
                    <span className="text-xs font-mono text-primary">
                      {currentInsight.confidence}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentInsight.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && !currentInsight && (
            <div className="flex items-center gap-3 py-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Analyzing market conditions...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};