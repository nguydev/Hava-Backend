/**
 * Delivers scheduled admin broadcasts. A broadcast created with status
 * 'scheduled' and a future `at` sits until that time, then this sweep flips it
 * to 'sent' and fires the in-app notification + device push.
 */
import { pushNotification } from './notify';
import { AdminNotification } from '../models/admin';

function rolesForAudience(audience: unknown): string[] | undefined {
  const a = String(audience ?? '').toLowerCase();
  if (a.includes('contractor')) return ['contractor'];
  if (a.includes('driver')) return ['driver'];
  return undefined;
}

async function sweep(): Promise<void> {
  const nowIso = new Date().toISOString();
  const due = await AdminNotification.find({ status: 'scheduled', at: { $lte: nowIso } });
  for (const doc of due) {
    doc.set('status', 'sent');
    await doc.save();
    await pushNotification({
      category: 'System',
      title: doc.get('title') ?? '',
      message: doc.get('body') ?? '',
      roles: rolesForAudience(doc.get('audience')),
    });
    console.log(`[scheduler] delivered scheduled broadcast ${doc.get('id')}`);
  }
}

/** Start the 60s sweep loop. Safe to call once at server start. */
export function startScheduler(intervalMs = 60_000): void {
  setInterval(() => {
    sweep().catch((e) => console.error('[scheduler] sweep failed:', e));
  }, intervalMs);
}
