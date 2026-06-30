import { Component } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button, Card } from './UI';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 transition-colors duration-250">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none" />
          
          <Card className="max-w-lg w-full text-center p-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 rounded-2xl">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50 shadow-sm">
              <ShieldAlert size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold heading-font text-slate-900 dark:text-white">
                Application Runtime Exception
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                The LeadScape AI intelligence module encountered a structural error. Telemetry loops have been halted to protect data integrity.
              </p>
            </div>

            {/* Error Message Details Panel */}
            {this.state.error && (
              <div className="text-left bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 font-mono text-[10px] text-slate-600 dark:text-slate-400 max-h-[160px] overflow-y-auto custom-scrollbar select-all leading-normal">
                <p className="font-extrabold text-rose-600 dark:text-rose-400 mb-1">{this.state.error.toString()}</p>
                <p className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowLeft}
                onClick={() => { window.location.href = '/dashboard'; }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={this.handleReset}
              >
                Restart System Session
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
