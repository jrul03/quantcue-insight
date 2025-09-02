import { useEffect } from 'react';
import { AITradingAssistant } from './AITradingAssistant';
import { AILiveAnalyzerHUD } from './ai/AILiveAnalyzerHUD';

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
  onToggleAnalyzer
}: FloatingPanelManagerProps) => {
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + C for Chat
      if (e.shiftKey && e.key === 'C') {
        e.preventDefault();
        onToggleChat();
      }
      // Shift + A for Analyzer
      if (e.shiftKey && e.key === 'A') {
        e.preventDefault();
        onToggleAnalyzer();
      }
      // Esc to minimize if focused on panel
      if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.closest('[data-floating-panel="ai-chat"]') ||
          activeElement.closest('[data-floating-panel="ai-analyzer"]')
        )) {
          // Focus will be handled by the panels themselves
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleChat, onToggleAnalyzer]);

  return (
    <>
      {showChat && (
        <AITradingAssistant isVisible={showChat} />
      )}
      
      {showAnalyzer && (
        <AILiveAnalyzerHUD 
          market={market}
          marketData={marketData}
          isVisible={showAnalyzer}
          onToggle={onToggleAnalyzer}
        />
      )}
    </>
  );
};