# 🚀 Local Development & Deployment Guide
## IT Helpdesk Portal - Complete Setup for Local Development + Hosting

This guide covers local development setup and deployment to Netlify, Vercel, or other hosting platforms using Supabase as the database.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

### Accounts Needed
- **Supabase Account** (free) - [Sign up](https://supabase.com/)
- **Netlify Account** (free) - [Sign up](https://netlify.com/) OR
- **Vercel Account** (free) - [Sign up](https://vercel.com/)

## 📁 Download Project Files

### Step 1: Create Project Directory
```bash
mkdir it-helpdesk-portal
cd it-helpdesk-portal
```

### Step 2: Copy All Files
You'll need to copy these files from your Replit project to your local directory:

**Essential Files to Copy:**
```
client/src/          (entire folder)
server/              (entire folder)  
shared/              (entire folder)
package.json
package-lock.json
tsconfig.json
vite.config.ts
tailwind.config.ts
postcss.config.js
drizzle.config.ts
theme.json
.gitignore
```

**Migration Files:**
```
supabase-sql-queries.sql
supabase-migration-guide.md
SUPABASE_MIGRATION_CHECKLIST.md
```

## ⚡ Local Development Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
```bash
# Create .env file
touch .env
```

Add to `.env`:
```bash
# Database
DATABASE_URL=your_supabase_url_here
PGHOST=your_supabase_host
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_supabase_password
PGDATABASE=postgres

# Session Management
SESSION_SECRET=generate_a_random_secret_key_here

# Development
NODE_ENV=development
PORT=5000
```

### Step 3: Setup Supabase Database

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: "IT Helpdesk Portal"
4. Set strong database password
5. Choose region closest to you
6. Wait 2-3 minutes for creation

#### Get Connection Details
1. In Supabase dashboard, click "Settings" → "Database"
2. Copy connection details:
   - Host: `db.xxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: your password

#### Create Database Schema
1. In Supabase, go to "SQL Editor"
2. Copy the entire contents of `supabase-sql-queries.sql`
3. Run the query to create all tables and sample data

### Step 4: Update Environment Variables
Update your `.env` file with actual Supabase details:
```bash
DATABASE_URL=postgresql://postgres.xxxx:your_password@aws-0-region.pooler.supabase.com:6543/postgres
SESSION_SECRET=your_32_character_random_string_here
NODE_ENV=development
PORT=5000
```

### Step 5: Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:5000`

**Demo Credentials:**
- Admin: `admin` / `admin123`
- Agent: `agent` / `agent123`
- User: `user` / `user123`

## 🌐 Deployment Options

## Option A: Netlify Deployment

### 1. Prepare for Netlify
Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
```

### 2. Create Netlify Functions
```bash
mkdir -p netlify/functions
```

Create `netlify/functions/api.js`:
```javascript
const express = require('express');
const serverless = require('serverless-http');
const { registerRoutes } = require('../../server/routes');
const { setupAuth } = require('../../server/auth');

const app = express();

// Setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup authentication
setupAuth(app);

// Register routes
registerRoutes(app);

// Export for Netlify
module.exports.handler = serverless(app);
```

### 3. Deploy to Netlify

**Option 3A: Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod
```

**Option 3B: Git Integration**
1. Push code to GitHub/GitLab
2. Connect repository in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify settings

### 4. Configure Environment in Netlify
In Netlify dashboard → Site settings → Environment variables:
```
DATABASE_URL=your_supabase_connection_string
SESSION_SECRET=your_random_secret
NODE_ENV=production
```

## Option B: Vercel Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Create Vercel Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3. Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. Configure Environment in Vercel
```bash
# Add environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add NODE_ENV
```

## Option C: Railway Deployment

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Create Railway Project
```bash
railway login
railway init
railway add --database postgresql
```

### 3. Configure for Railway
Create `railway.toml`:
```toml
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "npm start"

[variables]
  NODE_ENV = "production"
  PORT = "3000"
```

### 4. Deploy to Railway
```bash
railway up
```

## 📦 Build Configuration

### Update package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsx build server/index.ts",
    "start": "node dist/server/index.js",
    "preview": "vite preview",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Add Build Dependencies
```bash
npm install --save-dev concurrently tsx @types/node
```

## 🔧 Production Optimizations

### 1. Environment-Specific Configs
Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### 2. Production Server Config
Update `server/index.ts` for production:
```typescript
import express from 'express';
import path from 'path';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup authentication
setupAuth(app);

// API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🔒 Security for Production

### 1. Environment Variables
Never commit these to version control:
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. Secure Session Secret
Generate strong session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. CORS Configuration
Update server for production CORS:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.netlify.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));
```

## 🧪 Testing Before Deployment

### 1. Local Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

### 2. Environment Testing
```bash
# Test with production environment
NODE_ENV=production npm start
```

### 3. Database Connection Test
```bash
# Test Supabase connection
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM users').then(res => 
  console.log('Users count:', res.rows[0].count)
);
"
```

## 📊 Monitoring & Analytics

### 1. Add Error Tracking (Optional)
```bash
npm install @sentry/react @sentry/node
```

### 2. Performance Monitoring
- Use Vercel Analytics
- Netlify Analytics
- Google Analytics

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Database Connection Error**
- Check Supabase project is active
- Verify connection string format
- Test from Supabase SQL editor

**Assets Not Loading**
- Check build output in `dist` folder
- Verify static file serving in production
- Check console for 404 errors

### Deployment-Specific Issues

**Netlify Functions Timeout**
- Increase function timeout in `netlify.toml`
- Optimize database queries
- Add connection pooling

**Vercel Build Error**
- Check Node.js version compatibility
- Verify build command in `vercel.json`
- Check function size limits

## ✅ Deployment Checklist

### Before Deployment
- [ ] All environment variables configured
- [ ] Database schema deployed to Supabase
- [ ] Sample data inserted
- [ ] Local build successful
- [ ] All tests passing
- [ ] Security configurations set

### After Deployment
- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Database operations function
- [ ] All routes accessible
- [ ] Demo accounts work
- [ ] Mobile responsive design
- [ ] Performance acceptable

## 🎉 Success!

Your IT Helpdesk Portal is now:
- Running locally for development
- Deployed to your chosen platform
- Connected to Supabase database
- Ready for production use

**Live Demo Credentials:**
- Admin: `admin` / `admin123`
- Agent: `agent` / `agent123`
- User: `user` / `user123`

You can now develop locally and deploy updates automatically through your hosting platform's Git integration.