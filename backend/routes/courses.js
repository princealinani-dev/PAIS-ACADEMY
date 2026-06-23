import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, authorizeRole } from '../config/auth.js';

const router = express.Router();

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT id, title, description, price, category, instructor_id, created_at FROM courses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course
router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await query(
      'SELECT id, title, description, price, category, instructor_id, created_at FROM courses WHERE id = $1',
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course (instructor only)
router.post('/', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
  const { title, description, price, category } = req.body;
  const instructorId = req.user.userId;

  try {
    const result = await query(
      'INSERT INTO courses (title, description, price, category, instructor_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [title, description, price, category, instructorId]
    );

    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Enroll in course (student)
router.post('/:courseId/enroll', authenticateToken, async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId;

  try {
    // Check if already enrolled
    const enrolled = await query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    if (enrolled.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const result = await query(
      'INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES ($1, $2, NOW()) RETURNING *',
      [studentId, courseId]
    );

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment: result.rows[0]
    });
  } catch (err) {
    console.error('Error enrolling:', err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

// Get enrolled courses for student
router.get('/student/enrolled', authenticateToken, async (req, res) => {
  const studentId = req.user.userId;

  try {
    const result = await query(
      `SELECT c.id, c.title, c.description, c.price, c.category, e.enrolled_at 
       FROM courses c 
       JOIN enrollments e ON c.id = e.course_id 
       WHERE e.student_id = $1`,
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
});

export default router;
