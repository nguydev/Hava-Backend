/** Per-thread 1:1 messaging (contractor <-> driver about a delivery). */
import type { Request, Response } from 'express';

import { ah, HttpError } from '../lib/http';
import { MessageThread } from '../models/admin';

const now = () => new Date().toISOString();
const msgId = () => `m-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

async function getOrCreate(threadId: string, peer?: string) {
  let t = await MessageThread.findOne({ threadId });
  if (!t) {
    t = await MessageThread.create({ threadId, peer: peer ?? 'Contact', messages: [], updatedAt: now() });
  } else if (peer && !t.get('peer')) {
    t.set('peer', peer);
    await t.save();
  }
  return t;
}

/** GET /messages/:threadId?peer=Name — the thread (created on first access). */
export const getThread = ah(async (req: Request, res: Response) => {
  const t = await getOrCreate(String(req.params.threadId), req.query.peer as string | undefined);
  res.json(t.toJSON());
});

/** POST /messages/:threadId — Body: { text, sender?, peer? }. Appends a message. */
export const postMessage = ah(async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) throw new HttpError('Message text is required', 400);
  const sender = req.body?.sender === 'peer' ? 'peer' : 'user';

  const t = await getOrCreate(String(req.params.threadId), req.body?.peer);
  const messages = [...(t.get('messages') ?? []), { id: msgId(), sender, text, at: now() }];
  t.set('messages', messages);
  t.markModified('messages');
  t.set('updatedAt', now());
  await t.save();

  res.status(201).json(t.toJSON());
});
