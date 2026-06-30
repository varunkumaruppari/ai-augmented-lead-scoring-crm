import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Bell, Settings, LogOut,
  Target, Kanban, Award, FileText, ShieldAlert, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline',     icon: Kanban,           label: 'Pipeline' },
  { to: '/leads',        icon: Users,            label: 'Leads' },
  { to: '/performance',  icon: Award,            label: 'Performance' },
  { to: '/analytics',    icon: BarChart3,        label: 'Analytics' },
  { to: '/reports',      icon: FileText,         label: 'Reports' },
  { to: '/follow-ups',   icon: Target,           label: 'Follow-Ups' },
  { to: '/notifications',icon: Bell,             label: 'Notifications' },
  { to: '/settings',     icon: Settings,         label: 'Settings',    minRole: ['admin','super_admin','manager'] },
  { to: '/admin',        icon: ShieldAlert,      label: 'Admin Panel', minRole: ['admin','super_admin'] },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logoutUser } = useAuth();

  const canAccess = (item) => {
    if (!item.minRole) return true;
    return item.minRole.includes(user?.role);
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col min-h-screen border-r border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-500/10">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </div>
          <div>
            <p className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white heading-font">LeadScape AI</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Revenue Copilot</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.filter(canAccess).map(({ to, icon: Icon, label }) => {
          const active = to === '/leads'
            ? pathname === '/leads' || pathname.startsWith('/leads/')
            : pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-600/10 border border-white/10'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white border border-transparent'
                }`}>
              <Icon size={16} className={active ? 'text-white' : 'text-slate-400 dark:text-slate-550 group-hover:text-slate-900 dark:group-hover:text-white'} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="relative">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button onClick={logoutUser}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}

