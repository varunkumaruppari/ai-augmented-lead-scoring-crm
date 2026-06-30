import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  Sparkles, RefreshCw, TrendingUp, AlertCircle, 
  FileText, Download, Briefcase, 
  DollarSign, Users, Award, Percent, Layers, ShieldAlert, Zap
} from 'lucide-react';
import { 
  getRevenueAnalytics, getLeadAnalyticsList, getSourceAnalyticsList, 
  getAgentAnalyticsList, getForecastAnalytics, getInsightsAnalytics 
} from '../services/leadService';
import Spinner from '../components/common/Spinner';

// Helper to format currency in Indian Rupees
const formatRupees = (val) => {
  const num = Number(val || 0);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)} K`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export default function Analytics() {
  const [revenue, setRevenue] = useState(null);
  const [leads, setLeads] = useState(null);
  const [sources, setSources] = useState(null);
  const [agents, setAgents] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [revRes, leadRes, srcRes, agentRes, forecastRes, insightsRes] = await Promise.all([
        getRevenueAnalytics(),
        getLeadAnalyticsList(),
        getSourceAnalyticsList(),
        getAgentAnalyticsList(),
        getForecastAnalytics(),
        getInsightsAnalytics()
      ]);

      setRevenue(revRes.data.data);
      setLeads(leadRes.data.data);
      setSources(srcRes.data.data);
      setAgents(agentRes.data.data);
      setForecast(forecastRes.data.data);
      setInsights(insightsRes.data.data);
    } catch (err) {
      console.error('Failed to load BI analytics:', err);
      setError('Failed to load BI analytics. Please check your connection or retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialFetch = async () => {
      try {
        const [revRes, leadRes, srcRes, agentRes, forecastRes, insightsRes] = await Promise.all([
          getRevenueAnalytics(),
          getLeadAnalyticsList(),
          getSourceAnalyticsList(),
          getAgentAnalyticsList(),
          getForecastAnalytics(),
          getInsightsAnalytics()
        ]);
        if (active) {
          setRevenue(revRes.data.data);
          setLeads(leadRes.data.data);
          setSources(srcRes.data.data);
          setAgents(agentRes.data.data);
          setForecast(forecastRes.data.data);
          setInsights(insightsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load BI analytics on mount:', err);
        if (active) {
          setError('Failed to load BI analytics. Please verify backend services.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    initialFetch();
    return () => { active = false; };
  }, []);

  const exportCSVReport = (reportType) => {
    setExportMenuOpen(false);
    let headers = [];
    let rows = [];
    let filename = '';

    if (reportType === 'executive') {
      filename = 'executive_kpi_report.csv';
      headers = ['Metric Category', 'Metric Name', 'Value'];
      rows = [
        ['Revenue', 'Total Revenue', formatRupees(revenue?.metrics.total_revenue)],
        ['Revenue', 'Closed Revenue', formatRupees(revenue?.metrics.closed_revenue)],
        ['Revenue', 'Potential Revenue', formatRupees(revenue?.metrics.potential_revenue)],
        ['Revenue', 'Forecast Revenue (Weighted)', formatRupees(revenue?.metrics.forecast_revenue)],
        ['Revenue', 'Monthly Growth %', `${revenue?.metrics.monthly_growth}%`],
        ['Revenue', 'Quarterly Growth %', `${revenue?.metrics.quarterly_growth}%`],
        ['Leads', 'Total Leads Count', leads?.metrics.total_leads],
        ['Leads', 'Hot Segment Leads', leads?.metrics.hot_leads],
        ['Leads', 'Warm Segment Leads', leads?.metrics.warm_leads],
        ['Leads', 'Cold Segment Leads', leads?.metrics.cold_leads],
        ['Leads', 'Pipeline Conversion Rate', `${leads?.metrics.conversion_rate}%`],
        ['Leads', 'Avg Engagement Score', leads?.metrics.avg_lead_score],
        ['BI Dashboard', 'Business Health Score', `${insights?.business_health_score}/100`]
      ];
    } else if (reportType === 'revenue') {
      filename = 'revenue_forecast_report.csv';
      headers = ['Forecast Horizon', 'Target Expected Revenue', 'Target Monthly Runrate'];
      rows = [
        ['30-Day Forecast', formatRupees(forecast?.forecast.forecast_30), formatRupees(forecast?.forecast.expected_monthly)],
        ['90-Day Forecast', formatRupees(forecast?.forecast.forecast_90), formatRupees(forecast?.forecast.expected_quarterly)],
        ['180-Day Forecast', formatRupees(forecast?.forecast.forecast_180), formatRupees(forecast?.forecast.expected_annual / 12)],
        ['Expected Annualized Target', formatRupees(forecast?.forecast.expected_annual), '—']
      ];
    } else if (reportType === 'agent') {
      filename = 'agent_performance_report.csv';
      headers = ['Agent Name', 'Performance Score', 'Leads Assigned', 'Leads Converted', 'Conversion Rate %', 'Revenue Generated', 'Avg Response Time (Hrs)'];
      rows = (agents || []).map(a => [
        a.name,
        `${a.performance_score}/100`,
        a.leads_assigned,
        a.leads_converted,
        `${a.conversion_rate}%`,
        formatRupees(a.revenue_generated),
        a.avg_response_time
      ]);
    } else if (reportType === 'sources') {
      filename = 'source_roi_report.csv';
      headers = ['Lead Channel Source', 'Total Leads', 'Closed Conversions', 'Conversions Rate %', 'Revenue Generated', 'Efficiency ROI Score'];
      rows = (sources || []).map(s => [
        s.source,
        s.leads,
        s.conversions,
        s.leads > 0 ? `${((s.conversions / s.leads) * 100).toFixed(1)}%` : '0%',
        formatRupees(s.revenue),
        `${s.roi_score}/100`
      ]);
    }

    // CSV format builder
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Compiling business intelligence telemetry...</p>
      </div>
    );
  }

  if (error && !revenue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-md">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-bold text-slate-800">Analytics Dashboard Unavailable</h2>
          <p className="text-sm text-slate-500 font-semibold">{error}</p>
        </div>
        <button 
          onClick={() => loadData(false)}
          className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl shadow-md"
        >
          <RefreshCw size={14} /> Retry Loading Analytics
        </button>
      </div>
    );
  }

  // Health color mapping
  const health = insights?.business_health_score || 0;
  const healthColor = health >= 75 ? 'text-emerald-600' : health >= 50 ? 'text-amber-600' : 'text-rose-600';
  const healthBg = health >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : health >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200';

  const pipelineFunnelData = forecast?.funnel || [];

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      {error && revenue && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-750 font-semibold animate-slideDown">
          <AlertCircle size={16} className="mt-0.5 shrink-0 animate-pulse" />
          <div>
            <p className="font-bold">Error refreshing telemetry feed</p>
            <p className="text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 heading-font tracking-tight flex items-center gap-2">
            BI Analytics Suite
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200/60 uppercase tracking-wider">Enterprise</span>
          </h1>
          <p className="text-slate-550 text-xs mt-0.5 font-semibold">Real-time forecasting algorithms · Strategic forecasting matrices</p>
        </div>
        
        {/* Export & Actions */}
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="btn-primary text-xs font-bold py-2 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Download size={14} /> Export Report
          </button>
          
          {exportMenuOpen && (
            <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 w-52 z-50 animate-fade-in text-xs text-slate-600 font-semibold">
              <button onClick={() => exportCSVReport('executive')} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100">
                <FileText size={12} className="text-indigo-650" /> Executive summary (CSV)
              </button>
              <button onClick={() => exportCSVReport('revenue')} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100">
                <DollarSign size={12} className="text-emerald-650" /> Revenue & Forecasts (CSV)
              </button>
              <button onClick={() => exportCSVReport('agent')} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100">
                <Award size={12} className="text-amber-650" /> Agent Performance (CSV)
              </button>
              <button onClick={() => exportCSVReport('sources')} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors">
                <Layers size={12} className="text-blue-600" /> Source ROI Matrix (CSV)
              </button>
            </div>
          )}

          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-650' : 'text-slate-500'} />
            Refresh BI Feed
          </button>
        </div>
      </div>

      {/* Row 1: Executive KPI Panel & Health Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Business Health Gauge */}
        <div className="card border border-slate-200/80 flex flex-col justify-between items-center text-center p-6 bg-white rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-650/5 opacity-30 rounded-full blur-xl"></div>
          <div className="space-y-1 relative z-10">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-550">Business Health Score</h3>
            <p className="text-[9px] text-slate-450 font-semibold">Telemetry metrics index based on conversions</p>
          </div>
          
          <div className="relative my-4 flex items-center justify-center z-10">
            <div className="w-28 h-28 rounded-full border-8 border-slate-105 flex items-center justify-center relative shadow-sm">
              <div className="absolute inset-0 rounded-full border-8 border-indigo-100/50 border-t-indigo-600/80 animate-spin-slow"></div>
              <span className={`text-3xl font-black heading-font ${healthColor}`}>{health}</span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-md text-[9px] font-black uppercase border z-10 ${healthBg}`}>
            {health >= 75 ? 'Excellent Health' : health >= 50 ? 'Stable Operations' : 'Attention Required'}
          </div>
        </div>

        {/* Executive KPI Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-5 space-y-3 bg-white border border-slate-200/80 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Weighted Forecast</span>
              <DollarSign size={16} className="text-indigo-600 bg-indigo-50 p-0.5 rounded" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-900 heading-font">{formatRupees(revenue?.metrics.forecast_revenue)}</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Target weighted conversion forecast</p>
            </div>
            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 border-t border-slate-100 pt-2">
              <TrendingUp size={12} />
              +{revenue?.metrics.monthly_growth}% monthly growth rate
            </div>
          </div>

          <div className="card p-5 space-y-3 bg-white border border-slate-200/80 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Active Pipeline</span>
              <Briefcase size={16} className="text-blue-600 bg-blue-50 p-0.5 rounded" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-900 heading-font">{formatRupees(revenue?.metrics.total_revenue)}</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Valuation of overall active lead pipelines</p>
            </div>
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 border-t border-slate-100 pt-2">
              <Users size={12} className="text-indigo-600" />
              Aggregated across {leads?.metrics.total_leads} leads
            </div>
          </div>

          <div className="card p-5 space-y-3 bg-white border border-slate-200/80 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Conversion Yield</span>
              <Percent size={16} className="text-emerald-650 bg-emerald-50 p-0.5 rounded" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-900 heading-font">{leads?.metrics.conversion_rate}%</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Overall closed booked deal ratio</p>
            </div>
            <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 border-t border-slate-100 pt-2">
              <Zap size={12} />
              Lead generation velocity: {leads?.metrics.lead_velocity}%
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Revenue forecasting trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="card lg:col-span-2 p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Revenue trend & Collection History</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Expected pipeline revenue vs booked closed collections (Last 6 Months)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue?.revenue_trends || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} />
                <YAxis tickFormatter={(v) => `₹${v/1e5}L`} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.08)', borderRadius: '12px', fontSize: '11px', color: '#0f172a' }}
                  formatter={(value) => [formatRupees(value), undefined]} 
                />
                <Legend wrapperStyle={{ fontSize: 10, pt: 10 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" name="Expected Pipeline" strokeWidth={2} />
                <Area type="monotone" dataKey="closed" stroke="#10B981" fillOpacity={1} fill="url(#colorClosed)" name="Booked Collections" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecasting Horizons */}
        <div className="card p-5 bg-white border border-slate-200/80 rounded-xl space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Expected Forecasting Horizons</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Forward weighted target collections (30, 90, 180 Days)</p>
          </div>
          
          <div className="space-y-4 text-xs font-semibold">
            {/* Horizon bars */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">30-Day Forecast</span>
                <span className="text-slate-900 font-extrabold">{formatRupees(forecast?.forecast.forecast_30)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <div className="h-full bg-blue-550 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">90-Day Forecast</span>
                <span className="text-slate-900 font-extrabold">{formatRupees(forecast?.forecast.forecast_90)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <div className="h-full bg-indigo-550 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">180-Day Forecast</span>
                <span className="text-slate-900 font-extrabold">{formatRupees(forecast?.forecast.forecast_180)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <div className="h-full bg-purple-550 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>

            {/* Run rate summary box */}
            <div className="border border-slate-200/60 bg-slate-50/50 p-3.5 rounded-xl space-y-2">
              <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Runrate Target Summary</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-655">
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold">EXPECTED MONTHLY</span>
                  <strong className="text-slate-800 text-xs font-bold">{formatRupees(forecast?.forecast.expected_monthly)}</strong>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold">EXPECTED ANNUAL</span>
                  <strong className="text-slate-800 text-xs font-bold">{formatRupees(forecast?.forecast.expected_annual)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Funnel & Growth charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Funnel distribution chart */}
        <div className="card p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Pipeline funnel conversions</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Yield and attrition rates across sales phases</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineFunnelData} layout="vertical" margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 8, fill: '#64748b' }} width={80} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.08)', borderRadius: '12px', fontSize: '11px', color: '#0f172a' }}
                  formatter={(value, name) => [name === 'value' ? formatRupees(value) : value, name]} 
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Leads Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead growth & conversion trend */}
        <div className="card lg:col-span-2 p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Lead growth & Conversion trends</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Monthly new lead generation velocity relative to closed bookings</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leads?.growth_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.08)', borderRadius: '12px', fontSize: '11px', color: '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: 10, pt: 10 }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Leads Generated" />
                <Bar dataKey="converted" fill="#10B981" radius={[4, 4, 0, 0]} name="Conversions Closed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 4: Tables ROI & Agent performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Source ROI Analytics list */}
        <div className="card p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Acquisition Channels ROI Matrix</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Marketing efficiency rankings and revenue contributions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-550 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3">Source Channel</th>
                  <th className="py-3 text-center">Leads</th>
                  <th className="py-3 text-center">Conversions</th>
                  <th className="py-3 text-right">Revenue Yield</th>
                  <th className="py-3 text-right px-3">ROI Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-705">
                {(sources || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{item.source}</td>
                    <td className="py-3 text-center font-bold">{item.leads}</td>
                    <td className="py-3 text-center font-bold">{item.conversions}</td>
                    <td className="py-3 text-right text-emerald-600 font-black">{formatRupees(item.revenue)}</td>
                    <td className="py-3 text-right px-3 font-black">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.roi_score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                        item.roi_score >= 40 ? 'bg-amber-50 text-amber-700 border-amber-250' : 
                        'bg-slate-50 text-slate-550 border-slate-200'
                      }`}>
                        {item.roi_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Performance Dashboard List */}
        <div className="card p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Agent Efficiency Ledger</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Representative performance indexes, booking outputs, and response times</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-550 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3">Agent</th>
                  <th className="py-3 text-center">Conversions</th>
                  <th className="py-3 text-right">Revenue Closed</th>
                  <th className="py-3 text-right">Response Delay</th>
                  <th className="py-3 text-right px-3">Performance Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-705">
                {(agents || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 text-center font-bold">{item.leads_converted}/{item.leads_assigned}</td>
                    <td className="py-3 text-right text-emerald-600 font-black">{formatRupees(item.revenue_generated)}</td>
                    <td className="py-3 text-right text-slate-500 font-bold">{item.avg_response_time} hrs</td>
                    <td className="py-3 text-right px-3 font-black">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.performance_score >= 75 ? 'bg-indigo-50 text-indigo-705 border-indigo-200' :
                        item.performance_score >= 45 ? 'bg-amber-50 text-amber-705 border-amber-200' : 
                        'bg-rose-50 text-rose-705 border-rose-200'
                      }`}>
                        {item.performance_score}/105
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 5: AI Bulletins & Risk Mitigations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulletins Feed (Insights Engine) */}
        <div className="card lg:col-span-2 p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">AI Executive Intelligence Bulletins</h3>
          </div>
          
          <div className="space-y-3 text-xs font-semibold text-slate-700">
            {insights?.insights.map((ins, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50/40 border border-slate-200/60 rounded-xl flex items-start gap-3 animate-fade-in">
                <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 font-bold">
                  {idx + 1}
                </div>
                <p className="leading-relaxed mt-0.5 text-slate-655 font-semibold">{ins}</p>
              </div>
            ))}
            {insights?.insights.length === 0 && (
              <p className="text-xs text-slate-500 italic p-2">No business bulletins generated.</p>
            )}
          </div>
        </div>

        {/* Risk & Opportunity alarms */}
        <div className="card p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 text-rose-600">
            <AlertCircle size={16} className="animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Risk & Bottleneck mitigations</h3>
          </div>

          <div className="space-y-3">
            {insights?.risk_analysis.map((risk, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  risk.severity === 'high' || risk.severity === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-amber-50 border-amber-200/60 text-amber-700'
                }`}
              >
                <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-black uppercase text-[9px] block mb-0.5 tracking-wider">{risk.type}</span>
                  <span className="font-semibold text-slate-600 leading-relaxed">{risk.message}</span>
                </div>
              </div>
            ))}
            {insights?.risk_analysis.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">All operations secure. No risks flagged.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
