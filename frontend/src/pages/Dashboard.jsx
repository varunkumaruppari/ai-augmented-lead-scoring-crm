import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Flame, RefreshCw, 
  DollarSign, Activity, Percent, Calendar, 
  Target, AlertTriangle, Award
} from 'lucide-react';
import { getDashboard, getAnalytics, getIntelligenceSummary } from '../services/leadService';
import { io } from 'socket.io-client';
import api from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ScoreBadge from '../components/common/ScoreBadge';
import AIDashboardWidget from '../components/dashboard/AIDashboardWidget';

// Helper to format currency in Indian Rupees (Lakhs / Crores)
const formatRupees = (val) => {
  const num = Number(val || 0);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)} K`;
  return `₹${num.toLocaleString('en-IN')}`;
};

// Reusable Premium KPI Card
const KPICard = ({ label, value, icon: Icon, gradient, subtext }) => (
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

// Loading Skeletons
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-8 w-60 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-40 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-10 w-36 bg-slate-200 rounded-lg"></div>
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card h-28 bg-white/70 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
              <div className="h-6 w-12 bg-slate-200 rounded"></div>
            </div>
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card lg:col-span-2 h-96 bg-slate-200/50"></div>
      <div className="card h-96 bg-slate-200/50"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);

  const load = async () => {
    try {
      const [d, a, i, overdueRes, todayRes, perfRes] = await Promise.all([
        getDashboard(),
        getAnalytics(),
        getIntelligenceSummary(),
        api.get('/followups?status=overdue').catch(() => ({ data: { data: [] } })),
        api.get('/followups?status=today').catch(() => ({ data: { data: [] } })),
        api.get('/agents/performance').catch(() => ({ data: { data: [] } }))
      ]);
      setDash(d.data.data);
      setAnalytics(a.data.data);
      setIntel(i.data.data);
      setOverdueTasks((overdueRes.data.data || []).slice(0, 5));
      setTodayTasks((todayRes.data.data || []).slice(0, 5));
      setTopAgents((perfRes.data.data || []).slice(0, 5));
    } catch (e) {
      console.error('Error reloading dashboard summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialLoad = async () => {
      try {
        const [d, a, i, overdueRes, todayRes, perfRes] = await Promise.all([
          getDashboard(),
          getAnalytics(),
          getIntelligenceSummary(),
          api.get('/followups?status=overdue').catch(() => ({ data: { data: [] } })),
          api.get('/followups?status=today').catch(() => ({ data: { data: [] } })),
          api.get('/agents/performance').catch(() => ({ data: { data: [] } }))
        ]);
        if (active) {
          setDash(d.data.data);
          setAnalytics(a.data.data);
          setIntel(i.data.data);
          setOverdueTasks((overdueRes.data.data || []).slice(0, 5));
          setTodayTasks((todayRes.data.data || []).slice(0, 5));
          setTopAgents((perfRes.data.data || []).slice(0, 5));
        }
      } catch (e) {
        console.error('Error loading dashboard summary on mount:', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialLoad();
    
    // Connect socket for real-time live alert widgets
    const token = localStorage.getItem('access_token');
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('notification', (newNotif) => {
      if (active) {
        setLiveAlerts(prev => [newNotif, ...prev].slice(0, 5));
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = dash?.stats || {};
  const recentActivities = dash?.recent_activities || [];
  
  // Lead Intelligence State
  const summary = intel?.summary || {};
  const opportunities = intel?.opportunities || [];
  const probDist = summary?.probability_distribution || { high: 0, medium: 0, low: 0 };

  const totalLeadsCount = parseInt(stats.total || 0);
  const conversionRate = totalLeadsCount > 0 
    ? ((parseInt(stats.converted || 0) / totalLeadsCount) * 100).toFixed(1)
    : '0.0';

  // Charts Mappings
  const agentData = analytics?.by_agent?.slice(0, 5).map(a => ({
    name: a.full_name?.split(' ')[0],
    Leads: parseInt(a.total_leads),
    Closed: parseInt(a.converted)
  })) || [];

  // Conversion Prediction Chart Data
  const predictionChartData = [
    { name: 'High Prob (>=75%)', value: probDist.high },
    { name: 'Med Prob (40-74%)', value: probDist.medium },
    { name: 'Low Prob (<40%)', value: probDist.low }
  ].filter(d => d.value > 0);

  const PREDICTION_COLORS = ['#10B981', '#F59E0B', '#3B82F6'];

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 heading-font tracking-tight flex items-center gap-2">
            AI Real Estate CRM <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-widest">SaaS Edition</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Lohithadharma Projects Pvt Ltd · Strategic Intelligence Hub</p>
        </div>
        <button onClick={load} className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs">
          <RefreshCw size={14} className="text-slate-500" /> Refresh Operations
        </button>
      </div>

      {/* 1. Executive KPI Cards (6 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard 
          label="Total Leads" 
          value={stats.total ?? 0} 
          icon={Users} 
          gradient="from-slate-500 to-slate-600"
          subtext="Lifetime active pipeline"
        />
        <KPICard 
          label="HOT Leads" 
          value={stats.hot ?? 0} 
          icon={Flame} 
          gradient="from-red-500 to-rose-600"
          subtext="Require instant contact"
        />
        <KPICard 
          label="Conversion Rate" 
          value={`${conversionRate}%`} 
          icon={Percent} 
          gradient="from-emerald-500 to-teal-600"
          subtext="Ratio of closed deals"
        />
        <KPICard 
          label="Revenue Forecast" 
          value={formatRupees(stats.projected_revenue)} 
          icon={DollarSign} 
          gradient="from-blue-600 to-indigo-600"
          subtext="Weighted target projection"
        />
        <KPICard 
          label="Open Follow-ups" 
          value={stats.open_follow_ups ?? 0} 
          icon={Calendar} 
          gradient="from-purple-500 to-indigo-600"
          subtext="Pending action items"
        />
        <KPICard 
          label="Avg Lead Score" 
          value={stats.avg_score ?? '0.0'} 
          icon={Activity} 
          gradient="from-orange-500 to-amber-600"
          subtext="Lead health metric"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Panel, Forecast Widget & Top Leads */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. AI Executive Dashboard Widget */}
          <AIDashboardWidget />

          {/* 4. Revenue Forecast Widget */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg text-slate-900 heading-font">📊 Revenue Forecast & Target Values</h3>
                <p className="text-xs text-slate-400 font-medium">Pipeline target valuations based on status probabilities</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase block mb-1">Potential Revenue</span>
                <span className="text-2xl font-black text-slate-700 heading-font">{formatRupees(stats.total_pipeline)}</span>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Total value of all active budgets</p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-center shadow-sm">
                <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase block mb-1">Closed Revenue</span>
                <span className="text-2xl font-black text-emerald-700 heading-font">{formatRupees(stats.closed_revenue)}</span>
                <p className="text-[10px] text-emerald-500 font-medium mt-1">Acquired from Booked deals</p>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center shadow-sm">
                <span className="text-xs font-bold text-blue-600 tracking-wider uppercase block mb-1">Forecast Revenue</span>
                <span className="text-2xl font-black text-blue-700 heading-font">{formatRupees(stats.projected_revenue)}</span>
                <p className="text-[10px] text-blue-500 font-medium mt-1">Weighted conversion target value</p>
              </div>
            </div>
          </div>

          {/* Top Opportunities Panel Widget */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-blue-500" />
              <h3 className="font-bold text-lg text-slate-900 heading-font">🎯 Top Conversion Opportunities</h3>
            </div>
            
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors bg-white gap-3 shadow-sm">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{lead.full_name}</p>
                      <p className="text-xs text-slate-400 font-semibold uppercase">{lead.source} · Stage: {lead.status}</p>
                      {lead.recommendation && (
                        <p className="text-[11px] text-blue-600 font-semibold mt-1">
                          👉 Suggestion: {lead.recommendation}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        lead.priority === 'Critical' ? 'bg-red-50 text-red-700 border border-red-150' :
                        lead.priority === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                        lead.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-150' :
                        'bg-blue-50 text-blue-700 border border-blue-150'
                      }`}>
                        {lead.conversion_probability}% Chance ({lead.priority})
                      </span>
                      <ScoreBadge category={lead.quality === 'Excellent' ? 'HOT' : lead.quality === 'Good' ? 'WARM' : 'COLD'} score={lead.current_score} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-slate-150 rounded-2xl p-6 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-sm">No High Scoring Opportunities</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are no leads scored with high conversion probabilities yet. Click below to add one.</p>
                <Link to="/leads/new" className="btn-primary mt-4 inline-block text-xs py-2">Create a Lead</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Global Activities Feed, Follow-ups, and Live Alerts */}
        <div className="space-y-6">
          
          {/* Live Notification Alerts Widget */}
          {liveAlerts.length > 0 && (
            <div className="card border-l-4 border-l-red-500 bg-red-50/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Live Notifications
                </h3>
                <button onClick={() => setLiveAlerts([])} className="text-[10px] text-slate-400 font-bold hover:text-slate-600 uppercase">Clear</button>
              </div>
              <div className="space-y-2">
                {liveAlerts.map(alert => (
                  <div key={alert.id} className="p-2.5 bg-white border border-red-100 rounded-xl text-xs space-y-0.5 shadow-sm">
                    <p className="font-bold text-slate-900">{alert.title}</p>
                    <p className="text-slate-500 font-medium">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Follow-ups Panel */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 heading-font">
                <AlertTriangle size={16} className="text-rose-500" />
                Overdue Follow-Ups
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">{overdueTasks.length}</span>
            </div>
            {overdueTasks.length > 0 ? (
              <div className="space-y-2.5">
                {overdueTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="p-3 bg-rose-50/30 border border-rose-100/50 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <Link to={`/leads/${task.lead_id}`} className="font-bold text-slate-800 hover:text-blue-600">{task.lead_name}</Link>
                      <p className="text-slate-400 font-semibold mt-0.5 uppercase text-[9px]">{task.type} · Agent: {task.agent_name || 'Unassigned'}</p>
                    </div>
                    <span className="text-rose-600 font-bold text-[9px] bg-rose-50 px-1.5 py-0.5 rounded uppercase">Overdue</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium italic text-center py-2">No overdue tasks. Great job!</p>
            )}
          </div>

          {/* Upcoming Follow-ups Panel */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 heading-font">
                <Calendar size={16} className="text-blue-500" />
                Upcoming Follow-Ups
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">{todayTasks.length}</span>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2.5">
                {todayTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <Link to={`/leads/${task.lead_id}`} className="font-bold text-slate-800 hover:text-blue-600">{task.lead_name}</Link>
                      <p className="text-slate-400 font-semibold mt-0.5 uppercase text-[9px]">{task.type} · Agent: {task.agent_name || 'Unassigned'}</p>
                    </div>
                    <span className="text-blue-600 font-bold text-[9px] bg-blue-50 px-1.5 py-0.5 rounded uppercase">Today</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium italic text-center py-2">No follow-ups for today.</p>
            )}
          </div>
          
          {/* Recent Activity Feed */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-blue-500" />
              <h3 className="font-bold text-sm text-slate-900 heading-font">Recent Operations</h3>
            </div>
            
            {recentActivities.length > 0 ? (
              <div className="flow-root">
                <ul className="relative border-l border-slate-100 ml-2 space-y-4 pl-4">
                  {recentActivities.map((act, idx) => (
                    <li key={act.id || idx} className="relative group">
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white group-hover:scale-110 transition-transform"></span>
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs text-slate-800 leading-normal font-medium">
                            <span className="font-semibold text-slate-900">{act.user_name || 'System'}</span>{' '}
                            {act.description}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                            {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {act.lead_name && (
                          <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                            Lead: {act.lead_name}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-150 rounded-2xl p-6 bg-slate-50/50">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Activity size={20} />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">No Operations Logged</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Activities from lead creations, updates, or status modifications will display here once recorded.</p>
              </div>
            )}
          </div>

          {/* 5. Conversion Prediction Chart */}
          <div className="card">
            <h3 className="font-bold text-sm text-slate-900 heading-font mb-4">🔮 Conversion Predictions</h3>
            {predictionChartData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie 
                      data={predictionChartData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={45}
                      outerRadius={65} 
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {predictionChartData.map((_, i) => <Cell key={i} fill={PREDICTION_COLORS[i % PREDICTION_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-3 w-full text-center">
                  {predictionChartData.map((s, i) => (
                    <div key={i} className="flex flex-col items-center text-xs text-slate-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full inline-block mb-1" style={{ backgroundColor: PREDICTION_COLORS[i % PREDICTION_COLORS.length] }}></span>
                      <span className="text-[10px] text-slate-400 truncate">{s.name}</span>
                      <span className="text-slate-800 font-bold">{s.value} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Chart Empty State
              <div className="text-center py-16 border border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-semibold">No predictions calculated yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Comparison & Leaderboard Podium */}
      {agentData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="font-bold text-lg text-slate-900 heading-font mb-4">👥 Team Performance Leaderboard</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Leads" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={25} />
                <Bar dataKey="Closed" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card lg:col-span-1 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 heading-font flex items-center gap-1.5">
              <Award size={18} className="text-yellow-500" />
              Top Performing Agents
            </h3>
            <div className="space-y-3">
              {topAgents.slice(0, 3).map((agent, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={agent.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medals[idx]}</span>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{agent.full_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Conv: {agent.conversion_rate}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{agent.performance_score}/100</span>
                    </div>
                  </div>
                );
              })}
              {topAgents.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No agent ranking calculated.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
