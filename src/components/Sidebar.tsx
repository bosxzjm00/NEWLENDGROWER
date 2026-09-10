import React from 'react';
import { useApp } from '../context/AppContext';
import { ViewType, SettingsSection } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  Users,
  Coins,
  UserCheck,
  TrendingDown,
  BookOpen,
  Archive,
  History,
  Settings,
  Sun,
  Moon,
  LogOut,
  CalendarCheck,
  Database,
  AlertTriangle,
  ShieldCheck,
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
    currentUsername,
    isMasterAdmin,
    activeSettingsSection,
    setActiveSettingsSection,
    setSelectedLedgerBorrowerId,
  } = useApp();

  const handleNavClick = (view: ViewType) => {
    if (view === 'ledger') {
      setSelectedLedgerBorrowerId(null);
    }
    setCurrentView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSettingsSectionClick = (section: SettingsSection) => {
    setActiveSettingsSection(section);
    setCurrentView('settings');
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
      id: 'activity-log' as ViewType,
      label: 'Activity Log',
      icon: History,
    },
    {
      id: 'ledger' as ViewType,
      label: 'Ledger',
      icon: BookOpen,
    },
    ...(isMasterAdmin
      ? [
          {
            id: 'accounts' as ViewType,
            label: 'Accounts',
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      id: 'settings' as ViewType,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      id="app-aside"
      className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-screen z-30 transition-colors"
    >
      <div className="flex-1 overflow-y-auto">
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
                <div key={item.id} className="space-y-1">
                  <button
                    id={`nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'active bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>

                  {item.id === 'settings' && currentView === 'settings' && (
                    <div className="pl-7 pr-2 py-1 space-y-1">
                      <button
                        onClick={() => handleSettingsSectionClick('backup')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors text-left cursor-pointer ${
                          activeSettingsSection === 'backup'
                            ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <Database className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>Backup & Restore</span>
                      </button>
                      <button
                        onClick={() => handleSettingsSectionClick('supabase')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors text-left cursor-pointer ${
                          activeSettingsSection === 'supabase'
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>Supabase Cloud Sync</span>
                      </button>
                      <button
                        onClick={() => handleSettingsSectionClick('dcs')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors text-left cursor-pointer ${
                          activeSettingsSection === 'dcs'
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <CalendarCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Collection Sheet</span>
                      </button>
                      <button
                        onClick={() => handleSettingsSectionClick('danger')}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors text-left cursor-pointer ${
                          activeSettingsSection === 'danger'
                            ? 'bg-rose-500/20 text-rose-300 font-semibold'
                            : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Danger Zone</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
        <PWAInstallButton variant="sidebar" />

        <button
          onClick={toggleThemeMode}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors text-left text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
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

        {/* User profile & sign out */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            <p className="text-slate-200 font-semibold text-[11px] leading-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isMasterAdmin ? 'Master Admin' : 'User'}
            </p>
            <p className="text-slate-400 truncate max-w-[110px] text-[10px]">{currentUsername || 'bosxzjm'}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-400 text-[11px] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
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
