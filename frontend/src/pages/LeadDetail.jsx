import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User, Edit2, Sparkles } from 'lucide-react';
import { getLead, addActivity, createFollowUp, getLeadIntelligence } from '../services/leadService';
import ScoreBadge from '../components/common/ScoreBadge';
import Spinner from '../components/common/Spinner';
import AIAssistTab from '../components/leads/AIAssistTab';

const ScoreBar = ({ label, value, max }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-gray-600">
      <span>{label}</span><span className="font-medium">{value}/{max}</span>
    </div>
    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(value/max)*100}%` }} />
    </div>
  </div>
);

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [aiIntel, setAiIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actForm, setActForm] = useState({ type: 'call', description: '' });
  const [fuForm, setFuForm] = useState({ type: 'call', scheduled_at: '', notes: '' });
  const [tab, setTab] = useState('overview');

  const load = useCallback(() => {
    return Promise.all([
      getLead(id),
      getLeadIntelligence(id).catch(() => ({ data: { data: null } })) // Fallback if not configured
    ]).then(([lRes, iRes]) => {
      setLead(lRes.data.data);
      setAiIntel(iRes.data.data);
    }).catch(err => {
      console.error('Error loading lead detail or AI details:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);
  
  useEffect(() => { load(); }, [id, load]);

  const logActivity = async (e) => {
    e.preventDefault();
    await addActivity(id, actForm);
    setActForm({ type: 'call', description: '' });
    load();
  };

  const scheduleFollowUp = async (e) => {
    e.preventDefault();
    await createFollowUp(id, fuForm);
    setFuForm({ type: 'call', scheduled_at: '', notes: '' });
    load();
  };

  if (loading) return <Spinner size="lg" />;
  if (!lead) return <div className="text-center py-12 text-gray-500">Lead not found</div>;

  const breakdown = lead.score_history?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/leads')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{lead.full_name}</h1>
          <p className="text-sm text-gray-500">{lead.source} · Added {new Date(lead.created_at).toLocaleDateString('en-IN')}</p>
        </div>
        <ScoreBadge category={lead.category} score={lead.current_score} />
        <Link to={`/leads/${id}/edit`} className="btn-secondary flex items-center gap-2">
          <Edit2 size={16} /> Edit
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {['overview','activities','follow-ups','score-history','ai-assist'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="card space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Info icon={Phone} label="Phone" value={lead.phone} />
                <Info icon={Mail} label="Email" value={lead.email || '—'} />
                <Info icon={MapPin} label="Location" value={lead.preferred_location || '—'} />
                <Info icon={Calendar} label="Timeline" value={lead.timeline_months ? `${lead.timeline_months} months` : '—'} />
                <Info icon={User} label="Agent" value={lead.agent_name || 'Unassigned'} />
                <Info label="Property Type" value={lead.property_type || '—'} />
              </div>
              {lead.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{lead.notes}</p>
                </div>
              )}
              {/* Log Activity */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Log Activity</h3>
                <form onSubmit={logActivity} className="flex gap-2">
                  <select className="input w-32" value={actForm.type} onChange={e => setActForm(p => ({...p, type: e.target.value}))}>
                    {['call','email','visit','whatsapp','note'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input className="input flex-1" placeholder="What happened?" required
                    value={actForm.description} onChange={e => setActForm(p => ({...p, description: e.target.value}))} />
                  <button type="submit" className="btn-primary whitespace-nowrap">Log</button>
                </form>
              </div>
            </div>
          )}

          {tab === 'activities' && (
            <div className="card space-y-6">
              <h3 className="font-bold text-lg text-slate-900 heading-font">Activity Timeline</h3>
              {lead.activities?.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No operations logged for this lead yet.</p>
              ) : (
                <div className="relative border-l border-slate-100 ml-4 pl-6 space-y-6">
                  {lead.activities.map((act) => {
                    const date = new Date(act.created_at);
                    const formattedDate = date.toLocaleDateString('en-IN', { dateStyle: 'medium' });
                    const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    
                    let iconColor = 'bg-blue-500';
                    let typeBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                    
                    if (act.type === 'created') {
                      iconColor = 'bg-green-500';
                      typeBadge = 'bg-green-50 text-green-700 border-green-200';
                    } else if (act.type === 'assigned') {
                      iconColor = 'bg-indigo-500';
                      typeBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    } else if (act.type === 'status_change') {
                      iconColor = 'bg-purple-500';
                      typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                    } else if (act.type === 'followup_scheduled') {
                      iconColor = 'bg-amber-500';
                      typeBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (act.type === 'followup_completed') {
                      iconColor = 'bg-emerald-500';
                      typeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    }

                    return (
                      <div key={act.id} className="relative group" style={{ contentVisibility: 'auto' }}>
                        {/* Vertical line bullet */}
                        <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white group-hover:scale-110 transition-transform ${iconColor}`}></span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${typeBadge}`}>
                              {act.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {formattedDate} at {formattedTime}
                            </span>
                          </div>
                          
                          <p className="text-sm font-semibold text-slate-800">
                            {act.description}
                          </p>
                          
                          <p className="text-xs text-slate-400 font-medium">
                            Action by: <span className="font-semibold text-slate-600">{act.user_name || 'System'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'follow-ups' && (
            <div className="card space-y-4">
              <h3 className="font-medium text-gray-900">Follow-Ups</h3>
              <form onSubmit={scheduleFollowUp} className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                <select className="input" value={fuForm.type} onChange={e => setFuForm(p => ({...p, type: e.target.value}))}>
                  {['call','email','site_visit','whatsapp'].map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="datetime-local" className="input" required
                  value={fuForm.scheduled_at} onChange={e => setFuForm(p => ({...p, scheduled_at: e.target.value}))} />
                <button type="submit" className="btn-primary text-sm">Schedule</button>
              </form>
              <div className="space-y-2">
                {lead.activities?.filter(a => a.type === 'followup_scheduled').length === 0 &&
                  <p className="text-sm text-gray-400">No follow-ups scheduled</p>}
              </div>
            </div>
          )}

          {tab === 'score-history' && (
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-3">Score History</h3>
              <div className="space-y-3">
                {lead.score_history?.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <ScoreBadge category={s.category} score={s.score} />
                    <span className="text-xs text-gray-500 flex-1">{new Date(s.calculated_at).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-400">{s.calculated_by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ai-assist' && (
            <AIAssistTab leadId={id} />
          )}
        </div>

        {/* Score Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="text-center mb-4">
              <div className={`text-5xl font-bold mb-1 ${lead.category==='HOT'?'text-red-600':lead.category==='WARM'?'text-yellow-600':'text-blue-600'}`}>
                {lead.current_score}
              </div>
              <ScoreBadge category={lead.category} />
            </div>
            {breakdown && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score Breakdown</p>
                <ScoreBar label="Budget" value={breakdown.budget_score} max={25} />
                <ScoreBar label="Urgency" value={breakdown.urgency_score} max={20} />
                <ScoreBar label="Questions" value={breakdown.questions_score} max={15} />
                <ScoreBar label="Site Visit" value={breakdown.site_visit_score} max={15} />
                <ScoreBar label="Engagement" value={breakdown.engagement_score} max={10} />
                <ScoreBar label="Response" value={breakdown.response_score} max={10} />
                <ScoreBar label="Follow-Ups" value={breakdown.followup_score} max={5} />
              </div>
            )}
          </div>

          <div className="card text-sm space-y-2">
            <p className="font-semibold text-gray-900 mb-3">Lead Profile</p>
            <ProfileRow label="Budget" value={lead.budget_tier} />
            <ProfileRow label="Urgency" value={`${lead.urgency_level}/5`} />
            <ProfileRow label="Questions" value={lead.questions_asked} />
            <ProfileRow label="Site Visit" value={lead.site_visit_done ? '✅ Done' : lead.site_visit_interest ? '👀 Interested' : '❌ No'} />
            <ProfileRow label="Engagement" value={lead.engagement_count} />
            <ProfileRow label="Follow-Ups" value={lead.followup_count} />
          </div>

          {/* AI Intelligence Card */}
          <div className="card text-sm space-y-4 bg-slate-900 text-slate-100 border-none shadow-md">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <p className="font-bold tracking-wider uppercase text-xs heading-font text-slate-200">AI Lead Intelligence</p>
            </div>
            
            {aiIntel ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Conversion Chance</span>
                  <span className="font-bold text-white text-sm">{aiIntel.conversion_probability}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Lead Priority</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    aiIntel.priority === 'Critical' ? 'bg-red-600 text-white' :
                    aiIntel.priority === 'High' ? 'bg-orange-500 text-white' :
                    aiIntel.priority === 'Medium' ? 'bg-yellow-500 text-slate-900 font-semibold' :
                    'bg-blue-600 text-white'
                  }`}>
                    {aiIntel.priority}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Lead Quality</span>
                  <span className="font-bold text-white">{aiIntel.quality}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Recommended Action</span>
                  <p className="bg-white/5 border border-white/10 rounded-lg p-2 text-white font-bold">
                    👉 {aiIntel.recommendation}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">AI Explanation</span>
                  <p className="text-slate-300 leading-relaxed text-[11px] font-medium">
                    {aiIntel.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 font-medium">
                Generating AI predictions...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Info = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon size={16} className="text-gray-400 mt-0.5" />}
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const ProfileRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 capitalize">{value}</span>
  </div>
);
