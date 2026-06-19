import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Kanban, Calendar, Target, UserPlus, FileText, CheckCircle2, 
  XCircle, MoreVertical, RefreshCw, DollarSign, TrendingUp, 
  Sparkles, Plus, Clock, AlertTriangle, Check, X,
  ChevronRight
} from 'lucide-react';
import { 
  getPipeline, 
  movePipelineLead, 
  getPipelineAnalytics,
  assignLead,
  createFollowUp
} from '../services/leadService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreBadge from '../components/common/ScoreBadge';
import Spinner from '../components/common/Spinner';

// Helper to format currency in Indian Rupees (Lakhs / Crores)
const formatRupees = (val) => {
  const num = Number(val || 0);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)} K`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const PIPELINE_STAGES = [
  'New Lead',
  'Qualified',
  'Contacted',
  'Site Visit Scheduled',
  'Negotiation',
  'Proposal Sent',
  'Converted',
  'Lost'
];

const STAGE_THEMES = {
  'New Lead': { border: 'border-t-slate-400', bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  'Qualified': { border: 'border-t-purple-400', bg: 'bg-purple-50/30', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'Contacted': { border: 'border-t-blue-400', bg: 'bg-blue-50/30', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  'Site Visit Scheduled': { border: 'border-t-cyan-400', bg: 'bg-cyan-50/30', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  'Negotiation': { border: 'border-t-amber-400', bg: 'bg-amber-50/30', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  'Proposal Sent': { border: 'border-t-indigo-400', bg: 'bg-indigo-50/30', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  'Converted': { border: 'border-t-emerald-400', bg: 'bg-emerald-50/30', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  'Lost': { border: 'border-t-rose-400', bg: 'bg-rose-50/30', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' }
};

export default function Pipeline() {
  const { user } = useAuth();
  const [stages, setStages] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Drag and Drop States
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Quick Action Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(null); // holds lead object
  const [showFollowUpModal, setShowFollowUpModal] = useState(null); // holds lead object

  // Form states
  const [assigneeId, setAssigneeId] = useState('');
  const [followUpForm, setFollowUpForm] = useState({
    scheduled_at: '',
    type: 'call',
    notes: ''
  });

  const dropdownRef = useRef(null);

  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  // Close active dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [pipeRes, analRes, agentsRes] = await Promise.all([
        getPipeline(),
        getPipelineAnalytics(),
        api.get('/users').catch(() => ({ data: { data: [] } })) // gracefully handle if agents can't read users (fallback in routes is done)
      ]);
      setStages(pipeRes.data.data);
      setAnalytics(analRes.data.data);
      setAgents(agentsRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pipeline data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialFetch = async () => {
      try {
        const [pipeRes, analRes, agentsRes] = await Promise.all([
          getPipeline(),
          getPipelineAnalytics(),
          api.get('/users').catch(() => ({ data: { data: [] } }))
        ]);
        if (active) {
          setStages(pipeRes.data.data);
          setAnalytics(analRes.data.data);
          setAgents(agentsRes.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch pipeline data');
      } finally {
        if (active) setLoading(false);
      }
    };
    initialFetch();
    return () => { active = false; };
  }, []);

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    setDragOverStage(null);
    setDraggedLeadId(null);

    // Find original stage of the lead
    let sourceStage = null;
    let leadObj = null;

    Object.entries(stages).forEach(([stageName, list]) => {
      const found = list.find(l => l.id === leadId);
      if (found) {
        sourceStage = stageName;
        leadObj = found;
      }
    });

    if (!sourceStage || sourceStage === targetStage) return;

    // Optimistically update frontend UI
    const updatedStages = { ...stages };
    updatedStages[sourceStage] = updatedStages[sourceStage].filter(l => l.id !== leadId);
    
    const updatedLeadObj = { ...leadObj, pipeline_stage: targetStage };
    if (!updatedStages[targetStage]) updatedStages[targetStage] = [];
    updatedStages[targetStage] = [updatedLeadObj, ...updatedStages[targetStage]];
    setStages(updatedStages);

    // Call API
    try {
      await movePipelineLead(leadId, targetStage);
      showToast(`Lead moved to ${targetStage}`);
      loadData(true); // reload analytics and actual data in background
    } catch (err) {
      console.error(err);
      setError('Failed to update stage on server. Reverting...');
      loadData(); // revert to database state
    }
  };

  const executeMove = async (leadId, targetStage) => {
    setActiveDropdownId(null);
    try {
      await movePipelineLead(leadId, targetStage);
      showToast(`Lead moved to ${targetStage}`);
      loadData(true);
    } catch (err) {
      console.error(err);
      setError('Failed to move lead stage');
    }
  };

  const openAssignModal = (lead) => {
    setActiveDropdownId(null);
    setShowAssignModal(lead);
    setAssigneeId(lead.assigned_to || '');
  };

  const handleAssignAgent = async (e) => {
    e.preventDefault();
    if (!showAssignModal) return;
    try {
      await assignLead(showAssignModal.id, assigneeId);
      showToast('Agent assigned successfully');
      setShowAssignModal(null);
      loadData(true);
    } catch (err) {
      console.error(err);
      setError('Failed to assign agent');
    }
  };

  const openFollowUpModal = (lead) => {
    setActiveDropdownId(null);
    setShowFollowUpModal(lead);
    setFollowUpForm({
      scheduled_at: '',
      type: 'call',
      notes: ''
    });
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!showFollowUpModal) return;
    try {
      await createFollowUp(showFollowUpModal.id, followUpForm);
      showToast('Follow-up scheduled successfully');
      setShowFollowUpModal(null);
      loadData(true);
    } catch (err) {
      console.error(err);
      setError('Failed to schedule follow-up');
    }
  };

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const getFollowUpBadge = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    
    // Check if overdue
    if (date < now) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
          <AlertTriangle size={10} /> Overdue ({date.toLocaleDateString('en-IN')})
        </span>
      );
    }
    
    // Check if today
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={10} /> Due Today ({date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Calendar size={10} /> Follow-up: {date.toLocaleDateString('en-IN')}
      </span>
    );
  };

  if (loading) return <Spinner />;

  // Calculate stage sum values (expected revenue)
  const stageStats = {};
  PIPELINE_STAGES.forEach(s => {
    const list = stages[s] || [];
    const sumExpected = list.reduce((acc, lead) => acc + parseFloat(lead.expected_revenue || 0), 0);
    const sumBudget = list.reduce((acc, lead) => {
      const budget = (parseFloat(lead.budget_min || 0) + parseFloat(lead.budget_max || 0)) / 2;
      return acc + budget;
    }, 0);
    stageStats[s] = { count: list.length, sumExpected, sumBudget };
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {success && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 animate-slide-in">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Main Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 heading-font tracking-tight flex items-center gap-2">
            <Kanban size={28} className="text-blue-600" />
            AI-Powered Sales Pipeline
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Lohithadharma Projects Pvt Ltd CRM & Lead Intelligence Engine
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadData(false)} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} /> Sync Board
          </button>
          <Link to="/leads/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Lead
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-2">
          <AlertTriangle size={18} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Analytics KPI Widgets */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-[0.03] rounded-full blur-xl transition-all duration-500 group-hover:scale-125"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Pipeline Value</p>
                <h3 className="text-2xl font-black text-slate-900 heading-font tracking-tight">
                  {formatRupees(analytics.pipeline_value)}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Total potential of active leads</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                <DollarSign size={18} />
              </div>
            </div>
          </div>

          <div className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-600 to-teal-600 opacity-[0.03] rounded-full blur-xl transition-all duration-500 group-hover:scale-125"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Expected Revenue</p>
                <h3 className="text-2xl font-black text-slate-900 heading-font tracking-tight">
                  {formatRupees(analytics.expected_revenue)}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Adjusted by conversion probability</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <Sparkles size={18} />
              </div>
            </div>
          </div>

          <div className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-600 to-purple-600 opacity-[0.03] rounded-full blur-xl transition-all duration-500 group-hover:scale-125"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Active Pipeline Deals</p>
                <h3 className="text-2xl font-black text-slate-900 heading-font tracking-tight">
                  {analytics.total_leads} Leads
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Leads currently in pipeline</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>

          <div className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-600 opacity-[0.03] rounded-full blur-xl transition-all duration-500 group-hover:scale-125"></div>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Closed Revenue</p>
                <h3 className="text-2xl font-black text-slate-900 heading-font tracking-tight">
                  {formatRupees(analytics.closed_revenue)}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Revenue from Converted (booked) leads</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Funnel Visual Analysis */}
      {analytics && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 heading-font flex items-center gap-2">
              <Target size={20} className="text-blue-500" />
              Pipeline Funnel Analysis
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Drop-off and Conversion rates</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
            {PIPELINE_STAGES.map((s, index) => {
              const info = analytics.stages.find(st => st.stage === s) || { count: 0, avg_days: 0.0 };
              const count = info.count;
              const pct = analytics.total_leads > 0 ? Math.round((count / analytics.total_leads) * 100) : 0;
              const avgDays = info.avg_days || 0.0;
              const theme = STAGE_THEMES[s] || STAGE_THEMES['New Lead'];

              return (
                <div key={s} className="flex flex-col justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-2 z-10 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400">
                      <ChevronRight size={12} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${theme.badge}`}>
                      {s}
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-black text-slate-900 heading-font">{count}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({pct}%)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={10} />
                    Avg: {avgDays} days
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban Board Area */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 max-h-[800px]">
        {PIPELINE_STAGES.map(stageName => {
          const list = stages[stageName] || [];
          const stats = stageStats[stageName] || { count: 0, sumExpected: 0, sumBudget: 0 };
          const theme = STAGE_THEMES[stageName] || STAGE_THEMES['New Lead'];
          const isOver = dragOverStage === stageName;

          return (
            <div
              key={stageName}
              className={`w-80 min-w-80 flex flex-col bg-slate-100/50 rounded-2xl border-t-4 ${theme.border} border-x border-b border-slate-200/50 overflow-hidden transition-all duration-200
                ${isOver ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, stageName)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stageName)}
            >
              {/* Stage Header */}
              <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    {stageName}
                    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 font-semibold text-slate-600">
                      {stats.count}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Exp: {formatRupees(stats.sumExpected)}
                  </p>
                </div>
                {stageName === 'New Lead' && (
                  <Link to="/leads/new" className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors">
                    <Plus size={16} />
                  </Link>
                )}
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[300px]">
                {list.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 text-center font-medium bg-slate-50/20">
                    Drag leads here
                  </div>
                ) : (
                  list.map(lead => {
                    const budget = (parseFloat(lead.budget_min || 0) + parseFloat(lead.budget_max || 0)) / 2;
                    const priority = lead.priority || 'Medium';
                    const probability = lead.conversion_probability || 0;
                    const isDragged = draggedLeadId === lead.id;

                    let priorityColor = 'bg-blue-50 text-blue-700 border-blue-100';
                    if (priority === 'Critical') priorityColor = 'bg-rose-50 text-rose-700 border-rose-200';
                    else if (priority === 'High') priorityColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    else if (priority === 'Low') priorityColor = 'bg-slate-50 text-slate-600 border-slate-200';

                    return (
                      <div
                        key={lead.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative group/card
                          ${isDragged ? 'opacity-40 border-dashed border-blue-400 bg-blue-50/10' : ''}`}
                      >
                        {/* Actions Button */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === lead.id ? null : lead.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {/* Quick Actions Dropdown Menu */}
                          {activeDropdownId === lead.id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-fade-in"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                                Quick Actions
                              </div>
                              <Link
                                to={`/leads/${lead.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <FileText size={14} className="text-slate-400" />
                                View Details
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => openAssignModal(lead)}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <UserPlus size={14} className="text-slate-400" />
                                  Assign Agent
                                </button>
                              )}
                              <button
                                onClick={() => openFollowUpModal(lead)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Calendar size={14} className="text-slate-400" />
                                Schedule Follow-up
                              </button>
                              
                              {stageName !== 'Converted' && (
                                <button
                                  onClick={() => executeMove(lead.id, 'Converted')}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
                                >
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                  Mark Converted
                                </button>
                              )}
                              
                              {stageName !== 'Lost' && (
                                <button
                                  onClick={() => executeMove(lead.id, 'Lost')}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors"
                                >
                                  <XCircle size={14} className="text-rose-500" />
                                  Mark Lost
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Header Info */}
                        <div className="space-y-1 mb-2 pr-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ScoreBadge category={lead.category} score={lead.current_score} />
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityColor}`}>
                              {priority}
                            </span>
                          </div>
                          <Link
                            to={`/leads/${lead.id}`}
                            className="block font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm heading-font tracking-tight truncate pt-1"
                          >
                            {lead.full_name}
                          </Link>
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-slate-100 text-slate-500 rounded">
                            {lead.source}
                          </span>
                        </div>

                        {/* Conversion Probability */}
                        <div className="space-y-1 py-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-semibold">AI Probability</span>
                            <span className="font-bold text-blue-600">{probability}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${probability}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Budget Info */}
                        <div className="mt-2 text-xs flex justify-between items-center border-t border-slate-100 pt-2 text-slate-600">
                          <span className="font-medium">Budget:</span>
                          <span className="font-bold text-slate-900">{formatRupees(budget)}</span>
                        </div>

                        {/* Agent Info */}
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100/50 pt-2">
                          <span className="font-medium text-slate-400">Agent:</span>
                          <div className="flex items-center gap-1.5 max-w-[120px] truncate">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[9px] shrink-0 border border-blue-200">
                              {lead.agent_name ? lead.agent_name[0].toUpperCase() : '?'}
                            </div>
                            <span className="font-semibold text-slate-700 truncate">
                              {lead.agent_name || 'Unassigned'}
                            </span>
                          </div>
                        </div>

                        {/* Follow-up Badges */}
                        {lead.next_followup_at && (
                          <div className="mt-2.5 pt-1.5 border-t border-slate-100/50 flex justify-center">
                            {getFollowUpBadge(lead.next_followup_at)}
                          </div>
                        )}

                        {/* Created Date */}
                        <div className="mt-2.5 text-[9px] text-slate-400 font-semibold flex items-center gap-1 justify-end">
                          <Clock size={8} />
                          Added {new Date(lead.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Agent Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 heading-font text-lg">Assign Agent</h3>
                <p className="text-xs text-slate-500 font-medium">Assign agent for {showAssignModal.full_name}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignAgent} className="p-5 space-y-4">
              <div>
                <label className="label">Select Agent</label>
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="input"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} ({a.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="btn-secondary text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 flex items-center gap-1.5"
                >
                  <Check size={16} /> Assign Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 heading-font text-lg">Schedule Follow-up</h3>
                <p className="text-xs text-slate-500 font-medium">Schedule activity for {showFollowUpModal.full_name}</p>
              </div>
              <button
                onClick={() => setShowFollowUpModal(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateFollowUp} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={followUpForm.type}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, type: e.target.value }))}
                    className="input"
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={followUpForm.scheduled_at}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes / Instructions</label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="E.g., Call in the morning to discuss the premium villa layouts..."
                  className="input h-24 resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(null)}
                  className="btn-secondary text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 flex items-center gap-1.5"
                >
                  <Check size={16} /> Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
