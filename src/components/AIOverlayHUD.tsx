import { Brain } from "lucide-react";

interface AIOverlayHUDProps {
  market: any;
  marketData: any;
}

export const AIOverlayHUD = ({ market }: AIOverlayHUDProps) => {
  return (
    <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-lg rounded-lg p-3 border border-blue-500/30 pointer-events-none shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium">AI Analysis</span>
      </div>
      <div className="text-xs text-slate-300">
        Analyzing {market.symbol}... Pattern recognition active.
      </div>
    </div>
  );
};
