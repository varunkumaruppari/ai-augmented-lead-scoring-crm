import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Brain, Bell, Sliders, Save,
  RefreshCw, CheckCircle, AlertCircle, UserPlus, Eye, EyeOff
} from 'lucide-react';
import api from '../services/api';
import { getAdminSettings, updateAdminSettings } from '../services/leadService';
import Spinner from '../components/common/Spinner';

const ROLE_COLORS = {
  super_admin: 'bg-rose-100 text-rose-700 border border-rose-200',
  admin:       'bg-indigo-100 text-indigo-700 border border-indigo-200',
  manager:     'bg-violet-100 text-violet-700 border border-violet-200',
  agent:       'bg-blue-100 text-blue-700 border border-blue-200',
  viewer:      'bg-slate-100 text-slate-600 border border-slate-200',
};

const PERMISSION_MATRIX = [
  { feature: 'Dashboard',       super_admin: '✅', admin: '✅', manager: '✅', agent: '✅', viewer: '✅' },
  { feature: 'Lead List',       super_admin: '✅', admin: '✅', manager: '✅', agent: '✅', viewer: '👁' },
  { feature: 'Create Lead',     super_admin: '✅', admin: '✅', manager: '✅', agent: '✅', viewer: '❌' },
  { feature: 'Delete Lead',     super_admin: '✅', admin: '✅', manager: '❌', agent: '❌', viewer: '❌' },
  { feature: 'Assign Lead',     super_admin: '✅', admin: '✅', manager: '✅', agent: '❌', viewer: '❌' },
  { feature: 'Pipeline',        super_admin: '✅', admin: '✅', manager: '✅', agent: '✅', viewer: '👁' },
  { feature: 'Analytics',       super_admin: '✅', admin: '✅', manager: '✅', agent: '✅', viewer: '✅' },
  { feature: 'Reports',         super_admin: '✅', admin: '✅', manager: '✅', agent: '👁', viewer: '👁' },
  { feature: 'Generate Reports',super_admin: '✅', admin: '✅', manager: '✅', agent: '❌', viewer: '❌' },
  { feature: 'User Management', super_admin: '✅', admin: '✅', manager: '👁', agent: '❌', viewer: '❌' },
  { feature: 'Settings',        super_admin: '✅', admin: '✅', manager: '👁', agent: '❌', viewer: '❌' },
  { feature: 'Admin Panel',     super_admin: '✅', admin: '✅', manager: '❌', agent: '❌', viewer: '❌' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // User creation form
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', role: 'agent' });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    'company.name': '',
    'company.timezone': '',
    'company.currency': '',
    'notifications.email_enabled': 'true',
    'notifications.whatsapp_enabled': 'false',
    'ai.provider': 'mock',
    'ai.fallback_enabled': 'true',
    'security.max_failed_logins': '5',
    'security.session_timeout_minutes': '480',
    'system.maintenance_mode': 'false',
    'system.log_level': 'info',
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          api.get('/users'),
          getAdminSettings(),
        ]);
        if (active) {
          setUsers(usersRes.data.data || []);
          const map = settingsRes.data.data?.settings || {};
          setSettingsForm(prev => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error('Settings load failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const saveSettings = async (category) => {
    setSaving(true);
    try {
      const entries = Object.entries(settingsForm)
        .filter(([key]) => key.startsWith(category + '.'))
        .map(([key, value]) => ({ key, value, category }));
      await updateAdminSettings(entries);
      showMsg('success', 'Settings saved successfully.');
    } catch (err) {
      showMsg('error', err.response?.data?.error?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', userForm);
      showMsg('success', `User ${userForm.email} created.`);
      setShowUserForm(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'agent' });
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      showMsg('error', err.response?.data?.error?.message || 'Failed to create user.');
    }
  };

  const sf = (key) => settingsForm[key] || '';
  const setSF = (key, val) => setSettingsForm(p => ({ ...p, [key]: val }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading settings center...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'company',       label: 'Company',        icon: Building2 },
    { id: 'users',         label: 'Users & Roles',  icon: Users },
    { id: 'permissions',   label: 'Permissions',    icon: Shield },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
    { id: 'ai',            label: 'AI Provider',    icon: Brain },
    { id: 'security',      label: 'Security',       icon: Shield },
    { id: 'system',        label: 'System',         icon: Sliders },
  ];



  return (
    <div className="space-y-6 pb-12 max-w-5xl">

      {/* Header */}
      <div className="border-b pb-4 border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 heading-font tracking-tight">Settings Center</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-semibold">Company · Users · Security · AI · System preferences</p>
      </div>

      {/* Status message */}
      {msg.text && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-semibold border ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 shrink-0">
          <nav className="space-y-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 card p-6 bg-white border border-slate-100 rounded-xl space-y-6">

          {/* COMPANY */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">Company Settings</h2>
                <p className="text-xs text-slate-400">Basic company information used in reports and UI branding.</p>
              </div>
              <InputField label="Company Name" settingKey="company.name" description="Displayed in reports, emails, and the sidebar." sf={sf} setSF={setSF} />
              <InputField label="Default Timezone" settingKey="company.timezone"
                options={[
                  { value: 'Asia/Kolkata', label: 'IST — Asia/Kolkata' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'EST — America/New_York' },
                  { value: 'Europe/London', label: 'GMT — Europe/London' },
                ]}
                description="Used for report timestamps and scheduled events."
                sf={sf} setSF={setSF}
              />
              <InputField label="Currency" settingKey="company.currency"
                options={[
                  { value: 'INR', label: 'INR — Indian Rupee (₹)' },
                  { value: 'USD', label: 'USD — US Dollar ($)' },
                  { value: 'EUR', label: 'EUR — Euro (€)' },
                ]}
                sf={sf} setSF={setSF}
              />
              <SaveBtn category="company" saveSettings={saveSettings} saving={saving} />
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-0.5">User Management</h2>
                  <p className="text-xs text-slate-400">Manage team accounts and role assignments.</p>
                </div>
                <button onClick={() => setShowUserForm(!showUserForm)} className="btn-primary text-xs py-2 flex items-center gap-1.5">
                  <UserPlus size={13} /> Add User
                </button>
              </div>

              {showUserForm && (
                <form onSubmit={createUser} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">New User</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
                      <input className="input text-sm py-2 w-full" placeholder="Full Name *" required
                        value={userForm.full_name} onChange={e => setUserForm(p => ({...p, full_name: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email</label>
                      <input className="input text-sm py-2 w-full" placeholder="Email *" type="email" required
                        value={userForm.email} onChange={e => setUserForm(p => ({...p, email: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
                      <div className="relative">
                        <input className="input text-sm py-2 w-full pr-8" placeholder="Password *"
                          type={showPassword ? 'text' : 'password'} required
                          value={userForm.password} onChange={e => setUserForm(p => ({...p, password: e.target.value}))} />
                        <button type="button" onClick={() => setShowPassword(p => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Role</label>
                      <select className="input text-sm py-2 w-full" value={userForm.role}
                        onChange={e => setUserForm(p => ({...p, role: e.target.value}))}>
                        {['agent', 'manager', 'admin', 'viewer'].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs">Create User</button>
                    <button type="button" onClick={() => setShowUserForm(false)} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                      {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Joined'].map(h => (
                        <th key={h} className="text-left py-2 px-3 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black">
                              {u.full_name?.[0]?.toUpperCase()}
                            </div>
                            {u.full_name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black capitalize ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold ${u.is_active ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">
                          {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-IN') : 'Never'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">
                          {new Date(u.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PERMISSIONS MATRIX */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">Role Permission Matrix</h2>
                <p className="text-xs text-slate-400">Read-only reference for access control across all roles. Changes require backend updates.</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase text-[10px] tracking-wider">Feature</th>
                      {['Super Admin', 'Admin', 'Manager', 'Agent', 'Viewer'].map(r => (
                        <th key={r} className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {PERMISSION_MATRIX.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{row.feature}</td>
                        {['super_admin', 'admin', 'manager', 'agent', 'viewer'].map(r => (
                          <td key={r} className="py-2.5 px-3 text-center text-base">{row[r]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400">✅ Full Access &nbsp;&nbsp; 👁 Read-Only &nbsp;&nbsp; ❌ No Access</p>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">Notification Settings</h2>
                <p className="text-xs text-slate-400">Configure how the platform sends alerts and updates.</p>
              </div>
              <ToggleField label="Email Notifications" settingKey="notifications.email_enabled"
                description="Send email alerts for lead assignments, follow-ups, and report delivery." sf={sf} setSF={setSF} />
              <ToggleField label="WhatsApp Notifications" settingKey="notifications.whatsapp_enabled"
                description="Send WhatsApp messages to agents when leads are assigned." sf={sf} setSF={setSF} />
              <SaveBtn category="notifications" saveSettings={saveSettings} saving={saving} />
            </div>
          )}

          {/* AI PROVIDER */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">AI Provider Settings</h2>
                <p className="text-xs text-slate-400">Configure which AI service is used for lead insights and outreach generation.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-semibold">
                ⚠️ Changing AI provider here updates the display only. The actual provider is configured via the <code>AI_PROVIDER</code> environment variable.
              </div>
              <InputField label="Active AI Provider" settingKey="ai.provider"
                options={[
                  { value: 'mock', label: 'Mock (Rule-Based Engine)' },
                  { value: 'openai', label: 'OpenAI GPT-4' },
                  { value: 'gemini', label: 'Google Gemini' },
                ]}
                sf={sf} setSF={setSF}
              />
              <ToggleField label="Auto-Fallback to Mock" settingKey="ai.fallback_enabled"
                description="Automatically switch to mock provider if the selected provider is unavailable." sf={sf} setSF={setSF} />
              <SaveBtn category="ai" saveSettings={saveSettings} saving={saving} />
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">Security Settings</h2>
                <p className="text-xs text-slate-400">Account lockout and session management configuration.</p>
              </div>
              <InputField label="Max Failed Login Attempts" settingKey="security.max_failed_logins" type="number"
                description="Number of failed logins before an account is temporarily locked." sf={sf} setSF={setSF} />
              <InputField label="Session Timeout (minutes)" settingKey="security.session_timeout_minutes" type="number"
                description="How long a user session remains valid without activity." sf={sf} setSF={setSF} />
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Current JWT Configuration</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Access Token Lifetime: <strong>15 minutes</strong></div>
                  <div>Refresh Token Lifetime: <strong>7 days</strong></div>
                  <div>Hashing: <strong>bcrypt cost 12</strong></div>
                  <div>Algorithm: <strong>HS256</strong></div>
                </div>
              </div>
              <SaveBtn category="security" saveSettings={saveSettings} saving={saving} />
            </div>
          )}

          {/* SYSTEM */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">System Preferences</h2>
                <p className="text-xs text-slate-400">Platform-wide operational settings.</p>
              </div>
              <ToggleField label="Maintenance Mode" settingKey="system.maintenance_mode"
                description="When enabled, the API will return 503 for all non-admin requests." sf={sf} setSF={setSF} />
              <InputField label="Log Level" settingKey="system.log_level"
                options={[
                  { value: 'error', label: 'error — Errors only' },
                  { value: 'warn',  label: 'warn — Warnings + Errors' },
                  { value: 'info',  label: 'info — Standard (recommended)' },
                  { value: 'debug', label: 'debug — Verbose (development only)' },
                ]}
                description="Controls the verbosity of server logs."
                sf={sf} setSF={setSF}
              />
              <SaveBtn category="system" saveSettings={saveSettings} saving={saving} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Defined outside of Settings component to satisfy react-hooks/static-components rule
const ToggleField = ({ label, settingKey, description, sf, setSF }) => (
  <div className="flex items-start justify-between py-3 border-b border-slate-50">
    <div>
      <p className="text-sm font-bold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => setSF(settingKey, sf(settingKey) === 'true' ? 'false' : 'true')}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        sf(settingKey) === 'true' ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        sf(settingKey) === 'true' ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
  </div>
);

const InputField = ({ label, settingKey, type = 'text', options = null, description, sf, setSF }) => (
  <div className="space-y-1 py-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
    {description && <p className="text-xs text-slate-400">{description}</p>}
    {options ? (
      <select
        value={sf(settingKey)}
        onChange={e => setSF(settingKey, e.target.value)}
        className="input text-sm py-2 w-full max-w-xs"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={sf(settingKey)}
        onChange={e => setSF(settingKey, e.target.value)}
        className="input text-sm py-2 w-full max-w-xs"
      />
    )}
  </div>
);

const SaveBtn = ({ category, saveSettings, saving }) => (
  <button
    onClick={() => saveSettings(category)}
    disabled={saving}
    className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-md shadow-indigo-100"
  >
    {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
    Save Changes
  </button>
);
