import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap,
  Activity,
  Eye,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Stock } from "./StockSearchSelector";

interface AnalysisInsight {
  id: string;
  type: 'trend' | 'momentum' | 'volume' | 'pattern' | 'news' | 'warning';
  message: string;
  confidence: number;
  timeframe: string;
  action?: 'buy' | 'sell' | 'hold' | 'caution';
  priority: 'high' | 'medium' | 'low';
}

interface QuantHUDProps {
  selectedStock: Stock;
  isVisible: boolean;
  onToggleVisibility: () => void;
  className?: string;
}

const generateMockInsights = (stock: Stock): AnalysisInsight[] => [
  {
    id: '1',
    type: 'momentum',
    message: `RSI divergence forming on ${stock.symbol}—caution on long positions`,
    confidence: 78,
    timeframe: '4H',
    action: 'caution',
    priority: 'high'
  },
  {
    id: '2',
    type: 'trend',
    message: `EMA50 crossing EMA200 suggests possible bullish breakout`,
    confidence: 85,
    timeframe: '1D',
    action: 'buy',
    priority: 'high'
  },
  {
    id: '3',
    type: 'volume',
    message: `Volume spike (+247%) indicates institutional accumulation`,
    confidence: 92,
    timeframe: '1H',
    action: 'buy',
    priority: 'medium'
  },
  {
    id: '4',
    type: 'pattern',
    message: `Double bottom pattern confirmed at $${(stock.price * 0.95).toFixed(2)} support`,
    confidence: 71,
    timeframe: '1W',
    action: 'hold',
    priority: 'medium'
  },
  {
    id: '5',
    type: 'warning',
    message: `Approaching key resistance at $${(stock.price * 1.08).toFixed(2)}`,
    confidence: 89,
    timeframe: '1D',
    action: 'caution',
    priority: 'high'
  },
  {
    id: '6',
    type: 'news',
    message: `Earnings report due in 3 days - historical volatility increases 34% pre-earnings`,
    confidence: 95,
    timeframe: 'Event',
    action: 'caution',
    priority: 'medium'
  }
];

export const QuantHUD = ({ selectedStock, isVisible, onToggleVisibility, className = "" }: QuantHUDProps) => {
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeInsight, setActiveInsight] = useState(0);

  useEffect(() => {
    setInsights(generateMockInsights(selectedStock));
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setInsights(prev => {
        const newInsights = generateMockInsights(selectedStock);
        // Randomly update confidence scores to simulate live analysis
        return newInsights.map(insight => ({
          ...insight,
          confidence: Math.max(60, Math.min(98, insight.confidence + (Math.random() - 0.5) * 10))
        }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedStock]);

  // Auto-cycle through insights
  useEffect(() => {
    if (!isExpanded && insights.length > 0) {
      const interval = setInterval(() => {
        setActiveInsight(prev => (prev + 1) % insights.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isExpanded, insights.length]);

  const getInsightIcon = (type: AnalysisInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'momentum': return <Activity className="w-4 h-4" />;
      case 'volume': return <Target className="w-4 h-4" />;
      case 'pattern': return <Eye className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'news': return <Zap className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'buy': return 'text-bullish bg-bullish/10 border-bullish/30';
      case 'sell': return 'text-bearish bg-bearish/10 border-bearish/30';
      case 'caution': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-green-500';
    }
  };

  if (!isVisible) return null;

  const currentInsight = insights[activeInsight];

  return (
    <Card className={`fixed bottom-6 right-6 z-40 bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl transition-all duration-300 ${
      isExpanded ? 'w-96 h-[500px]' : 'w-80 h-auto'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="w-5 h-5 text-neon-cyan" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          </div>
          <h3 className="font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            QuantHUD
          </h3>
          <Badge variant="outline" className="text-xs">
            LIVE
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stock Info */}
      <div className="px-4 py-2 bg-background/30">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold">{selectedStock.symbol}</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono">${selectedStock.price.toFixed(2)}</span>
            <span className={selectedStock.change >= 0 ? 'text-bullish' : 'text-bearish'}>
              {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded ? (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg bg-background/30 border-l-4 ${getPriorityColor(insight.priority)} cursor-pointer hover:bg-background/50 transition-colors ${
                  index === activeInsight ? 'ring-1 ring-primary/30' : ''
                }`}
                onClick={() => setActiveInsight(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-sm leading-relaxed">{insight.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.timeframe}
                        </Badge>
                        {insight.action && (
                          <Badge variant="outline" className={`text-xs ${getActionColor(insight.action)}`}>
                            {insight.action.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {insight.confidence.toFixed(0)}%
                        </span>
                        <Progress 
                          value={insight.confidence} 
                          className="w-12 h-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        currentInsight && (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(currentInsight.type)}
              </div>
              
              <div className="flex-1 space-y-2">
                <p className="text-sm leading-relaxed">{currentInsight.message}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {currentInsight.timeframe}
                    </Badge>
                    {currentInsight.action && (
                      <Badge variant="outline" className={`text-xs ${getActionColor(currentInsight.action)}`}>
                        {currentInsight.action.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {currentInsight.confidence.toFixed(0)}%
                    </span>
                    <Progress 
                      value={currentInsight.confidence} 
                      className="w-12 h-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-3 gap-1">
              {insights.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === activeInsight ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )
      )}
    </Card>
  );
};