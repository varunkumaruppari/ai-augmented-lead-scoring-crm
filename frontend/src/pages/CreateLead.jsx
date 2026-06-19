import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createLead } from '../services/leadService';

const Field = ({ label, children }) => (
  <div><label className="label">{label}</label>{children}</div>
);

export default function CreateLead() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', source: 'web',
    budget_tier: 'low', urgency_level: 1, questions_asked: 0,
    site_visit_interest: false, site_visit_done: false,
    property_type: '', preferred_location: '', timeline_months: '',
    notes: '', response_time_hrs: 24
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await createLead(form);
      navigate(`/leads/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create lead');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/leads" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-sm text-gray-500">Score will be calculated automatically</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Contact Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name *"><input className="input" required value={form.full_name} onChange={e => set('full_name', e.target.value)} /></Field>
            <Field label="Phone *"><input className="input" required value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Lead Source">
              <select className="input" value={form.source} onChange={e => set('source', e.target.value)}>
                {['web','walkin','referral','phone','social','whatsapp'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Scoring Factors</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget Tier">
              <select className="input" value={form.budget_tier} onChange={e => set('budget_tier', e.target.value)}>
                {['low','medium','high','premium'].map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label={`Urgency Level: ${form.urgency_level}/5`}>
              <input type="range" min="1" max="5" className="w-full mt-2" value={form.urgency_level}
                onChange={e => set('urgency_level', parseInt(e.target.value))} />
            </Field>
            <Field label="Questions Asked">
              <input type="number" className="input" min="0" value={form.questions_asked}
                onChange={e => set('questions_asked', parseInt(e.target.value))} />
            </Field>
            <Field label="Avg Response Time (hours)">
              <input type="number" className="input" min="0" step="0.5" value={form.response_time_hrs}
                onChange={e => set('response_time_hrs', parseFloat(e.target.value))} />
            </Field>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sv_interest" checked={form.site_visit_interest} onChange={e => set('site_visit_interest', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="sv_interest" className="text-sm font-medium text-gray-700">Site Visit Interest</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sv_done" checked={form.site_visit_done} onChange={e => set('site_visit_done', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="sv_done" className="text-sm font-medium text-gray-700">Site Visit Completed</label>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Property Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property Type"><input className="input" placeholder="e.g. Residential Plot" value={form.property_type} onChange={e => set('property_type', e.target.value)} /></Field>
            <Field label="Preferred Location"><input className="input" placeholder="e.g. Uppal, Hyderabad" value={form.preferred_location} onChange={e => set('preferred_location', e.target.value)} /></Field>
            <Field label="Timeline (months)"><input type="number" className="input" min="0" value={form.timeline_months} onChange={e => set('timeline_months', parseInt(e.target.value) || '')} /></Field>
          </div>
          <Field label="Notes"><textarea className="input h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/leads" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Lead & Score'}
          </button>
        </div>
      </form>
    </div>
  );
}
