export type AccountType = 'company' | 'individual';

export interface CompanyOrPersonalProfile {
  accountType: AccountType;
  legalName: string;
  tradeName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string; // Region / County / District
  postalCode: string;
  country: string;
  tinNumber: string; // Tax Identification Number (e.g. KRA PIN, URA TIN, TRA TIN)
  vatNumber: string; // Value Added Tax Registration Number
  eacTransitPermit?: string; // East Africa Cross-Border Road Transit Permit / COMESA Yellow Card
  carrierLicense?: string; // Regional Commercial Road Transport License (e.g. NTSA / UNRA / LATRA)
}

export type PayoutMethod = 'mobile_money' | 'fuel_card' | 'bank_wire' | 'escrow_wallet';

export interface BankingInfo {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string; // Branch Code or Bank Sort Code
  iban: string;
  swiftBic: string;
  payoutMethod: PayoutMethod;
  mobileMoneyProvider?: string; // M-Pesa (Safaricom), Airtel Money, MTN MoMo
  mobileMoneyNumber?: string;
  fuelCardProvider?: string; // TotalEnergies Fleet, Rubis Card, Vivo Shell Fleet, Hass Card
  fuelCardNumber?: string;
  isVerified: boolean;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  rateToUsd: number;
}

// User specified: keep the Dollar and add East African currencies
export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1.0 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rateToUsd: 130.0 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rateToUsd: 3720.0 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rateToUsd: 2620.0 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', rateToUsd: 1350.0 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'ETB', rateToUsd: 125.0 },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: 'SSP', rateToUsd: 1300.0 },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', rateToUsd: 2900.0 },
];

// Average diesel price per liter in USD for each country (2024-2025 benchmarks)
// Keyed by currency code — when a currency is chosen, the diesel price auto-sets
export const COUNTRY_DIESEL_PRICES_USD_PER_LITER: Record<string, number> = {
  USD: 1.05,  // US average
  KES: 1.48,  // Kenya (~KSh 192/L)
  UGX: 1.52,  // Uganda (~USh 5,660/L)
  TZS: 1.35,  // Tanzania (~TSh 3,540/L)
  RWF: 1.58,  // Rwanda (~RWF 2,133/L)
  ETB: 1.12,  // Ethiopia (~ETB 140/L)
  SSP: 1.68,  // South Sudan (~SSP 2,184/L)
  BIF: 1.65,  // Burundi (~FBu 4,785/L)
};

export function getDieselPriceForCurrency(currencyCode: string): number {
  return COUNTRY_DIESEL_PRICES_USD_PER_LITER[currencyCode] ?? 1.25;
}

export interface AppSettings {
  shipperProfile: CompanyOrPersonalProfile;
  shipperBanking: BankingInfo;
  truckerProfile: CompanyOrPersonalProfile;
  truckerBanking: BankingInfo;
  currency: CurrencyConfig;
  notifications: {
    emailEscrowUpdates: boolean;
    smsArrivalAlerts: boolean;
    paymentReceipts: boolean;
  };
}
