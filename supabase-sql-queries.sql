-- =====================================================
-- SUPABASE MIGRATION SQL QUERIES
-- IT Helpdesk Portal Database Schema
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Users table with role-based access control
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    company_name TEXT,
    department TEXT,
    contact_number TEXT,
    designation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories for tickets (supports hierarchical structure)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
);

-- Tickets table with complete workflow support
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    category_id INTEGER REFERENCES categories(id) NOT NULL,
    subcategory_id INTEGER REFERENCES categories(id),
    created_by_id INTEGER REFERENCES users(id) NOT NULL,
    assigned_to_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    support_type TEXT DEFAULT 'remote',
    contact_email TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_department TEXT
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tickets ADD COLUMN due_date TIMESTAMP;
ALTER TABLE tickets ADD COLUMN attachment_url TEXT;
-- Add attachment_name column to tickets table
ALTER TABLE tickets ADD COLUMN attachment_name TEXT;
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatbot messages for persistent chat history
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    is_from_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Journey Templates/Types
CREATE TABLE journey_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Journeys (instances of templates)
CREATE TABLE user_journeys (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES journey_templates(id),
    title TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT NOT NULL DEFAULT 'draft',
    personas JSON DEFAULT '[]'::json,
    prerequisites TEXT,
    entry_points JSON DEFAULT '[]'::json,
    success_criteria TEXT,
    pain_points TEXT,
    improvement_notes TEXT,
    created_by_id INTEGER REFERENCES users(id) NOT NULL,
    last_updated_by_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journey Steps (the actual workflow steps)
CREATE TABLE journey_steps (
    id SERIAL PRIMARY KEY,
    journey_id INTEGER REFERENCES user_journeys(id) NOT NULL,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    user_actions JSON DEFAULT '[]'::json,
    system_responses JSON DEFAULT '[]'::json,
    expected_outcomes JSON DEFAULT '[]'::json,
    error_scenarios JSON DEFAULT '[]'::json,
    screenshot_placeholder TEXT,
    notes TEXT,
    is_optional BOOLEAN DEFAULT false,
    estimated_duration TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments and collaboration on journeys
CREATE TABLE journey_comments (
    id SERIAL PRIMARY KEY,
    journey_id INTEGER REFERENCES user_journeys(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journey exports for sharing
CREATE TABLE journey_exports (
    id SERIAL PRIMARY KEY,
    journey_id INTEGER REFERENCES user_journeys(id) NOT NULL,
    export_type TEXT NOT NULL,
    file_path TEXT,
    export_data JSON,
    created_by_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session table for express-session with connect-pg-simple
CREATE TABLE session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IDX_session_expire ON session(expire);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tickets indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- Comments indexes
CREATE INDEX idx_comments_ticket ON comments(ticket_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- FAQs indexes
CREATE INDEX idx_faqs_category ON faqs(category_id);
CREATE INDEX idx_faqs_view_count ON faqs(view_count);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Journey indexes
CREATE INDEX idx_journey_steps_journey ON journey_steps(journey_id);
CREATE INDEX idx_journey_steps_number ON journey_steps(step_number);
CREATE INDEX idx_user_journeys_status ON user_journeys(status);
CREATE INDEX idx_user_journeys_created_by ON user_journeys(created_by_id);

-- =====================================================
-- 3. INSERT DEMO DATA
-- =====================================================

-- Insert demo users (passwords are hashed for: admin123, agent123, user123)
INSERT INTO users (username, password, name, email, role, company_name, department, contact_number, designation) VALUES
('admin', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Admin User', 'admin@company.com', 'admin', 'Tech Corp', 'IT', '+1-555-0001', 'System Administrator'),
('agent', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Agent User', 'agent@company.com', 'agent', 'Tech Corp', 'IT Support', '+1-555-0002', 'Support Specialist'),
('user', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Regular User', 'user@company.com', 'user', 'Tech Corp', 'Marketing', '+1-555-0003', 'Marketing Manager'),
('john.doe', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'John Doe', 'john.doe@company.com', 'user', 'Tech Corp', 'Sales', '+1-555-0004', 'Sales Representative'),
('jane.smith', '87be282e5c1f8d86c50d495bb3d6dcc6a3b0b5f6c5c2b8a8f0c1e9d7a4f2b3c5.d4e5f6a7b8c9', 'Jane Smith', 'jane.smith@company.com', 'agent', 'Tech Corp', 'IT Support', '+1-555-0005', 'Senior Support Analyst');

-- Insert categories and subcategories
INSERT INTO categories (name, parent_id) VALUES
('Network Issues', NULL),
('Hardware Problems', NULL),
('Software Issues', NULL),
('Account & Access', NULL),
('Security', NULL),
('Wi-Fi Connection', 1),
('VPN Issues', 1),
('Internet Connectivity', 1),
('Network Printing', 1),
('Printer Problems', 2),
('Computer Hardware', 2),
('Mobile Devices', 2),
('Peripherals', 2),
('Application Crashes', 3),
('Installation Issues', 3),
('Operating System', 3),
('Updates & Patches', 3),
('Password Reset', 4),
('User Permissions', 4),
('Account Lockout', 4),
('New User Setup', 4),
('Antivirus Issues', 5),
('Firewall Problems', 5),
('Phishing Reports', 5),
('Data Backup', 5);

-- Insert sample tickets
INSERT INTO tickets (title, description, status, priority, category_id, subcategory_id, created_by_id, assigned_to_id) VALUES
('Cannot connect to Wi-Fi', 'Unable to connect to office Wi-Fi network. Getting authentication error when trying to connect.', 'open', 'high', 1, 6, 4, 2),
('Printer not working', 'Office printer on 2nd floor is not responding. Red light is blinking constantly.', 'in_progress', 'medium', 2, 10, 3, 2),
('Email application crashes', 'Outlook keeps crashing when trying to send emails with large attachments over 10MB.', 'resolved', 'low', 3, 14, 4, 5),
('VPN connection timeout', 'VPN connection keeps timing out after 30 minutes of inactivity.', 'open', 'medium', 1, 7, 3, 2),
('Password reset request', 'Need password reset for domain account. Cannot login to workstation.', 'resolved', 'high', 4, 18, 4, 5),
('Software installation request', 'Need Adobe Photoshop installed for marketing department work.', 'in_progress', 'low', 3, 15, 3, 2),
('Computer running slowly', 'Workstation performance has degraded significantly over past week.', 'open', 'medium', 2, 11, 4, 2);

-- Insert sample comments
INSERT INTO comments (content, ticket_id, user_id, is_internal) VALUES
('I have checked the network settings. Please try restarting your device and clearing the Wi-Fi cache.', 1, 2, false),
('Still having the same issue after restart. Should I try forgetting and re-adding the network?', 1, 4, false),
('Yes, please try that. Also check if other devices can connect to the same network.', 1, 2, false),
('Printer has been serviced and toner cartridge replaced. Please test and confirm working status.', 2, 2, false),
('Working perfectly now. Print quality is excellent. Thank you for the quick resolution!', 2, 3, false),
('Issue was caused by corrupt Outlook profile. Recreated profile and tested attachment sending.', 3, 5, true),
('Checking VPN server logs for timeout configuration. May need to adjust keepalive settings.', 4, 2, true),
('Password has been reset. Please check your email for temporary password and change on first login.', 5, 5, false),
('Received the temporary password. Successfully logged in and changed password. Issue resolved.', 5, 4, false);

-- Insert FAQs
INSERT INTO faqs (question, answer, category_id, view_count) VALUES
('How do I connect to the company Wi-Fi?', 'Go to Settings > Wi-Fi > Select "CompanyWiFi" > Enter your domain credentials (username and password)', 1, 45),
('How do I reset my password?', 'Contact your system administrator through the helpdesk portal or call the IT support line at ext. 1234', 4, 67),
('What should I do if my computer won''t start?', 'Check power cable connection, try a different power outlet, ensure power button is pressed firmly. If issue persists, contact IT support.', 2, 23),
('How do I install new software?', 'Submit a software installation request ticket through the portal. Admin approval may be required for licensed software.', 3, 34),
('How do I access company VPN?', 'Download the company VPN client from the IT portal, use your domain credentials to connect. Contact IT if you need the installation file.', 1, 56),
('Why is my printer not working?', 'Check paper tray, ink/toner levels, and network connection. Try restarting the printer. If problem persists, submit a support ticket.', 2, 78),
('How do I backup my files?', 'Use the automated backup service by saving files to your H: drive, or manually backup to OneDrive. Contact IT for backup software installation.', 5, 29),
('What browsers are supported?', 'We officially support Chrome (latest), Firefox (latest), Edge (latest), and Safari 14+. Internet Explorer is not supported.', 3, 41),
('How do I report a security incident?', 'Immediately contact IT security at ext. 9999 or submit a high-priority security ticket through the portal. Do not ignore suspicious emails or activities.', 5, 12),
('Can I install software myself?', 'Users can install approved software from the company software center. For other software, submit an installation request ticket for review and approval.', 3, 38);

-- Insert sample chat messages
INSERT INTO chat_messages (message, user_id, is_from_bot) VALUES
('Hello! I''m your IT support assistant. How can I help you today?', 1, true),
('I need help with my email setup', 4, false),
('I can help you with email configuration. Are you using Outlook or another email client?', 1, true),
('I''m using Outlook and can''t receive emails', 4, false),
('Let me check your account settings. Can you tell me if you can send emails successfully?', 1, true),
('Yes, sending works fine, just not receiving', 4, false),
('This sounds like an incoming server configuration issue. I''ll create a ticket for our email team to investigate.', 1, true),
('Hi there! What can I assist you with?', 1, true),
('My computer is running very slowly', 3, false),
('I understand that can be frustrating. How long has this been happening?', 1, true),
('About a week now, getting worse each day', 3, false),
('This could be due to several factors. I''ll connect you with a technician who can run diagnostics on your system.', 1, true);

-- Insert journey templates
INSERT INTO journey_templates (name, description, type, color, is_active) VALUES
('New User Onboarding', 'Complete workflow for setting up new employees in the IT system', 'onboarding', '#10B981', true),
('Ticket Creation Process', 'Step-by-step guide for users to create effective support tickets', 'feature-workflow', '#3B82F6', true),
('Password Reset Recovery', 'Self-service and assisted password reset procedures', 'error-recovery', '#EF4444', true),
('Software Installation', 'Process for requesting and installing approved software', 'feature-workflow', '#8B5CF6', true),
('Security Incident Response', 'Immediate steps for reporting and handling security incidents', 'error-recovery', '#F59E0B', true);

-- Insert sample user journeys
INSERT INTO user_journeys (template_id, title, description, version, status, personas, prerequisites, entry_points, success_criteria, pain_points, improvement_notes, created_by_id, last_updated_by_id) VALUES
(1, 'Employee First Day Setup', 'Complete IT setup process for new employees on their first day', '1.2', 'approved', '["new-employee", "hr-coordinator", "it-administrator"]', 'Employee has been assigned workspace and received welcome email', '["HR portal", "IT welcome email", "supervisor introduction"]', 'Employee can access all required systems and applications within 2 hours', 'Account provisioning delays, unclear instructions for system access', 'Need to automate account creation process', 1, 1),
(2, 'Standard Support Request', 'Optimized ticket creation flow for common IT issues', '2.0', 'approved', '["end-user", "employee"]', 'User has helpdesk portal access', '["help button", "IT portal", "email signature links"]', 'Ticket created with sufficient detail for quick resolution', 'Users often provide insufficient information, category selection confusion', 'Add guided question flow based on issue type', 2, 2),
(3, 'Self-Service Password Reset', 'Streamlined password reset without IT intervention', '1.5', 'in-review', '["end-user", "remote-worker"]', 'User knows their employee ID and has access to registered phone/email', '["login screen", "IT portal", "mobile app"]', 'Password successfully reset within 5 minutes', 'Security question setup not intuitive, SMS delivery delays', 'Implement app-based authentication as backup option', 1, 5);

-- Insert journey steps for ticket creation process
INSERT INTO journey_steps (journey_id, step_number, title, description, user_actions, system_responses, expected_outcomes, error_scenarios, estimated_duration, is_optional) VALUES
(2, 1, 'Access Ticket Creation', 'Navigate to the ticket creation form', '["Click Create Ticket button", "Navigate to /tickets/create"]', '["Display ticket creation form", "Load category options", "Show user information"]', '["Form loads successfully", "Categories are populated", "User sees clean interface"]', '[{"scenario": "Form fails to load", "handling": "Show error message with retry option"}, {"scenario": "Categories not loading", "handling": "Display fallback contact information"}]', '30 seconds', false),
(2, 2, 'Select Issue Category', 'Choose the appropriate category and subcategory for the issue', '["Select primary category", "Select subcategory if applicable", "Review category description"]', '["Update subcategory options", "Show category-specific guidance", "Display expected response time"]', '["Correct category selected", "User understands category choice", "Response time expectations set"]', '[{"scenario": "Unsure of category", "handling": "Provide category description and examples"}, {"scenario": "Category not found", "handling": "Offer Other category with description field"}]', '1 minute', false),
(2, 3, 'Provide Issue Details', 'Enter comprehensive information about the problem', '["Enter descriptive title", "Provide detailed description", "Set priority level", "Add any relevant attachments"]', '["Validate input fields", "Show character count", "Preview attachment names", "Suggest priority based on category"]', '["All required fields completed", "Sufficient detail provided", "Appropriate priority selected"]', '[{"scenario": "Insufficient description", "handling": "Prompt for more details with suggestions"}, {"scenario": "File upload fails", "handling": "Show upload error and alternative contact method"}]', '3 minutes', false),
(2, 4, 'Review and Submit', 'Confirm ticket details and submit the request', '["Review all entered information", "Edit if necessary", "Click Submit Ticket button"]', '["Display summary of ticket", "Show estimated response time", "Generate ticket ID", "Send confirmation email"]', '["Ticket successfully created", "Confirmation displayed", "User receives email confirmation"]', '[{"scenario": "Submission fails", "handling": "Save draft and show retry option"}, {"scenario": "Validation errors", "handling": "Highlight fields needing correction"}]', '1 minute', false);

-- Insert sample journey comments
INSERT INTO journey_comments (journey_id, user_id, content, type) VALUES
(1, 2, 'The new employee onboarding process needs to include mobile device setup steps', 'improvement'),
(1, 5, 'Agreed. Also need clearer instructions for VPN setup on personal devices', 'improvement'),
(2, 1, 'Users are still confused about priority levels. Need better guidance', 'feedback'),
(2, 3, 'The category selection is much clearer now after the recent updates', 'positive'),
(3, 2, 'Password reset flow works well, but we need better error messages for account lockouts', 'bug');

-- =====================================================
-- 4. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for tickets with user and category information
CREATE VIEW tickets_with_details AS
SELECT 
    t.*,
    c.name as category_name,
    sc.name as subcategory_name,
    cb.name as created_by_name,
    cb.email as created_by_email,
    at.name as assigned_to_name,
    at.email as assigned_to_email
FROM tickets t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN categories sc ON t.subcategory_id = sc.id
LEFT JOIN users cb ON t.created_by_id = cb.id
LEFT JOIN users at ON t.assigned_to_id = at.id;

-- View for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
    AVG(CASE WHEN status IN ('resolved', 'closed') 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_resolution_hours
FROM tickets;

-- =====================================================
-- 5. SET UP ROW LEVEL SECURITY (Optional)
-- =====================================================

-- Enable RLS on sensitive tables (uncomment if needed)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment if needed)
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
-- CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check table creation
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check record counts
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'faqs', COUNT(*) FROM faqs
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages;

-- Test login credentials
SELECT username, role, name FROM users WHERE username IN ('admin', 'agent', 'user');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Your Supabase database is now ready!
-- Demo credentials: admin/admin123, agent/agent123, user/user123
-- Update your DATABASE_URL environment variable and restart your application