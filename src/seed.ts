/**
 * Seed the GOODR database. Wipes every collection and re-inserts the demo
 * dataset (catalog, users, orders, quotes, deliveries, notifications, billing).
 *
 *   npm run seed
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDb } from './lib/db';
import {
  AddressModel,
  Category,
  Delivery,
  Invoice,
  Notification,
  Order,
  PaymentMethod,
  Product,
  Quote,
  User,
} from './models';
import {
  Activity,
  AdminNotification,
  AdminQuote,
  AuditLog,
  Contractor,
  Driver,
  DriverNote,
  MessageThread,
  ProofPhoto,
  Setting,
  SupportTicket,
} from './models/admin';
import * as seed from './data/seedData';
import * as adminSeed from './data/adminSeedData';

async function run() {
  dotenv.config();
  await connectDb();
  console.log('Connected. Seeding…');

  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Order.deleteMany({}),
    Quote.deleteMany({}),
    Delivery.deleteMany({}),
    Notification.deleteMany({}),
    AddressModel.deleteMany({}),
    PaymentMethod.deleteMany({}),
    Invoice.deleteMany({}),
    User.deleteMany({}),
    // Admin-owned collections
    Contractor.deleteMany({}),
    Driver.deleteMany({}),
    AdminQuote.deleteMany({}),
    DriverNote.deleteMany({}),
    ProofPhoto.deleteMany({}),
    AdminNotification.deleteMany({}),
    Activity.deleteMany({}),
    AuditLog.deleteMany({}),
    SupportTicket.deleteMany({}),
    Setting.deleteMany({}),
    MessageThread.deleteMany({}),
  ]);

  await Promise.all([
    Category.insertMany(seed.categories),
    Product.insertMany(seed.products),
    Order.insertMany(seed.orders),
    Quote.insertMany(seed.quotes),
    Delivery.insertMany(seed.deliveries),
    Notification.insertMany(seed.notifications),
    AddressModel.insertMany(seed.addresses),
    PaymentMethod.insertMany(seed.paymentMethods),
    Invoice.insertMany(seed.invoices),
    User.insertMany(seed.users),
    // Admin-owned collections
    Contractor.insertMany(adminSeed.contractors),
    Driver.insertMany(adminSeed.drivers),
    AdminQuote.insertMany(adminSeed.adminQuotes),
    DriverNote.insertMany(adminSeed.driverNotes),
    ProofPhoto.insertMany(adminSeed.proofPhotos),
    AdminNotification.insertMany(adminSeed.notifications),
    Activity.insertMany(adminSeed.activity),
    AuditLog.insertMany(adminSeed.auditLogs),
    SupportTicket.insertMany(adminSeed.supportTickets),
  ]);

  console.log(
    `Seeded (app): ${seed.categories.length} categories, ${seed.products.length} products, ` +
      `${seed.orders.length} orders, ${seed.quotes.length} quotes, ${seed.deliveries.length} deliveries, ` +
      `${seed.notifications.length} notifications, ${seed.addresses.length} addresses, ` +
      `${seed.paymentMethods.length} cards, ${seed.invoices.length} invoices, ${seed.users.length} users.`,
  );
  console.log(
    `Seeded (admin): ${adminSeed.contractors.length} contractors, ${adminSeed.drivers.length} drivers, ` +
      `${adminSeed.adminQuotes.length} quotes, ${adminSeed.driverNotes.length} driver-notes, ` +
      `${adminSeed.proofPhotos.length} proof-photos, ${adminSeed.notifications.length} broadcasts, ` +
      `${adminSeed.activity.length} activity, ${adminSeed.auditLogs.length} audit-logs, ` +
      `${adminSeed.supportTickets.length} support-tickets.`,
  );

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
