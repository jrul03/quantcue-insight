import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MousePointer2,
  TrendingUp,
  Minus,
  Circle,
  Square,
  Triangle,
  PenTool,
  Ruler,
  Move,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingTool {
  id: string;
  name: string;
  icon: any;
  category: 'select' | 'lines' | 'shapes';
}

interface FloatingDrawingToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  className?: string;
}

const tools: DrawingTool[] = [
  { id: 'select', name: 'Select', icon: MousePointer2, category: 'select' },
  { id: 'trendline', name: 'Trend Line', icon: TrendingUp, category: 'lines' },
  { id: 'horizontal', name: 'Horizontal Line', icon: Minus, category: 'lines' },
  { id: 'fibonacci', name: 'Fibonacci', icon: Ruler, category: 'lines' },
  { id: 'rectangle', name: 'Rectangle', icon: Square, category: 'shapes' },
  { id: 'circle', name: 'Circle', icon: Circle, category: 'shapes' },
  { id: 'brush', name: 'Free Draw', icon: PenTool, category: 'shapes' },
];

export const FloatingDrawingToolbar = ({ 
  activeTool, 
  onToolSelect, 
  className 
}: FloatingDrawingToolbarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "absolute left-4 top-1/2 -translate-y-1/2 z-20 transition-all duration-300",
      isCollapsed ? "w-12" : "w-14",
      className
    )}>
      <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
        {/* Collapse Toggle */}
        <div className="flex items-center justify-between p-2 border-b border-slate-700/50 bg-slate-800/50">
          {!isCollapsed && (
            <span className="text-xs font-medium text-slate-300">Tools</span>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-6 h-6 p-0 text-slate-400 hover:text-white"
          >
            {isCollapsed ? 
              <ChevronRight className="w-3 h-3" /> : 
              <ChevronLeft className="w-3 h-3" />
            }
          </Button>
        </div>

        {/* Drawing Tools */}
        <div className="p-2 space-y-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              size="sm"
              variant={activeTool === tool.id ? 'default' : 'ghost'}
              onClick={() => onToolSelect(tool.id)}
              className={cn(
                "w-full justify-start transition-all duration-200 h-10",
                activeTool === tool.id 
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? tool.name : undefined}
            >
              <tool.icon className={cn(
                "w-4 h-4",
                !isCollapsed && "mr-2"
              )} />
              {!isCollapsed && (
                <span className="text-xs font-medium truncate">{tool.name}</span>
              )}
            </Button>
          ))}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-2 border-t border-slate-700/50 bg-slate-800/30">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs text-slate-400 hover:text-white h-8"
              onClick={() => onToolSelect('clear')}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};