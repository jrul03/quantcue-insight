import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, BarChart3, TrendingUp, Clock, X, Zap, DollarSign, Activity, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  confidence?: number;
}

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface AIChatProps {
  market: Market;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

// Mock chart context for demo
const getChartContext = (symbol: string) => ({
  symbol,
  timeframe: '5m',
  lastCandles: [
    { open: 100, high: 105, low: 98, close: 103, volume: 1000, timestamp: Date.now() - 300000 },
    { open: 103, high: 107, low: 101, close: 106, volume: 1200, timestamp: Date.now() - 240000 },
    { open: 106, high: 108, low: 104, close: 105, volume: 800, timestamp: Date.now() - 180000 }
  ],
  indicators: {
    ema9: 104.5,
    ema20: 102.3,
    rsi: 68.2,
    macd: 0.8
  }
});

// Quick backtest simulation
const quickBacktest = (symbol: string, strategy: string) => {
  const strategies: Record<string, any> = {
    'ema50/200': { winRate: 0.65, profitFactor: 1.4, trades: 23 },
    'rsi30/70': { winRate: 0.58, profitFactor: 1.2, trades: 45 },
    'macd_cross': { winRate: 0.62, profitFactor: 1.35, trades: 18 }
  };
  
  return strategies[strategy.toLowerCase()] || { winRate: 0.6, profitFactor: 1.3, trades: 20 };
};

// Mock news window for candle analysis
const getNewsWindow = (symbol: string, timestamp: number) => [
  {
    headline: `${symbol} sees institutional buying pressure`,
    sentiment: 0.7,
    relevance: 0.9,
    source: 'Bloomberg',
    timestamp: timestamp - 60000
  },
  {
    headline: 'Market rotation into tech continues',
    sentiment: 0.5,
    relevance: 0.6,
    source: 'CNBC',
    timestamp: timestamp - 120000
  }
];

export const AIChat = ({ market, isVisible, onClose, className }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm analyzing ${market.symbol} at $${market.price.toFixed(2)}. Ask me about the last candle, backtesting strategies, or what's moving the market.`,
      timestamp: Date.now(),
      confidence: 0.95
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    // Process command and generate response
    setTimeout(() => {
      const response = processCommand(inputValue, market);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        confidence: response.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 500);

    setInputValue('');
  };

  const processCommand = (input: string, market: Market) => {
    const lower = input.toLowerCase();

    // Market analysis queries
    if (lower.includes('price') || lower.includes('target') || lower.includes('support') || lower.includes('resistance')) {
      const support = market.price * 0.95;
      const resistance = market.price * 1.05;
      return {
        content: `Technical analysis for ${market.symbol}: Current price $${market.price.toFixed(2)}. Key support at $${support.toFixed(2)}, resistance at $${resistance.toFixed(2)}. ${market.changePercent > 0 ? 'Bullish momentum' : 'Bearish pressure'} with ${Math.abs(market.changePercent).toFixed(2)}% move. Consider ${market.changePercent > 0 ? 'profit-taking near resistance' : 'buying opportunities near support'}.`,
        confidence: 0.82
      };
    }

    // Risk management queries
    if (lower.includes('risk') || lower.includes('stop') || lower.includes('position') || lower.includes('size')) {
      const riskLevel = Math.abs(market.changePercent) > 2 ? 'High' : Math.abs(market.changePercent) > 1 ? 'Medium' : 'Low';
      const stopLoss = market.changePercent > 0 ? market.price * 0.98 : market.price * 1.02;
      return {
        content: `Risk assessment for ${market.symbol}: ${riskLevel} volatility environment. Suggested stop-loss: $${stopLoss.toFixed(2)} (2% risk). For 1% portfolio risk, max position size would be calculated based on your account size. Current momentum suggests ${market.changePercent > 0 ? 'trend continuation' : 'potential reversal'} patterns.`,
        confidence: 0.88
      };
    }

    // Options and derivatives
    if (lower.includes('option') || lower.includes('call') || lower.includes('put') || lower.includes('iv') || lower.includes('volatility')) {
      const iv = 25 + Math.random() * 30;
      const callDelta = 0.3 + Math.random() * 0.4;
      return {
        content: `Options analysis for ${market.symbol}: Implied volatility ~${iv.toFixed(1)}% (${iv > 30 ? 'elevated' : 'normal'} levels). Call delta ~${callDelta.toFixed(2)} suggests ${callDelta > 0.5 ? 'bullish' : 'neutral'} positioning. Consider ${market.changePercent > 0 ? 'covered calls or protective puts' : 'cash-secured puts or long calls'} based on current trend.`,
        confidence: 0.75
      };
    }

    // Sector and correlation analysis
    if (lower.includes('sector') || lower.includes('correlation') || lower.includes('peers') || lower.includes('compare')) {
      return {
        content: `Sector analysis: ${market.symbol} showing ${market.changePercent > 0 ? 'outperformance' : 'underperformance'} vs sector avg. Key correlations with SPY (~0.7), sector ETF (~0.85). Peer comparison suggests ${market.changePercent > 1 ? 'relative strength' : market.changePercent < -1 ? 'relative weakness' : 'in-line performance'}. Monitor sector rotation trends for continuation signals.`,
        confidence: 0.78
      };
    }

    // News and sentiment analysis
    if (lower.includes('news') || lower.includes('sentiment') || lower.includes('social') || lower.includes('media')) {
      const sentiment = 0.3 + Math.random() * 0.4;
      return {
        content: `Sentiment analysis for ${market.symbol}: Social sentiment ${sentiment > 0.6 ? 'bullish' : sentiment < 0.4 ? 'bearish' : 'neutral'} (${(sentiment * 100).toFixed(0)}%). Recent news flow ${market.changePercent > 0 ? 'supportive' : 'challenging'} with institutional flows ${Math.random() > 0.5 ? 'positive' : 'mixed'}. Watch for sentiment shifts around key levels.`,
        confidence: 0.70
      };
    }

    // Pattern recognition
    if (lower.includes('pattern') || lower.includes('chart') || lower.includes('technical') || lower.includes('setup')) {
      const patterns = ['ascending triangle', 'cup and handle', 'flag', 'double bottom', 'head and shoulders'];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      return {
        content: `Technical pattern analysis: ${market.symbol} showing potential ${pattern} formation. ${market.changePercent > 0 ? 'Bullish' : 'Bearish'} bias with confirmation needed above/below key levels. Volume profile ${Math.random() > 0.5 ? 'supports' : 'questions'} the current move. Pattern target suggests ${market.changePercent > 0 ? '+3-5%' : '-3-5%'} potential.`,
        confidence: 0.73
      };
    }

    // Original commands enhanced
    if (lower.includes('last candle') || lower.includes('explain')) {
      const context = getChartContext(market.symbol);
      const lastCandle = context.lastCandles[context.lastCandles.length - 1];
      const move = lastCandle.close - lastCandle.open;
      const newsItems = getNewsWindow(market.symbol, lastCandle.timestamp);
      
      return {
        content: `Deep candle analysis: ${market.symbol} ${context.timeframe} candle shows ${move > 0 ? 'bullish engulfing' : 'bearish rejection'} from $${lastCandle.open} to $${lastCandle.close} (${move > 0 ? '+' : ''}${((move / lastCandle.open) * 100).toFixed(2)}%). Volume: ${lastCandle.volume.toLocaleString()} vs avg. RSI ${context.indicators.rsi} indicates ${context.indicators.rsi > 70 ? 'overbought - watch for pullback' : context.indicators.rsi < 30 ? 'oversold - bounce potential' : 'neutral momentum'}. News catalyst: "${newsItems[0]?.headline}" driving ${newsItems[0]?.sentiment > 0 ? 'positive' : 'negative'} sentiment.`,
        confidence: 0.90
      };
    }

    if (lower.includes('backtest') || lower.includes('ema') || lower.includes('strategy')) {
      const strategy = lower.includes('ema') ? 'ema50/200' : lower.includes('rsi') ? 'rsi30/70' : lower.includes('macd') ? 'macd_cross' : 'bollinger_bands';
      const results = quickBacktest(market.symbol, strategy);
      
      return {
        content: `Enhanced backtest: ${strategy} on ${market.symbol} over 6 months: Win rate ${(results.winRate * 100).toFixed(1)}%, Profit factor ${results.profitFactor}, Sharpe ratio ~1.2, Max drawdown -${(Math.random() * 15 + 5).toFixed(1)}%. Current signal strength: ${market.changePercent > 0 ? 'Strong' : 'Weak'} with ${results.winRate > 0.6 ? 'favorable' : 'challenging'} odds. Next entry: Wait for ${market.changePercent > 0 ? 'pullback to EMA20' : 'break above resistance'}.`,
        confidence: 0.85
      };
    }

    if (lower.includes('move') || lower.includes('bar') || lower.includes('why')) {
      const newsItems = getNewsWindow(market.symbol, Date.now());
      const sentiment = newsItems.reduce((acc, item) => acc + item.sentiment, 0) / newsItems.length;
      const volume = Math.random() > 0.5 ? 'above' : 'below';
      
      return {
        content: `Movement analysis: ${market.symbol}'s ${Math.abs(market.changePercent).toFixed(2)}% move driven by: "${newsItems[0]?.headline}" (${(newsItems[0]?.sentiment * 100).toFixed(0)}% sentiment). Volume ${volume} average suggests ${volume === 'above' ? 'conviction behind move' : 'low participation - suspect'}. Institutional flows ${Math.random() > 0.5 ? 'aligned' : 'mixed'}. Key level ${market.changePercent > 0 ? 'breakout' : 'breakdown'} with ${sentiment > 0.5 ? 'continuation' : 'reversal'} bias.`,
        confidence: 0.82
      };
    }

    // Default enhanced response
    return {
      content: `AI Analysis for ${market.symbol}: Price $${market.price.toFixed(2)} (${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%). Try asking: "What's the price target?", "Analyze risk levels", "Show technical patterns", "Check sentiment", "Options strategy", or "Sector comparison" for detailed insights.`,
      confidence: 0.65
    };
  };

  const quickCommands = [
    { text: 'Explain last candle', icon: BarChart3 },
    { text: 'Price target?', icon: Target },
    { text: 'Risk analysis', icon: AlertTriangle },
    { text: 'Technical patterns', icon: Activity },
    { text: 'Options strategy', icon: DollarSign },
    { text: 'Sector comparison', icon: TrendingUp },
    { text: 'Sentiment check', icon: Zap },
    { text: 'What moved this bar?', icon: Clock }
  ];

  if (!isVisible) return null;

  return (
    <Card className={cn("flex flex-col bg-slate-900/90 border-slate-700", className)}>
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">AI Trading Assistant</span>
          <Badge variant="outline" className="text-xs">
            {market.symbol}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-2 rounded-lg text-sm",
                  message.type === 'user'
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                )}
              >
                {message.content}
                {message.confidence && (
                  <div className="text-xs opacity-70 mt-1">
                    Confidence: {(message.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-1 mb-3">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.text}
              variant="outline"
              size="sm"
              className="text-xs justify-start h-8 text-left"
              onClick={() => {
                setInputValue(cmd.text);
                setTimeout(handleSend, 100);
              }}
            >
              <cmd.icon className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{cmd.text}</span>
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about trading, analysis, or strategy..."
            className="text-sm"
          />
          <Button onClick={handleSend} size="sm" disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};