import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCandles } from '@/hooks/useCandles';

type Res = 'S30'|'1'|'5'|'15'|'30'|'60'|'D';

interface TVLightweightChartProps {
  symbol: string;
  resolution: Res;
}

declare global {
  interface Window {
    LightweightCharts?: any;
    __tv_script_promise__?: Promise<any>;
  }
}

async function loadTV(): Promise<any> {
  // Load from UMD CDN only to avoid bundler resolution
  if (window.LightweightCharts) return window.LightweightCharts;
  if (!window.__tv_script_promise__) {
    window.__tv_script_promise__ = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
      s.async = true;
      s.onload = () => resolve(window.LightweightCharts);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return window.__tv_script_promise__;
}

export const TVLightweightChart = ({ symbol, resolution }: TVLightweightChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const ema20Ref = useRef<any>(null);
  const ema50Ref = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [res, setRes] = useState<Res>(resolution);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);

  // Fetch candles using existing hook
  const { data, loading } = useCandles(symbol, res);
  const candles = Array.isArray(data) ? data : [];

  // Init chart
  useEffect(() => {
    let dispose = () => {};
    let ro: ResizeObserver | null = null;
    let alive = true;
    (async () => {
      const TV = await loadTV();
      if (!alive || !containerRef.current) return;
      const container = containerRef.current;
      const chart = TV.createChart(container, {
        layout: { background: { color: '#0b1220' }, textColor: '#a9b1c7' },
        grid: {
          vertLines: { color: 'rgba(120, 144, 156, 0.1)' },
          horzLines: { color: 'rgba(120, 144, 156, 0.1)' },
        },
        rightPriceScale: { borderColor: 'rgba(134, 144, 160, 0.3)' },
        timeScale: { borderColor: 'rgba(134, 144, 160, 0.3)' },
        crosshair: { mode: 1 },
        autoSize: true,
      });
      const series = chart.addCandlestickSeries({
        upColor: '#16a34a', downColor: '#dc2626', borderDownColor: '#dc2626', borderUpColor: '#16a34a',
        wickDownColor: '#dc2626', wickUpColor: '#16a34a',
      });
      chartRef.current = chart;
      seriesRef.current = series;
      // EMA overlay series
      ema20Ref.current = chart.addLineSeries({ color: '#06b6d4', lineWidth: 2, priceLineVisible: false });
      ema50Ref.current = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, priceLineVisible: false });
      setReady(true);

      ro = new ResizeObserver(() => chart.applyOptions({}));
      ro.observe(container);

      dispose = () => {
        ro && ro.disconnect();
        chart && chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        ema20Ref.current = null;
        ema50Ref.current = null;
      };
    })();
    return () => { alive = false; dispose(); };
  }, []);

  // Update data
  useEffect(() => {
    if (!ready || !seriesRef.current) return;
    const tvData = candles.map((c: any) => ({
      time: Math.floor(c.timestamp / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(tvData);
    // Compute EMAs and set if visible
    const calcEma = (period: number) => {
      const out: Array<{ time: number; value: number }> = [];
      if (!candles.length) return out;
      const k = 2 / (period + 1);
      let prev = candles[0].close;
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const val = i === 0 ? prev : c.close * k + prev * (1 - k);
        prev = val;
        out.push({ time: Math.floor(c.timestamp / 1000), value: val });
      }
      return out;
    };
    if (ema20Ref.current) {
      if (showEma20) ema20Ref.current.setData(calcEma(20)); else ema20Ref.current.setData([]);
    }
    if (ema50Ref.current) {
      if (showEma50) ema50Ref.current.setData(calcEma(50)); else ema50Ref.current.setData([]);
    }
  }, [ready, candles, showEma20, showEma50]);

  // Update series on symbol change (clear/fit)
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [symbol, res]);

  // Keep internal resolution in sync with prop if parent changes
  useEffect(() => { setRes(resolution); }, [resolution]);

  return (
    <Card className="h-full bg-slate-900/60 border-slate-700/50 relative">
      {/* Toolbar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/70 border border-slate-700/60 rounded-lg px-2 py-1">
        <div className="flex items-center gap-1">
          {(['1','5','15','60','D'] as Res[]).map((tf) => (
            <Button key={tf} size="sm" variant={res===tf? 'default':'ghost'} className="h-7 px-2 text-xs" onClick={() => setRes(tf)}>
              {tf === 'D' ? '1D' : (tf === '60' ? '1H' : `${tf}m`)}
            </Button>
          ))}
        </div>
        <div className="ml-2 flex items-center gap-1">
          <Button size="sm" variant={showEma20? 'default':'ghost'} className="h-7 px-2 text-xs" onClick={()=>setShowEma20(v=>!v)}>EMA20</Button>
          <Button size="sm" variant={showEma50? 'default':'ghost'} className="h-7 px-2 text-xs" onClick={()=>setShowEma50(v=>!v)}>EMA50</Button>
        </div>
        <Badge variant="outline" className="ml-2 text-[10px] border-slate-600/60">{symbol}</Badge>
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </Card>
  );
};

export default TVLightweightChart;
