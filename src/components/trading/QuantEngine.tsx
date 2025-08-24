import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Activity,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface QuantStrategy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  performance: number;
  risk: 'Low' | 'Medium' | 'High';
  signals: number;
}

interface AISignal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strategy: string;
  price: number;
  timestamp: Date;
}

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Props {
  market: Market;
  timeframe: string;
}

export const QuantEngine = ({ market, timeframe }: Props) => {
  const [strategies, setStrategies] = useState<QuantStrategy[]>([
    {
      id: '1',
      name: 'Mean Reversion',
      description: 'Trades price reversions to statistical mean',
      active: true,
      performance: 8.4,
      risk: 'Medium',
      signals: 23
    },
    {
      id: '2', 
      name: 'Momentum Breakout',
      description: 'Captures momentum-based price breakouts',
      active: false,
      performance: 12.1,
      risk: 'High',
      signals: 15
    },
    {
      id: '3',
      name: 'Statistical Arbitrage',
      description: 'Exploits temporary price inefficiencies',
      active: true,
      performance: 6.7,
      risk: 'Low',
      signals: 41
    },
    {
      id: '4',
      name: 'ML Pattern Recognition',
      description: 'AI-powered pattern detection and prediction',
      active: true,
      performance: 15.3,
      risk: 'High',
      signals: 8
    }
  ]);

  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);
  const [riskAllocation, setRiskAllocation] = useState([2]);
  const [autoTrade, setAutoTrade] = useState(false);
  const [portfolioBalance, setPortfolioBalance] = useState(50000);
  const [totalPnL, setTotalPnL] = useState(2347.89);

  // Generate AI signals
  useEffect(() => {
    const generateSignal = () => {
      const types: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
      const strategyNames = strategies.map(s => s.name);
      
      const newSignal: AISignal = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        confidence: Math.random() * 40 + 60, // 60-100%
        strategy: strategyNames[Math.floor(Math.random() * strategyNames.length)],
        price: market.price + (Math.random() - 0.5) * 2,
        timestamp: new Date()
      };

      setAiSignals(prev => [newSignal, ...prev.slice(0, 9)]); // Keep latest 10
    };

    const interval = setInterval(generateSignal, 5000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [market.price, strategies]);

  const toggleStrategy = (id: string) => {
    setStrategies(prev => 
      prev.map(s => s.id === id ? { ...s, active: !s.active } : s)
    );
  };

  const activeStrategies = strategies.filter(s => s.active);
  const avgPerformance = activeStrategies.reduce((sum, s) => sum + s.performance, 0) / activeStrategies.length || 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">${portfolioBalance.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{avgPerformance.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Avg Performance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="strategies" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="signals">AI Signals</TabsTrigger>
          <TabsTrigger value="risk">Risk Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="flex-1 space-y-3">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={strategy.active}
                    onCheckedChange={() => toggleStrategy(strategy.id)}
                  />
                  <span className="font-semibold text-sm">{strategy.name}</span>
                  <Badge variant={
                    strategy.risk === 'Low' ? 'default' : 
                    strategy.risk === 'Medium' ? 'secondary' : 'destructive'
                  } className="text-xs">
                    {strategy.risk}
                  </Badge>
                </div>
                <div className={`text-sm font-mono ${strategy.performance >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                  {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{strategy.description}</div>
              <div className="flex items-center justify-between text-xs">
                <span>{strategy.signals} signals today</span>
                <Progress value={strategy.performance + 50} className="w-20 h-1" />
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="signals" className="flex-1 space-y-2">
          {aiSignals.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div>AI signals will appear here</div>
            </div>
          ) : (
            aiSignals.map((signal) => (
              <Card key={signal.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      signal.type === 'BUY' ? 'default' : 
                      signal.type === 'SELL' ? 'destructive' : 'secondary'
                    }>
                      {signal.type}
                    </Badge>
                    <span className="text-sm font-mono">${signal.price.toFixed(2)}</span>
                    <div className="text-xs text-muted-foreground">
                      {signal.strategy}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{signal.confidence.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {signal.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Auto Trading</span>
                <Switch checked={autoTrade} onCheckedChange={setAutoTrade} />
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Risk Per Trade</span>
                  <span className="text-sm font-mono">{riskAllocation[0]}%</span>
                </div>
                <Slider
                  value={riskAllocation}
                  onValueChange={setRiskAllocation}
                  max={10}
                  min={0.5}
                  step={0.5}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                Risk management automatically applied to all strategies
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};