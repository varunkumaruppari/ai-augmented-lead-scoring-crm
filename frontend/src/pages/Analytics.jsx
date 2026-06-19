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

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

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
      rows = agents.map(a => [
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
      rows = sources.map(s => [
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
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Compiling executive business intelligence telemetry...</p>
      </div>
    );
  }

  // Health color mapping
  const health = insights?.business_health_score || 0;
  const healthColor = health >= 75 ? 'text-emerald-500' : health >= 50 ? 'text-amber-500' : 'text-rose-500';
  const healthBg = health >= 75 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : health >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600';

  const pipelineFunnelData = forecast?.funnel || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 heading-font tracking-tight flex items-center gap-2">
            BI Analytics & Business Intelligence Hub
            <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise Suite</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Real-time forecasting algorithms · Strategic forecasting matrices</p>
        </div>
        
        {/* Export & Actions */}
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="btn-primary text-xs font-bold py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-100"
          >
            <Download size={14} /> Export Report
          </button>
          
          {exportMenuOpen && (
            <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl py-2 w-52 z-50 animate-fadeIn text-xs text-slate-700 font-semibold">
              <button onClick={() => exportCSVReport('executive')} className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2">
                <FileText size={12} className="text-indigo-500" /> Executive summary (CSV)
              </button>
              <button onClick={() => exportCSVReport('revenue')} className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2">
                <DollarSign size={12} className="text-emerald-500" /> Revenue & Forecasts (CSV)
              </button>
              <button onClick={() => exportCSVReport('agent')} className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2">
                <Award size={12} className="text-amber-500" /> Agent Performance (CSV)
              </button>
              <button onClick={() => exportCSVReport('sources')} className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2">
                <Layers size={12} className="text-blue-500" /> Source ROI Matrix (CSV)
              </button>
            </div>
          )}

          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh BI Feed
          </button>
        </div>
      </div>

      {/* Row 1: Executive KPI Panel & Health Score Circular Index */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Business Health Gauge */}
        <div className="card border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Health Score</h3>
            <p className="text-[10px] text-slate-500">Telemetry metric based on conversions & ROI</p>
          </div>
          
          <div className="relative my-4 flex items-center justify-center">
            {/* Health circle gauge representation */}
            <div className="w-28 h-28 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-8 border-indigo-500 border-t-transparent animate-spin-slow opacity-10"></div>
              <span className={`text-3xl font-black ${healthColor}`}>{health}</span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${healthBg}`}>
            {health >= 75 ? 'Excellent Health' : health >= 50 ? 'Stable Operations' : 'Attention Required'}
          </div>
        </div>

        {/* Executive KPI Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-5 space-y-3 bg-white border border-slate-100 shadow-sm rounded-xl">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Weighted Forecast</span>
              <DollarSign size={16} className="text-indigo-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-800 heading-font">{formatRupees(revenue?.metrics.forecast_revenue)}</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Target weighted conversion forecast</p>
            </div>
            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp size={12} />
              +{revenue?.metrics.monthly_growth}% monthly growth rate
            </div>
          </div>

          <div className="card p-5 space-y-3 bg-white border border-slate-100 shadow-sm rounded-xl">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Active Pipeline</span>
              <Briefcase size={16} className="text-blue-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-800 heading-font">{formatRupees(revenue?.metrics.total_revenue)}</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Valuation of overall active lead pipelines</p>
            </div>
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Users size={12} />
              Aggregated across {leads?.metrics.total_leads} leads
            </div>
          </div>

          <div className="card p-5 space-y-3 bg-white border border-slate-100 shadow-sm rounded-xl">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Conversion Yield</span>
              <Percent size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-800 heading-font">{leads?.metrics.conversion_rate}%</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Overall closed booked deal ratio</p>
            </div>
            <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
              <Zap size={12} />
              Lead generation velocity: {leads?.metrics.lead_velocity}%
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Revenue forecasting & monthly comparison trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="card lg:col-span-2 p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Revenue trend & Collection History</h3>
            <p className="text-[10px] text-slate-400">Expected pipeline revenue vs booked closed collections (Last 6 Months)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue?.revenue_trends || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tickFormatter={(v) => `₹${v/1e5}L`} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip formatter={(value) => formatRupees(value)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" name="Expected Pipeline" strokeWidth={2} />
                <Area type="monotone" dataKey="closed" stroke="#10B981" fillOpacity={1} fill="url(#colorClosed)" name="Booked Collections" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecasting Horizons bar chart */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Expected Forecasting Horizons</h3>
            <p className="text-[10px] text-slate-400">Forward weighted target collections (30, 90, 180 Days)</p>
          </div>
          
          <div className="space-y-4 text-xs font-semibold">
            {/* Horizon bars */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">30-Day Forecast</span>
                <span className="text-slate-800 font-extrabold">{formatRupees(forecast?.forecast.forecast_30)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">90-Day Forecast</span>
                <span className="text-slate-800 font-extrabold">{formatRupees(forecast?.forecast.forecast_90)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">180-Day Forecast</span>
                <span className="text-slate-800 font-extrabold">{formatRupees(forecast?.forecast.forecast_180)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>

            {/* Run rate summary box */}
            <div className="border border-slate-100 bg-slate-50 p-3 rounded-lg space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Runrate Target Summary</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                <div>
                  <span className="block text-slate-400">Expected Monthly</span>
                  <strong className="text-slate-800 text-xs font-bold">{formatRupees(forecast?.forecast.expected_monthly)}</strong>
                </div>
                <div>
                  <span className="block text-slate-400">Expected Annual</span>
                  <strong className="text-slate-800 text-xs font-bold">{formatRupees(forecast?.forecast.expected_annual)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Leads Funnel and conversion charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline Funnel Stage Distribution */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Pipeline funnel conversions</h3>
            <p className="text-[10px] text-slate-400">Yield and attrition rates across sales phases</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineFunnelData} layout="vertical" margin={{ left: -10 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={(value, name) => [name === 'value' ? formatRupees(value) : value, name]} />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Leads Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead growth & conversion trend */}
        <div className="card lg:col-span-2 p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Lead growth & Conversion trends</h3>
            <p className="text-[10px] text-slate-400">Monthly new lead generation velocity relative to closed bookings</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leads?.growth_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Leads Generated" />
                <Bar dataKey="converted" fill="#10B981" radius={[4, 4, 0, 0]} name="Conversions Closed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 4: Source ROI & Agent Performance Dashboard tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Source ROI Analytics list */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Lead Channel Source ROI Analysis</h3>
              <p className="text-[10px] text-slate-400">Marketing efficiency rankings and revenue contributions</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">Source</th>
                  <th className="py-2 text-center">Leads</th>
                  <th className="py-2 text-center">Conversions</th>
                  <th className="py-2 text-right">Revenue Yield</th>
                  <th className="py-2 text-right">ROI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sources.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold">{item.source}</td>
                    <td className="py-2.5 text-center">{item.leads}</td>
                    <td className="py-2.5 text-center">{item.conversions}</td>
                    <td className="py-2.5 text-right text-emerald-600 font-bold">{formatRupees(item.revenue)}</td>
                    <td className="py-2.5 text-right font-black">
                      <span className={`px-2 py-0.5 rounded ${
                        item.roi_score >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        item.roi_score >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
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
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Agent Efficiency Ledger</h3>
            <p className="text-[10px] text-slate-400">Representative performance indexes, booking outputs, and response times</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">Agent</th>
                  <th className="py-2 text-center">Conversions</th>
                  <th className="py-2 text-right">Revenue Closed</th>
                  <th className="py-2 text-right">Response Delay</th>
                  <th className="py-2 text-right">Performance index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {agents.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold">{item.name}</td>
                    <td className="py-2.5 text-center">{item.leads_converted}/{item.leads_assigned}</td>
                    <td className="py-2.5 text-right text-emerald-600 font-bold">{formatRupees(item.revenue_generated)}</td>
                    <td className="py-2.5 text-right text-slate-400 font-semibold">{item.avg_response_time} hrs</td>
                    <td className="py-2.5 text-right font-black">
                      <span className={`px-2 py-0.5 rounded ${
                        item.performance_score >= 75 ? 'bg-indigo-50 text-indigo-700' :
                        item.performance_score >= 45 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {item.performance_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 5: Insights Engine bulletins and Risk mitigated warnings list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulletins Feed (Insights Engine) */}
        <div className="card lg:col-span-2 p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">AI Executive Intelligence Bulletins</h3>
          </div>
          
          <div className="space-y-2 text-xs font-semibold text-slate-600">
            {insights?.insights.map((ins, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100/50 rounded-xl flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <p className="leading-relaxed mt-0.5">{ins}</p>
              </div>
            ))}
            {insights?.insights.length === 0 && (
              <p className="text-xs text-slate-400 italic">No business bulletins generated.</p>
            )}
          </div>
        </div>

        {/* Risk & Opportunity analysis alarms list */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 text-rose-500">
            <AlertCircle size={16} className="animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Risk & Bottleneck mitigations</h3>
          </div>

          <div className="space-y-2">
            {insights?.risk_analysis.map((risk, index) => (
              <div 
                key={index} 
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  risk.severity === 'high' || risk.severity === 'critical'
                    ? 'bg-rose-50 border-rose-100 text-rose-700'
                    : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}
              >
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-black uppercase text-[9px] block mb-0.5">{risk.type}</span>
                  <span className="font-medium text-slate-600 leading-normal">{risk.message}</span>
                </div>
              </div>
            ))}
            {insights?.risk_analysis.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">All operations secure. No risks flagged.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
