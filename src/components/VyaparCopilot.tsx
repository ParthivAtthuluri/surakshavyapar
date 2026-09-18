import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Store,
  Brain,
  Volume2,
  VolumeX,
  Trash2,
  Download,
  Plus,
  Check,
  CheckCircle2,
  Edit3,
  X,
  Target,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText
} from 'lucide-react';
import { sendVyaparCopilotMessage, CopilotResponse } from '../utils/aiService';
import { Transaction, BlueprintData, MerchantProfile, CopilotChatMessage } from '../types';

interface VyaparCopilotProps {
  storeName: string;
  transactions: Transaction[];
  blueprint?: BlueprintData;
}

export const VyaparCopilot: React.FC<VyaparCopilotProps> = ({
  storeName,
  transactions,
  blueprint,
}) => {
  const verifiedRevenue = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const fraudCount = transactions.filter((t) => t.status === 'FRAUD').length;

  const storageKeySuffix = storeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const CHAT_STORAGE_KEY = `vyapar_copilot_chat_${storageKeySuffix}`;
  const PROFILE_STORAGE_KEY = `vyapar_copilot_profile_${storageKeySuffix}`;

  // Default merchant persona profile: Captures what the user does and what he always wants
  const defaultProfile: MerchantProfile = {
    businessType: 'Handloom & Micro-Retail Store',
    primaryOfferings: blueprint?.product || 'Handloom Sarees, Cotton Fabrics & Artisanal Wares',
    targetCustomer: blueprint?.audience || 'Walk-in retail patrons & boutique wholesale buyers',
    typicalTicket: '₹150 - ₹550',
    goalsAndWants: [
      '100% Zero-Loss Protection against UPI reverse-pull & fake screenshot scams',
      'Boost average customer basket size with high-margin combos',
      'Qualify for collateral-free government grants (PM SVANidhi ₹50,000 / MUDRA)',
      'Stay compliant with 1% GST Composition Scheme vs 0% exempt items',
      'Fast, clear vernacular guidance with immediate action points'
    ],
    customNotes: 'Always give practical, numbered steps in simple conversational Hindi / English.',
    aiLearnedInsights: [
      'Merchant strictly verifies Soundbox voice chime before handing over merchandise',
      'Merchant maintains digital ledger to qualify for institutional MSME grants'
    ],
    languagePreference: 'hinglish',
  };

  // State: Merchant Profile (What the user does & always wants)
  const [profile, setProfile] = useState<MerchantProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load merchant profile from storage:', e);
    }
    return defaultProfile;
  });

  // State: Chat History
  const [messages, setMessages] = useState<CopilotChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat history from storage:', e);
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `नमस्ते! मैं हूँ आपका **Suraksha Vyapar AI Co-Pilot**।\n\nमुझे याद है कि आप **"${storeName}"** चलाते हैं और मुख्य रूप से **${profile.primaryOfferings}** बेचते हैं।\n\nमैंने आपकी पिछली बातचीत, सत्यापित लेज़र टर्नओवर (**₹${verifiedRevenue.toLocaleString('en-IN')}**) और आपकी मुख्य प्राथमिकताओं (पेमेंट सुरक्षा, सरकारी ग्रांट्स, और कॉम्बो बिक्री) को याद रखा है।\n\nआज आपकी दुकान के लिए मैं क्या सहायता करूँ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<MerchantProfile>(profile);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newInsightInput, setNewInsightInput] = useState('');
  const [recentlyLearned, setRecentlyLearned] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages, CHAT_STORAGE_KEY]);

  // Auto-save profile to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }, [profile, PROFILE_STORAGE_KEY]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech synthesis toggle
  const toggleSpeech = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown asterisks and formatting before speaking
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[MEMORY_UPDATE:[^\]]*\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || loading) return;

    const userMsg: CopilotChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!customPrompt) setInputMessage('');
    setLoading(true);

    try {
      // Pass full history & profile so Gemini remembers what user did and what he wants
      const historyPayload = nextMessages.slice(-12).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res: CopilotResponse = await sendVyaparCopilotMessage({
        message: textToSend,
        history: historyPayload,
        storeContext: {
          storeName,
          totalRevenue: verifiedRevenue,
          txCount: transactions.length,
          fraudCount,
          registered: blueprint?.registered || 'Yes',
        },
        merchantProfile: profile,
      });

      // Check if AI model extracted and learned a new insight
      if (res.learnedInsight) {
        setRecentlyLearned(res.learnedInsight);
        setProfile((prev) => ({
          ...prev,
          aiLearnedInsights: [
            ...prev.aiLearnedInsights.filter((i) => i !== res.learnedInsight),
            res.learnedInsight!,
          ],
        }));
      }

      const aiMsg: CopilotChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        learnedInsight: res.learnedInsight,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: CopilotChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'क्षमा करें, AI मॉडल से संपर्क करने में समस्या आई। कृपया पुनः प्रयास करें।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('क्या आप चैट हिस्ट्री को रीसेट करना चाहते हैं? आपकी प्रोफाइल और यादें सुरक्षित रहेंगी।')) {
      const initial: CopilotChatMessage[] = [
        {
          id: 'welcome-reset',
          sender: 'ai',
          text: `नमस्ते! मैंने चैट का नया सत्र शुरू किया है।\n\nमुझे आपकी दुकान **"${storeName}"** (${profile.primaryOfferings}) और आपकी प्राथमिकताएं अच्छी तरह याद हैं। बताएं, आज क्या योजना बनानी है?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(initial);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(initial));
    }
  };

  const handleExportChat = () => {
    const textContent = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'user' ? 'YOU' : 'AI CO-PILOT'}:\n${m.text}\n`)
      .join('\n----------------------------------------\n\n');
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${storeName.replace(/\s+/g, '_')}_AI_Copilot_Chat.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProfileEdit = () => {
    setProfile(editForm);
    setIsEditingProfile(false);
    setShowMemoryPanel(false);
  };

  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      goalsAndWants: [...prev.goalsAndWants, newGoalInput.trim()],
    }));
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      goalsAndWants: prev.goalsAndWants.filter((_, i) => i !== index),
    }));
  };

  const handleAddInsight = () => {
    if (!newInsightInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      aiLearnedInsights: [...prev.aiLearnedInsights, newInsightInput.trim()],
    }));
    setNewInsightInput('');
  };

  const handleRemoveInsight = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      aiLearnedInsights: prev.aiLearnedInsights.filter((_, i) => i !== index),
    }));
  };

  // Dynamic suggestion chips customized to what the merchant does & sells
  const samplePrompts = [
    { 
      label: `💡 ${profile.primaryOfferings.split(',')[0]} के कॉम्बो कैसे बनाएं?`, 
      query: `मेरी दुकान ${storeName} के मुख्य उत्पाद (${profile.primaryOfferings}) के साथ ऐसे कौन से कॉम्बो बनाएं जिससे औसत बिल ₹200 बढ़ जाए?` 
    },
    { 
      label: '🛡️ फर्जी स्क्रीनशॉट व रिवर्स-पुल स्कैम से बचाव', 
      query: 'ग्राहक अगर फोन पर पेमेंट का फर्जी स्क्रीनशॉट दिखाए या रिवर्स-पुल रिक्वेस्ट भेजे तो तुरंत कैसे पकड़ें?' 
    },
    { 
      label: '🏛️ पीएम स्वनिधि ₹50,000 व मुद्रा लोन', 
      query: `मेरी दुकान के सत्यापित डिजिटल टर्नओवर (₹${verifiedRevenue.toLocaleString('en-IN')}) पर पीएम स्वनिधि और मुद्रा लोन कैसे मिलेगा?` 
    },
    { 
      label: '📋 जीएसटी 1% कम्पोज़ीशन स्कीम नियम', 
      query: `क्या मुझे ${profile.primaryOfferings} बेचने पर 1% कम्पोज़ीशन स्कीम लेनी चाहिए या बिना जीएसटी के काम चलेगा?` 
    },
  ];

  return (
    <div id="vyapar-copilot-section" className="space-y-6">
      {/* Header Banner with AI Memory Status */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
                Gemini 3.8 Flash
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                <Brain size={13} className="text-emerald-600" />
                Persistent Conversational Memory Active
              </span>
              <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-300">
                {messages.length} Messages in Memory
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black mt-1.5 flex items-center gap-2">
              <Bot size={26} className="text-black" />
              Suraksha Vyapar AI Co-Pilot
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Personalized AI advisor that remembers your previous chats, store inventory, ledger history, and exact business goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditForm(profile);
                setShowMemoryPanel(!showMemoryPanel);
              }}
              className="px-3.5 py-2 rounded-xl border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-black font-black text-xs flex items-center gap-1.5 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
            >
              <Brain size={14} className="text-emerald-600" />
              <span>{showMemoryPanel ? 'Hide AI Memory' : 'View AI Memory & Persona'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportChat}
              title="Download chat history transcript"
              className="p-2 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 text-black font-bold text-xs transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
            >
              <Download size={15} />
            </button>

            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear conversation history"
              className="p-2 rounded-xl border-2 border-black bg-white hover:bg-red-50 text-neutral-700 hover:text-red-700 font-bold text-xs transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Recently Learned Insight Banner */}
        {recentlyLearned && (
          <div className="mt-4 p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-700 shrink-0" />
              <p className="text-xs font-bold text-emerald-950">
                <strong>New Memory Saved:</strong> AI Co-Pilot memorized: "{recentlyLearned}"
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRecentlyLearned(null)}
              className="text-emerald-800 hover:text-black text-xs font-black p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Merchant Persona & Memory Engine Panel */}
      {showMemoryPanel && (
        <div className="bg-neutral-50 border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-5 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-neutral-300">
            <div>
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-black" />
                <h3 className="text-base font-black text-black">
                  What AI Co-Pilot Knows About You & What You Always Want
                </h3>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                The AI model continuously maintains this memory across sessions and adapts all advice accordingly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto hover:bg-neutral-800 transition"
            >
              <Edit3 size={12} />
              <span>{isEditingProfile ? 'Cancel Edit' : 'Customize Profile & Notes'}</span>
            </button>
          </div>

          {/* Edit Form Modal/Section */}
          {isEditingProfile ? (
            <div className="bg-white border-2 border-black rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-neutral-500">Edit Business Identity & Directives</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Business Category / Type</label>
                  <input
                    type="text"
                    value={editForm.businessType}
                    onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Primary Offerings / Products Sold</label>
                  <input
                    type="text"
                    value={editForm.primaryOfferings}
                    onChange={(e) => setEditForm({ ...editForm, primaryOfferings: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Target Customer Audience</label>
                  <input
                    type="text"
                    value={editForm.targetCustomer}
                    onChange={(e) => setEditForm({ ...editForm, targetCustomer: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Typical Order Basket Size</label>
                  <input
                    type="text"
                    value={editForm.typicalTicket}
                    onChange={(e) => setEditForm({ ...editForm, typicalTicket: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs font-bold text-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Custom AI Directives & Preferences (Instructions the AI must always obey)
                </label>
                <textarea
                  rows={2}
                  value={editForm.customNotes}
                  onChange={(e) => setEditForm({ ...editForm, customNotes: e.target.value })}
                  placeholder="e.g. Always reply in simple Hindi with 3 numbered action points. My store is located in Varanasi."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs font-medium text-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfileEdit}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Save & Commit to AI Memory
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: What You Do */}
              <div className="bg-white border-2 border-black rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <ShoppingBag size={16} className="text-black" />
                  <h4 className="text-xs font-black uppercase text-black">What You Do</h4>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">Store & Category:</span>
                    <strong className="text-black">{storeName}</strong> ({profile.businessType})
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">Products Offered:</span>
                    <p className="text-neutral-800 font-medium">{profile.primaryOfferings}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">Customer Base:</span>
                    <p className="text-neutral-800 font-medium">{profile.targetCustomer}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">Verified Volume:</span>
                    <strong className="text-emerald-700">₹{verifiedRevenue.toLocaleString('en-IN')}</strong> ({transactions.length} transactions)
                  </div>
                </div>
              </div>

              {/* Card 2: What You Always Want */}
              <div className="bg-white border-2 border-black rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <Target size={16} className="text-emerald-700" />
                  <h4 className="text-xs font-black uppercase text-black">What You Always Want</h4>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {profile.goalsAndWants.map((goal, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-1.5 bg-neutral-50 p-1.5 rounded border border-neutral-200">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-semibold text-neutral-800">{goal}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-neutral-400 hover:text-red-600 p-0.5"
                        title="Remove goal"
                      >
                        <X size={11} />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom goal..."
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                    className="flex-1 text-[11px] border border-neutral-300 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="p-1 bg-black text-white rounded text-[11px] px-2 font-bold"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Card 3: Learned Insights & Notes */}
              <div className="bg-white border-2 border-black rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <Brain size={16} className="text-purple-700" />
                  <h4 className="text-xs font-black uppercase text-black">Learned Memory & Habits</h4>
                </div>

                <div className="space-y-2">
                  <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200 text-xs">
                    <span className="text-[10px] font-bold text-amber-900 block uppercase">Permanent Directive:</span>
                    <p className="text-amber-950 font-medium italic">"{profile.customNotes}"</p>
                  </div>

                  <ul className="space-y-1.5 text-xs max-h-36 overflow-y-auto">
                    {profile.aiLearnedInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-1.5 bg-neutral-50 p-1.5 rounded border border-neutral-200">
                        <span className="font-medium text-neutral-700 text-[11px]">🧠 {insight}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInsight(idx)}
                          className="text-neutral-400 hover:text-red-600 p-0.5"
                          title="Delete memory"
                        >
                          <X size={11} />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-1 pt-1">
                    <input
                      type="text"
                      placeholder="Add memory fact..."
                      value={newInsightInput}
                      onChange={(e) => setNewInsightInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddInsight()}
                      className="flex-1 text-[11px] border border-neutral-300 rounded px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddInsight}
                      className="p-1 bg-black text-white rounded text-[11px] px-2 font-bold"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Chat Container */}
      <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[620px]">
        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-black text-white border-black'
                    : 'bg-emerald-600 text-white border-emerald-700'
                }`}
              >
                {msg.sender === 'user' ? 'ME' : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm border-2 ${
                  msg.sender === 'user'
                    ? 'bg-black text-white border-black rounded-tr-none'
                    : 'bg-white text-black border-black rounded-tl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed space-y-2 font-medium">
                  {msg.text}
                </div>

                {msg.learnedInsight && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-emerald-600" />
                    <span>AI Memorized: {msg.learnedInsight}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-2.5 pt-1.5 border-t border-neutral-100">
                  <span
                    className={`text-[10px] font-mono ${
                      msg.sender === 'user' ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>

                  {msg.sender === 'ai' && (
                    <button
                      type="button"
                      onClick={() => toggleSpeech(msg.id, msg.text)}
                      className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-100 text-neutral-600 transition"
                      title="Read aloud in Soundbox voice"
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX size={13} className="text-red-600" />
                          <span className="text-red-600 text-[10px]">Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} className="text-emerald-600" />
                          <span className="text-[10px]">Listen Voice</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 border border-emerald-700 animate-pulse">
                <Bot size={16} />
              </div>
              <div className="bg-white text-black border-2 border-black rounded-2xl rounded-tl-none p-3.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-emerald-600" />
                <span>AI Co-Pilot is consulting conversation memory & ledger metrics...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips Customized to Merchant Business */}
        <div className="p-2.5 sm:p-3 bg-white border-t border-neutral-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" /> Custom Quick Ask:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(p.query)}
              className="text-xs bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition active:scale-95 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t-2 border-black flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask about ${profile.primaryOfferings.split(',')[0]}, scams, GST, or loans (Hindi or English)...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={loading}
            className="flex-1 bg-neutral-50 border-2 border-black rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder:text-neutral-400"
          />
          <button
            type="button"
            disabled={loading || !inputMessage.trim()}
            onClick={() => handleSendMessage()}
            className="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Send to AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
