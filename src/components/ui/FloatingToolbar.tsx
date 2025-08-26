import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain, 
  MessageCircle, 
  Settings, 
  Maximize2, 
  Minimize2,
  Eye,
  BarChart3,
  Activity
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: any;
  description: string;
  isActive: boolean;
  position?: 'bottom-left' | 'bottom-right' | 'top-right' | 'center';
}

interface FloatingToolbarProps {
  tools: Tool[];
  onToolToggle: (toolId: string) => void;
  onLayoutChange?: (layout: 'standard' | 'focus' | 'analysis') => void;
  currentLayout?: string;
}

export const FloatingToolbar = ({ 
  tools, 
  onToolToggle, 
  onLayoutChange, 
  currentLayout = 'standard' 
}: FloatingToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeToolsCount = tools.filter(tool => tool.isActive).length;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full"
          size="sm"
        >
          <Settings className="w-5 h-5 text-primary" />
        </Button>
        {activeToolsCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground min-w-[20px] h-5 text-xs flex items-center justify-center">
            {activeToolsCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-1/2 translate-x-1/2 z-50">
      <Card className="hud-panel">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Trading Tools</span>
              {activeToolsCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {activeToolsCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Tool Controls */}
          <div className={`grid gap-2 ${isExpanded ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={tool.isActive ? "default" : "ghost"}
                      onClick={() => onToolToggle(tool.id)}
                      className={`flex items-center gap-2 ${
                        isExpanded ? 'justify-start' : 'justify-center'
                      } ${tool.isActive ? 'bg-primary/20 border-primary/40' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      {isExpanded && <span className="text-xs">{tool.name}</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-muted-foreground">{tool.description}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Layout Controls */}
          {isExpanded && onLayoutChange && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Layout:</div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'standard', icon: BarChart3, label: 'Standard' },
                  { id: 'focus', icon: Maximize2, label: 'Focus' },
                  { id: 'analysis', icon: Activity, label: 'Analysis' }
                ].map((layout) => {
                  const Icon = layout.icon;
                  return (
                    <Button
                      key={layout.id}
                      size="sm"
                      variant={currentLayout === layout.id ? "default" : "ghost"}
                      onClick={() => onLayoutChange(layout.id as any)}
                      className="flex flex-col items-center gap-1 h-auto p-2"
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{layout.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};