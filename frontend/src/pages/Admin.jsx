import { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Database,
  Server, Shield, Zap, RefreshCw, Filter,
  BarChart2, Cpu, HardDrive, Wifi, Brain, Bell
} from 'lucide-react';
import {
  getSystemHealth, getAuditLogs, getMetrics, getSystemStatus
} from '../services/leadService';
import Spinner from '../components/common/Spinner';

const StatusBadge = ({ status }) => {
  const map = {
    online:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    offline: 'bg-red-50 text-red-700 border-red-200',
    degraded:'bg-amber-50 text-amber-700 border-amber-200',
    fallback:'bg-blue-50 text-blue-700 border-blue-200',
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const cls = map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
};

const ACTION_COLORS = {
  USER_LOGIN:          'text-emerald-600 bg-emerald-50',
  USER_LOGOUT:         'text-slate-500 bg-slate-50',
  USER_CREATED:        'text-indigo-600 bg-indigo-50',
  LEAD_CREATED:        'text-blue-600 bg-blue-50',
  LEAD_UPDATED:        'text-amber-600 bg-amber-50',
  LEAD_DELETED:        'text-red-600 bg-red-50',
  LEAD_ASSIGNED:       'text-violet-600 bg-violet-50',
  LEAD_STAGE_CHANGED:  'text-cyan-600 bg-cyan-50',
  SETTINGS_UPDATED:    'text-orange-600 bg-orange-50',
};

export default function Admin() {
  const [health, setHealth]   = useState(null);
  const [status, setStatus]   = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMeta, setAuditMeta] = useState({ total: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [auditFilter, setAuditFilter] = useState({ action: '', entity_type: '', page: 1, limit: 20 });
  const [activeTab, setActiveTab] = useState('health');

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [healthRes, statusRes, metricsRes] = await Promise.all([
        getSystemHealth(),
        getSystemStatus(),
        getMetrics(),
      ]);
      setHealth(healthRes.data.data);
      setStatus(statusRes.data.data);
      setMetrics(metricsRes.data.data);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await getAuditLogs(auditFilter);
      setAuditLogs(res.data.data || []);
      setAuditMeta(res.data.meta || { total: 0, page: 1 });
    } catch (err) {
      console.error('Audit log load error:', err);
    }
  }, [auditFilter]);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        const [healthRes, statusRes, metricsRes] = await Promise.all([
          getSystemHealth(),
          getSystemStatus(),
          getMetrics(),
        ]);
        if (active) {
          setHealth(healthRes.data.data);
          setStatus(statusRes.data.data);
          setMetrics(metricsRes.data.data);
        }
      } catch (err) {
        console.error('Admin load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (activeTab === 'audit') {
      const fetchLogs = async () => {
        try {
          const res = await getAuditLogs(auditFilter);
          if (active) {
            setAuditLogs(res.data.data || []);
            setAuditMeta(res.data.meta || { total: 0, page: 1 });
          }
        } catch (err) {
          console.error('Audit log load error:', err);
        }
      };
      fetchLogs();
    }
    return () => { active = false; };
  }, [activeTab, auditFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading admin console...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'health',  label: 'System Health',  icon: Server },
    { id: 'status',  label: 'Service Status', icon: Wifi },
    { id: 'metrics', label: 'API Metrics',     icon: BarChart2 },
    { id: 'audit',   label: 'Audit Logs',      icon: Shield },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 heading-font tracking-tight flex items-center gap-2">
            Admin Control Panel
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Super Admin</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">System health · Audit logs · API metrics · Service status</p>
        </div>
        <button
          onClick={() => loadAll(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-1.5 text-xs py-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── SYSTEM HEALTH TAB ─── */}
      {activeTab === 'health' && health && (
        <div className="space-y-6">
          {/* Big Status + Server Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Health */}
            <div className={`card p-6 rounded-xl text-white flex flex-col gap-3 ${
              health.status === 'healthy' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              <div className="flex items-center gap-2">
                {health.status === 'healthy'
                  ? <CheckCircle size={20} />
                  : <AlertTriangle size={20} />}
                <span className="font-black text-sm uppercase tracking-wider">Platform Status</span>
              </div>
              <p className="text-3xl font-black capitalize">{health.status}</p>
              <p className="text-xs opacity-80 font-semibold">Uptime: {health.server.uptime_human}</p>
            </div>

            {/* Database */}
            <div className="card p-6 bg-white border border-slate-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Database size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Database</span>
              </div>
              <StatusBadge status={health.database.status} />
              <p className="text-xs text-slate-500 font-semibold">Ping: {health.database.ping_ms}ms</p>
            </div>

            {/* Server Info */}
            <div className="card p-6 bg-white border border-slate-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Server size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Server</span>
              </div>
              <p className="text-xs text-slate-600 font-semibold">{health.server.node_version} · {health.server.environment}</p>
              <p className="text-xs text-slate-400">PID {health.server.pid}</p>
            </div>
          </div>

          {/* Memory + Request Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Heap Used', value: `${health.server.memory_mb.heap_used} MB`, icon: HardDrive, color: 'text-indigo-600' },
              { label: 'RSS Memory', value: `${health.server.memory_mb.rss} MB`, icon: Cpu, color: 'text-violet-600' },
              { label: 'Total Requests', value: health.requests.total.toLocaleString(), icon: Activity, color: 'text-blue-600' },
              { label: 'Error Rate', value: `${health.requests.error_rate_pct}%`,
                icon: AlertTriangle,
                color: health.requests.error_rate_pct > 5 ? 'text-rose-600' : 'text-emerald-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4 bg-white border border-slate-100 rounded-xl space-y-2">
                <Icon size={16} className={color} />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-xl font-black text-slate-800 heading-font">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SERVICE STATUS TAB ─── */}
      {activeTab === 'status' && status && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(status).filter(([k]) => typeof status[k] === 'object' && status[k]?.label).map(([key, svc]) => (
              <div key={key} className="card p-5 bg-white border border-slate-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {key === 'database'      && <Database size={15} className="text-slate-500" />}
                    {key === 'ai'            && <Brain size={15} className="text-slate-500" />}
                    {key === 'notifications' && <Bell size={15} className="text-slate-500" />}
                    {key === 'realtime'      && <Zap size={15} className="text-slate-500" />}
                    {key === 'api'           && <Activity size={15} className="text-slate-500" />}
                    <span className="text-xs font-bold text-slate-700">{svc.label}</span>
                  </div>
                  <StatusBadge status={svc.status} />
                </div>
                {svc.provider && <p className="text-[10px] text-slate-400 font-semibold">Provider: {svc.provider}</p>}
                {svc.requests !== undefined && (
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {svc.requests} requests · {svc.error_rate}% error rate
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="card p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 text-xs text-slate-500 font-semibold">
            <Clock size={14} />
            <span>Platform uptime: <strong className="text-slate-700">{status.uptime}</strong></span>
            <span>Environment: <strong className="text-slate-700">{status.environment}</strong></span>
            <span>Node: <strong className="text-slate-700">{status.version}</strong></span>
          </div>
        </div>
      )}

      {/* ─── API METRICS TAB ─── */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: metrics.total_requests.toLocaleString(), color: 'text-blue-600' },
              { label: '4xx Errors', value: metrics.errors_4xx, color: 'text-amber-600' },
              { label: '5xx Errors', value: metrics.errors_5xx, color: 'text-rose-600' },
              { label: 'Error Rate', value: `${metrics.error_rate_pct}%`, color: metrics.error_rate_pct > 5 ? 'text-rose-600' : 'text-emerald-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-black heading-font ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Top Routes Table */}
          <div className="card p-5 bg-white border border-slate-100 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Top API Routes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                    <th className="py-2 text-left">Route</th>
                    <th className="py-2 text-center">Requests</th>
                    <th className="py-2 text-center">Avg ms</th>
                    <th className="py-2 text-right">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.top_routes.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 font-mono text-slate-600 text-[10px]">{r.route}</td>
                      <td className="py-2 text-center text-slate-800">{r.count}</td>
                      <td className="py-2 text-center">
                        <span className={r.avgMs > 500 ? 'text-amber-600 font-bold' : 'text-slate-600'}>{r.avgMs}ms</span>
                      </td>
                      <td className="py-2 text-right">
                        {r.errors > 0
                          ? <span className="text-rose-600 font-bold">{r.errors}</span>
                          : <span className="text-emerald-600">0</span>}
                      </td>
                    </tr>
                  ))}
                  {metrics.top_routes.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400 italic">No requests recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── AUDIT LOGS TAB ─── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card p-4 bg-white border border-slate-100 rounded-xl flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Action Filter</label>
              <input
                type="text"
                placeholder="e.g. LEAD_CREATED"
                value={auditFilter.action}
                onChange={e => setAuditFilter(p => ({ ...p, action: e.target.value, page: 1 }))}
                className="input text-xs py-1.5 w-48"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Entity Type</label>
              <select
                value={auditFilter.entity_type}
                onChange={e => setAuditFilter(p => ({ ...p, entity_type: e.target.value, page: 1 }))}
                className="input text-xs py-1.5 w-40"
              >
                <option value="">All Entities</option>
                <option value="user">User</option>
                <option value="lead">Lead</option>
                <option value="system_settings">Settings</option>
              </select>
            </div>
            <button onClick={loadAuditLogs} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
              <Filter size={12} /> Apply
            </button>
          </div>

          {/* Audit Table */}
          <div className="card p-5 bg-white border border-slate-100 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Audit Log Browser</h3>
              <span className="text-[10px] text-slate-400 font-semibold">{auditMeta.total} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                    <th className="py-2 text-left">Action</th>
                    <th className="py-2 text-left">User</th>
                    <th className="py-2 text-center">Entity</th>
                    <th className="py-2 text-center">IP</th>
                    <th className="py-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {auditLogs.map((log, i) => {
                    const colors = ACTION_COLORS[log.action] || 'text-slate-600 bg-slate-50';
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${colors}`}>{log.action}</span>
                        </td>
                        <td className="py-2.5">
                          <div className="text-slate-800">{log.user_name || 'System'}</div>
                          <div className="text-[10px] text-slate-400">{log.user_email || ''}</div>
                        </td>
                        <td className="py-2.5 text-center">
                          {log.entity_type
                            ? <span className="text-slate-500 capitalize">{log.entity_type}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-2.5 text-center text-slate-400 font-mono text-[10px]">
                          {log.ip_address || '—'}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-[10px]">
                          {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No audit log entries found. Login and perform an action to see entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditMeta.total > auditFilter.limit && (
              <div className="flex items-center gap-2 justify-end text-xs">
                <button
                  disabled={auditFilter.page <= 1}
                  onClick={() => setAuditFilter(p => ({ ...p, page: p.page - 1 }))}
                  className="btn-secondary py-1 px-3 disabled:opacity-40"
                >Prev</button>
                <span className="text-slate-500">Page {auditFilter.page} of {Math.ceil(auditMeta.total / auditFilter.limit)}</span>
                <button
                  disabled={auditFilter.page >= Math.ceil(auditMeta.total / auditFilter.limit)}
                  onClick={() => setAuditFilter(p => ({ ...p, page: p.page + 1 }))}
                  className="btn-secondary py-1 px-3 disabled:opacity-40"
                >Next</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
