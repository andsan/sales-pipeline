import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { validateAndParse, buildProcessedCsv, UploadValidationError } from '../services/validator';
import { uploadBlob, generateSasUrl } from '../services/blobStorage';

const router = Router();

// Store files in memory — never touch disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const type = file.mimetype;

    // Explicitly reject Excel workbooks
    if (name.endsWith('.xlsx') || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(new Error('Invalid file type: .xlsx is not supported. Please export as .csv and upload that file.'));
      return;
    }

    const isCSV =
      type === 'text/csv' ||
      type === 'application/vnd.ms-excel' ||
      name.endsWith('.csv');

    if (isCSV) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .csv files are accepted.'));
    }
  },
});

// Wrap multer so we can catch size-limit errors before the connection drops
function handleFileUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File exceeds the 10 MB size limit.' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    next();
  });
}

router.post(
  '/',
  requireAuth,
  requireRole('uploader'),
  handleFileUpload,
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided. Use field name "file".' });
      return;
    }

    // ── Validate & parse ──────────────────────────────────────────────────
    let headers: string[];
    let records: Record<string, string>[];

    try {
      ({ headers, records } = validateAndParse(req.file.buffer));
    } catch (err) {
      if (err instanceof UploadValidationError) {
        res.status(422).json({ error: err.message, validation: err.details ?? null });
        return;
      }

      res.status(422).json({ error: (err as Error).message, validation: null });
      return;
    }

    // ── Generate content identifier ────────────────────────────────────────
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const hashPrefix = hash.slice(0, 6);
    const uidPrefix = crypto.randomUUID().split('-')[0]
    const market = (records[0]?.market || 'XX').toString().toUpperCase();
    const submissionId = `CMP-PRODUCTS-${market}-${hashPrefix}-${uidPrefix}`;
    const submittedAt = new Date().toISOString();
    const submittedBy = req.user!.username;

    // ── Build processed CSV ───────────────────────────────────────────────
    const processedCsv = buildProcessedCsv(
      headers,
      records,
      submissionId,
      submittedBy,
      submittedAt,
    );
    const processedBuffer = Buffer.from(processedCsv, 'utf-8');

    // ── Upload to Azure Blob Storage ──────────────────────────────────────
    let blobPath: string;
    try {
      blobPath = await uploadBlob(
        processedBuffer,
        req.file.originalname,
        market,
        submissionId,
        submittedBy,
        submittedAt,
      );
    } catch (err) {
      console.error('[upload] Azure error:', err);
      res.status(502).json({ error: 'Blob storage upload failed. Check server logs.' });
      return;
    }

    // Generate a short-lived SAS download URL (best-effort)
    const downloadUrl = await generateSasUrl(blobPath);

    res.json({
      blobPath,
      submissionId,
      submittedBy,
      submittedAt,
      rowCount: records.length,
      originalFileName: req.file.originalname,
      downloadUrl, // null if SAS generation failed
    });
  },
);

export default router;
