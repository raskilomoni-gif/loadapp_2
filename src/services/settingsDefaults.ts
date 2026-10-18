import { AppSettings, SUPPORTED_CURRENCIES } from '../types/settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  shipperProfile: {
    accountType: 'company',
    legalName: 'East Africa Intermodal Freight & Agro-Logistics Ltd',
    tradeName: 'AeroPrecision Rift Freight',
    contactPerson: 'David K. Mwangi (Logistics Director)',
    email: 'logistics@eafreight.co.ke',
    phone: '+254 712 345 678',
    address: 'Mombasa Road, Inland Container Depot (ICD) Gate 3',
    city: 'Nairobi',
    state: 'Nairobi County',
    postalCode: '00100',
    country: 'Kenya',
    tinNumber: 'P051948201Z', // KRA Tax PIN / East Africa TIN
    vatNumber: 'KE-VAT-0948201', // National VAT ID
  },
  shipperBanking: {
    bankName: 'KCB Bank Kenya (Commercial Trade Branch)',
    accountHolder: 'East Africa Intermodal Freight & Agro-Logistics Ltd',
    accountNumber: '1109482019',
    routingNumber: '01100', // Bank Sort Code
    iban: 'KE89KCBL0110001109482019',
    swiftBic: 'KCBLKENX',
    payoutMethod: 'bank_wire',
    mobileMoneyProvider: 'M-Pesa Business Till',
    mobileMoneyNumber: '+254 712 345 678',
    isVerified: true,
  },
  truckerProfile: {
    accountType: 'company',
    legalName: 'Great Lakes Heavy Transit Haulers Ltd',
    tradeName: 'Simba Cross-Border Transport',
    contactPerson: 'Marcus "Mac" Vance (Fleet Operator)',
    email: 'operations@simbatransport.co.ke',
    phone: '+254 722 984 012',
    address: 'Mbaraki Freight Terminal, Port Reitz Road',
    city: 'Mombasa',
    state: 'Coast Region',
    postalCode: '80100',
    country: 'Kenya',
    tinNumber: 'A008294192M', // Tax PIN
    vatNumber: 'KE-VAT-8492019',
    eacTransitPermit: 'EAC-CROSS-BORDER-TRK-9402', // Regional Transit Permit (No DOT)
    carrierLicense: 'NTSA-CVL-48201',
  },
  truckerBanking: {
    bankName: 'Equity Bank East Africa (Logistics Center)',
    accountHolder: 'Great Lakes Heavy Transit Haulers Ltd',
    accountNumber: '018029482019',
    routingNumber: '06800',
    iban: 'KE44EQBL0680001802948201',
    swiftBic: 'EQBLKENA',
    payoutMethod: 'fuel_card',
    mobileMoneyProvider: 'M-Pesa (Safaricom)',
    mobileMoneyNumber: '+254 722 984 012',
    fuelCardProvider: 'TotalEnergies Fleet Commercial Card',
    fuelCardNumber: '7088-4412-9840-9921',
    isVerified: true,
  },
  currency: SUPPORTED_CURRENCIES[0], // USD standard default, user can switch to KES, UGX, TZS, RWF anytime
  notifications: {
    emailEscrowUpdates: true,
    smsArrivalAlerts: true,
    paymentReceipts: true,
  },
};
