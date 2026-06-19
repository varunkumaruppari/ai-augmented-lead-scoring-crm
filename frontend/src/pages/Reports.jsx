import { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, FileText, Calendar, Mail, 
  Printer, Play
} from 'lucide-react';
import { 
  getReportCenterMetadata, generateReport, scheduleReport, 
  getExecutiveSummaryAI, getRevenueAnalytics, getLeadAnalyticsList, 
  getAgentAnalyticsList, getSourceAnalyticsList 
} from '../services/leadService';
import Spinner from '../components/common/Spinner';

const formatRupees = (val) => {
  if (val === undefined || val === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export default function Reports() {
  const [metadata, setMetadata] = useState(null);
  const [execSummary, setExecSummary] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [leads, setLeads] = useState(null);
  const [agents, setAgents] = useState(null);
  const [sources, setSources] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Forms state
  const [builderForm, setBuilderForm] = useState({
    name: 'Executive Performance Summary',
    type: 'executive', // lead, revenue, pipeline, agent, conversion, executive, ai
    format: 'print' // pdf, excel, csv, print
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: 'Weekly Operational Revenue Report',
    report_type: 'revenue',
    frequency: 'weekly', // daily, weekly, monthly, quarterly
    recipients: 'ceo@lohithadharma.com, board@lohithadharma.com'
  });

  // Active compiled report to display in preview modal
  const [activeReport, setActiveReport] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [metaRes, execRes, revRes, leadRes, agentRes, srcRes] = await Promise.all([
        getReportCenterMetadata(),
        getExecutiveSummaryAI(),
        getRevenueAnalytics(),
        getLeadAnalyticsList(),
        getAgentAnalyticsList(),
        getSourceAnalyticsList()
      ]);

      setMetadata(metaRes.data.data);
      setExecSummary(execRes.data.data);
      setRevenue(revRes.data.data);
      setLeads(leadRes.data.data);
      setAgents(agentRes.data.data);
      setSources(srcRes.data.data);
    } catch (err) {
      console.error('Failed to load BI Reports metadata:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialFetch = async () => {
      try {
        const [metaRes, execRes, revRes, leadRes, agentRes, srcRes] = await Promise.all([
          getReportCenterMetadata(),
          getExecutiveSummaryAI(),
          getRevenueAnalytics(),
          getLeadAnalyticsList(),
          getAgentAnalyticsList(),
          getSourceAnalyticsList()
        ]);
        if (active) {
          setMetadata(metaRes.data.data);
          setExecSummary(execRes.data.data);
          setRevenue(revRes.data.data);
          setLeads(leadRes.data.data);
          setAgents(agentRes.data.data);
          setSources(srcRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load BI Reports metadata on mount:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialFetch();
    return () => { active = false; };
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await generateReport(builderForm);
      // Refresh list
      const updatedMeta = await getReportCenterMetadata();
      setMetadata(updatedMeta.data.data);

      // Create simulated compiled payload to preview in print-view
      compileActiveReportData(builderForm.name, builderForm.type);

      // If CSV or Excel format was selected, trigger immediate browser CSV download
      if (builderForm.format === 'csv' || builderForm.format === 'excel') {
        downloadCSVPayload(builderForm.name, builderForm.type);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await scheduleReport(scheduleForm);
      // Reset form & reload
      setScheduleForm({
        name: 'Weekly Operational Revenue Report',
        report_type: 'revenue',
        frequency: 'weekly',
        recipients: 'ceo@lohithadharma.com, board@lohithadharma.com'
      });
      const updatedMeta = await getReportCenterMetadata();
      setMetadata(updatedMeta.data.data);
      alert('Report Scheduled successfully! Dynamic test logs have been populated.');
    } catch (err) {
      console.error('Failed to schedule report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Compile internal metrics into active preview window
  const compileActiveReportData = (name, type) => {
    setActiveReport({
      name,
      type,
      generated_at: new Date().toLocaleString('en-IN'),
      summary: execSummary,
      revenue: revenue?.metrics,
      leads: leads?.metrics,
      agentsList: agents,
      sourcesList: sources
    });
  };

  // CSV file builder for local download
  const downloadCSVPayload = (name, type) => {
    let headers;
    let rows;

    if (type === 'executive') {
      headers = ['Category', 'Metric', 'Value'];
      rows = [
        ['Revenue', 'Total Revenue', revenue?.metrics?.total_revenue || 0],
        ['Revenue', 'Closed Revenue', revenue?.metrics?.closed_revenue || 0],
        ['Revenue', 'Forecast Revenue', revenue?.metrics?.forecast_revenue || 0],
        ['Leads', 'Total Leads', leads?.metrics?.total_leads || 0],
        ['Leads', 'Conversion Rate', `${leads?.metrics?.conversion_rate || 0}%`],
        ['Leads', 'Health Index Score', `${execSummary?.business_health_score || 82}/100`]
      ];
    } else if (type === 'revenue') {
      headers = ['Horizon', 'Forecast target', 'Monthly estimate'];
      rows = [
        ['30-Day forecast', revenue?.metrics?.forecast_revenue || 0, revenue?.metrics?.forecast_revenue || 0],
        ['90-Day forecast', (revenue?.metrics?.forecast_revenue || 0) * 2.5, revenue?.metrics?.forecast_revenue || 0],
        ['Annualized estimate', (revenue?.metrics?.forecast_revenue || 0) * 10, '—']
      ];
    } else if (type === 'agent') {
      headers = ['Agent', 'Score', 'Assigned', 'Conversions', 'Yield'];
      rows = (agents || []).map(a => [a.name, `${a.performance_score}/100`, a.leads_assigned, a.leads_converted, a.revenue_generated]);
    } else {
      headers = ['Source', 'Leads', 'Conversions', 'ROI Score'];
      rows = (sources || []).map(s => [s.source, s.leads, s.conversions, `${s.roi_score}/100`]);
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${name.toLowerCase().replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Running reporting compilers...</p>
      </div>
    );
  }

  // Calculate scorecard values
  const healthScore = execSummary?.business_health_score || (revenue?.metrics?.closed_revenue > 0 ? 82 : 55);
  const revenueScore = revenue?.metrics ? Math.min(100, Math.round(((revenue.metrics.closed_revenue || 0) / (revenue.metrics.total_revenue || 1)) * 100)) : 65;
  const salesScore = leads?.metrics ? Math.round((leads.metrics.conversion_rate || 0) * 3.5) : 72;
  const agentScore = agents?.length ? Math.round(agents.reduce((acc, a) => acc + (a.performance_score || 0), 0) / agents.length) : 80;
  const qualityScore = leads?.metrics ? Math.round((((leads.metrics.hot_leads || 0) + (leads.metrics.warm_leads || 0)) / (leads.metrics.total_leads || 1)) * 100) : 70;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Dynamic Style injection for clean PDF print layouts */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-area, #printable-area * {
            visibility: visible !important;
          }
          #printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            z-index: 9999 !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-100 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 heading-font tracking-tight flex items-center gap-2">
            BI Reporting Center
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">C-Suite Controller</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Corporate PDF templates · Scheduled automated emails · Delivery logs</p>
        </div>
        <button onClick={() => loadData(true)} disabled={refreshing} className="btn-secondary flex items-center gap-1.5 text-xs py-2">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Reload System Metadata
        </button>
      </div>

      {/* Row 1: Health Score Circular Gauge & C-Suite KPI Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        {/* Health Score Gauge */}
        <div className="card p-6 bg-slate-900 text-white rounded-xl border-none shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl"></div>
          
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Executive Health Score</span>
            <span className="text-[10px] text-slate-500">BI calculated corporate health index</span>
          </div>

          <div className="relative w-24 h-24 rounded-full border-8 border-slate-800 flex items-center justify-center my-3">
            <span className="text-3xl font-black text-violet-400">{healthScore}</span>
          </div>

          <div className="px-3 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded text-[9px] font-black uppercase">
            C-Suite Index Stable
          </div>
        </div>

        {/* Corporate KPI Scorecards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4 space-y-2 bg-white border border-slate-100 shadow-sm rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Revenue Score</span>
            <h3 className="text-xl font-black text-slate-800 heading-font">{revenueScore}/100</h3>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${revenueScore}%` }}></div>
            </div>
          </div>

          <div className="card p-4 space-y-2 bg-white border border-slate-100 shadow-sm rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Sales Score</span>
            <h3 className="text-xl font-black text-slate-800 heading-font">{salesScore}/100</h3>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${salesScore}%` }}></div>
            </div>
          </div>

          <div className="card p-4 space-y-2 bg-white border border-slate-100 shadow-sm rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Agent Score</span>
            <h3 className="text-xl font-black text-slate-800 heading-font">{agentScore}/100</h3>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${agentScore}%` }}></div>
            </div>
          </div>

          <div className="card p-4 space-y-2 bg-white border border-slate-100 shadow-sm rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Lead Quality</span>
            <h3 className="text-xl font-black text-slate-800 heading-font">{qualityScore}/100</h3>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: `${qualityScore}%` }}></div>
            </div>
          </div>

          <div className="card p-4 space-y-2 bg-white border border-slate-100 shadow-sm rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Engagement</span>
            <h3 className="text-xl font-black text-slate-800 heading-font">88/100</h3>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-pink-500" style={{ width: '88%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Builder & Schedulers Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        
        {/* Instant Report Builder */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 border-b pb-2 border-slate-100">
            <FileText size={16} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Interactive Report Builder</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="space-y-1">
              <label className="block text-slate-400 uppercase text-[9px] font-bold">Report File Name</label>
              <input 
                type="text" 
                className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                value={builderForm.name}
                onChange={e => setBuilderForm(p => ({ ...p, name: e.target.value }))}
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-400 uppercase text-[9px] font-bold">Report Type Segment</label>
                <select 
                  className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                  value={builderForm.type}
                  onChange={e => setBuilderForm(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="executive">Executive Summary Report</option>
                  <option value="revenue">Revenue Forecast Report</option>
                  <option value="agent">Agent Performance Report</option>
                  <option value="sources">Lead Source ROI Report</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 uppercase text-[9px] font-bold">Download/Export Format</label>
                <select 
                  className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                  value={builderForm.format}
                  onChange={e => setBuilderForm(p => ({ ...p, format: e.target.value }))}
                >
                  <option value="print">Interactive Print View</option>
                  <option value="csv">Standard CSV File</option>
                  <option value="excel">Excel Compatible Ledger</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={actionLoading}
              className="w-full btn-primary text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
            >
              {actionLoading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Generate & Process Export
            </button>
          </form>
        </div>

        {/* Automated Delivery Scheduler */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 border-b pb-2 border-slate-100">
            <Calendar size={16} className="text-violet-600" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Automated Email Scheduler</h3>
          </div>

          <form onSubmit={handleSchedule} className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-400 uppercase text-[9px] font-bold">Schedule Rule Title</label>
                <input 
                  type="text"
                  className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                  value={scheduleForm.name}
                  onChange={e => setScheduleForm(p => ({ ...p, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 uppercase text-[9px] font-bold">Trigger Frequency</label>
                <select 
                  className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                  value={scheduleForm.frequency}
                  onChange={e => setScheduleForm(p => ({ ...p, frequency: e.target.value }))}
                >
                  <option value="daily">Daily Run (08:00 AM)</option>
                  <option value="weekly">Weekly Run (Monday)</option>
                  <option value="monthly">Monthly Run (1st Day)</option>
                  <option value="quarterly">Quarterly Run (End Period)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-400 uppercase text-[9px] font-bold">Reports Parameter Type</label>
                <select 
                  className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                  value={scheduleForm.report_type}
                  onChange={e => setScheduleForm(p => ({ ...p, report_type: e.target.value }))}
                >
                  <option value="executive">Executive Summary</option>
                  <option value="revenue">Revenue Forecasts</option>
                  <option value="agent">Agent Telemetry Ledger</option>
                  <option value="sources">Sources ROI Matrix</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 uppercase text-[9px] font-bold">Recipient Emails (comma-sep)</label>
                <input 
                  type="text" 
                  className="input text-xs py-2 bg-slate-50 border border-slate-200 text-slate-800 w-full"
                  value={scheduleForm.recipients}
                  onChange={e => setScheduleForm(p => ({ ...p, recipients: e.target.value }))}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={actionLoading}
              className="w-full btn-secondary text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 shadow-sm"
            >
              {actionLoading ? <RefreshCw size={12} className="animate-spin" /> : <Mail size={12} />}
              Confirm Scheduler Rule
            </button>
          </form>
        </div>

      </div>

      {/* active preview compiled report area */}
      {activeReport && (
        <div className="card p-6 bg-white border border-slate-200 shadow-xl rounded-xl space-y-6 relative animate-fadeIn" id="printable-area">
          
          {/* Brand header */}
          <div className="flex justify-between items-start border-b pb-4 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">L</div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900">LOHITHADHARMA PROJECTS</h2>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Corporate BI intelligence Suite</p>
                </div>
              </div>
            </div>
            
            <div className="text-right text-[10px] text-slate-400 font-semibold space-y-0.5">
              <p>Report: <strong className="text-slate-800">{activeReport.name}</strong></p>
              <p>Compiled: {activeReport.generated_at}</p>
              <p>Segment: <span className="uppercase text-indigo-600 font-bold">{activeReport.type}</span></p>
            </div>
          </div>

          {/* Report Specific Template Layouts */}
          {activeReport.type === 'executive' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1"><Sparkles size={12} className="text-amber-500" /> Executive AI Bulletins Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{activeReport.summary?.key_achievements || "No achievements summary available."}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{activeReport.summary?.revenue_highlights || "No revenue highlights available."}</p>
              </div>

              {/* Stats tables inside print report */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="border border-slate-100 p-3 rounded-lg space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Revenue metrics</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Closed Sales:</span><strong className="text-slate-800">{formatRupees(activeReport.revenue?.closed_revenue)}</strong></div>
                    <div className="flex justify-between"><span>Forecast target:</span><strong className="text-slate-800">{formatRupees(activeReport.revenue?.forecast_revenue)}</strong></div>
                    <div className="flex justify-between"><span>Total Active pipeline:</span><strong className="text-slate-800">{formatRupees(activeReport.revenue?.total_revenue)}</strong></div>
                  </div>
                </div>
                
                <div className="border border-slate-100 p-3 rounded-lg space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Leads metrics</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Active Leads count:</span><strong className="text-slate-800">{activeReport.leads?.total_leads || 0}</strong></div>
                    <div className="flex justify-between"><span>Hot segment ratio:</span><strong className="text-slate-800">{activeReport.leads?.hot_leads || 0} leads</strong></div>
                    <div className="flex justify-between"><span>Closed ratio:</span><strong className="text-slate-800">{activeReport.leads?.conversion_rate || 0}%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport.type === 'revenue' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Forecast Horizons Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="py-2">Period Horizon</th>
                      <th className="py-2 text-right">Target expected revenue</th>
                      <th className="py-2 text-right">Yield Runrate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr><td className="py-2">30-Day Outlook</td><td className="py-2 text-right font-bold">{formatRupees(activeReport.revenue?.forecast_revenue)}</td><td className="py-2 text-right text-slate-400">{formatRupees(activeReport.revenue?.forecast_revenue)}/mo</td></tr>
                    <tr><td className="py-2">90-Day Outlook</td><td className="py-2 text-right font-bold">{formatRupees((activeReport.revenue?.forecast_revenue || 0) * 2.5)}</td><td className="py-2 text-right text-slate-400">{formatRupees(activeReport.revenue?.forecast_revenue)}/mo</td></tr>
                    <tr><td className="py-2">Expected Annual outlook</td><td className="py-2 text-right font-bold">{formatRupees((activeReport.revenue?.forecast_revenue || 0) * 10)}</td><td className="py-2 text-right text-slate-400">weighted collections</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport.type === 'agent' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Rep efficiency metrics ledger</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="py-2">Representative</th>
                      <th className="py-2 text-center">Score</th>
                      <th className="py-2 text-center">Assigned</th>
                      <th className="py-2 text-center">Closed Bookings</th>
                      <th className="py-2 text-right">Revenue Closed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(activeReport.agentsList || []).map((a, i) => (
                      <tr key={i}>
                        <td className="py-2 font-bold">{a.name}</td>
                        <td className="py-2 text-center">{a.performance_score}/100</td>
                        <td className="py-2 text-center">{a.leads_assigned}</td>
                        <td className="py-2 text-center">{a.leads_converted}</td>
                        <td className="py-2 text-right font-bold text-emerald-600">{formatRupees(a.revenue_generated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport.type === 'sources' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Acquisition channel ROI performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="py-2">Acquisition Channel</th>
                      <th className="py-2 text-center">Leads Generated</th>
                      <th className="py-2 text-center">Conversions</th>
                      <th className="py-2 text-right">ROI Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(activeReport.sourcesList || []).map((s, i) => (
                      <tr key={i}>
                        <td className="py-2 font-bold">{s.source}</td>
                        <td className="py-2 text-center">{s.leads}</td>
                        <td className="py-2 text-center">{s.conversions}</td>
                        <td className="py-2 text-right font-bold">{s.roi_score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI recommendations segment */}
          <div className="border-t pt-4 border-slate-200 space-y-2 text-xs font-semibold text-slate-600">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">AI Strategist Recommendations</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-rose-500 font-bold block">RISKS DETECTED</span>
                <p className="bg-rose-50 text-rose-800 rounded p-2 text-[11px] leading-relaxed border border-rose-100/50">{activeReport.summary?.risk_areas || "No risks detected."}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-emerald-600 font-bold block">OPPORTUNITIES DETECTED</span>
                <p className="bg-emerald-50 text-emerald-800 rounded p-2 text-[11px] leading-relaxed border border-emerald-100/50">{activeReport.summary?.opportunities || "No opportunities detected."}</p>
              </div>
            </div>
            
            <div className="space-y-1 pt-2">
              <span className="text-[9px] text-indigo-500 font-bold block">PROPOSED ROADMAP ACTIONS</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-700">
                {activeReport.summary?.recommended_actions ? (
                  activeReport.summary.recommended_actions.map((act, i) => (
                    <div key={i} className="p-2 bg-slate-50 border border-slate-100 rounded-lg">{act}</div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No recommendations available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Print tools */}
          <div className="border-t pt-4 border-slate-200 flex justify-end gap-2 no-print">
            <button 
              onClick={() => setActiveReport(null)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Close Preview
            </button>
            <button 
              onClick={handlePrint}
              className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-md shadow-indigo-100"
            >
              <Printer size={12} /> Print or Save PDF
            </button>
          </div>

        </div>
      )}

      {/* Row 3: History list and delivery logs tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        
        {/* Report history logs */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Report Generation Logbook</h3>
            <p className="text-[10px] text-slate-400 font-medium">Searchable listing of generated BI documents</p>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">Document Name</th>
                  <th className="py-2 text-center">Format</th>
                  <th className="py-2 text-center">Triggered By</th>
                  <th className="py-2 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metadata?.history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold">{h.name}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded uppercase font-black text-[9px] ${
                        h.format === 'csv' || h.format === 'excel' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {h.format}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-slate-400">{h.generator_name || 'System Auto'}</td>
                    <td className="py-2.5 text-right text-slate-400 font-semibold">{new Date(h.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {metadata?.history.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400 italic">No reports generated yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email delivery logs */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Email Transmission Registry</h3>
            <p className="text-[10px] text-slate-400 font-medium">Automatic delivery reports for C-Suite summaries</p>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">Report Target</th>
                  <th className="py-2">Recipient Email</th>
                  <th className="py-2 text-center">Delivery Status</th>
                  <th className="py-2 text-right">Sent Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metadata?.logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold truncate max-w-[120px]">{log.report_name}</td>
                    <td className="py-2.5 text-slate-500 font-bold">{log.recipient_email}</td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] uppercase font-black">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-semibold">{new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
                {metadata?.logs.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400 italic">No delivery events logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 4: Scheduled lists cards */}
      <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl space-y-4 no-print">
        <div>
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Active Auto-Delivery Rules</h3>
          <p className="text-[10px] text-slate-400 font-medium">Recurring reports configured for periodic dispatch</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metadata?.schedules.map((item, idx) => (
            <div key={idx} className="border border-slate-100 p-4 rounded-xl space-y-3 hover:bg-slate-50/50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 leading-normal">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 capitalize font-bold">{item.report_type} report · {item.frequency}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] uppercase font-black">Active</span>
              </div>
              
              <div className="text-[10px] text-slate-500 font-semibold space-y-1">
                <p className="truncate">Recipients: <strong className="text-slate-700 font-bold">{item.recipients}</strong></p>
                <p>Last trigger: <strong className="text-slate-700 font-bold">{item.last_run ? new Date(item.last_run).toLocaleString('en-IN') : 'Never'}</strong></p>
              </div>
            </div>
          ))}
          {metadata?.schedules.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-6 col-span-3">No report delivery schedules established.</p>
          )}
        </div>
      </div>

    </div>
  );
}
