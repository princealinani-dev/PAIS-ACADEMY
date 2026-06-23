import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Clear existing data
    await query('DELETE FROM ratings');
    await query('DELETE FROM transactions');
    await query('DELETE FROM affiliate_referrals');
    await query('DELETE FROM freelance_requests');
    await query('DELETE FROM gigs');
    await query('DELETE FROM enrollments');
    await query('DELETE FROM courses');
    await query('DELETE FROM users');
    console.log('✓ Cleared existing data');

    // Create sample users
    const hashedPassword = await bcrypt.hash('Password123', 10);

    const users = [
      { email: 'instructor@pais.com', password: hashedPassword, name: 'Alice Instructor', role: 'instructor' },
      { email: 'student@pais.com', password: hashedPassword, name: 'Bob Student', role: 'student' },
      { email: 'freelancer@pais.com', password: hashedPassword, name: 'Charlie Freelancer', role: 'freelancer' },
      { email: 'affiliate@pais.com', password: hashedPassword, name: 'Diana Affiliate', role: 'affiliate' }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await query(
        'INSERT INTO users (email, password_hash, full_name, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
        [user.email, user.password, user.name, user.role]
      );
      userIds.push(result.rows[0].id);
    }
    console.log('✓ Created sample users');

    // Create sample courses
    const courses = [
      { title: 'Crypto Trading Mastery', desc: 'Learn Binance trading strategies', price: 49.99, category: 'crypto', instructor: userIds[0] },
      { title: 'Web Development Bootcamp', desc: 'HTML, CSS, JavaScript from scratch', price: 79.99, category: 'web', instructor: userIds[0] },
      { title: 'Affiliate Marketing 101', desc: 'Build passive income streams', price: 39.99, category: 'affiliate', instructor: userIds[0] }
    ];

    for (const course of courses) {
      await query(
        'INSERT INTO courses (title, description, price, category, instructor_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [course.title, course.desc, course.price, course.category, course.instructor]
      );
    }
    console.log('✓ Created sample courses');

    // Create sample gigs
    const gigs = [
      { title: 'Build Your Website', desc: 'Professional 5-page website', price: 299.99, freelancer: userIds[2] },
      { title: 'Trading Consultation', desc: '1-on-1 Binance trading session', price: 149.99, freelancer: userIds[2] }
    ];

    for (const gig of gigs) {
      await query(
        'INSERT INTO gigs (title, description, price, category, freelancer_id, delivery_time_days, status, created_at) VALUES ($1, $2, $3, $4, $5, 7, $6, NOW())',
        [gig.title, gig.desc, gig.price, 'general', gig.freelancer, 'active']
      );
    }
    console.log('✓ Created sample gigs');

    console.log('\n✓ Database seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedDatabase();
