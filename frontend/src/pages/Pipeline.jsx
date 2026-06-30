import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Target, UserPlus, FileText, CheckCircle2, 
  XCircle, MoreVertical, RefreshCw, DollarSign, TrendingUp, 
  Sparkles, Plus, Clock, AlertTriangle, Check,
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
import { useStore } from '../store/useStore';
import ScoreBadge from '../components/common/ScoreBadge';
import { Button, Textarea, Card, Modal, Spinner } from '../components/common/UI';

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
  'New Lead': { border: 'border-t-slate-300 dark:border-t-slate-700', bg: 'bg-slate-50/40', text: 'text-slate-700 dark:text-slate-350', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  'Qualified': { border: 'border-t-purple-400', bg: 'bg-purple-500/[0.01]', text: 'text-purple-700 dark:text-purple-400', badge: 'bg-purple-50 dark:bg-purple-900/20 text-purple-750 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40' },
  'Contacted': { border: 'border-t-blue-400', bg: 'bg-blue-500/[0.01]', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-750 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40' },
  'Site Visit Scheduled': { border: 'border-t-cyan-400', bg: 'bg-cyan-500/[0.01]', text: 'text-cyan-700 dark:text-cyan-400', badge: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-750 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/40' },
  'Negotiation': { border: 'border-t-amber-400', bg: 'bg-amber-500/[0.01]', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-755 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40' },
  'Proposal Sent': { border: 'border-t-indigo-400', bg: 'bg-indigo-500/[0.01]', text: 'text-indigo-700 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-750 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40' },
  'Converted': { border: 'border-t-emerald-400', bg: 'bg-emerald-500/[0.01]', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-750 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40' },
  'Lost': { border: 'border-t-rose-400', bg: 'bg-rose-500/[0.01]', text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-900/20 text-rose-750 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40' }
};

export default function Pipeline() {
  const { user } = useAuth();
  
  // Zustand States
  const stages = useStore(state => state.pipeline);
  const setStages = useStore(state => state.setPipeline);
  const analytics = useStore(state => state.pipelineAnalytics);
  const setAnalytics = useStore(state => state.setPipelineAnalytics);
  const moveLeadOptimistic = useStore(state => state.moveLeadOptimistic);

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

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [pipeRes, analRes, agentsRes] = await Promise.all([
        getPipeline(),
        getPipelineAnalytics(),
        api.get('/users').catch(() => ({ data: { data: [] } }))
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
  }, [setStages, setAnalytics]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadData();
    });
    return () => { active = false; };
  }, [loadData]);

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
    Object.entries(stages).forEach(([stageName, list]) => {
      const found = list.find(l => l.id === leadId);
      if (found) {
        sourceStage = stageName;
      }
    });

    if (!sourceStage || sourceStage === targetStage) return;

    // Optimistically update Zustand store state
    moveLeadOptimistic(leadId, sourceStage, targetStage);
    showToast(`Lead moved to ${targetStage}`);

    // Call API
    try {
      await movePipelineLead(leadId, targetStage);
      loadData(true); 
    } catch (err) {
      console.error(err);
      setError('Failed to update stage on server. Reverting...');
      loadData(); 
    }
  };

  const executeMove = async (leadId, targetStage) => {
    setActiveDropdownId(null);
    
    // Find source stage
    let sourceStage = null;
    Object.entries(stages).forEach(([stageName, list]) => {
      if (list.find(l => l.id === leadId)) sourceStage = stageName;
    });

    if (sourceStage) {
      moveLeadOptimistic(leadId, sourceStage, targetStage);
    }
    
    try {
      await movePipelineLead(leadId, targetStage);
      showToast(`Lead moved to ${targetStage}`);
      loadData(true);
    } catch (err) {
      console.error(err);
      setError('Failed to move lead stage. Reverting...');
      loadData();
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shadow-sm animate-pulse">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
          <Clock size={10} /> Due Today ({date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
        <Calendar size={10} /> Follow-up: {date.toLocaleDateString('en-IN')}
      </span>
    );
  };

  if (loading) return <Spinner className="py-20" />;

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
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Toast Alert */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500/30"
          >
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight text-gradient">
              Pipeline Workspace
            </h1>
            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-750 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border border-indigo-200/60 dark:border-indigo-850/50">
              Interactive Kanban
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            LeadScape AI Autonomous Pipeline qualifying and conversion interface
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadData(false)} variant="secondary" size="sm" icon={RefreshCw}>
            Sync Board
          </Button>
          <Link to="/leads/new">
            <Button variant="primary" size="sm" icon={Plus}>
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics KPI Widgets */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card hoverEffect className="relative overflow-hidden group p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-[0.03] rounded-full blur-xl transition-all duration-700 group-hover:scale-150"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Pipeline Value</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight">
                  {formatRupees(analytics.pipeline_value)}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Total potential active pipeline</p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <DollarSign size={16} />
              </div>
            </div>
          </Card>

          <Card hoverEffect className="relative overflow-hidden group p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-[0.03] rounded-full blur-xl transition-all duration-700 group-hover:scale-150"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Expected Revenue</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight">
                  {formatRupees(analytics.expected_revenue)}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Adjusted by AI conversion probability</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Sparkles size={16} />
              </div>
            </div>
          </Card>

          <Card hoverEffect className="relative overflow-hidden group p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-500 opacity-[0.03] rounded-full blur-xl transition-all duration-700 group-hover:scale-150"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Active Pipeline Deals</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight">
                  {analytics.total_leads} Leads
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Profiles active inside columns</p>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-750 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                <TrendingUp size={16} />
              </div>
            </div>
          </Card>

          <Card hoverEffect className="relative overflow-hidden group p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-600 to-green-600 opacity-[0.03] rounded-full blur-xl transition-all duration-700 group-hover:scale-150"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Closed Revenue</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight">
                  {formatRupees(analytics.closed_revenue)}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Value generated from converted deals</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={16} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pipeline Funnel Visual Analysis */}
      {analytics && (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white heading-font flex items-center gap-2">
              <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
              Pipeline Velocity Funnel
            </h2>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Conversion & Drop-off Telemetry</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
            {PIPELINE_STAGES.map((s, index) => {
              const info = analytics.stages.find(st => st.stage === s) || { count: 0, avg_days: 0.0 };
              const count = info.count;
              const pct = analytics.total_leads > 0 ? Math.round((count / analytics.total_leads) * 100) : 0;
              const avgDays = info.avg_days || 0.0;
              const theme = STAGE_THEMES[s] || STAGE_THEMES['New Lead'];

              return (
                <div key={s} className="flex flex-col justify-between p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-xl relative">
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-0.5 text-slate-400 dark:text-slate-500 shadow-sm">
                      <ChevronRight size={10} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${theme.badge}`}>
                      {s.split(' ').map(w => w[0]).join('') || s}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white heading-font">{count}</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">({pct}%)</span>
                    </div>
                  </div>
                  <div className="mt-3 text-[9px] text-slate-500 dark:text-slate-450 font-semibold flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/60 pt-1.5">
                    <Clock size={8} />
                    Avg: {avgDays} days
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Kanban Board Area */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-8 px-8 max-h-[800px] custom-scrollbar">
        {PIPELINE_STAGES.map(stageName => {
          const list = stages[stageName] || [];
          const stats = stageStats[stageName] || { count: 0, sumExpected: 0, sumBudget: 0 };
          const theme = STAGE_THEMES[stageName] || STAGE_THEMES['New Lead'];
          const isOver = dragOverStage === stageName;

          return (
            <div
              key={stageName}
              className={`w-80 min-w-80 flex flex-col bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border-t-2 ${theme.border} border-x border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-all duration-200
                ${isOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, stageName)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stageName)}
            >
              {/* Stage Header */}
              <div className="p-3 bg-white/40 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                    {stageName}
                    <span className="px-2 py-0.5 text-[10px] rounded-md bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 font-black text-slate-700 dark:text-slate-300 shadow-sm">
                      {stats.count}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Exp: {formatRupees(stats.sumExpected)}
                  </p>
                </div>
                {stageName === 'New Lead' && (
                  <Link to="/leads/new" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded text-slate-500 dark:text-slate-400 transition-colors">
                    <Plus size={14} />
                  </Link>
                )}
              </div>

              {/* Cards Container with Layout Animations */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[300px]">
                {list.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-550 text-center font-bold uppercase tracking-wider bg-white/20 dark:bg-slate-900/10">
                    Drag cards here
                  </div>
                ) : (
                  <AnimatePresence>
                    {list.map(lead => {
                      const budget = (parseFloat(lead.budget_min || 0) + parseFloat(lead.budget_max || 0)) / 2;
                      const priority = lead.priority || 'Medium';
                      const probability = lead.conversion_probability || 0;
                      const isDragged = draggedLeadId === lead.id;

                      let priorityColor = 'bg-blue-50 dark:bg-blue-900/20 text-blue-755 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40';
                      if (priority === 'Critical') priorityColor = 'bg-rose-50 dark:bg-rose-900/20 text-rose-755 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40';
                      else if (priority === 'High') priorityColor = 'bg-amber-50 dark:bg-amber-900/20 text-amber-755 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
                      else if (priority === 'Low') priorityColor = 'bg-slate-100 dark:bg-slate-800/55 text-slate-600 dark:text-slate-350 border-slate-200/60 dark:border-slate-700/50';

                      return (
                        <motion.div
                          key={lead.id}
                          layoutId={lead.id}
                          layout
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing relative group/card
                            ${isDragged ? 'opacity-30 border-dashed border-indigo-450 bg-indigo-50/20' : ''}`}
                        >
                          {/* Actions Button */}
                          <div className="absolute top-3.5 right-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === lead.id ? null : lead.id);
                              }}
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <MoreVertical size={14} />
                            </button>
                            
                            {/* Quick Actions Dropdown Menu */}
                            {activeDropdownId === lead.id && (
                              <div
                                ref={dropdownRef}
                                className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 animate-fade-in"
                              >
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-750">
                                  Quick Actions
                                </div>
                                <Link
                                  to={`/leads/${lead.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <FileText size={14} className="text-slate-400" />
                                  View Details
                                </Link>
                                {isAdmin && (
                                  <button
                                    onClick={() => openAssignModal(lead)}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <UserPlus size={14} className="text-slate-400" />
                                    Assign Agent
                                  </button>
                                )}
                                <button
                                  onClick={() => openFollowUpModal(lead)}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Calendar size={14} className="text-slate-400" />
                                  Schedule Follow-up
                                </button>
                                
                                {stageName !== 'Converted' && (
                                  <button
                                    onClick={() => executeMove(lead.id, 'Converted')}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                                  >
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-450" />
                                    Mark Converted
                                  </button>
                                )}
                                
                                {stageName !== 'Lost' && (
                                  <button
                                    onClick={() => executeMove(lead.id, 'Lost')}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-700 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                  >
                                    <XCircle size={14} className="text-rose-600 dark:text-rose-450" />
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
                              className="block font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors text-sm heading-font tracking-tight truncate pt-1"
                            >
                              {lead.full_name}
                            </Link>
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                              {lead.source}
                            </span>
                          </div>

                          {/* Conversion Probability */}
                          <div className="space-y-1 py-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-550 dark:text-slate-400">
                              <span className="font-semibold">AI Probability</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{probability}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${probability}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Budget Info */}
                          <div className="mt-2 text-xs flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-2 text-slate-500 dark:text-slate-455">
                            <span className="font-medium">Budget:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupees(budget)}</span>
                          </div>

                          {/* Agent Info */}
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-455 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                            <span className="font-medium text-slate-400 dark:text-slate-500">Agent:</span>
                            <div className="flex items-center gap-1.5 max-w-[120px] truncate">
                              <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 border border-indigo-200/60 dark:border-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {lead.agent_name ? lead.agent_name[0].toUpperCase() : '?'}
                              </div>
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {lead.agent_name || 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {/* Follow-up Badges */}
                          {lead.next_followup_at && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-center">
                              {getFollowUpBadge(lead.next_followup_at)}
                            </div>
                          )}

                          {/* Created Date */}
                          <div className="mt-2.5 text-[9px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 justify-end">
                            <Clock size={8} />
                            Added {new Date(lead.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Agent Modal (Using UI.jsx Modal Component) */}
      <Modal
        isOpen={!!showAssignModal}
        onClose={() => setShowAssignModal(null)}
        title="Assign Agent"
        subtitle={showAssignModal ? `Select an representative for ${showAssignModal.full_name}` : ''}
      >
        <form onSubmit={handleAssignAgent} className="space-y-4 pt-1">
          <div>
            <label className="label">Select Agent</label>
            <select
              required
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="input w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200"
            >
              <option value="">-- Choose Agent --</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.full_name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              onClick={() => setShowAssignModal(null)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Check}
            >
              Assign Agent
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Follow-up Modal (Using UI.jsx Modal Component) */}
      <Modal
        isOpen={!!showFollowUpModal}
        onClose={() => setShowFollowUpModal(null)}
        title="Schedule Follow-up"
        subtitle={showFollowUpModal ? `Schedule a direct customer touchpoint activity for ${showFollowUpModal.full_name}` : ''}
      >
        <form onSubmit={handleCreateFollowUp} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                value={followUpForm.type}
                onChange={(e) => setFollowUpForm(prev => ({ ...prev, type: e.target.value }))}
                className="input w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200"
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
                className="input w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-250"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes / Instructions</label>
            <Textarea
              value={followUpForm.notes}
              onChange={(e) => setFollowUpForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="E.g., Call in the morning to discuss the premium villa layouts..."
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              onClick={() => setShowFollowUpModal(null)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Check}
            >
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
