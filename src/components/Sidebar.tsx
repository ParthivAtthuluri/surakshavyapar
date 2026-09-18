import React from 'react';
import { 
  QrCode, 
  ShieldAlert, 
  FileText, 
  Award, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Sparkles,
  Store,
  Calculator
} from 'lucide-react';
import { DashboardTab } from '../types';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  soundboxEnabled: boolean;
  setSoundboxEnabled: (enabled: boolean) => void;
  onOpenMobileView: () => void;
  fraudAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  soundboxEnabled,
  setSoundboxEnabled,
  onOpenMobileView,
  fraudAlertCount,
}) => {
  const navItems = [
    { id: 'treasurer' as const, label: 'Smart Treasurer & QR', icon: QrCode },
    { id: 'fraud' as const, label: 'Live Fraud Telemetry', icon: ShieldAlert, badge: fraudAlertCount > 0 ? `${fraudAlertCount}` : undefined },
    { id: 'gst' as const, label: 'GST Estimator', icon: Calculator },
    { id: 'blueprint' as const, label: 'Business Blueprint', icon: FileText },
    { id: 'grants' as const, label: 'Grant Matcher', icon: Award },
  ];

  return (
    <aside 
      id="main-sidebar" 
      className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none"
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 text-base">
            SV
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-white tracking-tight">Suraksha Vyapar</h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Micro-Biz Workspace</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Core Modules
          </p>
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Mobile View & Soundbox */}
      <div className="p-3 space-y-2 border-t border-slate-800/80">
        {/* Quick Launch Mobile Simulator */}
        <button
          id="btn-launch-mobile-sim"
          onClick={onOpenMobileView}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-emerald-400" />
            <span>Customer Pay View</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">/pay</span>
        </button>

        {/* Vernacular Soundbox Widget */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {soundboxEnabled ? (
              <Volume2 size={16} className="text-emerald-400" />
            ) : (
              <VolumeX size={16} className="text-slate-600" />
            )}
            <div>
              <p className="text-xs font-semibold text-slate-200">Soundbox Alert</p>
              <p className="text-[10px] text-slate-500">Voice Synthesis</p>
            </div>
          </div>
          <input
            id="soundbox-toggle-checkbox"
            type="checkbox"
            aria-label="Soundbox Vernacular Voice Alert"
            checked={soundboxEnabled}
            onChange={(e) => setSoundboxEnabled(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
          />
        </div>

        <div className="px-2 pt-1 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Supabase Realtime</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active
          </span>
        </div>
      </div>
    </aside>
  );
};
