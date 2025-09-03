/// <reference types="vite/client" />

declare module 'lightweight-charts' {
  export const createChart: any;
  export type IChartApi = any;
}

interface Window {
  LightweightCharts?: any;
}
