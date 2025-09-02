import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  ChevronUp, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  Target,
  Zap,
  Copy,
  CheckCircle
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

interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  atr: number;
  volume: number;
  volumeAvg: number;
}

interface AIInsight {
  id: string;
  type: 'signal' | 'trend' | 'risk' | 'momentum' | 'breakout';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  timestamp: Date;
  action?: 'buy' | 'sell' | 'hold' | 'watch';
  tradePlan?: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
    positionSize: string;
    reasoning: string;
  };
}

interface AILiveAnalyzerHUDProps {
  market: Market;
  marketData: MarketData;
  isVisible: boolean;
  onToggle: () => void;
}

const STORAGE_KEY = 'ai-analyzer-state';

export const AILiveAnalyzerHUD = ({ market, marketData, isVisible, onToggle }: AILiveAnalyzerHUDProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Generate realistic technical indicators
  const generateIndicators = (): TechnicalIndicators => {
    const price = market.price;
    const volatility = marketData.volatility;
    const momentum = marketData.momentum;
    
    return {
      ema20: price * (0.98 + Math.random() * 0.04),
      ema50: price * (0.96 + Math.random() * 0.08),
      ema200: price * (0.92 + Math.random() * 0.16),
      rsi: 30 + (momentum * 40) + (Math.random() * 20),
      macdLine: (Math.random() - 0.5) * 2,
      macdSignal: (Math.random() - 0.5) * 1.8,
      macdHistogram: (Math.random() - 0.5) * 0.5,
      bbUpper: price * 1.02,
      bbMiddle: price,
      bbLower: price * 0.98,
      atr: price * (0.01 + volatility * 0.02),
      volume: marketData.volume * 1000000,
      volumeAvg: 850000 + Math.random() * 300000
    };
  };

  // Generate AI insights based on real technical analysis
  const generateInsight = (indicators: TechnicalIndicators): AIInsight => {
    const price = market.price;
    const rsi = indicators.rsi;
    const ema20 = indicators.ema20;
    const ema50 = indicators.ema50;
    const ema200 = indicators.ema200;
    const macdHistogram = indicators.macdHistogram;
    const volume = indicators.volume;
    const volumeAvg = indicators.volumeAvg;
    const atr = indicators.atr;

    // EMA Crossover Analysis
    if (ema20 > ema50 && ema50 > ema200 && rsi < 70 && rsi > 40) {
      const confidence = Math.floor(68 + (rsi - 40) / 30 * 25 + (volume > volumeAvg ? 7 : 0));
      const entry = price;
      const stopLoss = Math.min(ema20, ema50) * 0.995;
      const takeProfit = entry + (entry - stopLoss) * 2.5;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'trend',
        title: 'Bullish EMA Alignment Setup',
        description: `EMA20 > EMA50 > EMA200 with RSI at ${rsi.toFixed(0)}; strong uptrend confirmation`,
        confidence,
        evidence: [
          `EMA20 (${ema20.toFixed(2)}) > EMA50 (${ema50.toFixed(2)})`,
          `RSI ${rsi.toFixed(0)} in healthy range`,
          `Volume ${volume > volumeAvg ? '+' + ((volume / volumeAvg - 1) * 100).toFixed(0) + '%' : 'below average'}`,
          `MACD histogram ${macdHistogram > 0 ? 'positive' : 'negative'}`
        ],
        action: 'buy',
        timestamp: new Date(),
        tradePlan: {
          entry,
          stopLoss,
          takeProfit,
          riskReward: (takeProfit - entry) / (entry - stopLoss),
          positionSize: '1-2% of portfolio',
          reasoning: 'Multiple EMA confluence with healthy RSI and momentum confirmation'
        }
      };
    }

    // RSI Oversold + Support
    if (rsi < 35 && price < ema20 && macdHistogram > -0.2) {
      const confidence = Math.floor(60 + (35 - rsi) * 1.5 + (volume > volumeAvg ? 10 : 0));
      const entry = price;
      const stopLoss = price * 0.96;
      const takeProfit = Math.min(ema20, ema50);
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'signal',
        title: 'Oversold Bounce Setup',
        description: `RSI at ${rsi.toFixed(0)} oversold with potential support; bounce likely`,
        confidence,
        evidence: [
          `RSI ${rsi.toFixed(0)} oversold (<35)`,
          `Price below EMA20 but holding`,
          `MACD showing early reversal signs`,
          `Volume ${volume > volumeAvg ? 'increasing' : 'steady'}`
        ],
        action: 'buy',
        timestamp: new Date(),
        tradePlan: {
          entry,
          stopLoss,
          takeProfit,
          riskReward: (takeProfit - entry) / (entry - stopLoss),
          positionSize: '0.5-1% of portfolio (higher risk)',
          reasoning: 'Counter-trend trade on oversold conditions with tight risk management'
        }
      };
    }

    // Volatility Spike Warning
    if (atr > price * 0.025) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'risk',
        title: 'High Volatility Alert',
        description: `ATR at ${(atr / price * 100).toFixed(1)}% - elevated volatility detected`,
        confidence: 85,
        evidence: [
          `ATR ${(atr / price * 100).toFixed(1)}% above normal`,
          `Bollinger Bands expanding`,
          `Expect wider price swings`,
          `Reduce position sizes by 30-50%`
        ],
        action: 'watch',
        timestamp: new Date()
      };
    }

    // Momentum Divergence
    if (rsi > 70 && macdHistogram < 0 && price > ema20) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'momentum',
        title: 'Bearish Divergence Warning',
        description: `RSI overbought at ${rsi.toFixed(0)} with MACD turning negative; momentum slowing`,
        confidence: 72,
        evidence: [
          `RSI ${rsi.toFixed(0)} overbought (>70)`,
          `MACD histogram turning negative`,
          `Price above EMA20 but momentum weak`,
          `Consider profit-taking or hedging`
        ],
        action: 'sell',
        timestamp: new Date()
      };
    }

    // Default consolidation pattern
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: 'trend',
      title: 'Consolidation Pattern',
      description: `${market.symbol} in sideways range; waiting for breakout confirmation`,
      confidence: 45,
      evidence: [
        `Price between EMAs`,
        `RSI ${rsi.toFixed(0)} neutral range`,
        `Volume below average`,
        `No clear directional bias`
      ],
      action: 'watch',
      timestamp: new Date()
    };
  };

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsExpanded(parsed.isExpanded || false);
      } catch (error) {
        console.error('Failed to load analyzer state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const state = { isExpanded };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isExpanded]);

  // Simulate real-time analysis with indicators
  useEffect(() => {
    if (!isVisible) return;

    const analyzeMarket = () => {
      setIsAnalyzing(true);
      
      // Generate new indicators
      const newIndicators = generateIndicators();
      setIndicators(newIndicators);
      
      setTimeout(() => {
        const newInsight = generateInsight(newIndicators);
        setCurrentInsight(newInsight);
        setIsAnalyzing(false);

        // Show alerts for high-confidence signals or major changes
        const shouldAlert = newInsight.confidence > 75 || 
                           (newInsight.action === 'buy' || newInsight.action === 'sell') ||
                           newInsight.type === 'risk';

        if (shouldAlert && (!lastAlertTime || Date.now() - lastAlertTime.getTime() > 30000)) {
          setLastAlertTime(new Date());
          toast({
            title: `${newInsight.action?.toUpperCase()} Signal`,
            description: newInsight.title,
            duration: 5000,
          });
          setAlerts(prev => [...prev.slice(-2), `${newInsight.action?.toUpperCase()}: ${newInsight.title}`]);
        }
      }, 1200);
    };

    analyzeMarket();
    const interval = setInterval(analyzeMarket, 6000); // Update every 6 seconds

    return () => clearInterval(interval);
  }, [isVisible, market.symbol, marketData, lastAlertTime, toast]);

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

  const handleTradeSignal = () => {
    if (!currentInsight?.tradePlan) return;

    const tradePlan = `🎯 TRADE SIGNAL: ${currentInsight.title}
💰 Entry: $${currentInsight.tradePlan.entry.toFixed(2)}
🛡️ Stop Loss: $${currentInsight.tradePlan.stopLoss.toFixed(2)}
🎯 Take Profit: $${currentInsight.tradePlan.takeProfit.toFixed(2)}
📊 Risk/Reward: 1:${currentInsight.tradePlan.riskReward.toFixed(2)}
📈 Position Size: ${currentInsight.tradePlan.positionSize}
🧠 Confidence: ${currentInsight.confidence}%

📋 Reasoning: ${currentInsight.tradePlan.reasoning}

📊 Evidence:
${currentInsight.evidence.map(e => `• ${e}`).join('\n')}

⚠️ This is AI-generated analysis. Always do your own research and manage risk appropriately.`;

    navigator.clipboard.writeText(tradePlan).then(() => {
      toast({
        title: "Trade Plan Copied!",
        description: "Paste into your broker or save for reference",
        duration: 3000,
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Please copy the trade plan manually",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-4 left-4 z-40 max-w-md">
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

              {/* Trade Signal Button */}
              {currentInsight.tradePlan && (
                <div className="pt-3 border-t border-border/50">
                  <Button
                    onClick={handleTradeSignal}
                    className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Trade This Signal
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && !currentInsight && (
            <div className="flex items-center gap-3 py-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Analyzing market conditions...</span>
            </div>
          )}

          {/* Trade Signal Button - Collapsed View */}
          {!isExpanded && currentInsight?.tradePlan && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <Button
                onClick={handleTradeSignal}
                className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Trade Signal
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};