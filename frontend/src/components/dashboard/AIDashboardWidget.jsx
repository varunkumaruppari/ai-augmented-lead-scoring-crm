import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, AlertCircle, TrendingUp, RefreshCw, 
  ChevronRight, Phone, Mail, Award, CheckCircle, ShieldAlert
} from 'lucide-react';
import { getGlobalAIInsights } from '../../services/leadService';
import Spinner from '../common/Spinner';

export default function AIDashboardWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('opportunities'); // opportunities, risks, actions
  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await getGlobalAIInsights();
      setData(res.data.data);
    } catch (err) {
      console.error('Error loading global AI insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialLoad = async () => {
      try {
        const res = await getGlobalAIInsights();
        if (active) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error loading global AI insights on mount:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialLoad();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="card h-96 flex flex-col items-center justify-center space-y-4">
        <Spinner size="md" />
        <p className="text-xs text-slate-500 font-medium animate-pulse">Parsing global AI telemetry...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-6 text-center space-y-3">
        <ShieldAlert className="mx-auto text-rose-500" size={32} />
        <p className="text-sm font-semibold text-slate-800">AI Intelligence Core Offline</p>
        <button onClick={() => load()} className="btn-secondary text-xs px-3 py-1.5 mx-auto flex items-center gap-2">
          <RefreshCw size={12} /> Retry Connection
        </button>
      </div>
    );
  }

  const { summary, recommended_actions, risk_alerts, top_opportunities } = data;

  // Next action style mapping
  const actionStyles = {
    'Call Now': { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Phone },
    'Schedule Visit': { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: ChevronRight },
    'Send Proposal': { bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Mail },
    'Nurture Lead': { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Sparkles },
    'Escalate To Senior Agent': { bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: Award }
  };

  return (
    <div className="card bg-slate-900 border-none text-slate-100 shadow-xl rounded-2xl overflow-hidden relative group">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl -z-10 group-hover:bg-violet-600/10 transition-all duration-700"></div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>

      {/* Header */}
      <div className="border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-900/40">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 tracking-wider uppercase heading-font flex items-center gap-1.5">
              AI CRM Executive Intelligence
              <span className="text-[10px] bg-violet-500/20 text-violet-400 font-extrabold px-1.5 py-0.5 rounded border border-violet-500/30">Lohitha AI</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Automatic lead profiling & risk mitigation feed</p>
          </div>
        </div>
        <button 
          onClick={() => load(true)} 
          disabled={refreshing} 
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition active:scale-95 disabled:opacity-50"
          title="Refresh AI insights"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid Stats Snapshot */}
      <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 divide-x divide-slate-800/80">
        <div className="p-3 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Leads Analyzed</span>
          <span className="text-lg font-extrabold text-white">{summary.total_analyzed}</span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Opportunities</span>
          <span className="text-lg font-extrabold text-emerald-400 flex items-center justify-center gap-1">
            <TrendingUp size={14} />
            {summary.total_opportunities}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Risk Alerts</span>
          <span className="text-lg font-extrabold text-rose-400 flex items-center justify-center gap-1">
            <AlertCircle size={14} />
            {summary.total_risk_alerts}
          </span>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-slate-800/60 bg-slate-900 px-3 pt-2 gap-1.5">
        {[
          { key: 'opportunities', label: 'Top Opportunities', icon: TrendingUp },
          { key: 'risks', label: 'Risk Alerts Feed', icon: AlertCircle },
          { key: 'actions', label: 'Action Matrix', icon: CheckCircle }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-all duration-300 ${
                activeTab === tab.key 
                  ? 'border-violet-500 text-violet-400 bg-slate-800/20' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TabIcon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-4 h-72 overflow-y-auto custom-scrollbar">

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-3">
            {top_opportunities.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No conversion opportunities computed yet.</p>
            ) : (
              top_opportunities.map(op => (
                <div key={op.lead_id} className="p-2.5 bg-slate-950/40 hover:bg-slate-900 border border-slate-800/60 rounded-xl flex items-center justify-between transition group/row">
                  <div className="space-y-0.5">
                    <Link to={`/leads/${op.lead_id}`} className="font-bold text-xs text-white hover:text-violet-400 flex items-center gap-1 transition-colors">
                      {op.lead_name}
                      <ChevronRight size={12} className="opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 transition-all text-violet-400" />
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Agent: <strong className="text-slate-300 font-semibold">{op.agent_name}</strong></span>
                      <span>·</span>
                      <span>Value: <strong className="text-emerald-400 font-bold">₹{Number(op.expected_revenue).toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                  
                  {/* Probability tag & bar */}
                  <div className="text-right flex items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold">Conversion Chance</span>
                        <span className="text-xs font-black text-emerald-400">{op.conversion_probability}%</span>
                      </div>
                      <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" 
                          style={{ width: `${op.conversion_probability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && (
          <div className="space-y-3">
            {risk_alerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">All safe. No active risk alerts detected!</p>
            ) : (
              risk_alerts.map((risk, index) => {
                const isCritical = risk.severity === 'critical' || risk.severity === 'high';
                return (
                  <div 
                    key={index} 
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition bg-slate-950/20 ${
                      isCritical ? 'border-rose-950/30 hover:bg-rose-950/10' : 'border-amber-950/30 hover:bg-amber-950/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <AlertCircle size={12} />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Link to={`/leads/${risk.lead_id}`} className="font-bold text-xs text-white hover:text-violet-400 transition-colors">
                          {risk.lead_name}
                        </Link>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          risk.severity === 'critical' ? 'bg-red-500 text-white' :
                          risk.severity === 'high' ? 'bg-orange-600 text-white' :
                          'bg-amber-500 text-slate-950 font-black'
                        }`}>
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-medium">{risk.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-3">
            {Object.keys(recommended_actions).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No recommended actions generated.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(recommended_actions).map(([action, count]) => {
                  const style = actionStyles[action] || { bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Sparkles };
                  const ActionIcon = style.icon;
                  return (
                    <div 
                      key={action} 
                      className={`p-3 rounded-xl border flex items-center justify-between bg-slate-950/20 ${style.bg}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900/60 flex items-center justify-center text-current border border-white/5">
                          <ActionIcon size={14} />
                        </div>
                        <span className="font-bold text-xs text-slate-200">{action}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-white bg-slate-900/80 px-2 py-0.5 rounded-full border border-white/5">
                          {count}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">leads</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
