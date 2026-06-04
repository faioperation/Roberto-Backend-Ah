# Startup Template PostgreSQL Backend - v7 Latest

To configure or find database url > go to prisma.config.ts.. (it remove prom prisma/schema.prisma file in v7)

This is a robust startup template for a backend application using Node.js, Express, PostgreSQL, and Prisma. It includes essential features like authentication (OAuth & Email), OTP verification, and user management.

## 🚀 Features

- **Authentication**: Secure login/registration using `bcrypt` and `jsonwebtoken`.
- **OAuth Integration**: Google Login support via `passport-google-oauth20`.
- **OTP System**: Send and verify OTPs for email verification and password resets.
- **User Management**: Profile management, user roles (System Owner, Business Owner, Staff, Customer), and details retrieval.
- **Validation**: Request body and parameter validation using `Zod`.
- **Database Architecture**: Managed by Prisma ORM with PostgreSQL.
- **Error Handling**: Centralized error management system.
- **Mailing**: Integration with `nodemailer` for automated emails with modern, responsive EJS templates.
- **File Upload System**: Reusable Multer configuration supporting multiple categories (e.g., avatars) with automatic path handling and unique naming.
- **Static Assets**: Dedicated structure for serving uploaded files (e.g., user avatars) statically.
- **Security**: CORS, cookie-parser, and middleware-based authorization.

## 📦 Tech Stack & Packages

### Core

- **Framework**: `express`
- **ORM**: `prisma` (v7.x with adapter architecture)
- **Database**: `postgresql` (via `pg` and `@prisma/adapter-pg`)
- **Runtime**: Node.js (ES Modules)

### Main Dependencies

- **Auth**: `passport`, `passport-google-oauth20`, `passport-local`, `jsonwebtoken`, `bcrypt`
- **Security**: `cors`, `cookie-parser`, `zod` (validation)
- **Utilities**: `axios`, `date-fns`, `dotenv`, `multer` (file uploads), `nodemailer`
- **Cache**: `redis`
- **Database Adapter**: `@prisma/adapter-pg` (Required for Prisma v7.x)

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis server (for caching)

### Installation Steps

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd StartupTemplatePostgreSql
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Install Prisma PostgreSQL Adapter** (Required for Prisma v7.x):

   ```bash
   npm install @prisma/adapter-pg
   ```

4. **Set up Environment Variables**:
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name

   # JWT
   JWT_SECRET_TOKEN=your_jwt_secret_key
   JWT_REFRESH_TOKEN=your_refresh_secret_key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=7d

   # App
   NODE_ENV=development
   PORT=8000
   BACKEND_URL=http://localhost:8000

   # Redis
   REDIS_URL=redis://127.0.0.1:6379

   # SMTP (Email Service)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=your_email@gmail.com

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

   # Other
   BCRYPT_SALT_ROUND=10
   EXPRESS_SESSION=10
   FRONT_END_URL=http://localhost:3000
   ```

5. **Prisma Setup**:

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push

   # (Optional) Seed the database
   npx prisma db seed
   ```

6. **Run the application**:
   - Development: `npm run dev`
   - Production: `npm start`

### About Prisma Adapter (@prisma/adapter-pg)

**Purpose**: In Prisma v7.x, the ORM introduced a new adapter-based architecture for better performance and flexibility. The `@prisma/adapter-pg` package provides the PostgreSQL adapter that enables the Prisma Client to connect to PostgreSQL databases.

**Why it's needed**:

- Prisma v7.x requires an adapter for database connections
- Provides efficient connection pooling using the `pg` library
- Enables better resource management and performance
- Supports the new Prisma Client initialization pattern

**How it works**:

```javascript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

## 🔧 Troubleshooting

### Common Issues

1. **Prisma Client Initialization Error**:
   - **Error**: `PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`
   - **Solution**: Ensure `@prisma/adapter-pg` is installed and configured correctly in `src/app/prisma/client.js`

2. **Environment Variables Not Loading**:
   - **Error**: `DATABASE_URL` or other env vars are undefined
   - **Solution**: Check `.env` file syntax (no leading spaces before variable names)

3. **Database Connection Failed**:
   - **Error**: Prisma connection error
   - **Solution**: Verify PostgreSQL is running and `DATABASE_URL` is correct

4. **Redis Connection Failed**:
   - **Error**: Redis connection error
   - **Solution**: Ensure Redis server is running and `REDIS_URL` is correct

### Development Tips

- Use `npm run dev` for development with auto-restart
- Check logs for detailed error messages
- Use the provided Postman collection for API testing
- Database changes require `npx prisma db push` after schema updates

## 🛣️ API Routes & CRUD

### BASE URL > http://localhost:8000/api/

### Auth Module (`/api/auth`)

| Method | Route                              | Description                            |
| ------ | ---------------------------------- | -------------------------------------- |
| POST   | `/auth/login`                      | User login with credentials            |
| POST   | `/auth/refresh-token`              | Get a new access token                 |
| POST   | `/auth/logout`                     | Log out user and clear session         |
| POST   | `/auth/forgot-password`            | Initiate forgot password flow          |
| POST   | `/auth/verify-forgot-password-otp` | Verify OTP for password reset          |
| POST   | `/auth/reset-password`             | Reset user password (Auth required)    |
| POST   | `/auth/change-password`            | Change user password (Auth required)   |
| GET    | `/auth/google`                     | Initiate Google OAuth login            |
| GET    | `/auth/google/url`                 | Get the Google OAuth authorization URL |
| GET    | `/auth/google/callback`            | Google OAuth callback URL              |

### User Module (`/api/user`)

| Method | Route                    | Description                                           |
| ------ | ------------------------ | ----------------------------------------------------- |
| POST   | `/user/register`         | Register a new user (Supports optional avatar upload) |
| GET    | `/user/profile/me`       | Get current logged-in user profile                    |
| GET    | `/user/user-details/:id` | Get specific user details by ID                       |
| GET    | `/user/all`              | Get all users with profiles                           |
| POST   | `/user/update-user`      | Update user information (Admin only)                  |
| PATCH  | `/user/update-profile`   | Update current user profile (Auth required)           |
| PATCH  | `/user/upload-avatar`    | Upload or update user avatar (Auth required)          |

### OTP Module (`/api/otp`)

| Method | Route         | Description            |
| ------ | ------------- | ---------------------- |
| POST   | `/otp/send`   | Send OTP to user email |
| POST   | `/otp/verify` | Verify the sent OTP    |

## 📁 Project Structure

```
komDam-backend/
├── api/                    # API documentation/testing files
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── config.ts          # Prisma configuration (v7.x)
├── src/
│   ├── app.js             # Express app setup
│   ├── server.js          # Server entry point
│   ├── app/
│   │   ├── config/        # Configuration files
│   │   │   ├── dbConnect.js
│   │   │   ├── env.js     # Environment validation
│   │   │   ├── multer.config.js
│   │   │   ├── passport.config.js
│   │   │   └── redis.config.js
│   │   ├── errorHelper/   # Error handling utilities
│   │   ├── lib/           # Core utilities
│   │   ├── middleware/    # Express middleware
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication module
│   │   │   ├── otp/       # OTP module
│   │   │   └── user/      # User management module
│   │   ├── prisma/        # Database client setup
│   │   ├── router/        # Route aggregation
│   │   └── utils/         # Utility functions
├── uploads/               # File uploads directory
├── .env                   # Environment variables
├── package.json
└── README.md
```

## 📮 Postman Collection

Use the provided Postman collection: `[POSTMAN]StartupTemplate.postman_collection.json`

---

_Created with ❤️ for rapid development._ ©️ Ahanaf Mubasshir
