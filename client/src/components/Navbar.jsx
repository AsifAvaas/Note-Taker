import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'notes', label: 'My Notes' },
    { id: 'interests', label: 'Interests Aggregation (Scenario 1)' },
    { id: 'posts', label: 'User Posts & $lookup (Scenario 2)' },
    ...(user?.role === 'Admin' ? [{ id: 'admin', label: 'Admin Control Center' }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-xs">
            NT
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">Note Taker</span>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              Technical Verification Console
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-5 text-sm">
          <div className="text-right">
            <div className="font-semibold text-slate-100">{user?.name}</div>
            <div className="text-xs text-slate-400 flex items-center justify-end gap-2 mt-0.5">
              <span>{user?.email}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                  user?.role === 'Admin'
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-xs font-semibold bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-transparent rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Modern Tabs Navigation Bar */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-6 py-2">
        <div className="max-w-6xl mx-auto flex space-x-2 overflow-x-auto py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
