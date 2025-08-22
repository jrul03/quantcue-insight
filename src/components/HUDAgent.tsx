import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Minimize2, 
  Maximize2, 
  X, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Target,
  Shield
} from "lucide-react";

interface Suggestion {
  id: string;
  type: 'opportunity' | 'risk' | 'analysis';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  confidence: number;
  timestamp: Date;
}

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    type: 'opportunity',
    priority: 'high',
    title: 'SPY Bullish Breakout Setup',
    description: 'EMA 20/50 golden cross forming with RSI recovering from oversold. Volume increasing on recent green candles. Bollinger Bands expanding suggests momentum.',
    action: 'Consider long position at $414.50 with stop at $411.20',
    confidence: 87,
    timestamp: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: '2',
    type: 'risk',
    priority: 'medium',
    title: 'Elevated VIX Signals Caution',
    description: 'VIX spike to 18.5 indicates increased market uncertainty. Combined with news about Fed policy changes, consider reducing position sizes.',
    action: 'Reduce exposure by 25% and tighten stop losses',
    confidence: 72,
    timestamp: new Date(Date.now() - 8 * 60 * 1000)
  },
  {
    id: '3',
    type: 'analysis',
    priority: 'low',
    title: 'Sector Rotation Pattern Detected',
    description: 'Technology stocks showing relative weakness while financials gain strength. This rotation pattern typically lasts 2-3 weeks based on historical data.',
    confidence: 65,
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  }
];

export const HUDAgent = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full hud-panel p-0"
        >
          <Brain className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high': return 'text-bearish border-bearish/30 bg-bearish/10';
      case 'medium': return 'text-neon-orange border-neon-orange/30 bg-neon-orange/10';
      case 'low': return 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10';
    }
  };

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-bullish" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-bearish" />;
      case 'analysis': return <Lightbulb className="w-4 h-4 text-neon-purple" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`hud-panel transition-all duration-300 ${isExpanded ? 'w-96' : 'w-80'}`}>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">QuantCue AI</h3>
                <p className="text-xs text-muted-foreground">Trading Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 p-0"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3 h-3 text-neon-green" />
              <span className="text-muted-foreground">Monitoring</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">5 Signals</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Shield className="w-3 h-3 text-neon-orange" />
              <span className="text-muted-foreground">Risk: Medium</span>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {mockSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 bg-card/50 rounded-lg border border-border/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(suggestion.type)}
                        <span className="font-medium text-sm">{suggestion.title}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                      {suggestion.description}
                    </p>
                    
                    {suggestion.action && (
                      <div className="p-2 bg-primary/10 rounded text-xs border border-primary/20">
                        <strong className="text-primary">Suggested Action:</strong> {suggestion.action}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <div className="text-xs text-muted-foreground">
                        {suggestion.timestamp.toLocaleTimeString('en-US', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs font-bold text-primary">
                        {suggestion.confidence}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Last update: 09:43:22</span>
                <span>Next scan: 30s</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};