import React, { useState } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  Wifi,
  Battery,
  Store
} from 'lucide-react';
import { supabase } from '../supabase';
import { playBuzzingAlarmSound, playChimeTone } from '../utils/audio';

interface MobilePaymentViewProps {
  payTxId: string;
  payAmount: string;
  storeName?: string;
  onReturnToDashboard: () => void;
  onNotifyLocalTransaction?: (tx: any) => void;
}

export const MobilePaymentView: React.FC<MobilePaymentViewProps> = ({
  payTxId,
  payAmount,
  storeName: propStoreName,
  onReturnToDashboard,
  onNotifyLocalTransaction,
}) => {
  // Read store name from URL query params or prop
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const activeStoreName = urlParams?.get('store_name') || propStoreName || 'Sri Lakshmi General Store';

  const [pinInput, setPinInput] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FRAUD'>('IDLE');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handlePinPress = async (num: string) => {
    if (status === 'SUCCESS' || status === 'FRAUD') return;
    if (pinInput.length >= 6) return;

    const updated = pinInput + num;
    setPinInput(updated);

    const payload = {
      id: payTxId,
      amount: parseFloat(payAmount) || 150,
      live_input: `PIN entered: ${'*'.repeat(updated.length)} (${updated.length}/6 digits)`,
      status: 'PENDING',
      item_note: `${activeStoreName} UPI Settlement`
    };

    // Broadcast local event immediately
    if (onNotifyLocalTransaction) {
      onNotifyLocalTransaction(payload);
    }

    try {
      // Stream update to Supabase
      await supabase.from('transactions').upsert(payload);
      // Also broadcast on realtime channel for zero-latency cross-client delivery
      const channel = supabase.channel('public:transactions');
      channel.send({
        type: 'broadcast',
        event: 'telemetry',
        payload,
      });
    } catch (err) {
      console.warn('Supabase telemetry sync note:', err);
    }
  };

  const handleClearPin = async () => {
    setPinInput('');
    const payload = {
      id: payTxId,
      amount: parseFloat(payAmount) || 150,
      live_input: 'PIN buffer cleared',
      status: 'PENDING',
      item_note: `${activeStoreName} UPI Settlement`
    };
    if (onNotifyLocalTransaction) onNotifyLocalTransaction(payload);
    try {
      await supabase.from('transactions').upsert(payload);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDeleteChar = async () => {
    if (pinInput.length === 0) return;
    const updated = pinInput.slice(0, -1);
    setPinInput(updated);
    const payload = {
      id: payTxId,
      amount: parseFloat(payAmount) || 150,
      live_input: updated.length > 0 ? `PIN entered: ${'*'.repeat(updated.length)}` : 'PIN input cleared',
      status: 'PENDING',
      item_note: `${activeStoreName} UPI Settlement`
    };
    if (onNotifyLocalTransaction) onNotifyLocalTransaction(payload);
    try {
      await supabase.from('transactions').upsert(payload);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleCompletePay = async (statusType: 'SUCCESS' | 'FRAUD') => {
    setIsUpdating(true);
    const payload = {
      id: payTxId,
      amount: parseFloat(payAmount) || 150,
      live_input: statusType === 'FRAUD' ? 'REVERSE_PULL_DETECTED: Unauthorized debit requested' : 'PIN_ENTERED_MATCH: NPCI Authorization Verified',
      status: statusType,
      item_note: `${activeStoreName} UPI Settlement`,
      created_at: new Date().toISOString()
    };

    setStatus(statusType);
    if (statusType === 'FRAUD') {
      playBuzzingAlarmSound();
    } else {
      playChimeTone();
    }

    setFeedbackMessage(
      statusType === 'SUCCESS' 
        ? `Payment authorized securely to ${activeStoreName}! Soundbox spoke immediately in Hindi.` 
        : 'Reverse collect scam triggered! Suraksha Vyapar blocked this attack, sounded the buzzing alarm, and warned the merchant.'
    );

    if (onNotifyLocalTransaction) {
      onNotifyLocalTransaction(payload);
    }

    try {
      await supabase.from('transactions').upsert(payload);
      const channel = supabase.channel('public:transactions');
      channel.send({
        type: 'broadcast',
        event: 'telemetry',
        payload,
      });
    } catch (err) {
      console.warn('Supabase payment completion note:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetSession = () => {
    setPinInput('');
    setStatus('IDLE');
    setFeedbackMessage('');
  };

  return (
    <div id="mobile-payment-container" className="min-h-screen bg-neutral-100 text-black flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Top Controls Bar */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4 text-xs">
        <button
          onClick={onReturnToDashboard}
          className="inline-flex items-center gap-1.5 text-black hover:bg-neutral-200 px-3 py-1.5 rounded-lg bg-white border-2 border-black font-bold transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <span className="text-black font-mono font-bold text-[11px] bg-white px-2.5 py-1 rounded-full border border-black">
          Customer Phone View
        </span>
      </div>

      {/* Realistic Mobile Device Frame (High Contrast Black & White) */}
      <div className="w-full max-w-sm bg-white border-4 border-black rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-between">
        {/* Device Status Bar */}
        <div className="flex items-center justify-between text-[11px] text-neutral-600 pb-3 border-b border-neutral-200 mb-4 font-bold">
          <span className="font-mono text-black">9:41 AM</span>
          <div className="w-20 h-3.5 bg-black rounded-full mx-auto"></div>
          <div className="flex items-center gap-1.5 text-black">
            <Wifi size={12} />
            <Battery size={13} />
          </div>
        </div>

        {/* UPI Gateway Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
              UPI
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-black">BharatPay UPI</h3>
              <p className="text-[10px] text-neutral-500 font-medium">NPCI Payment Network</p>
            </div>
          </div>
          <span className="text-[10px] bg-neutral-100 text-black font-mono font-bold px-2 py-0.5 rounded-full border border-neutral-300">
            Encrypted
          </span>
        </div>

        {/* Merchant & Amount Details with Customizable Store Name */}
        <div className="bg-neutral-50 rounded-2xl p-4 border-2 border-black text-center mb-4">
          <div className="flex items-center justify-center gap-1 text-xs text-neutral-600 font-bold">
            <Store size={14} className="text-black" />
            <span>Paying Merchant Store:</span>
          </div>
          <h4 className="font-black text-lg text-black mt-0.5">
            {activeStoreName}
          </h4>
          <div className="text-3xl font-black text-black mt-2 tracking-tight">
            ₹{parseFloat(payAmount || '150').toLocaleString('en-IN')}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-600 bg-white px-2.5 py-0.5 rounded border border-neutral-300">
            <span>Ref: {payTxId}</span>
          </div>
        </div>

        {/* Dynamic Status / Confirmation View */}
        {status === 'SUCCESS' ? (
          <div className="py-5 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-emerald-700">Payment Successful!</h3>
            <p className="text-xs text-neutral-700 max-w-xs mx-auto leading-relaxed font-medium">
              {feedbackMessage}
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleResetSession}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 py-2.5 rounded-xl text-xs font-bold text-black border border-black transition"
              >
                Pay Another
              </button>
              <button
                onClick={onReturnToDashboard}
                className="flex-1 bg-black hover:bg-neutral-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                View Live Feed
              </button>
            </div>
          </div>
        ) : status === 'FRAUD' ? (
          <div className="py-5 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-red-600">Scam Blocked by Telemetry!</h3>
            <p className="text-xs text-neutral-700 max-w-xs mx-auto leading-relaxed font-medium">
              {feedbackMessage}
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleResetSession}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 py-2.5 rounded-xl text-xs font-bold text-black border border-black transition"
              >
                Reset Test
              </button>
              <button
                onClick={onReturnToDashboard}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                View Fraud Alert
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* PIN Entry Display */}
            <div className="bg-neutral-100 p-3.5 rounded-xl border border-neutral-300 text-center mb-4">
              <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-700 mb-1.5 font-bold">
                <Lock size={12} className="text-black" />
                <span>ENTER 6-DIGIT UPI PIN</span>
              </div>
              <div className="flex justify-center items-center gap-3 h-8">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <span
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      idx < pinInput.length
                        ? 'bg-black scale-110 shadow-xs'
                        : 'bg-neutral-300 border border-neutral-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
                Keystrokes streaming in real time to merchant dashboard
              </span>
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') handleClearPin();
                    else if (key === '←') handleDeleteChar();
                    else handlePinPress(key);
                  }}
                  className="bg-white hover:bg-neutral-100 active:bg-neutral-200 border-2 border-black py-2.5 rounded-xl text-lg font-black text-black transition active:scale-95 shadow-xs"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleCompletePay('SUCCESS')}
                className="w-full bg-black hover:bg-neutral-800 disabled:opacity-50 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <CheckCircle2 size={16} /> Pay ₹{payAmount || '150'} (Verified Settlement)
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleCompletePay('FRAUD')}
                className="w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 disabled:opacity-50 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition"
              >
                <AlertTriangle size={15} /> Simulate Fake Reverse Collect Scam
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-neutral-500 mt-3 text-center max-w-xs font-medium">
        Suraksha Vyapar Sandbox: Live keystrokes stream immediately to the merchant dashboard telemetry feed.
      </p>
    </div>
  );
};
