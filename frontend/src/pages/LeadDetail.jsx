import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User, Edit2, Sparkles, FileText } from 'lucide-react';
import { getLead, addActivity, createFollowUp, getLeadIntelligence } from '../services/leadService';
import ScoreBadge from '../components/common/ScoreBadge';
import AIAssistTab from '../components/leads/AIAssistTab';
import { Button, Card, Spinner } from '../components/common/UI';

const ScoreBar = ({ label, value, max }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
      <span>{label}</span>
      <span className="font-bold text-slate-800 dark:text-slate-200">{value}/{max}</span>
    </div>
    <div className="h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
      <div className="h-full bg-indigo-650 dark:bg-indigo-500 rounded-full" style={{ width: `${(value/max)*100}%` }} />
    </div>
  </div>
);

const Info = ({ icon: Icon, label, value, href }) => (
  <div className="flex items-start gap-2.5">
    {Icon && <Icon size={15} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />}
    <div>
      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">{label}</p>
      {href ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className="text-sm font-semibold text-indigo-650 dark:text-indigo-400 hover:underline mt-0.5 block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
      )}
    </div>
  </div>
);

const ProfileRow = ({ label, value }) => (
  <div className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
    <span className="text-slate-550 dark:text-slate-400 font-semibold">{label}</span>
    <span className="font-bold text-slate-800 dark:text-slate-250 capitalize">{value}</span>
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
      getLeadIntelligence(id).catch(() => ({ data: { data: null } }))
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
    const type = actForm.type;
    await addActivity(id, actForm);
    setActForm({ type: 'call', description: '' });
    load();

    // Proactively launch dial pad, email composer, or WhatsApp chat
    if (type === 'call') {
      window.location.href = `tel:${lead.phone}`;
    } else if (type === 'email' && lead.email) {
      window.location.href = `mailto:${lead.email}`;
    } else if (type === 'whatsapp') {
      const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      window.open(`https://web.whatsapp.com/send?phone=${waPhone}`, '_blank');
    }
  };

  const scheduleFollowUp = async (e) => {
    e.preventDefault();
    await createFollowUp(id, fuForm);
    setFuForm({ type: 'call', scheduled_at: '', notes: '' });
    load();
  };

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!lead) return <div className="text-center py-12 text-slate-500 font-bold">Profile not found</div>;

  const breakdown = lead.score_history?.[0];

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Detail Page Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/leads')} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white heading-font tracking-tight">{lead.full_name}</h1>
            <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold mt-0.5">
              Source: <span className="text-indigo-650 dark:text-indigo-400 uppercase font-black">{lead.source}</span> · Added {new Date(lead.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3.5">
          <ScoreBadge category={lead.category} score={lead.current_score} />
          <Link to={`/leads/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={Edit2}>
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workspace Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            {['overview','activities','follow-ups','score-history','ai-assist'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 -mb-px shrink-0
                  ${tab === t ? 'border-indigo-605 text-indigo-700 dark:text-indigo-400 font-extrabold border-indigo-600' : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Overview Section */}
          {tab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="p-5 space-y-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Info icon={Phone} label="Phone Number" value={lead.phone} href={`tel:${lead.phone}`} />
                  <Info icon={Mail} label="Email Address" value={lead.email || '—'} href={lead.email ? `mailto:${lead.email}` : null} />
                  <Info icon={MapPin} label="Preferred Location" value={lead.preferred_location || '—'} />
                  <Info icon={Calendar} label="Target Purchase Timeline" value={lead.timeline_months ? `${lead.timeline_months} months` : '—'} />
                  <Info icon={User} label="Representative Agent" value={lead.agent_name || 'Unassigned'} />
                  <Info icon={FileText} label="Preferred Property Type" value={lead.property_type || '—'} />
                </div>
                
                {lead.notes && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 rounded-xl p-4 mt-2">
                    <p className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5">Background Notes</p>
                    <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed font-semibold">{lead.notes}</p>
                  </div>
                )}
                
                {/* Instant Log Activity Form */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 heading-font tracking-wide">Quick Operations Logger</h3>
                  <form onSubmit={logActivity} className="flex flex-col sm:flex-row gap-2">
                    <select 
                      className="input w-full sm:w-32 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200" 
                      value={actForm.type} 
                      onChange={e => setActForm(p => ({...p, type: e.target.value}))}
                    >
                      {['call','email','visit','whatsapp','note'].map(t => <option key={t} className="bg-white dark:bg-slate-900">{t}</option>)}
                    </select>
                    <input 
                      className="input flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200" 
                      placeholder="What action was taken?" 
                      required
                      value={actForm.description} 
                      onChange={e => setActForm(p => ({...p, description: e.target.value}))} 
                    />
                    <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap font-bold">
                      Log Action
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          )}

          {/* Activities Timeline Section */}
          {tab === 'activities' && (
            <Card className="p-5 space-y-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 animate-fade-in">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider heading-font">Lead Activity Feed</h3>
              {lead.activities?.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No events or activities logged for this profile.</p>
              ) : (
                <div className="relative border-l border-slate-200/60 dark:border-slate-800/60 ml-3 pl-6 space-y-6">
                  {lead.activities.map((act) => {
                    const date = new Date(act.created_at);
                    const formattedDate = date.toLocaleDateString('en-IN', { dateStyle: 'medium' });
                    const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    
                    let iconColor = 'bg-indigo-650 dark:bg-indigo-500';
                    let typeBadge = 'bg-slate-50 text-slate-600 border-slate-200';
                    
                    if (act.type === 'created') {
                      iconColor = 'bg-emerald-500';
                      typeBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
                    } else if (act.type === 'assigned') {
                      iconColor = 'bg-indigo-600';
                      typeBadge = 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40';
                    } else if (act.type === 'status_change') {
                      iconColor = 'bg-purple-500';
                      typeBadge = 'bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40';
                    } else if (act.type === 'followup_scheduled') {
                      iconColor = 'bg-amber-500';
                      typeBadge = 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
                    } else if (act.type === 'followup_completed') {
                      iconColor = 'bg-emerald-500';
                      typeBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
                    }

                    return (
                      <div key={act.id} className="relative group">
                        {/* Bullet Marker */}
                        <span className={`absolute -left-[32px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-sm group-hover:scale-110 transition-transform ${iconColor}`}></span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border ${typeBadge}`}>
                              {act.type.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">
                              {formattedDate} at {formattedTime}
                            </span>
                          </div>
                          
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                            {act.description}
                          </p>
                          
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">
                            By representative: <span className="text-slate-500 dark:text-slate-450 font-bold">{act.user_name || 'System Auto'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Follow-Ups Section */}
          {tab === 'follow-ups' && (
            <Card className="p-5 space-y-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 animate-fade-in">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider heading-font">Scheduled Tasks & Actions</h3>
              <form onSubmit={scheduleFollowUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl">
                <select 
                  className="input bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200" 
                  value={fuForm.type} 
                  onChange={e => setFuForm(p => ({...p, type: e.target.value}))}
                >
                  {['call','email','site_visit','whatsapp'].map(t => <option key={t} className="bg-white dark:bg-slate-900">{t}</option>)}
                </select>
                <input 
                  type="datetime-local" 
                  className="input bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-250" 
                  required
                  value={fuForm.scheduled_at} 
                  onChange={e => setFuForm(p => ({...p, scheduled_at: e.target.value}))} 
                />
                <Button type="submit" variant="primary" size="sm">Schedule Activity</Button>
              </form>
              
              <div className="space-y-3 pt-2">
                {lead.activities?.filter(a => a.type === 'followup_scheduled').length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-450 italic">No future follow-ups scheduled.</p>
                ) : (
                  lead.activities?.filter(a => a.type === 'followup_scheduled').map(act => (
                    <div key={act.id} className="p-3 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between animate-fade-in">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                          Scheduled Task
                        </span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{act.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-550 dark:text-slate-450 font-semibold">
                        {new Date(act.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Score History Section */}
          {tab === 'score-history' && (
            <Card className="p-5 space-y-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 animate-fade-in">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider heading-font">Historical Score Indexes</h3>
              <div className="space-y-3">
                {lead.score_history?.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <ScoreBadge category={s.category} score={s.score} />
                    <span className="text-xs text-slate-555 dark:text-slate-400 font-semibold">{new Date(s.calculated_at).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-555 dark:text-slate-400 font-bold">{s.calculated_by}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Assist Copilot Section */}
          {tab === 'ai-assist' && (
            <AIAssistTab leadId={id} lead={lead} />
          )}
        </div>

        {/* Right Sidebar Columns */}
        <div className="space-y-6">
          {/* Score Breakdown Indicator Card */}
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-center mb-5">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Current Score Yield</span>
              <div className={`text-6xl font-black heading-font tracking-tighter my-2 ${
                lead.category === 'HOT' ? 'text-rose-600 dark:text-rose-455' : lead.category === 'WARM' ? 'text-amber-600 dark:text-amber-455' : 'text-blue-600 dark:text-blue-455'
              }`}>
                {lead.current_score}
              </div>
              <ScoreBadge category={lead.category} />
            </div>
            
            {breakdown && (
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Operational Breakdown</p>
                <ScoreBar label="Budget Category Score" value={breakdown.budget_score} max={25} />
                <ScoreBar label="Timeline & Urgency Score" value={breakdown.urgency_score} max={20} />
                <ScoreBar label="Engagement Questions Score" value={breakdown.questions_score} max={15} />
                <ScoreBar label="Site Visit Completed" value={breakdown.site_visit_score} max={15} />
                <ScoreBar label="Communications Engagement" value={breakdown.engagement_score} max={10} />
                <ScoreBar label="Agent Response Velocity" value={breakdown.response_score} max={10} />
                <ScoreBar label="Follow-Ups Scheduled" value={breakdown.followup_score} max={5} />
              </div>
            )}
          </Card>

          {/* Lead Qualification Parameters Ledger */}
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-wider heading-font border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-3">
              Qualification Profile
            </p>
            <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              <ProfileRow label="Budget Tier" value={lead.budget_tier} />
              <ProfileRow label="Urgency Level" value={`${lead.urgency_level}/5`} />
              <ProfileRow label="Questions Logged" value={lead.questions_asked} />
              <ProfileRow label="Site Visit Status" value={lead.site_visit_done ? '✅ Visited' : lead.site_visit_interest ? '👀 Interested' : '❌ None'} />
              <ProfileRow label="Operations Logged" value={lead.engagement_count} />
              <ProfileRow label="Follow-up Logs" value={lead.followup_count} />
            </div>
          </Card>

          {/* AI Intelligence Insights Gauge Component - Redesigned to adapt dynamically to themes */}
          <div className="card p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/60 dark:to-slate-950/80 border border-indigo-200 dark:border-indigo-900/40 shadow-xl relative overflow-hidden space-y-4 text-slate-800 dark:text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 dark:bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-1.5 border-b border-indigo-200/60 dark:border-white/10 pb-2.5">
              <Sparkles size={15} className="text-indigo-650 dark:text-indigo-300 animate-pulse" />
              <p className="font-black tracking-wider uppercase text-xs heading-font">AI Lead Intelligence</p>
            </div>
            
            {aiIntel ? (
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between items-center border-b border-indigo-200/40 dark:border-white/10 pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Conversion Chance</span>
                  <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">{aiIntel.conversion_probability}%</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-indigo-200/40 dark:border-white/10 pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Lead Priority</span>
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black border ${
                    aiIntel.priority === 'Critical' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50' :
                    aiIntel.priority === 'High' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' :
                    aiIntel.priority === 'Medium' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50' :
                    'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white border border-slate-200 dark:border-white/20'
                  }`}>
                    {aiIntel.priority}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-indigo-200/40 dark:border-white/10 pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Lead Quality Segment</span>
                  <span className="font-black text-slate-800 dark:text-white">{aiIntel.quality}</span>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-slate-600 dark:text-slate-200 text-[10px] font-bold block uppercase tracking-wider">Recommended Strategy Action</span>
                  <p className="bg-white/90 dark:bg-white/10 border border-indigo-200 dark:border-white/20 rounded-xl p-3 text-slate-800 dark:text-white font-bold leading-normal text-xs flex items-start gap-1">
                    <span className="text-indigo-650 dark:text-indigo-300">👉</span> {aiIntel.recommendation}
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-slate-600 dark:text-slate-200 text-[10px] font-bold block uppercase tracking-wider">AI Bulletins Explanation</span>
                  <p className="text-slate-655 dark:text-slate-350 leading-relaxed text-[11px] font-medium p-1">
                    {aiIntel.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-600 dark:text-slate-300 font-semibold animate-pulse text-xs">
                Generating AI predictions...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
