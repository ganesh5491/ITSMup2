# 🚀 Local Development Setup Guide
## IT Helpdesk Portal - Complete Local Installation

This guide will help you set up and run the IT Helpdesk Portal on your local machine.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

### Database Options
Choose one of the following:

**Option A: Supabase (Recommended)**
- Free PostgreSQL database in the cloud
- No local setup required
- Better for production-like environment

**Option B: Local PostgreSQL**
- **PostgreSQL** (v14 or higher) - [Download](https://postgresql.org/download/)
- More complex setup but full local control

## 🗂️ Project Structure
```
it-helpdesk-portal/
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Shared types and schemas
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── .env.example           # Environment template
└── README.md              # Project documentation
```

## ⚡ Quick Start (Supabase)

### 1. Clone/Download Project
```bash
# If you have git access to this project
git clone <your-repo-url> it-helpdesk-portal
cd it-helpdesk-portal

# OR create new directory and copy all files manually
mkdir it-helpdesk-portal
cd it-helpdesk-portal
# Copy all project files here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Supabase Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project: "IT Helpdesk Portal"
3. Set strong database password
4. Wait for project creation (2-3 minutes)
5. Get connection string:
   - Click "Connect" → "Connection string" → "Transaction pooler"
   - Copy the URI and replace `[YOUR-PASSWORD]` with your password

### 4. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database URL
nano .env
# OR
code .env
```

Add to `.env`:
```
DATABASE_URL=your_supabase_connection_string_here
SESSION_SECRET=your_random_session_secret_here
NODE_ENV=development
PORT=5000
```

### 5. Setup Database Schema
```bash
# Run database migration
npm run db:push
```

### 6. Insert Sample Data
- Open Supabase SQL Editor
- Copy contents from `supabase-sql-queries.sql`
- Run the INSERT statements (skip CREATE TABLE sections)

### 7. Start Development Server
```bash
npm run dev
```

Your app will be available at: `http://localhost:5000`

## 🐘 Local PostgreSQL Setup

### 1. Install PostgreSQL
- **Windows**: Download installer from postgresql.org
- **macOS**: `brew install postgresql` (with Homebrew)
- **Ubuntu**: `sudo apt install postgresql postgresql-contrib`

### 2. Create Database
```bash
# Start PostgreSQL service
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# Create database
createdb it_helpdesk_portal

# Create user (optional)
createuser --interactive helpdesk_user
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Add to `.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/it_helpdesk_portal
SESSION_SECRET=your_random_session_secret_here
NODE_ENV=development
PORT=5000
```

### 4. Run Database Setup
```bash
# Push schema to database
npm run db:push

# Run sample data script
psql -d it_helpdesk_portal -f supabase-sql-queries.sql
```

## 📦 Dependencies

### Backend Dependencies
```json
{
  "@neondatabase/serverless": "^0.9.0",
  "express": "^4.18.2",
  "express-session": "^1.17.3",
  "passport": "^0.7.0",
  "passport-local": "^1.0.0",
  "drizzle-orm": "^0.29.0",
  "drizzle-kit": "^0.20.0",
  "zod": "^3.22.0",
  "connect-pg-simple": "^9.0.1"
}
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "wouter": "^3.0.0",
  "@tanstack/react-query": "^5.0.0",
  "react-hook-form": "^7.47.0",
  "@hookform/resolvers": "^3.3.0",
  "tailwindcss": "^3.3.0",
  "lucide-react": "^0.290.0"
}
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server (frontend + backend)
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)

# Build
npm run build            # Build for production
npm run start            # Start production server

# Utilities
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checking
```

## 🌐 Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session Management
SESSION_SECRET=your-super-secret-session-key

# Application
NODE_ENV=development
PORT=5000
```

### Optional Variables
```bash
# Frontend (prefix with VITE_)
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="IT Helpdesk Portal"

# Logging
LOG_LEVEL=debug
```

## 🧪 Testing the Setup

### 1. Check Database Connection
```bash
# Using npm script
npm run db:studio

# OR manually test connection
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => console.log('DB Connected:', res.rows[0]));
"
```

### 2. Test Application
1. Open `http://localhost:5000`
2. Login with demo credentials:
   - **Admin**: `admin` / `admin123`
   - **Agent**: `agent` / `agent123`
   - **User**: `user` / `user123`
3. Test core features:
   - Create a ticket
   - Browse knowledge base
   - View documentation
   - Check dashboard

## 🔒 Security Considerations

### For Development
- Use strong `SESSION_SECRET` (generate with: `openssl rand -hex 32`)
- Don't commit `.env` file to version control
- Use HTTPS in production

### For Production
- Set `NODE_ENV=production`
- Use environment variables for secrets
- Enable CORS properly
- Set up proper logging
- Use SSL/TLS certificates

## 📁 File Structure Details

```
project/
├── client/src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   └── App.tsx           # Main application component
├── server/
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry point
├── shared/
│   └── schema.ts         # Database schema and types
└── configuration files
```

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

**Database Connection Failed**
- Check DATABASE_URL format
- Verify database is running
- Test connection manually
- Check firewall settings

**Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Database Issues

**Schema Mismatch**
```bash
# Reset and repush schema
npm run db:push
```

**Sample Data Missing**
- Re-run the INSERT queries from `supabase-sql-queries.sql`
- Check for foreign key constraint errors

## 🚀 Deployment Options

### Vercel (Frontend + API)
```bash
npm install -g vercel
vercel --prod
```

### Railway (Full Stack)
```bash
npm install -g @railway/cli
railway login
railway deploy
```

### Docker
```dockerfile
# See Docker deployment section below
```

## 📞 Support

### Getting Help
1. Check console logs for error messages
2. Verify environment variables are set
3. Test database connection separately
4. Check browser network tab for API errors

### Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## ✅ Success Checklist

After setup, you should have:
- [ ] Application running at `http://localhost:5000`
- [ ] Database connected and populated with sample data
- [ ] All demo accounts working (admin/agent/user)
- [ ] No console errors
- [ ] All navigation links functional
- [ ] Ticket creation/viewing working
- [ ] Knowledge base accessible
- [ ] Documentation page available

## 🎉 You're Ready!

Your IT Helpdesk Portal is now running locally. You can:
- Develop new features
- Customize the interface
- Add new functionality
- Test changes in real-time

Happy coding! 🚀