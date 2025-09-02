import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Square, 
  Circle,
  Triangle,
  Ruler,
  Target,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Crosshair,
  ArrowUpRight,
  Move3D
} from "lucide-react";

interface ChartToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
}

export const ChartToolbar = ({ 
  selectedTool, 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom,
  zoomLevel 
}: ChartToolbarProps) => {
  const [activeCategory, setActiveCategory] = useState<'select' | 'drawing' | 'analysis'>('select');

  const toolCategories = {
    select: [
      { id: 'select', icon: MousePointer2, label: 'Select' },
      { id: 'crosshair', icon: Crosshair, label: 'Crosshair' },
      { id: 'pan', icon: Move3D, label: 'Pan' },
    ],
    drawing: [
      { id: 'trendline', icon: TrendingUp, label: 'Trend Line' },
      { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
      { id: 'rectangle', icon: Square, label: 'Rectangle' },
      { id: 'circle', icon: Circle, label: 'Circle' },
      { id: 'triangle', icon: Triangle, label: 'Triangle' },
      { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
    ],
    analysis: [
      { id: 'fibonacci', icon: Ruler, label: 'Fibonacci' },
      { id: 'support', icon: TrendingUp, label: 'Support/Resistance' },
      { id: 'target', icon: Target, label: 'Price Target' },
    ]
  };

  return (
    <div className="w-16 bg-gradient-to-b from-slate-900/95 to-slate-800/95 border-r border-slate-700/50 backdrop-blur-sm flex flex-col">
      {/* Zoom Controls */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="space-y-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onZoomIn}
            className="w-full h-8 text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onZoomOut}
            className="w-full h-8 text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetZoom}
            className="w-full h-8 text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Badge variant="secondary" className="w-full text-xs justify-center bg-slate-800/50 text-slate-400">
            {Math.round(zoomLevel * 100)}%
          </Badge>
        </div>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Category Buttons */}
      <div className="p-2 space-y-1">
        {(['select', 'drawing', 'analysis'] as const).map((category) => (
          <Button
            key={category}
            size="sm"
            variant={activeCategory === category ? 'default' : 'ghost'}
            onClick={() => setActiveCategory(category)}
            className={`w-full h-8 text-xs ${
              activeCategory === category 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Tools */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {toolCategories[activeCategory].map((tool) => {
          const Icon = tool.icon;
          const isActive = selectedTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              size="sm"
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => onToolSelect(tool.id)}
              className={`w-full h-8 transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-slate-700/50">
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-8 text-slate-300 hover:text-white hover:bg-slate-700/50"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};