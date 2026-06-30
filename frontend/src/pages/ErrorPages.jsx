import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, WifiOff, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button, Card } from '../components/common/UI';

// ─── 404 PAGE ────────────────────────────────────────────────────────────────
export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.04),transparent_40%)] pointer-events-none" />
      
      <div className="text-center space-y-6 max-w-sm relative z-10">
        <h1 className="text-8xl font-black heading-font tracking-tighter text-indigo-600 dark:text-indigo-400 opacity-90">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-lg font-extrabold heading-font text-slate-905 dark:text-white">
            Lost in Space
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            The page or workspace segment you are trying to access does not exist or has been archived.
          </p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" icon={Home} onClick={() => navigate('/dashboard')}>
            Command Center
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── 500 PAGE ────────────────────────────────────────────────────────────────
export const ServerError = ({ errorMsg = "Internal Telemetry Breakdown" }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100">
      <Card className="max-w-md w-full text-center p-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-extrabold heading-font text-slate-900 dark:text-white">
            Server Telemetry Error (500)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            We are having trouble communicating with the LeadScape AI background engine. A supervisor has been alerted.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-left font-mono text-[10px] text-slate-500 dark:text-slate-400">
          <strong className="text-rose-600 dark:text-rose-455 font-bold block mb-1">Diagnostic Log:</strong>
          {errorMsg}
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ─── OFFLINE PAGE ────────────────────────────────────────────────────────────
export const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      alert("Still offline. Please check your internet adapter settings.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.02),transparent_45%)] pointer-events-none" />
      
      <Card className="max-w-md w-full text-center p-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 rounded-2xl animate-fade-in">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50 shadow-sm animate-pulse">
          <WifiOff size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold heading-font text-slate-900 dark:text-white">
            Connection Interrupted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
            You are currently working offline (Status: {isOnline ? 'Online' : 'Offline'}). LeadScape AI telemetry sync will automatically resume when connection is restored.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          icon={RefreshCw} 
          onClick={handleRetry}
          className="mx-auto"
        >
          Check Connectivity
        </Button>
      </Card>
    </div>
  );
};

