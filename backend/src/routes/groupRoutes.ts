import express from 'express';
import {
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All group routes require authentication
router.use(protect);

router.post('/', createGroup);
router.get('/', listGroups);
router.get('/:id', getGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;
