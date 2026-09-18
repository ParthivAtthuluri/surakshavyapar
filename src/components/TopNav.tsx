import React from 'react';
import { 
  QrCode, 
  ShieldAlert, 
  FileText, 
  Award, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Store,
  Zap,
  Activity,
  Calculator,
  Bot,
  Sparkles
} from 'lucide-react';
import { DashboardTab } from '../types';

interface TopNavProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  soundboxEnabled: boolean;
  setSoundboxEnabled: (enabled: boolean) => void;
  voiceLanguage: 'en' | 'hi';
  setVoiceLanguage: (lang: 'en' | 'hi') => void;
  onOpenMobileView: () => void;
  fraudAlertCount: number;
  realtimeConnected: boolean;
  storeName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  soundboxEnabled,
  setSoundboxEnabled,
  voiceLanguage,
  setVoiceLanguage,
  onOpenMobileView,
  fraudAlertCount,
  realtimeConnected,
  storeName,
}) => {
  const navTabs = [
    { 
      id: 'treasurer' as const, 
      label: 'Smart Treasurer & QR', 
      icon: QrCode,
      description: 'Dynamic UPI & Live Ledger'
    },
    { 
      id: 'fraud' as const, 
      label: 'Live Fraud Telemetry', 
      icon: ShieldAlert,
      description: 'Keystrokes & Soundbox',
      badge: fraudAlertCount > 0 ? `${fraudAlertCount}` : undefined,
      badgeColor: 'bg-red-600 text-white'
    },
    { 
      id: 'gst' as const, 
      label: 'GST Estimator', 
      icon: Calculator,
      description: 'Kirana Slabs & ITC'
    },
    { 
      id: 'blueprint' as const, 
      label: 'Business Blueprint', 
      icon: FileText,
      description: 'Store Growth & Improvement Ideas'
    },
    { 
      id: 'grants' as const, 
      label: 'Grant Matcher & DPR', 
      icon: Award,
      description: 'MSME & PM SVANidhi'
    },
    { 
      id: 'copilot' as const, 
      label: 'AI Vyapar Co-Pilot', 
      icon: Bot,
      description: 'Gemini 3.8 Flash Assistant',
      badge: 'AI MODEL',
      badgeColor: 'bg-emerald-600 text-white'
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-black shadow-sm">
      {/* Top utility row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white font-black text-lg flex items-center justify-center rounded-xl border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            SV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-black">Suraksha Vyapar</h1>
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold transition ${
                realtimeConnected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                <span className="relative flex h-2 w-2">
                  {realtimeConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${realtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <Activity size={12} className={realtimeConnected ? 'text-emerald-600' : 'text-amber-600'} />
                {realtimeConnected ? 'Supabase Sync Active' : 'Connecting Stream...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
              <Store size={13} className="text-black" />
              <span className="font-semibold text-black max-w-[200px] sm:max-w-xs truncate">{storeName}</span>
            </div>
          </div>
        </div>

        {/* Right utility buttons: Soundbox & Customer Simulator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Soundbox Controls */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-300 text-xs">
            <button
              onClick={() => setSoundboxEnabled(!soundboxEnabled)}
              title={soundboxEnabled ? 'Soundbox enabled' : 'Soundbox muted'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition ${
                soundboxEnabled 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                  : 'bg-white text-neutral-500 border border-neutral-300 hover:text-black'
              }`}
            >
              {soundboxEnabled ? <Volume2 size={14} className="text-white animate-pulse" /> : <VolumeX size={14} />}
              <span className="hidden md:inline">Soundbox</span>
            </button>

            {soundboxEnabled && (
              <div className="flex items-center ml-1 pl-1 border-l border-neutral-300 text-[11px] font-bold">
                <button
                  onClick={() => setVoiceLanguage('hi')}
                  className={`px-1.5 py-0.5 rounded transition ${
                    voiceLanguage === 'hi' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setVoiceLanguage('en')}
                  className={`px-1.5 py-0.5 rounded transition ${
                    voiceLanguage === 'en' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  EN
                </button>
              </div>
            )}
          </div>

          {/* Customer Phone Simulation Launcher */}
          <button
            id="btn-customer-phone-view"
            onClick={onOpenMobileView}
            className="flex items-center gap-2 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Smartphone size={15} />
            <span>Customer Phone Simulator</span>
          </button>
        </div>
      </div>

      {/* Main Top Navigation Tabs Bar */}
      <div className="bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`top-nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                    isActive
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-black hover:text-black'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-neutral-500 group-hover:text-black'} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`ml-0.5 px-2 py-0.5 text-[10px] font-black rounded-full ${tab.badgeColor || 'bg-red-600 text-white'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
