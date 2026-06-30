import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle2, 
  Plus, Check, X, RefreshCw, ChevronRight
} from 'lucide-react';
import { 
  getAllFollowUps, 
  completeFollowUpDirect, 
  updateFollowUp, 
  createFollowUpDirect,
  getLeads
} from '../services/leadService';
import Spinner from '../components/common/Spinner';

const PRIORITY_THEMES = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  Low: 'bg-slate-50 text-slate-650 border-slate-200'
};

const TYPE_EMOJIS = {
  call: '📞 Call',
  email: '✉️ Email',
  site_visit: '🏢 Site Visit',
  meeting: '🤝 Meeting'
};

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tab states: today, upcoming, overdue, completed
  const [activeTab, setActiveTab] = useState('today');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(null); // holds task object
  const [showRescheduleModal, setShowRescheduleModal] = useState(null); // holds task object

  // Form states
  const [outcome, setOutcome] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [createForm, setCreateForm] = useState({
    lead_id: '',
    type: 'call',
    priority: 'Medium',
    scheduled_at: '',
    notes: ''
  });

  const fetchFollowUps = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await getAllFollowUps({ status: activeTab, priority: filterPriority });
      setFollowUps(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch follow-up list');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialFetch = async () => {
      try {
        const res = await getAllFollowUps({ status: activeTab, priority: filterPriority });
        if (active) {
          setFollowUps(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch follow-up list');
      } finally {
        if (active) setLoading(false);
      }
    };
    initialFetch();
    return () => { active = false; };
  }, [activeTab, filterPriority]);

  useEffect(() => {
    let active = true;
    const initialFetchLeads = async () => {
      try {
        const res = await getLeads({ limit: 100 });
        if (active) {
          setLeads(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load leads list:', err);
      }
    };
    initialFetchLeads();
    return () => { active = false; };
  }, []);

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!showCompleteModal) return;
    try {
      await completeFollowUpDirect(showCompleteModal.id, outcome);
      showToast('Follow-up completed successfully!');
      setShowCompleteModal(null);
      setOutcome('');
      fetchFollowUps(true);
    } catch (err) {
      console.error(err);
      setError('Failed to mark task as completed');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!showRescheduleModal) return;
    try {
      await updateFollowUp(showRescheduleModal.id, { scheduled_at: rescheduleDate });
      showToast('Follow-up rescheduled successfully!');
      setShowRescheduleModal(null);
      setRescheduleDate('');
      fetchFollowUps(true);
    } catch (err) {
      console.error(err);
      setError('Failed to reschedule task');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createFollowUpDirect(createForm);
      showToast('New follow-up scheduled successfully!');
      setShowCreateModal(false);
      setCreateForm({
        lead_id: '',
        type: 'call',
        priority: 'Medium',
        scheduled_at: '',
        notes: ''
      });
      fetchFollowUps(true);
    } catch (err) {
      console.error(err);
      setError('Failed to schedule new follow-up');
    }
  };

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {success && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 animate-slide-in">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 heading-font tracking-tight text-gradient">
              Follow-Ups Workspace
            </h1>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border border-indigo-200">
              Operations Center
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">
            Schedule, reschedule, update outcomes, and log operational representative actions
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchFollowUps(false)} className="btn-secondary flex items-center gap-1.5 text-xs py-2">
            <RefreshCw size={13} className="text-slate-550" /> Sync Center
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-1.5 text-xs py-2">
            <Plus size={14} /> Schedule Task
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs and Filters Panel */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex border border-slate-200 p-1 bg-slate-50 rounded-xl gap-1 overflow-x-auto">
          {[
            { id: 'today', label: "Today's Tasks", icon: Clock },
            { id: 'upcoming', label: 'Upcoming', icon: Calendar },
            { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
            { id: 'completed', label: 'Completed', icon: CheckCircle2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFollowUps([]);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0
                  ${activeTab === tab.id 
                    ? 'bg-white text-indigo-650 border border-slate-200/85 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Priorities</option>
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🔵 Medium</option>
            <option value="Low">⚪ Low</option>
          </select>
        </div>
      </div>

      {/* Follow-up Tasks Grid/Table */}
      {followUps.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 heading-font">No follow-ups found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium leading-relaxed">
            Everything is caught up for this segment. Tap 'Schedule Task' to plan activities.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-6 py-4">Lead Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Scheduled Date</th>
                  <th className="px-6 py-4 text-center">Priority</th>
                  <th className="px-6 py-4">Notes</th>
                  {activeTab === 'completed' && <th className="px-6 py-4">Outcome Log</th>}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
                {followUps.map(fu => {
                  const isOverdue = !fu.completed_at && new Date(fu.scheduled_at) < new Date();
                  
                  return (
                    <tr key={fu.id} className={`hover:bg-slate-50/30 transition-colors ${isOverdue && activeTab !== 'completed' ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <Link to={`/leads/${fu.lead_id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm heading-font tracking-tight flex items-center gap-1">
                          {fu.lead_name}
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-650" />
                        </Link>
                        <p className="text-[10px] text-slate-400 font-semibold">{fu.lead_phone}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-semibold">
                        {TYPE_EMOJIS[fu.type] || fu.type}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isOverdue && activeTab !== 'completed' ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {new Date(fu.scheduled_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                        {isOverdue && activeTab !== 'completed' && (
                          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-50 text-rose-600 animate-pulse border border-rose-150">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_THEMES[fu.priority] || PRIORITY_THEMES.Medium}`}>
                          {fu.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-medium" title={fu.notes}>
                        {fu.notes}
                      </td>
                      {activeTab === 'completed' && (
                        <td className="px-6 py-4 text-emerald-700 text-xs italic bg-emerald-50/20 border-l-2 border-emerald-250">
                          {fu.outcome || 'None recorded'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        {activeTab !== 'completed' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowRescheduleModal(fu)}
                              className="p-1.5 text-slate-550 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl transition-all"
                              title="Reschedule Task"
                            >
                              <Calendar size={14} />
                            </button>
                            <button
                              onClick={() => setShowCompleteModal(fu)}
                              className="btn-primary flex items-center gap-1.5 py-1 px-3 text-[11px] font-bold"
                            >
                              <Check size={11} /> Complete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                            ✅ Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 heading-font text-lg">Schedule Follow-up</h3>
                <p className="text-xs text-slate-500 font-medium">Add task to the system</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="label">Select Lead</label>
                <select
                  required
                  value={createForm.lead_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, lead_id: e.target.value }))}
                  className="input w-full bg-white border-slate-200 text-slate-800"
                >
                  <option value="">-- Choose Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="input w-full bg-white border-slate-200 text-slate-800"
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="input w-full bg-white border-slate-200 text-slate-800"
                  >
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🔵 Medium</option>
                    <option value="Low">⚪ Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.scheduled_at}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="input w-full bg-white border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="label">Notes / Instructions</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Task instructions..."
                  className="input w-full h-20 resize-none bg-white border-slate-200 text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 heading-font text-lg">Mark Task Completed</h3>
                <p className="text-xs text-slate-500 font-medium">Log outcome for {showCompleteModal.lead_name}</p>
              </div>
              <button
                onClick={() => setShowCompleteModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleComplete} className="p-5 space-y-4">
              <div>
                <label className="label">Call Outcome / Status</label>
                <textarea
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="E.g., Spoke with customer, agreed to schedule site visit next Saturday."
                  className="input w-full h-28 resize-none bg-white border-slate-200 text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(null)}
                  className="btn-secondary text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 flex items-center gap-1.5"
                >
                  <Check size={16} /> Log Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Task Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 heading-font text-lg">Reschedule Task</h3>
                <p className="text-xs text-slate-500 font-medium">Update date and time for {showRescheduleModal.lead_name}</p>
              </div>
              <button
                onClick={() => setShowRescheduleModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReschedule} className="p-5 space-y-4">
              <div>
                <label className="label">New Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input w-full bg-white border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(null)}
                  className="btn-secondary text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 flex items-center gap-1.5"
                >
                  <Check size={16} /> Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
