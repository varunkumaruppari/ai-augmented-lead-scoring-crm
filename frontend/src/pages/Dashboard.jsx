import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Flame, RefreshCw, 
  DollarSign, Activity, Percent, Calendar, 
  Target, AlertTriangle, Award, Sparkles, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { getDashboard, getAnalytics, getIntelligenceSummary } from '../services/leadService';
import { io } from 'socket.io-client';
import api from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import ScoreBadge from '../components/common/ScoreBadge';
import AIDashboardWidget from '../components/dashboard/AIDashboardWidget';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../store/useStore';
import { Button, Card } from '../components/common/UI';

// Helper to format currency in Indian Rupees
const formatRupees = (val) => {
  const num = Number(val || 0);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)} K`;
  return `₹${num.toLocaleString('en-IN')}`;
};

// Reusable animated counter component
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(value);

  useEffect(() => {
    if (value === undefined || value === null) {
      const frame = requestAnimationFrame(() => {
        setCount(value);
      });
      return () => cancelAnimationFrame(frame);
    }
    const valStr = String(value);
    const isPercentage = valStr.endsWith('%');
    
    let rawNum;
    let prefix = '';
    let suffix = '';
    
    if (typeof value === 'number') {
      rawNum = value;
    } else {
      const cleaned = valStr.replace(/[₹%,]/g, '');
      if (valStr.includes('Cr')) {
        rawNum = parseFloat(cleaned);
        prefix = '₹';
        suffix = ' Cr';
      } else if (valStr.includes('L')) {
        rawNum = parseFloat(cleaned);
        prefix = '₹';
        suffix = ' L';
      } else if (valStr.includes('K')) {
        rawNum = parseFloat(cleaned);
        prefix = '₹';
        suffix = ' K';
      } else {
        rawNum = parseFloat(cleaned) || 0;
        if (valStr.startsWith('₹')) prefix = '₹';
        if (isPercentage) suffix = '%';
      }
    }

    if (isNaN(rawNum)) {
      const frame = requestAnimationFrame(() => {
        setCount(value);
      });
      return () => cancelAnimationFrame(frame);
    }

    let start = 0;
    const end = rawNum;
    if (start === end) {
      const frame = requestAnimationFrame(() => {
        setCount(value);
      });
      return () => cancelAnimationFrame(frame);
    }

    const startTime = performance.now();
    let frameId;

    const updateCount = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Ease out
      const current = start + (end - start) * easeProgress;
      
      if (typeof value === 'number') {
        setCount(Math.round(current));
      } else {
        const decimals = (valStr.includes('.') ? (valStr.split('.')[1] || '').replace(/[^0-9]/g, '').length : 0) || 0;
        setCount(`${prefix}${current.toFixed(decimals)}${suffix}`);
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(updateCount);
      } else {
        setCount(value);
      }
    };

    frameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span>{count}</span>;
};

// Mini Sparkline SVG component
const Sparkline = ({ data = [], colorClass = 'text-indigo-500' }) => {
  if (!data || data.length < 2) return null;
  const width = 60;
  const height = 18;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className={`overflow-visible ${colorClass}`}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

// Reusable Premium KPI Card
const KPICard = ({ label, value, icon: Icon, gradient, subtext, sparklineData, sparklineColor }) => (
  <Card hoverEffect className="relative overflow-hidden group p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[130px]">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.03] dark:opacity-[0.05] rounded-full blur-xl transition-all duration-700 group-hover:scale-150`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{label}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight">
          <AnimatedCounter value={value} />
        </h3>
      </div>
      <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm border border-transparent`}>
        <Icon size={14} />
      </div>
    </div>
    
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80">
      <span className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold">{subtext}</span>
      {sparklineData && (
        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparklineData} colorClass={sparklineColor} />
        </div>
      )}
    </div>
  </Card>
);

// Loading Skeletons
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-8 w-60 skeleton"></div>
        <div className="h-4 w-40 skeleton"></div>
      </div>
      <div className="h-10 w-36 skeleton"></div>
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card h-28 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 w-full">
              <div className="h-3 w-16 skeleton mb-2"></div>
              <div className="h-6 w-12 skeleton"></div>
            </div>
            <div className="h-8 w-8 skeleton shrink-0"></div>
          </div>
          <div className="h-3 w-20 skeleton"></div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card lg:col-span-2 h-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6">
        <div className="h-full w-full skeleton"></div>
      </div>
      <div className="card h-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6">
        <div className="h-full w-full skeleton"></div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { isDark } = useTheme();

  // local state
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [topAgents, setTopAgents] = useState([]);

  // Zustand State hooks
  const liveAlerts = useStore(state => state.notifications);
  const addLiveAlert = useStore(state => state.addNotification);
  const clearLiveAlerts = () => useStore.setState({ notifications: [] });

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
        addLiveAlert(newNotif);
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [addLiveAlert]);

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

  const PREDICTION_COLORS = ['#6366f1', '#f59e0b', '#3b82f6'];

  // Chart theme config
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#f1f5f9' : '#0f172a',
    fontSize: '11px',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold heading-font tracking-tight text-gradient">
              Executive Command Center
            </h1>
            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-indigo-200/60 dark:border-indigo-850/50">
              <Sparkles size={10} /> Active AI
            </span>
          </div>
          <p className="text-slate-505 dark:text-slate-400 text-xs font-semibold">LeadScape AI Operations dashboard and revenue forecasting engine</p>
        </div>
        <Button onClick={load} variant="secondary" size="sm" icon={RefreshCw}>
          Sync Intelligence
        </Button>
      </div>

      {/* 1. Executive KPI Cards with Sparklines & Animated Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard 
          label="Total Pipeline" 
          value={stats.total ?? 0} 
          icon={Users} 
          gradient="from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900"
          subtext="Active profiles"
          sparklineData={[45, 52, 49, 62, 58, 68, totalLeadsCount]}
          sparklineColor="text-indigo-500"
        />
        <KPICard 
          label="HOT Leads" 
          value={stats.hot ?? 0} 
          icon={Flame} 
          gradient="from-rose-500 to-orange-500"
          subtext="High-priority Focus"
          sparklineData={[3, 5, 8, 12, 10, 15, stats.hot ?? 0]}
          sparklineColor="text-rose-500"
        />
        <KPICard 
          label="Win Ratio" 
          value={`${conversionRate}%`} 
          icon={Percent} 
          gradient="from-emerald-500 to-teal-500"
          subtext="Conversion Metrics"
          sparklineData={[12.5, 14.2, 13.8, 15.5, 16.2, parseFloat(conversionRate)]}
          sparklineColor="text-emerald-500"
        />
        <KPICard 
          label="Revenue Forecast" 
          value={formatRupees(stats.projected_revenue)} 
          icon={DollarSign} 
          gradient="from-indigo-600 to-purple-600"
          subtext="Weighted Forecast"
          sparklineData={[100, 120, 110, 150, 140, 180, 200]}
          sparklineColor="text-indigo-400"
        />
        <KPICard 
          label="Open Tasks" 
          value={stats.open_follow_ups ?? 0} 
          icon={Calendar} 
          gradient="from-violet-500 to-fuchsia-500"
          subtext="Scheduled Tasks"
          sparklineData={[2, 5, 4, 8, 7, 10, stats.open_follow_ups ?? 0]}
          sparklineColor="text-purple-500"
        />
        <KPICard 
          label="Lead Quality Avg" 
          value={stats.avg_score ?? '0.0'} 
          icon={Activity} 
          gradient="from-blue-500 to-indigo-500"
          subtext="Out of 100 points"
          sparklineData={[62, 65, 64, 68, 67, 72, parseFloat(stats.avg_score || 0)]}
          sparklineColor="text-blue-500"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Panel, Forecast Widget & Top Leads */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. AI Executive Dashboard Widget */}
          <AIDashboardWidget />

          {/* 4. Revenue Forecast Widget */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white heading-font flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-650 dark:text-indigo-400" />
                  Revenue Forecast & Targets
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Forecasts evaluated dynamically using qualified status matrices</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 rounded-xl p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block mb-1">Gross Pipeline Potential</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-white heading-font">{formatRupees(stats.total_pipeline)}</span>
                <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold mt-1">Total valuation of active leads</p>
              </div>
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase block mb-1">Booked Revenue</span>
                <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-400 heading-font">{formatRupees(stats.closed_revenue)}</span>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-semibold mt-1">Acquired from closed deals</p>
              </div>
              <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 text-center">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 tracking-wider uppercase block mb-1">Target Forecast Projection</span>
                <span className="text-xl font-extrabold text-indigo-850 dark:text-indigo-300 heading-font">{formatRupees(stats.projected_revenue)}</span>
                <p className="text-[9px] text-indigo-650 dark:text-indigo-400 font-semibold mt-1">Weighted conversion target</p>
              </div>
            </div>
          </Card>

          {/* Top Opportunities Panel Widget */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-650 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white heading-font">Top High-Quality Opportunities</h3>
              </div>
              <Link to="/leads" className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                View All Leads <ArrowUpRight size={12} />
              </Link>
            </div>
            
            {opportunities.length > 0 ? (
              <div className="space-y-2.5">
                {opportunities.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 transition-all bg-white dark:bg-slate-900 gap-3 shadow-sm">
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{lead.full_name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{lead.source} · Stage: {lead.status}</p>
                      {lead.recommendation && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                          ✨ Action: {lead.recommendation}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        lead.priority === 'Critical' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-150 dark:border-red-900/50' :
                        lead.priority === 'High' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-150 dark:border-orange-900/50' :
                        lead.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-150 dark:border-amber-900/50' :
                        'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-150 dark:border-blue-900/50'
                      }`}>
                        {lead.conversion_probability}% Probability
                      </span>
                      <ScoreBadge category={lead.quality === 'Excellent' ? 'HOT' : lead.quality === 'Good' ? 'WARM' : 'COLD'} score={lead.current_score} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/20">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Active Opportunities</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">There are no leads scored in high-priority categories yet.</p>
                <Link to="/leads/new"><Button variant="primary" size="sm" className="mt-4">Add A Lead</Button></Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Global Activities Feed, Follow-ups, and Live Alerts */}
        <div className="space-y-6">
          
          {/* Live Notification Alerts Widget */}
          {liveAlerts.length > 0 && (
            <Card className="p-5 border-l-2 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[10px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-widest">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-455 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                  </span>
                  Real-time events
                </h3>
                <button onClick={clearLiveAlerts} className="text-[9px] text-slate-500 dark:text-slate-450 font-bold hover:text-slate-900 dark:hover:text-white uppercase tracking-wider">Dismiss</button>
              </div>
              <div className="space-y-2">
                {liveAlerts.map(alert => (
                  <div key={alert.id} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-[11px] space-y-0.5 shadow-sm text-slate-800 dark:text-slate-200">
                    <p className="font-bold text-slate-800 dark:text-white">{alert.title}</p>
                    <p className="text-slate-650 dark:text-slate-400 font-medium">{alert.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Overdue Follow-ups Panel */}
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 heading-font">
                <AlertTriangle size={14} className="text-rose-500" />
                Overdue Tasks
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-605 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-900/50">{overdueTasks.length}</span>
            </div>
            {overdueTasks.length > 0 ? (
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="p-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-xl text-xs flex justify-between items-center shadow-sm">
                    <div>
                      <Link to={`/leads/${task.lead_id}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors">{task.lead_name}</Link>
                      <p className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5 uppercase text-[9px]">{task.type} · Agent: {task.agent_name || 'Unassigned'}</p>
                    </div>
                    <span className="text-rose-600 dark:text-rose-450 font-bold text-[9px] uppercase tracking-wider">Overdue</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic text-center py-2">No overdue actions.</p>
            )}
          </Card>

          {/* Upcoming Follow-ups Panel */}
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 heading-font">
                <Calendar size={14} className="text-indigo-650 dark:text-indigo-400" />
                Follow-Ups Today
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900/50">{todayTasks.length}</span>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800 rounded-xl text-xs flex justify-between items-center shadow-sm">
                    <div>
                      <Link to={`/leads/${task.lead_id}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors">{task.lead_name}</Link>
                      <p className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5 uppercase text-[9px]">{task.type} · Agent: {task.agent_name || 'Unassigned'}</p>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wider">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic text-center py-2">No scheduled actions for today.</p>
            )}
          </Card>
          
          {/* Recent Activity Feed */}
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Activity size={14} className="text-indigo-650 dark:text-indigo-400" />
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider heading-font">System Audit log</h3>
            </div>
            
            {recentActivities.length > 0 ? (
              <div className="flow-root">
                <ul className="relative border-l border-slate-250 dark:border-slate-800 ml-2 space-y-4 pl-4">
                  {recentActivities.map((act, idx) => (
                    <li key={act.id || idx} className="relative group">
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-550 dark:bg-indigo-500 ring-4 ring-white dark:ring-slate-900 group-hover:scale-125 transition-transform"></span>
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs text-slate-705 dark:text-slate-300 leading-normal">
                            <span className="font-bold text-slate-900 dark:text-white">{act.user_name || 'System'}</span>{' '}
                            {act.description}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                            {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {act.lead_name && (
                          <p className="text-[9px] text-indigo-650 dark:text-indigo-455 font-bold mt-0.5">
                            Lead: {act.lead_name}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <h4 className="font-semibold text-slate-500 dark:text-slate-400 text-xs">No Events Logged</h4>
              </div>
            )}
          </Card>

          {/* 5. Conversion Prediction Chart */}
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider heading-font mb-4">🔮 Conversion Prediction</h3>
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
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-3 w-full text-center">
                  {predictionChartData.map((s, i) => (
                    <div key={i} className="flex flex-col items-center text-[10px] text-slate-500 dark:text-slate-455 font-semibold">
                      <span className="w-2 h-2 rounded-full inline-block mb-1" style={{ backgroundColor: PREDICTION_COLORS[i % PREDICTION_COLORS.length] }}></span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[65px]">{s.name}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{s.value} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No predictions calculated</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Team Comparison & Leaderboard Podium */}
      {agentData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
          <Card className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white heading-font mb-4">👥 Team Performance Leaderboard</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} contentStyle={chartTooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10, color: isDark ? '#f1f5f9' : '#475569' }} />
                <Bar dataKey="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Closed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="lg:col-span-1 p-6 space-y-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white heading-font flex items-center gap-1.5">
              <Award size={18} className="text-yellow-500 animate-bounce" />
              Top Closing Agents
            </h3>
            <div className="space-y-2.5">
              {topAgents.slice(0, 3).map((agent, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={agent.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{medals[idx]}</span>
                      <div>
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{agent.full_name}</p>
                        <p className="text-[9px] text-slate-505 dark:text-slate-400 font-bold uppercase">Conv: {agent.conversion_rate}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">{agent.performance_score}/100</span>
                    </div>
                  </div>
                );
              })}
              {topAgents.length === 0 && (
                <p className="text-xs text-slate-505 dark:text-slate-400 italic text-center py-4">No agent ranking calculated.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
