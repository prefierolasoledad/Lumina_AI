import express from 'express';
import {
  createAssignment,
  getAssignment,
  listAssignments,
  deleteAssignment,
  updateAssignment,
  setAssignmentGroup,
} from '../controllers/assignmentController.js';
import { protect } from '../middleware/authMiddleware.js';

import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Ensure uploads dir exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Strip any directory components and unsafe characters from the client-supplied
    // name to prevent path traversal (e.g. "../../etc/passwd").
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

// Only allow document/image types that Gemini can ingest, and cap size to avoid DoS.
const ALLOWED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
];
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10 MB per file, max 5 files
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const router = express.Router();

// Wrap multer so file-type/size rejections return a clean 400 instead of a 500.
const uploadFiles = (req: any, res: any, next: any) => {
  upload.array('files')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'File upload failed' });
    }
    next();
  });
};

// All routes are protected
router.use(protect);

router.post('/generate', uploadFiles, createAssignment);
router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);
router.put('/:id/group', setAssignmentGroup);
router.put('/:id', updateAssignment);

export default router;
