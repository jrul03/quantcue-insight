import { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface ResizablePanelsProps {
  children: ReactNode[];
  defaultSizes?: number[];
  minSizes?: number[];
  storageKey?: string;
  className?: string;
}

export const ResizablePanels = ({ 
  children, 
  defaultSizes = [25, 50, 25], 
  minSizes = [15, 30, 20],
  storageKey = 'panel-sizes',
  className 
}: ResizablePanelsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<number[]>(defaultSizes);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; sizes: number[] }>({ x: 0, sizes: [] });

  // Load sizes from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsedSizes = JSON.parse(saved);
          if (Array.isArray(parsedSizes) && parsedSizes.length === defaultSizes.length) {
            setSizes(parsedSizes);
          }
        } catch (error) {
          console.warn('Failed to parse stored panel sizes:', error);
        }
      }
    }
  }, [storageKey, defaultSizes.length]);

  // Save sizes to localStorage when they change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(sizes));
    }
  }, [sizes, storageKey]);

  const handleMouseDown = (dividerIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(dividerIndex);
    setDragStart({ x: event.clientX, sizes: [...sizes] });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging === null || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = event.clientX - dragStart.x;
    const deltaPercent = (deltaX / containerWidth) * 100;

    const newSizes = [...dragStart.sizes];
    const leftIndex = isDragging;
    const rightIndex = isDragging + 1;

    // Calculate new sizes
    const newLeftSize = Math.max(minSizes[leftIndex], newSizes[leftIndex] + deltaPercent);
    const newRightSize = Math.max(minSizes[rightIndex], newSizes[rightIndex] - deltaPercent);

    // Check if both panels meet minimum size requirements
    const leftDiff = newLeftSize - newSizes[leftIndex];
    const rightDiff = newSizes[rightIndex] - newRightSize;
    
    if (leftDiff <= rightDiff) {
      newSizes[leftIndex] = newLeftSize;
      newSizes[rightIndex] = newSizes[rightIndex] - leftDiff;
    } else {
      newSizes[rightIndex] = newRightSize;
      newSizes[leftIndex] = newSizes[leftIndex] + rightDiff;
    }

    setSizes(newSizes);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  return (
    <div ref={containerRef} className={cn("flex h-full", className)}>
      {children.map((child, index) => (
        <div key={index} className="flex">
          {/* Panel */}
          <div 
            className="transition-all duration-200 ease-out flex-shrink-0 overflow-hidden"
            style={{ width: `${sizes[index]}%` }}
          >
            {child}
          </div>
          
          {/* Divider */}
          {index < children.length - 1 && (
            <div
              className={cn(
                "flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/50",
                "transition-all duration-200 cursor-col-resize group relative",
                "w-1 hover:w-2",
                isDragging === index && "bg-blue-500/50 w-2"
              )}
              onMouseDown={(e) => handleMouseDown(index, e)}
            >
              <GripVertical className={cn(
                "w-3 h-8 text-slate-500 opacity-0 group-hover:opacity-100",
                "transition-opacity duration-200",
                isDragging === index && "opacity-100 text-blue-400"
              )} />
              
              {/* Active drag indicator */}
              {isDragging === index && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};