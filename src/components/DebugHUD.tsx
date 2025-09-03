import { useEffect, useRef, useState } from "react";

interface DebugHUDProps {
  lastTickTs?: number | null;
}

export const DebugHUD = ({ lastTickTs }: DebugHUDProps) => {
  const [fps, setFps] = useState(0);
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const loop = (t: number) => {
      frames += 1;
      const dt = t - last;
      last = t;
      acc += dt;
      if (acc >= 500) { // update twice a second
        setFps(Math.round((frames * 1000) / acc));
        frames = 0;
        acc = 0;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="fixed top-2 right-2 z-50 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 backdrop-blur-sm">
      <div>FPS: <span className="font-mono text-green-400">{fps}</span></div>
      <div>Renders: <span className="font-mono">{renders.current}</span></div>
      {lastTickTs && (
        <div>Last Tick: <span className="font-mono">{new Date(lastTickTs).toLocaleTimeString()}</span></div>
      )}
    </div>
  );
};

