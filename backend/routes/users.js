import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../config/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await query(
      'SELECT id, email, full_name, role, bio, profile_picture_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { fullName, bio, profilePictureUrl } = req.body;

  try {
    const result = await query(
      'UPDATE users SET full_name = $1, bio = $2, profile_picture_url = $3 WHERE id = $4 RETURNING id, email, full_name, role, bio, profile_picture_url',
      [fullName, bio, profilePictureUrl, userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user stats (for mentors/freelancers)
router.get('/:userId/stats', async (req, res) => {
  const { userId } = req.params;

  try {
    const stats = await query(
      `SELECT 
        (SELECT COUNT(*) FROM courses WHERE instructor_id = $1) as courses_created,
        (SELECT COUNT(*) FROM gigs WHERE freelancer_id = $1) as gigs_created,
        (SELECT COUNT(*) FROM transactions WHERE user_id = $1) as total_sales
       FROM users WHERE id = $1`,
      [userId]
    );

    if (stats.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
