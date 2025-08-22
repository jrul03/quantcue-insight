import { TradingChart } from "@/components/TradingChart";
import { SignalsFeed } from "@/components/SignalsFeed";
import { NewsStrip } from "@/components/NewsStrip";
import { HUDAgent } from "@/components/HUDAgent";
import { Backtester } from "@/components/Backtester";
import { IndicatorPanel } from "@/components/IndicatorPanel";
import { AITradingAssistant } from "@/components/AITradingAssistant";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">Q</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              QuantCue
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-neon-green rounded-full status-online"></div>
              <span className="text-muted-foreground">Live Data</span>
            </div>
            <div className="text-sm text-muted-foreground">
              SPY: <span className="text-bullish font-mono">$415.23</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground">
            Market Open • 09:30 EST
          </div>
        </div>
      </header>

      {/* News Strip */}
      <NewsStrip />

      {/* Main Trading Interface */}
      <div className="flex h-[calc(100vh-112px)]">
        {/* Left Sidebar - Indicators & Controls */}
        <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm p-4 space-y-4 overflow-y-auto">
          <IndicatorPanel />
          <Backtester />
        </div>

        {/* Center - Chart Area */}
        <div className="flex-1 flex flex-col">
          <TradingChart />
        </div>

        {/* Right Sidebar - Signals & Analysis */}
        <div className="w-96 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
          <div className="h-1/2 border-b border-border">
            <SignalsFeed />
          </div>
          <div className="h-1/2">
            <AITradingAssistant />
          </div>
        </div>
      </div>

      {/* Floating HUD Agent */}
      <HUDAgent />
    </div>
  );
};

export default Index;