import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Shield, 
  Cpu, 
  TrendingUp, 
  Globe, 
  Database,
  AlertTriangle,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Play,
  Pause,
  Square
} from "lucide-react";

interface InstitutionalToolbarProps {
  onAlgoToggle: (enabled: boolean) => void;
  onRiskAlert: () => void;
  onExecuteTrade: () => void;
}

export const InstitutionalToolbar = ({ onAlgoToggle, onRiskAlert, onExecuteTrade }: InstitutionalToolbarProps) => {
  const [algoEnabled, setAlgoEnabled] = useState(false);
  const [dmaConnected, setDmaConnected] = useState(true);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAlgoToggle = () => {
    const newState = !algoEnabled;
    setAlgoEnabled(newState);
    onAlgoToggle(newState);
  };

  const handleQuickTrade = (action: 'buy' | 'sell') => {
    onExecuteTrade();
    // Simulate quick execution
  };

  return (
    <Card className="p-3 bg-card/90 backdrop-blur-sm border-primary/20">
      <div className="flex items-center justify-between">
        {/* Left Section - Trading Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Live Market</span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Quick Trade Buttons */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="hud"
              className="bg-bullish/20 hover:bg-bullish/30 text-bullish border-bullish/50"
              onClick={() => handleQuickTrade('buy')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Quick Buy
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-bearish/20 hover:bg-bearish/30 text-bearish border-bearish/50"
              onClick={() => handleQuickTrade('sell')}
            >
              <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
              Quick Sell
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Algo Trading */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={algoEnabled ? "default" : "outline"}
              onClick={handleAlgoToggle}
              className={algoEnabled ? "bg-neon-purple/20 text-neon-purple border-neon-purple/50" : ""}
            >
              {algoEnabled ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              Algo {algoEnabled ? 'ON' : 'OFF'}
            </Button>
            <Badge variant="outline" className="text-xs">
              {algoEnabled ? '3 Active' : 'Stopped'}
            </Badge>
          </div>
        </div>

        {/* Center Section - Market Data */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-neon-cyan" />
              <span className="text-muted-foreground">DMA:</span>
              <Badge variant={dmaConnected ? "default" : "destructive"} className="text-xs px-1">
                {dmaConnected ? 'LIVE' : 'DOWN'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-neon-green" />
              <span className="text-muted-foreground">Latency:</span>
              <span className="font-mono text-neon-green">0.2ms</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-neon-orange" />
              <span className="text-muted-foreground">CPU:</span>
              <span className="font-mono">23%</span>
            </div>
          </div>
        </div>

        {/* Right Section - Risk & Analytics */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${
              riskLevel === 'low' ? 'text-neon-green' : 
              riskLevel === 'medium' ? 'text-neon-orange' : 
              'text-bearish'
            }`} />
            <div>
              <div className="text-xs text-muted-foreground">Risk Level</div>
              <div className={`text-xs font-bold ${
                riskLevel === 'low' ? 'text-neon-green' : 
                riskLevel === 'medium' ? 'text-neon-orange' : 
                'text-bearish'
              }`}>
                {riskLevel.toUpperCase()}
              </div>
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Analytics Tools */}
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="p-1 h-auto">
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1 h-auto">
              <LineChart className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1 h-auto">
              <PieChart className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1 h-auto">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Risk Alert */}
          <Button
            size="sm"
            variant="outline"
            onClick={onRiskAlert}
            className="text-neon-orange border-neon-orange/50 hover:bg-neon-orange/10"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Risk Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );
};