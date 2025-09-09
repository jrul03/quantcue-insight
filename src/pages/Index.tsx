import { TradingPlatform } from "@/components/TradingPlatform";
import { StreamTickerTape } from "@/components/StreamTickerTape";
import { StreamCryptoBook } from "@/components/StreamCryptoBook";
import { StreamSymbolSearch } from "@/components/StreamSymbolSearch";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-4">
        <StreamTickerTape />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StreamCryptoBook />
          <StreamSymbolSearch />
        </div>
        <TradingPlatform />
      </div>
    </div>
  );
};

export default Index;