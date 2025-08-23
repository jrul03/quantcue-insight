import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Percent,
  BarChart3,
  Activity,
  Target,
  X
} from "lucide-react";

interface RiskMetric {
  id: string;
  name: string;
  value: number;
  limit: number;
  unit: string;
  status: 'safe' | 'warning' | 'danger';
  description: string;
}

interface Exposure {
  symbol: string;
  position: number;
  value: number;
  risk: number;
  beta: number;
  sector: string;
}

interface RiskDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const mockRiskMetrics: RiskMetric[] = [
  {
    id: 'var',
    name: 'Value at Risk (95%)',
    value: 12.5,
    limit: 25.0,
    unit: 'K',
    status: 'safe',
    description: '1-day VaR at 95% confidence level'
  },
  {
    id: 'beta',
    name: 'Portfolio Beta',
    value: 1.23,
    limit: 1.50,
    unit: '',
    status: 'warning',
    description: 'Market correlation coefficient'
  },
  {
    id: 'concentration',
    name: 'Single Name Risk',
    value: 15.2,
    limit: 20.0,
    unit: '%',
    status: 'warning',
    description: 'Largest single position exposure'
  },
  {
    id: 'leverage',
    name: 'Gross Leverage',
    value: 2.1,
    limit: 4.0,
    unit: 'x',
    status: 'safe',
    description: 'Total gross exposure / capital'
  },
  {
    id: 'sharpe',
    name: 'Sharpe Ratio',
    value: 1.42,
    limit: 1.0,
    unit: '',
    status: 'safe',
    description: 'Risk-adjusted return measure'
  }
];

const mockExposures: Exposure[] = [
  { symbol: 'SPY', position: 1500, value: 623850, risk: 12.5, beta: 1.0, sector: 'Diversified' },
  { symbol: 'AAPL', position: 200, value: 35168, risk: 8.2, beta: 1.2, sector: 'Technology' },
  { symbol: 'NVDA', position: 50, value: 44557, risk: 15.3, beta: 1.8, sector: 'Technology' },
  { symbol: 'QQQ', position: 300, value: 110367, risk: 9.1, beta: 1.1, sector: 'Technology' },
];

export const RiskDashboard = ({ isVisible, onClose }: RiskDashboardProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  if (!isVisible) return null;

  const getStatusColor = (status: RiskMetric['status']) => {
    switch (status) {
      case 'safe': return 'text-neon-green';
      case 'warning': return 'text-neon-orange';
      case 'danger': return 'text-bearish';
    }
  };

  const getStatusBg = (status: RiskMetric['status']) => {
    switch (status) {
      case 'safe': return 'bg-neon-green/10 border-neon-green/30';
      case 'warning': return 'bg-neon-orange/10 border-neon-orange/30';
      case 'danger': return 'bg-bearish/10 border-bearish/30';
    }
  };

  const totalPortfolioValue = mockExposures.reduce((sum, exp) => sum + exp.value, 0);
  const totalRisk = mockExposures.reduce((sum, exp) => sum + exp.risk, 0);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] max-w-6xl">
        <Card className="h-full bg-card/95 backdrop-blur-lg border-primary/20">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neon-orange to-bearish rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xl">Risk Management Dashboard</CardTitle>
                  <p className="text-sm text-muted-foreground">Real-time portfolio risk monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {['1D', '1W', '1M'].map((timeframe) => (
                    <Button
                      key={timeframe}
                      size="sm"
                      variant={selectedTimeframe === timeframe ? "default" : "outline"}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className="text-xs"
                    >
                      {timeframe}
                    </Button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column - Risk Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Risk Metrics
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {mockRiskMetrics.map((metric) => (
                      <Card key={metric.id} className={`p-4 ${getStatusBg(metric.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{metric.name}</span>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(metric.status)}`}>
                            {metric.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold font-mono">
                            {metric.value.toFixed(2)}{metric.unit}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Limit: {metric.limit}{metric.unit}
                          </span>
                        </div>
                        
                        <Progress 
                          value={(metric.value / metric.limit) * 100} 
                          className="h-2 mb-2"
                        />
                        
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Middle Column - Portfolio Exposure */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Position Exposure
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    Total: ${(totalPortfolioValue / 1000).toFixed(0)}K
                  </div>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {mockExposures.map((exposure) => (
                      <Card key={exposure.symbol} className="p-3 trading-panel">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{exposure.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {exposure.sector}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono">
                            β {exposure.beta}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Position</div>
                            <div className="font-mono">{exposure.position} shares</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Value</div>
                            <div className="font-mono">${(exposure.value / 1000).toFixed(0)}K</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Risk</div>
                            <div className="font-mono text-neon-orange">{exposure.risk.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Weight</div>
                            <div className="font-mono">{((exposure.value / totalPortfolioValue) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                        
                        <Progress 
                          value={(exposure.value / totalPortfolioValue) * 100} 
                          className="h-1 mt-2"
                        />
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Right Column - Risk Analytics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Risk Analytics
                  </h3>
                  <Button size="sm" variant="outline" className="text-xs">
                    Generate Report
                  </Button>
                </div>

                {/* Portfolio Overview */}
                <Card className="p-4 bg-card/50">
                  <h4 className="font-medium mb-3">Portfolio Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-mono font-bold">${(totalPortfolioValue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Risk</span>
                      <span className="font-mono font-bold text-neon-orange">{totalRisk.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Positions</span>
                      <span className="font-mono">{mockExposures.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Beta</span>
                      <span className="font-mono">{(mockExposures.reduce((sum, exp) => sum + exp.beta, 0) / mockExposures.length).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {/* Risk Heat Map */}
                <Card className="p-4 bg-card/50">
                  <h4 className="font-medium mb-3">Sector Risk Distribution</h4>
                  <div className="space-y-2">
                    {Array.from(new Set(mockExposures.map(e => e.sector))).map((sector) => {
                      const sectorRisk = mockExposures
                        .filter(e => e.sector === sector)
                        .reduce((sum, e) => sum + e.risk, 0);
                      
                      return (
                        <div key={sector} className="flex items-center justify-between">
                          <span className="text-sm">{sector}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded">
                              <div 
                                className="h-full bg-neon-orange rounded"
                                style={{ width: `${(sectorRisk / totalRisk) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono w-8">{sectorRisk.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Suggested Hedges */}
                <Card className="p-4 bg-card/50">
                  <h4 className="font-medium mb-3">Suggested Hedges</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-neon-green/10 rounded border border-neon-green/30">
                      <span>Short QQQ Puts</span>
                      <Badge variant="outline" className="text-neon-green border-neon-green/50">
                        -15% Beta
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-neon-orange/10 rounded border border-neon-orange/30">
                      <span>VIX Call Options</span>
                      <Badge variant="outline" className="text-neon-orange border-neon-orange/50">
                        Vol Hedge
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};