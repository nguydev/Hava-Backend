import fs from 'fs';
import path from 'path';
import multer from 'multer';

/** Absolute path to the server folder where uploaded photos are stored. */
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

let seq = 0;
export function uniqueName(ext: string): string {
  seq = (seq + 1) % 1e6;
  return `img_${Date.now()}_${seq}.${ext}`;
}

/** Public URL for a stored file, absolute so mobile <Image> can load it. */
export function publicUrl(req: { protocol: string; get: (h: string) => string | undefined }, filename: string): string {
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

/** Multer instance: images only, up to 10MB, stored on disk in UPLOAD_DIR. */
export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = EXT_BY_MIME[file.mimetype] || 'jpg';
      cb(null, uniqueName(ext));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

/** Persist a base64 data URI (data:image/png;base64,....) to a file; return its name. */
export function saveDataUri(dataUri: string): string {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUri);
  if (!m) throw new Error('Not a valid base64 image data URI');
  const ext = EXT_BY_MIME[m[1]] || 'jpg';
  const name = uniqueName(ext);
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(m[2], 'base64'));
  return name;
}
