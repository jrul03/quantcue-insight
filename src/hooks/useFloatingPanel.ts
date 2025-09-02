import { useState, useRef, useEffect, useCallback } from 'react';

interface Position { x: number; y: number; }
interface PanelSize { width: number; height: number; }

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
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const posRef = useRef<Position>(defaultPosition);

  const clampToViewport = useCallback((pos: Position, width: number, height: number): Position => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: Math.max(0, Math.min(pos.x, vw - width)),
      y: Math.max(0, Math.min(pos.y, vh - height)),
    };
  }, []);

  // Only snap on release (prevents jitter)
  const snapToEdges = useCallback((pos: Position, width: number, height: number): Position => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { x, y } = pos;

    if (x < snapDistance) x = 0;
    else if (x > vw - width - snapDistance) x = vw - width;

    if (y < snapDistance) y = 0;
    else if (y > vh - height - snapDistance) y = vh - height;

    return { x, y };
  }, [snapDistance]);

  // Load saved
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const w = parsed.width || defaultSize.width;
        const h = parsed.height || defaultSize.height;
        const newPos = clampToViewport(
          { x: parsed.x ?? defaultPosition.x, y: parsed.y ?? defaultPosition.y },
          w, h
        );
        setPosition(newPos);
        posRef.current = newPos;
        setIsMinimized(!!parsed.isMinimized);
      } catch {
        setPosition(defaultPosition);
        posRef.current = defaultPosition;
      }
    } else {
      setPosition(defaultPosition);
      posRef.current = defaultPosition;
    }
  }, [storageKey, defaultPosition, defaultSize, clampToViewport]);

  // Persist (not while dragging)
  useEffect(() => {
    if (isDragging) return;
    const rect = panelRef.current?.getBoundingClientRect();
    const state = {
      x: position.x,
      y: position.y,
      width: rect?.width || defaultSize.width,
      height: rect?.height || defaultSize.height,
      isMinimized
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [position, isMinimized, storageKey, defaultSize, isDragging]);

  const startDrag = useCallback((e: React.PointerEvent) => {
    if (!panelRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = panelRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setIsDragging(true);
    document.body.classList.add('qp-dragging');
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !panelRef.current) return;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = panelRef.current!.getBoundingClientRect();
      const raw = {
        x: e.clientX - dragStartRef.current!.x,
        y: e.clientY - dragStartRef.current!.y,
      };
      const clamped = clampToViewport(raw, rect.width, rect.height);
      posRef.current = clamped;
      setPosition(clamped); // position is rendered via transform in the component
    });
  }, [isDragging, clampToViewport]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.classList.remove('qp-dragging');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const rect = panelRef.current?.getBoundingClientRect();
    const w = rect?.width || defaultSize.width;
    const h = rect?.height || defaultSize.height;

    const snapped = snapToEdges(posRef.current, w, h);
    posRef.current = snapped;
    setPosition(snapped);

    const state = { x: snapped.x, y: snapped.y, width: w, height: h, isMinimized };
    localStorage.setItem(storageKey, JSON.stringify(state));

    const target = e.target as Element;
    try { target.releasePointerCapture?.((e as any).pointerId); } catch {}
  }, [isDragging, defaultSize, snapToEdges, isMinimized, storageKey]);

  // Keep in view on resize
  useEffect(() => {
    const onResize = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const clamped = clampToViewport(posRef.current, rect.width, rect.height);
      posRef.current = clamped;
      setPosition(clamped);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport]);

  // Global listeners during drag
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: PointerEvent) => handlePointerMove(e);
    const up = (e: PointerEvent) => handlePointerUp(e);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const reset = useCallback(() => {
    const rect = panelRef.current?.getBoundingClientRect();
    const w = rect?.width || defaultSize.width;
    const h = rect?.height || defaultSize.height;
    const clamped = clampToViewport(defaultPosition, w, h);
    posRef.current = clamped;
    setPosition(clamped);
    setIsMinimized(false);
    localStorage.setItem(storageKey, JSON.stringify({
      x: clamped.x, y: clamped.y, width: w, height: h, isMinimized: false
    }));
  }, [defaultPosition, defaultSize, clampToViewport, storageKey]);

  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

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