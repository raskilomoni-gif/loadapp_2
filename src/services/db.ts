import { supabase } from './supabaseClient';
import { Trip, Trucker, Cargo, LocationPoint, DualEscrowVault, PaymentPlan, TripMilestone, ChatMessage, ReviewData } from '../types/logistics';

interface TruckerRow {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  trips_completed: number;
  truck_type: string;
  truck_model: string;
  plate_number: string;
  permit_number: string;
  current_location: { lat: number; lng: number; address: string };
  is_online: boolean;
  rate_per_km: number;
  wallet_balance: number;
  fuel_card_balance: number;
  distance_to_pickup_km: number;
  recent_reviews: ReviewData[] | null;
}

interface TripRow {
  id: string;
  tracking_number: string;
  created_at: string;
  shipper_id: string;
  shipper_name: string;
  shipper_phone: string;
  trucker_id: string | null;
  status: string;
  origin: LocationPoint;
  destination: LocationPoint;
  distance_km: number;
  estimated_duration_hours: number;
  current_location: { lat: number; lng: number };
  current_speed_kmh: number;
  progress_percent: number;
  simulation_active: boolean;
  simulation_speed_multiplier: number;
  route_waypoints: [number, number][];
  cargo_telemetry: { temperatureC: number; temperatureF: number; humidityPercent: number; vibrationG: number } | null;
  proof_of_delivery: any;
  shipper_review: ReviewData | null;
  driver_review: ReviewData | null;
}

interface CargoRow {
  trip_id: string;
  title: string;
  category: string;
  weight_kg: number;
  weight_tonnes: number;
  dimensions: any;
  pallets_count: number;
  is_fragile: boolean;
  temperature_controlled: boolean;
  target_temp_c: number | null;
  description: string;
  cargo_value_usd: number;
  photos: string[];
}

interface EscrowRow {
  trip_id: string;
  fuel_amount_usd: number;
  driver_bond_amount_usd: number;
  driver_bond_status: string;
  total_escrow_locked_usd: number;
  deadhead_distance_km: number;
  diesel_price_per_liter: number;
  estimated_liters: number;
  status: string;
  shipper_approved: boolean;
  shipper_approved_at: string | null;
  trucker_approved: boolean;
  trucker_approved_at: string | null;
  released_at: string | null;
  escrow_contract_hash: string;
  release_terms: string;
  dual_sign_off_code: string;
  geofence_radius_meters: number;
  driver_distance_to_pickup_km: number;
  is_driver_at_pickup: boolean;
  agreed_pickup_time: string;
  auto_refund_hours: number;
  auto_refund_deadline: string;
  auto_refund_status: string;
  refunded_at: string | null;
  refund_reason: string | null;
  cancellation_record: any;
}

interface PaymentRow {
  trip_id: string;
  total_freight_cost: number;
  fuel_escrow_deposit: number;
  driver_bond_deposit: number;
  advance_amount: number;
  advance_percentage: number;
  advance_mode: string;
  advance_gross_amount: number;
  advance_diesel_deducted: number;
  advance_deduct_diesel: boolean;
  advance_status: string;
  advance_proposed_by: string | null;
  advance_accepted_by_trucker: boolean;
  advance_accepted_by_trucker_at: string | null;
  advance_paid_at: string | null;
  final_amount: number;
  final_percentage: number;
  final_status: string;
  final_paid_at: string | null;
}

interface MilestoneRow {
  id: string;
  trip_id: string;
  key: string;
  label: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
  sort_order: number;
}

interface ChatMessageRow {
  id: string;
  trip_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  timestamp: string;
  is_quick_update: boolean;
}

function mapTrucker(row: TruckerRow): Trucker {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    phone: row.phone,
    rating: row.rating,
    tripsCompleted: row.trips_completed,
    truckType: row.truck_type as Trucker['truckType'],
    truckModel: row.truck_model,
    plateNumber: row.plate_number,
    permitNumber: row.permit_number,
    currentLocation: row.current_location,
    isOnline: row.is_online,
    ratePerKm: row.rate_per_km,
    walletBalance: row.wallet_balance,
    fuelCardBalance: row.fuel_card_balance,
    distanceToPickupKm: row.distance_to_pickup_km,
    recentReviews: row.recent_reviews || undefined,
  };
}

function mapCargo(row: CargoRow): Cargo {
  return {
    title: row.title,
    category: row.category as Cargo['category'],
    weightKg: row.weight_kg,
    weightTonnes: row.weight_tonnes,
    dimensions: row.dimensions,
    palletsCount: row.pallets_count,
    isFragile: row.is_fragile,
    temperatureControlled: row.temperature_controlled,
    targetTempC: row.target_temp_c ?? undefined,
    description: row.description,
    cargoValueUsd: row.cargo_value_usd,
    photos: row.photos || [],
  };
}

function mapEscrow(row: EscrowRow): DualEscrowVault {
  return {
    id: row.trip_id,
    fuelAmountUsd: row.fuel_amount_usd,
    driverBondAmountUsd: row.driver_bond_amount_usd,
    driverBondStatus: row.driver_bond_status as DualEscrowVault['driverBondStatus'],
    totalEscrowLockedUsd: row.total_escrow_locked_usd,
    deadheadDistanceKm: row.deadhead_distance_km,
    dieselPricePerLiter: row.diesel_price_per_liter,
    estimatedLiters: row.estimated_liters,
    status: row.status as DualEscrowVault['status'],
    shipperApproved: row.shipper_approved,
    shipperApprovedAt: row.shipper_approved_at ?? undefined,
    truckerApproved: row.trucker_approved,
    truckerApprovedAt: row.trucker_approved_at ?? undefined,
    releasedAt: row.released_at ?? undefined,
    escrowContractHash: row.escrow_contract_hash,
    releaseTerms: row.release_terms,
    dualSignOffCode: row.dual_sign_off_code,
    geofenceRadiusMeters: row.geofence_radius_meters,
    driverDistanceToPickupKm: row.driver_distance_to_pickup_km,
    isDriverAtPickup: row.is_driver_at_pickup,
    agreedPickupTime: row.agreed_pickup_time,
    autoRefundHours: row.auto_refund_hours,
    autoRefundDeadline: row.auto_refund_deadline,
    autoRefundStatus: row.auto_refund_status as DualEscrowVault['autoRefundStatus'],
    refundedAt: row.refunded_at ?? undefined,
    refundReason: row.refund_reason ?? undefined,
    cancellationRecord: row.cancellation_record ?? undefined,
  };
}

function mapPayments(row: PaymentRow): PaymentPlan {
  return {
    totalFreightCost: row.total_freight_cost,
    fuelEscrowDeposit: row.fuel_escrow_deposit,
    driverBondDeposit: row.driver_bond_deposit,
    advancePayment: {
      amount: row.advance_amount,
      percentage: row.advance_percentage,
      mode: row.advance_mode as 'percentage' | 'fixed_amount',
      grossAmount: row.advance_gross_amount,
      dieselDeducted: row.advance_diesel_deducted,
      deductDiesel: row.advance_deduct_diesel,
      status: row.advance_status as any,
      proposedBy: row.advance_proposed_by as any,
      acceptedByTrucker: row.advance_accepted_by_trucker,
      acceptedByTruckerAt: row.advance_accepted_by_trucker_at ?? undefined,
      paidAt: row.advance_paid_at ?? undefined,
    },
    finalPayment: {
      amount: row.final_amount,
      percentage: row.final_percentage,
      status: row.final_status as any,
      paidAt: row.final_paid_at ?? undefined,
    },
  };
}

function mapMilestones(rows: MilestoneRow[]): TripMilestone[] {
  return rows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      key: r.key,
      label: r.label,
      description: r.description,
      timestamp: r.timestamp ?? undefined,
      completed: r.completed,
      current: r.current,
    }));
}

function mapMessages(rows: ChatMessageRow[]): ChatMessage[] {
  return rows.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderRole: r.sender_role as ChatMessage['senderRole'],
    content: r.content,
    timestamp: r.timestamp,
    isQuickUpdate: r.is_quick_update,
  }));
}

function assembleTrip(
  tripRow: TripRow,
  trucker: Trucker | null,
  cargo: Cargo | null,
  escrow: DualEscrowVault | null,
  payments: PaymentPlan | null,
  milestones: TripMilestone[],
  messages: ChatMessage[],
): Trip {
  return {
    id: tripRow.id,
    trackingNumber: tripRow.tracking_number,
    createdAt: tripRow.created_at,
    shipperId: tripRow.shipper_id,
    shipperName: tripRow.shipper_name,
    shipperPhone: tripRow.shipper_phone,
    cargo: cargo || {
      title: '',
      category: 'General Freight',
      weightKg: 0,
      weightTonnes: 0,
      dimensions: {},
      palletsCount: 0,
      isFragile: false,
      temperatureControlled: false,
      description: '',
      cargoValueUsd: 0,
      photos: [],
    },
    origin: tripRow.origin,
    destination: tripRow.destination,
    distanceKm: tripRow.distance_km,
    estimatedDurationHours: tripRow.estimated_duration_hours,
    trucker,
    status: tripRow.status as Trip['status'],
    escrow: escrow || ({} as DualEscrowVault),
    payments: payments || ({} as PaymentPlan),
    milestones,
    routeWaypoints: tripRow.route_waypoints || [],
    currentLocation: tripRow.current_location,
    currentSpeedKmh: tripRow.current_speed_kmh,
    progressPercent: tripRow.progress_percent,
    simulationActive: tripRow.simulation_active,
    simulationSpeedMultiplier: tripRow.simulation_speed_multiplier,
    proofOfDelivery: tripRow.proof_of_delivery ?? undefined,
    messages,
    cargoTelemetry: tripRow.cargo_telemetry ?? undefined,
    shipperReview: tripRow.shipper_review ?? undefined,
    driverReview: tripRow.driver_review ?? undefined,
  };
}

export async function fetchAllTruckers(): Promise<Trucker[]> {
  const { data, error } = await supabase.from('truckers').select('*');
  if (error) throw error;
  return (data as TruckerRow[]).map(mapTrucker);
}

export async function fetchAllTrips(): Promise<Trip[]> {
  const { data: tripRows, error: tripErr } = await supabase.from('trips').select('*');
  if (tripErr) throw tripErr;
  if (!tripRows || tripRows.length === 0) return [];

  const tripIds = tripRows.map((t: any) => t.id);

  const [{ data: truckerRows }, { data: cargoRows }, { data: escrowRows }, { data: paymentRows }, { data: milestoneRows }, { data: messageRows }] =
    await Promise.all([
      supabase.from('truckers').select('*').in('id', tripRows.map((t: any) => t.trucker_id).filter(Boolean) as string[]),
      supabase.from('cargo').select('*').in('trip_id', tripIds),
      supabase.from('escrow').select('*').in('trip_id', tripIds),
      supabase.from('payments').select('*').in('trip_id', tripIds),
      supabase.from('milestones').select('*').in('trip_id', tripIds),
      supabase.from('chat_messages').select('*').in('trip_id', tripIds),
    ]);

  const truckerMap = new Map<string, Trucker>();
  (truckerRows as TruckerRow[] || []).forEach((r) => truckerMap.set(r.id, mapTrucker(r)));

  const cargoMap = new Map<string, Cargo>();
  (cargoRows as CargoRow[] || []).forEach((r) => cargoMap.set(r.trip_id, mapCargo(r)));

  const escrowMap = new Map<string, DualEscrowVault>();
  (escrowRows as EscrowRow[] || []).forEach((r) => escrowMap.set(r.trip_id, mapEscrow(r)));

  const paymentMap = new Map<string, PaymentPlan>();
  (paymentRows as PaymentRow[] || []).forEach((r) => paymentMap.set(r.trip_id, mapPayments(r)));

  const milestoneMap = new Map<string, MilestoneRow[]>();
  (milestoneRows as MilestoneRow[] || []).forEach((r) => {
    const arr = milestoneMap.get(r.trip_id) || [];
    arr.push(r);
    milestoneMap.set(r.trip_id, arr);
  });

  const messageMap = new Map<string, ChatMessageRow[]>();
  (messageRows as ChatMessageRow[] || []).forEach((r) => {
    const arr = messageMap.get(r.trip_id) || [];
    arr.push(r);
    messageMap.set(r.trip_id, arr);
  });

  return (tripRows as TripRow[]).map((tripRow) =>
    assembleTrip(
      tripRow,
      tripRow.trucker_id ? truckerMap.get(tripRow.trucker_id) || null : null,
      cargoMap.get(tripRow.id) || null,
      escrowMap.get(tripRow.id) || null,
      paymentMap.get(tripRow.id) || null,
      milestoneMap.get(tripRow.id) ? mapMilestones(milestoneMap.get(tripRow.id)!) : [],
      messageMap.get(tripRow.id) ? mapMessages(messageMap.get(tripRow.id)!) : [],
    ),
  );
}

export async function saveTrip(trip: Trip): Promise<void> {
  const tripRow: any = {
    id: trip.id,
    tracking_number: trip.trackingNumber,
    created_at: trip.createdAt,
    shipper_id: trip.shipperId,
    shipper_name: trip.shipperName,
    shipper_phone: trip.shipperPhone,
    trucker_id: trip.trucker?.id || null,
    status: trip.status,
    origin: trip.origin,
    destination: trip.destination,
    distance_km: trip.distanceKm,
    estimated_duration_hours: trip.estimatedDurationHours,
    current_location: trip.currentLocation,
    current_speed_kmh: trip.currentSpeedKmh,
    progress_percent: trip.progressPercent,
    simulation_active: trip.simulationActive,
    simulation_speed_multiplier: trip.simulationSpeedMultiplier,
    route_waypoints: trip.routeWaypoints,
    cargo_telemetry: trip.cargoTelemetry || null,
    proof_of_delivery: trip.proofOfDelivery || null,
    shipper_review: trip.shipperReview || null,
    driver_review: trip.driverReview || null,
  };

  const { error: tripErr } = await supabase.from('trips').upsert(tripRow);
  if (tripErr) throw tripErr;

  const cargoRow: any = {
    trip_id: trip.id,
    title: trip.cargo.title,
    category: trip.cargo.category,
    weight_kg: trip.cargo.weightKg,
    weight_tonnes: trip.cargo.weightTonnes,
    dimensions: trip.cargo.dimensions,
    pallets_count: trip.cargo.palletsCount,
    is_fragile: trip.cargo.isFragile,
    temperature_controlled: trip.cargo.temperatureControlled,
    target_temp_c: trip.cargo.targetTempC ?? null,
    description: trip.cargo.description,
    cargo_value_usd: trip.cargo.cargoValueUsd,
    photos: trip.cargo.photos,
  };
  const { error: cargoErr } = await supabase.from('cargo').upsert(cargoRow);
  if (cargoErr) throw cargoErr;

  const escrowRow: any = {
    trip_id: trip.id,
    fuel_amount_usd: trip.escrow.fuelAmountUsd,
    driver_bond_amount_usd: trip.escrow.driverBondAmountUsd,
    driver_bond_status: trip.escrow.driverBondStatus,
    total_escrow_locked_usd: trip.escrow.totalEscrowLockedUsd,
    deadhead_distance_km: trip.escrow.deadheadDistanceKm,
    diesel_price_per_liter: trip.escrow.dieselPricePerLiter,
    estimated_liters: trip.escrow.estimatedLiters,
    status: trip.escrow.status,
    shipper_approved: trip.escrow.shipperApproved,
    shipper_approved_at: trip.escrow.shipperApprovedAt || null,
    trucker_approved: trip.escrow.truckerApproved,
    trucker_approved_at: trip.escrow.truckerApprovedAt || null,
    released_at: trip.escrow.releasedAt || null,
    escrow_contract_hash: trip.escrow.escrowContractHash,
    release_terms: trip.escrow.releaseTerms,
    dual_sign_off_code: trip.escrow.dualSignOffCode,
    geofence_radius_meters: trip.escrow.geofenceRadiusMeters,
    driver_distance_to_pickup_km: trip.escrow.driverDistanceToPickupKm,
    is_driver_at_pickup: trip.escrow.isDriverAtPickup,
    agreed_pickup_time: trip.escrow.agreedPickupTime,
    auto_refund_hours: trip.escrow.autoRefundHours,
    auto_refund_deadline: trip.escrow.autoRefundDeadline,
    auto_refund_status: trip.escrow.autoRefundStatus,
    refunded_at: trip.escrow.refundedAt || null,
    refund_reason: trip.escrow.refundReason || null,
    cancellation_record: trip.escrow.cancellationRecord || null,
  };
  const { error: escrowErr } = await supabase.from('escrow').upsert(escrowRow);
  if (escrowErr) throw escrowErr;

  const paymentRow: any = {
    trip_id: trip.id,
    total_freight_cost: trip.payments.totalFreightCost,
    fuel_escrow_deposit: trip.payments.fuelEscrowDeposit,
    driver_bond_deposit: trip.payments.driverBondDeposit || 0,
    advance_amount: trip.payments.advancePayment.amount,
    advance_percentage: trip.payments.advancePayment.percentage,
    advance_mode: trip.payments.advancePayment.mode || 'percentage',
    advance_gross_amount: trip.payments.advancePayment.grossAmount || 0,
    advance_diesel_deducted: trip.payments.advancePayment.dieselDeducted || 0,
    advance_deduct_diesel: trip.payments.advancePayment.deductDiesel || false,
    advance_status: trip.payments.advancePayment.status,
    advance_proposed_by: trip.payments.advancePayment.proposedBy || null,
    advance_accepted_by_trucker: trip.payments.advancePayment.acceptedByTrucker || false,
    advance_accepted_by_trucker_at: trip.payments.advancePayment.acceptedByTruckerAt || null,
    advance_paid_at: trip.payments.advancePayment.paidAt || null,
    final_amount: trip.payments.finalPayment.amount,
    final_percentage: trip.payments.finalPayment.percentage,
    final_status: trip.payments.finalPayment.status,
    final_paid_at: trip.payments.finalPayment.paidAt || null,
  };
  const { error: payErr } = await supabase.from('payments').upsert(paymentRow);
  if (payErr) throw payErr;

  await supabase.from('milestones').delete().eq('trip_id', trip.id);
  if (trip.milestones.length > 0) {
    const msRows = trip.milestones.map((ms, i) => ({
      id: `${trip.id}-ms-${i}`,
      trip_id: trip.id,
      key: ms.key,
      label: ms.label,
      description: ms.description,
      timestamp: ms.timestamp || null,
      completed: ms.completed,
      current: ms.current,
      sort_order: i,
    }));
    const { error: msErr } = await supabase.from('milestones').upsert(msRows);
    if (msErr) throw msErr;
  }

  if (trip.messages.length > 0) {
    const msgRows = trip.messages.map((m) => ({
      id: m.id,
      trip_id: trip.id,
      sender_id: m.senderId,
      sender_name: m.senderName,
      sender_role: m.senderRole,
      content: m.content,
      timestamp: m.timestamp,
      is_quick_update: m.isQuickUpdate || false,
    }));
    const { error: msgErr } = await supabase.from('chat_messages').upsert(msgRows);
    if (msgErr) throw msgErr;
  }
}

export async function saveTrucker(trucker: Trucker): Promise<void> {
  const row: any = {
    id: trucker.id,
    name: trucker.name,
    avatar: trucker.avatar,
    phone: trucker.phone,
    rating: trucker.rating,
    trips_completed: trucker.tripsCompleted,
    truck_type: trucker.truckType,
    truck_model: trucker.truckModel,
    plate_number: trucker.plateNumber,
    permit_number: trucker.permitNumber,
    current_location: trucker.currentLocation,
    is_online: trucker.isOnline,
    rate_per_km: trucker.ratePerKm,
    wallet_balance: trucker.walletBalance,
    fuel_card_balance: trucker.fuelCardBalance,
    distance_to_pickup_km: trucker.distanceToPickupKm,
    recent_reviews: trucker.recentReviews || [],
  };
  const { error } = await supabase.from('truckers').upsert(row);
  if (error) throw error;
}
