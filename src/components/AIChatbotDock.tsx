import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  TrendingUp,
  BarChart3,
  Zap
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

interface AIChatbotDockProps {
  symbol: string;
  timeframe: string;
  marketData?: {
    price: number;
    change: number;
    changePercent: number;
  };
}

export const AIChatbotDock = ({ symbol, timeframe, marketData }: AIChatbotDockProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm your AI trading assistant. I can help analyze ${symbol}, explain market movements, generate trading plans, and backtest strategies. What would you like to know?`,
      sender: 'ai',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickCommands = [
    { text: "Explain last candle", icon: BarChart3 },
    { text: "Generate trading plan", icon: TrendingUp },
    { text: "Analyze market sentiment", icon: Bot },
    { text: "Backtest EMA strategy", icon: Zap }
  ];

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const message = userMessage.toLowerCase();
    const changePercent = marketData?.changePercent || 0;
    const isUp = changePercent > 0;

    if (message.includes('candle') || message.includes('last') || message.includes('movement')) {
      return `${symbol} is showing a ${isUp ? 'bullish' : 'bearish'} move of ${changePercent.toFixed(2)}% on the ${timeframe} timeframe. ${isUp ? 'The upward momentum could continue if volume supports the breakout above key resistance.' : 'The downward pressure may persist unless we see strong buying interest at current support levels.'} Volume profile and RSI divergence should be monitored closely.`;
    }
    
    if (message.includes('trading plan') || message.includes('strategy')) {
      return `For ${symbol} trading plan: 
      
**Entry**: ${isUp ? 'Wait for pullback to EMA21 support' : 'Short on bounce to resistance'} 
**Target**: ${isUp ? '+2.5% from current levels' : '-1.8% decline expected'}
**Stop**: ${isUp ? 'Below yesterday\'s low' : 'Above morning high'}
**Risk/Reward**: 1:2.5 ratio

Monitor ${timeframe} RSI and volume confirmation. Consider reducing position if VIX spikes above 25.`;
    }
    
    if (message.includes('sentiment') || message.includes('market')) {
      return `Current market sentiment for ${symbol}: ${isUp ? '🟢 BULLISH' : '🔴 BEARISH'} 
      
**Technical**: ${isUp ? 'Above key EMAs, bullish momentum' : 'Below resistance, bearish pressure'}
**Volume**: ${Math.random() > 0.5 ? 'Above average - confirming move' : 'Below average - weak conviction'}
**Options Flow**: ${Math.random() > 0.5 ? 'Call buying detected' : 'Put accumulation seen'}
**Sector Rotation**: ${Math.random() > 0.5 ? 'Favoring this sector' : 'Rotating out of sector'}`;
    }
    
    if (message.includes('backtest') || message.includes('ema')) {
      return `EMA Cross Strategy Backtest for ${symbol}:

**Setup**: EMA(12) cross above EMA(26) = BUY signal
**Period**: Last 30 trading days
**Win Rate**: 68% (17 wins, 8 losses)
**Avg Return**: +1.2% per trade
**Max Drawdown**: -3.4%
**Sharpe Ratio**: 1.84

⚠️ Strategy works best in trending markets. Consider adding RSI filter (>50) for better entry timing.`;
    }

    // Default response
    const responses = [
      `I can help analyze ${symbol} movements, market patterns, and trading opportunities. What specific aspect would you like to explore?`,
      `Currently tracking ${symbol} on ${timeframe} timeframe. The recent ${isUp ? 'gain' : 'decline'} of ${Math.abs(changePercent).toFixed(2)}% shows ${isUp ? 'bullish momentum' : 'bearish pressure'}. What's your next question?`,
      `For ${symbol} analysis, I can examine technical indicators, news sentiment, options flow, and generate actionable trading insights. How can I assist you?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(messageText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickCommand = (command: string) => {
    handleSendMessage(command);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isExpanded ? (
        // Collapsed dock button
        <Button
          onClick={() => setIsExpanded(true)}
          size="lg"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg neon-glow group"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </Button>
      ) : (
        // Expanded chat interface
        <Card className="w-96 h-[500px] bg-slate-950/95 border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-slate-400">Trading Helper</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                {symbol}
              </Badge>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsExpanded(false)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Commands */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="grid grid-cols-2 gap-2">
              {quickCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs border-slate-600 hover:border-primary/50 hover:bg-primary/10"
                    onClick={() => handleQuickCommand(command.text)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {command.text}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-200 rounded-lg p-3 text-sm border border-slate-700/50">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about trading strategies, analysis..."
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
              />
              <Button 
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};