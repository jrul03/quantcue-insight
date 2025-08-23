import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  TrendingUp, 
  Minus,
  Plus,
  Square,
  Triangle,
  Type,
  Trash2,
  RotateCcw
} from "lucide-react";

interface DrawingToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
}

export const DrawingToolbar = ({ activeTool, onToolSelect }: DrawingToolbarProps) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select', category: 'basic' },
    { id: 'trendline', icon: TrendingUp, label: 'Trend Line', category: 'lines' },
    { id: 'support', icon: Minus, label: 'Support', category: 'lines' },
    { id: 'resistance', icon: Minus, label: 'Resistance', category: 'lines' },
    { id: 'fibonacci', icon: Triangle, label: 'Fibonacci', category: 'advanced' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', category: 'shapes' },
  ];

  const categories = [
    { id: 'basic', label: 'Basic' },
    { id: 'lines', label: 'Lines' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Drawing Tools</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              size="sm"
              variant={activeTool === tool.id ? "default" : "ghost"}
              onClick={() => onToolSelect(tool.id)}
              className="flex flex-col gap-1 h-16 text-xs"
            >
              <Icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </Button>
          );
        })}
      </div>

      <Separator className="bg-slate-700" />

      {/* Pattern Recognition */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-400">Pattern Recognition</h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Head & Shoulders</span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Double Top</span>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Bull Flag</span>
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Drawing Settings */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-400">Settings</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Line Color</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-blue-400 rounded border-2 border-blue-400 cursor-pointer"></div>
              <div className="w-4 h-4 bg-green-400 rounded border border-slate-600 cursor-pointer"></div>
              <div className="w-4 h-4 bg-red-400 rounded border border-slate-600 cursor-pointer"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Line Width</span>
            <div className="flex gap-1">
              <div className="w-4 h-1 bg-slate-500 rounded cursor-pointer"></div>
              <div className="w-4 h-1.5 bg-blue-400 rounded cursor-pointer"></div>
              <div className="w-4 h-2 bg-slate-500 rounded cursor-pointer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};