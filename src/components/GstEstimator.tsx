import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Printer,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Percent,
  RefreshCw,
  Info,
  Bot,
  Sparkles,
  Search
} from 'lucide-react';
import { Transaction } from '../types';
import { classifyGstItem, AiGstClassification } from '../utils/aiService';

interface GstEstimatorProps {
  transactions: Transaction[];
  storeName: string;
}

export const GstEstimator: React.FC<GstEstimatorProps> = ({
  transactions,
  storeName,
}) => {
  // AI HSN Classification State
  const [searchItem, setSearchItem] = useState<string>('Organic Cold Pressed Mustard Oil');
  const [aiClassification, setAiClassification] = useState<AiGstClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  // Verified UPI turnover logged from live transactions
  const verifiedDigitalRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const verifiedTxCount = useMemo(() => {
    return transactions.filter((t) => t.status === 'SUCCESS').length;
  }, [transactions]);

  // User input states for income and wholesale purchase expenses
  const [monthlyCashSales, setMonthlyCashSales] = useState<string>('95000');
  const [wholesaleMonthlyPurchases, setWholesaleMonthlyPurchases] = useState<string>('75000');
  const [businessCategory, setBusinessCategory] = useState<'kirana' | 'retail_general' | 'apparel'>('kirana');
  const [selectedScheme, setSelectedScheme] = useState<'composition' | 'regular'>('composition');
  const [customTurnoverMultiplier, setCustomTurnoverMultiplier] = useState<number>(12); // Annualized

  // Kirana standard GST Slab Distribution (configurable by slider or preset)
  const [slab0Percent, setSlab0Percent] = useState<number>(35); // Grains, unbranded pulses, milk, salt (0% GST)
  const [slab5Percent, setSlab5Percent] = useState<number>(35); // Branded oils, spices, tea, sugar (5% GST)
  const [slab12Percent, setSlab12Percent] = useState<number>(15); // Ghee, processed foods, packaged snacks (12% GST)
  const [slab18Percent, setSlab18Percent] = useState<number>(15); // Soaps, detergents, packaged confectionery (18% GST)

  // Calculations
  const numericCashSales = parseFloat(monthlyCashSales) || 0;
  const numericWholesalePurchases = parseFloat(wholesaleMonthlyPurchases) || 0;

  // Monthly estimated revenue: verified transactions (assumed 1-2 days logged, scaled to monthly) + cash sales
  // For realistic estimation, we combine actual digital run-rate + cash turnover
  const estimatedMonthlyDigital = verifiedDigitalRevenue > 0 ? (verifiedDigitalRevenue * 15) : 35000;
  const totalMonthlyTurnover = estimatedMonthlyDigital + numericCashSales;
  const estimatedAnnualTurnover = totalMonthlyTurnover * customTurnoverMultiplier;

  // GST Registration Threshold in India for Goods Traders is ₹40 Lakhs (₹40,00,000)
  const GST_MANDATORY_THRESHOLD = 4000000;
  const thresholdPercentage = Math.min(100, (estimatedAnnualTurnover / GST_MANDATORY_THRESHOLD) * 100);
  const isMandatoryRegistrationRequired = estimatedAnnualTurnover >= GST_MANDATORY_THRESHOLD;

  // Regular Scheme Tax Computations (Output Tax vs Input Tax Credit)
  const monthlySlab0Sales = (totalMonthlyTurnover * slab0Percent) / 100;
  const monthlySlab5Sales = (totalMonthlyTurnover * slab5Percent) / 100;
  const monthlySlab12Sales = (totalMonthlyTurnover * slab12Percent) / 100;
  const monthlySlab18Sales = (totalMonthlyTurnover * slab18Percent) / 100;

  const outputGst5 = monthlySlab5Sales * 0.05;
  const outputGst12 = monthlySlab12Sales * 0.12;
  const outputGst18 = monthlySlab18Sales * 0.18;
  const grossMonthlyOutputGst = outputGst5 + outputGst12 + outputGst18;

  // Input Tax Credit (ITC) from wholesale supplier invoices (blended avg ~10% GST on stock purchases)
  const estimatedMonthlyItc = numericWholesalePurchases * 0.10;
  const netMonthlyRegularGst = Math.max(0, grossMonthlyOutputGst - estimatedMonthlyItc);
  const netAnnualRegularGst = netMonthlyRegularGst * 12;

  // Composition Scheme Tax Computations:
  // For traders/kirana stores, flat 1% of turnover (0.5% CGST + 0.5% SGST), no ITC allowed
  const monthlyCompositionGst = totalMonthlyTurnover * 0.01;
  const annualCompositionGst = monthlyCompositionGst * 12;

  // Scheme Savings Evaluation
  const compositionSavingsAnnual = netAnnualRegularGst - annualCompositionGst;
  const recommendedScheme = (estimatedAnnualTurnover < 15000000 && compositionSavingsAnnual > 0)
    ? 'composition'
    : 'regular';

  const handlePrintReport = () => {
    window.print();
  };

  const handleClassify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchItem.trim() || isClassifying) return;
    setIsClassifying(true);
    try {
      const res = await classifyGstItem(searchItem);
      setAiClassification(res);
    } catch (err) {
      console.warn('AI GST classification failed:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div id="gst-estimator-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                Tax & Compliance
              </span>
              <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                FY 2026-27 CGST / SGST Rules
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                <Bot size={12} /> Gemini 3.8 Flash Powered
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black mt-1 flex items-center gap-2">
              <Calculator size={24} className="text-black" />
              GST Estimator & Kirana Compliance Center
            </h2>
            <p className="text-sm text-neutral-600 mt-0.5">
              Calculates GST liability, Input Tax Credit (ITC), and Composition vs Regular scheme eligibility based on your live UPI transactions and monthly cash ledger.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-neutral-100 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition active:scale-95"
            >
              <Printer size={14} /> Print GST Estimate
            </button>
          </div>
        </div>
      </div>

      {/* AI Item HSN Code & GST Rate Classifier Card */}
      <div className="bg-neutral-50 border-2 border-black rounded-2xl p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
              <Bot size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black">AI HSN Code & GST Slab Classifier</h3>
              <p className="text-xs text-neutral-600">
                Instant statutory HSN mapping, tax rate determination, and ITC eligibility for any product.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white text-neutral-800 px-2.5 py-1 rounded border border-black self-start sm:self-auto">
            AI Model Search
          </span>
        </div>

        <form onSubmit={handleClassify} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="e.g. Mustard oil cold pressed, Handloom cotton saree, Detergent powder, Besan flour..."
              className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            disabled={isClassifying || !searchItem.trim()}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
          >
            {isClassifying ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Classifying...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Classify with AI Model</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-neutral-500">Quick Test:</span>
          {[
            'Cold Pressed Mustard Oil',
            'Handloom Cotton Saree',
            'Unbranded Basmati Rice',
            'Organic Jaggery Powder',
            'Detergent Cake & Powder'
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setSearchItem(sample);
              }}
              className="px-2 py-0.5 bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-[11px] font-bold text-neutral-700 transition"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Rendered Classification Result */}
        {aiClassification && (
          <div className="bg-white border-2 border-black rounded-xl p-4 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Item Evaluated</span>
                <h4 className="text-base font-black text-black">{aiClassification.itemName}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black bg-neutral-100 text-black px-2.5 py-1 rounded border border-black">
                  HSN: {aiClassification.hsnCode}
                </span>
                <span className="text-xs font-mono font-black bg-emerald-600 text-white px-3 py-1 rounded">
                  GST: {aiClassification.gstRate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 block">Input Tax Credit (ITC)</span>
                <strong className="text-black font-bold">
                  {aiClassification.itcEligible ? 'Eligible for ITC against B2B wholesale invoice' : 'Ineligible / Nil rated'}
                </strong>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 block">Composition Scheme Advice</span>
                <strong className="text-black font-bold">
                  {aiClassification.compositionAdvice}
                </strong>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed font-medium bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-0.5">Statutory Classification Rationale:</strong>
              {aiClassification.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Threshold Monitor Card */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Section 22 GST Threshold Monitor (Goods Supply)
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                isMandatoryRegistrationRequired
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {isMandatoryRegistrationRequired ? 'MANDATORY REGISTRATION REQUIRED' : 'EXEMPT FROM MANDATORY GST'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Goods trading businesses in India with annual turnover under ₹40,00,000 (₹40 Lakhs) are exempt from mandatory GST registration.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-neutral-500 font-bold block">Annual Projected Turnover</span>
            <span className="text-xl font-black text-black">
              ₹{estimatedAnnualTurnover.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-neutral-500 block font-mono">
              Limit: ₹40,00,000
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-neutral-100 rounded-full h-3 border border-neutral-300 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isMandatoryRegistrationRequired ? 'bg-red-600' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, thresholdPercentage)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 font-bold">
            <span>₹0</span>
            <span>25% (₹10L)</span>
            <span>50% (₹20L)</span>
            <span>75% (₹30L)</span>
            <span className="text-black font-black">₹40L Mandatory Threshold</span>
          </div>
        </div>
      </div>

      {/* Inputs & Scheme Comparer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-5">
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <FileText size={16} /> Business Income & Cost Inputs
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Live Sync</span>
          </div>

          {/* Digital UPI Sales from live transactions */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" />
                Logged UPI Digital Turnover:
              </span>
              <span className="font-black text-emerald-800 text-sm">
                ₹{verifiedDigitalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Directly synced from {verifiedTxCount} verified counter sales in Suraksha Vyapar ledger.
            </p>
          </div>

          {/* Cash Sales Input */}
          <div className="space-y-1.5">
            <label htmlFor="cash-sales-input" className="block text-xs font-bold text-black uppercase tracking-wider">
              Estimated Monthly Cash Sales (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black font-bold">₹</span>
              <input
                id="cash-sales-input"
                type="number"
                min="0"
                step="1000"
                value={monthlyCashSales}
                onChange={(e) => setMonthlyCashSales(e.target.value)}
                placeholder="e.g. 95000"
                className="w-full bg-white border-2 border-black rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              Over-the-counter cash receipts not routed through UPI.
            </p>
          </div>

          {/* Wholesale Stock Purchases Input */}
          <div className="space-y-1.5">
            <label htmlFor="wholesale-purchases-input" className="block text-xs font-bold text-black uppercase tracking-wider">
              Monthly Wholesale Stock Purchases (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black font-bold">₹</span>
              <input
                id="wholesale-purchases-input"
                type="number"
                min="0"
                step="1000"
                value={wholesaleMonthlyPurchases}
                onChange={(e) => setWholesaleMonthlyPurchases(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full bg-white border-2 border-black rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              Used to compute Input Tax Credit (ITC) for the Regular GST Scheme.
            </p>
          </div>

          {/* Kirana Basket GST Slab Distribution */}
          <div className="pt-3 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Kirana Basket Tax Slabs
              </span>
              <button
                type="button"
                onClick={() => {
                  setSlab0Percent(35);
                  setSlab5Percent(35);
                  setSlab12Percent(15);
                  setSlab18Percent(15);
                }}
                className="text-[11px] font-bold text-neutral-600 hover:text-black underline"
              >
                Reset Default
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-neutral-700 mb-0.5">
                  <span>0% GST (Loose Flour, Pulses, Milk, Salt):</span>
                  <span className="font-mono">{slab0Percent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slab0Percent}
                  onChange={(e) => setSlab0Percent(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-neutral-700 mb-0.5">
                  <span>5% GST (Branded Oil, Spices, Tea, Sugar):</span>
                  <span className="font-mono">{slab5Percent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slab5Percent}
                  onChange={(e) => setSlab5Percent(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-neutral-700 mb-0.5">
                  <span>12% GST (Ghee, Butter, Packaged Snacks):</span>
                  <span className="font-mono">{slab12Percent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slab12Percent}
                  onChange={(e) => setSlab12Percent(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-neutral-700 mb-0.5">
                  <span>18% GST (Soaps, Detergents, Chocolates):</span>
                  <span className="font-mono">{slab18Percent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slab18Percent}
                  onChange={(e) => setSlab18Percent(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Schemes & Estimates */}
        <div className="lg:col-span-7 space-y-6">
          {/* Comparative Scheme Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Composition Scheme Card */}
            <div
              onClick={() => setSelectedScheme('composition')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
                selectedScheme === 'composition'
                  ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'border-neutral-300 bg-neutral-50 hover:border-black opacity-80'
              }`}
            >
              {recommendedScheme === 'composition' && (
                <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                  Recommended for Kirana
                </span>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    Composition Scheme (1%)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-neutral-200 text-black px-1.5 py-0.5 rounded">
                    Traders
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  Flat 1% tax on turnover (0.5% CGST + 0.5% SGST). Zero invoice matching, simple quarterly CMP-08 filing.
                </p>
                <div className="space-y-1 pt-2 border-t border-neutral-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Monthly Tax:</span>
                    <strong className="text-black font-mono">₹{Math.round(monthlyCompositionGst).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Quarterly (CMP-08):</span>
                    <strong className="text-black font-mono">₹{Math.round(monthlyCompositionGst * 3).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Annual Tax:</span>
                    <span className="font-mono font-black text-sm">₹{Math.round(annualCompositionGst).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-neutral-200 text-[11px] font-bold text-neutral-600">
                {selectedScheme === 'composition' ? '✓ Currently Selected' : 'Click to select this scheme'}
              </div>
            </div>

            {/* Regular GST Scheme Card */}
            <div
              onClick={() => setSelectedScheme('regular')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
                selectedScheme === 'regular'
                  ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'border-neutral-300 bg-neutral-50 hover:border-black opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    Regular GST Scheme
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-neutral-200 text-black px-1.5 py-0.5 rounded">
                    ITC Active
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  Output tax collected on sales minus Input Tax Credit (ITC) on wholesale purchase bills. Monthly GSTR-1 & GSTR-3B.
                </p>
                <div className="space-y-1 pt-2 border-t border-neutral-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Gross Output GST:</span>
                    <span className="text-black font-mono">₹{Math.round(grossMonthlyOutputGst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Less: Supplier ITC:</span>
                    <span className="font-mono font-bold">-₹{Math.round(estimatedMonthlyItc).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-black font-bold">
                    <span>Net Monthly Tax:</span>
                    <span className="font-mono font-black text-sm">₹{Math.round(netMonthlyRegularGst).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-neutral-200 text-[11px] font-bold text-neutral-600">
                {selectedScheme === 'regular' ? '✓ Currently Selected' : 'Click to select this scheme'}
              </div>
            </div>
          </div>

          {/* Selected Scheme Detailed Tax Breakdown Card */}
          <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                {selectedScheme === 'composition'
                  ? 'Composition Scheme Summary (Flat 1%)'
                  : 'Regular GST Output & Input Tax Credit Breakdown'}
              </span>
              <span className="text-xs font-mono font-bold bg-black text-white px-2.5 py-0.5 rounded">
                Store: {storeName}
              </span>
            </div>

            {selectedScheme === 'composition' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-300">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">CGST (0.5%)</span>
                    <p className="text-base font-black text-black mt-0.5">
                      ₹{Math.round(monthlyCompositionGst * 0.5).toLocaleString('en-IN')}/mo
                    </p>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-300">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">SGST (0.5%)</span>
                    <p className="text-base font-black text-black mt-0.5">
                      ₹{Math.round(monthlyCompositionGst * 0.5).toLocaleString('en-IN')}/mo
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Flat GST (1%)</span>
                    <p className="text-base font-black text-emerald-800 mt-0.5">
                      ₹{Math.round(monthlyCompositionGst).toLocaleString('en-IN')}/mo
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 text-xs space-y-2">
                  <p className="font-bold text-black flex items-center gap-1.5">
                    <Info size={14} className="text-black" />
                    Key Benefits for {storeName}:
                  </p>
                  <ul className="space-y-1 text-neutral-700 list-disc list-inside">
                    <li>No need to issue itemized GST tax invoices or collect GST from customers.</li>
                    <li>Only 1 simple quarterly return (CMP-08) due on the 18th of the month following the quarter.</li>
                    <li>Zero accounting overhead — saves ₹15,000–₹25,000/year in chartered accountant filing fees.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-300">
                    <span className="text-[10px] text-neutral-500 font-bold block">0% Nil Rate</span>
                    <span className="font-black text-black text-sm">₹0</span>
                    <span className="text-[10px] text-neutral-500 block">₹{Math.round(monthlySlab0Sales).toLocaleString('en-IN')} vol</span>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-300">
                    <span className="text-[10px] text-neutral-500 font-bold block">5% Slab (Oil/Tea)</span>
                    <span className="font-black text-black text-sm">₹{Math.round(outputGst5).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-neutral-500 block">₹{Math.round(monthlySlab5Sales).toLocaleString('en-IN')} vol</span>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-300">
                    <span className="text-[10px] text-neutral-500 font-bold block">12% Slab (Ghee)</span>
                    <span className="font-black text-black text-sm">₹{Math.round(outputGst12).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-neutral-500 block">₹{Math.round(monthlySlab12Sales).toLocaleString('en-IN')} vol</span>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-300">
                    <span className="text-[10px] text-neutral-500 font-bold block">18% (Soaps/Detergent)</span>
                    <span className="font-black text-black text-sm">₹{Math.round(outputGst18).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-neutral-500 block">₹{Math.round(monthlySlab18Sales).toLocaleString('en-IN')} vol</span>
                  </div>
                </div>

                <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Gross Output GST on Sales:</span>
                    <span className="font-mono font-bold text-sm">₹{Math.round(grossMonthlyOutputGst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>Input Tax Credit (ITC Claimed from Stock Invoices):</span>
                    <span className="font-mono font-bold text-sm">-₹{Math.round(estimatedMonthlyItc).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-700 flex justify-between items-center text-sm font-black text-white">
                    <span>Net GST Payable via Electronic Cash Ledger:</span>
                    <span className="font-mono text-emerald-400 text-base">₹{Math.round(netMonthlyRegularGst).toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kirana HSN Quick-Reference Cheat Sheet */}
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="text-xs font-black uppercase tracking-wider text-black mb-3">
              Essential Kirana HSN Codes & GST Rates Reference
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-mono font-bold text-[11px] text-black block">HSN 1006</span>
                <span className="text-[11px] text-neutral-700">Rice & Wheat Grains</span>
                <span className="text-[10px] font-bold text-emerald-700 block mt-1">0% (Unbranded)</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-mono font-bold text-[11px] text-black block">HSN 1512</span>
                <span className="text-[11px] text-neutral-700">Mustard & Edible Oil</span>
                <span className="text-[10px] font-bold text-blue-700 block mt-1">5% GST</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-mono font-bold text-[11px] text-black block">HSN 0405</span>
                <span className="text-[11px] text-neutral-700">Butter & Desi Ghee</span>
                <span className="text-[10px] font-bold text-amber-700 block mt-1">12% GST</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-mono font-bold text-[11px] text-black block">HSN 3401</span>
                <span className="text-[11px] text-neutral-700">Soaps & Detergents</span>
                <span className="text-[10px] font-bold text-red-700 block mt-1">18% GST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
