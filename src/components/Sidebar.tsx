import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ViewType, SettingsSection } from '../types';
import {
  LayoutDashboard,
  Users,
  Coins,
  UserCheck,
  TrendingDown,
  BookOpen,
  Archive,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronUp,
  ChevronDown,
  CalendarCheck,
  Database,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    themeMode,
    toggleThemeMode,
    logout,
    setActiveSettingsSection,
    setSelectedLedgerBorrowerId,
  } = useApp();

  const [settingsDropupOpen, setSettingsDropupOpen] = useState(false);
  const dropupRef = useRef<HTMLDivElement>(null);

  // Close dropup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropupRef.current && !dropupRef.current.contains(event.target as Node)) {
        setSettingsDropupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view: ViewType) => {
    if (view === 'ledger') {
      setSelectedLedgerBorrowerId(null);
    }
    setCurrentView(view);
    setSettingsDropupOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSettingsSectionClick = (section: SettingsSection) => {
    setActiveSettingsSection(section);
    setCurrentView('settings');
    setSettingsDropupOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'borrowers' as ViewType,
      label: 'Borrowers',
      icon: Users,
    },
    {
      id: 'capital' as ViewType,
      label: 'Capital',
      icon: Coins,
    },
    {
      id: 'collectors' as ViewType,
      label: 'Collectors',
      icon: UserCheck,
    },
    {
      id: 'cashouts' as ViewType,
      label: 'Cash Outs',
      icon: TrendingDown,
    },
    {
      id: 'past-ledger' as ViewType,
      label: 'Past Ledger',
      icon: Archive,
    },
    {
      id: 'ledger' as ViewType,
      label: 'Ledger',
      icon: BookOpen,
    },
  ];

  return (
    <aside
      id="app-aside"
      className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-screen z-30 transition-colors"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              ₱
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight leading-tight">
                LendGrower
              </h1>
              <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold block">
                Portfolio Admin (Local)
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold px-3 mb-2 tracking-wider">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'active bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Settings Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
        <div className="relative" ref={dropupRef}>
          {settingsDropupOpen && (
            <div
              id="settings-dropup-menu"
              className="absolute bottom-full mb-2 left-0 w-full bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 space-y-1 z-40 text-xs animate-in fade-in slide-in-from-bottom-2"
            >
              <button
                onClick={() => handleSettingsSectionClick('backup')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Backup & Restore</span>
              </button>

              <button
                onClick={() => handleSettingsSectionClick('dcs')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Collection Sheet</span>
              </button>

              <button
                onClick={toggleThemeMode}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {themeMode === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>Theme Mode</span>
                </div>
                <span
                  id="theme-mode-label"
                  className="text-[10px] text-indigo-400 font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                >
                  {themeMode === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              <div className="border-t border-slate-800 my-1"></div>

              <button
                onClick={() => handleSettingsSectionClick('danger')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Danger Zone</span>
              </button>
            </div>
          )}

          <button
            id="nav-settings"
            onClick={() => setSettingsDropupOpen((prev) => !prev)}
            className={`w-full sidebar-item flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              currentView === 'settings'
                ? 'active bg-slate-800 text-white border border-slate-700/60 font-semibold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Settings</span>
            </span>
            {settingsDropupOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* User profile & sign out */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            <p className="text-slate-200 font-semibold text-[11px] leading-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Admin
            </p>
            <p className="text-slate-400 truncate max-w-[110px] text-[10px]">bosxzjm</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-400 text-[11px] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
