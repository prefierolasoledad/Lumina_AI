import express from 'express';
import {
  createAssignment,
  getAssignment,
  listAssignments,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/generate', createAssignment);
router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);

export default router;
