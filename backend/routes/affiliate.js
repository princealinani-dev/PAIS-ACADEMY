import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../config/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Get affiliate dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  const affiliateId = req.user.userId;

  try {
    // Get affiliate stats
    const stats = await query(
      `SELECT 
        COUNT(DISTINCT ar.id) as total_clicks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN ar.id END) as conversions,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN ar.commission_amount ELSE 0 END), 0) as total_earnings
       FROM affiliate_referrals ar
       LEFT JOIN transactions t ON ar.transaction_id = t.id
       WHERE ar.affiliate_id = $1`,
      [affiliateId]
    );

    // Get referral details
    const referrals = await query(
      `SELECT ar.id, ar.referral_code, ar.clicks, ar.conversion_status, ar.commission_amount, ar.created_at
       FROM affiliate_referrals ar
       WHERE ar.affiliate_id = $1
       ORDER BY ar.created_at DESC
       LIMIT 20`,
      [affiliateId]
    );

    res.json({
      stats: stats.rows[0],
      referrals: referrals.rows
    });
  } catch (err) {
    console.error('Error fetching affiliate dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Generate affiliate referral code
router.post('/generate-code', authenticateToken, async (req, res) => {
  const affiliateId = req.user.userId;

  try {
    const referralCode = crypto.randomBytes(8).toString('hex');

    const result = await query(
      'INSERT INTO affiliate_referrals (affiliate_id, referral_code, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [affiliateId, referralCode]
    );

    res.status(201).json({
      message: 'Referral code generated',
      referralCode: result.rows[0]
    });
  } catch (err) {
    console.error('Error generating code:', err);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Track click
router.post('/track/:referralCode', async (req, res) => {
  const { referralCode } = req.params;

  try {
    const result = await query(
      'UPDATE affiliate_referrals SET clicks = clicks + 1 WHERE referral_code = $1 RETURNING *',
      [referralCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Referral code not found' });
    }

    res.json({ message: 'Click tracked' });
  } catch (err) {
    console.error('Error tracking click:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
