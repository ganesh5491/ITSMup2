# ⚡ Quick Setup Checklist
## IT Helpdesk Portal - Local Development + Hosting

## 📥 Step 1: Download Project Files
Copy these files from your Replit project to your local machine:

### Essential Files (Copy All):
```
✅ client/src/              (entire folder)
✅ server/                  (entire folder)
✅ shared/                  (entire folder)
✅ package.json             → rename to package.json
✅ package-lock.json
✅ tsconfig.json
✅ tailwind.config.ts
✅ postcss.config.js
✅ drizzle.config.ts
✅ theme.json
✅ .gitignore
```

### New Configuration Files (Already Created):
```
✅ package-local.json       → rename to package.json
✅ vite.config.local.ts     → rename to vite.config.ts  
✅ .env.example             → copy to .env
✅ netlify.toml             (for Netlify)
✅ vercel.json              (for Vercel)
✅ netlify/functions/server.js
✅ api/server.js
```

### Migration Files:
```
✅ supabase-sql-queries.sql
✅ supabase-migration-guide.md
✅ SUPABASE_MIGRATION_CHECKLIST.md
```

## 🗄️ Step 2: Setup Supabase Database (5 minutes)

### A. Create Supabase Project
1. 🌐 Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. ➕ Click "New Project"
3. 📝 Name: "IT Helpdesk Portal"
4. 🔐 Set strong password (save it!)
5. 🌍 Choose region
6. ⏳ Wait 2-3 minutes

### B. Run Database Setup
1. 📊 In Supabase → "SQL Editor"
2. 📋 Copy all contents from `supabase-sql-queries.sql`
3. ▶️ Run the query
4. ✅ Verify: 16 tables created + sample data

### C. Get Connection String
1. ⚙️ Supabase → "Settings" → "Database"
2. 🔗 Copy "Connection string" (URI format)
3. 🔄 Replace `[YOUR-PASSWORD]` with your password

## 💻 Step 3: Local Development Setup (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your Supabase connection string

# 3. Start development
npm run dev
```

### Environment Variables (.env):
```bash
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SESSION_SECRET=generate_random_32_character_string
NODE_ENV=development
PORT=5000
```

## 🚀 Step 4: Deploy to Hosting Platform

### Option A: Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
npm run build
netlify deploy --prod
```

**Environment Variables in Netlify:**
- `DATABASE_URL` = your Supabase connection string
- `SESSION_SECRET` = random 32-character string
- `NODE_ENV` = production

### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel login
vercel --prod
```

**Environment Variables in Vercel:**
- `DATABASE_URL` = your Supabase connection string  
- `SESSION_SECRET` = random 32-character string
- `NODE_ENV` = production

## ✅ Step 5: Test Everything

### Local Testing:
- 🌐 Visit: `http://localhost:5000`
- 🔐 Login: `admin` / `admin123`
- 🎫 Create a test ticket
- 📚 Check knowledge base
- 📖 View documentation

### Production Testing:
- 🌐 Visit your live URL
- 🔐 Test all demo accounts
- 📱 Check mobile responsiveness
- ⚡ Verify performance

## 🎯 Success Indicators

You'll know it's working when:
- ✅ No console errors
- ✅ Authentication works
- ✅ Database operations function
- ✅ All pages load correctly
- ✅ Demo data is visible
- ✅ Mobile design responsive

## 🔧 Quick Fixes

### Build Fails:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Database Connection Error:
- ✅ Check DATABASE_URL format
- ✅ Verify Supabase project is active
- ✅ Test from Supabase SQL editor

### Deployment Issues:
- ✅ Check environment variables are set
- ✅ Verify build output in `dist` folder
- ✅ Check hosting platform logs

## 📞 Demo Credentials

**After setup, login with:**
- 👑 **Admin**: `admin` / `admin123`
- 🛠️ **Agent**: `agent` / `agent123`
- 👤 **User**: `user` / `user123`

## ⏱️ Time Estimate

- Supabase setup: 5 minutes
- Local setup: 2 minutes  
- Deployment: 5 minutes
- **Total: 12 minutes**

## 🎉 You're Done!

Your IT Helpdesk Portal is now:
- ✅ Running locally for development
- ✅ Deployed to production hosting
- ✅ Connected to Supabase database
- ✅ Ready for real users

Happy coding! 🚀