import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, RefreshCw, AlertTriangle, AlertCircle, TrendingUp, 
  Copy, Check, Send, Mail, MessageSquare, Phone, ChevronRight, Award
} from 'lucide-react';
import { getLeadAIInsights, regenerateLeadAIInsights } from '../../services/leadService';
import { Button, Card, Spinner } from '../common/UI';

export default function AIAssistTab({ leadId, lead }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState({});
  const [outreachTab, setOutreachTab] = useState('whatsapp'); // whatsapp, followup, email
  const [msgTab, setMsgTab] = useState('first_contact'); // keys inside outreach_followup

  const fetchInsights = useCallback(async () => {
    try {
      const res = await getLeadAIInsights(leadId);
      setInsights(res.data.data);
    } catch (err) {
      console.error('Failed to load AI Insights:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    let active = true;
    const initialFetch = async () => {
      try {
        const res = await getLeadAIInsights(leadId);
        if (active) {
          setInsights(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load AI Insights:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialFetch();
    return () => { active = false; };
  }, [leadId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await regenerateLeadAIInsights(leadId);
      setInsights(res.data.data);
    } catch (err) {
      console.error('Failed to regenerate AI Insights:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold animate-pulse uppercase tracking-wider">Compiling AI Models...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card className="text-center py-12 space-y-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg heading-font">AI Insights Offline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            We couldn't generate AI recommendations for this lead profile.
          </p>
        </div>
        <Button onClick={() => { setLoading(true); fetchInsights(); }} variant="primary" size="sm" icon={RefreshCw} className="mx-auto">
          Retry Telemetry Generation
        </Button>
      </Card>
    );
  }

  const nextActionMap = {
    'Call Now': { bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400', icon: Phone },
    'Schedule Visit': { bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400', icon: ChevronRight },
    'Send Proposal': { bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400', icon: Send },
    'Nurture Lead': { bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400', icon: Sparkles },
    'Escalate To Senior Agent': { bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400', icon: Award }
  };

  const actionStyle = nextActionMap[insights.next_action] || { bg: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300', icon: Sparkles };
  const ActionIcon = actionStyle.icon;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header with Regenerate */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider heading-font">LeadScape AI Copilot</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Real-time profile evaluations and contextual messaging engines</p>
          </div>
        </div>
        <Button 
          onClick={handleRegenerate} 
          disabled={regenerating} 
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          className="shadow-sm"
        >
          {regenerating ? 'Analyzing Profile...' : 'Sync Copilot'}
        </Button>
      </div>

      {/* Grid: Overview Summary & Insights Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Executive Summaries */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden p-0">
            <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 px-4 py-3 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-650 dark:text-indigo-400" />
              <h3 className="font-bold text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase">AI Summary & Assessments</h3>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Overview */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Lead Overview</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-850">
                  {insights.summary_overview}
                </p>
              </div>

              {/* Intent */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Customer Purchase Intent</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-850">
                  {insights.summary_intent}
                </p>
              </div>

              {/* Risk */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Risk Assessment</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-850">
                  {insights.summary_risk}
                </p>
              </div>

              {/* Opportunity */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Opportunity Assessment</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-850">
                  {insights.summary_opportunity}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Actions & Alerts */}
        <div className="space-y-6">
          {/* Next Best Action Card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden p-0">
            <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-[10px] text-slate-550 dark:text-slate-400 tracking-wider uppercase">Next Best Action</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className={`border rounded-xl p-4 text-center ${actionStyle.bg} border-dashed`}>
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center mx-auto mb-2 text-current">
                  <ActionIcon size={16} />
                </div>
                <h4 className="font-extrabold text-sm tracking-wider uppercase heading-font">{insights.next_action}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">Recommended workflow action trigger</p>
              </div>
              
              <Button 
                onClick={() => alert(`Executing recommended operation: ${insights.next_action}`)}
                variant="primary"
                className="w-full text-xs font-bold uppercase tracking-wider"
              >
                Execute Action
              </Button>
            </div>
          </Card>

          {/* Risk Alerts & Opportunities Badges */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm p-5 space-y-4">
            {/* Risk Detection Alerts */}
            <div className="space-y-2">
              <h3 className="font-bold text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Telemetry Risk Flags</h3>
              {insights.risk_detection?.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No risk tags detected.</p>
              ) : (
                <div className="space-y-2">
                  {insights.risk_detection.map((risk, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${
                        risk.severity === 'critical' || risk.severity === 'high'
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold uppercase text-[9px] block mb-0.5">{risk.type} ({risk.severity})</span>
                        <span className="text-[11px] leading-tight block">{risk.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opportunity Flags */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <h3 className="font-bold text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Upsell & Opportunities</h3>
              {insights.opportunity_detection?.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No opportunities flagged.</p>
              ) : (
                <div className="space-y-2">
                  {insights.opportunity_detection.map((op, index) => (
                    <div key={index} className="flex items-start gap-2 p-2.5 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                      <TrendingUp size={13} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold uppercase text-[9px] block mb-0.5">{op.type} ({op.strength})</span>
                        <span className="text-[11px] leading-tight block">{op.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* AI Outreach Content Card */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden p-0">
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-indigo-650 dark:text-indigo-400" />
            <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider heading-font">Outreach Script Copilot</h3>
          </div>
        </div>

        {/* Tab Buttons for outreach type */}
        <div className="flex border-b border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/30 px-4 pt-2 gap-2">
          <button 
            onClick={() => setOutreachTab('whatsapp')}
            className={`px-3 py-2.5 text-[10px] font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              outreachTab === 'whatsapp' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare size={12} /> WhatsApp Broadcast
          </button>
          <button 
            onClick={() => setOutreachTab('followup')}
            className={`px-3 py-2.5 text-[10px] font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              outreachTab === 'followup' ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Phone size={12} /> Follow-up Sequence
          </button>
          <button 
            onClick={() => setOutreachTab('email')}
            className={`px-3 py-2.5 text-[10px] font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              outreachTab === 'email' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Mail size={12} /> Email Composer
          </button>
        </div>

        {/* Content of outreach tab */}
        <div className="p-5">
          
          {/* WhatsApp Tab */}
          {outreachTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">Short WhatsApp Template</span>
                <div className="flex items-center gap-3">
                  {lead && (
                    <button 
                      onClick={() => {
                        const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                        const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(insights.outreach_whatsapp)}`, '_blank');
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 hover:underline transition"
                    >
                      <Send size={11} /> Open WhatsApp
                    </button>
                  )}
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_whatsapp, 'whatsapp')}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline transition"
                  >
                    {copyStatus['whatsapp'] ? <Check size={11} className="text-emerald-600 dark:text-emerald-450" /> : <Copy size={11} />}
                    {copyStatus['whatsapp'] ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-mono leading-relaxed select-all">
                {insights.outreach_whatsapp}
              </div>
            </div>
          )}

          {/* Followup Templates Tab */}
          {outreachTab === 'followup' && (
            <div className="space-y-4">
              {/* Message selectors */}
              <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1 rounded-xl">
                {[
                  { key: 'first_contact', label: 'First Contact' },
                  { key: 'follow_up', label: 'Follow Up' },
                  { key: 'site_visit_reminder', label: 'Site Visit' },
                  { key: 'proposal_reminder', label: 'Proposal Review' },
                  { key: 'closing', label: 'Closing Touchpoint' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setMsgTab(item.key)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all uppercase tracking-wider ${
                      msgTab === item.key ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Message view */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/50">
                    {msgTab.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_followup[msgTab] || '', msgTab)}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline transition"
                  >
                    {copyStatus[msgTab] ? <Check size={11} className="text-emerald-600 dark:text-emerald-450" /> : <Copy size={11} />}
                    {copyStatus[msgTab] ? 'Copied!' : 'Copy Template'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-mono leading-relaxed select-all">
                  {insights.outreach_followup[msgTab] || 'No template configured.'}
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {outreachTab === 'email' && (
            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Subject Line</span>
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_email.subject, 'email_subject')}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline transition"
                  >
                    {copyStatus['email_subject'] ? <Check size={10} className="text-emerald-600 dark:text-emerald-450" /> : <Copy size={10} />}
                    {copyStatus['email_subject'] ? 'Copied!' : 'Copy Subject'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold">
                  {insights.outreach_email.subject}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Email Body</span>
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_email.body, 'email_body')}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline transition"
                  >
                    {copyStatus['email_body'] ? <Check size={10} className="text-emerald-600 dark:text-emerald-450" /> : <Copy size={10} />}
                    {copyStatus['email_body'] ? 'Copied!' : 'Copy Body'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-mono leading-relaxed select-all">
                  {insights.outreach_email.body}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Call to Action (CTA) Link</span>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 border border-white/10 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider shadow-md select-all">
                    {insights.outreach_email.cta}
                  </div>
                  {lead && lead.email && (
                    <button 
                      onClick={() => {
                        window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(insights.outreach_email.subject)}&body=${encodeURIComponent(insights.outreach_email.body)}`;
                      }}
                      className="btn flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                    >
                      <Mail size={12} /> Send Email via Client
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
}
