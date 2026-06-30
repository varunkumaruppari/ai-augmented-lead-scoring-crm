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
      <div className="card h-96 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200/80 shadow-sm">
        <Spinner size="md" />
        <p className="text-xs text-slate-500 font-bold animate-pulse uppercase tracking-wider">Parsing LeadScape AI telemetry...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-6 text-center space-y-3 bg-white border border-slate-200/80 shadow-sm">
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
    'Call Now': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-250', icon: Phone },
    'Schedule Visit': { bg: 'bg-blue-50 text-blue-700 border-blue-250', icon: ChevronRight },
    'Send Proposal': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-250', icon: Mail },
    'Nurture Lead': { bg: 'bg-amber-50 text-amber-700 border-amber-250', icon: Sparkles },
    'Escalate To Senior Agent': { bg: 'bg-rose-50 text-rose-700 border-rose-250', icon: Award }
  };

  return (
    <div className="card bg-white border border-slate-200/80 text-slate-800 shadow-sm rounded-2xl overflow-hidden relative group">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-all duration-700"></div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

      {/* Header */}
      <div className="border-b border-slate-200/60 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-550/20">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 tracking-wider uppercase heading-font flex items-center gap-1.5">
              Autonomous Intelligence Feed
              <span className="text-[9px] bg-indigo-50 text-indigo-650 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200/60 uppercase tracking-widest">LeadScape AI</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">Real-time predictive scoring, anomalies, and recommendations</p>
          </div>
        </div>
        <button 
          onClick={() => load(true)} 
          disabled={refreshing} 
          className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition active:scale-95 disabled:opacity-50"
          title="Sync AI Insights"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid Stats Snapshot */}
      <div className="grid grid-cols-3 border-b border-slate-200/60 bg-slate-50/50 divide-x divide-slate-200/60">
        <div className="p-3 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Leads Profiled</span>
          <span className="text-lg font-extrabold text-slate-900">{summary.total_analyzed}</span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Active Opportunities</span>
          <span className="text-lg font-extrabold text-indigo-650 flex items-center justify-center gap-1">
            <TrendingUp size={14} />
            {summary.total_opportunities}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Risk Flagged</span>
          <span className="text-lg font-extrabold text-rose-650 flex items-center justify-center gap-1">
            <AlertCircle size={14} />
            {summary.total_risk_alerts}
          </span>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-slate-200/60 bg-slate-55/20 px-3 pt-2 gap-1.5">
        {[
          { key: 'opportunities', label: 'Top Opportunities', icon: TrendingUp },
          { key: 'risks', label: 'Risk Alerts Feed', icon: AlertCircle },
          { key: 'actions', label: 'Next-Best Actions', icon: CheckCircle }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-[10px] font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-all duration-300 ${
                activeTab === tab.key 
                  ? 'border-indigo-600 text-indigo-650 bg-slate-50/20' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
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
          <div className="space-y-2">
            {top_opportunities.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No opportunities calculated.</p>
            ) : (
              top_opportunities.map(op => (
                <div key={op.lead_id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between transition group/row hover:bg-slate-50/50 shadow-sm">
                  <div className="space-y-0.5">
                    <Link to={`/leads/${op.lead_id}`} className="font-bold text-xs text-slate-800 hover:text-indigo-650 flex items-center gap-1 transition-colors">
                      {op.lead_name}
                      <ChevronRight size={12} className="opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 transition-all text-indigo-600" />
                    </Link>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span>Representative: <strong className="text-slate-600 font-semibold">{op.agent_name}</strong></span>
                      <span>·</span>
                      <span>Budget: <strong className="text-emerald-700 font-bold">₹{Number(op.expected_revenue).toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                  
                  {/* Probability tag & bar */}
                  <div className="text-right flex items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Conversion Chance</span>
                        <span className="text-xs font-black text-indigo-650">{op.conversion_probability}%</span>
                      </div>
                      <div className="w-24 h-1 bg-slate-155 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" 
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
          <div className="space-y-2">
            {risk_alerts.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">System stable. No risk vectors detected.</p>
            ) : (
              risk_alerts.map((risk, index) => {
                const isCritical = risk.severity === 'critical' || risk.severity === 'high';
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
                      isCritical ? 'border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 shadow-sm' : 'border-amber-100 bg-amber-50/30 hover:bg-amber-50/60 shadow-sm'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <AlertCircle size={12} />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Link to={`/leads/${risk.lead_id}`} className="font-bold text-xs text-slate-800 hover:text-indigo-650 transition-colors">
                          {risk.lead_name}
                        </Link>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          risk.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-150' :
                          risk.severity === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                          'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal font-medium">{risk.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-2">
            {Object.keys(recommended_actions).length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No actions generated.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 border-slate-200">
                {Object.entries(recommended_actions).map(([action, count]) => {
                  const style = actionStyles[action] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Sparkles };
                  const ActionIcon = style.icon;
                  return (
                    <div 
                      key={action} 
                      className={`p-3 rounded-xl border flex items-center justify-between bg-white shadow-sm ${style.bg}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-current border border-slate-200/50">
                          <ActionIcon size={12} />
                        </div>
                        <span className="font-bold text-xs text-slate-800">{action}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {count}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">leads</span>
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

