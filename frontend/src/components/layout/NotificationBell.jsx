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
  new_lead: { icon: UserPlus, color: 'text-blue-500 bg-blue-50' },
  lead_assigned: { icon: Target, color: 'text-indigo-500 bg-indigo-50' },
  hot_lead_alert: { icon: Flame, color: 'text-red-500 bg-red-50' },
  followup_due: { icon: ClockIcon, color: 'text-amber-500 bg-amber-50' },
  followup_overdue: { icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
  lead_converted: { icon: Sparkles, color: 'text-emerald-500 bg-emerald-50' },
  lead_lost: { icon: X, color: 'text-slate-500 bg-slate-50' },
  revenue_milestone: { icon: TrendingUp, color: 'text-violet-500 bg-violet-50' },
  agent_achievement: { icon: Award, color: 'text-yellow-500 bg-yellow-50' }
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
      {/* Notification Banner Dropdown Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
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
          className="fixed top-4 right-4 z-50 max-w-sm w-80 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 cursor-pointer hover:bg-slate-800/90 transition-all animate-slide-in"
        >
          <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Bell size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Real-Time Alert</p>
            <p className="text-sm font-bold truncate mt-0.5">{bannerNotif.title}</p>
            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{bannerNotif.message}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setBannerNotif(null);
            }} 
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 heading-font text-base">Notifications</h3>
              <p className="text-[11px] text-slate-400 font-semibold">{unreadCount} unread alerts</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
              >
                <CheckSquare size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="px-4 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] font-bold text-slate-500">
            {[
              { id: 'all', label: 'All' },
              { id: 'leads', label: 'Leads' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'milestones', label: 'Milestones' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-full transition-colors ${filterType === f.id ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List Area */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CircleDot size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-medium">No recent notifications</p>
              </div>
            ) : (
              filteredList.map(notif => {
                const config = TYPE_ICONS[notif.type] || { icon: HelpCircle, color: 'text-slate-500 bg-slate-50' };
                const Icon = config.icon;
                
                return (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (!notif.is_read) handleMarkRead(notif.id);
                      if (notif.lead_id) navigate(`/leads/${notif.lead_id}`);
                    }}
                    className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors relative
                      ${!notif.is_read ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Unread indicator */}
                    {!notif.is_read && (
                      <span className="absolute top-5 left-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}

                    {/* Icon Bubble */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${config.color}`}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate pr-6">{notif.title}</p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">{formatTimeAgo(notif.created_at)}</p>
                    </div>

                    {/* Inline Mark Read Button */}
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="absolute right-4 top-4 p-1 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-slate-100/60 transition-all"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* View Center Footer */}
          <Link 
            to="/notifications" 
            onClick={() => setIsOpen(false)}
            className="block text-center py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-slate-100/50 transition-colors"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}
