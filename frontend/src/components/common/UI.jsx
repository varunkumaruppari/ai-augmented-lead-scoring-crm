import { forwardRef, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, ShieldAlert } from 'lucide-react';

// ─── BUTTON COMPONENT ─────────────────────────────────────────────────────────
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  iconPosition = 'left',
  type = 'button',
  ...props
}, ref) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0";
  
  const variants = {
    primary: "bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 text-white shadow-sm border border-indigo-700/20",
    secondary: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-250 border border-slate-200/60 dark:border-slate-700/50",
    outline: "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    danger: "bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-550 hover:to-rose-650 text-white shadow-sm border border-rose-700/20 border-transparent",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px] h-8",
    md: "px-4.5 py-2 text-xs h-10",
    lg: "px-6 py-2.5 text-sm h-12"
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 12 : 14} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 12 : 14} />}
    </button>
  );
});

Button.displayName = 'Button';

// ─── INPUT COMPONENT ──────────────────────────────────────────────────────────
export const Input = forwardRef(({
  label,
  error,
  icon: Icon = null,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1 w-full ${containerClassName}`}>
      {label && <label className="label">{label}</label>}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon size={15} />
          </div>
        )}
        <input
          ref={ref}
          className={`input w-full ${Icon ? 'pl-10' : ''} ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-500 mt-0.5">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// ─── SELECT COMPONENT ─────────────────────────────────────────────────────────
export const Select = forwardRef(({
  label,
  error,
  options = [],
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1 w-full ${containerClassName}`}>
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={`input w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 ${error ? 'border-rose-500' : ''} ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-500 mt-0.5">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

// ─── TEXTAREA COMPONENT ───────────────────────────────────────────────────────
export const Textarea = forwardRef(({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1 w-full ${containerClassName}`}>
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={`input w-full resize-none min-h-[80px] ${error ? 'border-rose-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-500 mt-0.5">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ─── CARD COMPONENT ───────────────────────────────────────────────────────────
export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div 
      className={`card p-5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm ${hoverEffect ? 'hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

// ─── BADGE COMPONENT ──────────────────────────────────────────────────────────
export const Badge = ({
  children,
  variant = 'info',
  className = '',
  ...props
}) => {
  const variants = {
    info: "bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    warning: "bg-amber-50 text-amber-705 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20",
    slate: "bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700/50",
    hot: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    warm: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    cold: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wide border shadow-sm ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
};

// ─── AVATAR COMPONENT ─────────────────────────────────────────────────────────
export const Avatar = ({
  name = '',
  size = 'md',
  className = '',
  status = null,
  ...props
}) => {
  const initial = name ? name[0].toUpperCase() : '?';
  
  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8.5 h-8.5 text-xs",
    lg: "w-11 h-11 text-sm"
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`} {...props}>
      <div className={`rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700/60 border border-indigo-200/60 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 shadow-sm ${sizes[size]}`}>
        {initial}
      </div>
      {status === 'online' && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
      )}
    </div>
  );
};

// ─── MODAL COMPONENT ──────────────────────────────────────────────────────────
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md'
}) => {
  const overlayRef = useRef(null);

  // Esc keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const focusableElements = overlayRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    ) || [];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTrap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTrap);
    // Focus first element on open
    firstElement?.focus();
    return () => document.removeEventListener('keydown', handleTrap);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          {/* Overlay mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-[2px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative w-full ${maxWidth} overflow-hidden z-10`}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white heading-font text-base leading-normal">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── TOOLTIP COMPONENT ────────────────────────────────────────────────────────
export const Tooltip = ({
  content,
  children,
  position = 'top',
  className = ''
}) => {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div className={`absolute z-50 hidden group-hover:block bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-slate-800/80 pointer-events-none transition-all duration-200 animate-fade-in ${positions[position]} ${className}`}>
        {content}
      </div>
    </div>
  );
};

// ─── SKELETON COMPONENT ───────────────────────────────────────────────────────
export const Skeleton = ({
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`skeleton bg-slate-200/80 dark:bg-slate-800/50 rounded-lg ${className}`} 
      {...props}
    />
  );
};

// ─── SPINNER COMPONENT ────────────────────────────────────────────────────────
export const Spinner = ({
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: "w-4 h-4 stroke-[3]",
    md: "w-8 h-8 stroke-[2]",
    lg: "w-12 h-12 stroke-[1.5]"
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg className={`animate-spin text-indigo-650 dark:text-indigo-500 ${sizes[size]}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
};

// ─── TABLE COMPONENT ──────────────────────────────────────────────────────────
export const Table = ({
  headers = [],
  children,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm ${className}`}>
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
            {headers.map(h => (
              <th key={h} className="px-5 py-4 font-black">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350 font-medium">
          {children}
        </tbody>
      </table>
    </div>
  );
};

// ─── EMPTY STATE COMPONENT ────────────────────────────────────────────────────
export const EmptyState = ({
  icon: Icon = Sparkles,
  title,
  description,
  action = null
}) => {
  return (
    <div className="card text-center p-12 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200/60 dark:border-indigo-500/20">
        <Icon size={24} className="animate-pulse" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white heading-font">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

// ─── ERROR STATE COMPONENT ────────────────────────────────────────────────────
export const ErrorState = ({
  title = "Intelligence Core Offline",
  description = "We couldn't connect to LeadScape AI analytics telemetry. Please verify server connections.",
  onRetry
}) => {
  return (
    <div className="card text-center p-12 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-500/20">
        <ShieldAlert size={24} />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white heading-font">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button onClick={onRetry} variant="secondary" size="sm">
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};
