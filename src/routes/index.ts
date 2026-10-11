import { Router } from 'express';

import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

import * as auth from '../controllers/authController';
import * as catalog from '../controllers/catalogController';
import * as orders from '../controllers/orderController';
import * as quotes from '../controllers/quoteController';
import * as deliveries from '../controllers/deliveryController';
import * as notifications from '../controllers/notificationController';
import * as profile from '../controllers/profileController';
import * as addresses from '../controllers/addressController';
import * as billing from '../controllers/billingController';
import * as payments from '../controllers/paymentController';
import * as uploads from '../controllers/uploadController';
import { upload } from '../lib/uploads';
import * as push from '../controllers/pushController';
import * as support from '../controllers/supportController';
import * as messages from '../controllers/messageController';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'goodr-api' }));

/* --------------------------------- Auth ----------------------------------- */
router.post('/auth/login', authRateLimiter, auth.login);
router.post('/auth/register', authRateLimiter, auth.register);
router.post('/auth/forgot-password', authRateLimiter, auth.forgotPassword);
router.post('/auth/verify-otp', authRateLimiter, auth.verifyOtp);
router.post('/auth/reset-password', authRateLimiter, auth.resetPassword);
router.get('/auth/me', requireAuth, auth.me);
router.post('/auth/change-password', requireAuth, auth.changePassword);

/* -------------------------------- Catalog --------------------------------- */
router.get('/products', requireAuth, catalog.listProducts);
router.get('/products/:id', requireAuth, catalog.getProduct);
router.get('/categories', requireAuth, catalog.listCategories);

/* --------------------------------- Orders --------------------------------- */
router.get('/orders', requireAuth, orders.listOrders);
router.post('/orders', requireAuth, orders.createOrder);
router.get('/orders/:id', requireAuth, orders.getOrder);

/* --------------------------------- Quotes --------------------------------- */
router.get('/quotes', requireAuth, quotes.listQuotes);
router.post('/quotes', requireAuth, quotes.submitQuote);
router.get('/quotes/:id', requireAuth, quotes.getQuote);
router.post('/quotes/:id/accept', requireAuth, quotes.acceptQuote);

/* ------------------------------- Deliveries ------------------------------- */
router.get('/deliveries', requireAuth, deliveries.listDeliveries);
router.post('/deliveries', requireAuth, deliveries.createDelivery);
router.get('/deliveries/:id', requireAuth, deliveries.getDelivery);
router.post('/deliveries/:id/claim', requireAuth, deliveries.claimDelivery);
router.patch('/deliveries/:id/status', requireAuth, deliveries.updateDeliveryStatus);
router.patch('/deliveries/:id/eta', requireAuth, deliveries.updateDeliveryEta);
router.post('/deliveries/:id/proof', requireAuth, deliveries.submitProofOfDelivery);
router.post('/deliveries/:id/issue', requireAuth, deliveries.reportDeliveryIssue);

/* ----------------------------- Notifications ------------------------------ */
router.get('/notifications', requireAuth, notifications.listNotifications);
router.patch('/notifications/read-all', requireAuth, notifications.markAllNotificationsRead);
router.patch('/notifications/:id/read', requireAuth, notifications.markNotificationRead);

/* ----------------------------- Profile / addr ----------------------------- */
router.get('/profile', requireAuth, profile.getProfile);
router.put('/profile', requireAuth, profile.updateProfile);
router.get('/profile/notification-preferences', requireAuth, profile.getNotificationPreferences);
router.put('/profile/notification-preferences', requireAuth, profile.updateNotificationPreferences);
router.get('/addresses', requireAuth, addresses.listAddresses);
router.post('/addresses', requireAuth, addresses.saveAddress);
router.put('/addresses/:id', requireAuth, addresses.saveAddress);
router.delete('/addresses/:id', requireAuth, addresses.deleteAddress);

/* --------------------------------- Billing -------------------------------- */
router.get('/billing/payment-methods', requireAuth, billing.listPaymentMethods);
router.post('/billing/payment-methods', requireAuth, billing.addPaymentMethod);
router.patch('/billing/payment-methods/:id/default', requireAuth, billing.setDefaultPaymentMethod);
router.delete('/billing/payment-methods/:id', requireAuth, billing.deletePaymentMethod);
router.get('/billing/invoices', requireAuth, billing.listInvoices);
router.post('/billing/invoices/:id/pay', requireAuth, billing.payInvoice);

/* --------------------------------- Payments (Stripe) ---------------------- */
router.get('/payments/config', payments.getConfig);
router.post('/payments/create-intent', requireAuth, payments.createIntent);

/* --------------------------------- Uploads (server folder) ---------------- */
router.post('/uploads', requireAuth, upload.array('files', 10), uploads.uploadFiles);
router.post('/uploads/single', requireAuth, upload.single('file'), uploads.uploadFiles);
router.post('/uploads/base64', requireAuth, uploads.uploadBase64);

/* --------------------------------- Push notifications --------------------- */
router.post('/push/register', requireAuth, push.register);
router.post('/push/unregister', requireAuth, push.unregister);
router.post('/push/test', requireAuth, push.test);

/* --------------------------------- Support chat --------------------------- */
router.get('/support/faqs', requireAuth, support.getFAQs);
router.get('/support/thread', requireAuth, support.getThread);
router.post('/support/messages', requireAuth, support.sendMessage);

/* --------------------------- Delivery messaging --------------------------- */
router.get('/messages/:threadId', requireAuth, messages.getThread);
router.post('/messages/:threadId', requireAuth, messages.postMessage);

export default router;
