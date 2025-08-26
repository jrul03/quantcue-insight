import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Play, Pause, Save, Download, Upload, Settings, 
  TrendingUp, TrendingDown, BarChart3, Target,
  Zap, Brain, Activity, AlertTriangle, CheckCircle
} from "lucide-react";

interface StrategyRule {
  id: string;
  type: 'entry' | 'exit' | 'risk';
  condition: string;
  operator: 'and' | 'or';
  value: number;
  enabled: boolean;
}

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
}

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: StrategyRule[];
  backtest?: BacktestResult;
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'ema_cross',
    name: 'EMA Crossover',
    description: 'Buy when EMA20 crosses above EMA50, sell when it crosses below',
    category: 'Trend Following',
    rules: [
      { id: '1', type: 'entry', condition: 'EMA20 > EMA50', operator: 'and', value: 0, enabled: true },
      { id: '2', type: 'entry', condition: 'RSI < 70', operator: 'and', value: 70, enabled: true },
      { id: '3', type: 'exit', condition: 'EMA20 < EMA50', operator: 'or', value: 0, enabled: true },
      { id: '4', type: 'risk', condition: 'Stop Loss', operator: 'and', value: 2, enabled: true }
    ],
    backtest: {
      totalTrades: 156,
      winRate: 0.64,
      profitFactor: 1.85,
      sharpeRatio: 1.42,
      maxDrawdown: 0.087,
      totalReturn: 0.234,
      avgWin: 0.018,
      avgLoss: -0.011,
      largestWin: 0.089,
      largestLoss: -0.045
    }
  },
  {
    id: 'rsi_oversold',
    name: 'RSI Mean Reversion',
    description: 'Buy oversold conditions (RSI < 30), sell overbought (RSI > 70)',
    category: 'Mean Reversion',
    rules: [
      { id: '1', type: 'entry', condition: 'RSI < 30', operator: 'and', value: 30, enabled: true },
      { id: '2', type: 'entry', condition: 'Volume > SMA(Volume, 20)', operator: 'and', value: 0, enabled: true },
      { id: '3', type: 'exit', condition: 'RSI > 70', operator: 'or', value: 70, enabled: true },
      { id: '4', type: 'risk', condition: 'Take Profit', operator: 'and', value: 3, enabled: true }
    ],
    backtest: {
      totalTrades: 89,
      winRate: 0.71,
      profitFactor: 2.14,
      sharpeRatio: 1.67,
      maxDrawdown: 0.052,
      totalReturn: 0.187,
      avgWin: 0.024,
      avgLoss: -0.008,
      largestWin: 0.078,
      largestLoss: -0.023
    }
  }
];

const CONDITIONS = [
  'EMA20 > EMA50', 'EMA50 > EMA200', 'RSI < 30', 'RSI > 70',
  'MACD > Signal', 'Volume > SMA(Volume, 20)', 'Price > VWAP',
  'Bollinger Upper Band', 'Bollinger Lower Band', 'Support Level',
  'Resistance Level', 'Price Change %', 'Volume Spike'
];

interface QuantStrategyBuilderProps {
  symbol: string;
  className?: string;
}

export const QuantStrategyBuilder = ({ 
  symbol, 
  className = "" 
}: QuantStrategyBuilderProps) => {
  const [currentStrategy, setCurrentStrategy] = useState<StrategyTemplate | null>(null);
  const [rules, setRules] = useState<StrategyRule[]>([]);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLiveTrading, setIsLiveTrading] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');

  const loadTemplate = (template: StrategyTemplate) => {
    setCurrentStrategy(template);
    setRules(template.rules);
    setStrategyName(template.name);
    setStrategyDescription(template.description);
    setBacktestResult(template.backtest || null);
  };

  const addRule = () => {
    const newRule: StrategyRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'entry',
      condition: CONDITIONS[0],
      operator: 'and',
      value: 0,
      enabled: true
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<StrategyRule>) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const runBacktest = async () => {
    setIsBacktesting(true);
    setBacktestProgress(0);

    // Simulate backtest progress
    const progressInterval = setInterval(() => {
      setBacktestProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    // Simulate backtest completion
    setTimeout(() => {
      clearInterval(progressInterval);
      setBacktestProgress(100);
      
      // Generate mock backtest results
      const mockResult: BacktestResult = {
        totalTrades: Math.floor(Math.random() * 200 + 50),
        winRate: 0.5 + Math.random() * 0.3,
        profitFactor: 0.8 + Math.random() * 2,
        sharpeRatio: Math.random() * 2,
        maxDrawdown: Math.random() * 0.15,
        totalReturn: -0.1 + Math.random() * 0.5,
        avgWin: 0.01 + Math.random() * 0.03,
        avgLoss: -0.005 - Math.random() * 0.02,
        largestWin: 0.03 + Math.random() * 0.08,
        largestLoss: -0.01 - Math.random() * 0.05
      };

      setBacktestResult(mockResult);
      setIsBacktesting(false);
    }, 3000);
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'entry': return 'text-success';
      case 'exit': return 'text-destructive';
      case 'risk': return 'text-warning';
      default: return 'text-foreground';
    }
  };

  const getMetricColor = (value: number, isPercentage = false, higherIsBetter = true) => {
    const threshold = isPercentage ? 0.5 : 1;
    if (higherIsBetter) {
      return value > threshold ? 'text-success' : value > threshold * 0.7 ? 'text-warning' : 'text-destructive';
    } else {
      return value < threshold ? 'text-success' : value < threshold * 1.3 ? 'text-warning' : 'text-destructive';
    }
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Strategy Builder
          <Badge variant="outline">{symbol}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="build" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {STRATEGY_TEMPLATES.map((template) => (
                  <Card key={template.id} className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => loadTemplate(template)}
                      >
                        Load
                      </Button>
                    </div>
                    
                    {template.backtest && (
                      <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                        <div>
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className={`ml-1 font-mono ${getMetricColor(template.backtest.winRate, true)}`}>
                            {(template.backtest.winRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit Factor:</span>
                          <span className={`ml-1 font-mono ${getMetricColor(template.backtest.profitFactor)}`}>
                            {template.backtest.profitFactor.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sharpe:</span>
                          <span className={`ml-1 font-mono ${getMetricColor(template.backtest.sharpeRatio)}`}>
                            {template.backtest.sharpeRatio.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="build" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="strategy-name">Strategy Name</Label>
                <Input
                  id="strategy-name"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="My Custom Strategy"
                />
              </div>
              <div>
                <Label htmlFor="strategy-description">Description</Label>
                <Input
                  id="strategy-description"
                  value={strategyDescription}
                  onChange={(e) => setStrategyDescription(e.target.value)}
                  placeholder="Strategy description..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Rules</h4>
              <Button size="sm" onClick={addRule}>
                Add Rule
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <Card key={rule.id} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                      />
                      <Badge variant="outline" className={getRuleColor(rule.type)}>
                        {rule.type}
                      </Badge>
                      {index > 0 && (
                        <Select 
                          value={rule.operator} 
                          onValueChange={(operator: 'and' | 'or') => updateRule(rule.id, { operator })}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="and">AND</SelectItem>
                            <SelectItem value="or">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Select 
                        value={rule.condition}
                        onValueChange={(condition) => updateRule(rule.id, { condition })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: parseFloat(e.target.value) || 0 })}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeRule(rule.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Strategy
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="backtest" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Backtest Results</h4>
              <Button 
                onClick={runBacktest}
                disabled={isBacktesting || rules.length === 0}
              >
                {isBacktesting ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Backtest
                  </>
                )}
              </Button>
            </div>

            {isBacktesting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{backtestProgress.toFixed(0)}%</span>
                </div>
                <Progress value={backtestProgress} />
              </div>
            )}

            {backtestResult && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h5 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Performance
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Return:</span>
                      <span className={`font-mono ${getMetricColor(backtestResult.totalReturn)}`}>
                        {(backtestResult.totalReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sharpe Ratio:</span>
                      <span className={`font-mono ${getMetricColor(backtestResult.sharpeRatio)}`}>
                        {backtestResult.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Drawdown:</span>
                      <span className={`font-mono ${getMetricColor(backtestResult.maxDrawdown, true, false)}`}>
                        {(backtestResult.maxDrawdown * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit Factor:</span>
                      <span className={`font-mono ${getMetricColor(backtestResult.profitFactor)}`}>
                        {backtestResult.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h5 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-secondary" />
                    Trade Stats
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Trades:</span>
                      <span className="font-mono">{backtestResult.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Win Rate:</span>
                      <span className={`font-mono ${getMetricColor(backtestResult.winRate, true)}`}>
                        {(backtestResult.winRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Win:</span>
                      <span className="font-mono text-success">
                        {(backtestResult.avgWin * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Loss:</span>
                      <span className="font-mono text-destructive">
                        {(backtestResult.avgLoss * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Live Trading</h4>
                <Badge variant={isLiveTrading ? "default" : "secondary"}>
                  {isLiveTrading ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
              <Switch 
                checked={isLiveTrading}
                onCheckedChange={setIsLiveTrading}
              />
            </div>

            {isLiveTrading && (
              <Card className="p-4 border-warning/50 bg-warning/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-semibold text-warning">Live Trading Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your strategy is now executing live trades. Monitor performance carefully.
                </p>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h5 className="font-semibold mb-3">Risk Management</h5>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="position-size">Position Size (%)</Label>
                    <Input id="position-size" type="number" defaultValue="2" />
                  </div>
                  <div>
                    <Label htmlFor="max-positions">Max Positions</Label>
                    <Input id="max-positions" type="number" defaultValue="5" />
                  </div>
                  <div>
                    <Label htmlFor="daily-loss-limit">Daily Loss Limit (%)</Label>
                    <Input id="daily-loss-limit" type="number" defaultValue="5" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h5 className="font-semibold mb-3">Trading Hours</h5>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input id="start-time" type="time" defaultValue="09:30" />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input id="end-time" type="time" defaultValue="15:30" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="weekend-trading" />
                    <Label htmlFor="weekend-trading">Trade on weekends</Label>
                  </div>
                </div>
              </Card>
            </div>

            {isLiveTrading && (
              <Card className="p-4">
                <h5 className="font-semibold mb-3">Live Performance</h5>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Today P&L:</span>
                    <div className="font-mono text-success">+$1,247.50</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Active Positions:</span>
                    <div className="font-mono">3</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Win Rate (7d):</span>
                    <div className="font-mono text-success">68.5%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Drawdown:</span>
                    <div className="font-mono text-warning">-2.1%</div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};