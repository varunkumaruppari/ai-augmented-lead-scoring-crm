import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { getLeads } from '../services/leadService';
import ScoreBadge from '../components/common/ScoreBadge';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const statusColors = { new:'bg-gray-100 text-gray-700', contacted:'bg-blue-100 text-blue-700', qualified:'bg-purple-100 text-purple-700', booked:'bg-green-100 text-green-700', lost:'bg-red-100 text-red-700' };

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    let active = true;
    const fetchLeadsList = async () => {
      await Promise.resolve();
      if (active) setLoading(true);
      try {
        const res = await getLeads({ category, search, page, limit: 20 });
        if (active) {
          setLeads(res.data.data);
          setMeta(res.data.meta);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLeadsList();
    return () => { active = false; };
  }, [category, search, page]);

  const setFilter = (cat) => { setSearchParams(cat ? { category: cat } : {}); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Link to="/leads/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, phone, email…" className="input pl-9"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['','HOT','WARM','COLD'].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : leads.length === 0 ? (
        <EmptyState title="No leads found" description="Try adjusting filters or add a new lead"
          action={<Link to="/leads/new" className="btn-primary">Add First Lead</Link>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name','Phone','Source','Score','Status','Agent','Added'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline">{lead.full_name}</Link>
                    <p className="text-xs text-gray-400">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{lead.phone}</td>
                  <td className="px-4 py-3"><span className="capitalize text-gray-600">{lead.source}</span></td>
                  <td className="px-4 py-3"><ScoreBadge category={lead.category} score={lead.current_score} /></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{lead.agent_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(lead.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {leads.length} of {meta.total} leads</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setSearchParams({ page: page - 1 })}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">← Prev</button>
              <button disabled={leads.length < 20} onClick={() => setSearchParams({ page: page + 1 })}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
