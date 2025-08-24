import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Maximize2,
  Minimize2,
  X,
  RotateCcw,
  MessageSquare
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
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
  timestamp: number;
  context?: {
    symbol: string;
    timeframe: string;
    price: number;
    indicators: string[];
  };
  analysis?: {
    signal: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string[];
  };
}

interface AITradingDockProps {
  market: Market;
  marketData: MarketData;
  timeframe: string;
  indicators: string[];
}

const QUICK_ACTIONS = [
  { id: 'explain-candle', label: 'Explain last candle', icon: <Activity className="w-3 h-3" />, description: 'Get AI analysis of the most recent price movement' },
  { id: 'news-impact', label: 'Summarize news impact', icon: <MessageSquare className="w-3 h-3" />, description: 'Understand how recent news affects the market' },
  { id: 'risk-reward', label: 'Show risk/reward', icon: <TrendingUp className="w-3 h-3" />, description: 'Calculate potential risk/reward ratios' },
  { id: 'generate-plan', label: 'Generate trading plan', icon: <Bot className="w-3 h-3" />, description: 'Create a complete trading strategy with entry/exit points' },
];

export const AITradingDock = ({ market, marketData, timeframe, indicators }: AITradingDockProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load persisted conversation from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('aiTradingDockMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    } else {
      // Initialize with context-aware welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `Hello! I'm your AI trading assistant. I can see you're currently viewing ${market.symbol} on the ${timeframe} timeframe with indicators: ${indicators.join(', ')}.\n\nCurrent price: $${market.price.toFixed(2)} (${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%)\n\nWhat would you like to analyze?`,
        timestamp: Date.now(),
        context: {
          symbol: market.symbol,
          timeframe,
          price: market.price,
          indicators
        }
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiTradingDockMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate AI response with market context
  const generateAIResponse = useCallback((userQuery: string): ChatMessage => {
    const isRSIOverBought = marketData.sentiment > 0.7;
    const isRSIOverSold = marketData.sentiment < 0.3;
    const isHighVolatility = marketData.volatility > 0.6;
    
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 50;
    const reasoning: string[] = [];

    // Context-aware analysis
    if (market.changePercent > 0 && marketData.momentum > 0.6) {
      signal = 'bullish';
      confidence += 25;
      reasoning.push(`${market.symbol} showing bullish momentum with ${market.changePercent.toFixed(2)}% gains`);
    } else if (market.changePercent < 0 && marketData.momentum < 0.4) {
      signal = 'bearish';
      confidence += 20;
      reasoning.push(`${market.symbol} under bearish pressure with ${market.changePercent.toFixed(2)}% decline`);
    }

    if (isHighVolatility) {
      confidence += 15;
      reasoning.push('High volatility indicates strong market interest');
    }

    if (indicators.includes('EMA20') && indicators.includes('EMA50')) {
      reasoning.push('EMA crossover signals should be monitored closely');
    }

    // Generate contextual response
    let content = '';
    const lowerQuery = userQuery.toLowerCase();

    if (lowerQuery.includes('candle') || lowerQuery.includes('last') || lowerQuery.includes('explain')) {
      content = `**Last Candle Analysis for ${market.symbol}:**\n\nCurrent: $${market.price.toFixed(2)} (${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%)\nTimeframe: ${timeframe}\n\n**Market Context:**\n• Sentiment: ${(marketData.sentiment * 100).toFixed(0)}%\n• Volatility: ${(marketData.volatility * 100).toFixed(0)}%\n• Volume: ${marketData.volume.toFixed(2)}x average\n\n**Signal: ${signal.toUpperCase()}** (${confidence}% confidence)\n\n${reasoning.map(r => `• ${r}`).join('\n')}`;
    } else if (lowerQuery.includes('news') || lowerQuery.includes('impact')) {
      content = `**News Impact Analysis for ${market.symbol}:**\n\nBased on current market conditions and ${timeframe} price action:\n\n• Recent volatility: ${(marketData.volatility * 100).toFixed(0)}%\n• Market sentiment appears ${marketData.sentiment > 0.5 ? 'positive' : 'negative'}\n• Volume is ${marketData.volume > 1 ? 'above' : 'below'} average\n\n**Key factors to watch:**\n• Economic indicators affecting ${market.assetClass}\n• Sector rotation patterns\n• Technical support/resistance levels`;
    } else if (lowerQuery.includes('risk') || lowerQuery.includes('reward') || lowerQuery.includes('plan')) {
      const supportLevel = market.price * 0.98;
      const resistanceLevel = market.price * 1.02;
      content = `**Trading Plan for ${market.symbol}:**\n\n**Current Setup:**\n• Entry: $${market.price.toFixed(2)}\n• Support: $${supportLevel.toFixed(2)}\n• Resistance: $${resistanceLevel.toFixed(2)}\n\n**Risk Management:**\n• Stop Loss: ${signal === 'bullish' ? `$${supportLevel.toFixed(2)}` : `$${resistanceLevel.toFixed(2)}`}\n• Position Size: Based on 1-2% account risk\n• Take Profit: ${signal === 'bullish' ? `$${resistanceLevel.toFixed(2)}` : `$${supportLevel.toFixed(2)}`}\n\n**Timeframe:** ${timeframe} analysis suggests ${signal} bias`;
    } else {
      content = `**Market Overview for ${market.symbol}:**\n\nTrading at $${market.price.toFixed(2)} on ${timeframe} timeframe.\n\n**Current Status:**\n• Price Change: ${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%\n• Active Indicators: ${indicators.join(', ')}\n• Market Bias: ${signal.toUpperCase()}\n\n**Recommendation:** ${signal === 'bullish' ? 'Consider long positions on pullbacks' : signal === 'bearish' ? 'Consider profit taking or defensive positioning' : 'Wait for clearer directional signals'}`;
    }

    return {
      id: Date.now().toString(),
      type: 'assistant',
      content,
      timestamp: Date.now(),
      context: {
        symbol: market.symbol,
        timeframe,
        price: market.price,
        indicators
      },
      analysis: {
        signal,
        confidence,
        reasoning
      }
    };
  }, [market, marketData, timeframe, indicators]);

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputMessage;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: Date.now(),
      context: {
        symbol: market.symbol,
        timeframe,
        price: market.price,
        indicators
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAnalyzing(true);

    // Simulate AI analysis delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText);
      setMessages(prev => [...prev, aiResponse]);
      setIsAnalyzing(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (actionId: string) => {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
      handleSendMessage(action.label);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('aiTradingDockMessages');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Bot className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
        isExpanded ? 'w-96 h-96' : 'w-80 h-80'
      }`}>
      <Card className="h-full flex flex-col bg-card/95 backdrop-blur-lg border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Trading Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {market.symbol} • {timeframe} • Live Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isExpanded ? 'Minimize' : 'Expand'} AI assistant</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Minimize to dock</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Quick Actions */}
        {isExpanded && (
          <div className="p-3 border-b border-border">
            <div className="text-xs text-muted-foreground mb-2">Quick Analysis:</div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickAction(action.id)}
                      className="h-8 text-xs justify-start"
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-xs ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {message.content}
                  </div>
                  
                  {message.analysis && isExpanded && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
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
                        {message.analysis.confidence}%
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1 opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
            
            {isAnalyzing && (
              <div className="flex gap-3 justify-start">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask about ${market.symbol}... (e.g., "What's the trend?")`}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAnalyzing}
              className="text-xs"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isAnalyzing}
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message (Enter)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {isExpanded && (
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                Context: {market.symbol} • {timeframe} • {indicators.length} indicators
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearHistory}
                    className="h-6 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear conversation history</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};