# 🚀 Supabase Migration Checklist

## ✅ Pre-Migration Setup

### 1. Create Supabase Project
- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
- [ ] Click "New Project" 
- [ ] Set project name: "IT Helpdesk Portal"
- [ ] Create strong database password (save it!)
- [ ] Select region closest to users
- [ ] Wait for project creation (2-3 minutes)

### 2. Get Connection String
- [ ] Click "Connect" button in Supabase dashboard
- [ ] Go to "Connection string" → "Transaction pooler" 
- [ ] Copy the pooler URI (should include `.pooler.supabase.com`)
- [ ] Replace `[YOUR-PASSWORD]` with your database password
- [ ] Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

## ✅ Database Migration

### 3. Run SQL Migration
- [ ] Open Supabase SQL Editor
- [ ] Copy contents from `supabase-sql-queries.sql`
- [ ] Run the complete SQL script
- [ ] Verify all tables created (16 tables expected)
- [ ] Check sample data inserted successfully

### 4. Verify Data
Run these verification queries in SQL Editor:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check demo users
SELECT username, role, name FROM users WHERE username IN ('admin', 'agent', 'user');

-- Check sample tickets
SELECT COUNT(*) FROM tickets;

-- Check categories
SELECT COUNT(*) FROM categories;
```

## ✅ Application Configuration

### 5. Update Environment Variables
- [ ] In Replit: Go to Secrets tab
- [ ] Update `DATABASE_URL` with your Supabase connection string
- [ ] Verify format is correct (no spaces, correct password)

### 6. Test Connection
- [ ] Restart your Replit application
- [ ] Check console logs for connection success
- [ ] Verify no database errors in logs

## ✅ Functionality Testing

### 7. Test Authentication
- [ ] Login with admin credentials: `admin` / `admin123`
- [ ] Login with agent credentials: `agent` / `agent123`  
- [ ] Login with user credentials: `user` / `user123`
- [ ] Verify dashboard loads correctly

### 8. Test Core Features
- [ ] Create a new ticket
- [ ] View existing tickets
- [ ] Add comments to tickets
- [ ] Browse knowledge base/FAQs
- [ ] Test chatbot functionality
- [ ] Check all navigation links work

### 9. Test Data Persistence
- [ ] Create test data (ticket, comment, etc.)
- [ ] Restart application
- [ ] Verify data persists after restart
- [ ] Check session management works

## ✅ Advanced Verification

### 10. Performance Check
- [ ] Load dashboard - should load in <2 seconds
- [ ] Navigate between pages - smooth transitions
- [ ] Check for any console errors
- [ ] Verify responsive design on mobile

### 11. Data Integrity
- [ ] Verify foreign key relationships work
- [ ] Test user permissions (if applicable)
- [ ] Check data validation
- [ ] Verify timestamps are correct

## 🎯 Expected Results

After successful migration you should have:
- ✅ 16 database tables created
- ✅ 5 demo users (admin, agent, user, john.doe, jane.smith)
- ✅ 25 categories with subcategories
- ✅ 7 sample tickets with various statuses
- ✅ 9 sample comments
- ✅ 10 FAQs with view counts
- ✅ 12 chat messages
- ✅ 5 journey templates
- ✅ 3 sample user journeys
- ✅ Working authentication system
- ✅ Full application functionality

## 🔧 Troubleshooting

### Common Issues:

**Connection Fails:**
- Verify DATABASE_URL format
- Check password has no special characters that need encoding
- Ensure using pooler connection string (not direct)

**Tables Not Created:**
- Run SQL queries section by section
- Check for foreign key constraint errors
- Verify Supabase project is active

**Login Doesn't Work:**
- Check if users table has data
- Verify password hashing is correct
- Check session table exists

**Data Not Persisting:**
- Verify connection string is correct
- Check Supabase project isn't paused
- Ensure proper database permissions

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard for project status
2. Review console logs for error messages
3. Verify all SQL queries executed successfully
4. Test connection with a simple query

## 🎉 Migration Complete!

Once all checkboxes are marked, your IT Helpdesk Portal is successfully migrated to Supabase!

**Demo Credentials:**
- Admin: `admin` / `admin123`
- Agent: `agent` / `agent123` 
- User: `user` / `user123`