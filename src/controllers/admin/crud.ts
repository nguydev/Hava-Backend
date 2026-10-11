import type { Model } from 'mongoose';
import type { Request, Response } from 'express';

import { HttpError, ah } from '../../lib/http';

/**
 * Generic CRUD handlers for admin-owned collections that store the admin's
 * shapes directly. The client supplies the `id` (it generates one optimistically
 * for the Redux store), so create upserts by id.
 */
export function crud(model: Model<any>, idPrefix: string) {
  return {
    list: ah(async (_req: Request, res: Response) => {
      const rows = await model.find();
      res.json(rows.map((r) => r.toJSON()));
    }),

    create: ah(async (req: Request, res: Response) => {
      const body = req.body ?? {};
      const id = body.id ?? `${idPrefix}-${Date.now()}`;
      const doc = await model.findOneAndUpdate(
        { id },
        { $set: { ...body, id } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      res.status(201).json(doc!.toJSON());
    }),

    update: ah(async (req: Request, res: Response) => {
      const { id, ...patch } = req.body ?? {};
      const doc = await model.findOneAndUpdate(
        { id: req.params.id },
        { $set: patch },
        { new: true },
      );
      if (!doc) throw new HttpError('Not found', 404);
      res.json(doc.toJSON());
    }),

    remove: ah(async (req: Request, res: Response) => {
      await model.deleteOne({ id: req.params.id });
      res.json({ id: req.params.id });
    }),
  };
}
