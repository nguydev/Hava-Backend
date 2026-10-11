/**
 * Mongoose models for GOODR.
 *
 * Each collection mirrors the frontend domain types (src/types) 1:1. Complex
 * nested structures (address, items, timeline, proofOfDelivery, specs…) are
 * stored as Mixed so the JSON round-trips unchanged and no nested _id fields
 * leak. A shared toJSON transform removes Mongo's `_id`, leaving the string
 * `id` the app expects.
 */
import { Schema, model, Types } from 'mongoose';

const Mixed = Schema.Types.Mixed;

/** Strip Mongo's ObjectId `_id` from serialized output (keep the string `id`). */
const baseOptions = {
  versionKey: false,
  toJSON: {
    transform(_doc: unknown, ret: Record<string, unknown>) {
      delete ret._id;
      return ret;
    },
  },
} as const;

/* -------------------------------- Catalog --------------------------------- */

const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    categoryId: { type: String, required: true, index: true },
    model: { type: String, required: true },
    capacity: String,
    seerRating: String,
    fuelType: String,
    efficiency: String,
    warranty: String,
    dimensions: String,
    weight: String,
    price: { type: Number, default: null },
    availability: String,
    image: String,
    exclusive: { type: Boolean, default: false },
    rating: Number,
    reviews: Number,
    description: String,
    specs: { type: Mixed, default: [] },
    // Admin-managed fields (ignored by the mobile app, used by the admin panel).
    systemType: { type: String, default: null },
    stock: { type: Number, default: null },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    updatedAt: { type: String, default: null },
    priceHistory: { type: Mixed, default: [] }, // { at, price, by }[]
  },
  baseOptions,
);
export const Product = model('Product', productSchema);

const categorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    icon: String,
    blurb: String,
    // Admin-managed fields (ignored by the mobile app).
    group: { type: String, default: 'Regular Systems' },
    active: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  baseOptions,
);
export const Category = model('Category', categorySchema);

/* --------------------------------- Orders --------------------------------- */

const orderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    createdAt: String,
    status: { type: String, index: true },
    items: { type: Mixed, default: [] },
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    address: Mixed,
    contactName: String,
    contactPhone: String,
    preferredDate: String,
    timeWindow: String,
    notes: String,
    liftgate: Boolean,
    driver: { type: Mixed, default: null },
    eta: { type: Mixed, default: null },
    timeline: { type: Mixed, default: [] },
    proofOfDelivery: { type: Mixed, default: null },
    payment: { type: Mixed, default: null },
    sitePhotos: { type: Mixed, default: [] },
  },
  baseOptions,
);
export const Order = model('Order', orderSchema);

/* --------------------------------- Quotes --------------------------------- */

const quoteSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    equipmentType: String,
    brandPreference: String,
    model: String,
    capacity: String,
    projectType: String,
    quantity: Number,
    jobSite: String,
    neededBy: String,
    notes: String,
    attachments: { type: Number, default: 0 },
    attachmentUrls: { type: [String], default: [] },
    submittedAt: String,
    updatedAt: String,
    status: { type: String, index: true },
    quotedPrice: { type: Number, default: null },
    supplierResponse: { type: String, default: null },
    expiresAt: { type: String, default: null },
    systemType: String,
    tonnage: String,
    furnaceBtu: String,
    coilWidth: String,
    efficiencyFuel: String,
    needDelivery: String,
    deliveryType: String,
    urgency: String,
  },
  baseOptions,
);
export const Quote = model('Quote', quoteSchema);

/* ------------------------------- Deliveries ------------------------------- */

const deliverySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    driverId: { type: String, index: true, default: null },
    driverName: { type: String, default: null },
    status: { type: String, index: true },
    priority: String,
    company: String,
    contractorName: String,
    contactPhone: String,
    jobSite: String,
    address: Mixed,
    timeWindow: String,
    scheduledDate: String,
    eta: { type: Mixed, default: null },
    distanceMi: Number,
    instructions: String,
    items: { type: Mixed, default: [] },
    notes: String,
    timeline: { type: Mixed, default: [] },
    proofOfDelivery: { type: Mixed, default: null },
    issue: { type: Mixed, default: null },
    completedAt: { type: Mixed, default: null },
  },
  baseOptions,
);
export const Delivery = model('Delivery', deliverySchema);

/* ----------------------------- Notifications ------------------------------ */

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    category: String,
    title: String,
    message: String,
    time: String,
    read: { type: Boolean, default: false },
    targetType: String,
    targetId: String,
    /** internal ordering (not serialized to the app) */
    seq: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret._id;
        delete ret.seq;
        return ret;
      },
    },
  },
);
export const Notification = model('Notification', notificationSchema);

/* -------------------------------- Addresses ------------------------------- */

const addressSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    label: String,
    line1: String,
    city: String,
    state: String,
    zip: String,
    contactName: String,
    contactPhone: String,
    isDefault: { type: Boolean, default: false },
  },
  baseOptions,
);
export const AddressModel = model('Address', addressSchema);

/* --------------------------------- Billing -------------------------------- */

const paymentMethodSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    holder: String,
    isDefault: { type: Boolean, default: false },
  },
  baseOptions,
);
export const PaymentMethod = model('PaymentMethod', paymentMethodSchema);

const invoiceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: String,
    description: String,
    amount: Number,
    status: String,
    issuedAt: String,
    dueAt: String,
    paidAt: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
  },
  baseOptions,
);
export const Invoice = model('Invoice', invoiceSchema);

/* ---------------------------------- Users --------------------------------- */

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ['contractor', 'driver'], required: true },
    name: String,
    email: { type: String, required: true, index: true },
    phone: String,
    avatar: String,
    // contractor fields
    company: String,
    businessType: String,
    approval: { type: String, enum: ['Approved', 'Pending', 'Rejected'] },
    address: String,
    // driver fields
    vehicle: String,
    driverStatus: String,
    completedDeliveries: Number,
    rating: Number,
    // notification channel/type preferences
    notificationPreferences: { type: Mixed, default: null },
    // auth-only (never serialized to the client)
    passwordHash: { type: String, default: null },
    isDemo: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret._id;
        delete ret.passwordHash;
        delete ret.isDemo;
        delete ret.otpCode;
        delete ret.otpExpiresAt;
        return ret;
      },
    },
  },
);
export const User = model('User', userSchema);

/* ------------------------------ Push tokens ------------------------------- */

const pushTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true }, // ExponentPushToken[...]
    userId: { type: String, index: true },
    role: String,
    platform: String, // ios | android
    updatedAt: { type: String, default: null },
  },
  baseOptions,
);
export const PushToken = model('PushToken', pushTokenSchema);

/** Convenience: a fresh ObjectId-free string id when we need one internally. */
export const oid = () => new Types.ObjectId().toString();
