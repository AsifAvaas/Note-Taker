import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyNotesTab from './components/MyNotesTab';
import InterestsAggTab from './components/InterestsAggTab';
import PostsLookupTab from './components/PostsLookupTab';
import AdminPanelTab from './components/AdminPanelTab';

function AuthScreen() {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState('');

  const fillDemo = (demoEmail, demoPassword) => {
    setIsLogin(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) setError(res.message);
    } else {
      const res = await register({ name, email, password, interests, role });
      if (!res.success) setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-7 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white text-lg shadow-sm mb-3">
            NT
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Note Taker</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Backend Technical Interview Testing Console with RBAC & Aggregations
          </p>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2.5">
          <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
            Quick 1-Click Demo Logins:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@notetaker.com', 'Admin123!')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-300/80 rounded-xl font-medium transition cursor-pointer active:scale-95 text-[11px]"
            >
              👑 Admin (admin@notetaker.com)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('alice@notetaker.com', 'User123!')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 rounded-xl font-medium transition cursor-pointer active:scale-95 text-[11px]"
            >
              👤 Alice (User)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('bob@notetaker.com', 'User123!')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-300/80 rounded-xl font-medium transition cursor-pointer active:scale-95 text-[11px]"
            >
              👤 Bob (User)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('diana@notetaker.com', 'User123!')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 border border-indigo-300/80 rounded-xl font-medium transition cursor-pointer active:scale-95 text-[11px]"
            >
              👤 Diana (User)
            </button>
          </div>
        </div>

        {/* Toggle Login / Register */}
        <div className="flex border border-slate-200 rounded-2xl p-1 bg-slate-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              isLogin
                ? 'bg-white shadow-xs text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              !isLogin
                ? 'bg-white shadow-xs text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!isLogin && (
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="user@notetaker.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Interests (comma-separated, e.g. "chess, coding, reading")
                </label>
                <input
                  type="text"
                  placeholder="chess, coding, travel"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Role Selector
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all cursor-pointer"
                >
                  <option value="User">User (Standard)</option>
                  <option value="Admin">Admin (Requires seeding/admin panel)</option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                  *Public registration strictly enforces <code>role: 'User'</code> per backend RBAC rules. Use the seeded Admin account or Admin panel to create administrators.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 shadow-sm active:scale-99"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In to Dashboard' : 'Create Account'}
          </button>
        </form>

        {/* Active Security Protections Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400">
          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md">
            🛡️ express-rate-limit (Brute-Force Guard)
          </span>
          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md">
            🔒 mongo-sanitize (NoSQLi Defense)
          </span>
          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md">
            🔑 bcryptjs + JWT
          </span>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('notes');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'notes' && <MyNotesTab />}
        {activeTab === 'interests' && <InterestsAggTab />}
        {activeTab === 'posts' && <PostsLookupTab />}
        {activeTab === 'admin' && user?.role === 'Admin' && <AdminPanelTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

function MainContent() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <AuthScreen />;
}
