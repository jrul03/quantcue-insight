import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair, 
  Magnet, 
  Download 
} from "lucide-react";
import { IndicatorToggles, IndicatorState } from "./IndicatorToggles";

interface ChartToolbarProps {
  symbol: string;
  selectedTimeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '1D';
  onTimeframeChange: (timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '1D') => void;
  indicators: IndicatorState;
  onIndicatorToggle: (indicator: keyof IndicatorState) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  crosshairEnabled?: boolean;
  onCrosshairToggle?: () => void;
  magnetEnabled?: boolean;
  onMagnetToggle?: () => void;
  onDownload?: () => void;
}

export const ChartToolbar = ({
  symbol,
  selectedTimeframe,
  onTimeframeChange,
  indicators,
  onIndicatorToggle,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  crosshairEnabled = false,
  onCrosshairToggle,
  magnetEnabled = false,
  onMagnetToggle,
  onDownload
}: ChartToolbarProps) => {
  const getActiveIndicatorCount = () => {
    return Object.values(indicators).filter(Boolean).length;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-700/50 backdrop-blur-md">
      {/* Left Section - Symbol + Timeframe */}
      <div className="flex items-center gap-4">
        {/* Symbol Badge */}
        <Badge variant="outline" className="bg-slate-800/60 border-slate-600/50 text-slate-200 font-semibold">
          {symbol}
        </Badge>

        {/* Timeframe Pills */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-600/40">
          {(['1m', '5m', '15m', '30m', '1h', '1D'] as const).map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTimeframeChange(tf)}
              className={`text-xs font-semibold transition-all duration-200 min-w-[2.5rem] h-7 ${
                selectedTimeframe === tf 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Center Section - Indicator Chips */}
      <div className="flex items-center gap-3">
        <IndicatorToggles 
          indicators={indicators}
          onToggle={onIndicatorToggle}
          className="bg-transparent p-0 border-0"
        />
        
        {/* Active Count */}
        <Badge 
          variant="outline" 
          className={`text-xs font-medium transition-all duration-200 ${
            getActiveIndicatorCount() > 0 
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
              : 'bg-slate-800/40 border-slate-600/30 text-slate-500'
          }`}
        >
          {getActiveIndicatorCount()} Active
        </Badge>
      </div>

      {/* Right Section - Tools */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-600/40">
          <Button
            size="sm"
            variant="ghost"
            onClick={onZoomOut}
            disabled={zoomLevel <= 25}
            className="h-7 w-7 p-0 hover:bg-slate-700/60"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          
          <div className="px-2 text-xs font-mono text-slate-300 min-w-[3rem] text-center">
            {zoomLevel}%
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onZoomIn}
            disabled={zoomLevel >= 200}
            className="h-7 w-7 p-0 hover:bg-slate-700/60"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomReset}
          className="h-7 px-2 text-xs hover:bg-slate-700/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>

        {/* Chart Tools */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-600/40">
          <Button
            size="sm"
            variant={crosshairEnabled ? "default" : "ghost"}
            onClick={onCrosshairToggle}
            className="h-7 w-7 p-0 hover:bg-slate-700/60"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </Button>
          
          <Button
            size="sm"
            variant={magnetEnabled ? "default" : "ghost"}
            onClick={onMagnetToggle}
            className="h-7 w-7 p-0 hover:bg-slate-700/60"
          >
            <Magnet className="w-3.5 h-3.5" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            className="h-7 w-7 p-0 hover:bg-slate-700/60"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
