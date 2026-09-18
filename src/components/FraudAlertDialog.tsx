import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  Globe,
  Volume2
} from 'lucide-react';
import { Transaction } from '../types';
import { playBuzzingAlarmSound } from '../utils/audio';

interface FraudAlertDialogProps {
  fraudTx: Transaction | null;
  onDismiss: () => void;
  onViewTelemetry: () => void;
}

export const FraudAlertDialog: React.FC<FraudAlertDialogProps> = ({
  fraudTx,
  onDismiss,
  onViewTelemetry,
}) => {
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'hi' | 'te'>('all');

  // Trigger loud buzzing alarm sound whenever this alert dialog is opened
  useEffect(() => {
    if (fraudTx) {
      playBuzzingAlarmSound();
    }
  }, [fraudTx?.id]);

  if (!fraudTx) return null;

  return (
    <div 
      id="critical-fraud-alert-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fraud-alert-title"
      className="mb-6 bg-black text-white border-4 border-red-600 rounded-2xl p-5 sm:p-6 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-300"
    >
      {/* Top Banner Stripe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-red-600 text-white text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-wider animate-pulse">
                SURAKSHA VYAPAR: SCAM INTERCEPTED
              </span>
              <span className="bg-neutral-800 text-neutral-300 font-mono text-xs px-2.5 py-0.5 rounded border border-neutral-700">
                Ref: {fraudTx.id}
              </span>
              <span className="text-red-400 font-bold text-sm">
                ₹{Number(fraudTx.amount || 0).toLocaleString('en-IN')} Blocked
              </span>
            </div>
            <h2 id="fraud-alert-title" className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Unauthorized Reverse-Collect Scam Intercepted!
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {/* Replay Buzzer Alarm Button */}
          <button
            onClick={() => playBuzzingAlarmSound()}
            title="Replay Buzzing Alarm Alert"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black border border-red-400 shadow-md transition active:scale-95"
          >
            <Volume2 size={14} className="animate-bounce" />
            <span>Alarm Buzzer</span>
          </button>

          {/* Language filter pills */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
            <Globe size={14} className="text-neutral-400 ml-1 mr-1.5" />
            <button
              onClick={() => setSelectedLang('all')}
              className={`px-2 py-1 rounded font-semibold transition ${
                selectedLang === 'all' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedLang('en')}
              className={`px-2 py-1 rounded font-semibold transition ${
                selectedLang === 'en' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setSelectedLang('hi')}
              className={`px-2 py-1 rounded font-semibold transition ${
                selectedLang === 'hi' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setSelectedLang('te')}
              className={`px-2 py-1 rounded font-semibold transition ${
                selectedLang === 'te' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
          </div>

          <button
            onClick={onDismiss}
            aria-label="Close Alert"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Multilingual Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        {/* English */}
        {(selectedLang === 'all' || selectedLang === 'en') && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">English Alert</span>
                <span className="text-[10px] text-neutral-500 font-mono">STATUS: BLOCKED</span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                <strong className="text-white">Collect Request Detected:</strong> The customer device initiated an unauthorized debit pull instead of sending payment. Suraksha Vyapar blocked settlement instantly and sounded the alarm to protect your bank balance.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-900 text-[11px] text-neutral-400 font-mono">
              Action: No money was debited from your account.
            </div>
          </div>
        )}

        {/* Hindi */}
        {(selectedLang === 'all' || selectedLang === 'hi') && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">हिन्दी चेतावनी (Hindi)</span>
                <span className="text-[10px] text-neutral-500 font-mono">रोक दिया गया</span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                <strong className="text-white">रिवर्स कलेक्ट घोटाला रोका गया:</strong> ग्राहक के फोन ने पैसे भेजने के बजाय आपके खाते से पैसे निकालने (Debit Request) का प्रयास किया। सुरक्षा व्यापार (Suraksha Vyapar) ने इसे तुरंत रोककर अलार्म बजा दिया है।
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-900 text-[11px] text-neutral-400 font-mono">
              कार्रवाई: आपके खाते से कोई पैसा नहीं कटा।
            </div>
          </div>
        )}

        {/* Telugu */}
        {(selectedLang === 'all' || selectedLang === 'te') && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">తెలుగు హెచ్చరిక (Telugu)</span>
                <span className="text-[10px] text-neutral-500 font-mono">నిలిపివేయబడింది</span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                <strong className="text-white">రివర్స్ కలెక్ట్ మోసం నిరోధించబడింది:</strong> కస్టమర్ పరికరం చెల్లింపు పంపడానికి బదులుగా మీ ఖాతా నుండి డబ్బును డెబిట్ చేయడానికి ప్రయత్నించింది. సురక్ష వ్యాపార్ (Suraksha Vyapar) తక్షణమే ఈ లావాదేవీని నిలిపివేసి అలారం మోగించింది.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-900 text-[11px] text-neutral-400 font-mono">
              చర్య: మీ ఖాతా నుండి ఎటువంటి సొమ్ము కట్ కాలేదు.
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <ShieldAlert size={16} className="text-red-400" />
          <span>Suraksha Vyapar Telemetry Protocol NPCI-UPI active. Buzzing alarm deployed.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onViewTelemetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition"
          >
            Inspect Keystroke Stream <ArrowRight size={14} />
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-semibold text-xs transition"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
