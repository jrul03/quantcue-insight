import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Minimize2, 
  Maximize2, 
  Send, 
  Bot, 
  User,
  Zap,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities' | 'memecoins';
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatbotDockProps {
  market: Market;
  isVisible: boolean;
  onToggle: () => void;
}

const QUICK_COMMANDS = [
  "Explain last candle",
  "Summarize today's news impact", 
  "Generate trading plan",
  "Backtest EMA cross",
  "What's driving this move?"
];

// Mock AI responses for demonstration
const generateAIResponse = (message: string, market: Market): string => {
  const responses = {
    "explain last candle": `The last ${market.symbol} candle shows ${market.change >= 0 ? 'bullish' : 'bearish'} momentum with ${Math.abs(market.changePercent).toFixed(2)}% movement. Volume appears ${market.volume > 1000000 ? 'elevated' : 'normal'} suggesting ${market.change >= 0 ? 'institutional buying' : 'profit taking'}.`,
    "summarize today's news impact": `Today's news flow for ${market.symbol} shows mixed sentiment. Key drivers include sector rotation and broader market dynamics. The ${market.changePercent >= 0 ? 'positive' : 'negative'} price action aligns with recent earnings expectations.`,
    "generate trading plan": `For ${market.symbol} at $${market.price.toFixed(2)}: Consider ${market.change >= 0 ? 'momentum continuation' : 'reversal'} strategy. Key levels: Support $${(market.price * 0.985).toFixed(2)}, Resistance $${(market.price * 1.015).toFixed(2)}. Risk management: 2% position size with tight stops.`,
    "backtest ema cross": `EMA cross strategy on ${market.symbol}: Historical win rate ~65% in current market regime. Recent signals show ${market.change >= 0 ? 'bullish' : 'bearish'} bias. Consider combining with volume confirmation for better accuracy.`,
    "what's driving this move": `${market.symbol}'s ${Math.abs(market.changePercent).toFixed(2)}% move appears driven by ${market.change >= 0 ? 'sector rotation and institutional flows' : 'profit taking and risk-off sentiment'}. Technical levels ${market.change >= 0 ? 'broken to upside' : 'tested to downside'}.`
  };

  const key = message.toLowerCase();
  return responses[key as keyof typeof responses] || `I'm analyzing ${market.symbol} data. The current price of $${market.price.toFixed(2)} with ${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}% change suggests ${market.changePercent >= 0 ? 'bullish momentum' : 'bearish pressure'}. What specific aspect would you like me to focus on?`;
};

export const AIChatbotDock = ({ market, isVisible, onToggle }: AIChatbotDockProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI trading assistant. I'm analyzing ${market.symbol} and ready to help with analysis, strategy, and insights.`,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(content, market),
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickCommand = (command: string) => {
    handleSendMessage(command);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Minimized State */}
      {isMinimized && (
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Full Chatbot */}
      {!isMinimized && (
        <Card className="w-96 h-[500px] bg-slate-950/95 border-slate-800/50 backdrop-blur-xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Market Context */}
          <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/30">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <BarChart3 className="w-3 h-3" />
              <span>Analyzing: {market.symbol}</span>
              <Badge variant="outline" className="text-xs border-slate-600">
                ${market.price.toFixed(2)}
              </Badge>
              <Badge 
                variant={market.change >= 0 ? "default" : "destructive"} 
                className="text-xs"
              >
                {market.change >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-br from-purple-600 to-blue-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-3 h-3 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800/50 text-slate-200 border border-slate-700/30'
                    }`}>
                      {message.content}
                      <div className={`text-xs opacity-70 mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-slate-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/30 p-3 rounded-lg">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Commands */}
          <div className="p-3 border-t border-slate-800/30">
            <div className="flex flex-wrap gap-1 mb-3">
              {QUICK_COMMANDS.slice(0, 3).map((command) => (
                <Button
                  key={command}
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickCommand(command)}
                  className="text-xs h-7 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {command}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isTyping) {
                    handleSendMessage(inputValue);
                  }
                }}
                placeholder="Ask me about trading insights..."
                className="bg-slate-900/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 text-sm"
                disabled={isTyping}
              />
              <Button
                size="sm"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0"
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