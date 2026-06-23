import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        bio TEXT,
        profile_picture_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Courses table
    await query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        instructor_id INT NOT NULL REFERENCES users(id),
        video_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Courses table created');

    // Enrollments table
    await query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES users(id),
        course_id INT NOT NULL REFERENCES courses(id),
        progress DECIMAL(5, 2) DEFAULT 0,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(student_id, course_id)
      )
    `);
    console.log('✓ Enrollments table created');

    // Gigs table (freelance)
    await query(`
      CREATE TABLE IF NOT EXISTS gigs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        freelancer_id INT NOT NULL REFERENCES users(id),
        delivery_time_days INT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Gigs table created');

    // Freelance requests table
    await query(`
      CREATE TABLE IF NOT EXISTS freelance_requests (
        id SERIAL PRIMARY KEY,
        gig_id INT NOT NULL REFERENCES gigs(id),
        client_id INT NOT NULL REFERENCES users(id),
        requirements TEXT,
        budget DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Freelance requests table created');

    // Affiliate referrals table
    await query(`
      CREATE TABLE IF NOT EXISTS affiliate_referrals (
        id SERIAL PRIMARY KEY,
        affiliate_id INT NOT NULL REFERENCES users(id),
        referral_code VARCHAR(50) UNIQUE NOT NULL,
        clicks INT DEFAULT 0,
        conversion_status VARCHAR(50),
        commission_amount DECIMAL(10, 2) DEFAULT 0,
        transaction_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Affiliate referrals table created');

    // Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id),
        course_id INT REFERENCES courses(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Transactions table created');

    // Ratings table
    await query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        rater_id INT NOT NULL REFERENCES users(id),
        rated_user_id INT NOT NULL REFERENCES users(id),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        course_id INT REFERENCES courses(id),
        gig_id INT REFERENCES gigs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Ratings table created');

    console.log('\n✓ All migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
};

runMigrations();
