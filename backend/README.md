# PAIS Academy Backend API

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### 2. Installation

```bash
cd backend
npm install
```

### 3. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE pais_academy;
\q
```

### 4. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with:
- Database credentials
- JWT secret (generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Stripe API keys
- M-Pesa credentials

### 5. Run Migrations

```bash
npm run migrate
```

### 6. Seed Database (Optional)

```bash
npm run seed
```

### 7. Start Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:courseId` - Get course details
- `POST /api/courses` - Create course (instructor only)
- `POST /api/courses/:courseId/enroll` - Enroll in course
- `GET /api/courses/student/enrolled` - Get enrolled courses

### Freelance
- `GET /api/freelance/gigs` - List all gigs
- `POST /api/freelance/gigs` - Create gig
- `POST /api/freelance/request` - Send project request
- `GET /api/freelance/requests/incoming` - Get incoming requests

### Affiliate
- `GET /api/affiliate/dashboard` - Get affiliate stats
- `POST /api/affiliate/generate-code` - Generate referral code
- `POST /api/affiliate/track/:referralCode` - Track click

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment & enroll
- `GET /api/payments/history` - Get transaction history

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:userId/stats` - Get user stats

## Architecture

```
backend/
├── config/          # Database & auth config
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── scripts/         # Database migration & seeding
├── server.js        # Main entry point
└── package.json
```

## Next Steps
1. Connect frontend to these API endpoints
2. Implement WebSocket for real-time messaging
3. Add course lesson structure & progress tracking
4. Integrate payment webhooks for automated affiliate commission
5. Add admin dashboard for analytics
