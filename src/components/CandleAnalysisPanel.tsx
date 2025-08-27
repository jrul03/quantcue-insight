import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ExternalLink, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

/** ===================== Types ===================== */
interface CandleData {
  timestamp: number;   // ms
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  timestamp: number;   // ms
  sentiment: number;   // -1..1
  confidence: number;  // 0..1
  relevanceScore: number; // 0..1
  url: string;
  type: "news" | "social" | "pr";
}

interface CandleAnalysisPanelProps {
  candle: CandleData | null;
  asset: { symbol: string; assetClass: string };
  onClose: () => void;
  onHighlightCandle: (timestamp: number) => void;
}

/** ===================== Env keys ===================== 
 * Add these in Lovable → Project Settings → Environment Variables
 * VITE_FINNHUB_KEY = your_finnhub_api_key        (recommended, supports CORS)
 * VITE_POLYGON_KEY  = your_polygon_api_key        (optional, second source)
 * VITE_SOCIAL_REDDIT = true/false                 (optional mock/social)
 */
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY as string | undefined;
const POLYGON_KEY = import.meta.env.VITE_POLYGON_KEY as string | undefined;

/** ===================== Helpers ===================== */

/** crude sentiment from title/summary if API doesn't provide one */
function simpleSentiment(text: string): number {
  const s = text.toLowerCase();
  const pos = ["beat", "surge", "strong", "upgrade", "positive", "record", "growth"];
  const neg = ["miss", "drop", "downgrade", "investigation", "negative", "lawsuit", "cut"];
  let score = 0;
  pos.forEach(w => { if (s.includes(w)) score += 1; });
  neg.forEach(w => { if (s.includes(w)) score -= 1; });
  return Math.max(-1, Math.min(1, score / 3));
}

/** Convert seconds->ms if needed */
const toMs = (t: number) => (t < 10_000_000_000 ? t * 1000 : t);

/** Window filter: keep items near the candle time (default ±15m) */
function filterByWindow(items: NewsItem[], centerMs: number, minutes = 15) {
  const delta = minutes * 60 * 1000;
  return items.filter(n => Math.abs(n.timestamp - centerMs) <= delta);
}

/** rank: relevance desc then most recent */
function rank(items: NewsItem[]) {
  return [...items].sort((a, b) => {
    const r = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    if (r !== 0) return r;
    return (b.timestamp ?? 0) - (a.timestamp ?? 0);
  });
}

/** Map Finnhub result -> NewsItem[] */
function mapFinnhub(symbol: string, data: any[]): NewsItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((n, i) => {
    const ts = toMs(n.datetime ?? n.date ?? Math.floor(Date.now()/1000));
    const headline = n.headline || n.title || "";
    const summary  = n.summary || "";
    const src      = n.source || "Finnhub";
    // Finnhub doesn't return sentiment; derive quick proxy
    const sent = simpleSentiment(`${headline} ${summary}`);
    return {
      id: `finnhub-${i}-${ts}`,
      headline,
      summary,
      source: src,
      timestamp: ts,
      sentiment: sent,
      confidence: 0.8,
      relevanceScore: 0.8,
      url: n.url || n.link || "#",
      type: "news"
    } as NewsItem;
  });
}

/** Map Polygon result -> NewsItem[] */
function mapPolygon(symbol: string, data: any): NewsItem[] {
  const arr = Array.isArray(data?.results) ? data.results : [];
  return arr.map((n: any, i: number) => {
    const ts = new Date(n.published_utc).getTime();
    const headline = n.title || "";
    const summary  = n.description || "";
    const src      = n.publisher?.name || "Polygon";
    const sent = simpleSentiment(`${headline} ${summary}`);
    // Polygon has tickers list; boost relevance if symbol present
    const hasTicker = Array.isArray(n.tickers) && n.tickers.includes(symbol.toUpperCase());
    return {
      id: `polygon-${i}-${ts}`,
      headline,
      summary,
      source: src,
      timestamp: ts,
      sentiment: sent,
      confidence: 0.85,
      relevanceScore: hasTicker ? 0.9 : 0.7,
      url: n.article_url || n.url || "#",
      type: "news"
    } as NewsItem;
  });
}

/** Optional: very light Reddit mention fetch (public JSON). 
 * If you prefer to keep only news for now, set includeSocial = false below.
 */
async function fetchRedditMentions(symbol: string): Promise<NewsItem[]> {
  try {
    const q = encodeURIComponent(`$${symbol}`);
    const url = `https://www.reddit.com/search.json?q=${q}&sort=new&t=day&limit=10`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return [];
    const j = await res.json();
    const posts = j?.data?.children ?? [];
    return posts.map((p: any, i: number) => {
      const data = p.data;
      const ts = (data.created_utc ?? Math.floor(Date.now()/1000)) * 1000;
      const title = data.title || "";
      const body = data.selftext || "";
      const sent = simpleSentiment(`${title} ${body}`);
      const url = `https://reddit.com${data.permalink}`;
      return {
        id: `reddit-${i}-${ts}`,
        headline: title,
        summary: body.slice(0, 140),
        source: "Reddit",
        timestamp: ts,
        sentiment: sent,
        confidence: 0.5,
        relevanceScore: 0.6,
        url,
        type: "social"
      } as NewsItem;
    });
  } catch {
    return [];
  }
}

/** Build AI one-liner */
function buildAISummary(items: NewsItem[], candle: CandleData): string {
  if (!items.length) {
    return "No clear driver identified; likely normal volatility, technical levels, or algos.";
  }
  const top = items[0];
  const minutesLag = Math.max(0, Math.floor((candle.timestamp - top.timestamp) / 60000));
  const dir = candle.close > candle.open ? "spike" : "drop";
  return `Likely driver: ${top.headline} — sentiment ${top.sentiment.toFixed(2)}; ${dir} began ${minutesLag}m after first mention.`;
}

/** ===================== Component ===================== */

export const CandleAnalysisPanel = ({ candle, asset, onClose, onHighlightCandle }: CandleAnalysisPanelProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "news" | "social">("all");
  const [aiSummary, setAiSummary] = useState<string>("");

  useEffect(() => {
    if (!candle) return;

    let alive = true;
    setLoading(true);

    const fetchAll = async () => {
      const symbol = asset.symbol?.toUpperCase()?.trim();
      if (!symbol) {
        setNewsItems([]);
        setAiSummary("");
        setLoading(false);
        return;
      }

      try {
        // date window for APIs (last few days); we filter tighter later
        const to = new Date(candle.timestamp).toISOString().slice(0, 10);
        const fromDate = new Date(candle.timestamp - 3 * 24 * 60 * 60 * 1000); // minus 3 days
        const from = fromDate.toISOString().slice(0, 10);

        const tasks: Promise<NewsItem[]>[] = [];

        // Finnhub (company news)
        if (FINNHUB_KEY) {
          const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
          tasks.push(
            fetch(url)
              .then(r => r.ok ? r.json() : [])
              .then(d => mapFinnhub(symbol, d))
              .catch(() => [])
          );
        }

        // Polygon (reference news) – optional
        if (POLYGON_KEY) {
          const url = `https://api.polygon.io/v2/reference/news?ticker=${symbol}&limit=50&apiKey=${POLYGON_KEY}`;
          tasks.push(
            fetch(url)
              .then(r => r.ok ? r.json() : {})
              .then(d => mapPolygon(symbol, d))
              .catch(() => [])
          );
        }

        // Optional: Reddit mentions (very lightweight public JSON)
        const includeSocial = true; // set false if you only want news for now
        if (includeSocial) {
          tasks.push(fetchRedditMentions(symbol));
        }

        const results = await Promise.all(tasks);
        const merged = rank(results.flat());

        // keep items near the candle time (±15m); if empty, fall back to top 6 overall
        let windowed = filterByWindow(merged, candle.timestamp, 15);
        if (!windowed.length) windowed = merged.slice(0, 6);

        if (!alive) return;
        setNewsItems(windowed);
        setAiSummary(buildAISummary(windowed, candle));
      } catch (e) {
        if (!alive) return;
        console.error("Explain panel fetch error:", e);
        setNewsItems([]);
        setAiSummary("");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchAll();
    return () => { alive = false; };
  }, [candle, asset]);

  const filteredItems = newsItems.filter(item => {
    if (filter === "all") return true;
    if (filter === "news") return item.type === "news" || item.type === "pr";
    if (filter === "social") return item.type === "social";
    return true;
  });

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return "text-green-400";
    if (sentiment < -0.3) return "text-red-400";
    return "text-yellow-400";
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <TrendingUp className="h-4 w-4" />;
    if (sentiment < -0.3) return <TrendingDown className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (!candle) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">What moved this bar?</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-slate-300 mb-3">
          <div className="flex justify-between">
            <span>{asset.symbol} • {formatTime(candle.timestamp)}</span>
            <Badge variant="outline" className="text-xs">
              ${candle.close.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* AI Summary */}
        {aiSummary && (
          <Card className="p-3 bg-blue-950/30 border-blue-500/30">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-100">{aiSummary}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-700/50">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="all" className="text-xs">Both</TabsTrigger>
            <TabsTrigger value="news" className="text-xs">News</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-700/50 rounded mb-2" />
                <div className="h-3 bg-slate-700/30 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="p-4 space-y-3">
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className="p-3 bg-slate-800/30 border-slate-600/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onMouseEnter={() => onHighlightCandle(item.timestamp)}
                onClick={() => onHighlightCandle(item.timestamp)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-white leading-tight">
                      {item.headline}
                    </h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">#{index + 1}</Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{item.source}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-slate-500">{formatTime(item.timestamp)}</span>
                    </div>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${getSentimentColor(item.sentiment)}`}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="text-xs">{item.sentiment.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Conf: {(item.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        Rel: {(item.relevanceScore * 100).toFixed(0)}%
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        item.type === "news"
                          ? "bg-blue-500/20 text-blue-300"
                          : item.type === "social"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <Card className="p-4 bg-slate-800/30 border-slate-600/30 text-center">
              <div className="space-y-3">
                <div className="text-slate-400 text-sm">No driver found</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Potential factors: Normal market volatility, algorithmic trading,
                  technical levels, or macro conditions.
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};