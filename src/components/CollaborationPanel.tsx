import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export const CollaborationPanel = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-medium text-slate-300">Team Collaboration</h3>
      </div>
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="text-xs text-slate-400">Team features coming soon...</div>
      </Card>
    </div>
  );
};