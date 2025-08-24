import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Target,
  Zap,
  BarChart3
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketData {
  sentiment: number;
  volatility: number;
  momentum: number;
  volume: number;
}

interface AIInsight {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  title: string;
  description: string;
  timeframe: string;
  timestamp: Date;
}

interface Props {
  market: Market;
  marketData: MarketData;
  timeframe: string;
}

export const AIAnalytics = ({ market, marketData, timeframe }: Props) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [marketScore, setMarketScore] = useState(0);
  
  useEffect(() => {
    // Generate AI insights
    const generateInsight = () => {
      const insightTypes = [
        {
          type: 'bullish' as const,
          titles: [
            'Strong Momentum Detected',
            'Bullish Pattern Formation',
            'Volume Surge Indicator',
            'Support Level Hold'
          ],
          descriptions: [
            'AI detected increasing buying pressure with higher volume',
            'Technical patterns suggest potential upward movement',
            'Unusual volume spike indicates institutional interest',
            'Price holding key support suggests bullish continuation'
          ]
        },
        {
          type: 'bearish' as const,
          titles: [
            'Resistance Level Rejection',
            'Bearish Divergence Signal',
            'Volume Decline Warning',
            'Support Break Risk'
          ],
          descriptions: [
            'Multiple rejections at resistance suggest selling pressure',
            'Price making higher highs but indicators showing weakness',
            'Declining volume during rally indicates weakening momentum',
            'Key support level showing signs of potential breakdown'
          ]
        },
        {
          type: 'neutral' as const,
          titles: [
            'Consolidation Phase',
            'Mixed Signals Detected',
            'Range-Bound Trading',
            'Awaiting Catalyst'
          ],
          descriptions: [
            'Price consolidating within tight range, direction unclear',
            'Technical indicators showing conflicting signals',
            'Trading within established support and resistance levels',
            'Market waiting for fundamental catalyst for direction'
          ]
        }
      ];

      const selectedType = insightTypes[Math.floor(Math.random() * insightTypes.length)];
      const titleIndex = Math.floor(Math.random() * selectedType.titles.length);
      
      const newInsight: AIInsight = {
        id: Date.now().toString(),
        type: selectedType.type,
        confidence: Math.random() * 30 + 70, // 70-100%
        title: selectedType.titles[titleIndex],
        description: selectedType.descriptions[titleIndex],
        timeframe: timeframe,
        timestamp: new Date()
      };

      setInsights(prev => [newInsight, ...prev.slice(0, 4)]); // Keep latest 5
    };

    // Generate initial insights
    generateInsight();
    
    const interval = setInterval(generateInsight, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Calculate market score based on various factors
  useEffect(() => {
    const sentimentWeight = 0.3;
    const momentumWeight = 0.3;
    const volatilityWeight = 0.2; // Lower is better for score
    const volumeWeight = 0.2;

    const score = (
      (marketData.sentiment * sentimentWeight) +
      (marketData.momentum * momentumWeight) +
      ((1 - marketData.volatility) * volatilityWeight) + // Invert volatility
      (Math.min(marketData.volume, 1) * volumeWeight)
    ) * 100;

    setMarketScore(Math.round(score));
  }, [marketData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-bullish';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-yellow-500';
    return 'text-bearish';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-bullish" />;
      case 'bearish': return <TrendingUp className="w-4 h-4 text-bearish rotate-180" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* AI Market Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4" />
            AI Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(marketScore)}`}>
              {marketScore}/100
            </div>
            <div className="text-xs text-muted-foreground">Market Strength Score</div>
          </div>
          <Progress value={marketScore} className="mb-3" />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span>Sentiment:</span>
              <span className={marketData.sentiment > 0.6 ? 'text-bullish' : marketData.sentiment < 0.4 ? 'text-bearish' : 'text-muted-foreground'}>
                {(marketData.sentiment * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Momentum:</span>
              <span className={marketData.momentum > 0.6 ? 'text-bullish' : marketData.momentum < 0.4 ? 'text-bearish' : 'text-muted-foreground'}>
                {(marketData.momentum * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Volatility:</span>
              <span className={marketData.volatility > 0.7 ? 'text-bearish' : marketData.volatility < 0.3 ? 'text-bullish' : 'text-muted-foreground'}>
                {(marketData.volatility * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Volume:</span>
              <span className={marketData.volume > 1.2 ? 'text-bullish' : marketData.volume < 0.8 ? 'text-bearish' : 'text-muted-foreground'}>
                {marketData.volume.toFixed(1)}x
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4" />
            Real-Time AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {insights.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div className="text-sm">AI analyzing market data...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {insights.map((insight) => (
                <Card key={insight.id} className="p-3">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{insight.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence.toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{insight.timeframe}</span>
                        <span>{insight.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-bullish/10 rounded">
              <div className="text-sm font-semibold text-bullish">Buy Zone</div>
              <div className="text-xs text-muted-foreground">${(market.price * 0.98).toFixed(2)}</div>
            </div>
            <div className="text-center p-2 bg-bearish/10 rounded">
              <div className="text-sm font-semibold text-bearish">Sell Zone</div>
              <div className="text-xs text-muted-foreground">${(market.price * 1.02).toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};