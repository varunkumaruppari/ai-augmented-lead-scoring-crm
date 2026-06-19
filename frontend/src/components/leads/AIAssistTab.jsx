import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, RefreshCw, AlertTriangle, AlertCircle, TrendingUp, 
  Copy, Check, Send, Mail, MessageSquare, Phone, ChevronRight, Award
} from 'lucide-react';
import { getLeadAIInsights, regenerateLeadAIInsights } from '../../services/leadService';
import Spinner from '../common/Spinner';

export default function AIAssistTab({ leadId }) {
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
        <p className="text-sm text-slate-500 font-medium animate-pulse">Running advanced AI models...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="card text-center py-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-lg heading-font">AI Insights Unavailable</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We couldn't generate AI recommendations for this lead. Ensure the server is active and try again.
          </p>
        </div>
        <button onClick={() => { setLoading(true); fetchInsights(); }} className="btn-primary flex items-center gap-2 mx-auto">
          <RefreshCw size={16} /> Retry AI Generation
        </button>
      </div>
    );
  }

  // Next action style mapping
  const nextActionMap = {
    'Call Now': { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Phone },
    'Schedule Visit': { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: ChevronRight },
    'Send Proposal': { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: Send },
    'Nurture Lead': { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: Sparkles },
    'Escalate To Senior Agent': { bg: 'bg-rose-50 border-rose-200 text-rose-700', icon: Award }
  };

  const actionStyle = nextActionMap[insights.next_action] || { bg: 'bg-slate-50 border-slate-200 text-slate-700', icon: Sparkles };
  const ActionIcon = actionStyle.icon;

  return (
    <div className="space-y-6">
      {/* Header with Regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 heading-font">AI-Powered Copilot</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time summaries, actions, and auto-generated outreach scripts</p>
          </div>
        </div>
        <button 
          onClick={handleRegenerate} 
          disabled={regenerating} 
          className="btn-secondary flex items-center gap-2 text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 transition shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
          {regenerating ? 'Analyzing...' : 'Regenerate Insights'}
        </button>
      </div>

      {/* Grid: Overview Summary & Insights Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Executive Summaries */}
        <div className="md:col-span-2 space-y-6">
          <div className="card border border-slate-100 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-600" />
              <h3 className="font-bold text-sm text-slate-700 tracking-wide uppercase">AI Summary & Assessments</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Overview */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Overview</span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100/50">
                  {insights.summary_overview}
                </p>
              </div>

              {/* Intent */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Intent</span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100/50">
                  {insights.summary_intent}
                </p>
              </div>

              {/* Risk */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-rose-500">Risk Assessment</span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100/50">
                  {insights.summary_risk}
                </p>
              </div>

              {/* Opportunity */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-emerald-600">Opportunity Assessment</span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100/50">
                  {insights.summary_opportunity}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Actions & Alerts */}
        <div className="space-y-6">
          {/* Next Best Action Card */}
          <div className="card border border-slate-100 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-700 tracking-wide uppercase">Next Best Action</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className={`border rounded-xl p-4 text-center ${actionStyle.bg} border-dashed`}>
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 text-current">
                  <ActionIcon size={20} />
                </div>
                <h4 className="font-bold text-base tracking-wide">{insights.next_action}</h4>
                <p className="text-xs opacity-80 mt-1 font-medium">Recommended action based on lead profile heuristics</p>
              </div>
              
              <button 
                onClick={() => alert(`Initiating action: ${insights.next_action}`)}
                className="w-full btn-primary text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
              >
                Execute Recommendation
              </button>
            </div>
          </div>

          {/* Risk Alerts & Opportunities Badges */}
          <div className="card border border-slate-100 bg-white rounded-xl shadow-sm p-4 space-y-4">
            {/* Risk Detection Alerts */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Risk Indicators</h3>
              {insights.risk_detection?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No critical risk flags detected.</p>
              ) : (
                <div className="space-y-2">
                  {insights.risk_detection.map((risk, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-2 p-2 rounded-lg text-xs border ${
                        risk.severity === 'critical' || risk.severity === 'high'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}
                    >
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold uppercase text-[10px] block mb-0.5">{risk.type} ({risk.severity})</span>
                        <span className="font-medium">{risk.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opportunity Flags */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Opportunity Indicators</h3>
              {insights.opportunity_detection?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No special upsell flags active.</p>
              ) : (
                <div className="space-y-2">
                  {insights.opportunity_detection.map((op, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg text-xs bg-emerald-50 border border-emerald-100 text-emerald-700">
                      <TrendingUp size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold uppercase text-[10px] block mb-0.5">{op.type} ({op.strength})</span>
                        <span className="font-medium">{op.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* AI Outreach Content Card */}
      <div className="card border border-slate-100 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-violet-600" />
            <h3 className="font-bold text-sm text-slate-700 uppercase">AI Smart Outreach Generator</h3>
          </div>
        </div>

        {/* Tab Buttons for outreach type */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-2 gap-2">
          <button 
            onClick={() => setOutreachTab('whatsapp')}
            className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              outreachTab === 'whatsapp' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare size={14} /> WhatsApp Chat
          </button>
          <button 
            onClick={() => setOutreachTab('followup')}
            className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              outreachTab === 'followup' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Phone size={14} /> SMS / Follow-up Templates
          </button>
          <button 
            onClick={() => setOutreachTab('email')}
            className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
              outreachTab === 'email' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail size={14} /> Email Architect
          </button>
        </div>

        {/* Content of outreach tab */}
        <div className="p-4">
          
          {/* WhatsApp Tab */}
          {outreachTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Short Sales WhatsApp</span>
                <button 
                  onClick={() => copyToClipboard(insights.outreach_whatsapp, 'whatsapp')}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 active:scale-95 transition"
                >
                  {copyStatus['whatsapp'] ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copyStatus['whatsapp'] ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap select-all">
                {insights.outreach_whatsapp}
              </div>
            </div>
          )}

          {/* Followup Templates Tab */}
          {outreachTab === 'followup' && (
            <div className="space-y-4">
              {/* Message selectors */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
                {[
                  { key: 'first_contact', label: 'First Contact' },
                  { key: 'follow_up', label: 'Follow Up' },
                  { key: 'site_visit_reminder', label: 'Site Visit Tour' },
                  { key: 'proposal_reminder', label: 'Proposal Reminder' },
                  { key: 'closing', label: 'Closing File' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setMsgTab(item.key)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                      msgTab === item.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Message view */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 capitalize">
                    {msgTab.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_followup[msgTab] || '', msgTab)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 active:scale-95 transition"
                  >
                    {copyStatus[msgTab] ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copyStatus[msgTab] ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap select-all">
                  {insights.outreach_followup[msgTab] || 'No message available.'}
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
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject Line</span>
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_email.subject, 'email_subject')}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 active:scale-95 transition"
                  >
                    {copyStatus['email_subject'] ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                    {copyStatus['email_subject'] ? 'Copied!' : 'Copy Subject'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-sm font-bold">
                  {insights.outreach_email.subject}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Body</span>
                  <button 
                    onClick={() => copyToClipboard(insights.outreach_email.body, 'email_body')}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 active:scale-95 transition"
                  >
                    {copyStatus['email_body'] ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                    {copyStatus['email_body'] ? 'Copied!' : 'Copy Body'}
                  </button>
                </div>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap select-all">
                  {insights.outreach_email.body}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Call to Action (CTA)</span>
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-violet-100 select-all cursor-pointer">
                  {insights.outreach_email.cta}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
