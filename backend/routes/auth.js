import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken } from '../config/auth.js';
import { validateEmail, validatePassword, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Register
router.post('/register', validateEmail, validatePassword, handleValidationErrors, async (req, res) => {
  const { email, password, fullName, role } = req.body;

  try {
    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, full_name, role',
      [email, hashedPassword, fullName, role || 'student']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', validateEmail, handleValidationErrors, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
