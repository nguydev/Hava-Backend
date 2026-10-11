import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { publicUrl, saveDataUri } from '../lib/uploads';

/**
 * POST /uploads  (multipart/form-data, field "file" or "files")
 * Returns { url } for a single file, or { urls } for multiple.
 * The Multer middleware has already written the file(s) to the server folder.
 */
export const uploadFiles = ah(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const single = req.file as Express.Multer.File | undefined;

  if (single) return res.status(201).json({ url: publicUrl(req, single.filename) });
  if (files.length) {
    return res.status(201).json({ urls: files.map((f) => publicUrl(req, f.filename)) });
  }
  throw new HttpError('No image file provided', 400);
});

/**
 * POST /uploads/base64  Body: { image | images: dataUri(s) }
 * Convenience for the mobile app, which handles photos as base64 data URIs.
 */
export const uploadBase64 = ah(async (req: Request, res: Response) => {
  const { image, images } = req.body ?? {};
  try {
    if (typeof image === 'string') {
      return res.status(201).json({ url: publicUrl(req, saveDataUri(image)) });
    }
    if (Array.isArray(images) && images.length) {
      const urls = images.map((d: string) => publicUrl(req, saveDataUri(d)));
      return res.status(201).json({ urls });
    }
  } catch (e) {
    throw new HttpError(e instanceof Error ? e.message : 'Invalid image data', 400);
  }
  throw new HttpError('No image data provided', 400);
});
