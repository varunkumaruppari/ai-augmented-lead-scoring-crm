import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-8 py-4 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">Live AI Scoring Engine Active</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Premium Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-slate-650 dark:text-slate-300 transition-all duration-200 active:scale-95 flex items-center justify-center hover:shadow-sm"
            >
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-700" />}
            </button>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <NotificationBell />
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">
              Welcome back, <strong className="text-slate-900 dark:text-white font-bold">{user?.full_name?.split(' ')[0]}</strong>
            </span>
          </div>
        </header>
        
        {/* Page layout slide-in entry animation */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 p-8 overflow-y-auto"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

