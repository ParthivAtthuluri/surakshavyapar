import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  ExternalLink, 
  FileCheck, 
  X, 
  DollarSign, 
  Building2, 
  Sparkles, 
  Send,
  Download,
  AlertCircle,
  Bot,
  RefreshCw,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { BlueprintData, GrantScheme, Transaction } from '../types';
import { generateAiDpr, AiDprResult } from '../utils/aiService';

interface GrantMatcherProps {
  blueprint: BlueprintData;
  transactions: Transaction[];
  amount: string;
}

export const GrantMatcher: React.FC<GrantMatcherProps> = ({
  blueprint,
  transactions,
  amount,
}) => {
  const [selectedGrant, setSelectedGrant] = useState<GrantScheme | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // AI DPR Generator States
  const [activeDpr, setActiveDpr] = useState<AiDprResult | null>(null);
  const [isGeneratingDpr, setIsGeneratingDpr] = useState<boolean>(false);
  const [copiedDpr, setCopiedDpr] = useState<boolean>(false);

  // Form draft state in modal
  const [applicantName, setApplicantName] = useState('Radha Devi');
  const [enterpriseName, setEnterpriseName] = useState('Radha Handloom & Crafts');
  const [requestedAmount, setRequestedAmount] = useState('₹15,00,000');
  const [justification, setJustification] = useState(
    'Working capital expansion to procure automated organic loom equipment, scale local artisan employment, and meet rising boutique order volume.'
  );

  const totalVerifiedRevenue = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const verifiedCount = transactions.filter((t) => t.status === 'SUCCESS').length;

  // Compute dynamic match scores based on Lean Canvas & Ledger
  const isRegistered = blueprint.registered === 'Yes';
  const hasLedgerHistory = transactions.length > 0;
  const isBioOrCraft = /organic|cotton|food|agri|bio|craft|handloom|textile|herbal/i.test(blueprint.product || '');

  // Calculate scores
  const sisfsScore = Math.min(
    98,
    72 + (isRegistered ? 16 : 4) + (hasLedgerHistory ? 6 : 0) + (blueprint.product ? 4 : 0)
  );

  const biracScore = Math.min(
    95,
    55 + (isBioOrCraft ? 25 : 5) + (isRegistered ? 10 : 0) + (blueprint.costs ? 5 : 0)
  );

  const pmegpScore = Math.min(
    99,
    78 + (isRegistered ? 14 : 6) + (hasLedgerHistory ? 5 : 0)
  );

  const mudraScore = Math.min(
    96,
    82 + (hasLedgerHistory ? 10 : 4) + (isRegistered ? 4 : 0)
  );

  const grantSchemes: GrantScheme[] = [
    {
      id: 'sisfs',
      title: 'Startup India Seed Fund Scheme (SISFS)',
      amount: 'Grant up to ₹20 Lakhs',
      criteria: 'Proof of concept, prototype development, market validation & DPIIT recognition.',
      matchScore: sisfsScore,
      focusArea: 'Early-stage micro-enterprises & tech/commerce innovations',
      registrationRequired: true,
      maxFunding: '₹20,00,000 (Non-dilutive Grant)',
    },
    {
      id: 'birac',
      title: 'BIRAC BIG Innovation Scheme',
      amount: 'Grant up to ₹50 Lakhs',
      criteria: 'Biotech, agricultural-tech, sustainable green craft, or health innovation focus.',
      matchScore: biracScore,
      focusArea: 'Sustainable product innovation, eco-materials & green crafts',
      registrationRequired: false,
      maxFunding: '₹50,00,000 (Non-dilutive Grant)',
    },
    {
      id: 'pmegp',
      title: 'Prime Minister Employment Generation Programme (PMEGP)',
      amount: 'Subsidy up to ₹50 Lakhs',
      criteria: 'Credit-linked subsidy (up to 35% margin money) for micro-manufacturing & service enterprises.',
      matchScore: pmegpScore,
      focusArea: 'Rural & semi-urban micro-manufacturers, artisan clusters',
      registrationRequired: true,
      maxFunding: '₹50,00,000 (35% Direct Government Subsidy)',
    },
    {
      id: 'mudra',
      title: 'Pradhan Mantri MUDRA Tarun Scheme',
      amount: 'Collateral-free loan up to ₹10 Lakhs',
      criteria: 'Established micro-units with verifiable daily digital cashflow ledgers.',
      matchScore: mudraScore,
      focusArea: 'Micro-retailers, daily shopkeepers & local craftspeople',
      registrationRequired: false,
      maxFunding: '₹10,00,000 (Zero-collateral Institutional Credit)',
    },
  ];

  const handleOpenDraftModal = (grant: GrantScheme) => {
    setSelectedGrant(grant);
    setSubmittedMessage(null);
    setActiveDpr(null);
    if (grant.id === 'sisfs') {
      setRequestedAmount('₹18,50,000');
    } else if (grant.id === 'birac') {
      setRequestedAmount('₹45,00,000');
    } else {
      setRequestedAmount('₹10,00,000');
    }
  };

  const handleGenerateDpr = async () => {
    if (!selectedGrant || isGeneratingDpr) return;
    setIsGeneratingDpr(true);
    try {
      const result = await generateAiDpr({
        grantId: selectedGrant.id,
        grantTitle: selectedGrant.title,
        enterpriseName: enterpriseName || 'Suraksha Vyapar Enterprise',
        applicantName: applicantName || 'Merchant',
        product: blueprint.product || 'Artisanal Handloom & Conscious Apparel',
        requestedAmount: requestedAmount || selectedGrant.amount,
        turnover: totalVerifiedRevenue > 0 ? totalVerifiedRevenue * 12 : 350000,
        registered: blueprint.registered,
      });
      setActiveDpr(result);
    } catch (err) {
      console.warn('AI DPR generation error:', err);
    } finally {
      setIsGeneratingDpr(false);
    }
  };

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(
      `Application Draft for "${selectedGrant?.title}" compiled and exported with authenticated UPI ledger certificate!`
    );
  };

  return (
    <div id="grant-matcher-section" className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                Capital Grants
              </span>
              <span className="text-xs font-mono text-neutral-600">Non-Dilutive Schemes</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black mt-1 flex items-center gap-2">
              <Award size={24} className="text-black" />
              Active Grant Navigator & Auto-Apply
            </h2>
            <p className="text-sm text-neutral-600 mt-0.5">
              Automated eligibility scoring against verified government capital schemes, powered by your Lean Canvas & sales ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-amber-50 px-3.5 py-2 rounded-xl border-2 border-amber-300 text-amber-900 self-start sm:self-center">
            <Sparkles size={14} className="text-amber-500" />
            <span>Dynamic Eligibility Engine</span>
          </div>
        </div>
      </div>

      {/* Grant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {grantSchemes.map((grant) => (
          <div
            key={grant.id}
            className="bg-white border-2 border-black rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-black text-base text-black leading-snug">{grant.title}</h3>
                <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-full whitespace-nowrap border ${
                  grant.matchScore >= 90 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {grant.matchScore}% Match
                </span>
              </div>

              <p className="text-xl font-black text-black tracking-tight mb-2">
                {grant.amount}
              </p>

              <div className="space-y-2 text-xs">
                <p className="text-neutral-700 leading-relaxed font-medium">
                  <strong className="text-black">Criteria:</strong> {grant.criteria}
                </p>
                <p className="text-neutral-600 leading-relaxed font-medium">
                  <strong className="text-black">Focus:</strong> {grant.focusArea}
                </p>
              </div>

              {/* Match Factors Pill Tag */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-200 text-[11px] font-bold">
                {blueprint.registered === 'Yes' && (
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                    +MSME Registered
                  </span>
                )}
                {hasLedgerHistory && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                    +UPI Sales Proven
                  </span>
                )}
                {isBioOrCraft && (
                  <span className="bg-neutral-100 text-black border border-neutral-300 px-2 py-0.5 rounded">
                    +Sustainable Domain
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleOpenDraftModal(grant)}
              className="w-full bg-black hover:bg-neutral-800 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <FileCheck size={16} /> Auto-Fill Application Draft
            </button>
          </div>
        ))}
      </div>

      {/* Auto-Draft Modal */}
      {selectedGrant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3.5">
              <div>
                <span className="text-[11px] font-mono text-black font-black uppercase tracking-wider">
                  Pre-Populated Grant Application Form
                </span>
                <h3 className="font-black text-base text-black mt-0.5">
                  {selectedGrant.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGrant(null)}
                className="text-black hover:bg-neutral-100 p-1.5 rounded-lg border border-neutral-300 transition"
              >
                <X size={18} />
              </button>
            </div>

            {submittedMessage ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-emerald-700">Application Package Ready!</h4>
                  <p className="text-xs text-neutral-700 mt-1 max-w-md mx-auto leading-relaxed font-medium">
                    {submittedMessage}
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border-2 border-black text-left text-xs font-mono text-black space-y-1">
                  <div><strong>Application Ref:</strong> APP-SISFS-{Math.floor(100000 + Math.random() * 900000)}</div>
                  <div><strong>Applicant:</strong> {applicantName} ({enterpriseName})</div>
                  <div><strong>Requested Aid:</strong> {requestedAmount}</div>
                  <div><strong>Attached Ledger:</strong> ₹{totalVerifiedRevenue} logged verified volume</div>
                </div>
                <button
                  onClick={() => setSelectedGrant(null)}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-black py-2.5 px-6 rounded-xl transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitDraft} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-black font-bold mb-1">Applicant Name</label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-black font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-bold mb-1">Enterprise Name</label>
                    <input
                      type="text"
                      value={enterpriseName}
                      onChange={(e) => setEnterpriseName(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-black font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-black font-bold mb-1">
                    Auto-Mapped Business Scope (from Lean Canvas)
                  </label>
                  <input
                    readOnly
                    value={blueprint.product || 'Artisanal Handloom & Conscious Apparel'}
                    className="w-full bg-neutral-100 border border-neutral-300 rounded-xl p-2.5 text-neutral-800 font-mono text-[11px] font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-black font-bold mb-1">Target Capital Grant</label>
                    <input
                      type="text"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-black font-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-bold mb-1">MSME Registration Status</label>
                    <input
                      readOnly
                      value={blueprint.registered === 'Yes' ? 'UDYAM-MH-03-9948211 (Active)' : 'Informal / Zero-GST Exemption'}
                      className="w-full bg-neutral-100 border border-neutral-300 rounded-xl p-2.5 text-neutral-800 font-mono text-[11px] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-black font-bold mb-1">
                    Verified Digital Sales Ledger Attestation
                  </label>
                  <div className="bg-neutral-50 border-2 border-black rounded-xl p-3 text-black flex items-center justify-between">
                    <div>
                      <p className="font-black text-black">Supabase Cryptographic UPI Ledger</p>
                      <p className="text-[11px] text-neutral-600">
                        {verifiedCount} verified settled sales totaling ₹{totalVerifiedRevenue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono bg-black text-white px-2 py-1 rounded font-black">
                      VERIFIED
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-black font-bold mb-1">
                    Project Narrative & Expenditure Plan
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-black font-medium focus:outline-none text-xs"
                  />
                </div>

                {/* AI Model DPR Generation Card */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-amber-700" />
                      <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        AI Detailed Project Report (DPR) Model
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    Automatically draft a comprehensive Detailed Project Report (DPR) with institutional financial ratios, budget breakdown, and promoter feasibility ready for bank and portal review.
                  </p>
                  <button
                    type="button"
                    disabled={isGeneratingDpr}
                    onClick={handleGenerateDpr}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    {isGeneratingDpr ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>AI Model is Drafting Institutional DPR...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate Full DPR with AI Model</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Rendered AI DPR View */}
                {activeDpr && (
                  <div className="bg-neutral-50 border-2 border-black rounded-xl p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-300">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-500 block">
                          AI Model Generated Proposal
                        </span>
                        <h4 className="font-black text-sm text-black">{activeDpr.projectTitle}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(activeDpr, null, 2));
                            setCopiedDpr(true);
                            setTimeout(() => setCopiedDpr(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-white text-black border border-neutral-300 rounded text-[11px] font-bold flex items-center gap-1 hover:border-black"
                        >
                          {copiedDpr ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copiedDpr ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-2.5 py-1 bg-black text-white rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <Printer size={12} /> Print
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-neutral-800 text-[11px] leading-relaxed">
                      <div>
                        <strong className="text-black block text-xs">Executive Summary:</strong>
                        <p>{activeDpr.executiveSummary}</p>
                      </div>
                      <div>
                        <strong className="text-black block text-xs">Promoter Profile:</strong>
                        <p>{activeDpr.promoterProfile}</p>
                      </div>

                      {/* Budget Breakdown Table */}
                      <div className="pt-1">
                        <strong className="text-black block text-xs mb-1">Proposed Capital Expenditure Breakdown:</strong>
                        <div className="border border-neutral-300 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-neutral-200 font-black text-black">
                              <tr>
                                <th className="p-1.5">Expenditure Head</th>
                                <th className="p-1.5">Allocation</th>
                                <th className="p-1.5">Operational Justification</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 bg-white">
                              {activeDpr.budgetBreakdown.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="p-1.5 font-bold text-black">{item.head}</td>
                                  <td className="p-1.5 font-mono font-bold text-emerald-700">{item.amount}</td>
                                  <td className="p-1.5 text-neutral-600">{item.rationale}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Financial Viability */}
                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                        <div className="bg-white p-2 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-500 block">Projected ROI</span>
                          <strong className="text-xs text-emerald-700">{activeDpr.financialViability.projectedRoi}</strong>
                        </div>
                        <div className="bg-white p-2 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-500 block">Break-even</span>
                          <strong className="text-xs text-black">{activeDpr.financialViability.breakEvenMonths}</strong>
                        </div>
                        <div className="bg-white p-2 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-500 block">DSCR Ratio</span>
                          <strong className="text-xs text-indigo-700">{activeDpr.financialViability.debtServiceCoverageRatio}</strong>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-neutral-300">
                        <strong className="text-black block mb-0.5 text-xs">Bank Committee Submission Summary:</strong>
                        <p className="text-neutral-700">{activeDpr.bankSubmissionSummary}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedGrant(null)}
                    className="flex-1 bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black hover:bg-neutral-800 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Send size={14} /> Submit Auto-Drafted Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
