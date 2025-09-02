 import { PropsWithChildren, useMemo } from "react";
import { createPortal } from "react-dom";
import { useFloatingPanel } from "@/hooks/useFloatingPanel";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

type Props = PropsWithChildren<{
  storageKey: string;
  defaultPos?: { x: number; y: number };
  className?: string;
  title?: string;
}>;

export function FloatingPanel({
  storageKey,
  defaultPos,
  className,
  title = "Panel",
  children
}: Props) {
  const { ref, position, startDrag, reset } = useFloatingPanel({
    storageKey,
    defaultPosition: defaultPos ?? { x: 24, y: 24 },
  });

  const style = useMemo(() => ({
    position: "fixed" as const,
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    willChange: "transform",
  }), [position]);

  const node = (
    <div style={{ pointerEvents: "none" }} className="fixed inset-0 z-[9999]">
      <div
        ref={ref}
        style={style}
        className={cn(
          "pointer-events-auto rounded-lg border border-slate-700/50 bg-slate-900/85 backdrop-blur shadow-xl transition-none",
          className
        )}
      >
        <div
          data-drag-handle
          onPointerDown={startDrag}
          className="cursor-grab active:cursor-grabbing select-none px-3 py-2 flex items-center justify-between border-b border-slate-700/40"
        >
          <div className="text-xs text-slate-300">{title}</div>
          <button
            className="text-slate-400 hover:text-slate-200"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            title="Reset position"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}