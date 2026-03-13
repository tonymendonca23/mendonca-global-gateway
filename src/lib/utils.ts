import { nanoid } from 'nanoid';

// Generate MGG tracking number
// Format: MGG-XXXX-XXXX (e.g., MGG-A1B2-C3D4)
export function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let part1 = '';
  let part2 = '';

  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `MGG-${part1}-${part2}`;
}

// Generate invoice number
// Format: INV-YYYY-NNNN (e.g., INV-2026-0001)
export async function generateInvoiceNumber(getCurrentCount: () => Promise<number>): Promise<string> {
  const year = new Date().getFullYear();
  const count = await getCurrentCount();
  const padded = String(count).padStart(4, '0');
  return `INV-${year}-${padded}`;
}

// Generate unique ID
export function generateId(): string {
  return nanoid();
}

// Format currency (GYD)
export function formatGYD(amount: number): string {
  return `GYD $${amount.toLocaleString()}`;
}

// Format currency (USD)
export function formatUSD(amount: number): string {
  return `USD $${amount.toFixed(2)}`;
}

// Convert USD to GYD
export function usdToGyd(usd: number, exchangeRate: number = 222): number {
  return Math.round(usd * exchangeRate);
}

// Calculate shipping cost
export function calculateShipping(weightLbs: number, ratePerLb: number = 500): number {
  return Math.ceil(weightLbs * ratePerLb);
}

// Calculate storage fee
export function calculateStorageFee(
  daysInStorage: number,
  freeDays: number = 7,
  ratePerDay: number = 500
): number {
  const chargeableDays = Math.max(0, daysInStorage - freeDays);
  return chargeableDays * ratePerDay;
}

// Format date
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-GY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format datetime
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-GY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Package status labels
export const PACKAGE_STATUS_LABELS = {
  registered: { label: 'Registered', icon: '📝', color: 'blue' },
  at_warehouse: { label: 'At US Warehouse', icon: '📦', color: 'yellow' },
  in_transit: { label: 'In Transit', icon: '✈️', color: 'orange' },
  customs: { label: 'Customs Clearance', icon: '📋', color: 'purple' },
  ready: { label: 'Ready for Pickup', icon: '✅', color: 'green' },
  picked_up: { label: 'Picked Up', icon: '📦', color: 'gray' },
} as const;

// Status color mapping (hex colors for badges)
export const STATUS_COLORS: Record<string, string> = {
  registered: '#3b82f6',
  at_warehouse: '#eab308',
  in_transit: '#f59e0b',
  customs: '#8b5cf6',
  ready: '#10b981',
  picked_up: '#64748b',
};

// Get status color for a given status key
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#9ca3af';
}

export type PackageStatusLabel = typeof PACKAGE_STATUS_LABELS[keyof typeof PACKAGE_STATUS_LABELS];

// Store options
export const STORE_OPTIONS = [
  'Amazon',
  'SHEIN',
  'Walmart',
  'eBay',
  'Target',
  'Best Buy',
  'Other',
] as const;

// Get contact numbers from environment
export function getEnvContactNumbers() {
  const mmgRaw = (import.meta.env.MMG_NUMBER as string | undefined) || '';
  const whatsappRaw = (import.meta.env.WHATSAPP_NUMBER as string | undefined) || '';

  const mmgNumber = mmgRaw.trim() || '5926717816';
  const whatsappDigits = (whatsappRaw || mmgNumber).replace(/[^0-9]/g, '');

  return {
    mmgNumber,
    whatsappNumber: whatsappDigits,
  };
}
