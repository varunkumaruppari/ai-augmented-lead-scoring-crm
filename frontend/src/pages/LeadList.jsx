import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ChevronRight, User, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { getLeads } from '../services/leadService';
import { useStore } from '../store/useStore';
import useDebounce from '../hooks/useDebounce';
import ScoreBadge from '../components/common/ScoreBadge';
import { Button, Spinner, EmptyState } from '../components/common/UI';

const statusColors = { 
  new: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60', 
  contacted: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-355 border border-blue-200/60 dark:border-blue-800/40', 
  qualified: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-355 border border-purple-200/60 dark:border-purple-800/40', 
  booked: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-355 border border-emerald-200/60 dark:border-emerald-800/40', 
  lost: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-355 border border-rose-200/60 dark:border-rose-800/40' 
};

export default function LeadList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Zustand state
  const leads = useStore(state => state.leads);
  const setLeads = useStore(state => state.setLeads);

  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    phone: true,
    source: true,
    score: true,
    qualification: true,
    agent: true,
    date: true,
  });
  
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchLeadsList = async () => {
      if (active) setLoading(true);
      try {
        const res = await getLeads({ category, search: debouncedSearch, page, limit: 20 });
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
  }, [category, debouncedSearch, page, setLeads]);

  const setFilter = (cat) => { 
    setSearchParams(cat ? { category: cat } : {}); 
  };

  const toggleColumn = (colName) => {
    setVisibleColumns(prev => ({
      ...prev,
      [colName]: !prev[colName]
    }));
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white heading-font tracking-tight text-gradient">
              Leads Ledger
            </h1>
            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-750 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border border-indigo-200/60 dark:border-indigo-850/50">
              Workspace
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Manage, search, and segment incoming profiles qualified by LeadScape AI
          </p>
        </div>
        <div>
          <Link to="/leads/new">
            <Button variant="primary" size="sm" icon={Plus}>
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Custom Category Tabs */}
      <div className="card p-4 flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search leads by name, phone, email..." 
            className="input pl-10 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap border-r border-slate-200 dark:border-slate-800 pr-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550 tracking-wider flex items-center gap-1.5 mr-2">
              <Filter size={11} /> Segment:
            </span>
            {['','HOT','WARM','COLD'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border
                  ${category === cat 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-350 border-slate-200/60 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {cat || 'All Categories'}
              </button>
            ))}
          </div>

          {/* Column Toggle Selector */}
          <div className="relative" ref={dropdownRef}>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={LayoutGrid}
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
            >
              Columns
            </Button>
            
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-2.5 z-30 animate-fade-in space-y-1">
                <div className="px-3 pb-1.5 text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest border-b border-slate-100 dark:border-slate-750">
                  Toggle Columns
                </div>
                <div className="px-1.5 pt-1.5 space-y-0.5">
                  {Object.entries({
                    name: 'Name & Profile',
                    phone: 'Contact Number',
                    source: 'Channel Source',
                    score: 'AI Score',
                    qualification: 'Qualification',
                    agent: 'Owner Agent',
                    date: 'Creation Date'
                  }).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleColumn(key)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                    >
                      <span>{label}</span>
                      {visibleColumns[key] ? (
                        <Eye size={13} className="text-indigo-650 dark:text-indigo-400" />
                      ) : (
                        <EyeOff size={13} className="text-slate-350 dark:text-slate-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading or Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Spinner />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState 
          title="No qualified profiles found" 
          description="Try adjusting filters or add a new lead to kickstart score tracking"
          action={<Link to="/leads/new"><Button variant="primary" size="sm">Add First Lead</Button></Link>} 
        />
      ) : (
        <div className="card p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[10px] font-bold">
                  {visibleColumns.name && <th className="px-5 py-4 font-black">Name & Profile</th>}
                  {visibleColumns.phone && <th className="px-5 py-4 font-black">Contact Number</th>}
                  {visibleColumns.source && <th className="px-5 py-4 font-black">Channel Source</th>}
                  {visibleColumns.score && <th className="px-5 py-4 font-black">AI score</th>}
                  {visibleColumns.qualification && <th className="px-5 py-4 font-black">Qualification</th>}
                  {visibleColumns.agent && <th className="px-5 py-4 font-black">Owner Agent</th>}
                  {visibleColumns.date && <th className="px-5 py-4 font-black">Creation Date</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors group/row">
                    {visibleColumns.name && (
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <Link 
                            to={`/leads/${lead.id}`} 
                            className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors text-sm tracking-tight flex items-center gap-1 heading-font"
                          >
                            {lead.full_name}
                            <ChevronRight size={12} className="opacity-0 group-hover/row:opacity-100 transition-opacity text-indigo-500" />
                          </Link>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{lead.email}</span>
                        </div>
                      </td>
                    )}
                    
                    {visibleColumns.phone && (
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">{lead.phone}</td>
                    )}
                    
                    {visibleColumns.source && (
                      <td className="px-5 py-3.5">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 text-slate-655 dark:text-slate-350 rounded-md text-[10px] font-bold">
                          {lead.source}
                        </span>
                      </td>
                    )}
                    
                    {visibleColumns.score && (
                      <td className="px-5 py-3.5">
                        <ScoreBadge category={lead.category} score={lead.current_score} />
                      </td>
                    )}
                    
                    {visibleColumns.qualification && (
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${statusColors[lead.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {lead.status}
                        </span>
                      </td>
                    )}
                    
                    {visibleColumns.agent && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-slate-700 flex items-center justify-center font-bold text-[9px]">
                            {lead.agent_name ? lead.agent_name[0].toUpperCase() : <User size={9} />}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                            {lead.agent_name || '—'}
                          </span>
                        </div>
                      </td>
                    )}
                    
                    {visibleColumns.date && (
                      <td className="px-5 py-3.5 text-slate-400 dark:text-slate-500 font-semibold">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <p>Showing <strong className="text-slate-850 dark:text-white">{leads.length}</strong> of <strong className="text-slate-850 dark:text-white">{meta.total}</strong> active profiles</p>
            <div className="flex gap-2">
              <Button 
                disabled={page <= 1} 
                onClick={() => setSearchParams({ page: page - 1, ...(category ? { category } : {}) })}
                variant="secondary"
                size="sm"
              >
                ← Prev
              </Button>
              <Button 
                disabled={leads.length < 20} 
                onClick={() => setSearchParams({ page: page + 1, ...(category ? { category } : {}) })}
                variant="secondary"
                size="sm"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
