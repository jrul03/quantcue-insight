import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Cpu, 
  Play, 
  Pause, 
  Square,
  TrendingUp,
  Settings,
  Activity,
  BarChart3,
  Target,
  Zap,
  DollarSign
} from "lucide-react";

interface Algorithm {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  performance: number;
  trades: number;
  pnl: number;
  winRate: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface AlgoTradingPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const mockAlgorithms: Algorithm[] = [
  {
    id: 'momentum',
    name: 'Momentum Scalper',
    status: 'running',
    performance: 12.5,
    trades: 47,
    pnl: 2350,
    winRate: 68.2,
    description: 'High-frequency momentum strategy using EMA crossovers',
    riskLevel: 'medium'
  },
  {
    id: 'arbitrage',
    name: 'ETF Arbitrage',
    status: 'running',
    performance: 8.3,
    trades: 23,
    pnl: 890,
    winRate: 87.5,
    description: 'Statistical arbitrage between correlated ETFs',
    riskLevel: 'low'
  },
  {
    id: 'meanrevert',
    name: 'Mean Reversion',
    status: 'paused',
    performance: -2.1,
    trades: 12,
    pnl: -420,
    winRate: 41.7,
    description: 'Contrarian strategy targeting oversold/overbought conditions',
    riskLevel: 'high'
  },
  {
    id: 'news',
    name: 'News Sentiment',
    status: 'stopped',
    performance: 15.7,
    trades: 8,
    pnl: 1200,
    winRate: 75.0,
    description: 'AI-driven sentiment analysis from news and social media',
    riskLevel: 'medium'
  }
];

export const AlgoTradingPanel = ({ isVisible, onClose }: AlgoTradingPanelProps) => {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms);
  const [selectedAlgo, setSelectedAlgo] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleAlgoAction = (id: string, action: 'start' | 'pause' | 'stop') => {
    setAlgorithms(prev => prev.map(algo => 
      algo.id === id 
        ? { ...algo, status: action === 'start' ? 'running' : action as any }
        : algo
    ));
  };

  const getStatusColor = (status: Algorithm['status']) => {
    switch (status) {
      case 'running': return 'text-neon-green bg-neon-green/10 border-neon-green/30';
      case 'paused': return 'text-neon-orange bg-neon-orange/10 border-neon-orange/30';
      case 'stopped': return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getRiskColor = (risk: Algorithm['riskLevel']) => {
    switch (risk) {
      case 'low': return 'text-neon-green';
      case 'medium': return 'text-neon-orange';
      case 'high': return 'text-bearish';
    }
  };

  const runningAlgos = algorithms.filter(a => a.status === 'running').length;
  const totalPnL = algorithms.reduce((sum, a) => sum + a.pnl, 0);
  const totalTrades = algorithms.reduce((sum, a) => sum + a.trades, 0);
  const avgWinRate = algorithms.reduce((sum, a) => sum + a.winRate, 0) / algorithms.length;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[75vh] max-w-5xl">
        <Card className="h-full bg-card/95 backdrop-blur-lg border-primary/20">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-lg flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xl">Algorithmic Trading Control</CardTitle>
                  <p className="text-sm text-muted-foreground">Automated strategy management and execution</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-6 h-full">
              {/* Performance Overview */}
              <div className="col-span-4 grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-neon-green/10 border-neon-green/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Algos</p>
                      <p className="text-2xl font-bold text-neon-green">{runningAlgos}</p>
                    </div>
                    <Activity className="w-8 h-8 text-neon-green" />
                  </div>
                </Card>
                
                <Card className="p-4 bg-primary/10 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p className={`text-2xl font-bold font-mono ${totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        ${totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="p-4 bg-neon-cyan/10 border-neon-cyan/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold text-neon-cyan">{totalTrades}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-neon-cyan" />
                  </div>
                </Card>
                
                <Card className="p-4 bg-neon-orange/10 border-neon-orange/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                      <p className="text-2xl font-bold text-neon-orange">{avgWinRate.toFixed(1)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-neon-orange" />
                  </div>
                </Card>
              </div>

              {/* Algorithm List */}
              <div className="col-span-3 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Strategy Portfolio
                </h3>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {algorithms.map((algo) => (
                      <Card 
                        key={algo.id} 
                        className={`p-4 cursor-pointer transition-all ${
                          selectedAlgo === algo.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedAlgo(algo.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-current opacity-50"></div>
                            <div>
                              <h4 className="font-semibold">{algo.name}</h4>
                              <p className="text-xs text-muted-foreground">{algo.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(algo.status)}>
                              {algo.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={getRiskColor(algo.riskLevel)}>
                              {algo.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Performance</p>
                            <p className={`font-mono font-bold ${algo.performance >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                              {algo.performance >= 0 ? '+' : ''}{algo.performance.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Trades</p>
                            <p className="font-mono">{algo.trades}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">P&L</p>
                            <p className={`font-mono font-bold ${algo.pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                              ${algo.pnl >= 0 ? '+' : ''}{algo.pnl}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Win Rate</p>
                            <p className="font-mono">{algo.winRate.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                          <Progress value={algo.winRate} className="w-32 h-2" />
                          <div className="flex gap-1">
                            {algo.status !== 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAlgoAction(algo.id, 'start');
                                }}
                                className="text-neon-green border-neon-green/50 hover:bg-neon-green/10"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {algo.status === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAlgoAction(algo.id, 'pause');
                                }}
                                className="text-neon-orange border-neon-orange/50 hover:bg-neon-orange/10"
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlgoAction(algo.id, 'stop');
                              }}
                              className="text-bearish border-bearish/50 hover:bg-bearish/10"
                            >
                              <Square className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Algorithm Configuration */}
              <div className="space-y-4">
                <h3 className="font-semibold">Configuration</h3>
                
                {selectedAlgo ? (
                  <Card className="p-4 bg-card/50">
                    <h4 className="font-medium mb-3">
                      {algorithms.find(a => a.id === selectedAlgo)?.name}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Max Position Size</Label>
                        <Input type="number" defaultValue="10000" className="h-8 text-xs" />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Stop Loss %</Label>
                        <Input type="number" defaultValue="2.0" step="0.1" className="h-8 text-xs" />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Take Profit %</Label>
                        <Input type="number" defaultValue="4.0" step="0.1" className="h-8 text-xs" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Auto-Rebalance</Label>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Risk Management</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <Button className="w-full mt-4" size="sm">
                      Update Configuration
                    </Button>
                  </Card>
                ) : (
                  <Card className="p-4 bg-card/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Select an algorithm to configure its parameters
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};