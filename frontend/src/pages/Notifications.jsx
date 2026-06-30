import { useState, useEffect } from 'react';
import { Bell, CheckSquare, Calendar } from 'lucide-react';
import api from '../services/api';
import Spinner from '../components/common/Spinner';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/notifications').then(r => setNotifs(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { 
    await api.put(`/notifications/${id}/read`); 
    load(); 
  };
  
  const markAll = async () => { 
    await api.put('/notifications/read-all'); 
    load(); 
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 heading-font tracking-tight text-gradient">
              Alerts History
            </h1>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-indigo-200">
              Activity Feed
            </div>
          </div>
          <p className="text-slate-500 text-xs font-semibold">
            Chronological audit logs of LeadScape AI alerts, assignments, and milestones
          </p>
        </div>
        <div>
          {notifs.some(n => !n.is_read) && (
            <button 
              onClick={markAll} 
              className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-4 font-bold border-slate-250 text-indigo-655 hover:text-indigo-800"
            >
              <CheckSquare size={13} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications Feed List */}
      {notifs.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <Bell size={40} className="mx-auto text-slate-300 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800 heading-font">No alerts found</h3>
          <p className="text-xs text-slate-550 mt-1 font-medium">All operations normal. Feed is currently empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map(n => (
            <div 
              key={n.id} 
              onClick={() => !n.is_read && markRead(n.id)}
              className={`card p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50/50 transition-all relative overflow-hidden
                ${!n.is_read 
                  ? 'border-indigo-200 bg-indigo-50/15' 
                  : ''
                }`}
            >
              {/* Unread Glow Accent Line */}
              {!n.is_read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
              )}
              
              {/* Alert Indicator Bullet */}
              <div className={`w-2 h-2 rounded-full mt-2.5 shrink-0 ${!n.is_read ? 'bg-indigo-600' : 'bg-slate-300'}`} />
              
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-slate-900 text-sm tracking-tight">{n.title}</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
                
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold pt-1">
                  <Calendar size={10} className="text-slate-400" />
                  <span>{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
