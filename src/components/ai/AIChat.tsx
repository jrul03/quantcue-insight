import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, BarChart3, TrendingUp, Clock } from 'lucide-react';
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

export const AIChat = ({ market, isVisible, className }: AIChatProps) => {
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

    if (lower.includes('last candle') || lower.includes('explain')) {
      const context = getChartContext(market.symbol);
      const lastCandle = context.lastCandles[context.lastCandles.length - 1];
      const move = lastCandle.close - lastCandle.open;
      const newsItems = getNewsWindow(market.symbol, lastCandle.timestamp);
      
      return {
        content: `Last ${context.timeframe} candle for ${market.symbol}: ${move > 0 ? 'Bullish' : 'Bearish'} move from $${lastCandle.open} to $${lastCandle.close} (${move > 0 ? '+' : ''}${((move / lastCandle.open) * 100).toFixed(2)}%). Volume: ${lastCandle.volume.toLocaleString()}. RSI at ${context.indicators.rsi}, suggesting ${context.indicators.rsi > 70 ? 'overbought' : context.indicators.rsi < 30 ? 'oversold' : 'neutral'} conditions. Recent news: "${newsItems[0]?.headline}" may be driving momentum.`,
        confidence: 0.85
      };
    }

    if (lower.includes('backtest') || lower.includes('ema') || lower.includes('strategy')) {
      const strategy = lower.includes('ema') ? 'ema50/200' : lower.includes('rsi') ? 'rsi30/70' : 'macd_cross';
      const results = quickBacktest(market.symbol, strategy);
      
      return {
        content: `Backtest results for ${strategy} on ${market.symbol}: Win rate ${(results.winRate * 100).toFixed(1)}%, Profit factor ${results.profitFactor}, Total trades ${results.trades}. Current setup shows ${market.changePercent > 0 ? 'bullish' : 'bearish'} bias with ${results.winRate > 0.6 ? 'favorable' : 'challenging'} historical performance.`,
        confidence: 0.78
      };
    }

    if (lower.includes('move') || lower.includes('bar') || lower.includes('why')) {
      const newsItems = getNewsWindow(market.symbol, Date.now());
      const sentiment = newsItems.reduce((acc, item) => acc + item.sentiment, 0) / newsItems.length;
      
      return {
        content: `${market.symbol}'s ${Math.abs(market.changePercent).toFixed(2)}% move appears driven by: ${newsItems[0]?.headline}. Overall sentiment: ${sentiment > 0.6 ? 'Positive' : sentiment < 0.4 ? 'Negative' : 'Neutral'} (${(sentiment * 100).toFixed(0)}%). Technical levels ${market.changePercent > 0 ? 'broken to upside' : 'tested to downside'}, suggesting ${market.changePercent > 0 ? 'continuation' : 'potential reversal'}.`,
        confidence: 0.72
      };
    }

    // Default response
    return {
      content: `Analyzing ${market.symbol}... Current price $${market.price.toFixed(2)} with ${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}% change. Try asking: "Explain last candle", "Backtest EMA50/200", or "What moved this bar?".`,
      confidence: 0.6
    };
  };

  const quickCommands = [
    { text: 'Explain last candle', icon: BarChart3 },
    { text: 'Backtest EMA50/200', icon: TrendingUp },
    { text: 'What moved this bar?', icon: Clock }
  ];

  if (!isVisible) return null;

  return (
    <Card className={cn("flex flex-col bg-slate-900/90 border-slate-700", className)}>
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-slate-300">AI Trading Assistant</span>
        <Badge variant="outline" className="text-xs">
          {market.symbol}
        </Badge>
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
        <div className="flex gap-1 mb-2">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.text}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setInputValue(cmd.text);
                setTimeout(handleSend, 100);
              }}
            >
              <cmd.icon className="w-3 h-3 mr-1" />
              {cmd.text.split(' ')[0]}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about chart, strategy, or news..."
            className="text-sm"
          />
          <Button onClick={handleSend} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};