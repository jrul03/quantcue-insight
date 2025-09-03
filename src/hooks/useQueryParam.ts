import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HistoryMode = "replace" | "push";

export interface UseQueryParamOptions<T> {
  defaultValue?: T;
  parse?: (raw: string | null) => T;
  serialize?: (val: T) => string | null;
  debounceMs?: number;
  history?: HistoryMode;
}

function getSearchParam(key: string): string | null {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(key);
    return value;
  } catch {
    return null;
  }
}

function setSearchParam(
  key: string,
  value: string | null,
  mode: HistoryMode = "replace"
) {
  const url = new URL(window.location.href);
  const hasBefore = url.searchParams.has(key);

  if (value == null || value === "") {
    if (!hasBefore) return; // nothing to remove
    url.searchParams.delete(key);
  } else {
    const before = url.searchParams.get(key);
    if (before === value) return; // no change
    url.searchParams.set(key, value);
  }

  const href = url.toString();
  if (mode === "replace") {
    window.history.replaceState(window.history.state, "", href);
  } else {
    window.history.pushState(window.history.state, "", href);
  }
}

export function useQueryParam<T = string>(
  key: string,
  options: UseQueryParamOptions<T> = {}
): [T, (next: T) => void] {
  const {
    defaultValue,
    parse,
    serialize,
    debounceMs = 150,
    history = "replace",
  } = options;

  const parseFn = useMemo<NonNullable<typeof parse>>(
    () =>
      parse ||
      ((raw: string | null) =>
        (raw == null ? (defaultValue as T) : (raw as unknown as T)) as T),
    [parse, defaultValue]
  );

  const serializeFn = useMemo<NonNullable<typeof serialize>>(
    () =>
      serialize ||
      ((val: T) => (val == null ? null : String(val)) as string | null),
    [serialize]
  );

  const initialRaw = typeof window !== "undefined" ? getSearchParam(key) : null;
  const [value, setValue] = useState<T>(parseFn(initialRaw));

  const lastSerializedRef = useRef<string | null>(
    serializeFn(value as T)
  );
  const timerRef = useRef<number | null>(null);

  const flush = useCallback(
    (next: T) => {
      const nextSerialized = serializeFn(next);
      // Avoid redundant writes
      if (nextSerialized === lastSerializedRef.current) return;
      setSearchParam(key, nextSerialized, history);
      lastSerializedRef.current = nextSerialized;
    },
    [history, key, serializeFn]
  );

  const schedule = useCallback(
    (next: T) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (debounceMs <= 0) {
        flush(next);
        return;
      }
      timerRef.current = window.setTimeout(() => {
        flush(next);
        timerRef.current = null;
      }, debounceMs);
    },
    [debounceMs, flush]
  );

  // Setter exposed to users
  const setParam = useCallback(
    (next: T) => {
      setValue(next);
      schedule(next);
    },
    [schedule]
  );

  // Sync with browser navigation (back/forward)
  useEffect(() => {
    const onPopState = () => {
      const raw = getSearchParam(key);
      // If raw string equals lastSerialized, no need to parse/update state.
      if (raw === lastSerializedRef.current) return;
      const parsed = parseFn(raw);
      setValue(parsed);
      lastSerializedRef.current = serializeFn(parsed);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [key, parseFn, serializeFn]);

  // Cleanup any pending timers
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [value, setParam];
}

export function useQueryParamList(
  key: string,
  defaultList: string[] = []
): [string[], (next: string[]) => void] {
  const [value, setValue] = useQueryParam<string[]>(key, {
    defaultValue: defaultList,
    parse: (raw) =>
      raw == null || raw.trim() === ""
        ? defaultList
        : raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    serialize: (list) => (list.length === 0 ? null : list.join(",")),
    debounceMs: 150,
    history: "replace",
  });
  return [value, setValue];
}

