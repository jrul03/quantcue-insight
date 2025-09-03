export type FeatureFlags = {
  enableDebug: boolean;
  enableAIHUD: boolean;
  enableLazyPanels: boolean;
  enableTVChart: boolean;
};

function fromEnvBool(v: any, fallback = false): boolean {
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export function getFlags(): FeatureFlags {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : "");

  const q = (k: string, fb = undefined as unknown as boolean | undefined) => {
    if (params.has(k)) return fromEnvBool(params.get(k));
    return fb as boolean | undefined;
  };

  const enableDebug = q('debug', undefined) ?? fromEnvBool((import.meta as any).env?.VITE_ENABLE_DEBUG, false);
  const enableAIHUD = q('aihud', undefined) ?? fromEnvBool((import.meta as any).env?.VITE_ENABLE_AIHUD, false);
  // Default enableLazyPanels true in production
  const defaultLazy = import.meta.env.PROD ? true : false;
  const enableLazyPanels = q('lazy', undefined) ?? fromEnvBool((import.meta as any).env?.VITE_ENABLE_LAZY, defaultLazy);
  const enableTVChart = q('tv', undefined) ?? fromEnvBool((import.meta as any).env?.VITE_ENABLE_TV, false);

  return { enableDebug, enableAIHUD, enableLazyPanels, enableTVChart };
}
