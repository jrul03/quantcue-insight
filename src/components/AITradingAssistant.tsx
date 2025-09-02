import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Send, Bot, User, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  analysis?: {
    signal: "bullish" | "bearish" | "neutral";
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
  trend: "up" | "down" | "sideways";
}

type AITradingAssistantProps = {
  /** Controls visibility of the floating panel */
  isVisible?: boolean;
  /** REQUIRED: the currently selected symbol (e.g., AAPL, NVDA, BTC-USD) */
  symbol: string;
  /** Optional: current timeframe for context (e.g., "1m", "5m", "1h") */
  timeframe?: string;
  /** Optional: live context to seed/override the mock analysis */
  context?: {
    price?: number;
    change?: number;
    changePercent?: number;
    rsi?: number;
    emaFast?: number;
    emaSlow?: number;
    volume?: number;
    trend?: "up" | "down" | "sideways";
  };
};

export const AITradingAssistant = ({
  isVisible = true,
  symbol,
  timeframe = "5m",
  context,
}: AITradingAssistantProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Ensure we always reference the latest symbol/timeframe in prompts
  const aiContext = useMemo(
    () => ({
      symbol,
      timeframe,
      price: context?.price,
      change: context?.change,
      changePercent: context?.changePercent,
      rsi: context?.rsi,
      emaFast: context?.emaFast,
      emaSlow: context?.emaSlow,
      volume: context?.volume,
      trend: context?.trend,
    }),
    [
      symbol,
      timeframe,
      context?.price,
      context?.change,
      context?.changePercent,
      context?.rsi,
      context?.emaFast,
      context?.emaSlow,
      context?.volume,
      context?.trend,
    ]
  );

  // Seed greeting whenever the symbol changes (prevents “SPY” carryover)
  useEffect(() => {
    setMessages([
      {
        id: `${Date.now()}`,
        type: "assistant",
        content: `Hello! I’m your AI trading assistant. I’m tracking **${symbol}** on the **${timeframe}** timeframe. Ask me about market conditions, RSI, EMAs, support/resistance, or a trade plan.`,
        timestamp: Date.now(),
      },
    ]);
  }, [symbol, timeframe]);

  // Use provided context first; otherwise simulate a plausible snapshot
  const getCurrentMarketData = (): MarketData => {
    const price =
      aiContext.price ??
      100 + (Math.random() - 0.5) * 2; // harmless fallback if no context
    const emaFast = aiContext.emaFast ?? price * (0.996 + Math.random() * 0.008);
    const emaSlow = aiContext.emaSlow ?? price * (0.993 + Math.random() * 0.01);
    const rsi =
      aiContext.rsi ??
      Math.max(5, Math.min(95, 50 + (Math.random() - 0.5) * 20));
    const volume = aiContext.volume ?? 1_000_000 + Math.random() * 500_000;

    let trend: MarketData["trend"] =
      aiContext.trend ??
      (emaFast > emaSlow ? "up" : emaFast < emaSlow ? "down" : "sideways");

    return {
      price,
      rsi,
      emaFast,
      emaSlow,
      volume,
      trend,
    };
  };

  const analyzeMarket = (
    marketData: MarketData,
    query: string
  ): ChatMessage => {
    const isRSIOverBought = marketData.rsi > 70;
    const isRSIOverSold = marketData.rsi < 30;
    const isBullishCrossover = marketData.emaFast > marketData.emaSlow;

    let signal: "bullish" | "bearish" | "neutral" = "neutral";
    let confidence = 50;
    const reasoning: string[] = [];

    if (isBullishCrossover && !isRSIOverBought) {
      signal = "bullish";
      confidence += 25;
      reasoning.push(
        "EMA fast (short) above EMA slow (long) indicates positive momentum"
      );
      if (!isRSIOverBought)
        reasoning.push("RSI not overbought — room for continuation");
    } else if (!isBullishCrossover && isRSIOverSold) {
      signal = "bearish";
      confidence += 20;
      reasoning.push("EMA fast below EMA slow suggests negative momentum");
    }

    if (isRSIOverBought) {
      signal = "bearish";
      confidence += 15;
      reasoning.push("RSI > 70 (overbought) — risk of pullback");
    } else if (isRSIOverSold) {
      signal = "bullish";
      confidence += 20;
      reasoning.push("RSI < 30 (oversold) — bounce likely");
    }

    if (marketData.volume > (aiContext.volume ?? 1_200_000)) {
      confidence += 10;
      reasoning.push("Elevated volume confirms current move");
    }

    // Build content tailored to the question
    const rounded = (n: number, d = 2) => n.toFixed(d);
    const dirEmoji =
      signal === "bullish" ? "🟢" : signal === "bearish" ? "🔴" : "🟡";

    let content = "";
    const lc = query.toLowerCase();

    if (lc.includes("buy") || lc.includes("sell")) {
      content = `**${symbol} — Trade Read** (${timeframe})\n\n**Signal:** ${dirEmoji} ${signal.toUpperCase()}  \n**Confidence:** ${confidence}%\n\n**Snapshot:**\n• Price: $${rounded(marketData.price)}\n• RSI: ${rounded(
        marketData.rsi,
        1
      )}\n• EMA (fast): $${rounded(marketData.emaFast)}\n• EMA (slow): $${rounded(
        marketData.emaSlow
      )}\n• Volume: ${Math.round(marketData.volume).toLocaleString()}\n\n**Why:**\n${reasoning
        .map((r) => `• ${r}`)
        .join("\n")}\n\n**Plan idea:** ${
        signal === "bullish"
          ? "Buy pullbacks into fast EMA; invalidate if price closes below slow EMA."
          : signal === "bearish"
          ? "Sell rallies into fast EMA; invalidate if price closes above slow EMA."
          : "Wait for a crossover or RSI extreme to confirm direction."
      }`;
    } else if (lc.includes("rsi")) {
      content = `**${symbol} — RSI Check** (${timeframe})\n\nRSI: ${rounded(
        marketData.rsi,
        1
      )}\n${
        isRSIOverBought
          ? "Overbought (>70): consider trimming or waiting for a dip."
          : isRSIOverSold
          ? "Oversold (<30): watch for reversal cues."
          : "Neutral (30–70): monitor for momentum shifts."
      }`;
    } else {
      content = `**${symbol} — Market Overview** (${timeframe})\n\nPrice: $${rounded(
        marketData.price
      )}  \nBias: ${signal} (${confidence}%)\n\n**Levels (approx):**\n• Support: $${rounded(
        marketData.price * 0.98
      )}\n• Resistance: $${rounded(
        marketData.price * 1.02
      )}\n\n**Note:** ${reasoning[0] ?? "No strong single driver right now."}`;
    }

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: Date.now(),
      analysis: { signal, confidence, reasoning },
    };
  };

  const handleSendMessage = async () => {
    const q = inputMessage.trim();
    if (!q) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: q,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsAnalyzing(true);

    setTimeout(() => {
      const marketData = getCurrentMarketData();
      const aiResponse = analyzeMarket(marketData, q);
      setMessages((prev) => [...prev, aiResponse]);
      setIsAnalyzing(false);
    }, 900);
  };

  // Always scroll to bottom when messages change
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
                className={`flex gap-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "assistant" && (
                  <div className="w-7 h-7 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
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
                          className={
                            message.analysis.signal === "bullish"
                              ? "border-bullish text-bullish"
                              : message.analysis.signal === "bearish"
                              ? "border-bearish text-bearish"
                              : "border-muted-foreground text-muted-foreground"
                          }
                        >
                          {message.analysis.signal === "bullish" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : message.analysis.signal === "bearish" ? (
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

                {message.type === "user" && (
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
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Analyzing {symbol}…
                    </span>
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
              placeholder={`Ask about ${symbol}: RSI, EMA cross, plan…`}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isAnalyzing}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAnalyzing}
              size="icon"
              variant="outline"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
};