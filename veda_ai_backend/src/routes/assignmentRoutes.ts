import express from 'express';
import {
  createAssignment,
  getAssignment,
  listAssignments,
  deleteAssignment,
  updateAssignment,
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
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/generate', upload.array('files'), createAssignment);
router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);
router.put('/:id', updateAssignment);

export default router;
