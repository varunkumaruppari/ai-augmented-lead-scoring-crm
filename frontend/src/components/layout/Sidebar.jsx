import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Bell, Settings, LogOut,
  Target, Kanban, Award, FileText, ShieldAlert
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
  // Settings & Admin — role restricted
  { to: '/settings', icon: Settings,   label: 'Settings',    minRole: ['admin','super_admin','manager'] },
  { to: '/admin',    icon: ShieldAlert, label: 'Admin Panel', minRole: ['admin','super_admin'] },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logoutUser } = useAuth();

  const canAccess = (item) => {
    if (!item.minRole) return true;
    return item.minRole.includes(user?.role);
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg">
            LS
          </div>
          <div>
            <p className="font-semibold text-sm">Lead Scoring</p>
            <p className="text-xs text-slate-400">Lohithadharma Projects</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {nav.filter(canAccess).map(({ to, icon: Icon, label }) => {
          const active = to === '/leads'
            ? pathname === '/leads' || pathname.startsWith('/leads/')
            : pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? to === '/admin'
                    ? 'bg-rose-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={logoutUser}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-2 py-1.5 rounded hover:bg-slate-800 transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
