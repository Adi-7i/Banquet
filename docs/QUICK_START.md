# CYNERZA Backend - Quick Start Guide

## ✅ What's Been Set Up

All files have been created and dependencies are installed. The project structure follows clean architecture principles with:

- **NestJS Framework** with TypeScript
- **Prisma ORM** with PostgreSQL support
- **Environment Management** (dev/staging/prod)
- **Health Check Module**
- **Security Middleware** (Helmet, CORS, Validation)
- **Swagger API Documentation**
- **Clean Architecture Structure**

## 🚀 Next Steps

### 1. Setup PostgreSQL Database

First, ensure PostgreSQL is running on your system. Then create a database:

```sql
CREATE DATABASE cynerza_dev;
```

### 2. Configure Environment Variables

The `.env.development` file is already created. Update the `DATABASE_URL` if needed:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cynerza_dev?schema=public
```

### 3. Run Database Migration

Create the initial migration and apply it to your database:

```bash
npm run prisma:migrate:dev --name init
```

This will:
- Create tables for User, OwnerProfile, CustomerProfile, and Banquet
- Set up indexes
- Initialize the migration history

### 4. (Optional) Open Prisma Studio

Visual database browser to see your data:

```bash
npm run prisma:studio
```

Visit: http://localhost:5555

### 5. Start the Development Server

```bash
npm run start:dev
```

The server will start at: http://localhost:3000

### 6. Verify Everything Works

Once the server is running, test these endpoints:

- **Health Check**: http://localhost:3000/health
- **Database Health**: http://localhost:3000/health/db  
- **Swagger Docs**: http://localhost:3000/api/docs

## 📝 Database Schema Overview

### User
- Roles: ADMIN, OWNER, CUSTOMER
- Email-based authentication
- Linked to either OwnerProfile or CustomerProfile

### OwnerProfile
- Business information
- Manages multiple Banquets
- GST number (optional, unique)

### CustomerProfile
- Personal information
- Booking preferences

### Banquet
- Location and capacity
- Pricing (flexible JSON structure)
- Amenities and images
- Owned by OwnerProfile

All models include:
- Automatic timestamps (createdAt, updatedAt)
- Soft delete support (deletedAt)
- Audit trail (createdBy, updatedBy)

## 🛠️ Available Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode

# Build & Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate:dev # Run migrations (dev)
npm run prisma:studio      # Open database browser
npm run db:reset           # Reset database (⚠️ deletes all data)

# Code Quality
npm run format             # Format code with Prettier
npm test                   # Run tests
npm run test:e2e           # Run E2E tests
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── common/              # Shared utilities
│   ├── config/              # Configuration
│   ├── infrastructure/      # Database & external services
│   ├── modules/             # Feature modules
│   ├── app.module.ts        # Root module
│   └── main.ts              # Entry point
├── prisma/
│   └── schema.prisma        # Database schema
└── test/                    # Tests
```

## 📚 Documentation

- **README.md** - Complete project documentation
- **ARCHITECTURE.md** - Architecture details and design patterns

## 🎯 What to Build Next

Now that the foundation is ready, you can implement:

1. **Authentication Module** - JWT-based auth with login/register
2. **User Management** - CRUD operations for users
3. **Owner Module** - Owner profile management
4. **Customer Module** - Customer profile management
5. **Banquet Module** - Banquet CRUD with search/filter
6. **Booking Module** - Reservation system
7. **File Upload** - Image upload for banquets
8. **Email Notifications** - Booking confirmations
9. **Payment Integration** - Payment gateway

## 💡 Tips

- The soft delete middleware is active - deleted records aren't permanently removed
- Swagger UI auto-updates when you add new endpoints
- Health checks are perfect for load balancer configuration
- Environment validation fails fast if required vars are missing

## 🔒 Security Reminders

- Never commit `.env` files with real secrets
- Use a secrets manager in production (AWS Secrets Manager, Vault, etc.)
- Update JWT_SECRET before deploying
- Review CORS origins for production

---

**You're all set!** Run the migration command and start building features. 🚀
