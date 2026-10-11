import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { AddressModel } from '../models';

type A = Record<string, any>;

async function nextAddressId(): Promise<string> {
  const rows = await AddressModel.find({ id: /^addr-\d+$/ }, { id: 1 }).lean();
  const max = rows.reduce((m, a) => {
    const n = Number(String(a.id).slice(5));
    return Number.isFinite(n) && n > m ? n : m;
  }, 99);
  return `addr-${max + 1}`;
}

/** GET /addresses */
export const listAddresses = ah(async (_req: Request, res: Response) => {
  const rows = await AddressModel.find();
  res.json(rows.map((a) => a.toJSON()));
});

/**
 * POST /addresses (create) or PUT /addresses/:id (update).
 * Body: AddressValues & { id? }. A single default is enforced.
 */
export const saveAddress = ah(async (req: Request, res: Response) => {
  const input: A = { ...req.body, ...(req.params.id ? { id: req.params.id } : {}) };

  if (input.isDefault) {
    await AddressModel.updateMany({}, { $set: { isDefault: false } });
  }

  if (input.id) {
    const existing = await AddressModel.findOne({ id: input.id });
    if (!existing) throw new HttpError('Address not found', 404);
    const { id, ...fields } = input;
    const updated = await AddressModel.findOneAndUpdate(
      { id: input.id },
      { $set: fields },
      { new: true },
    );
    return res.json(updated!.toJSON());
  }

  const created = await AddressModel.create({ ...input, id: await nextAddressId() });
  res.status(201).json(created.toJSON());
});

/** DELETE /addresses/:id */
export const deleteAddress = ah(async (req: Request, res: Response) => {
  await AddressModel.deleteOne({ id: req.params.id });
  res.json({ id: req.params.id });
});
