import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertTicketSchema, insertCommentSchema, 
  insertFaqSchema, insertChatMessageSchema, insertCategorySchema 
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden - Admin access required" });
};

// Middleware to check if user is an admin or agent
const isSupportStaff = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && (req.user?.role === "admin" || req.user?.role === "agent")) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden - Support staff access required" });
};

// Role-based middleware factory
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  await setupAuth(app);
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage: storage_multer,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only images, PDFs, and documents are allowed'));
      }
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));
  
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/:id/subcategories", async (req, res) => {
    try {
      const parentId = parseInt(req.params.id);
      const subcategories = await storage.getSubcategories(parentId);
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });
  
  app.post("/api/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  
  // Tickets - Role-based access
  app.get("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      let tickets;
      
      if (req.user?.role === "admin") {
        // Admin sees all tickets
        tickets = await storage.getAllTicketsWithRelations();
      } else if (req.user?.role === "agent") {
        // Agent sees only assigned tickets
        tickets = await storage.getAssignedTickets(req.user.id);
      } else {
        // User sees only their own tickets
        tickets = await storage.getUserTickets(req.user!.id);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/my", isAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getUserTickets(req.user!.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({ message: "Failed to fetch user tickets" });
    }
  });
  

  app.get("/api/tickets/filter", isAuthenticated, async (req, res) => {
    try {
      const { status, priority, categoryId } = req.query;
      const filters: { status?: string; priority?: string; categoryId?: number } = {};
      
      if (status) filters.status = status as string;
      if (priority) filters.priority = priority as string;
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      
      let tickets;
      
      if (req.user?.role === "admin") {
        tickets = await storage.getFilteredTickets(filters);
      } else if (req.user?.role === "agent") {
        tickets = await storage.getFilteredTicketsForAgent(req.user!.id, filters);
      } else {
        tickets = await storage.getFilteredTicketsForUser(req.user!.id, filters);
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter tickets" });
    }
  });
  
  app.get("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicketWithRelations(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Role-based access check
      if (req.user?.role === "user" && ticket.createdById !== req.user.id) {
        return res.status(403).json({ message: "Access denied: You can only view your own tickets" });
      }
      
      if (req.user?.role === "agent" && ticket.assignedToId !== req.user.id && ticket.createdById !== req.user.id) {
        return res.status(403).json({ message: "Access denied: You can only view tickets assigned to you or created by you" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });
  
  app.post("/api/tickets", isAuthenticated, upload.single('attachment'), async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User not authenticated" });
      }
      // Convert string IDs to numbers for validation and process new fields
      const processedData = {
        ...req.body,
        categoryId: parseInt(req.body.categoryId),
        subcategoryId: req.body.subcategoryId ? parseInt(req.body.subcategoryId) : undefined,
        createdById: req.user.id,
        supportType: req.body.supportType || "remote",
        contactEmail: req.body.contactEmail,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        contactDepartment: req.body.contactDepartment,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        attachmentUrl: req.file ? `/uploads/${req.file.filename}` : null,
        attachmentName: req.file ? req.file.originalname : null
      };

      // Handle assignment permissions for ticket creation
      if (req.body.assignedToId) {
        if (req.user.role === "admin") {
          // Admin can assign to any agent/admin
          processedData.assignedToId = parseInt(req.body.assignedToId);
        } else if (req.user.role === "agent") {
          // Agent can only assign to themselves
          processedData.assignedToId = parseInt(req.body.assignedToId);
        } else {
          // Users cannot assign tickets
          delete processedData.assignedToId;
        }
      }

      let ticketData;
      try {
        ticketData = insertTicketSchema.parse(processedData);
      } catch (validationError) {
        let details = "";
        if (typeof validationError === "object" && validationError !== null) {
          if (Array.isArray((validationError as any).errors)) {
            details = JSON.stringify((validationError as any).errors);
          } else if ((validationError as any).message) {
            details = (validationError as any).message;
          } else {
            details = JSON.stringify(validationError);
          }
        } else {
          details = String(validationError);
        }
        console.error("Ticket validation error:", details);
        return res.status(400).json({ message: "Invalid ticket data", details });
      }
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      let details = "";
      if (typeof error === "object" && error !== null) {
        if ((error as any).message) {
          details = (error as any).message;
        } else {
          details = JSON.stringify(error);
        }
      } else {
        details = String(error);
      }
      console.error("Create ticket error:", details);
      res.status(400).json({ message: "Ticket creation failed", details });
    }
  });
  
  app.patch("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Role-based update permissions
      if (req.user?.role === "user" && ticket.createdById !== req.user.id) {
        return res.status(403).json({ message: "Access denied: You can only update your own tickets" });
      }
      
      if (req.user?.role === "agent" && ticket.assignedToId !== req.user.id) {
        return res.status(403).json({ message: "Access denied: You can only update tickets assigned to you" });
      }
      
      const updatedTicket = await storage.updateTicket(id, req.body);
      res.json(updatedTicket);
    } catch (error) {
      res.status(400).json({ message: "Failed to update ticket" });
    }
  });

  app.put("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check edit permissions
      if (req.user?.role !== "admin" && req.user?.role !== "agent" && ticket.createdById !== req.user?.id) {
        return res.status(403).json({ message: "Access denied: You can only edit your own tickets" });
      }
      
      // Convert string IDs to numbers for validation
      const processedData = {
        ...req.body,
        categoryId: parseInt(req.body.categoryId),
      };

      // Handle assignment permissions
      if (req.body.assignedToId !== undefined) {
        if (req.user?.role === "admin") {
          // Admin can assign to anyone
          processedData.assignedToId = req.body.assignedToId ? parseInt(req.body.assignedToId) : null;
        } else if (req.user?.role === "agent" && ticket.createdById === req.user.id) {
          // Agent can only assign tickets they created, and only to themselves
          processedData.assignedToId = req.body.assignedToId ? parseInt(req.body.assignedToId) : null;
        } else if (req.user?.role === "user") {
          // Users cannot modify assignment - ignore the field
          delete processedData.assignedToId;
        } else {
          // Agents cannot modify assignment for tickets they didn't create
          delete processedData.assignedToId;
        }
      }

      // Handle status permissions
      if (req.body.status !== undefined) {
        if (req.user?.role === "admin" || req.user?.role === "agent") {
          // Only admin and agents can update status
          processedData.status = req.body.status;
        } else {
          // Users cannot modify status - ignore the field
          delete processedData.status;
        }
      }
      
      const updatedTicket = await storage.updateTicket(id, processedData);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(400).json({ message: "Failed to update ticket" });
    }
  });

  // Delete ticket route
  app.delete("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Role-based delete permissions
      if (req.user?.role === "user" && ticket.createdById !== req.user.id) {
        return res.status(403).json({ message: "Access denied: You can only delete your own tickets" });
      }
      
      if (req.user?.role === "agent") {
        return res.status(403).json({ message: "Access denied: Agents cannot delete tickets" });
      }
      
      await storage.deleteTicket(id);
      res.json({ message: "Ticket deleted successfully" });
    } catch (error) {
      console.error("Delete ticket error:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });
  
  // Comments
  app.get("/api/tickets/:ticketId/comments", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const comments = await storage.getTicketComments(ticketId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  app.post("/api/tickets/:ticketId/comments", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        ticketId,
        userId: req.user!.id
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });
  
  // FAQs
  app.get("/api/faqs", async (req, res) => {
    try {
      let faqs;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      if (categoryId) {
        faqs = await storage.getFaqsByCategory(categoryId);
      } else {
        faqs = await storage.getAllFaqs();
      }
      
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });
  
  app.get("/api/faqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const faq = await storage.getFaq(id);
      
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      
      res.json(faq);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQ" });
    }
  });
  
  app.post("/api/faqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const faqData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(faqData);
      res.status(201).json(faq);
    } catch (error) {
      res.status(400).json({ message: "Invalid FAQ data" });
    }
  });
  
  app.patch("/api/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedFaq = await storage.updateFaq(id, req.body);
      
      if (!updatedFaq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      
      res.json(updatedFaq);
    } catch (error) {
      res.status(400).json({ message: "Failed to update FAQ" });
    }
  });
  
  // Chat messages
  app.get("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.user!.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const message = await storage.createChatMessage(messageData);
      
      // Automatic bot response
      const userMessage = message.message.toLowerCase();
      let botResponse = "Thank you for your message. How else can I assist you?";
      
      if (userMessage.includes("wifi") || userMessage.includes("network")) {
        botResponse = "It sounds like you're having network issues. Would you like me to create a ticket for WiFi issues or direct you to our network troubleshooting guide?";
      } else if (userMessage.includes("password") || userMessage.includes("reset")) {
        botResponse = "Need to reset your password? You can reset it yourself at password.company.com or I can create a ticket for IT support to help you.";
      } else if (userMessage.includes("create ticket") || userMessage.includes("submit ticket")) {
        botResponse = "I can help you create a new support ticket. What issue are you experiencing?";
      } else if (userMessage.includes("ticket status") || userMessage.includes("my tickets")) {
        botResponse = "You can view all your tickets in the 'My Tickets' section of the portal. Would you like me to direct you there?";
      }
      
      const botMessage = await storage.createChatMessage({
        userId: req.user!.id,
        message: botResponse,
        isFromBot: true
      });
      
      res.status(201).json([message, botMessage]);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  
  // Dashboard stats with role-based access
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      let stats;
      
      if (req.user?.role === "admin") {
        // Admin gets global stats
        stats = await storage.getDashboardStats();
      } else if (req.user?.role === "agent") {
        // Agent gets stats for their assigned tickets
        stats = await storage.getDashboardStatsForAgent(req.user!.id);
      } else {
        // User gets stats for their own tickets
        stats = await storage.getDashboardStatsForUser(req.user!.id);
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  // USER MANAGEMENT ROUTES - Fixed authentication
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      let users;
      
      if (req.user?.role === "admin") {
        // Admin can see all users
        users = await storage.getAllUsers();
      } else if (req.user?.role === "agent") {
        // Agent can see only agents and users (for ticket assignment)
        users = await storage.getUsersByRoles(["agent", "user"]);
      } else {
        // Regular users can only see their own profile
        users = [req.user];
      }
      
      res.json(users);
    } catch (err) {
      console.error("Error in /api/users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });


  app.post('/api/users', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { username, password, name, email, role } = req.body;

      if (!username || !password || !name || !email || !role) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsernameOrEmail(username, email);
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email,
        role
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, name, email, role } = req.body;

      // Check if user exists
      const existingUser = await storage.getUserById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prepare update data
      const updateData: any = { username, name, email, role };

      // Only update password if provided
      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await storage.updateUser(parseInt(id), updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await storage.getUserById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.deleteUser(parseInt(id));
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Password change route
  app.put('/api/users/:id/password', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Verify user is changing their own password or is admin
      if (parseInt(id) !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'You can only change your own password' });
      }

      // Get user and verify current password
      const user = await storage.getUserById(parseInt(id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password for non-admin users
      if (req.user?.role !== 'admin') {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(parseInt(id), { password: hashedNewPassword });
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Export user data route
  app.get('/api/users/:id/export', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;

      // Verify user is exporting their own data or is admin
      if (parseInt(id) !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'You can only export your own data' });
      }

      // Get user data
      const user = await storage.getUserById(parseInt(id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's tickets
      const tickets = await storage.getUserTickets(parseInt(id));

      // Get user's comments (simplified for now)
      const userComments: any[] = []; // TODO: Add getAllComments method

      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        department: user.department,
        designation: user.designation,
        contactNumber: user.contactNumber,
        createdAt: user.createdAt,
      };

      const exportData = {
        user: sanitizedUser,
        tickets,
        comments: userComments,
        exportedAt: new Date().toISOString(),
      };

      res.json(exportData);
    } catch (error) {
      console.error('Export data error:', error);
      res.status(500).json({ message: 'Failed to export data' });
    }
  });

  // Category management routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const updatedCategory = await storage.updateCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
