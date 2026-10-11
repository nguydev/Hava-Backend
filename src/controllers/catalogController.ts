import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { Category, Product } from '../models';
import { categories as categorySeed } from '../data/seedData';

type P = Record<string, any>;

/** GET /products?search=&categoryId=&sort=&page=&limit= */
export const listProducts = ah(async (req: Request, res: Response) => {
  const { search, categoryId, sort, page = '1', limit = '10' } = req.query as Record<string, string>;
  let items = (await Product.find()).map((d) => d.toJSON() as P);

  if (categoryId) items = items.filter((p) => p.categoryId === categoryId);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s) ||
        p.model.toLowerCase().includes(s),
    );
  }

  switch (sort) {
    case 'price-asc':
      items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      break;
    case 'price-desc':
      items.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
      break;
    case 'name':
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      items.sort(
        (a, b) =>
          Number(!!b.exclusive) - Number(!!a.exclusive) ||
          (b.rating ?? 0) - (a.rating ?? 0),
      );
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const total = items.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = items.slice(startIndex, startIndex + limitNum);
  const nextPage = startIndex + limitNum < total ? pageNum + 1 : null;

  res.json({ items: paginatedItems, nextPage, total });
});

/** GET /products/:id */
export const getProduct = ah(async (req: Request, res: Response) => {
  const p = await Product.findOne({ id: req.params.id });
  if (!p) throw new HttpError('Product not found', 404);
  res.json(p.toJSON());
});

/** GET /categories — returned in the canonical catalog order. */
export const listCategories = ah(async (_req: Request, res: Response) => {
  const docs = (await Category.find()).map((d) => d.toJSON() as P);
  const order = new Map(categorySeed.map((c, i) => [c.id, i]));
  docs.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  res.json(docs);
});
