import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useFloatingPanel } from '@/hooks/useFloatingPanel';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './dropdown-menu';

interface FloatingPanelProps {
  storageKey: string;
  defaultPos: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
  headerSelector?: string;
  onMinimizedChange?: (minimized: boolean) => void;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  storageKey,
  defaultPos,
  children,
  className = '',
  headerSelector,
  onMinimizedChange
}) => {
  const {
    ref,
    position,
    startDrag,
    reset,
    isDragging,
    isMinimized,
    toggleMinimized
  } = useFloatingPanel({
    storageKey,
    defaultPosition: defaultPos
  });

  // Notify parent of minimized state changes
  useEffect(() => {
    onMinimizedChange?.(isMinimized);
  }, [isMinimized, onMinimizedChange]);

  // Create a portal to render at body level to avoid clipping
  const portalContent = (
    <div
      ref={ref}
      className={`fixed z-[9999] pointer-events-auto ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
        opacity: isDragging ? 0.95 : 1,
        transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease'
      }}
    >
      {isMinimized ? (
        // Minimized chip
        <Button
          onClick={toggleMinimized}
          className="h-10 px-4 bg-background/95 border border-border/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200"
          variant="outline"
        >
          {storageKey.includes('chat') ? '💬 AI Chat' : '🧠 AI Analyzer'}
        </Button>
      ) : (
        // Full panel
        <div 
          className="bg-background/95 border border-border/50 rounded-lg backdrop-blur-md shadow-xl shadow-black/30 overflow-hidden"
          style={{
            boxShadow: isDragging 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(6, 182, 212, 0.6)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Enhanced drag handle header */}
          <div 
            className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border/50 cursor-grab active:cursor-grabbing select-none"
            onPointerDown={startDrag}
            style={{ userSelect: 'none' }}
          >
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full opacity-60" />
              <div className="w-1 h-1 bg-muted-foreground rounded-full opacity-40" />
              <div className="w-1 h-1 bg-muted-foreground rounded-full opacity-60" />
            </div>
            <span className="text-xs text-muted-foreground font-medium flex-1">
              {storageKey.includes('chat') ? 'AI Trading Assistant' : 'AI Live Analyzer'}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMinimized}
                className="h-6 w-6 p-0 hover:bg-muted/80"
                title="Minimize"
              >
                <span className="text-xs">−</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-muted/80"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={reset} className="text-xs">
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Reset Position
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {children}
        </div>
      )}
    </div>
  );

  return createPortal(portalContent, document.body);
};