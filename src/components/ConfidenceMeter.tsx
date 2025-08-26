import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InsightOverlay } from "./InsightsToggleBar";

interface CandleData {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  sentiment?: number;
}

interface ConfidenceFactor {
  name: string;
  score: number; // -100 to 100
  weight: number; // 0 to 1
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

interface ConfidenceMeterProps {
  candleData: CandleData[];
  overlays: InsightOverlay[];
  isLive: boolean;
  className?: string;
}

export const ConfidenceMeter = ({ candleData, overlays, isLive, className }: ConfidenceMeterProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Calculate confidence factors based on enabled overlays and current market data
  const confidenceAnalysis = useMemo(() => {
    if (candleData.length < 20) return { factors: [], confidence: 50, signal: 'neutral' as const };

    const latestCandle = candleData[candleData.length - 1];
    const previousCandle = candleData[candleData.length - 2];
    const factors: ConfidenceFactor[] = [];

    // EMA Cloud Analysis
    if (overlays.find(o => o.id === 'ema_cloud' && o.enabled)) {
      if (latestCandle.ema20 && latestCandle.ema50) {
        const emaSpread = ((latestCandle.ema20 - latestCandle.ema50) / latestCandle.ema50) * 100;
        const priceVsEMA20 = ((latestCandle.close - latestCandle.ema20) / latestCandle.ema20) * 100;
        
        let score = 0;
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let description = '';

        if (latestCandle.ema20 > latestCandle.ema50 && latestCandle.close > latestCandle.ema20) {
          score = Math.min(80, 40 + Math.abs(emaSpread) * 10 + Math.abs(priceVsEMA20) * 5);
          signal = 'bullish';
          description = `Price above rising EMA20 (${emaSpread.toFixed(1)}% spread)`;
        } else if (latestCandle.ema20 < latestCandle.ema50 && latestCandle.close < latestCandle.ema20) {
          score = Math.max(-80, -40 - Math.abs(emaSpread) * 10 - Math.abs(priceVsEMA20) * 5);
          signal = 'bearish';
          description = `Price below falling EMA20 (${Math.abs(emaSpread).toFixed(1)}% spread)`;
        } else {
          score = Math.random() * 20 - 10; // Small random noise
          description = 'EMAs showing mixed signals';
        }

        factors.push({
          name: 'EMA Cloud',
          score,
          weight: 0.3,
          signal,
          description
        });
      }
    }

    // RSI Divergence Analysis
    if (overlays.find(o => o.id === 'rsi_divergence' && o.enabled)) {
      if (latestCandle.rsi) {
        let score = 0;
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let description = '';

        if (latestCandle.rsi < 30) {
          score = 60 - latestCandle.rsi; // More oversold = higher bullish score
          signal = 'bullish';
          description = `RSI oversold at ${latestCandle.rsi.toFixed(0)} - potential bounce`;
        } else if (latestCandle.rsi > 70) {
          score = latestCandle.rsi - 70; // More overbought = higher bearish score (negative)
          score = -score;
          signal = 'bearish';
          description = `RSI overbought at ${latestCandle.rsi.toFixed(0)} - potential pullback`;
        } else {
          score = (50 - Math.abs(latestCandle.rsi - 50)) / 2; // Neutral zone
          description = `RSI neutral at ${latestCandle.rsi.toFixed(0)}`;
        }

        factors.push({
          name: 'RSI Zone',
          score,
          weight: 0.25,
          signal,
          description
        });
      }
    }

    // VWAP Analysis
    if (overlays.find(o => o.id === 'vwap' && o.enabled)) {
      // Simple VWAP approximation
      const recentCandles = candleData.slice(-20);
      const vwap = recentCandles.reduce((sum, candle) => {
        const typical = (candle.high + candle.low + candle.close) / 3;
        return sum + typical;
      }, 0) / recentCandles.length;

      const priceVsVWAP = ((latestCandle.close - vwap) / vwap) * 100;
      let score = priceVsVWAP * 10; // Scale the percentage
      score = Math.max(-60, Math.min(60, score)); // Cap at ±60

      const signal: 'bullish' | 'bearish' | 'neutral' = score > 10 ? 'bullish' : score < -10 ? 'bearish' : 'neutral';
      const description = `Price ${score > 0 ? 'above' : 'below'} VWAP by ${Math.abs(priceVsVWAP).toFixed(2)}%`;

      factors.push({
        name: 'VWAP Position',
        score,
        weight: 0.2,
        signal,
        description
      });
    }

    // Volume Profile Analysis
    if (overlays.find(o => o.id === 'volume_profile' && o.enabled)) {
      const recentVolume = candleData.slice(-10).reduce((sum, c) => sum + c.volume, 0) / 10;
      const avgVolume = candleData.slice(-50, -10).reduce((sum, c) => sum + c.volume, 0) / 40;
      
      const volumeRatio = recentVolume / avgVolume;
      let score = (volumeRatio - 1) * 30; // Scale volume ratio
      score = Math.max(-40, Math.min(40, score));

      const signal: 'bullish' | 'bearish' | 'neutral' = 
        volumeRatio > 1.5 && latestCandle.close > latestCandle.open ? 'bullish' :
        volumeRatio > 1.5 && latestCandle.close < latestCandle.open ? 'bearish' : 'neutral';

      const description = `Volume ${volumeRatio > 1 ? 'above' : 'below'} average by ${Math.abs((volumeRatio - 1) * 100).toFixed(0)}%`;

      factors.push({
        name: 'Volume Profile',
        score,
        weight: 0.15,
        signal,
        description
      });
    }

    // Bollinger Bands Analysis
    if (overlays.find(o => o.id === 'bollinger_bands' && o.enabled)) {
      const period = 20;
      if (candleData.length >= period) {
        const recentPrices = candleData.slice(-period).map(c => c.close);
        const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        const upperBand = sma + (2 * stdDev);
        const lowerBand = sma - (2 * stdDev);
        
        let score = 0;
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let description = '';

        if (latestCandle.close <= lowerBand) {
          score = 50;
          signal = 'bullish';
          description = 'Price at lower Bollinger Band - potential bounce';
        } else if (latestCandle.close >= upperBand) {
          score = -50;
          signal = 'bearish';
          description = 'Price at upper Bollinger Band - potential pullback';
        } else {
          const bandPosition = (latestCandle.close - lowerBand) / (upperBand - lowerBand);
          score = (bandPosition - 0.5) * 20; // -10 to +10 range
          description = `Price at ${(bandPosition * 100).toFixed(0)}% of Bollinger Band range`;
        }

        factors.push({
          name: 'Bollinger Bands',
          score,
          weight: 0.1,
          signal,
          description
        });
      }
    }

    // Calculate weighted confidence score
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    const confidence = totalWeight > 0 ? Math.round(50 + (weightedScore / totalWeight)) : 50;
    const finalConfidence = Math.max(0, Math.min(100, confidence));

    // Determine overall signal
    const bullishFactors = factors.filter(f => f.signal === 'bullish').length;
    const bearishFactors = factors.filter(f => f.signal === 'bearish').length;
    
    let overallSignal: 'bullish' | 'bearish' | 'neutral';
    if (finalConfidence > 65) overallSignal = 'bullish';
    else if (finalConfidence < 35) overallSignal = 'bearish';
    else overallSignal = 'neutral';

    return {
      factors,
      confidence: finalConfidence,
      signal: overallSignal
    };
  }, [candleData, overlays]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (!isLive) return null;

  const { confidence, signal, factors } = confidenceAnalysis;
  
  // Color based on confidence score
  const getColor = (score: number) => {
    if (score >= 65) return { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' };
    if (score <= 35) return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' };
    return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' };
  };

  const colors = getColor(confidence);
  const strokeDasharray = `${(confidence / 100) * 283} 283`; // 283 is circumference of r=45 circle

  const signalLabel = signal === 'bullish' ? 'Bullish' : signal === 'bearish' ? 'Bearish' : 'Neutral';

  return (
    <>
      <div 
        className={cn(
          "absolute top-4 right-4 z-20 transition-all duration-300",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Card className={cn(
          "p-3 bg-slate-900/95 backdrop-blur-sm border shadow-lg",
          colors.bg,
          colors.border
        )}>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              {/* Background circle */}
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700/30"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className={cn(colors.text, "transition-all duration-500 ease-out")}
                />
              </svg>
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-xs font-bold", colors.text)}>
                  {confidence}
                </span>
              </div>
            </div>
            
            <div>
              <div className={cn("text-sm font-semibold", colors.text)}>
                {signalLabel}
              </div>
              <div className="text-xs text-slate-400">
                {confidence}% confidence
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tooltip */}
      {showTooltip && factors.length > 0 && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: mousePosition.x + 10, 
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <Card className="p-3 bg-slate-900/95 border-slate-700/50 backdrop-blur-sm shadow-xl max-w-sm">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1">
                Contributing Factors
              </div>
              {factors.map((factor, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    factor.signal === 'bullish' ? 'bg-green-400' :
                    factor.signal === 'bearish' ? 'bg-red-400' : 'bg-slate-400'
                  )} />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-300">
                      {factor.name}
                    </div>
                    <div className="text-xs text-slate-400 leading-tight">
                      {factor.description}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-mono",
                    factor.signal === 'bullish' ? 'text-green-400' :
                    factor.signal === 'bearish' ? 'text-red-400' : 'text-slate-400'
                  )}>
                    {factor.score > 0 ? '+' : ''}{factor.score.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};