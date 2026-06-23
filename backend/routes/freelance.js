import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../config/auth.js';

const router = express.Router();

// Get all gigs (public)
router.get('/gigs', async (req, res) => {
  try {
    const result = await query('SELECT id, title, description, price, category, freelancer_id, created_at FROM gigs WHERE status = $1 ORDER BY created_at DESC', ['active']);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching gigs:', err);
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
});

// Create gig (freelancer)
router.post('/gigs', authenticateToken, async (req, res) => {
  const { title, description, price, category, deliveryTime } = req.body;
  const freelancerId = req.user.userId;

  try {
    const result = await query(
      'INSERT INTO gigs (title, description, price, category, freelancer_id, delivery_time_days, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [title, description, price, category, freelancerId, deliveryTime, 'active']
    );

    res.status(201).json({
      message: 'Gig created successfully',
      gig: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating gig:', err);
    res.status(500).json({ error: 'Failed to create gig' });
  }
});

// Send freelance project request
router.post('/request', authenticateToken, async (req, res) => {
  const { gigId, requirements, budget } = req.body;
  const clientId = req.user.userId;

  try {
    const result = await query(
      'INSERT INTO freelance_requests (gig_id, client_id, requirements, budget, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [gigId, clientId, requirements, budget, 'pending']
    );

    res.status(201).json({
      message: 'Request sent successfully',
      request: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Get freelancer's requests
router.get('/requests/incoming', authenticateToken, async (req, res) => {
  const freelancerId = req.user.userId;

  try {
    const result = await query(
      `SELECT fr.id, fr.gig_id, fr.requirements, fr.budget, fr.status, u.full_name as client_name, fr.created_at
       FROM freelance_requests fr
       JOIN gigs g ON fr.gig_id = g.id
       JOIN users u ON fr.client_id = u.id
       WHERE g.freelancer_id = $1`,
      [freelancerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

export default router;
