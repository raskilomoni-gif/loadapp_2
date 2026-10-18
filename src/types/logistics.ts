export type TruckType =
  | 'semi_flatbed'
  | 'dry_van'
  | 'refrigerated'
  | 'box_truck'
  | 'heavy_haul'
  | 'pickup_sprinter';

export interface TruckTypeInfo {
  id: TruckType;
  name: string;
  maxWeightTonnes: number; // Metric tonnes
  maxWeightTons?: number;
  category: string;
  iconName: string;
  description: string;
  baseRatePerKm: number; // Rate per kilometer
  baseRatePerMile?: number;
}

export interface ReviewCriteria {
  label: string;
  rating: number; // 1 to 5
}

export interface ReviewData {
  id: string;
  tripId: string;
  reviewerRole: 'shipper' | 'trucker';
  reviewerName: string;
  reviewerAvatar?: string;
  targetRole: 'shipper' | 'trucker';
  targetName: string;
  rating: number; // 1 to 5
  subRatings: ReviewCriteria[];
  tags: string[];
  comment: string;
  createdAt: string;
}

export interface Trucker {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  tripsCompleted: number;
  truckType: TruckType;
  truckModel: string;
  plateNumber: string;
  permitNumber: string; // Regional EAC Transit Permit / Commercial Transport License (No DOT)
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  isOnline: boolean;
  ratePerKm: number; // Metric rate per km
  ratePerMile?: number; // Kept for backward compatibility
  walletBalance: number;
  fuelCardBalance: number;
  distanceToPickupKm: number; // Metric distance to pickup
  distanceToPickupMiles?: number;
  recentReviews?: ReviewData[];
}

export interface ShipperProfile {
  id: string;
  name: string;
  company: string;
  rating: number;
  tripsPosted: number;
  recentReviews: ReviewData[];
}

export interface Cargo {
  title: string;
  category: 'General Freight' | 'Machinery & Equipment' | 'Perishable / Cold Chain' | 'Building Materials' | 'Electronics' | 'Hazmat & Chemicals' | 'Automotive Parts';
  weightKg: number; // Kilograms
  weightTonnes: number; // Metric Tonnes
  weightLbs?: number;
  weightTons?: number;
  dimensions: {
    lengthM: number; // Meters
    widthM: number;
    heightM: number;
    lengthFt?: number;
    widthFt?: number;
    heightFt?: number;
  };
  palletsCount: number;
  isFragile: boolean;
  temperatureControlled: boolean;
  targetTempC?: number; // Celsius
  targetTempF?: number;
  description: string;
  cargoValueUsd: number;
  photos: string[];
}

export interface LocationPoint {
  address: string;
  city: string;
  state: string; // Region, District or County
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
  instructions?: string;
  isRemotelyPinned?: boolean; // Pinned by goods owner on the map remotely
  pinnedCoordinatesText?: string;
}

export type EscrowStatus =
  | 'AWAITING_INITIAL_DEPOSIT'
  | 'HELD_IN_ESCROW'
  | 'AWAITING_MUTUAL_APPROVAL'
  | 'RELEASED_TO_TRUCKER'
  | 'DISPUTED'
  | 'REFUNDED_TO_SHIPPER'
  | 'FORFEITED_TO_SHIPPER'
  | 'FORFEITED_TO_TRUCKER';

export interface DualEscrowVault {
  id: string;
  fuelAmountUsd: number; // Goods owner diesel guarantee deposit
  driverBondAmountUsd: number; // Trucker matching commitment bond (equals fuelAmountUsd to secure load)
  driverBondStatus: 'LOCKED' | 'AWARDED_TO_SHIPPER' | 'RETURNED_TO_DRIVER';
  totalEscrowLockedUsd: number; // Combined mutual escrow pool (2x fuel deposit)
  deadheadDistanceKm: number; // Metric kilometers
  deadheadDistanceMiles?: number;
  dieselPricePerLiter: number; // In Liters (benchmark ~$1.25/L)
  dieselPricePerGallon?: number;
  estimatedLiters: number; // Liters
  estimatedGallons?: number;
  status: EscrowStatus;
  shipperApproved: boolean;
  shipperApprovedAt?: string;
  truckerApproved: boolean;
  truckerApprovedAt?: string;
  releasedAt?: string;
  escrowContractHash: string;
  releaseTerms: string;
  dualSignOffCode: string;
  // User Prompt Guarantee Conditions:
  // 1. Geofence requirement: Payment only released when driver geolocation is at the pickup depot
  geofenceRadiusMeters: number; // e.g. 500m geofence radius
  driverDistanceToPickupKm: number;
  isDriverAtPickup: boolean; // Computed or simulated proximity match
  // 2. Auto-refund condition: If truck not at pickup at agreed time, diesel deposit returns to goods owner after agreed hours (default 3 hrs)
  agreedPickupTime: string; // e.g. "10:30 AM"
  autoRefundHours: number; // default 3 hours (customizable by goods owner)
  autoRefundDeadline: string; // e.g. "01:30 PM"
  autoRefundStatus: 'PENDING_ARRIVAL' | 'REFUNDED_TO_OWNER' | 'RELEASED_TO_DRIVER';
  refundedAt?: string;
  refundReason?: string;
  // Pre-pickup cancellation record:
  // If either cancels before pickup, counterparty receives the total escrow amount
  cancellationRecord?: {
    cancelledBy: 'shipper' | 'driver';
    cancelledAt: string;
    reason: string;
    payoutRecipient: 'shipper' | 'driver';
    totalPayoutUsd: number;
  };
}

export type AdvanceCalculationMode = 'percentage' | 'fixed_amount';

export interface AdvancePaymentTerms {
  amount: number; // Net Advance Loading Payment to be disbursed
  percentage: number; // Effective percentage of total freight
  mode?: AdvanceCalculationMode; // Filled by goods owner as 'percentage' or 'fixed_amount'
  grossAmount?: number; // Advance amount before diesel deduction
  grossAmountInCurrency?: number; // In selected active currency
  dieselDeducted?: number; // First diesel amount subtracted
  deductDiesel?: boolean; // Whether the first diesel deposit was deducted
  status: 'PENDING_ACCEPTANCE' | 'PENDING_PICKUP' | 'HELD_IN_ESCROW' | 'RELEASED';
  proposedBy?: 'shipper' | 'trucker' | 'system';
  acceptedByTrucker?: boolean; // Whether trucker has accepted the proposed advance terms
  acceptedByTruckerAt?: string;
  paidAt?: string;
}

export interface PaymentPlan {
  totalFreightCost: number;
  fuelEscrowDeposit: number; // Mobilization fuel security deposit (first diesel amount)
  driverBondDeposit?: number; // Matching trucker commitment deposit (equals fuelEscrowDeposit)
  advancePayment: AdvancePaymentTerms;
  finalPayment: {
    amount: number;
    percentage: number; // e.g. 60%
    status: 'PENDING_DELIVERY' | 'RELEASED';
    paidAt?: string;
  };
}

export type TripStatus =
  | 'MATCHING'
  | 'DISPATCHED'
  | 'AT_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED_BY_SHIPPER'
  | 'CANCELLED_BY_DRIVER';

export interface TripMilestone {
  key: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export interface ProofOfDelivery {
  recipientName: string;
  signatureDataUrl?: string;
  photoUrl?: string;
  notes?: string;
  timestamp: string;
  cargoCondition: 'EXCELLENT' | 'GOOD' | 'MINOR_ISSUES';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'shipper' | 'trucker' | 'system';
  content: string;
  timestamp: string;
  isQuickUpdate?: boolean;
}

export interface Trip {
  id: string;
  trackingNumber: string;
  createdAt: string;
  pickupDate?: string; // ISO date string - scheduled pickup date/time set by shipper
  estimatedDropoffDate?: string; // ISO date string - computed from pickupDate + estimatedDurationHours
  shipperId: string;
  shipperName: string;
  shipperPhone: string;
  cargo: Cargo;
  origin: LocationPoint;
  destination: LocationPoint;
  distanceKm: number; // Metric distance in kilometers
  distanceMiles?: number;
  estimatedDurationHours: number;
  trucker: Trucker | null;
  status: TripStatus;
  escrow: DualEscrowVault;
  payments: PaymentPlan;
  milestones: TripMilestone[];
  routeWaypoints: [number, number][];
  currentLocation: {
    lat: number;
    lng: number;
  };
  currentSpeedKmh: number; // Metric speed in km/h
  currentSpeedMph?: number;
  progressPercent: number;
  simulationActive: boolean;
  simulationSpeedMultiplier: number;
  proofOfDelivery?: ProofOfDelivery;
  messages: ChatMessage[];
  cargoTelemetry?: {
    temperatureC: number; // Metric Celsius
    temperatureF?: number;
    humidityPercent: number;
    vibrationG: number;
  };
  shipperReview?: ReviewData;
  driverReview?: ReviewData;
}
