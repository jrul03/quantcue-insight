import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Square, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Target,
  Activity
} from "lucide-react";

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  avgWin: number;
  avgLoss: number;
}

const mockResults: BacktestResult = {
  totalTrades: 147,
  winRate: 68.3,
  profitFactor: 1.84,
  sharpeRatio: 1.23,
  maxDrawdown: -8.7,
  totalReturn: 24.6,
  avgWin: 2.1,
  avgLoss: -1.3
};

export const Backtester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [strategy, setStrategy] = useState({
    emaFast: 20,
    emaSlow: 50,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    stopLoss: 2.0,
    takeProfit: 4.0
  });

  const handleRunBacktest = () => {
    setIsRunning(true);
    // Simulate backtest running
    setTimeout(() => {
      setIsRunning(false);
    }, 3000);
  };

  const StatCard = ({ 
    icon, 
    label, 
    value, 
    suffix = '', 
    trend = 'neutral' 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    value: number; 
    suffix?: string;
    trend?: 'positive' | 'negative' | 'neutral';
  }) => {
    const getTrendColor = () => {
      switch (trend) {
        case 'positive': return 'text-bullish';
        case 'negative': return 'text-bearish';
        default: return 'text-foreground';
      }
    };

    return (
      <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className={`font-mono font-bold ${getTrendColor()}`}>
          {value.toFixed(1)}{suffix}
        </div>
      </div>
    );
  };

  return (
    <Card className="trading-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4" />
          Strategy Backtester
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Strategy Parameters */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Strategy Parameters</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="ema-fast" className="text-xs">EMA Fast</Label>
              <Input
                id="ema-fast"
                type="number"
                value={strategy.emaFast}
                onChange={(e) => setStrategy(prev => ({ ...prev, emaFast: parseInt(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="ema-slow" className="text-xs">EMA Slow</Label>
              <Input
                id="ema-slow"
                type="number"
                value={strategy.emaSlow}
                onChange={(e) => setStrategy(prev => ({ ...prev, emaSlow: parseInt(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="rsi-period" className="text-xs">RSI Period</Label>
              <Input
                id="rsi-period"
                type="number"
                value={strategy.rsiPeriod}
                onChange={(e) => setStrategy(prev => ({ ...prev, rsiPeriod: parseInt(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="rsi-oversold" className="text-xs">Oversold</Label>
              <Input
                id="rsi-oversold"
                type="number"
                value={strategy.rsiOversold}
                onChange={(e) => setStrategy(prev => ({ ...prev, rsiOversold: parseInt(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="rsi-overbought" className="text-xs">Overbought</Label>
              <Input
                id="rsi-overbought"
                type="number"
                value={strategy.rsiOverbought}
                onChange={(e) => setStrategy(prev => ({ ...prev, rsiOverbought: parseInt(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="stop-loss" className="text-xs">Stop Loss (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                step="0.1"
                value={strategy.stopLoss}
                onChange={(e) => setStrategy(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="take-profit" className="text-xs">Take Profit (%)</Label>
              <Input
                id="take-profit"
                type="number"
                step="0.1"
                value={strategy.takeProfit}
                onChange={(e) => setStrategy(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) }))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Run Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="flex-1"
            size="sm"
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Results</h4>
            <Badge variant="secondary" className="text-xs">
              1Y • 252 Days
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="space-y-2">
            <StatCard
              icon={<DollarSign className="w-4 h-4 text-neon-green" />}
              label="Total Return"
              value={mockResults.totalReturn}
              suffix="%"
              trend="positive"
            />
            
            <StatCard
              icon={<Percent className="w-4 h-4 text-bullish" />}
              label="Win Rate"
              value={mockResults.winRate}
              suffix="%"
              trend="positive"
            />
            
            <StatCard
              icon={<Target className="w-4 h-4 text-primary" />}
              label="Profit Factor"
              value={mockResults.profitFactor}
              trend="positive"
            />
            
            <StatCard
              icon={<Activity className="w-4 h-4 text-neon-purple" />}
              label="Sharpe Ratio"
              value={mockResults.sharpeRatio}
              trend="positive"
            />
            
            <StatCard
              icon={<TrendingDown className="w-4 h-4 text-bearish" />}
              label="Max Drawdown"
              value={mockResults.maxDrawdown}
              suffix="%"
              trend="negative"
            />
          </div>

          {/* Trade Statistics */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-mono">{mockResults.totalTrades}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Win</span>
              <span className="font-mono text-bullish">+{mockResults.avgWin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Loss</span>
              <span className="font-mono text-bearish">{mockResults.avgLoss.toFixed(1)}%</span>
            </div>
          </div>

          {/* Mini Equity Curve */}
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Equity Curve</div>
            <div className="h-16 bg-card/50 rounded border border-border/50 p-2">
              <svg className="w-full h-full" viewBox="0 0 200 40">
                <path 
                  d="M 0,35 Q 20,32 40,28 T 80,22 T 120,18 T 160,15 T 200,12" 
                  fill="none" 
                  stroke="hsl(var(--bullish))" 
                  strokeWidth="2"
                />
                <circle cx="200" cy="12" r="2" fill="hsl(var(--bullish))" />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};