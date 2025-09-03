import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InsightOverlay {
  id: string;
  name: string;
  shortName: string;
  enabled: boolean;
  category: 'core' | 'advanced';
}

interface InsightsToggleBarProps {
  overlays: InsightOverlay[];
  onToggle: (id: string) => void;
}

export const InsightsToggleBar = ({ overlays, onToggle }: InsightsToggleBarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const coreOverlays = overlays.filter(overlay => overlay.category === 'core');
  const advancedOverlays = overlays.filter(overlay => overlay.category === 'advanced');
  const visibleOverlays = showAdvanced ? overlays : coreOverlays;
  const hiddenCount = advancedOverlays.length;

  return (
    <div className="h-12 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400 font-medium">Insights:</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-slate-500 cursor-help">What's this?</span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs max-w-[220px]">Toggle overlays like EMA Cloud, VWAP, Volume Profile, and patterns on the chart.</div>
          </TooltipContent>
        </Tooltip>
        
        <div className="flex items-center gap-2 flex-wrap">
          {visibleOverlays.map((overlay) => (
            <button
              key={overlay.id}
              onClick={() => onToggle(overlay.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                "hover:scale-105 active:scale-95",
                overlay.enabled 
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/10" 
                  : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600/50"
              )}
            >
              {overlay.shortName}
            </button>
          ))}
          
          {!showAdvanced && hiddenCount > 0 && (
            <button
              onClick={() => setShowAdvanced(true)}
              className="px-2 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-1"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>{hiddenCount}</span>
            </button>
          )}
          
          {showAdvanced && (
            <button
              onClick={() => setShowAdvanced(false)}
              className="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
            >
              Less
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-500">
          {overlays.filter(o => o.enabled).length} of {overlays.length} active
        </div>
      </div>
    </div>
  );
};
