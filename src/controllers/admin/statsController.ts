/** Analytics derived from real order data for the admin Reports/Dashboard. */
import type { Request, Response } from 'express';

import { ah } from '../../lib/http';
import { Order } from '../../models';

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

function weekLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

/** GET /admin/stats — revenue/AOV/volume time-series + top systems, from orders. */
export const stats = ah(async (_req: Request, res: Response) => {
  const orders = (await Order.find()).map((o) => o.toJSON() as any);
  const now = Date.now();
  const parsed = orders
    .map((o) => ({ t: new Date(o.createdAt).getTime(), total: Number(o.total) || 0, items: o.items ?? [], status: o.status }))
    .filter((o) => Number.isFinite(o.t));

  // ---- Weekly buckets (last 12 weeks) ----
  const weekly = [];
  for (let i = 11; i >= 0; i--) {
    const end = now - i * WEEK;
    const start = end - WEEK;
    const inBucket = parsed.filter((o) => o.t > start && o.t <= end);
    const revenue = inBucket.reduce((s, o) => s + o.total, 0);
    weekly.push({
      label: weekLabel(new Date(end)),
      revenue,
      orders: inBucket.length,
      aov: inBucket.length ? Math.round(revenue / inBucket.length) : 0,
    });
  }

  // ---- Monthly buckets (last 6 months) ----
  const monthly = [];
  const base = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const next = new Date(base.getFullYear(), base.getMonth() - i + 1, 1);
    const inBucket = parsed.filter((o) => o.t >= d.getTime() && o.t < next.getTime());
    monthly.push({
      label: monthLabel(d),
      revenue: inBucket.reduce((s, o) => s + o.total, 0),
      orders: inBucket.length,
    });
  }

  // ---- Top requested systems (from order line items) ----
  const counts: Record<string, number> = {};
  for (const o of parsed) {
    for (const it of o.items) {
      const name = it.name ?? 'Unknown';
      counts[name] = (counts[name] ?? 0) + (Number(it.quantity) || 1);
    }
  }
  const topSystems = Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const totalRevenue = parsed.reduce((s, o) => s + o.total, 0);
  const completed = orders.filter((o) => ['Delivered', 'completed'].includes(o.status)).length;

  res.json({
    summary: {
      totalRevenue,
      orders: orders.length,
      avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
      completed,
    },
    revenue: {
      weekly: weekly.map((w) => ({ label: w.label, value: w.revenue })),
      monthly: monthly.map((m) => ({ label: m.label, value: m.revenue })),
    },
    aov: { weekly: weekly.map((w) => ({ label: w.label, value: w.aov })) },
    deliveryVolume: weekly.map((w) => ({ label: w.label, value: w.orders })),
    topSystems,
  });
});
