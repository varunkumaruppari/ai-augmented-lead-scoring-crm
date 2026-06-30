import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Bell, Check, CheckSquare, Sparkles, Target, 
  UserPlus, Award, AlertTriangle, HelpCircle, Flame,
  TrendingUp, CircleDot, X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Custom time formatter
const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
};

const TYPE_ICONS = {
  new_lead: { icon: UserPlus, color: 'text-blue-700 bg-blue-50 border border-blue-200' },
  lead_assigned: { icon: Target, color: 'text-indigo-700 bg-indigo-50 border border-indigo-200' },
  hot_lead_alert: { icon: Flame, color: 'text-red-700 bg-red-50 border border-red-200' },
  followup_due: { icon: ClockIcon, color: 'text-amber-700 bg-amber-50 border border-amber-200' },
  followup_overdue: { icon: AlertTriangle, color: 'text-rose-700 bg-rose-50 border border-rose-200' },
  lead_converted: { icon: Sparkles, color: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  lead_lost: { icon: X, color: 'text-slate-650 bg-slate-50 border border-slate-200' },
  revenue_milestone: { icon: TrendingUp, color: 'text-violet-750 bg-violet-50 border border-violet-200' },
  agent_achievement: { icon: Award, color: 'text-yellow-800 bg-yellow-50 border border-yellow-250' }
};

// Fallback Clock Icon
function ClockIcon({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  // Real-time banner alert state
  const [bannerNotif, setBannerNotif] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    let active = true;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (active) {
          setNotifications(res.data.data || []);
          setUnreadCount(res.data.meta?.unread || 0);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err.message);
      }
    };
    fetchNotifications();

    // Setup Socket.io client connection
    const token = localStorage.getItem('access_token');
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server.');
    });

    socket.on('notification', (newNotif) => {
      console.log('[Socket] Real-time notification received:', newNotif);
      
      // Update local lists
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Trigger pop-down notification banner alert if dropdown is closed
      setBannerNotif(newNotif);
      setTimeout(() => setBannerNotif(null), 5000);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server.');
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [user]);

  const handleMarkRead = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  };

  const getFilteredNotifications = () => {
    if (filterType === 'all') return notifications;
    if (filterType === 'leads') return notifications.filter(n => ['new_lead', 'lead_assigned', 'hot_lead_alert', 'lead_converted', 'lead_lost'].includes(n.type));
    if (filterType === 'tasks') return notifications.filter(n => ['followup_due', 'followup_overdue'].includes(n.type));
    if (filterType === 'milestones') return notifications.filter(n => ['revenue_milestone', 'agent_achievement'].includes(n.type));
    return notifications;
  };

  const filteredList = getFilteredNotifications();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-indigo-650 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all focus:outline-none"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-650 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Real-Time Drop-down Banner Alert */}
      {bannerNotif && (
        <div 
          onClick={() => {
            setIsOpen(true);
            setBannerNotif(null);
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-80 bg-white/95 text-slate-805 p-4 rounded-2xl shadow-xl border border-slate-200/90 backdrop-blur-md flex items-start gap-3 cursor-pointer hover:bg-slate-50/95 transition-all animate-slide-in"
        >
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-700 border border-indigo-200 shrink-0">
            <Bell size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-650">Real-Time Alert</p>
            <p className="text-xs font-bold truncate mt-0.5 text-slate-900">{bannerNotif.title}</p>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed font-semibold">{bannerNotif.message}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setBannerNotif(null);
            }} 
            className="text-slate-400 hover:text-slate-700"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 heading-font text-sm uppercase tracking-wider">Notifications</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{unreadCount} unread system alerts</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-650 hover:text-indigo-800 font-bold flex items-center gap-1.5 hover:underline"
              >
                <CheckSquare size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Filters tabs */}
          <div className="px-4 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[10px] font-bold text-slate-400">
            {[
              { id: 'all', label: 'All' },
              { id: 'leads', label: 'Leads' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'milestones', label: 'Milestones' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-full transition-all border
                  ${filterType === f.id 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                    : 'bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List Area */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CircleDot size={20} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No recent notifications</p>
              </div>
            ) : (
              filteredList.map(notif => {
                const config = TYPE_ICONS[notif.type] || { icon: HelpCircle, color: 'text-slate-500 bg-slate-50 border border-slate-200' };
                const Icon = config.icon;
                
                return (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (!notif.is_read) handleMarkRead(notif.id);
                      if (notif.lead_id) navigate(`/leads/${notif.lead_id}`);
                    }}
                    className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors relative
                      ${!notif.is_read ? 'bg-indigo-50/15' : ''}`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.is_read && (
                      <span className="absolute top-5 left-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                    )}

                    {/* Icon Bubble */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${config.color}`}>
                      <Icon size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate pr-6">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-2">{notif.message}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">{formatTimeAgo(notif.created_at)}</p>
                    </div>

                    {/* Inline Mark Read Button */}
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-indigo-650 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* View Center Footer Link */}
          <Link 
            to="/notifications" 
            onClick={() => setIsOpen(false)}
            className="block text-center py-3 bg-slate-50/50 border-t border-slate-150 text-xs font-bold text-indigo-655 hover:text-indigo-800 hover:bg-slate-50 transition-colors"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}
