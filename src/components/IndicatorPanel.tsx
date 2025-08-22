import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  TrendingUp, 
  BarChart3, 
  Zap,
  Eye,
  Settings
} from "lucide-react";

export const IndicatorPanel = () => {
  return (
    <Card className="trading-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4" />
          Technical Indicators
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Moving Averages */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Moving Averages
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Label className="text-sm">EMA 20</Label>
                <div className="w-3 h-0.5 bg-indicator-ema-fast"></div>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                414.23
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Label className="text-sm">EMA 50</Label>
                <div className="w-3 h-0.5 bg-indicator-ema-slow"></div>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                412.87
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch />
                <Label className="text-sm">SMA 200</Label>
                <div className="w-3 h-0.5 bg-muted"></div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Off
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* RSI */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            RSI (14)
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              <Label className="text-sm">Enabled</Label>
            </div>
            <Badge 
              variant="secondary" 
              className="text-xs font-mono bg-indicator-rsi/20 text-indicator-rsi border-indicator-rsi/30"
            >
              67.5
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Oversold</span>
              <span>30</span>
            </div>
            <Slider defaultValue={[30]} max={50} min={20} step={1} className="w-full" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Overbought</span>
              <span>70</span>
            </div>
            <Slider defaultValue={[70]} max={90} min={60} step={1} className="w-full" />
          </div>
        </div>

        <Separator />

        {/* Bollinger Bands */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Bollinger Bands
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              <Label className="text-sm">Enabled</Label>
              <div className="w-3 h-0.5 bg-neon-cyan opacity-60"></div>
            </div>
            <Badge variant="secondary" className="text-xs">
              (20, 2)
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">Upper</div>
              <div className="font-mono text-bearish">418.45</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Middle</div>
              <div className="font-mono">415.23</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Lower</div>
              <div className="font-mono text-bullish">412.01</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Volume */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Volume
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              <Label className="text-sm">Show Volume</Label>
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              2.8M
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg Volume (20D)</span>
            <span className="font-mono">2.1M</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Volume Ratio</span>
            <span className="font-mono text-bullish">+33%</span>
          </div>
        </div>

        <Separator />

        {/* ATR */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" />
            ATR (14)
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch />
              <Label className="text-sm">Show ATR</Label>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              $2.35
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Used for position sizing and stop-loss calculation
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-border">
          <div className="flex gap-2">
            <button className="flex-1 text-xs p-2 bg-card hover:bg-card/80 border border-border rounded flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" />
              Presets
            </button>
            <button className="flex-1 text-xs p-2 bg-card hover:bg-card/80 border border-border rounded flex items-center justify-center gap-1">
              <Settings className="w-3 h-3" />
              Settings
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};