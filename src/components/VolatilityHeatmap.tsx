import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

export const VolatilityHeatmap = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-medium text-slate-300">Volatility Heatmap</h3>
      </div>
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="text-xs text-slate-400">Volatility analysis coming soon...</div>
      </Card>
    </div>
  );
};