// Geospatial helper functions and realistic metric route simulation
import { CurrencyConfig, SUPPORTED_CURRENCIES } from '../types/settings';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Highway road circuity factor is typically 1.18 - 1.25
  return Math.round(straightLine * 1.22);
}

// Backward-compatible distance in miles
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const km = calculateDistanceKm(lat1, lon1, lat2, lon2);
  return Math.round(km / 1.60934);
}

export function generateRoutePoints(
  start: [number, number],
  end: [number, number],
  steps: number = 30
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Midpoint with highway slight curvature
  const midLat = (lat1 + lat2) / 2 + (Math.random() - 0.5) * 0.15;
  const midLng = (lng1 + lng2) / 2 + (Math.random() - 0.5) * 0.15;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier interpolation for realistic highway bends
    const lat =
      (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng =
      (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    points.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
  return points;
}

// Metric fuel escrow deposit: deadhead_km * consumption (L/km) * diesel price
// Both the shipper diesel escrow and the trucker security bond are computed from this.
export function calculateFuelEscrowDeposit(
  deadheadKm: number,
  truckType: string,
  dieselPricePerLiterUsd: number = 1.25,
  fuelConsumptionLPerKm: number = 0.3
): {
  amount: number;
  liters: number;
  fuelConsumptionLPerKm: number;
  kmPerLiter: number;
  dieselPricePerLiter: number;
  gallons: number;
  mpg: number;
} {
  // Minimum deadhead baseline is 5 km
  const effectiveKm = Math.max(5, deadheadKm);
  const liters = Number((effectiveKm * fuelConsumptionLPerKm).toFixed(1));

  // Add 12% reserve margin for traffic/idling
  const rawCost = liters * dieselPricePerLiterUsd * 1.12;
  const amount = Math.max(15, Math.round(rawCost));

  const litersPer100km = Number((fuelConsumptionLPerKm * 100).toFixed(1));

  return {
    amount,
    liters,
    fuelConsumptionLPerKm,
    kmPerLiter: Number((1 / fuelConsumptionLPerKm).toFixed(1)),
    dieselPricePerLiter: dieselPricePerLiterUsd,
    gallons: Number((liters / 3.78541).toFixed(1)),
    mpg: Number((235.215 / litersPer100km).toFixed(1)),
  };
}

// Metric Freight Pricing calculation
export function calculateTripPricing(
  distanceKm: number,
  truckRatePerKm: number,
  deadheadKm: number,
  truckType: string,
  isFragile: boolean,
  isColdChain: boolean,
  dieselPricePerLiterUsd: number = 1.25,
  fuelConsumptionLPerKm: number = 0.3
) {
  const baseBookingFee = 75;
  const haulCost = distanceKm * truckRatePerKm;
  const cargoSurcharges = (isFragile ? 65 : 0) + (isColdChain ? 120 : 0);
  const totalFreight = Math.round(baseBookingFee + haulCost + cargoSurcharges);

  // Escrow mobilization fuel (in Liters) — based on deadhead distance
  const fuel = calculateFuelEscrowDeposit(deadheadKm, truckType, dieselPricePerLiterUsd, fuelConsumptionLPerKm);

  const advanceAmount = Math.round(totalFreight * 0.4);
  const finalAmount = totalFreight - advanceAmount;

  return {
    totalFreight,
    fuelDeposit: fuel.amount,
    fuelLiters: fuel.liters,
    fuelConsumptionLPerKm: fuel.fuelConsumptionLPerKm,
    fuelKmPerLiter: fuel.kmPerLiter,
    dieselPricePerLiter: fuel.dieselPricePerLiter,
    advanceAmount,
    advancePercent: 40,
    finalAmount,
    finalPercent: 60,
    // Legacy aliases
    fuelGallons: fuel.gallons,
    fuelMpg: fuel.mpg,
  };
}

export function formatCurrency(amount: number, currency: CurrencyConfig = SUPPORTED_CURRENCIES[0]): string {
  const converted = Math.round(amount * (currency.rateToUsd || 1.0));
  return `${currency.symbol}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted)}`;
}

// Formats diesel price in Liters and in the chosen currency
export function formatDieselPricePerLiter(
  pricePerLiterUsd: number = 1.25,
  currency: CurrencyConfig = SUPPORTED_CURRENCIES[0]
): string {
  const rate = currency.rateToUsd || 1.0;
  const converted = pricePerLiterUsd * rate;

  if (rate > 10) {
    // Currencies like KES, UGX, TZS, RWF with large nominal values
    return `${currency.symbol}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(converted))}/L`;
  }

  // USD, EUR, etc. with fractional units
  return `${currency.symbol}${converted.toFixed(2)}/L`;
}
