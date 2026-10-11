/** Admin side of support: reply to a ticket's thread (delivered to the app user). */
import type { Request, Response } from 'express';

import { HttpError, ah } from '../../lib/http';
import { pushNotification } from '../../lib/notify';
import { SupportTicket } from '../../models/admin';

const now = () => new Date().toISOString();
const msgId = () => `m-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

/** POST /admin/support-tickets/:id/messages — Body: { text }. Admin agent reply. */
export const reply = ah(async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) throw new HttpError('Reply text is required', 400);

  const ticket = await SupportTicket.findOne({ id: req.params.id });
  if (!ticket) throw new HttpError('Ticket not found', 404);

  const messages = [...(ticket.get('messages') ?? []), { id: msgId(), sender: 'agent', text, at: now() }];
  ticket.set('messages', messages);
  ticket.markModified('messages');
  ticket.set('preview', text);
  ticket.set('at', now());
  ticket.set('status', 'pending');
  ticket.set('unread', false); // admin has now responded
  ticket.set('unreadForUser', true);
  await ticket.save();

  // Notify the customer in-app + via push (targeted to their role).
  const role = ticket.get('role') === 'Driver' ? 'driver' : 'contractor';
  await pushNotification({
    category: 'System',
    title: 'Support replied',
    message: text.length > 90 ? `${text.slice(0, 89)}…` : text,
    roles: [role],
  });

  res.status(201).json(ticket.toJSON());
});
