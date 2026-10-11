/**
 * Adapters between the mobile app's canonical shapes (stored in Mongo) and the
 * shapes the admin panel expects. These let the admin operate on the SAME
 * collections the app uses, so edits made in either surface stay in sync.
 */

type Any = Record<string, any>;

/* -------------------------------- Products -------------------------------- */

const AVAIL_B2A: Record<string, string> = {
  'In Stock': 'in_stock',
  'Limited Stock': 'limited',
  'Special Order': 'special_order',
  'Out of Stock': 'out_of_stock',
};
const AVAIL_A2B: Record<string, string> = {
  in_stock: 'In Stock',
  limited: 'Limited Stock',
  special_order: 'Special Order',
  out_of_stock: 'Out of Stock',
};

const SYS_BY_CATEGORY: Record<string, string> = {
  'ac-systems': 'Straight AC',
  'heat-pumps': 'Heat Pump',
  furnaces: 'Furnace',
  'air-handlers': 'Air Handler',
  'mini-splits': 'Mini Split',
  thermostats: 'Thermostat',
  'rooftop-units': 'Rooftop Unit',
  accessories: 'Accessory',
};

/** Canonical Product → admin Product shape. */
export function productToAdmin(p: Any): Any {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    model: p.model,
    categoryId: p.categoryId,
    systemType: p.systemType ?? SYS_BY_CATEGORY[p.categoryId] ?? 'System',
    capacity: p.capacity ?? '',
    seer: p.seerRating ?? p.efficiency ?? '',
    price: p.price ?? null,
    availability: AVAIL_B2A[p.availability] ?? 'in_stock',
    stock: p.stock ?? 0,
    description: p.description ?? '',
    active: p.active !== false,
    exclusive: !!p.exclusive,
    featured: !!p.featured,
    image: p.image ?? '',
    updatedAt: p.updatedAt ?? p.createdAt ?? '',
  };
}

/** Admin Product patch → canonical Product fields (only the keys present). */
export function adminProductToCanonical(a: Any): Any {
  const out: Any = {};
  if ('name' in a) out.name = a.name;
  if ('brand' in a) out.brand = a.brand;
  if ('model' in a) out.model = a.model;
  if ('categoryId' in a) out.categoryId = a.categoryId;
  if ('systemType' in a) out.systemType = a.systemType;
  if ('capacity' in a) out.capacity = a.capacity;
  if ('seer' in a) out.seerRating = a.seer;
  if ('price' in a) out.price = a.price;
  if ('availability' in a) out.availability = AVAIL_A2B[a.availability] ?? 'In Stock';
  if ('stock' in a) out.stock = a.stock;
  if ('description' in a) out.description = a.description;
  if ('active' in a) out.active = a.active;
  if ('exclusive' in a) out.exclusive = a.exclusive;
  if ('featured' in a) out.featured = a.featured;
  if ('image' in a) out.image = a.image;
  out.updatedAt = a.updatedAt ?? new Date().toISOString();
  return out;
}

/* ------------------------------- Categories ------------------------------- */

const GROUP_BY_CATEGORY: Record<string, string> = {
  thermostats: 'Parts',
  accessories: 'Parts',
};

export function categoryToAdmin(c: Any): Any {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon ?? 'box',
    blurb: c.blurb ?? '',
    group: c.group ?? GROUP_BY_CATEGORY[c.id] ?? 'Regular Systems',
    active: c.active !== false,
    productCount: c.productCount ?? 0,
  };
}

export function adminCategoryToCanonical(a: Any): Any {
  const out: Any = {};
  for (const k of ['name', 'icon', 'blurb', 'group', 'active', 'productCount']) {
    if (k in a) out[k] = a[k];
  }
  return out;
}

/* ---------------------------- Orders (+delivery) -------------------------- */

const DELIVERY_STATUS_B2A: Record<string, string> = {
  Assigned: 'assigned',
  Accepted: 'picked_up',
  'En Route': 'in_transit',
  Arrived: 'in_transit',
  Delivered: 'delivered',
  'Issue Reported': 'delayed',
};
const ORDER_STATUS_B2A: Record<string, string> = {
  Pending: 'new',
  Confirmed: 'assigned',
  Preparing: 'picked_up',
  'Out for Delivery': 'in_transit',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

export const ADMIN_PROGRESS: Record<string, number> = {
  new: 0,
  assigned: 10,
  picked_up: 35,
  in_transit: 65,
  delayed: 65,
  delivered: 100,
  completed: 100,
  cancelled: 0,
};

/** Reverse map: admin status → { order, delivery } canonical statuses. */
export const ADMIN_STATUS_TO_CANONICAL: Record<
  string,
  { order?: string; delivery?: string }
> = {
  new: { order: 'Pending' },
  assigned: { order: 'Confirmed', delivery: 'Assigned' },
  picked_up: { order: 'Preparing', delivery: 'Accepted' },
  in_transit: { order: 'Out for Delivery', delivery: 'En Route' },
  delivered: { order: 'Delivered', delivery: 'Delivered' },
  completed: { order: 'Delivered', delivery: 'Delivered' },
  delayed: { delivery: 'Issue Reported' },
  cancelled: { order: 'Cancelled' },
};

/** Canonical Order (+ optional linked Delivery) → admin DeliveryOrder. */
export function orderToAdmin(order: Any, delivery?: Any | null): Any {
  const status = delivery
    ? DELIVERY_STATUS_B2A[delivery.status] ?? ORDER_STATUS_B2A[order.status] ?? 'new'
    : ORDER_STATUS_B2A[order.status] ?? 'new';
  const addr = order.address ?? {};
  const proof = order.proofOfDelivery ?? delivery?.proofOfDelivery ?? null;
  return {
    id: order.id,
    contractorId: '',
    contractor: delivery?.company ?? order.contactName ?? addr.label ?? 'Contractor',
    address: [addr.line1, addr.city, addr.state].filter(Boolean).join(', '),
    city: addr.city ?? '',
    items: (order.items ?? []).map((i: Any) => ({
      productId: i.productId,
      name: i.name,
      brand: i.brand,
      quantity: i.quantity,
      unitPrice: i.unitPrice ?? 0,
    })),
    total: order.total ?? 0,
    requestedDate: order.preferredDate ?? '',
    window: order.timeWindow ?? '',
    priority: (delivery?.priority ?? 'Standard').toLowerCase(),
    status,
    driverId: order.driver?.id ?? null,
    driver: order.driver?.name ?? null,
    eta: order.eta ?? delivery?.eta ?? null,
    progress: ADMIN_PROGRESS[status] ?? 0,
    createdAt: order.createdAt ?? '',
    completedAt: delivery?.completedAt ?? (order.status === 'Delivered' ? proof?.signedAt ?? null : null),
    adminNotes: order.notes ?? '',
    proofPhotos: proof?.photos ?? [],
    signedBy: proof?.recipientName ?? null,
  };
}

/* --------------------- Quotes → admin Pricing Requests -------------------- */

const QUOTE_STATUS_B2A: Record<string, string> = {
  Pending: 'pending',
  Approved: 'quoted',
  Accepted: 'approved',
  Rejected: 'rejected',
  Expired: 'rejected',
};
export const PR_STATUS_TO_QUOTE: Record<string, string> = {
  pending: 'Pending',
  reviewing: 'Pending',
  quoted: 'Approved',
  approved: 'Approved',
  rejected: 'Rejected',
};

/** Canonical mobile Quote → admin PricingRequest. */
export function quoteToPricingRequest(q: Any): Any {
  return {
    id: q.id,
    contractorId: '',
    contractor: 'Summit Comfort Systems',
    systemType: q.systemType ?? q.equipmentType ?? '',
    brand: q.brandPreference ?? '',
    quantity: q.quantity ?? 1,
    notes: q.notes ?? '',
    timeframe: q.neededBy ?? q.urgency ?? '',
    status: QUOTE_STATUS_B2A[q.status] ?? 'pending',
    createdAt: q.submittedAt ?? '',
    adminNotes: q.supplierResponse ?? '',
    quotedPrice: q.quotedPrice ?? null,
  };
}
