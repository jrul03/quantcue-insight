import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  Zap,
  Clock,
  Target,
  AlertCircle
} from "lucide-react";

interface Signal {
  id: string;
  strategyId: string;
  strategyName: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  confidence: number;
  reason: string;
  timestamp: number;
}

interface LiveSignalsToasterProps {
  signals: Signal[];
  onDismiss: (signalId: string) => void;
  onClearAll: () => void;
}

export const LiveSignalsToaster = ({ signals, onDismiss, onClearAll }: LiveSignalsToasterProps) => {
  const [visibleSignals, setVisibleSignals] = useState<Signal[]>([]);

  useEffect(() => {
    // Show only the latest 3 signals
    setVisibleSignals(signals.slice(-3));
  }, [signals]);

  // Auto-dismiss signals after 10 seconds
  useEffect(() => {
    const timers = visibleSignals.map((signal) => {
      const timeLeft = 10000 - (Date.now() - signal.timestamp);
      if (timeLeft > 0) {
        return setTimeout(() => {
          onDismiss(signal.id);
        }, timeLeft);
      }
      return null;
    });

    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
    };
  }, [visibleSignals, onDismiss]);

  if (visibleSignals.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-3 max-w-sm">
      {/* Clear All Button */}
      {visibleSignals.length > 1 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-slate-200 h-7"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Signal Cards */}
      {visibleSignals.map((signal) => (
        <SignalCard
          key={signal.id}
          signal={signal}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

interface SignalCardProps {
  signal: Signal;
  onDismiss: (signalId: string) => void;
}

const SignalCard = ({ signal, onDismiss }: SignalCardProps) => {
  const [progress, setProgress] = useState(100);

  // Countdown timer
  useEffect(() => {
    const duration = 10000; // 10 seconds
    const elapsed = Date.now() - signal.timestamp;
    const remaining = Math.max(0, duration - elapsed);
    const initialProgress = (remaining / duration) * 100;
    
    setProgress(initialProgress);

    const interval = setInterval(() => {
      const currentElapsed = Date.now() - signal.timestamp;
      const currentRemaining = Math.max(0, duration - currentElapsed);
      const currentProgress = (currentRemaining / duration) * 100;
      
      setProgress(currentProgress);
      
      if (currentProgress <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [signal.timestamp]);

  const isBuy = signal.type === 'BUY';
  const confidenceColor = signal.confidence >= 0.8 ? 'text-green-400' : 
                         signal.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Card className={`p-4 bg-slate-950/95 backdrop-blur-xl shadow-2xl border-l-4 ${
      isBuy ? 'border-l-green-500' : 'border-l-red-500'
    } border-slate-800/50 animate-in slide-in-from-right-5`}>
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/50 overflow-hidden rounded-t-lg">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${
            isBuy ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {isBuy ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${
                  isBuy ? 'text-green-400' : 'text-red-400'
                }`}>
                  {signal.type} SIGNAL
                </span>
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                  {signal.symbol}
                </Badge>
              </div>
              <div className="text-xs text-slate-400">
                {signal.strategyName}
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(signal.id)}
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Price & Confidence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Entry Price</div>
            <div className="font-mono font-semibold text-slate-200">
              ${signal.price.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Confidence</div>
            <div className={`font-mono font-semibold ${confidenceColor}`}>
              {(signal.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              {signal.reason}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className={`flex-1 h-8 text-xs ${
              isBuy 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Target className="w-3 h-3 mr-1" />
            Execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Zap className="w-3 h-3 mr-1" />
            Alert
          </Button>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {new Date(signal.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </Card>
  );
};