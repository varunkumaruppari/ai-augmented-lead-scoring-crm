import { useState, useEffect } from 'react';
import { 
  Award, TrendingUp, Sparkles, Clock, 
  Users, AlertCircle, RefreshCw
} from 'lucide-react';
import { getAgentPerformance } from '../services/leadService';
import Spinner from '../components/common/Spinner';

// Helper to format currency in Indian Rupees (Lakhs / Crores)
const formatRupees = (val) => {
  const num = Number(val || 0);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)} K`;
  return `₹${num.toLocaleString('en-IN')}`;
};

// Reusable Performance KPI Widget Card
const PerformanceKPICard = ({ label, value, icon: Icon, gradient, subtext }) => (
  <div className="card relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-full blur-xl transition-all duration-500 group-hover:scale-125`}></div>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 heading-font tracking-tight">{value}</h3>
        {subtext && <p className="text-[11px] text-slate-400 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default function AgentPerformance() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('performance_score'); // performance_score, conversion_rate, revenue_generated, leads_converted

  const fetchPerformance = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await getAgentPerformance();
      setAgents(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch agent performance metrics.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialFetch = async () => {
      try {
        const res = await getAgentPerformance();
        if (active) {
          setAgents(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch agent performance metrics.');
      } finally {
        if (active) setLoading(false);
      }
    };
    initialFetch();
    return () => { active = false; };
  }, []);

  if (loading) return <Spinner />;

  // Sort logic
  const sortedAgents = [...agents].sort((a, b) => {
    if (sortBy === 'performance_score') return b.performance_score - a.performance_score;
    if (sortBy === 'conversion_rate') return b.conversion_rate - a.conversion_rate;
    if (sortBy === 'revenue_generated') return b.revenue_generated - a.revenue_generated;
    if (sortBy === 'leads_converted') return b.leads_converted - a.leads_converted;
    return 0;
  });

  // Calculate team aggregate averages
  const totalRevenue = agents.reduce((acc, a) => acc + a.revenue_generated, 0);
  const avgScore = agents.length > 0 ? Math.round(agents.reduce((acc, a) => acc + a.performance_score, 0) / agents.length) : 0;
  const avgConv = agents.length > 0 ? (agents.reduce((acc, a) => acc + a.conversion_rate, 0) / agents.length).toFixed(1) : '0.0';
  const avgResp = agents.length > 0 ? (agents.reduce((acc, a) => acc + a.avg_response_time, 0) / agents.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Page Headers */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 heading-font tracking-tight flex items-center gap-2">
            <Award size={28} className="text-yellow-500" />
            Agent Performance Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitor and rank team sales productivity, conversions, response speeds, and quality scores.
          </p>
        </div>
        <button onClick={() => fetchPerformance(true)} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Sync Metrics
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PerformanceKPICard 
          label="Team Revenue" 
          value={formatRupees(totalRevenue)} 
          icon={TrendingUp} 
          gradient="from-emerald-500 to-teal-600" 
          subtext="Cumulative booking revenue" 
        />
        <PerformanceKPICard 
          label="Average Performance" 
          value={`${avgScore}/100`} 
          icon={Award} 
          gradient="from-yellow-500 to-amber-600" 
          subtext="Team score average" 
        />
        <PerformanceKPICard 
          label="Conversion Efficiency" 
          value={`${avgConv}%`} 
          icon={Sparkles} 
          gradient="from-blue-500 to-indigo-600" 
          subtext="Average conversion rate" 
        />
        <PerformanceKPICard 
          label="Team Response Speed" 
          value={`${avgResp} hrs`} 
          icon={Clock} 
          gradient="from-purple-500 to-violet-600" 
          subtext="Average first-contact duration" 
        />
      </div>

      {/* Rankings Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Podium widgets */}
        <div className="card lg:col-span-1 p-6 space-y-6 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-xl font-black heading-font tracking-tight text-white flex items-center gap-2">
              <Award size={20} className="text-yellow-400" />
              Leaderboard Rankings
            </h2>
            <p className="text-xs text-slate-400 font-medium">Performance rankings based on CRM parameters.</p>
          </div>

          <div className="space-y-4">
            {sortedAgents.slice(0, 3).map((agent, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={agent.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{medals[index] || `#${index + 1}`}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white truncate max-w-[140px]">{agent.full_name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{agent.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-yellow-400 heading-font">{agent.performance_score}</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">CRM Score</p>
                  </div>
                </div>
              );
            })}
            {sortedAgents.length === 0 && (
              <p className="text-xs text-slate-500 text-center italic">No agent data compiled yet.</p>
            )}
          </div>
        </div>

        {/* Detailed Agents Comparison Grid Table */}
        <div className="card lg:col-span-2 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 heading-font flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Comparative Metrics
              </h2>
              <p className="text-xs text-slate-400 font-medium">Review and compare individual agent metrics.</p>
            </div>
            
            {/* Sorting controls */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs text-slate-400 font-semibold">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="performance_score">CRM Score</option>
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="revenue_generated">Closed Revenue</option>
                  <option value="leads_converted">Closed Deals</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Assigned</th>
                  <th className="px-4 py-3 text-center">Conv. Rate</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-center">Resp. Speed</th>
                  <th className="px-4 py-3 text-center">Follow-ups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedAgents.map(a => {
                  let scoreColor;
                  if (a.performance_score >= 80) {
                    scoreColor = 'text-emerald-700 bg-emerald-50';
                  } else if (a.performance_score >= 50) {
                    scoreColor = 'text-amber-700 bg-amber-50';
                  } else {
                    scoreColor = 'text-rose-700 bg-rose-50';
                  }

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{a.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{a.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${scoreColor}`}>
                          {a.performance_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">{a.leads_assigned}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{a.conversion_rate}%</td>
                      <td className="px-4 py-3 text-right text-slate-900 font-bold">{formatRupees(a.revenue_generated)}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{a.avg_response_time}h</td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-xs text-slate-700">Done: {a.followups_completed}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Pending: {a.open_tasks}</div>
                      </td>
                    </tr>
                  );
                })}
                {sortedAgents.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">No agent metric data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
