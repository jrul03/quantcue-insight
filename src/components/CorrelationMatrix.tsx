import { Card } from "@/components/ui/card";

interface CorrelationMatrixProps {
  baseSymbol: string;
  assetClass: string;
}

export const CorrelationMatrix = ({ baseSymbol }: CorrelationMatrixProps) => {
  const correlations = [
    { symbol: 'SPY', correlation: 0.85, color: 'text-green-400' },
    { symbol: 'QQQ', correlation: 0.72, color: 'text-yellow-400' },
    { symbol: 'IWM', correlation: 0.45, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300">Correlation Matrix</h3>
      {correlations.map(corr => (
        <Card key={corr.symbol} className="p-3 bg-slate-900/50 border-slate-700/50">
          <div className="flex justify-between items-center">
            <span className="font-mono">{corr.symbol}</span>
            <span className={`font-mono ${corr.color}`}>{corr.correlation}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};