# Supabase Migration Guide for IT Helpdesk Portal

## 1. Supabase Setup Instructions

### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - Name: `IT Helpdesk Portal`
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users
5. Click "Create new project"

### Step 2: Get Database Connection String
1. Once project is created, click "Connect" button in the top toolbar
2. Go to "Connection string" → "Transaction pooler"
3. Copy the URI value (it looks like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
4. Replace `[YOUR-PASSWORD]` with the database password you set
5. This will be your `DATABASE_URL`

### Step 3: Configure Environment
Add the database URL to your Replit secrets:
- Key: `DATABASE_URL`
- Value: Your Supabase connection string

## 2. Database Schema Migration

Run these SQL queries in Supabase SQL Editor (in order):

### Create Tables

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    company_name VARCHAR(255),
    department VARCHAR(255),
    contact_number VARCHAR(255),
    designation VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES categories(id),
    created_by_id INTEGER REFERENCES users(id) NOT NULL,
    assigned_to_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    ticket_id INTEGER REFERENCES tickets(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQs table
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session table (for express-session with connect-pg-simple)
CREATE TABLE session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IDX_session_expire ON session(expire);
```

### Insert Sample Data

```sql
-- Insert demo users
INSERT INTO users (username, password, name, email, role, company_name, department, contact_number, designation) VALUES
('admin', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Admin User', 'admin@company.com', 'admin', 'Tech Corp', 'IT', '+1-555-0001', 'System Administrator'),
('agent', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Agent User', 'agent@company.com', 'agent', 'Tech Corp', 'IT Support', '+1-555-0002', 'Support Specialist'),
('user', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Regular User', 'user@company.com', 'user', 'Tech Corp', 'Marketing', '+1-555-0003', 'Marketing Manager');

-- Insert categories
INSERT INTO categories (name, parent_id) VALUES
('Network Issues', NULL),
('Hardware Problems', NULL),
('Software Issues', NULL),
('Account & Access', NULL),
('Wi-Fi Connection', 1),
('VPN Issues', 1),
('Printer Problems', 2),
('Computer Hardware', 2),
('Application Crashes', 3),
('Installation Issues', 3),
('Password Reset', 4),
('User Permissions', 4);

-- Insert sample tickets
INSERT INTO tickets (title, description, status, priority, category_id, subcategory_id, created_by_id, assigned_to_id) VALUES
('Cannot connect to Wi-Fi', 'Unable to connect to office Wi-Fi network. Getting authentication error.', 'open', 'high', 1, 5, 3, 2),
('Printer not working', 'Office printer is not responding. Red light is blinking.', 'in_progress', 'medium', 2, 7, 3, 2),
('Email application crashes', 'Outlook keeps crashing when trying to send emails with attachments.', 'resolved', 'low', 3, 9, 3, 2);

-- Insert sample comments
INSERT INTO comments (content, ticket_id, user_id) VALUES
('I have checked the network settings. Please try restarting your device.', 1, 2),
('Still having the same issue after restart.', 1, 3),
('Printer has been fixed. Please test and confirm.', 2, 2),
('Working perfectly now. Thank you!', 2, 3);

-- Insert FAQs
INSERT INTO faqs (question, answer, category_id) VALUES
('How do I connect to the company Wi-Fi?', 'Go to Settings > Wi-Fi > Select CompanyWiFi > Enter your credentials', 1),
('How do I reset my password?', 'Contact your system administrator or use the self-service portal', 4),
('What should I do if my computer won''t start?', 'Check power cable, try different outlet, contact IT if issue persists', 2),
('How do I install new software?', 'Submit a ticket requesting software installation. Admin approval may be required', 3),
('How do I access VPN?', 'Download the company VPN client and use your network credentials to connect', 1),
('Why is my printer not working?', 'Check paper, ink levels, and network connection. Restart if needed', 2);

-- Insert sample chat messages
INSERT INTO chat_messages (content, user_id, is_bot) VALUES
('Hello! How can I help you today?', 1, true),
('I need help with my email', 3, false),
('I can help you with email issues. Can you describe the problem?', 1, true),
('My emails are not sending', 3, false);
```

## 3. Code Changes Required

### Update server/db.ts
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### Update package.json scripts
```json
{
  "scripts": {
    "db:push": "drizzle-kit push --config=drizzle.config.ts",
    "db:studio": "drizzle-kit studio --config=drizzle.config.ts"
  }
}
```

## 4. Migration Steps

1. **Setup Supabase** (Steps 1-3 above)
2. **Run SQL queries** in Supabase SQL Editor
3. **Update DATABASE_URL** in Replit secrets
4. **Test connection** by running the application
5. **Verify data** by logging into the application with demo credentials

## 5. Demo Credentials (After Migration)
- **Admin**: admin / admin123
- **Agent**: agent / agent123
- **User**: user / user123

## 6. Verification Checklist
- [ ] All tables created successfully
- [ ] Sample data inserted
- [ ] Application connects to Supabase
- [ ] Login works with demo credentials
- [ ] Tickets, FAQs, and other features work
- [ ] Session management works

## 7. Troubleshooting

### Connection Issues
- Verify DATABASE_URL format
- Check Supabase project is running
- Ensure pooler connection string is used

### Permission Issues
- Verify user has database access
- Check RLS (Row Level Security) settings if needed

### Migration Issues
- Run queries one section at a time
- Check for foreign key constraint errors
- Verify table names match schema

## Notes
- Supabase uses PostgreSQL, so your existing Drizzle setup will work perfectly
- No code changes needed except updating the connection string
- Session table is included for express-session compatibility
- All existing functionality will work the same way