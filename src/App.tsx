import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Transaction, BlueprintData, DashboardTab } from './types';
import { TopNav } from './components/TopNav';
import { SmartTreasurer } from './components/SmartTreasurer';
import { FraudTelemetry } from './components/FraudTelemetry';
import { GstEstimator } from './components/GstEstimator';
import { BusinessBlueprint } from './components/BusinessBlueprint';
import { GrantMatcher } from './components/GrantMatcher';
import { MobilePaymentView } from './components/MobilePaymentView';
import { FraudAlertDialog } from './components/FraudAlertDialog';
import { VyaparCopilot } from './components/VyaparCopilot';
import { playBuzzingAlarmSound, playChimeTone } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('treasurer');
  const [amount, setAmount] = useState<string>('150');
  const [itemNote, setItemNote] = useState<string>('Handloom Cotton Shawl');
  const [storeName, setStoreName] = useState<string>('Sri Lakshmi General Store');
  
  // Dynamic Transaction ID rotation state
  const [currentTxId, setCurrentTxId] = useState<string>(
    () => `TXN-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Active Critical Fraud Alert Dialog state
  const [activeFraudAlert, setActiveFraudAlert] = useState<Transaction | null>(null);

  // Initial verified transactions ledger
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'TXN-8412',
      amount: 450,
      item_note: 'Handloom Cotton Fabric',
      status: 'SUCCESS',
      live_input: 'PIN_ENTERED_MATCH',
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 'TXN-7391',
      amount: 120,
      item_note: 'Traditional Herbal Tea Pack',
      status: 'SUCCESS',
      live_input: 'PIN_ENTERED_MATCH',
      created_at: new Date(Date.now() - 55 * 60000).toISOString(),
    },
  ]);

  const [liveTelemetry, setLiveTelemetry] = useState<Partial<Transaction> & { live_input?: string; status?: string }>({
    id: currentTxId,
    amount: 150,
    live_input: '',
    status: 'STANDBY',
  });

  const [soundboxEnabled, setSoundboxEnabled] = useState<boolean>(true);
  // Default to Hindi ('hi') voice language as requested
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'hi'>('hi');
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);

  // Business Blueprint Wizard State
  const [blueprint, setBlueprint] = useState<BlueprintData>({
    product: 'Artisanal Handloom Sarees & Organic Cotton Textiles',
    audience: 'Urban conscious boutique stores & regional retail patrons',
    costs: '₹2,500/day for raw organic yarn, natural vegetable dye & loom power',
    registered: 'Yes',
  });

  // Check URL for /pay or query params
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return window.location.pathname === '/pay' || urlParams.has('tx_id');
  });

  const urlParams = new URLSearchParams(window.location.search);
  const payTxId = urlParams.get('tx_id') || currentTxId;
  const payAmount = urlParams.get('amount') || amount;
  const payStoreName = urlParams.get('store_name') || storeName;

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setIsMobileMode(window.location.pathname === '/pay' || params.has('tx_id'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Soundbox Spoken Announcement (Crisp [amount] received to avoid TTS phoneme mangling)
  const speakNotification = useCallback((spokenAmount: number | string) => {
    if (!soundboxEnabled) return;
    
    // Play physical soundbox audio chime immediately
    playChimeTone();

    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // cancel any ongoing speech

    // User requested: "soundbox in hindi sounds crap its not pronouncing hindi words properly so it just has to say [amount] received"
    const text = `${spokenAmount} received`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural Indian English or clear English voice
    const clearVoice = voices.find((v) => 
      v.lang === 'en-IN' || 
      v.lang.startsWith('en-IN') || 
      v.name.includes('India') || 
      v.name.includes('Natural') ||
      v.lang.startsWith('en')
    );
    if (clearVoice) {
      utterance.voice = clearVoice;
    }
    utterance.lang = 'en-IN';

    window.speechSynthesis.speak(utterance);
  }, [soundboxEnabled]);

  const speakRef = useRef(speakNotification);
  useEffect(() => {
    speakRef.current = speakNotification;
  }, [speakNotification]);

  // Compute most recent transaction amount for dynamic Soundbox preview
  const mostRecentVerifiedTx = transactions.find((t) => t.status === 'SUCCESS') || transactions[0];
  const recentAmount = mostRecentVerifiedTx ? String(mostRecentVerifiedTx.amount) : (amount || '150');

  // Handle incoming transaction payload
  const handleIncomingPayload = useCallback((newTx: any) => {
    if (!newTx) return;

    setLiveTelemetry(newTx);

    // When a transaction reaches a final state (SUCCESS or FRAUD)
    if (newTx.status === 'SUCCESS' || newTx.status === 'FRAUD') {
      setTransactions((prev) => {
        const exists = prev.some((t) => t.id === newTx.id);
        if (exists) {
          return prev.map((t) => (t.id === newTx.id ? { ...t, ...newTx } : t));
        }
        return [{ ...newTx, created_at: newTx.created_at || new Date().toISOString() }, ...prev];
      });

      // Automatically advance / rotate the next Bill Transaction ID so it does not stay stuck!
      const nextId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
      setCurrentTxId(nextId);

      if (newTx.status === 'SUCCESS') {
        // Immediate spoken announcement: "[amount] received"
        speakRef.current(newTx.amount || amount);
      } else if (newTx.status === 'FRAUD') {
        // Trigger piercing buzzing alarm immediately to alert the merchant
        playBuzzingAlarmSound();
        // Trigger critical multilingual fraud alert dialog immediately on top of the first page!
        setActiveFraudAlert(newTx);
      }
    }
  }, [amount]);

  // Supabase Realtime Listener Setup
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          setTransactions((prev) => {
            const combined = [...data, ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            return unique;
          });
        }
      } catch (err) {
        console.warn('Initial Supabase fetch:', err);
      }
    };

    fetchInitialData();

    // Subscribe to Postgres changes & Broadcast channel
    const channel = supabase
      .channel('public:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.new) {
            handleIncomingPayload(payload.new);
          }
        }
      )
      .on('broadcast', { event: 'telemetry' }, (payload) => {
        if (payload.payload) {
          handleIncomingPayload(payload.payload);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleIncomingPayload]);

  const generateNewTxId = () => {
    const newId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    setCurrentTxId(newId);
    setLiveTelemetry({
      id: newId,
      amount: parseFloat(amount) || 150,
      live_input: '',
      status: 'STANDBY',
    });
  };

  const handleOpenMobileView = () => {
    const nextUrl = `${window.location.pathname}?tx_id=${currentTxId}&amount=${amount}&store_name=${encodeURIComponent(storeName)}`;
    window.history.pushState({}, '', nextUrl);
    setIsMobileMode(true);
  };

  const handleReturnToDashboard = () => {
    window.history.pushState({}, '', window.location.pathname);
    setIsMobileMode(false);
  };

  // Mobile Payment Interface View
  if (isMobileMode) {
    return (
      <MobilePaymentView
        payTxId={payTxId}
        payAmount={payAmount}
        storeName={payStoreName}
        onReturnToDashboard={handleReturnToDashboard}
        onNotifyLocalTransaction={handleIncomingPayload}
      />
    );
  }

  const fraudCount = transactions.filter((t) => t.status === 'FRAUD').length;

  return (
    <div id="app-root" className="min-h-screen bg-neutral-100 text-black flex flex-col font-sans antialiased">
      {/* Top Navigation Bar Header (Replacing Sidebar) */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundboxEnabled={soundboxEnabled}
        setSoundboxEnabled={setSoundboxEnabled}
        voiceLanguage={voiceLanguage}
        setVoiceLanguage={setVoiceLanguage}
        onOpenMobileView={handleOpenMobileView}
        fraudAlertCount={fraudCount}
        realtimeConnected={realtimeConnected}
        storeName={storeName}
      />

      {/* Main Merchant Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Critical Fraud Alert Dialog Warning immediately on top of the first page */}
        <FraudAlertDialog
          fraudTx={activeFraudAlert}
          onDismiss={() => setActiveFraudAlert(null)}
          onViewTelemetry={() => {
            setActiveTab('fraud');
            setActiveFraudAlert(null);
          }}
        />

        {activeTab === 'treasurer' && (
          <SmartTreasurer
            amount={amount}
            setAmount={setAmount}
            itemNote={itemNote}
            setItemNote={setItemNote}
            currentTxId={currentTxId}
            generateNewTxId={generateNewTxId}
            transactions={transactions}
            onOpenMobileView={handleOpenMobileView}
            storeName={storeName}
            setStoreName={setStoreName}
          />
        )}

        {activeTab === 'fraud' && (
          <FraudTelemetry
            liveTelemetry={liveTelemetry}
            soundboxEnabled={soundboxEnabled}
            setSoundboxEnabled={setSoundboxEnabled}
            voiceLanguage={voiceLanguage}
            setVoiceLanguage={setVoiceLanguage}
            onTestSoundbox={() => speakNotification(recentAmount)}
            onOpenMobileView={handleOpenMobileView}
            realtimeConnected={realtimeConnected}
            recentAmount={recentAmount}
            recentTx={mostRecentVerifiedTx}
          />
        )}

        {activeTab === 'gst' && (
          <GstEstimator
            transactions={transactions}
            storeName={storeName}
          />
        )}

        {activeTab === 'blueprint' && (
          <BusinessBlueprint
            blueprint={blueprint}
            setBlueprint={setBlueprint}
            transactions={transactions}
            initialLanguage={voiceLanguage}
          />
        )}

        {activeTab === 'grants' && (
          <GrantMatcher
            blueprint={blueprint}
            transactions={transactions}
            amount={amount}
          />
        )}

        {activeTab === 'copilot' && (
          <VyaparCopilot
            storeName={storeName}
            transactions={transactions}
            blueprint={blueprint}
          />
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t-2 border-black bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-black">Suraksha Vyapar Micro-Enterprise Suite</span>
            <span>•</span>
            <span>Store: {storeName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Dynamic UPI Intent 2.0</span>
            <span>•</span>
            <span>NPCI Reverse-Pull Interception Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
