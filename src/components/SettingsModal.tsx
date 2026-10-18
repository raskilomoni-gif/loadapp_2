import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Building2, 
  User, 
  CreditCard, 
  FileText, 
  Globe, 
  ShieldCheck, 
  Check, 
  Save, 
  RotateCcw, 
  Fuel, 
  DollarSign, 
  Truck, 
  Package, 
  Landmark, 
  CheckCircle2,
  Sparkles,
  Percent,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AppSettings, 
  CompanyOrPersonalProfile, 
  BankingInfo, 
  CurrencyConfig, 
  SUPPORTED_CURRENCIES,
  PayoutMethod
} from '../types/settings';
import { DEFAULT_APP_SETTINGS } from '../services/settingsDefaults';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'shipper' | 'trucker';
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  settings,
  onSaveSettings,
}) => {
  // Editing target: allow user to configure either Shipper or Trucker settings
  const [editingTarget, setEditingTarget] = useState<'shipper' | 'trucker'>(currentRole);
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'banking' | 'currency' | 'summary'>('profile');

  // Form states
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync when opened or target changes
  React.useEffect(() => {
    setLocalSettings(settings);
    setEditingTarget(currentRole);
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  const isEditingShipper = editingTarget === 'shipper';
  const profile = isEditingShipper ? localSettings.shipperProfile : localSettings.truckerProfile;
  const banking = isEditingShipper ? localSettings.shipperBanking : localSettings.truckerBanking;

  const updateProfile = (field: keyof CompanyOrPersonalProfile, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [isEditingShipper ? 'shipperProfile' : 'truckerProfile']: {
        ...profile,
        [field]: value,
      },
    }));
  };

  const updateBanking = (field: keyof BankingInfo, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [isEditingShipper ? 'shipperBanking' : 'truckerBanking']: {
        ...banking,
        [field]: value,
      },
    }));
  };

  const updateCurrency = (curr: CurrencyConfig) => {
    setLocalSettings((prev) => ({
      ...prev,
      currency: curr,
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981'],
    });
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_APP_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-450 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Logistics & Financial Settings</h3>
                <span className="text-[10px] bg-slate-800 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  {localSettings.currency.code} ({localSettings.currency.symbol})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage business details, tax (TIN/VAT), bank payout accounts & currency
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Switcher Subheader (Configure Goods Owner vs Trucker) */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Currently Configuring:</span>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTarget('shipper')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  editingTarget === 'shipper'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Goods Owner (Shipper)</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingTarget('trucker')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  editingTarget === 'trucker'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Trucker (Carrier)</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Account Status: <strong className="text-emerald-400">Verified &amp; Tax Compliant</strong>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company &amp; Personal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'tax'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Tax (TIN / VAT / DOT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banking')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'banking'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Banking &amp; Fuel Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('currency')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'currency'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Currency ({localSettings.currency.code})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Compliance Slip</span>
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: Profile & Company Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Registration Entity Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateProfile('accountType', 'company')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      profile.accountType === 'company'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Registered Business / LLC / Corp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProfile('accountType', 'individual')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      profile.accountType === 'individual'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Individual / Sole Proprietor</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    {profile.accountType === 'company' ? 'Legal Business Name' : 'Full Legal Personal Name'}
                  </label>
                  <input
                    type="text"
                    value={profile.legalName}
                    onChange={(e) => updateProfile('legalName', e.target.value)}
                    placeholder="e.g. AeroPrecision Industrial Dynamics LLC"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Trading / Operating Name (DBA)
                  </label>
                  <input
                    type="text"
                    value={profile.tradeName}
                    onChange={(e) => updateProfile('tradeName', e.target.value)}
                    placeholder="e.g. AeroPrecision Freight"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Authorized Contact Person
                  </label>
                  <input
                    type="text"
                    value={profile.contactPerson}
                    onChange={(e) => updateProfile('contactPerson', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Registered Operating Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => updateProfile('address', e.target.value)}
                  placeholder="Street Address, Depot Gate, Suite"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => updateProfile('city', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => updateProfile('state', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Postal / Zip Code</label>
                  <input
                    type="text"
                    value={profile.postalCode}
                    onChange={(e) => updateProfile('postalCode', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={profile.country}
                    onChange={(e) => updateProfile('country', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tax, TIN & VAT Numbers */}
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <Receipt className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Tax Compliance &amp; Freight Invoicing</h4>
                  <p className="text-[11px] text-slate-400">
                    Your TIN and VAT numbers are automatically printed on official Escrow receipts, Bills of Lading, and payout statements.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Tax Identification Number (TIN / EIN / SSN)
                    </label>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      Required for Escrow
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Federal Employer Identification Number (EIN) or Individual Tax ID.
                  </p>
                  <input
                    type="text"
                    value={profile.tinNumber}
                    onChange={(e) => updateProfile('tinNumber', e.target.value)}
                    placeholder="e.g. 36-4920184"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      VAT Registration Number (Value Added Tax)
                    </label>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      Tax Exempt / Invoiced
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    National VAT / GST identification for commercial tax exemption.
                  </p>
                  <input
                    type="text"
                    value={profile.vatNumber}
                    onChange={(e) => updateProfile('vatNumber', e.target.value)}
                    placeholder="e.g. US-IL-9948201 or GB-123456789"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Trucker Specific Regional Credentials (East Africa Cross-Border) */}
              {!isEditingShipper && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-400" />
                      East Africa Transit &amp; Carrier Credentials
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                      EAC Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        EAC Cross-Border Transit Permit #
                      </label>
                      <input
                        type="text"
                        value={profile.eacTransitPermit || ''}
                        onChange={(e) => updateProfile('eacTransitPermit', e.target.value)}
                        placeholder="e.g. EAC-CROSS-BORDER-TRK-9402"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Commercial Road Transport License #
                      </label>
                      <input
                        type="text"
                        value={profile.carrierLicense || ''}
                        onChange={(e) => updateProfile('carrierLicense', e.target.value)}
                        placeholder="e.g. NTSA-CVL-48201 / UNRA / LATRA"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Banking & Payouts */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white uppercase block">
                    Escrow &amp; Payout Routing Method
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isEditingShipper
                      ? 'Account debited for mobilization fuel deposit & freight releases'
                      : 'Account credited when fuel escrow and final deliveries are released'}
                  </p>
                </div>

                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Bank Account Linked
                </span>
              </div>

              {/* Payout method radio selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Preferred Disbursement Channel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'ach', label: 'ACH Transfer', desc: '1-2 Days • Free' },
                    { id: 'wire', label: 'Federal Wire', desc: 'Same Day • $15' },
                    { id: 'fuel_card', label: 'Fleet Fuel Card', desc: 'Instant • Fuel Lock' },
                    { id: 'instant_debit', label: 'Debit Card', desc: 'Instant • 1%' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => updateBanking('payoutMethod', method.id as PayoutMethod)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        banking.payoutMethod === method.id
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <strong className="block text-white text-[11px]">{method.label}</strong>
                      <span className="text-[10px] text-slate-500">{method.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Financial Institution / Bank Name
                  </label>
                  <input
                    type="text"
                    value={banking.bankName}
                    onChange={(e) => updateBanking('bankName', e.target.value)}
                    placeholder="e.g. JPMorgan Chase Bank N.A."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Account Holder Legal Name
                  </label>
                  <input
                    type="text"
                    value={banking.accountHolder}
                    onChange={(e) => updateBanking('accountHolder', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    value={banking.accountNumber}
                    onChange={(e) => updateBanking('accountNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Routing Number (ABA) / Sort Code / SWIFT
                  </label>
                  <input
                    type="text"
                    value={banking.routingNumber}
                    onChange={(e) => updateBanking('routingNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Trucker Fuel Card Config */}
              {!isEditingShipper && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-amber-400" />
                      Direct Mobilization Fuel Card Integration
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                      Dual-Escrow Linked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Fuel Card Network
                      </label>
                      <select
                        value={banking.fuelCardProvider || 'EFS Commercial Fleet Card'}
                        onChange={(e) => updateBanking('fuelCardProvider', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="EFS Commercial Fleet Card">EFS Commercial Fleet Card</option>
                        <option value="Comdata Fleet Card">Comdata Fleet Card</option>
                        <option value="Fleet One Card">Fleet One Card</option>
                        <option value="WEX Fleet Card">WEX Fuel Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Card Number (Masked)
                      </label>
                      <input
                        type="text"
                        value={banking.fuelCardNumber || ''}
                        onChange={(e) => updateBanking('fuelCardNumber', e.target.value)}
                        placeholder="7088-4412-9840-9921"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Currency & Localization */}
          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-white uppercase block mb-1">
                  Active Display Currency: {localSettings.currency.name} ({localSettings.currency.code} - {localSettings.currency.symbol})
                </span>
                <p className="text-[11px] text-slate-400">
                  Select your preferred operating currency. All freight prices, deadhead fuel escrow deposits, and driver payouts will automatically display in this currency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = localSettings.currency.code === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => updateCurrency(curr)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white">{curr.code}</span>
                          <span className="text-xs font-bold text-amber-400 font-mono">({curr.symbol})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{curr.name}</span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sample conversion preview */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Demo Escrow Conversion</span>
                  <span className="text-slate-300">Base $185.00 USD Fuel Deposit equals:</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-400">
                    {localSettings.currency.symbol}
                    {Math.round(185 * localSettings.currency.rateToUsd).toLocaleString()} {localSettings.currency.code}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Official Compliance Slip */}
          {activeTab === 'summary' && (
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm">HAULFLOW COMPLIANCE PASSPORT</h4>
                  <span className="text-[10px] text-slate-500">Document Hash: 0x8849c-f910-tin-vat</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                  VERIFIED REGISTERED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-slate-500 uppercase block">Account Holder</span>
                  <span className="font-bold text-white">{profile.legalName}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">Entity Classification</span>
                  <span className="font-bold text-white uppercase">{profile.accountType}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">Tax ID Number (TIN/EIN)</span>
                  <span className="font-bold text-amber-400">{profile.tinNumber || 'PENDING'}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">VAT Registration</span>
                  <span className="font-bold text-emerald-400">{profile.vatNumber || 'NOT REGISTERED'}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">Primary Bank</span>
                  <span className="font-bold text-white">{banking.bankName}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">Disbursement Route</span>
                  <span className="font-bold text-white uppercase">{banking.payoutMethod}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                Official profile used for 2-phase freight payouts, mutual fuel escrow authorization, and tax reporting.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                savedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-amber-500 hover:bg-amber-450 text-slate-950 shadow-amber-500/25 active:scale-[0.98]'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
