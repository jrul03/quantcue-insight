import { useQuery } from "@tanstack/react-query";
import { getTopMovers, type Mover } from "@/lib/polygonMarket";

export function useTopMovers(kind: "stocks" | "crypto", direction: "gainers" | "losers" = "gainers") {
  return useQuery<Mover[]>({
    queryKey: ["top-movers", kind, direction],
    queryFn: () => getTopMovers(kind, direction),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

