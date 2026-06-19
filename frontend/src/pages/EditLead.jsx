import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getLead, updateLead } from '../services/leadService';
import Spinner from '../components/common/Spinner';

const Field = ({ label, children }) => (
  <div><label className="label">{label}</label>{children}</div>
);

export default function EditLead() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  useEffect(() => {
    getLead(id).then(res => {
      const l = res.data.data;
      setForm({
        full_name: l.full_name, email: l.email || '', phone: l.phone, source: l.source,
        budget_tier: l.budget_tier, urgency_level: l.urgency_level, questions_asked: l.questions_asked,
        site_visit_interest: l.site_visit_interest, site_visit_done: l.site_visit_done,
        property_type: l.property_type || '', preferred_location: l.preferred_location || '',
        timeline_months: l.timeline_months || '', notes: l.notes || '',
        response_time_hrs: l.response_time_hrs, status: l.status,
      });
    }).catch(() => setError('Failed to load lead')).finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await updateLead(id, form);
      navigate(`/leads/${id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update lead');
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner size="lg" />;
  if (!form) return <div className="text-center py-12 text-gray-500">{error || 'Lead not found'}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/leads/${id}`} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Lead</h1>
          <p className="text-sm text-gray-500">Score recalculates automatically on save</p>
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
            <Field label="Status">
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['new','contacted','qualified','site_visit_scheduled','negotiation','booked','lost'].map(s => <option key={s}>{s}</option>)}
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
            <Field label="Property Type"><input className="input" value={form.property_type} onChange={e => set('property_type', e.target.value)} /></Field>
            <Field label="Preferred Location"><input className="input" value={form.preferred_location} onChange={e => set('preferred_location', e.target.value)} /></Field>
            <Field label="Timeline (months)"><input type="number" className="input" min="0" value={form.timeline_months} onChange={e => set('timeline_months', parseInt(e.target.value) || '')} /></Field>
          </div>
          <Field label="Notes"><textarea className="input h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to={`/leads/${id}`} className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
