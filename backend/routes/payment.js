import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../config/auth.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent (Stripe)
router.post('/create-intent', authenticateToken, async (req, res) => {
  const { courseId, amount } = req.body;
  const userId = req.user.userId;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        courseId
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and create transaction record
router.post('/confirm', authenticateToken, async (req, res) => {
  const { courseId, paymentIntentId, amount, paymentMethod } = req.body;
  const userId = req.user.userId;

  try {
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Record transaction
    const result = await query(
      `INSERT INTO transactions (user_id, course_id, amount, payment_method, payment_id, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [userId, courseId, amount, paymentMethod, paymentIntentId, 'completed']
    );

    // Auto-enroll student
    await query(
      'INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [userId, courseId]
    );

    res.json({
      message: 'Payment confirmed and enrollment created',
      transaction: result.rows[0]
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get user transactions
router.get('/history', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await query(
      `SELECT t.id, t.course_id, t.amount, t.payment_method, t.status, t.created_at, c.title as course_title
       FROM transactions t
       LEFT JOIN courses c ON t.course_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
