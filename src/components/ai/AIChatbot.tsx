import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  Brain,
  TrendingUp,
  BarChart3,
  Newspaper,
  Calculator,
  Clock,
  User,
  Bot
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

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    symbol: string;
    price: number;
    indicators?: string[];
  };
}

interface AIChatbotProps {
  market: Market;
  marketData: MarketData;
  isVisible: boolean;
  onToggle: () => void;
}

const STORAGE_KEY = 'ai-chatbot-history';

export const AIChatbot = ({ market, marketData, isVisible, onToggle }: AIChatbotProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    } else {
      // Welcome message
      setMessages([{
        id: '1',
        type: 'assistant',
        content: `Hi! I'm your AI trading assistant. I can help analyze ${market.symbol}, explain market movements, generate trade plans, and answer questions about your charts. What would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [market.symbol]);

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const generateAIResponse = (userMessage: string): string => {
    const context = {
      symbol: market.symbol,
      price: market.price,
      change: market.change,
      changePercent: market.changePercent,
      sentiment: marketData.sentiment,
      volatility: marketData.volatility,
      momentum: marketData.momentum
    };

    const lowerMessage = userMessage.toLowerCase();

    // Pattern-based responses with context awareness
    if (lowerMessage.includes('why') && (lowerMessage.includes('drop') || lowerMessage.includes('fall'))) {
      return `The recent decline in ${context.symbol} (currently ${context.change >= 0 ? '+' : ''}${context.change.toFixed(2)}%) appears to be driven by market sentiment at ${(context.sentiment * 100).toFixed(0)}% and elevated volatility at ${(context.volatility * 100).toFixed(0)}%. Key factors likely include profit-taking after recent gains, broader market rotation, and reduced institutional flow. The momentum indicator at ${(context.momentum * 100).toFixed(0)}% suggests the move may be temporary if support holds at $${(context.price * 0.97).toFixed(2)}.`;
    }

    if (lowerMessage.includes('risk') && lowerMessage.includes('reward')) {
      const entryPrice = context.price;
      const stopLoss = entryPrice * 0.95;
      const takeProfit = entryPrice * 1.08;
      const riskReward = ((takeProfit - entryPrice) / (entryPrice - stopLoss)).toFixed(2);
      
      return `For a long position in ${context.symbol} at current levels ($${entryPrice.toFixed(2)}):
      
**Entry:** $${entryPrice.toFixed(2)}
**Stop Loss:** $${stopLoss.toFixed(2)} (-5%)
**Take Profit:** $${takeProfit.toFixed(2)} (+8%)
**Risk/Reward Ratio:** 1:${riskReward}

With volatility at ${(context.volatility * 100).toFixed(0)}%, consider reducing position size by 20-30%. The momentum reading of ${(context.momentum * 100).toFixed(0)}% supports this directional bias.`;
    }

    if (lowerMessage.includes('24h') || lowerMessage.includes('24 hours') || lowerMessage.includes('summary')) {
      return `**24H Summary for ${context.symbol}:**

📊 **Price Action:** ${context.change >= 0 ? '+' : ''}${context.change.toFixed(2)} (${context.changePercent.toFixed(2)}%)
🎯 **Sentiment:** ${(context.sentiment * 100).toFixed(0)}% ${context.sentiment > 0.6 ? 'Bullish' : context.sentiment < 0.4 ? 'Bearish' : 'Neutral'}
⚡ **Volatility:** ${(context.volatility * 100).toFixed(0)}% ${context.volatility > 0.5 ? 'High' : 'Normal'}
🚀 **Momentum:** ${(context.momentum * 100).toFixed(0)}% ${context.momentum > 0.6 ? 'Strong' : context.momentum < 0.4 ? 'Weak' : 'Moderate'}

Key levels to watch: Support at $${(context.price * 0.97).toFixed(2)}, Resistance at $${(context.price * 1.03).toFixed(2)}. Volume profile suggests ${context.momentum > 0.5 ? 'continued buying interest' : 'potential consolidation'}.`;
    }

    if (lowerMessage.includes('plan') || lowerMessage.includes('strategy')) {
      const bias = context.momentum > 0.6 ? 'bullish' : context.momentum < 0.4 ? 'bearish' : 'neutral';
      return `**Trade Plan for ${context.symbol}:**

**Market Bias:** ${bias.toUpperCase()} (Momentum: ${(context.momentum * 100).toFixed(0)}%)

**Setup:**
${bias === 'bullish' ? 
  `- Look for pullbacks to $${(context.price * 0.98).toFixed(2)} for entries
- Target: $${(context.price * 1.05).toFixed(2)} (5% upside)
- Stop: $${(context.price * 0.95).toFixed(2)} (5% risk)` :
  bias === 'bearish' ?
  `- Wait for resistance at $${(context.price * 1.02).toFixed(2)} to short
- Target: $${(context.price * 0.95).toFixed(2)} (5% downside)  
- Stop: $${(context.price * 1.05).toFixed(2)} (5% risk)` :
  `- Range-bound between $${(context.price * 0.97).toFixed(2)} - $${(context.price * 1.03).toFixed(2)}
- Buy support, sell resistance
- Tight stops due to uncertainty`}

**Risk Management:** Position size 1-2% of portfolio given ${(context.volatility * 100).toFixed(0)}% volatility.`;
    }

    if (lowerMessage.includes('last candle') || lowerMessage.includes('latest bar')) {
      return `The most recent candle for ${context.symbol} shows ${context.change >= 0 ? 'bullish' : 'bearish'} price action with a ${Math.abs(context.changePercent).toFixed(2)}% move. This aligns with the current momentum reading of ${(context.momentum * 100).toFixed(0)}%. 

Key observations:
- Volume appears ${context.momentum > 0.5 ? 'above average, supporting the move' : 'below average, suggesting weak conviction'}
- The move ${context.volatility > 0.5 ? 'comes with elevated volatility, indicating institutional activity' : 'shows normal volatility patterns'}
- Sentiment at ${(context.sentiment * 100).toFixed(0)}% ${context.sentiment > context.momentum ? 'exceeds momentum, suggesting potential continuation' : 'lags momentum, indicating caution'}`;
    }

    // Default contextual response
    return `I'm analyzing ${context.symbol} which is currently at $${context.price.toFixed(2)} (${context.change >= 0 ? '+' : ''}${context.change.toFixed(2)}%). 

Market conditions show:
- Sentiment: ${(context.sentiment * 100).toFixed(0)}%
- Volatility: ${(context.volatility * 100).toFixed(0)}%  
- Momentum: ${(context.momentum * 100).toFixed(0)}%

Could you be more specific about what you'd like to know? I can help with trade plans, risk analysis, market explanations, or technical insights.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      context: {
        symbol: market.symbol,
        price: market.price,
        indicators: ['EMA', 'RSI', 'MACD', 'Bollinger Bands']
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Explain last candle', icon: BarChart3, action: () => setInputValue('Explain the last candle movement') },
    { label: 'Generate trade plan', icon: TrendingUp, action: () => setInputValue('Generate a trade plan for current conditions') },
    { label: 'Summarize 24h', icon: Clock, action: () => setInputValue('Summarize the last 24 hours of price action') },
    { label: 'Risk/Reward', icon: Calculator, action: () => setInputValue('What is the current risk/reward if I enter long?') }
  ];

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 left-6 z-40 transition-all duration-300 ${
      isExpanded ? 'w-96 h-96' : 'w-80'
    }`}>
      <Card className="hud-panel h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
              <div className="text-xs text-muted-foreground">
                Context: {market.symbol} @ ${market.price.toFixed(2)}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Quick Actions - Collapsed View */}
        {!isExpanded && (
          <div className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground mb-2">Quick Actions:</div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  onClick={action.action}
                  className="h-auto p-2 flex flex-col items-center gap-1 text-xs hover:bg-primary/10"
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-center leading-tight">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface - Expanded View */}
        {isExpanded && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${message.type === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about market conditions, trade plans, or analysis..."
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};