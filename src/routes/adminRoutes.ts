import { Router } from 'express';

import { requireAdmin } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

import * as adminAuth from '../controllers/admin/adminAuthController';
import * as shared from '../controllers/admin/sharedController';
import * as notif from '../controllers/admin/notificationController';
import * as adminSettings from '../controllers/admin/settingsController';
import * as adminStats from '../controllers/admin/statsController';
import * as adminSupport from '../controllers/admin/supportController';
import * as uploads from '../controllers/uploadController';
import { upload } from '../lib/uploads';
import { crud } from '../controllers/admin/crud';
import {
  Activity,
  AdminQuote,
  AuditLog,
  Contractor,
  Driver,
  DriverNote,
  ProofPhoto,
  SupportTicket,
} from '../models/admin';

const router = Router();

/* ---------------------------------- Auth ---------------------------------- */
router.post('/auth/login', authRateLimiter, adminAuth.login);
router.post('/auth/forgot', authRateLimiter, adminAuth.forgot);
router.get('/auth/me', requireAdmin, adminAuth.me);

/* Everything below requires an admin token. */
router.use(requireAdmin);

/* ---------------- Shared with the app (adapted collections) --------------- */
router.get('/products', shared.listProducts);
router.post('/products', shared.createProduct);
router.get('/products/:id/price-history', shared.getProductPriceHistory);
router.patch('/products/:id', shared.updateProduct);
router.delete('/products/:id', shared.removeProduct);

router.get('/categories', shared.listCategories);
router.post('/categories', shared.createCategory);
router.patch('/categories/:id', shared.updateCategory);
router.delete('/categories/:id', shared.removeCategory);

router.get('/orders', shared.listOrders);
router.get('/orders/:id', shared.getOrder);
router.patch('/orders/:id', shared.updateOrder);

router.get('/pricing-requests', shared.listPricingRequests);
router.patch('/pricing-requests/:id', shared.updatePricingRequest);

/* --------------------------- Broadcast console ---------------------------- */
router.get('/notifications', notif.list);
router.post('/notifications', notif.create);
router.delete('/notifications/:id', notif.remove);

/* --------------------------------- Settings ------------------------------- */
router.get('/settings', adminSettings.get);
router.put('/settings', adminSettings.update);

/* --------------------------------- Analytics ------------------------------ */
router.get('/stats', adminStats.stats);

/* --------------------------------- Uploads -------------------------------- */
router.post('/uploads', upload.single('file'), uploads.uploadFiles);
router.post('/uploads/base64', uploads.uploadBase64);

/* ------------------------------ Support replies --------------------------- */
router.post('/support-tickets/:id/messages', adminSupport.reply);

/* ---------------------- Admin-owned collections (CRUD) -------------------- */
function mount(path: string, model: any, prefix: string, readonly = false) {
  const c = crud(model, prefix);
  router.get(path, c.list);
  if (!readonly) {
    router.post(path, c.create);
    router.patch(`${path}/:id`, c.update);
    router.delete(`${path}/:id`, c.remove);
  }
}

mount('/contractors', Contractor, 'c');
mount('/drivers', Driver, 'd');
mount('/quotes', AdminQuote, 'q');
mount('/driver-notes', DriverNote, 'dn');
mount('/proof-photos', ProofPhoto, 'pp');
mount('/support-tickets', SupportTicket, 'st');
mount('/activity', Activity, 'a', true);
mount('/audit-logs', AuditLog, 'al', true);

export default router;
