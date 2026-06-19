import { useState, useEffect } from 'react';
import api from '../services/api';
import Spinner from '../components/common/Spinner';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/notifications').then(r => setNotifs(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { await api.put(`/notifications/${id}/read`); load(); };
  const markAll = async () => { await api.put('/notifications/read-all'); load(); };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifs.some(n => !n.is_read) && (
          <button onClick={markAll} className="btn-secondary text-sm">Mark all read</button>
        )}
      </div>
      {notifs.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No notifications</div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${!n.is_read ? 'border-blue-200 bg-blue-50' : ''}`}
              onClick={() => !n.is_read && markRead(n.id)}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
