import { useEffect } from "react";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { AITradingAssistant } from "./AITradingAssistant";
import { AILiveAnalyzerHUD } from "./ai/AILiveAnalyzerHUD";

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

interface FloatingPanelManagerProps {
  market: Market;
  marketData: MarketData;
  showChat: boolean;
  showAnalyzer: boolean;
  onToggleChat: () => void;
  onToggleAnalyzer: () => void;
}

export const FloatingPanelManager = ({
  market,
  marketData,
  showChat,
  showAnalyzer,
  onToggleChat,
  onToggleAnalyzer,
}: FloatingPanelManagerProps) => {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + C for Chat
      if (e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        onToggleChat();
      }
      // Shift + A for Analyzer
      if (e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        onToggleAnalyzer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggleChat, onToggleAnalyzer]);

  return (
    <>
      {showChat && (
        <FloatingPanel
          storageKey="ai-chat"
          title="AI Chat"
          defaultPos={
            typeof window !== "undefined"
              ? { x: window.innerWidth - 420, y: window.innerHeight - 560 }
              : { x: 24, y: 24 }
          }
        >
          {/* Make sure your AITradingAssistant accepts these props (symbol, timeframe, context). */}
          <AITradingAssistant
            isVisible
            symbol={market.symbol}
            timeframe="5m"
            context={{
              price: market.price,
              change: market.change,
              changePercent: market.changePercent,
            }}
          />
        </FloatingPanel>
      )}

      {showAnalyzer && (
        <FloatingPanel
          storageKey="ai-analyzer"
          title="AI Analyzer"
          defaultPos={
            typeof window !== "undefined"
              ? { x: 24, y: window.innerHeight - 280 }
              : { x: 24, y: 24 }
          }
        >
          <AILiveAnalyzerHUD
            market={market}
            marketData={marketData}
            isVisible={showAnalyzer}
            onToggle={onToggleAnalyzer}
          />
        </FloatingPanel>
      )}
    </>
  );
};