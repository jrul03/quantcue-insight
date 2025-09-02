import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TrendingUp, BarChart3, Activity, Waves, Target } from 'lucide-react';
export interface IndicatorState {
  ema: boolean;
  rsi: boolean;
  macd: boolean;
  bollinger: boolean;
  vwap: boolean;
}
interface IndicatorTogglesProps {
  indicators: IndicatorState;
  onToggle: (indicator: keyof IndicatorState) => void;
  className?: string;
}
const indicatorConfig = {
  ema: {
    label: 'EMA Cloud',
    icon: TrendingUp,
    tooltip: 'Exponential Moving Averages (50/200) - trend direction indicator, bullish when 50 > 200',
    color: 'from-blue-500 to-purple-500'
  },
  rsi: {
    label: 'RSI',
    icon: Activity,
    tooltip: 'Relative Strength Index - momentum oscillator, oversold <30, overbought >70',
    color: 'from-orange-500 to-red-500'
  },
  macd: {
    label: 'MACD',
    icon: BarChart3,
    tooltip: 'Moving Average Convergence Divergence - trend and momentum indicator',
    color: 'from-green-500 to-teal-500'
  },
  bollinger: {
    label: 'Bollinger',
    icon: Waves,
    tooltip: 'Bollinger Bands - volatility indicator, price typically bounces between bands',
    color: 'from-pink-500 to-rose-500'
  },
  vwap: {
    label: 'VWAP',
    icon: Target,
    tooltip: 'Volume Weighted Average Price - fair value benchmark, institutional reference line',
    color: 'from-cyan-500 to-blue-500'
  }
};
export const IndicatorToggles = ({
  indicators,
  onToggle,
  className
}: IndicatorTogglesProps) => {
  return <TooltipProvider>
      <div className={cn("flex items-center gap-2 p-3 bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm", className)}>
        <div className="text-xs text-slate-400 font-medium mr-2">INDICATORS</div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(indicatorConfig).map(([key, config]) => {
          const isActive = indicators[key as keyof IndicatorState];
          const IconComponent = config.icon;
          return <Tooltip key={key} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onToggle(key as keyof IndicatorState)} className={cn("relative overflow-hidden transition-all duration-300 group", "border-slate-600 text-slate-300 hover:text-white", "h-8 px-3 text-xs font-medium", isActive && ["border-transparent text-white", "shadow-lg backdrop-blur-sm", "before:absolute before:inset-0 before:bg-gradient-to-r", `before:${config.color} before:opacity-20`, "after:absolute after:inset-0 after:bg-gradient-to-r", `after:${config.color} after:opacity-10`, "after:animate-pulse"])}>
                    <div className="relative z-10 flex items-center gap-1.5">
                      <IconComponent className={cn("w-3.5 h-3.5 transition-all duration-300", isActive && "animate-pulse")} />
                      <span>{config.label}</span>
                      {isActive && <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r animate-pulse", config.color)} />}
                    </div>
                  </Button>
                </TooltipTrigger>
                
                <TooltipContent side="bottom" className="max-w-xs bg-slate-800 border-slate-600 text-slate-200 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-3 h-3" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <p>{config.tooltip}</p>
                </TooltipContent>
              </Tooltip>;
        })}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600 mx-0">
            {Object.values(indicators).filter(Boolean).length} active
          </Badge>
        </div>
      </div>
    </TooltipProvider>;
};