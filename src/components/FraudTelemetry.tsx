import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Activity, 
  Radio, 
  Lock,
  Zap,
  Smartphone,
  Info,
  Globe,
  RefreshCw,
  Play,
  BellRing,
  Bot,
  Sparkles,
  Search,
  Check,
  FileWarning
} from 'lucide-react';
import { Transaction } from '../types';
import { playBuzzingAlarmSound } from '../utils/audio';
import { requestAiFraudAnalysis, scanScamMessage, AiFraudAnalysis, AiScamScanResult } from '../utils/aiService';

interface FraudTelemetryProps {
  liveTelemetry: Partial<Transaction> & { live_input?: string; status?: string };
  soundboxEnabled: boolean;
  setSoundboxEnabled: (enabled: boolean) => void;
  voiceLanguage: 'en' | 'hi';
  setVoiceLanguage: (lang: 'en' | 'hi') => void;
  onTestSoundbox: (lang?: 'en' | 'hi') => void;
  onOpenMobileView: () => void;
  realtimeConnected: boolean;
  recentAmount: string;
  recentTx?: Transaction | null;
}

export const FraudTelemetry: React.FC<FraudTelemetryProps> = ({
  liveTelemetry,
  soundboxEnabled,
  setSoundboxEnabled,
  voiceLanguage,
  setVoiceLanguage,
  onTestSoundbox,
  onOpenMobileView,
  realtimeConnected,
  recentAmount,
  recentTx,
}) => {
  const isFraud = liveTelemetry.status === 'FRAUD';
  const isSuccess = liveTelemetry.status === 'SUCCESS';
  const isPending = liveTelemetry.status === 'PENDING';

  // AI Model Analysis State for live telemetry
  const [aiAnalysis, setAiAnalysis] = useState<AiFraudAnalysis | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState<boolean>(false);

  // AI Scam Inspector State
  const [sampleScamText, setSampleScamText] = useState<string>(
    'Dear Merchant, ₹500 credited to your account via PhonePe. Click here http://bit.ly/upireceive to accept or enter your UPI PIN to claim reward.'
  );
  const [scanResult, setScanResult] = useState<AiScamScanResult | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  // Trigger AI Threat Analysis whenever telemetry state shifts to FRAUD or SUCCESS
  useEffect(() => {
    let isMounted = true;
    async function runTelemetryAi() {
      if (!liveTelemetry.id && !liveTelemetry.status) return;
      setAnalyzingAi(true);
      try {
        const result = await requestAiFraudAnalysis({
          amount: liveTelemetry.amount || recentAmount,
          liveInput: liveTelemetry.live_input,
          status: liveTelemetry.status,
          txId: liveTelemetry.id,
        });
        if (isMounted) setAiAnalysis(result);
      } catch (err) {
        console.warn('AI analysis error:', err);
      } finally {
        if (isMounted) setAnalyzingAi(false);
      }
    }

    runTelemetryAi();
    return () => {
      isMounted = false;
    };
  }, [liveTelemetry.status, liveTelemetry.live_input, liveTelemetry.id, recentAmount]);

  const handleScanScamText = async (textToScan?: string) => {
    const text = textToScan || sampleScamText;
    if (!text.trim() || scanning) return;
    setScanning(true);
    try {
      const res = await scanScamMessage(text, 'Customer SMS / WhatsApp');
      setScanResult(res);
    } catch (err) {
      console.warn('Scam scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const sampleScamTemplates = [
    {
      title: 'Fake Reverse-Pull SMS',
      text: 'Dear Merchant, ₹1,200 pending to be credited. Please enter your 6-digit UPI PIN on this link to receive funds: upi-claim-fast.net',
    },
    {
      title: 'Paytm KYC Threat',
      text: 'ALERT: Your merchant soundbox & Paytm wallet will be blocked within 24 hours due to pending biometric KYC. Call +91-9876543210 immediately.',
    },
    {
      title: 'Legitimate Bank Alert',
      text: 'HDFC Bank: A/C *4821 credited with INR 450.00 on 17-Sep-26 by UPI/ref 426189. Bal: INR 12,450.00. Call 18002026161 if not done by you.',
    },
  ];

  return (
    <div id="fraud-telemetry-section" className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                Telemetry & Audio
              </span>
              <span className="text-xs font-mono text-neutral-600">Dual-Device WebSocket</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black mt-1 flex items-center gap-2">
              <ShieldAlert size={24} className="text-black" />
              Live Fraud Telemetry & Vernacular Soundbox
            </h2>
            <p className="text-sm text-neutral-600 mt-0.5">
              Real-time keystroke monitoring, reverse-pull collect scam interception & automated spoken alerts.
            </p>
          </div>

          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs font-mono font-bold self-start sm:self-center transition ${
            realtimeConnected 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-400' 
              : 'bg-amber-50 text-amber-800 border-amber-400'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              {realtimeConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${realtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <Activity size={14} className={realtimeConnected ? 'text-emerald-600' : 'text-amber-600'} />
            <span>{realtimeConnected ? 'Supabase Realtime Stream: ACTIVE' : 'Connecting to Stream...'}</span>
          </div>
        </div>
      </div>

      {/* High-Contrast Alert Banner (Black & White with Red Accents for Fraud) */}
      <div
        id="fraud-status-banner"
        className={`p-6 rounded-2xl border-4 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
          isFraud
            ? 'bg-black border-red-600 text-white'
            : isSuccess
            ? 'bg-black border-black text-white'
            : 'bg-white border-2 border-black text-black'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${
              isFraud 
                ? 'bg-red-600 text-white animate-pulse' 
                : isSuccess 
                ? 'bg-emerald-600 text-white' 
                : 'bg-neutral-100 text-black border border-neutral-300'
            }`}>
              {isFraud ? (
                <AlertTriangle size={32} />
              ) : isSuccess ? (
                <CheckCircle2 size={32} className="text-white" />
              ) : (
                <Radio size={32} className="animate-pulse text-black" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-black text-xl sm:text-2xl tracking-tight">
                  {isFraud
                    ? 'CRITICAL FRAUD PREVENTED: REVERSE-COLLECT SCAM'
                    : isSuccess
                    ? 'TELEMETRY VERIFIED — SETTLEMENT CONFIRMED'
                    : 'AWAITING LIVE CUSTOMER KEYSTROKE TELEMETRY'}
                </h3>
              </div>

              <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed font-medium ${isFraud || isSuccess ? 'text-neutral-300' : 'text-neutral-700'}`}>
                {isFraud
                  ? 'CRITICAL ALERT: Malicious reverse-pull collect scam intercepted! Payer device sent an unauthorized debit pull instead of legitimate credit. Transaction was blocked instantly before any money left the merchant account.'
                  : isSuccess
                  ? `Transaction ${liveTelemetry.id || ''} confirmed! Matching PIN keystrokes verified against legitimate NPCI gateway intent.`
                  : 'Listening to Supabase channel `public:transactions`. As customer types on their mobile PIN pad, live keystrokes mirror here in real time.'}
              </p>

              {/* Multilingual quick alert tags if fraud */}
              {isFraud && (
                <div className="mt-3 pt-3 border-t border-neutral-800 space-y-1 text-xs">
                  <p className="text-neutral-200">
                    <strong className="text-red-400">हिन्दी:</strong> अनधिकृत रिवर्स कलेक्ट घोटाला रोका गया। आपके खाते से कोई पैसा नहीं कटा।
                  </p>
                  <p className="text-neutral-200">
                    <strong className="text-red-400">తెలుగు:</strong> అనధికార రివర్స్ కలెక్ట్ మోసం నిరోధించబడింది. మీ ఖాతా నుండి సొమ్ము కట్ కాలేదు.
                  </p>
                </div>
              )}

              {liveTelemetry.id && (
                <div className="flex items-center gap-3 mt-3 text-xs font-mono flex-wrap">
                  <span className={`px-2.5 py-1 rounded border font-bold ${
                    isFraud || isSuccess ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-100 border-neutral-300 text-black'
                  }`}>
                    Ref: {liveTelemetry.id}
                  </span>
                  {liveTelemetry.amount && (
                    <span className={`px-2.5 py-1 rounded border font-bold ${
                      isFraud ? 'bg-red-950 border-red-800 text-red-300' : isSuccess ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-100 border-neutral-300 text-black'
                    }`}>
                      Amount: ₹{liveTelemetry.amount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end justify-center self-start md:self-center">
            <span
              className={`px-4 py-2 rounded-full text-xs font-black font-mono tracking-wider uppercase ${
                isFraud
                  ? 'bg-red-600 text-white'
                  : isSuccess
                  ? 'bg-white text-black'
                  : 'bg-neutral-200 text-black border border-black'
              }`}
            >
              {liveTelemetry.status || 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Model Threat Reasoning Engine Card */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-black">Gemini AI Threat Reasoning Model</h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                  Model: gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-neutral-600">
                Autonomous heuristic & semantic inference analyzing live transaction intent vectors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analyzingAi && (
              <span className="text-xs font-bold text-neutral-600 flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-lg border border-neutral-300">
                <RefreshCw size={12} className="animate-spin text-black" />
                AI Model Analyzing...
              </span>
            )}
            {aiAnalysis && (
              <span
                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  aiAnalysis.riskLevel === 'CRITICAL'
                    ? 'bg-red-600 text-white animate-pulse'
                    : aiAnalysis.riskLevel === 'ELEVATED'
                    ? 'bg-amber-500 text-black'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                Risk: {aiAnalysis.riskLevel} ({aiAnalysis.riskScore}/100)
              </span>
            )}
          </div>
        </div>

        {aiAnalysis ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-3">
              <div className="bg-neutral-50 border border-neutral-300 rounded-xl p-4">
                <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">
                  AI Model Threat Classification
                </span>
                <p className="text-base font-black text-black font-mono">
                  {aiAnalysis.threatClassification}
                </p>
                <p className="text-xs text-neutral-800 mt-2 font-medium leading-relaxed">
                  <strong>English Analysis:</strong> {aiAnalysis.reasoningEn}
                </p>
                <p className="text-xs text-neutral-800 mt-1.5 font-medium leading-relaxed">
                  <strong>हिन्दी विश्लेषण:</strong> {aiAnalysis.reasoningHi}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                    Merchant Directive (EN)
                  </span>
                  <p className="text-xs font-bold text-black">{aiAnalysis.merchantActionEn}</p>
                </div>
                <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                    व्यापारी निर्देश (HI)
                  </span>
                  <p className="text-xs font-bold text-black">{aiAnalysis.merchantActionHi}</p>
                </div>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="md:col-span-4 bg-neutral-900 text-white rounded-xl p-4 flex flex-col justify-between border-2 border-black">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
                  AI Risk Probability
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono">{aiAnalysis.riskScore}%</span>
                  <span className="text-xs text-neutral-400 font-bold">Threat Index</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3 mt-3 overflow-hidden border border-neutral-700">
                  <div
                    className={`h-full transition-all duration-500 ${
                      aiAnalysis.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, aiAnalysis.riskScore))}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 text-xs">
                <span className="text-neutral-400 block text-[11px]">Recommended Voice Dispatch:</span>
                <span className="font-bold text-white mt-0.5 block">"{aiAnalysis.soundboxAlertText}"</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-neutral-500 font-medium">
            Awaiting active transaction telemetry to generate AI threat model breakdown...
          </div>
        )}
      </div>

      {/* Keystroke Telemetry & Soundbox Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Keystroke Stream Terminal */}
        <div className="lg:col-span-6 bg-white border-2 border-black rounded-2xl p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-black" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Live Device Keystroke Stream
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-black bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300">
                WebSocket Stream
              </span>
            </div>
            <p className="text-xs text-neutral-600 mb-4 font-medium">
              Real-time mirror of customer PIN keystrokes transmitted from the payer mobile simulator:
            </p>

            {/* Terminal Box (Black background with sharp white text) */}
            <div className="bg-black border-2 border-black rounded-xl p-5 font-mono text-white min-h-[140px] flex flex-col justify-center items-center text-center relative overflow-hidden shadow-inner">
              <div className="absolute top-2.5 left-3 flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
              </div>

              {liveTelemetry.live_input ? (
                <div className="space-y-1.5 animate-in fade-in">
                  <span className="text-[11px] text-neutral-400 uppercase tracking-widest block font-bold">
                    Streamed Payer Buffer
                  </span>
                  <p className="text-xl sm:text-2xl font-black tracking-wider text-white">
                    {liveTelemetry.live_input}
                  </p>
                  <span className="text-xs text-neutral-400 font-sans">
                    {isPending ? '• Payer is actively typing on phone pad...' : '• Telemetry transmission settled'}
                  </span>
                </div>
              ) : (
                <div className="text-neutral-400 text-xs flex flex-col items-center gap-2">
                  <Activity size={26} className="text-neutral-600 animate-pulse" />
                  <span className="font-bold text-neutral-300">Awaiting customer device interaction...</span>
                  <span className="text-[11px] text-neutral-500">Click below to test live keypad keystrokes</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenMobileView}
              className="w-full bg-white hover:bg-neutral-100 text-black text-xs font-bold py-3 rounded-xl border-2 border-black flex items-center justify-center gap-2 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Smartphone size={16} /> Open Customer Phone Simulator to Stream PIN
            </button>
          </div>
        </div>

        {/* Vernacular Soundbox Simulation Widget */}
        <div className="lg:col-span-6 bg-white border-2 border-black rounded-2xl p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Volume2 size={20} className="text-black" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Vernacular Soundbox Audio Engine
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 text-black border border-neutral-300">
                Speech Synthesis
              </span>
            </div>

            <p className="text-xs text-neutral-600 mb-4 font-medium">
              Simulates the countertop IoT voice speaker. Previews update dynamically to the <strong>most recent transaction amount</strong> (₹{recentAmount}).
            </p>

            {/* Soundbox Controls Card */}
            <div className="bg-neutral-50 border-2 border-neutral-300 rounded-xl p-4 space-y-4">
              {/* Toggle Enable */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${soundboxEnabled ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                    {soundboxEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">Voice Alert Engine</p>
                    <p className="text-[11px] text-neutral-500">Auto-announces completed transactions in Hindi/English</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundboxEnabled}
                    onChange={(e) => setSoundboxEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold text-black mb-2">Primary Voice Language:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceLanguage('hi')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      voiceLanguage === 'hi'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black hover:text-black'
                    }`}
                  >
                    हिन्दी (Hindi - Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceLanguage('en')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      voiceLanguage === 'en'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black hover:text-black'
                    }`}
                  >
                    English (UK/IN)
                  </button>
                </div>
              </div>

              {/* Soundbox Live Previews for BOTH languages based on most recent transaction */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-800">
                    Live Soundbox Previews (Latest Amount: ₹{recentAmount}):
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-Updated</span>
                </div>

                {/* Spoken Audio Announcement Preview */}
                <div className="bg-white p-3 rounded-lg border border-neutral-300 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Spoken Audio Announcement
                    </span>
                    <p className="text-sm font-black text-black mt-0.5">
                      "{recentAmount} received"
                    </p>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Crisp, clear pronunciation without garbled phonemes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTestSoundbox()}
                    title="Play soundbox announcement"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shrink-0 transition shadow-xs"
                  >
                    <Play size={12} /> Play
                  </button>
                </div>

                {/* Fraud Alarm Buzzing Siren Test Button */}
                <div className="bg-red-50 p-3 rounded-lg border-2 border-red-300 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block flex items-center gap-1">
                      <BellRing size={12} className="animate-pulse text-red-600" />
                      सेंसर अलार्म बजर (Scam Telemetry Alarm Buzzer)
                    </span>
                    <p className="text-xs font-bold text-red-950 mt-0.5">
                      Rapid pulsating siren that alerts the merchant on scam attempts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => playBuzzingAlarmSound()}
                    title="Test Buzzing Alarm Siren"
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-md text-xs font-black flex items-center gap-1.5 shrink-0 transition shadow-xs"
                  >
                    <Volume2 size={13} /> Test Alarm
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onTestSoundbox(voiceLanguage)}
              className="bg-black hover:bg-neutral-800 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Zap size={16} /> Test Voice Alert (₹{recentAmount})
            </button>
            <button
              onClick={() => playBuzzingAlarmSound()}
              className="bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-red-700 shadow-[2px_2px_0px_0px_rgba(185,28,28,1)]"
            >
              <BellRing size={16} /> Test Alarm Buzzer
            </button>
          </div>
        </div>
      </div>

      {/* AI Model Scam Message & QR Payload Inspector */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <Search size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-black">AI Scam Message & QR Text Inspector</h3>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-300">
                  Phishing & Reverse-Collect Detector
                </span>
              </div>
              <p className="text-xs text-neutral-600">
                Paste suspicious customer messages, fake bank SMS texts, or QR link strings to get an instant AI Model risk verdict.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-neutral-500 font-bold shrink-0">Try Sample:</span>
          {sampleScamTemplates.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSampleScamText(t.text);
                handleScanScamText(t.text);
              }}
              className="bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition"
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Input & Action */}
        <div className="space-y-2">
          <textarea
            rows={3}
            value={sampleScamText}
            onChange={(e) => setSampleScamText(e.target.value)}
            placeholder="Paste SMS text, WhatsApp message, or UPI link..."
            className="w-full bg-neutral-50 border-2 border-neutral-300 focus:border-black rounded-xl p-3 text-xs sm:text-sm font-mono text-black focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              type="button"
              disabled={scanning || !sampleScamText.trim()}
              onClick={() => handleScanScamText()}
              className="bg-black hover:bg-neutral-800 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>AI Model Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Run AI Model Inspection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div
            className={`p-4 rounded-xl border-2 transition-all ${
              scanResult.isScam
                ? 'bg-red-50 border-red-500 text-red-950'
                : 'bg-emerald-50 border-emerald-500 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2 font-black text-sm">
                {scanResult.isScam ? (
                  <>
                    <FileWarning size={18} className="text-red-600" />
                    <span className="text-red-700 uppercase tracking-wider">
                      SCAM DETECTED: {scanResult.scamType}
                    </span>
                  </>
                ) : (
                  <>
                    <Check size={18} className="text-emerald-600" />
                    <span className="text-emerald-800 uppercase tracking-wider">
                      LEGITIMATE NOTIFICATION: {scanResult.scamType}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-white border border-neutral-300">
                Confidence: {scanResult.confidence}%
              </span>
            </div>

            <p className="text-xs font-medium leading-relaxed mb-2">
              <strong>English:</strong> {scanResult.explanationEn}
            </p>
            <p className="text-xs font-medium leading-relaxed mb-3">
              <strong>हिन्दी:</strong> {scanResult.explanationHi}
            </p>

            {scanResult.redFlags && scanResult.redFlags.length > 0 && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-red-200 text-xs mb-2">
                <span className="font-bold text-red-700 block mb-1">Identified Red Flags:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-neutral-800">
                  {scanResult.redFlags.map((flag, fIdx) => (
                    <li key={fIdx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs font-bold bg-white p-2.5 rounded-lg border border-neutral-300 text-black">
              Action: {scanResult.recommendedAction}
            </div>
          </div>
        )}
      </div>

      {/* Security Educational Architecture Notice */}
      <div className="bg-white border-2 border-black rounded-xl p-4 flex items-start gap-3 text-xs text-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Info size={20} className="text-black shrink-0 mt-0.5" />
        <div>
          <span className="font-black text-black text-sm block mb-1">
            How Suraksha Vyapar Prevents Reverse-Pull Collect Scams:
          </span>
          <p className="leading-relaxed">
            In common informal merchant scams, fraudsters claim to send money over UPI but secretly dispatch an authorization "Collect Request". When the busy merchant inputs their PIN, funds are debited from their account instead of deposited. Suraksha Vyapar continuously monitors the transaction intent header and device keystroke buffer. When an unauthorized pull request is detected, the transaction status is immediately flagged as <span className="font-black text-red-600 underline">FRAUD</span>, an unmistakable buzzing alarm siren sounds immediately, and settlement is blocked instantly before money can leave.
          </p>
        </div>
      </div>
    </div>
  );
};
