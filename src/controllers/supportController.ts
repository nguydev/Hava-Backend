/** App-facing support chat: one ticket/thread per user, replied to from the admin. */
import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { User } from '../models';
import { FAQ, SupportTicket } from '../models/admin';

const now = () => new Date().toISOString();
const msgId = () => `m-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

async function getOrCreateTicket(userId: string) {
  let ticket = await SupportTicket.findOne({ userId });
  if (ticket) return ticket;
  const user = await User.findOne({ id: userId });
  const role = user?.get('role') === 'driver' ? 'Driver' : 'Contractor';
  ticket = await SupportTicket.create({
    id: `st-${userId}`,
    userId,
    from: user?.get('name') ?? 'Customer',
    role,
    subject: 'Support conversation',
    preview: 'You’re connected to GOODR live support.',
    status: 'open',
    at: now(),
    unread: false,
    unreadForUser: false,
    messages: [
      { id: msgId(), sender: 'system', text: 'You’re connected to GOODR live support.', at: now() },
      {
        id: msgId(),
        sender: 'agent',
        text: 'Hi there! 👋 This is GOODR support. How can we help you today?',
        at: now(),
      },
    ],
  });
  return ticket;
}

/** GET /support/thread — the caller's support conversation (created on first use). */
export const getThread = ah(async (req: Request, res: Response) => {
  const ticket = await getOrCreateTicket(req.user!.userId);
  // Reading the thread clears the user's unread flag.
  if (ticket.get('unreadForUser')) {
    ticket.set('unreadForUser', false);
    await ticket.save();
  }
  res.json(ticket.toJSON());
});

/** POST /support/messages — Body: { text }. Appends a user message. */
export const sendMessage = ah(async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) throw new HttpError('Message text is required', 400);

  const ticket = await getOrCreateTicket(req.user!.userId);
  const messages = [...(ticket.get('messages') ?? []), { id: msgId(), sender: 'user', text, at: now() }];
  ticket.set('messages', messages);
  ticket.markModified('messages');
  ticket.set('preview', text);
  ticket.set('at', now());
  ticket.set('status', 'open');
  ticket.set('unread', true); // unread for admin
  await ticket.save();

  res.status(201).json(ticket.toJSON());
});

/** GET /support/faqs — returns the FAQs for the mobile app */
export const getFAQs = ah(async (_req: Request, res: Response) => {
  const faqs = await FAQ.find().sort({ order: 1 });
  // If db is empty, seed some default FAQs just for demo purposes so it's not entirely blank
  if (faqs.length === 0) {
    const defaultFaqs = [
      {
        id: 'faq-1',
        q: 'How do I track a delivery?',
        a: 'Open the order from Orders and tap “Track delivery” to see the live status timeline, driver, and ETA.',
        order: 1,
      },
      {
        id: 'faq-2',
        q: 'When should I request a quote instead of ordering?',
        a: 'Rooftop units, boilers, and other special-order equipment are quote-only. Use “Request Quote” on the product or the Quotes tab.',
        order: 2,
      },
      {
        id: 'faq-3',
        q: 'Can I save job site addresses?',
        a: 'Yes — manage saved job sites under Profile → Saved job sites so checkout is one tap.',
        order: 3,
      },
    ];
    await FAQ.insertMany(defaultFaqs);
    return res.json(defaultFaqs);
  }
  res.json(faqs.map(f => f.toJSON()));
});
