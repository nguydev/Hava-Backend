import type { Request, Response } from 'express';

import { formatDate } from '../lib/domain';
import { HttpError, ah } from '../lib/http';
import { pushNotification } from '../lib/notify';
import { Quote } from '../models';

type Q = Record<string, any>;

/** Next quote id in the Q-#### series (>= 2090). */
async function nextQuoteId(): Promise<string> {
  const quotes = await Quote.find({ id: /^Q-\d+$/ }, { id: 1 }).lean();
  const max = quotes.reduce((m, q) => {
    const n = Number(String(q.id).slice(2));
    return Number.isFinite(n) && n > m ? n : m;
  }, 2089);
  return `Q-${max + 1}`;
}

/** GET /quotes?status=&page=&limit= */
export const listQuotes = ah(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '10' } = req.query as Record<string, string>;
  let items = (await Quote.find()).map((d) => d.toJSON() as Q);
  
  if (status && status !== 'all') {
    const statuses = status.split(',');
    items = items.filter((q) => statuses.includes(q.status));
  }

  items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const total = items.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = items.slice(startIndex, startIndex + limitNum);
  const nextPage = startIndex + limitNum < total ? pageNum + 1 : null;

  res.json({ items: paginatedItems, nextPage, total });
});

/** GET /quotes/:id */
export const getQuote = ah(async (req: Request, res: Response) => {
  const q = await Quote.findOne({ id: req.params.id });
  if (!q) throw new HttpError('Quote not found', 404);
  res.json(q.toJSON());
});

/** POST /quotes — submit a quote request. Body: QuoteRequestValues & { attachments } */
export const submitQuote = ah(async (req: Request, res: Response) => {
  const input = req.body ?? {};
  if (!input.systemType) throw new HttpError('System type is required', 400);

  const attachments: string[] = Array.isArray(input.attachments) ? input.attachments : [];
  const id = await nextQuoteId();
  const now = formatDate(new Date());

  const quote: Q = {
    id,
    equipmentType: input.systemType,
    brandPreference: input.brandPreference,
    quantity: Number(input.quantity) || 1,
    jobSite: input.jobSite,
    neededBy: input.neededBy || input.urgency || '',
    notes: input.notes,
    systemType: input.systemType,
    tonnage: input.tonnage,
    furnaceBtu: input.furnaceBtu,
    coilWidth: input.coilWidth,
    efficiencyFuel: input.efficiencyFuel,
    needDelivery: input.needDelivery,
    deliveryType: input.deliveryType,
    urgency: input.urgency,
    attachments: attachments.length,
    attachmentUrls: attachments,
    submittedAt: now,
    updatedAt: now,
    status: 'Pending',
    quotedPrice: null,
    supplierResponse: null,
    expiresAt: null,
  };

  const created = await Quote.create(quote);
  await pushNotification({
    category: 'Quote',
    title: 'Quote request submitted',
    message: `Quote ${id} for ${input.systemType} is under review.`,
    targetType: 'quote',
    targetId: id,
  });

  res.status(201).json(created.toJSON());
});

/** POST /quotes/:id/accept — only Approved quotes may be accepted. */
export const acceptQuote = ah(async (req: Request, res: Response) => {
  const q = await Quote.findOne({ id: req.params.id });
  if (!q) throw new HttpError('Quote not found', 404);
  if (q.get('status') !== 'Approved')
    throw new HttpError('Only approved quotes can be accepted', 409);

  q.set('status', 'Accepted');
  q.set('updatedAt', formatDate(new Date()));
  await q.save();
  res.json(q.toJSON());
});
