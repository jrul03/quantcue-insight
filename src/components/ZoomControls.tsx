import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  className?: string;
}

export const ZoomControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  zoomLevel,
  className 
}: ZoomControlsProps) => {
  return (
    <div className={cn(
      "absolute top-4 right-4 z-30 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50 p-2 shadow-lg",
      className
    )}>
      <Button
        size="sm"
        variant="ghost"
        onClick={onZoomIn}
        className="w-10 h-10 p-0 hover:bg-slate-700/60 hover:text-green-400 transition-all duration-200"
        disabled={zoomLevel >= 200}
      >
        <Plus className="w-4 h-4" />
      </Button>
      
      <div className="text-xs text-center font-mono text-slate-400 py-1">
        {zoomLevel}%
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onZoomOut}
        className="w-10 h-10 p-0 hover:bg-slate-700/60 hover:text-red-400 transition-all duration-200"
        disabled={zoomLevel <= 25}
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <div className="w-full h-px bg-slate-700/50 my-1" />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onReset}
        className="w-10 h-10 p-0 hover:bg-slate-700/60 hover:text-blue-400 transition-all duration-200"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
};