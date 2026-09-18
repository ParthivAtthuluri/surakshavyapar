import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  Receipt,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Store,
  Clock,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  RotateCcw,
  Tag,
  FileText
} from 'lucide-react';
import { Transaction } from '../types';

interface SmartTreasurerProps {
  amount: string;
  setAmount: (val: string) => void;
  itemNote: string;
  setItemNote: (val: string) => void;
  currentTxId: string;
  generateNewTxId: () => void;
  transactions: Transaction[];
  onOpenMobileView: () => void;
  storeName: string;
  setStoreName: (name: string) => void;
}

interface KiranaCatalogItem {
  id: string;
  name: string;
  hindiName: string;
  price: number;
  category: string;
}

interface BilledLineItem {
  id: string;
  name: string;
  hindiName?: string;
  price: number;
  quantity: number;
}

// Realistic Kirana Store Stock Catalog with ₹300 item and everyday grocery essentials
const KIRANA_CATALOG: KiranaCatalogItem[] = [
  { id: 'rice-300', name: 'Basmati Rice 5kg', hindiName: 'बासमती चावल 5 किग्रा', price: 300, category: 'Staples' },
  { id: 'oil-145', name: 'Fortune Mustard Oil 1L', hindiName: 'सरसों का तेल 1 ली', price: 145, category: 'Edible Oil' },
  { id: 'atta-240', name: 'Aashirvaad Chakki Atta 5kg', hindiName: 'आशीर्वाद आटा 5 किग्रा', price: 240, category: 'Flour' },
  { id: 'dal-160', name: 'Toor Dal Premium 1kg', hindiName: 'अरहर / तुअर दाल 1 किग्रा', price: 160, category: 'Pulses' },
  { id: 'tea-190', name: 'Assam Tea & Sugar Pack', hindiName: 'चाय पत्ती व चीनी 1 किग्रा', price: 190, category: 'Beverages' },
  { id: 'salt-65', name: 'Tata Salt & Haldi Combo', hindiName: 'टाटा नमक व हल्दी कॉम्बो', price: 65, category: 'Spices' },
  { id: 'soap-130', name: 'Surf Excel Detergent 1kg', hindiName: 'सर्फ एक्सेल पाउडर 1 किग्रा', price: 130, category: 'Cleaning' },
  { id: 'snacks-85', name: 'Maggi & Namkeen Combo', hindiName: 'मैगी व भुजिया पैकेट', price: 85, category: 'Snacks' },
];

export const SmartTreasurer: React.FC<SmartTreasurerProps> = ({
  amount,
  setAmount,
  itemNote,
  setItemNote,
  currentTxId,
  generateNewTxId,
  transactions,
  onOpenMobileView,
  storeName,
  setStoreName,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrScanTarget, setQrScanTarget] = useState<'universal' | 'upi'>('universal');
  const [upiVpa] = useState<string>(() => 
    `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'srilakshmi'}@upi`
  );

  // Live Customer Bill items state
  const [billedItems, setBilledItems] = useState<BilledLineItem[]>([
    { id: 'rice-300', name: 'Basmati Rice 5kg', hindiName: 'बासमती चावल 5 किग्रा', price: 300, quantity: 1 }
  ]);

  // Custom Item input state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Mobile test URL including the customized store name (scannable by any phone camera or QR app)
  const mobilePayUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?tx_id=${currentTxId}&amount=${amount || '300'}&store_name=${encodeURIComponent(storeName || 'Sri Lakshmi General Store')}`
    : '';

  // Dynamic UPI payment URI strictly formatted with Payee Name (pn), Transaction Note (tn), merchant code (mc)
  const upiString = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(storeName || 'Merchant')}&mc=5411&tid=${currentTxId}&tr=${currentTxId}&tn=${encodeURIComponent('Payment to ' + (storeName || 'Merchant'))}&am=${amount || '0'}&cu=INR`;

  const activeQrPayload = qrScanTarget === 'universal' ? mobilePayUrl : upiString;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobilePayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Helper to sync bill total with amount & itemNote in parent
  const syncBillWithParent = (updatedItems: BilledLineItem[]) => {
    setBilledItems(updatedItems);
    const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setAmount(String(total));
    if (updatedItems.length > 0) {
      const note = updatedItems.map(i => `${i.name} (x${i.quantity})`).join(', ');
      setItemNote(note.slice(0, 90));
    } else {
      setItemNote('Kirana Counter Sale');
    }
  };

  // Click on a Kirana Stock Button
  const handleAddStockItem = (item: KiranaCatalogItem) => {
    const existing = billedItems.find(i => i.id === item.id);
    let updated: BilledLineItem[];
    if (existing) {
      updated = billedItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      updated = [...billedItems, { 
        id: item.id, 
        name: item.name, 
        hindiName: item.hindiName, 
        price: item.price, 
        quantity: 1 
      }];
    }
    syncBillWithParent(updated);
  };

  const handleIncrementQty = (id: string) => {
    const updated = billedItems.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
    syncBillWithParent(updated);
  };

  const handleDecrementQty = (id: string) => {
    const updated = billedItems
      .map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    syncBillWithParent(updated);
  };

  const handleRemoveLineItem = (id: string) => {
    const updated = billedItems.filter(i => i.id !== id);
    syncBillWithParent(updated);
  };

  const handleClearBill = () => {
    syncBillWithParent([]);
    setAmount('0');
    setItemNote('Kirana Counter Sale');
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    const price = parseFloat(customItemPrice) || 50;
    const newItem: BilledLineItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      price,
      quantity: 1,
    };
    syncBillWithParent([...billedItems, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const totalVerifiedRevenue = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalVerifiedCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const fraudCount = transactions.filter((t) => t.status === 'FRAUD').length;

  const totalItemsCount = billedItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div id="smart-treasurer-section" className="space-y-6">
      {/* Module Title & Store Name Configuration Bar */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                Point of Sale
              </span>
              <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                Kirana Billing & Dynamic UPI
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black mt-1 flex items-center gap-2">
              <QrCode size={24} className="text-black" />
              Smart Treasurer: Kirana Counter & Live QR
            </h2>
            <p className="text-sm text-neutral-600 mt-0.5">
              Click Kirana stock buttons to generate instant customer bills with dynamic auto-updated UPI QR codes.
            </p>
          </div>

          {/* Store Name Input Box */}
          <div className="bg-neutral-50 border-2 border-neutral-300 rounded-xl p-3 flex flex-col gap-1.5 w-full lg:w-96">
            <div className="flex items-center justify-between">
              <label htmlFor="store-name-input" className="text-xs font-bold text-black flex items-center gap-1.5">
                <Store size={14} />
                Store / Merchant Name:
              </label>
              <span className="text-[10px] font-medium text-neutral-500">Shows on customer pay screen</span>
            </div>
            <div className="flex gap-2">
              <input
                id="store-name-input"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Sri Lakshmi General Store"
                className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition"
              />
              <button
                type="button"
                onClick={() => setStoreName('Sri Lakshmi General Store')}
                title="Reset to default store name"
                className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-bold rounded-lg transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-emerald-500 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(16,185,129,1)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Today's Verified Sales</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalVerifiedRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Verified Orders</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{totalVerifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
            <Receipt size={20} />
          </div>
        </div>

        <div className="bg-white border-2 border-red-500 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Scams Blocked</p>
            <p className="text-2xl font-black text-red-600 mt-1">{fraudCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-100 border border-red-300 text-red-700 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Main Billing Studio: Stock Buttons on Left, Live Bill in Center/Beside, and QR Code on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Kirana Stock Item Clickable Buttons */}
        <div className="lg:col-span-4 bg-white border-2 border-black rounded-2xl p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <ShoppingBag size={15} /> Kirana Stock Items
              </span>
              <p className="text-[11px] text-neutral-500 font-medium">
                Tap button to add item to the bill
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
              8 Presets
            </span>
          </div>

          {/* Clickable Kirana Item Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {KIRANA_CATALOG.map((item) => {
              const billed = billedItems.find(b => b.id === item.id);
              const qtyInBill = billed ? billed.quantity : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddStockItem(item)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition relative flex items-center justify-between gap-3 group active:scale-[0.98] ${
                    qtyInBill > 0
                      ? 'border-black bg-neutral-50 shadow-xs'
                      : 'border-neutral-300 bg-white hover:border-black hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-black truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 block truncate">
                      {item.hindiName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                      {item.category}
                    </span>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    {qtyInBill > 0 && (
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                        {qtyInBill}
                      </span>
                    )}
                    <span className="text-sm font-black text-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-300 group-hover:bg-black group-hover:text-white transition">
                      ₹{item.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Custom Off-Shelf Item Form */}
          <form onSubmit={handleAddCustomItem} className="pt-3 border-t border-neutral-200 space-y-2">
            <span className="text-xs font-bold text-black flex items-center gap-1">
              <Plus size={13} /> Add Custom Kirana Item:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Item name (e.g. Ghee 500g)"
                className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
              />
              <input
                type="number"
                min="1"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value)}
                placeholder="₹ Price"
                className="w-20 bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={!customItemName.trim()}
                className="px-3 py-1.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
              >
                Add
              </button>
            </div>
          </form>

          {/* Quick Manual Amount Override */}
          <div className="pt-2 border-t border-neutral-200 space-y-1.5">
            <label htmlFor="direct-amount-input" className="text-[11px] font-bold text-neutral-600 uppercase block">
              Manual Lump-Sum Amount Override:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black font-black text-sm">₹</span>
              <input
                id="direct-amount-input"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-white border border-neutral-300 rounded-lg pl-7 pr-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Live Customer Bill (Beside the stock buttons!) */}
        <div className="lg:col-span-4 bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          {/* Bill Receipt Header */}
          <div className="border-b-2 border-dashed border-neutral-300 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
                RETAIL CASH MEMO
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  {currentTxId}
                </span>
                <button
                  onClick={generateNewTxId}
                  title="New Bill Token / ID"
                  className="p-1 hover:bg-neutral-100 text-black rounded border border-neutral-300 transition"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            <h3 className="font-black text-base text-black mt-1.5 truncate">
              {storeName}
            </h3>
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-0.5">
              <span>Counter Bill #1</span>
              <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Itemized Bill Line Items Table */}
          <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {billedItems.map((item) => (
              <div 
                key={item.id}
                className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-black block truncate">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    ₹{item.price} each
                  </span>
                </div>

                {/* Qty +/- buttons */}
                <div className="flex items-center gap-1.5 bg-white px-1.5 py-0.5 rounded-lg border border-neutral-300">
                  <button
                    type="button"
                    onClick={() => handleDecrementQty(item.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:bg-neutral-200 hover:text-black font-bold text-xs transition"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-black font-mono w-4 text-center text-black">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrementQty(item.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:bg-neutral-200 hover:text-black font-bold text-xs transition"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0 w-16">
                  <span className="font-black text-xs text-black font-mono">
                    ₹{item.price * item.quantity}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveLineItem(item.id)}
                  className="text-neutral-400 hover:text-red-600 p-1 transition"
                  title="Remove from bill"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {billedItems.length === 0 && (
              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                <Receipt size={28} className="mx-auto text-neutral-400 mb-1.5" />
                <p className="text-xs font-bold text-neutral-600">Bill is Empty</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Click any Kirana item button on the left to add items to this customer's bill.
                </p>
              </div>
            )}
          </div>

          {/* Bill Calculation & Grand Total */}
          <div className="pt-3 border-t-2 border-dashed border-neutral-300 space-y-2">
            <div className="flex justify-between text-xs text-neutral-600">
              <span>Total Items:</span>
              <span className="font-mono font-bold text-black">{billedItems.length} lines ({totalItemsCount} units)</span>
            </div>

            <div className="flex justify-between items-baseline pt-1 border-t border-neutral-200">
              <div>
                <span className="text-xs font-black uppercase text-black block">
                  Grand Total:
                </span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Dynamic QR Synchronized
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-black font-mono">
                  ₹{Number(amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Bill Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleClearBill}
                disabled={billedItems.length === 0}
                className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw size={13} /> Clear / New Bill
              </button>
              <button
                type="button"
                onClick={() => handleAddStockItem(KIRANA_CATALOG[0])}
                className="py-2 px-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition"
                title="Quick Add ₹300 Basmati Rice"
              >
                +₹300 Quick
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Live Dynamic Countertop QR Terminal */}
        <div className="lg:col-span-4 bg-white border-2 border-black rounded-2xl p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-full flex items-center justify-between pb-2.5 border-b border-neutral-200">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black">
              <Store size={14} className="text-emerald-600" />
              <span>Countertop QR</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
              Live Intent
            </span>
          </div>

          {/* QR Target Scanner Mode Toggle */}
          <div className="w-full bg-neutral-100 p-1 rounded-xl border border-neutral-300 flex text-xs font-bold">
            <button
              type="button"
              onClick={() => setQrScanTarget('universal')}
              className={`flex-1 py-1 px-1.5 rounded-lg transition text-center text-[11px] ${
                qrScanTarget === 'universal'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              📱 Universal Camera
            </button>
            <button
              type="button"
              onClick={() => setQrScanTarget('upi')}
              className={`flex-1 py-1 px-1.5 rounded-lg transition text-center text-[11px] ${
                qrScanTarget === 'upi'
                  ? 'bg-black text-white shadow-xs font-black'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              ⚡ Banking UPI
            </button>
          </div>

          {/* Merchant Verified Badge */}
          <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-1.5 px-3 flex items-center justify-between">
            <div className="text-left truncate">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Payee:</span>
              <span className="text-xs font-black text-black truncate block">{storeName}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
              <CheckCircle2 size={11} className="text-emerald-600" /> Verified
            </span>
          </div>

          {/* QR Code Canvas */}
          <div className="bg-white p-3.5 rounded-2xl shadow-md border-2 border-black relative">
            <QRCode 
              value={activeQrPayload} 
              size={160} 
              viewBox={`0 0 256 256`}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
            <div className="mt-1.5 pt-1.5 border-t border-neutral-200 text-[11px] font-mono text-neutral-600 truncate max-w-[190px] mx-auto">
              Scan shows: <strong className="text-black font-bold">{storeName}</strong>
            </div>
          </div>

          {/* Amount and Ref Display */}
          <div className="w-full space-y-2">
            <div>
              <span className="text-2xl font-black text-black block">
                ₹{Number(amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-mono text-neutral-500 block">
                Txn Ref: {currentTxId}
              </span>
            </div>

            {/* Mobile test actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-white hover:bg-neutral-100 text-black text-xs font-bold py-2 px-2.5 rounded-xl border-2 border-black flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied Pay Link!' : 'Copy Pay Link'}
              </button>
              <button
                onClick={() => window.open(mobilePayUrl, '_blank')}
                title="Open payment screen in new tab"
                className="bg-neutral-100 hover:bg-neutral-200 text-black p-2 rounded-xl border border-neutral-300 transition"
              >
                <ExternalLink size={15} />
              </button>
            </div>

            <button
              onClick={onOpenMobileView}
              className="w-full bg-black hover:bg-neutral-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Smartphone size={14} /> Open Customer Phone Simulator
            </button>
          </div>
        </div>
      </div>

      {/* Daily Sales Ledger (Live Transaction Feed) */}
      <div id="daily-sales-ledger" className="bg-white border-2 border-black rounded-2xl p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xl text-black">
                Daily Sales Ledger (Live Transaction Feed)
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Real-time feed of all customer payments and blocked fraud attempts streaming live from the database.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-black bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-300 w-fit">
            {transactions.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-800">
            <thead className="bg-neutral-100 text-black font-black uppercase text-xs tracking-wider border-b-2 border-black">
              <tr>
                <th className="p-3.5">Txn ID</th>
                <th className="p-3.5">Item Reference / Bill Note</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-50 transition">
                  <td className="p-3.5 font-mono text-xs text-black font-bold">
                    {tx.id}
                  </td>
                  <td className="p-3.5 text-neutral-700">
                    {tx.item_note || `${storeName} Retail Sale`}
                  </td>
                  <td className="p-3.5 text-black font-black text-base">
                    ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5">
                    {tx.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 size={13} className="text-emerald-600" /> VERIFIED
                      </span>
                    ) : tx.status === 'FRAUD' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-300 animate-pulse">
                        <AlertTriangle size={13} className="text-red-600" /> FRAUD PREVENTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock size={13} className="text-amber-600" /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-xs text-neutral-500 font-mono">
                    {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-neutral-500 font-medium">
                    No transactions recorded yet today. Click "Open Customer Phone Simulator" to test live settlement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
