import { useState, useRef, useEffect, ReactNode } from "react";

interface DraggablePanelProps {
  id: string;
  children: ReactNode;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  bounds?: { 
    left: number; 
    top: number; 
    right: number; 
    bottom: number; 
  };
  className?: string;
}

export const DraggablePanel = ({
  id,
  children,
  defaultPosition,
  defaultSize,
  bounds,
  className = ""
}: DraggablePanelProps) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(`${id}-position`);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (error) {
        console.warn(`Failed to load position for ${id}:`, error);
      }
    }
  }, [id]);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(`${id}-position`, JSON.stringify(position));
  }, [id, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Apply bounds constraints if provided
    if (bounds) {
      newX = Math.max(bounds.left, Math.min(newX, bounds.right - defaultSize.width));
      newY = Math.max(bounds.top, Math.min(newY, bounds.bottom - defaultSize.height));
    }

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={panelRef}
      className={`absolute ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: defaultSize.width,
        height: defaultSize.height,
        zIndex: isDragging ? 50 : 40,
      }}
    >
      <div
        className="cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
};