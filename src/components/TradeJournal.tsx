import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const TradeJournal = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-medium text-slate-300">Trade Journal</h3>
      </div>
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="text-xs text-slate-400">Journal features coming soon...</div>
      </Card>
    </div>
  );
};