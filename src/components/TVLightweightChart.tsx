import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
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
  const [ready, setReady] = useState(false);

  // Fetch candles using existing hook
  const { data, loading } = useCandles(symbol, resolution);
  const candles = Array.isArray(data) ? data : data?.data || [];

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
      setReady(true);

      ro = new ResizeObserver(() => chart.applyOptions({}));
      ro.observe(container);

      dispose = () => {
        ro && ro.disconnect();
        chart && chart.remove();
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
  }, [ready, candles]);

  // Update series on symbol change (clear/fit)
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [symbol, resolution]);

  return (
    <Card className="h-full bg-slate-900/60 border-slate-700/50">
      <div ref={containerRef} className="h-full w-full" />
    </Card>
  );
};

export default TVLightweightChart;
