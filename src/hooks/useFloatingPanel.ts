import { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface PanelSize {
  width: number;
  height: number;
}

interface UseFloatingPanelOptions {
  storageKey: string;
  defaultPosition: Position;
  defaultSize?: PanelSize;
  snapDistance?: number;
}

export const useFloatingPanel = ({
  storageKey,
  defaultPosition,
  defaultSize = { width: 320, height: 240 },
  snapDistance = 12
}: UseFloatingPanelOptions) => {
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Validate and clamp position to viewport
        const newPos = clampToViewport(
          { x: parsed.x || defaultPosition.x, y: parsed.y || defaultPosition.y },
          parsed.width || defaultSize.width,
          parsed.height || defaultSize.height
        );
        
        setPosition(newPos);
        setIsMinimized(parsed.isMinimized || false);
      } catch (error) {
        console.error('Failed to load panel state:', error);
        setPosition(defaultPosition);
      }
    }
  }, [storageKey, defaultPosition, defaultSize]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const rect = panelRef.current?.getBoundingClientRect();
    const state = {
      x: position.x,
      y: position.y,
      width: rect?.width || defaultSize.width,
      height: rect?.height || defaultSize.height,
      isMinimized
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [position, isMinimized, storageKey, defaultSize]);

  // Clamp position to viewport bounds
  const clampToViewport = useCallback((pos: Position, width: number, height: number): Position => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const x = Math.max(0, Math.min(pos.x, viewportWidth - width));
    const y = Math.max(0, Math.min(pos.y, viewportHeight - height));
    
    return { x, y };
  }, []);

  // Snap to edges if close enough
  const snapToEdges = useCallback((pos: Position, width: number, height: number): Position => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let { x, y } = pos;
    
    // Snap to left/right edges
    if (x < snapDistance) x = 0;
    else if (x > viewportWidth - width - snapDistance) x = viewportWidth - width;
    
    // Snap to top/bottom edges
    if (y < snapDistance) y = 0;
    else if (y > viewportHeight - height - snapDistance) y = viewportHeight - height;
    
    return { x, y };
  }, [snapDistance]);

  // Start dragging
  const startDrag = useCallback((e: React.PointerEvent) => {
    if (!panelRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = panelRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY
    };
    
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    
    // Capture pointer to ensure we get all move events
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  // Handle pointer move during drag
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !panelRef.current) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = panelRef.current!.getBoundingClientRect();
      const newX = e.clientX - dragStartRef.current!.x;
      const newY = e.clientY - dragStartRef.current!.y;
      
      let newPos = { x: newX, y: newY };
      newPos = clampToViewport(newPos, rect.width, rect.height);
      newPos = snapToEdges(newPos, rect.width, rect.height);
      
      setPosition(newPos);
    });
  }, [isDragging, clampToViewport, snapToEdges]);

  // End dragging
  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Release pointer capture
    const target = e.target as Element;
    if (target.hasPointerCapture) {
      target.releasePointerCapture(e.pointerId);
    }
  }, [isDragging]);

  // Reset to default position
  const reset = useCallback(() => {
    const rect = panelRef.current?.getBoundingClientRect();
    const newPos = clampToViewport(
      defaultPosition,
      rect?.width || defaultSize.width,
      rect?.height || defaultSize.height
    );
    setPosition(newPos);
    setIsMinimized(false);
  }, [defaultPosition, defaultSize, clampToViewport]);

  // Toggle minimized state
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Handle window resize - reposition if panel is now off-screen
  useEffect(() => {
    const handleResize = () => {
      if (!panelRef.current) return;
      
      const rect = panelRef.current.getBoundingClientRect();
      const newPos = clampToViewport(position, rect.width, rect.height);
      
      if (newPos.x !== position.x || newPos.y !== position.y) {
        setPosition(newPos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, clampToViewport]);

  // Set up global pointer event listeners during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return {
    ref: panelRef,
    position,
    setPosition,
    startDrag,
    reset,
    isDragging,
    isMinimized,
    toggleMinimized
  };
};