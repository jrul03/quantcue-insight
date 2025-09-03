import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
  error?: any;
}

export class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any): BoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 text-center">
            <div className="text-slate-200 font-semibold mb-1">
              Something went wrong
            </div>
            <div className="text-xs text-slate-400 mb-3">A UI section failed to render. You can try again.</div>
            <Button size="sm" onClick={this.handleReset}>Try again</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
