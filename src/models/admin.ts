/**
 * Admin-owned collections — records the admin panel manages that have no direct
 * mobile-app equivalent. Products, categories, orders and quotes are NOT here:
 * those are shared with the mobile app and served via adapters over the existing
 * collections so the two stay in sync.
 */
import { Schema, model } from 'mongoose';

const Mixed = Schema.Types.Mixed;

const baseOptions = {
  versionKey: false,
  toJSON: {
    transform(_doc: unknown, ret: Record<string, unknown>) {
      delete ret._id;
      return ret;
    },
  },
} as const;

/* ------------------------------- Contractors ------------------------------ */

const contractorSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    company: String,
    contactName: String,
    email: { type: String, index: true },
    phone: String,
    address: String,
    city: String,
    state: String,
    status: { type: String, default: 'active' }, // active | pending | suspended
    joinedAt: String,
    orderCount: { type: Number, default: 0 },
    quoteCount: { type: Number, default: 0 },
    pricingRequests: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    businessType: String,
    avatarColor: String,
  },
  baseOptions,
);
export const Contractor = model('Contractor', contractorSchema);

/* --------------------------------- Drivers -------------------------------- */

const driverSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: String,
    email: { type: String, index: true },
    phone: String,
    vehicle: String,
    plate: String,
    status: { type: String, default: 'available' }, // available | on_delivery | offline | suspended
    activeDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 100 },
    joinedAt: String,
    zone: String,
    lat: Number,
    lng: Number,
    progress: { type: Number, default: 0 },
    lastUpdated: String,
  },
  baseOptions,
);
export const Driver = model('Driver', driverSchema);

/* ------------------------------ Admin quotes ------------------------------ */
/* The admin's line-item quote builder (distinct from mobile equipment quotes). */

const adminQuoteSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    contractorId: String,
    contractor: String,
    lines: { type: Mixed, default: [] }, // { productId?, name, quantity, unitPrice, discount }[]
    notes: String,
    validUntil: String,
    status: { type: String, default: 'draft' }, // draft | sent | accepted | rejected | expired
    createdAt: String,
    total: { type: Number, default: 0 },
  },
  baseOptions,
);
export const AdminQuote = model('AdminQuote', adminQuoteSchema);

/* ------------------------------ Driver notes ------------------------------ */

const driverNoteSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: String,
    driverId: String,
    driver: String,
    type: { type: String, default: 'general' }, // issue | damage | unavailable | general
    text: String,
    at: String,
  },
  baseOptions,
);
export const DriverNote = model('DriverNote', driverNoteSchema);

/* ------------------------------ Proof photos ------------------------------ */

const proofPhotoSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: String,
    driverId: String,
    driver: String,
    contractor: String,
    address: String,
    deliveredAt: String,
    signedBy: String,
    color: String,
  },
  baseOptions,
);
export const ProofPhoto = model('ProofPhoto', proofPhotoSchema);

/* --------------------------- Admin notifications -------------------------- */
/* Outbound broadcast console (not the mobile per-user feed). */

const adminNotificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    body: String,
    audience: String,
    priority: { type: String, default: 'normal' }, // normal | high
    status: { type: String, default: 'sent' }, // sent | scheduled | failed
    at: String,
    reach: { type: Number, default: 0 },
  },
  baseOptions,
);
export const AdminNotification = model('AdminNotification', adminNotificationSchema);

/* --------------------------------- Activity ------------------------------- */

const activitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    actor: String,
    action: String,
    target: String,
    at: String,
    kind: String, // order | quote | contractor | driver | product | system
  },
  baseOptions,
);
export const Activity = model('Activity', activitySchema);

/* -------------------------------- Audit logs ------------------------------ */

const auditLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    admin: String,
    action: String,
    entity: String,
    at: String,
    ip: String,
  },
  baseOptions,
);
export const AuditLog = model('AuditLog', auditLogSchema);

/* ------------------------------ Support tickets --------------------------- */

const supportTicketSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    from: String,
    role: String, // Contractor | Driver
    subject: String,
    preview: String,
    status: { type: String, default: 'open' }, // open | pending | resolved
    at: String,
    unread: { type: Boolean, default: true }, // unread for admin
    // Chat thread (app <-> admin) and ownership
    userId: { type: String, index: true, default: null },
    messages: { type: Mixed, default: [] }, // { id, sender:'user'|'agent'|'system', text, at }[]
    unreadForUser: { type: Boolean, default: false },
  },
  baseOptions,
);
export const SupportTicket = model('SupportTicket', supportTicketSchema);

/* ------------------------------- App settings ----------------------------- */
/* Singleton document (id: 'app') edited from the admin Settings screen. */

const settingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    profile: { type: Mixed, default: {} }, // name, email, phone, avatar (admin display)
    business: { type: Mixed, default: {} }, // legalName, supportEmail, supportPhone, address, currency, timezone
    zones: { type: Mixed, default: {} }, // { [zone]: boolean }
    availability: { type: Mixed, default: {} }, // defaultAvailability, lowStockThreshold, prefs...
    alerts: { type: Mixed, default: {} }, // { [alert]: boolean }
    updatedAt: { type: String, default: null },
  },
  baseOptions,
);
export const Setting = model('Setting', settingSchema);

/* --------------------------- Delivery messaging --------------------------- */
/* 1:1 threads between a contractor and driver about a delivery/order. */

const messageThreadSchema = new Schema(
  {
    threadId: { type: String, required: true, unique: true, index: true },
    peer: String, // display name of the other party
    messages: { type: Mixed, default: [] }, // { id, sender:'user'|'peer'|'system', text, at }[]
    updatedAt: { type: String, default: null },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret._id;
        return ret;
      },
    },
  },
);
export const MessageThread = model('MessageThread', messageThreadSchema);

/* ---------------------------------- FAQ ----------------------------------- */
const faqSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    q: String,
    a: String,
    order: { type: Number, default: 0 },
  },
  baseOptions,
);
export const FAQ = model('FAQ', faqSchema);

