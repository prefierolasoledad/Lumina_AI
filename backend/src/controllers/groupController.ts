import Group from '../models/Group.js';

/**
 * POST /api/groups
 * Create a new student group for the logged-in user.
 */
export async function createGroup(req, res) {
  try {
    const userId = req.user._id;
    const { name, grade = '', subject = '', description = '', studentCount = 0, color = 'indigo' } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const group = await Group.create({
      userId,
      name: name.trim(),
      grade: typeof grade === 'string' ? grade.trim() : '',
      subject: typeof subject === 'string' ? subject.trim() : '',
      description: typeof description === 'string' ? description.trim() : '',
      studentCount: Number(studentCount) > 0 ? Math.floor(Number(studentCount)) : 0,
      color: typeof color === 'string' ? color : 'indigo',
    });

    return res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * GET /api/groups
 * List all groups for the logged-in user.
 */
export async function listGroups(req, res) {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: groups });
  } catch (err) {
    console.error('listGroups error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * GET /api/groups/:id
 */
export async function getGroup(req, res) {
  try {
    const userId = req.user._id;
    const group = await Group.findOne({ _id: req.params.id, userId }).lean();
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    return res.json({ success: true, data: group });
  } catch (err) {
    console.error('getGroup error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * PUT /api/groups/:id
 */
export async function updateGroup(req, res) {
  try {
    const userId = req.user._id;
    const { name, grade, subject, description, studentCount, color } = req.body;

    const updates: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Group name cannot be empty' });
      }
      updates.name = name.trim();
    }
    if (grade !== undefined) updates.grade = typeof grade === 'string' ? grade.trim() : '';
    if (subject !== undefined) updates.subject = typeof subject === 'string' ? subject.trim() : '';
    if (description !== undefined) updates.description = typeof description === 'string' ? description.trim() : '';
    if (studentCount !== undefined) updates.studentCount = Number(studentCount) > 0 ? Math.floor(Number(studentCount)) : 0;
    if (color !== undefined) updates.color = typeof color === 'string' ? color : 'indigo';

    const group = await Group.findOneAndUpdate({ _id: req.params.id, userId }, updates, { new: true });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    return res.json({ success: true, data: group });
  } catch (err) {
    console.error('updateGroup error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * DELETE /api/groups/:id
 */
export async function deleteGroup(req, res) {
  try {
    const userId = req.user._id;
    const result = await Group.deleteOne({ _id: req.params.id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    return res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    console.error('deleteGroup error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
