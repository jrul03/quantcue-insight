import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Send, Bot, User, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  analysis?: {
    signal: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string[];
  };
}

interface MarketData {
  price: number;
  rsi: number;
  emaFast: number;
  emaSlow: number;
  volume: number;
  trend: 'up' | 'down' | 'sideways';
}

export const AITradingAssistant = ({ isVisible = true }: { isVisible?: boolean }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI trading assistant. I can analyze the current market conditions, technical indicators, and provide trading recommendations. What would you like to know about SPY?',
      timestamp: Date.now(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Simulate market data analysis
  const getCurrentMarketData = (): MarketData => ({
    price: 415.23 + (Math.random() - 0.5) * 2,
    rsi: 65 + (Math.random() - 0.5) * 10,
    emaFast: 414.8 + (Math.random() - 0.5) * 1,
    emaSlow: 413.2 + (Math.random() - 0.5) * 1,
    volume: 2500000 + Math.random() * 500000,
    trend: Math.random() > 0.5 ? 'up' : 'down'
  });

  const analyzeMarket = (marketData: MarketData, query: string): ChatMessage => {
    const isRSIOverBought = marketData.rsi > 70;
    const isRSIOverSold = marketData.rsi < 30;
    const isBullishCrossover = marketData.emaFast > marketData.emaSlow;
    
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 50;
    const reasoning: string[] = [];

    // Technical analysis logic
    if (isBullishCrossover && !isRSIOverBought) {
      signal = 'bullish';
      confidence += 25;
      reasoning.push('EMA fast (20) above EMA slow (50) indicates bullish momentum');
      if (!isRSIOverBought) reasoning.push('RSI at healthy levels, room for upward movement');
    } else if (!isBullishCrossover && isRSIOverSold) {
      signal = 'bearish';
      confidence += 20;
      reasoning.push('EMA fast below EMA slow suggests bearish pressure');
    }

    if (isRSIOverBought) {
      signal = 'bearish';
      confidence += 15;
      reasoning.push('RSI indicates overbought conditions, potential reversal');
    } else if (isRSIOverSold) {
      signal = 'bullish';
      confidence += 20;
      reasoning.push('RSI shows oversold conditions, potential bounce expected');
    }

    if (marketData.volume > 2800000) {
      confidence += 10;
      reasoning.push('High volume confirms the current price movement');
    }

    // Generate response based on query and analysis
    let content = '';
    if (query.toLowerCase().includes('buy') || query.toLowerCase().includes('sell')) {
      content = `Based on current market conditions:\n\n**Signal: ${signal.toUpperCase()}** (${confidence}% confidence)\n\n**Current Metrics:**\n• Price: $${marketData.price.toFixed(2)}\n• RSI: ${marketData.rsi.toFixed(1)}\n• EMA 20: $${marketData.emaFast.toFixed(2)}\n• EMA 50: $${marketData.emaSlow.toFixed(2)}\n\n**Analysis:**\n${reasoning.map(r => `• ${r}`).join('\n')}`;
    } else if (query.toLowerCase().includes('rsi')) {
      content = `**RSI Analysis:**\n\nCurrent RSI: ${marketData.rsi.toFixed(1)}\n\n${isRSIOverBought ? '🔴 Overbought territory (>70) - Consider taking profits or waiting for pullback' : isRSIOverSold ? '🟢 Oversold territory (<30) - Potential buying opportunity' : '🟡 Neutral zone (30-70) - Monitor for momentum shifts'}`;
    } else {
      content = `**Market Overview:**\n\nSPY is currently trading at $${marketData.price.toFixed(2)} with ${signal} bias.\n\n**Key Levels:**\n• Support: $${(marketData.price - 2).toFixed(2)}\n• Resistance: $${(marketData.price + 2).toFixed(2)}\n\n**Recommendation:** ${signal === 'bullish' ? 'Consider long positions on pullbacks' : signal === 'bearish' ? 'Consider profit taking or defensive positioning' : 'Wait for clearer directional signals'}`;
    }

    return {
      id: Date.now().toString(),
      type: 'assistant',
      content,
      timestamp: Date.now(),
      analysis: {
        signal,
        confidence,
        reasoning
      }
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAnalyzing(true);

    // Simulate AI analysis delay
    setTimeout(() => {
      const marketData = getCurrentMarketData();
      const aiResponse = analyzeMarket(marketData, inputMessage);
      setMessages(prev => [...prev, aiResponse]);
      setIsAnalyzing(false);
    }, 1500);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isVisible) return null;

  return (
    <FloatingPanel
      storageKey="ai-chat"
      defaultPos={{ x: window.innerWidth - 420, y: window.innerHeight - 580 }}
    >
      <div className="w-96 h-[520px] flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-line">
                    {message.content}
                  </div>
                  
                  {message.analysis && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`${
                            message.analysis.signal === 'bullish'
                              ? 'border-bullish text-bullish'
                              : message.analysis.signal === 'bearish'
                              ? 'border-bearish text-bearish'
                              : 'border-muted-foreground text-muted-foreground'
                          }`}
                        >
                          {message.analysis.signal === 'bullish' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : message.analysis.signal === 'bearish' ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <Activity className="w-3 h-3 mr-1" />
                          )}
                          {message.analysis.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isAnalyzing && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Analyzing market data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about market conditions, RSI, or trading signals..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAnalyzing}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAnalyzing}
              size="icon"
              variant="outline"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
};