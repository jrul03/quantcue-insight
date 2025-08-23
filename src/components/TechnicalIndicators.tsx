import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, BarChart3, Activity, LineChart } from "lucide-react";

export interface IndicatorConfig {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  value?: number;
  signal?: 'bullish' | 'bearish' | 'neutral';
  description: string;
  parameters?: { [key: string]: number };
}

export interface TechnicalIndicatorsProps {
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  onUpdateIndicator: (id: string, parameters: { [key: string]: number }) => void;
}

const defaultIndicators: IndicatorConfig[] = [
  {
    id: 'ema20',
    name: 'EMA 20',
    enabled: true,
    color: 'hsl(var(--ema-fast))',
    value: 412.34,
    signal: 'bullish',
    description: 'Exponential Moving Average (20 periods)',
    parameters: { period: 20 }
  },
  {
    id: 'ema50',
    name: 'EMA 50',
    enabled: true,
    color: 'hsl(var(--ema-slow))',
    value: 408.67,
    signal: 'neutral',
    description: 'Exponential Moving Average (50 periods)',
    parameters: { period: 50 }
  },
  {
    id: 'ema200',
    name: 'EMA 200',
    enabled: false,
    color: 'hsl(var(--neon-purple))',
    value: 395.23,
    signal: 'bullish',
    description: 'Exponential Moving Average (200 periods)',
    parameters: { period: 200 }
  },
  {
    id: 'rsi',
    name: 'RSI',
    enabled: true,
    color: 'hsl(var(--indicator-rsi))',
    value: 67.5,
    signal: 'neutral',
    description: 'Relative Strength Index (14 periods)',
    parameters: { period: 14, overbought: 70, oversold: 30 }
  },
  {
    id: 'bb',
    name: 'Bollinger Bands',
    enabled: true,
    color: 'hsl(var(--neon-cyan))',
    signal: 'neutral',
    description: 'Bollinger Bands (20, 2)',
    parameters: { period: 20, stdDev: 2 }
  },
  {
    id: 'macd',
    name: 'MACD',
    enabled: false,
    color: 'hsl(var(--neon-green))',
    value: 1.23,
    signal: 'bullish',
    description: 'MACD (12, 26, 9)',
    parameters: { fast: 12, slow: 26, signal: 9 }
  },
  {
    id: 'volume',
    name: 'Volume Profile',
    enabled: true,
    color: 'hsl(var(--muted))',
    signal: 'bullish',
    description: 'Volume-based analysis',
    parameters: { lookback: 20 }
  },
  {
    id: 'stoch',
    name: 'Stochastic',
    enabled: false,
    color: 'hsl(var(--neon-orange))',
    value: 75.8,
    signal: 'bearish',
    description: 'Stochastic Oscillator (14, 3, 3)',
    parameters: { kPeriod: 14, dPeriod: 3, smooth: 3 }
  }
];

export const TechnicalIndicators = ({ 
  indicators = defaultIndicators, 
  onToggleIndicator, 
  onUpdateIndicator 
}: TechnicalIndicatorsProps) => {
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);

  const getSignalColor = (signal?: string) => {
    switch (signal) {
      case 'bullish': return 'text-bullish bg-bullish/10 border-bullish/30';
      case 'bearish': return 'text-bearish bg-bearish/10 border-bearish/30';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getIndicatorIcon = (id: string) => {
    if (id.includes('ema')) return <TrendingUp className="w-4 h-4" />;
    if (id === 'rsi' || id === 'stoch') return <Activity className="w-4 h-4" />;
    if (id === 'bb') return <BarChart3 className="w-4 h-4" />;
    if (id === 'macd') return <LineChart className="w-4 h-4" />;
    return <BarChart3 className="w-4 h-4" />;
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-semibold">Technical Indicators</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {indicators.filter(i => i.enabled).length} Active
        </Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {indicators.map((indicator, index) => (
            <div key={indicator.id}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getIndicatorIcon(indicator.id)}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{ 
                          backgroundColor: indicator.enabled ? indicator.color : 'transparent',
                          borderColor: indicator.color 
                        }}
                      />
                      <span className="font-medium text-sm">{indicator.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    {indicator.value !== undefined && (
                      <span className="font-mono text-sm text-muted-foreground">
                        {indicator.value.toFixed(2)}
                      </span>
                    )}
                    {indicator.signal && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0 ${getSignalColor(indicator.signal)}`}
                      >
                        {indicator.signal.toUpperCase()}
                      </Badge>
                    )}
                    <Switch
                      checked={indicator.enabled}
                      onCheckedChange={() => onToggleIndicator(indicator.id)}
                      className="scale-75"
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground pl-9 mt-1">
                {indicator.description}
              </div>
              
              {index < indicators.length - 1 && (
                <Separator className="mt-3 opacity-30" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 pt-3 border-t border-border/30">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trend:</span>
              <Badge variant="outline" className="text-bullish bg-bullish/10 border-bullish/30 text-xs">
                BULLISH
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Momentum:</span>
              <Badge variant="outline" className="text-muted-foreground bg-muted/10 border-muted/30 text-xs">
                NEUTRAL
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Volume:</span>
              <Badge variant="outline" className="text-bullish bg-bullish/10 border-bullish/30 text-xs">
                STRONG
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Volatility:</span>
              <Badge variant="outline" className="text-muted-foreground bg-muted/10 border-muted/30 text-xs">
                MODERATE
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};