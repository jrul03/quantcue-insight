import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  TrendingDown, 
  Target, 
  Shield,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface Props {
  market: Market;
}

export const OrderPanel = ({ market }: Props) => {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('100');
  const [price, setPrice] = useState(market.price.toString());
  const [stopLoss, setStopLoss] = useState([2]);
  const [takeProfit, setTakeProfit] = useState([3]);
  const [useRiskManagement, setUseRiskManagement] = useState(true);
  
  const [positions, setPositions] = useState<Position[]>([
    {
      id: '1',
      symbol: 'SPY',
      side: 'LONG',
      quantity: 100,
      entryPrice: 413.50,
      currentPrice: market.price,
      pnl: (market.price - 413.50) * 100,
      pnlPercent: ((market.price - 413.50) / 413.50) * 100
    },
    {
      id: '2',
      symbol: 'QQQ',
      side: 'LONG',
      quantity: 50,
      entryPrice: 367.20,
      currentPrice: 370.45,
      pnl: (370.45 - 367.20) * 50,
      pnlPercent: ((370.45 - 367.20) / 367.20) * 100
    }
  ]);

  const calculateOrderValue = () => {
    const qty = parseFloat(quantity) || 0;
    const orderPrice = orderType === 'market' ? market.price : parseFloat(price) || 0;
    return qty * orderPrice;
  };

  const executeOrder = () => {
    const orderValue = calculateOrderValue();
    console.log('Executing order:', {
      type: orderType,
      side,
      symbol: market.symbol,
      quantity: parseFloat(quantity),
      price: orderType === 'market' ? market.price : parseFloat(price),
      value: orderValue,
      stopLoss: useRiskManagement ? stopLoss[0] : null,
      takeProfit: useRiskManagement ? takeProfit[0] : null
    });
    
    // In a real app, this would execute the trade via API
    alert(`${side.toUpperCase()} order for ${quantity} shares of ${market.symbol} submitted!`);
  };

  const closePosition = (positionId: string) => {
    setPositions(prev => prev.filter(p => p.id !== positionId));
  };

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="order" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="order">Place Order</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="order" className="flex-1 p-4 space-y-4">
          {/* Order Type & Side */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={orderType} onValueChange={(value: 'market' | 'limit' | 'stop') => setOrderType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market Order</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
                <SelectItem value="stop">Stop Order</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={side === 'buy' ? 'default' : 'outline'}
                onClick={() => setSide('buy')}
                className="text-xs"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                BUY
              </Button>
              <Button
                variant={side === 'sell' ? 'destructive' : 'outline'}
                onClick={() => setSide('sell')}
                className="text-xs"
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                SELL
              </Button>
            </div>
          </div>

          {/* Quantity & Price */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Quantity</label>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                type="number"
              />
            </div>
            
            {orderType !== 'market' && (
              <div>
                <label className="text-xs text-muted-foreground">Price</label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={market.price.toFixed(2)}
                  type="number"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Symbol:</span>
                  <span className="font-mono">{market.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-mono">{quantity || '0'} shares</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Price:</span>
                  <span className="font-mono">
                    ${orderType === 'market' ? market.price.toFixed(2) : (price || '0.00')}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Est. Total:</span>
                  <span className="font-mono">${calculateOrderValue().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Risk Management
                </CardTitle>
                <Switch
                  checked={useRiskManagement}
                  onCheckedChange={setUseRiskManagement}
                />
              </div>
            </CardHeader>
            {useRiskManagement && (
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Stop Loss</span>
                    <span>{stopLoss[0]}%</span>
                  </div>
                  <Slider
                    value={stopLoss}
                    onValueChange={setStopLoss}
                    max={10}
                    min={0.5}
                    step={0.5}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Take Profit</span>
                    <span>{takeProfit[0]}%</span>
                  </div>
                  <Slider
                    value={takeProfit}
                    onValueChange={setTakeProfit}
                    max={15}
                    min={1}
                    step={0.5}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Execute Button */}
          <Button
            onClick={executeOrder}
            className={`w-full ${side === 'buy' ? 'bg-bullish hover:bg-bullish/80' : 'bg-bearish hover:bg-bearish/80'}`}
            disabled={!quantity || parseFloat(quantity) <= 0}
          >
            <Zap className="w-4 h-4 mr-2" />
            {side.toUpperCase()} {market.symbol}
          </Button>
        </TabsContent>

        <TabsContent value="positions" className="flex-1 p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Open Positions</h3>
              <Badge variant={totalPnL >= 0 ? 'default' : 'destructive'}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {positions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No open positions</div>
              </div>
            ) : (
              positions.map((position) => (
                <Card key={position.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{position.symbol}</span>
                        <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'}>
                          {position.side}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closePosition(position.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Close
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Qty:</span>
                        <span className="font-mono">{position.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entry:</span>
                        <span className="font-mono">${position.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current:</span>
                        <span className="font-mono">${position.currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P&L:</span>
                        <span className={`font-mono ${position.pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};