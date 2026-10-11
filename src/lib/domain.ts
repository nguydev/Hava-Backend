/**
 * Domain constants, timeline builders and formatting — ported verbatim from the
 * GOODR frontend (src/constants, src/utils/timeline, src/utils/format) so the
 * backend produces byte-identical order/delivery timelines and date strings.
 */

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type DeliveryStatus =
  | 'Available'
  | 'Unassigned'
  | 'Assigned'
  | 'Accepted'
  | 'En Route'
  | 'Arrived'
  | 'Delivered'
  | 'Issue Reported';

export interface TimelineEntry {
  key: string;
  label: string;
  description?: string;
  timestamp?: string;
  done: boolean;
  current?: boolean;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

export const DELIVERY_STATUS_FLOW: DeliveryStatus[] = [
  'Assigned',
  'Accepted',
  'En Route',
  'Arrived',
  'Delivered',
];

const ORDER_STEP_DESC: Record<OrderStatus, string> = {
  Pending: 'Delivery request received',
  Confirmed: 'Order confirmed & scheduled',
  Preparing: 'Items being pulled from the warehouse',
  'Out for Delivery': 'Driver en route to the job site',
  Delivered: 'Delivered with photo proof',
  Cancelled: 'Order was cancelled',
};

const DELIVERY_STEP_DESC: Record<DeliveryStatus, string> = {
  Available: 'Open delivery available to claim',
  Unassigned: 'Awaiting driver assignment',
  Assigned: 'Delivery assigned to you',
  Accepted: 'You accepted this delivery',
  'En Route': 'Driving to the job site',
  Arrived: 'Arrived at the job site',
  Delivered: 'Proof of delivery captured',
  'Issue Reported': 'An issue was reported',
};

export function makeOrderTimeline(
  status: OrderStatus,
  stamps?: Partial<Record<OrderStatus, string>>,
): TimelineEntry[] {
  if (status === 'Cancelled') {
    return [
      {
        key: 'Pending',
        label: 'Pending',
        description: ORDER_STEP_DESC.Pending,
        timestamp: stamps?.Pending,
        done: true,
      },
      {
        key: 'Cancelled',
        label: 'Cancelled',
        description: ORDER_STEP_DESC.Cancelled,
        timestamp: stamps?.Cancelled,
        done: true,
        current: true,
      },
    ];
  }
  const idx = ORDER_STATUS_FLOW.indexOf(status);
  return ORDER_STATUS_FLOW.map((s, i) => ({
    key: s,
    label: s,
    description: ORDER_STEP_DESC[s],
    timestamp: i <= idx ? stamps?.[s] : undefined,
    done: i <= idx,
    current: i === idx,
  }));
}

export function makeDeliveryTimeline(
  status: DeliveryStatus,
  stamps?: Partial<Record<DeliveryStatus, string>>,
): TimelineEntry[] {
  if (status === 'Available' || status === 'Unassigned') {
    return [
      {
        key: status,
        label: status,
        description: DELIVERY_STEP_DESC[status],
        timestamp: stamps?.[status],
        done: false,
        current: true,
      },
    ];
  }
  if (status === 'Issue Reported') {
    const upto = DELIVERY_STATUS_FLOW.indexOf('En Route');
    const base = DELIVERY_STATUS_FLOW.slice(0, upto + 1).map((s) => ({
      key: s,
      label: s,
      description: DELIVERY_STEP_DESC[s],
      timestamp: stamps?.[s],
      done: true,
      current: false,
    }));
    return [
      ...base,
      {
        key: 'Issue Reported',
        label: 'Issue Reported',
        description: DELIVERY_STEP_DESC['Issue Reported'],
        timestamp: stamps?.['Issue Reported'],
        done: true,
        current: true,
      },
    ];
  }
  const idx = DELIVERY_STATUS_FLOW.indexOf(status);
  return DELIVERY_STATUS_FLOW.map((s, i) => ({
    key: s,
    label: s,
    description: DELIVERY_STEP_DESC[s],
    timestamp: i <= idx ? stamps?.[s] : undefined,
    done: i <= idx,
    current: i === idx,
  }));
}

/** Mirror of the frontend formatDate ("Jul 4, 2026"). */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
