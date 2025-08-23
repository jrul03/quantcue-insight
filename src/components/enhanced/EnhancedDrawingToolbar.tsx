import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer2, 
  TrendingUp, 
  Minus, 
  Square, 
  Circle,
  Zap,
  Palette,
  Settings,
  RotateCcw,
  Trash2,
  Grid3X3
} from "lucide-react";

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: 'select' | 'lines' | 'shapes' | 'analysis';
}

const DRAWING_TOOLS: DrawingTool[] = [
  { id: 'select', name: 'Select', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'V', category: 'select' },
  { id: 'trendline', name: 'Trendline', icon: <TrendingUp className="w-4 h-4" />, shortcut: 'T', category: 'lines' },
  { id: 'ray', name: 'Ray', icon: <Zap className="w-4 h-4" />, shortcut: 'R', category: 'lines' },
  { id: 'horizontal', name: 'Horizontal Line', icon: <Minus className="w-4 h-4" />, shortcut: 'H', category: 'lines' },
  { id: 'vertical', name: 'Vertical Line', icon: <Minus className="w-4 h-4 rotate-90" />, shortcut: 'Alt+V', category: 'lines' },
  { id: 'rectangle', name: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'Shift+R', category: 'shapes' },
  { id: 'circle', name: 'Circle', icon: <Circle className="w-4 h-4" />, shortcut: 'C', category: 'shapes' },
  { id: 'fibonacci', name: 'Fibonacci', icon: <Grid3X3 className="w-4 h-4" />, shortcut: 'F', category: 'analysis' },
];

const COLORS = [
  '#10b981', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

interface EnhancedDrawingToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
}

export const EnhancedDrawingToolbar = ({ activeTool, onToolSelect }: EnhancedDrawingToolbarProps) => {
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [lineWidth, setLineWidth] = useState(2);
  const [snapToOHLC, setSnapToOHLC] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
  };

  const clearDrawings = () => {
    // This would clear all drawings from the chart
    console.log('Clear all drawings');
  };

  const undoLast = () => {
    // This would undo the last drawing action
    console.log('Undo last drawing');
  };

  return (
    <div className="space-y-4">
      {/* Tool Selection */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Drawing Tools</h3>
          <Badge variant="secondary" className="text-xs">
            {DRAWING_TOOLS.find(t => t.id === activeTool)?.shortcut || ''}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Select Tool */}
          <div>
            <Button
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              onClick={() => handleToolSelect('select')}
              className="w-full justify-start h-9"
            >
              <MousePointer2 className="w-4 h-4 mr-2" />
              Select
            </Button>
          </div>

          <Separator />

          {/* Line Tools */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Lines</div>
            <div className="grid grid-cols-2 gap-1">
              {DRAWING_TOOLS.filter(t => t.category === 'lines').map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? 'default' : 'ghost'}
                  onClick={() => handleToolSelect(tool.id)}
                  className="h-9 text-xs"
                  title={`${tool.name} (${tool.shortcut})`}
                >
                  {tool.icon}
                </Button>
              ))}
            </div>
          </div>

          {/* Shape Tools */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Shapes</div>
            <div className="grid grid-cols-2 gap-1">
              {DRAWING_TOOLS.filter(t => t.category === 'shapes').map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? 'default' : 'ghost'}
                  onClick={() => handleToolSelect(tool.id)}
                  className="h-9 text-xs"
                  title={`${tool.name} (${tool.shortcut})`}
                >
                  {tool.icon}
                </Button>
              ))}
            </div>
          </div>

          {/* Analysis Tools */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Analysis</div>
            <Button
              variant={activeTool === 'fibonacci' ? 'default' : 'ghost'}
              onClick={() => handleToolSelect('fibonacci')}
              className="w-full justify-start h-9 text-xs"
              title="Fibonacci Retracement (F)"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Fibonacci
            </Button>
          </div>
        </div>
      </Card>

      {/* Drawing Properties */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Properties</h3>
        
        <div className="space-y-3">
          {/* Color Picker */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Color</div>
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    selectedColor === color ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Line Width */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Line Width</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((width) => (
                <Button
                  key={width}
                  variant={lineWidth === width ? 'default' : 'ghost'}
                  onClick={() => setLineWidth(width)}
                  className="h-8 w-8 p-0"
                >
                  <div 
                    className="rounded" 
                    style={{ 
                      width: '16px', 
                      height: `${width}px`, 
                      backgroundColor: 'currentColor' 
                    }} 
                  />
                </Button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>Snap to OHLC</span>
              <input
                type="checkbox"
                checked={snapToOHLC}
                onChange={(e) => setSnapToOHLC(e.target.checked)}
                className="w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>Show Tooltips</span>
              <input
                type="checkbox"
                checked={showTooltips}
                onChange={(e) => setShowTooltips(e.target.checked)}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Actions</h3>
        
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={undoLast}
            className="w-full justify-start h-9 text-xs"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Undo
          </Button>
          
          <Button
            variant="ghost"
            onClick={clearDrawings}
            className="w-full justify-start h-9 text-xs text-destructive hover:text-destructive"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Shortcuts</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Select</span>
            <Badge variant="outline" className="text-xs">V</Badge>
          </div>
          <div className="flex justify-between">
            <span>Trendline</span>
            <Badge variant="outline" className="text-xs">T</Badge>
          </div>
          <div className="flex justify-between">
            <span>Horizontal</span>
            <Badge variant="outline" className="text-xs">H</Badge>
          </div>
          <div className="flex justify-between">
            <span>Fibonacci</span>
            <Badge variant="outline" className="text-xs">F</Badge>
          </div>
          <div className="flex justify-between">
            <span>Undo</span>
            <Badge variant="outline" className="text-xs">Ctrl+Z</Badge>
          </div>
          <div className="flex justify-between">
            <span>Delete</span>
            <Badge variant="outline" className="text-xs">Del</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};