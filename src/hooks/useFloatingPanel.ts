import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';

interface Position { x: number; y: number; }
interface PanelSize { width: number; height: number; }

interface UseFloatingPanelOptions {
  storageKey: string;
  defaultPosition: Position;
  defaultSize?: PanelSize;
  snapDistance?: number;
}

type SavedState = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  isMinimized?: boolean;
};

export const useFloatingPanel = ({
  storageKey,
  defaultPosition,
  defaultSize = { width: 320, height: 240 },
  snapDistance = 12
}: UseFloatingPanelOptions) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ---- Initialize from localStorage synchronously to avoid first-paint jump
  const init = (): { pos: Position; minimized: boolean } => {
    if (typeof window === 'undefined') {
      return { pos: defaultPosition, minimized: false };
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { pos: defaultPosition, minimized: false };
      const s: SavedState = JSON.parse(raw);
      const x = Number.isFinite(s.x) ? s.x : defaultPosition.x;
      const y = Number.isFinite(s.y) ? s.y : defaultPosition.y;
      const minimized = !!s.isMinimized;
      // Clamp to viewport using defaultSize (we’ll refine after mount)
      const vw = window.innerWidth, vh = window.innerHeight;
      return {
        pos: {
          x: Math.max(0, Math.min(x, vw - (s.width ?? defaultSize.width))),
          y: Math.max(0, Math.min(y, vh - (s.height ?? defaultSize.height))),
        },
        minimized
      };
    } catch {
      return { pos: defaultPosition, minimized: false };
    }
  };

  const initState = init();
  const [position, setPosition] = useState<Position>(initState.pos);
  const [isMinimized, setIsMinimized] = useState<boolean>(initState.minimized);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false); // gate first render until we finalize position

  const clampToViewport = useCallback((pos: Position, width: number, height: number): Position => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: Math.max(0, Math.min(pos.x, vw - width)),
      y: Math.max(0, Math.min(pos.y, vh - height)),
    };
  }, []);

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

  // After mount, refine clamping using actual element size, then show
  useLayoutEffect(() => {
    const rect = panelRef.current?.getBoundingClientRect();
    const w = rect?.width || defaultSize.width;
    const h = rect?.height || defaultSize.height;
    setPosition((p) => clampToViewport(p, w, h));
    setIsReady(true);
  }, [clampToViewport, defaultSize]);

  // Persist when not dragging
  useEffect(() => {
    if (!isReady || isDragging) return;
    const rect = panelRef.current?.getBoundingClientRect();
    const state: SavedState = {
      x: position.x,
      y: position.y,
      width: rect?.width || defaultSize.width,
      height: rect?.height || defaultSize.height,
      isMinimized
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [isReady, isDragging, position, isMinimized, storageKey, defaultSize]);

  const startDrag = useCallback((e: React.PointerEvent) => {
    if (!panelRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = panelRef.current.getBoundingClientRect();
    dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
    document.body.classList.add('qp-dragging');
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const onMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !panelRef.current) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = panelRef.current!.getBoundingClientRect();
      const raw = { x: e.clientX - dragStartRef.current!.x, y: e.clientY - dragStartRef.current!.y };
      setPosition(clampToViewport(raw, rect.width, rect.height)); // no snap while dragging
    });
  }, [isDragging, clampToViewport]);

  const onUp = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.classList.remove('qp-dragging');
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    const rect = panelRef.current?.getBoundingClientRect();
    const w = rect?.width || defaultSize.width;
    const h = rect?.height || defaultSize.height;
    setPosition((p) => snapToEdges(p, w, h)); // snap once on release
    try { (e.target as Element).releasePointerCapture?.((e as any).pointerId); } catch {}
  }, [isDragging, defaultSize, snapToEdges]);

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: PointerEvent) => onMove(e);
    const up = (e: PointerEvent) => onUp(e);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
  }, [isDragging, onMove, onUp]);

  // Keep in view on resize
  useEffect(() => {
    const onResize = () => {
      const rect = panelRef.current?.getBoundingClientRect();
      const w = rect?.width || defaultSize.width;
      const h = rect?.height || defaultSize.height;
      setPosition((p) => clampToViewport(p, w, h));
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport, defaultSize]);

  const reset = useCallback(() => {
    const rect = panelRef.current?.getBoundingClientRect();
    const w = rect?.width || defaultSize.width;
    const h = rect?.height || defaultSize.height;
    const clamped = clampToViewport(defaultPosition, w, h);
    setPosition(clamped);
    setIsMinimized(false);
    const state: SavedState = { x: clamped.x, y: clamped.y, width: w, height: h, isMinimized: false };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [defaultPosition, defaultSize, clampToViewport, storageKey]);

  const toggleMinimized = useCallback(() => setIsMinimized((v) => !v), []);

  return {
    ref: panelRef,
    position,
    startDrag,
    reset,
    isDragging,
    isMinimized,
    toggleMinimized,
    isReady, // <— expose this
  };
};