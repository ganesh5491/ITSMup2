import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  tickets, type Ticket, type InsertTicket,
  comments, type Comment, type InsertComment,
  faqs, type Faq, type InsertFaq,
  chatMessages, type ChatMessage, type InsertChatMessage,
  type TicketWithRelations, type DashboardStats
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  getAllCategories(): Promise<Category[]>;
  getSubcategories(parentId: number): Promise<Category[]>;
  
  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketWithRelations(id: number): Promise<TicketWithRelations | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<void>;
  getUserTickets(userId: number): Promise<Ticket[]>;
  getAssignedTickets(userId: number): Promise<TicketWithRelations[]>;
  getAllTickets(): Promise<Ticket[]>;
  getAllTicketsWithRelations(): Promise<any[]>;
  getFilteredTickets(filters: { status?: string, priority?: string, categoryId?: number }): Promise<Ticket[]>;
  getTicketsCount(): Promise<{ [key: string]: number }>;
  getDashboardStats(): Promise<DashboardStats>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getTicketComments(ticketId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // FAQ operations
  getFaq(id: number): Promise<Faq | undefined>;
  getAllFaqs(): Promise<Faq[]>;
  getFaqsByCategory(categoryId: number): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: number, data: Partial<InsertFaq>): Promise<Faq | undefined>;
  
  // Chat operations
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private tickets: Map<number, Ticket>;
  private comments: Map<number, Comment>;
  private faqs: Map<number, Faq>;
  private chatMessages: Map<number, ChatMessage>;
  
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private ticketIdCounter: number;
  private commentIdCounter: number;
  private faqIdCounter: number;
  private chatMessageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.tickets = new Map();
    this.comments = new Map();
    this.faqs = new Map();
    this.chatMessages = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.ticketIdCounter = 1;
    this.commentIdCounter = 1;
    this.faqIdCounter = 1;
    this.chatMessageIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initializeData();
  }
  
  private async initializeData() {
    // Initialize Categories
    const networkCat = await this.createCategory({ name: "Network Issues", parentId: null });
    const hardwareCat = await this.createCategory({ name: "Hardware", parentId: null });
    const emailCat = await this.createCategory({ name: "Email Services", parentId: null });
    const accountCat = await this.createCategory({ name: "Account & Password", parentId: null });
    
    // Initialize Subcategories
    await this.createCategory({ name: "WiFi", parentId: networkCat.id });
    await this.createCategory({ name: "VPN", parentId: networkCat.id });
    await this.createCategory({ name: "LAN", parentId: networkCat.id });
    
    await this.createCategory({ name: "Printer", parentId: hardwareCat.id });
    await this.createCategory({ name: "Scanner", parentId: hardwareCat.id });
    await this.createCategory({ name: "Desktop", parentId: hardwareCat.id });
    await this.createCategory({ name: "Laptop", parentId: hardwareCat.id });
    
    await this.createCategory({ name: "Outlook", parentId: emailCat.id });
    await this.createCategory({ name: "SMTP", parentId: emailCat.id });
    await this.createCategory({ name: "Webmail", parentId: emailCat.id });
    
    // Initialize FAQs
    await this.createFaq({
      question: "How do I reset my network password?",
      answer: "You can reset your network password by going to password.company.com and following the 'Forgot Password' instructions. You will need to verify your identity using your registered email or phone number.",
      categoryId: accountCat.id
    });
    
    await this.createFaq({
      question: "My computer is running slow, what should I do?",
      answer: "First, try restarting your computer. If that doesn't help, check for running applications using high resources (Ctrl+Alt+Delete > Task Manager on Windows). Also ensure your computer has the latest updates installed.",
      categoryId: hardwareCat.id
    });
    
    await this.createFaq({
      question: "How do I connect to the company VPN?",
      answer: "Download the VPN client from the company portal, install it, and then enter your network credentials. Select the appropriate server location and click Connect. For detailed instructions, refer to the IT handbook.",
      categoryId: networkCat.id
    });
    
    await this.createFaq({
      question: "How to set up email on my mobile device?",
      answer: "For company email on mobile, install the Outlook app from your app store. Open it and add your company email account. Enter your company email address and password when prompted. Choose Exchange as the account type.",
      categoryId: emailCat.id
    });
    
    await this.createFaq({
      question: "How do I report a phishing email?",
      answer: "If you receive a suspicious email, do not click any links or download attachments. Forward the email as an attachment to phishing@company.com and then delete it from your inbox.",
      categoryId: emailCat.id
    });
    
    await this.createFaq({
      question: "How to access shared network drives?",
      answer: "To access shared drives, open File Explorer, click on 'This PC' in the left panel, then click 'Map network drive' in the Computer tab. Enter the drive path (e.g., \\\\server\\share) and assign a drive letter.",
      categoryId: networkCat.id
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    // Force role to be a string if it's undefined
    const role = insertUser.role || 'user';
    const user: User = { ...insertUser, id, createdAt, role };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getSubcategories(parentId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.parentId === parentId
    );
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = await this.getCategory(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...data };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    // Check if category exists
    const category = await this.getCategory(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has subcategories
    const subcategories = await this.getSubcategories(id);
    if (subcategories.length > 0) {
      throw new Error("Cannot delete category with subcategories. Please delete subcategories first.");
    }

    // Check if category is used by any tickets
    const ticketsUsingCategory = Array.from(this.tickets.values()).filter(
      (ticket) => ticket.categoryId === id || ticket.subcategoryId === id
    );
    
    if (ticketsUsingCategory.length > 0) {
      throw new Error(`Cannot delete category. It is being used by ${ticketsUsingCategory.length} ticket(s).`);
    }

    // Safe to delete
    this.categories.delete(id);
  }
  
  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }
  
  async getTicketWithRelations(id: number): Promise<TicketWithRelations | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) return undefined;
    
    const category = await this.getCategory(ticket.categoryId);
    if (!category) return undefined;
    
    let subcategory = undefined;
    if (ticket.subcategoryId) {
      subcategory = await this.getCategory(ticket.subcategoryId);
    }
    
    const createdBy = await this.getUser(ticket.createdById);
    if (!createdBy) return undefined;
    
    let assignedTo = undefined;
    if (ticket.assignedToId) {
      assignedTo = await this.getUser(ticket.assignedToId);
    }
    
    const ticketComments = await this.getTicketComments(ticket.id);
    
    return {
      ...ticket,
      category,
      subcategory,
      createdBy,
      assignedTo,
      comments: ticketComments
    };
  }
  
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.ticketIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    // Set default values for fields that might be undefined
    const status = insertTicket.status || 'open';
    const priority = insertTicket.priority || 'medium';
    const ticket: Ticket = { 
      ...insertTicket, 
      id, 
      createdAt, 
      updatedAt, 
      status, 
      priority,
      subcategoryId: insertTicket.subcategoryId || null,
      assignedToId: insertTicket.assignedToId || null
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
  
  async updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) return undefined;
    
    const updatedTicket: Ticket = { 
      ...ticket, 
      ...data,
      updatedAt: new Date()
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<void> {
    this.tickets.delete(id);
    // Also delete related comments
    Array.from(this.comments.values()).forEach(comment => {
      if (comment.ticketId === id) {
        this.comments.delete(comment.id);
      }
    });
  }
  
  async getUserTickets(userId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.createdById === userId
    );
  }
  
  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getAllTicketsWithRelations(): Promise<any[]> {
    // For in-memory storage, just return basic tickets since this is not used in development
    return Array.from(this.tickets.values());
  }
  
  async getFilteredTickets(filters: { status?: string, priority?: string, categoryId?: number }): Promise<Ticket[]> {
    let result = Array.from(this.tickets.values());
    
    if (filters.status) {
      result = result.filter(ticket => ticket.status === filters.status);
    }
    
    if (filters.priority) {
      result = result.filter(ticket => ticket.priority === filters.priority);
    }
    
    if (filters.categoryId) {
      result = result.filter(ticket => 
        ticket.categoryId === filters.categoryId || 
        ticket.subcategoryId === filters.categoryId
      );
    }
    
    return result;
  }
  
  async getTicketsCount(): Promise<{ [key: string]: number }> {
    const tickets = await this.getAllTickets();
    
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  }
  
  async getDashboardStats(): Promise<DashboardStats> {
    const counts = await this.getTicketsCount();
    
    return {
      openTickets: counts.open,
      inProgressTickets: counts.inProgress,
      resolvedTickets: counts.resolved,
      closedTickets: counts.closed,
      avgResponseTime: "4.2 hours", // Sample value
      slaComplianceRate: "94%"      // Sample value
    };
  }
  
  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async getTicketComments(ticketId: number): Promise<(Comment & { user: User })[]> {
    const ticketComments = Array.from(this.comments.values()).filter(
      (comment) => comment.ticketId === ticketId
    );
    
    const commentsWithUser = [];
    for (const comment of ticketComments) {
      const user = await this.getUser(comment.userId);
      if (user) {
        commentsWithUser.push({ ...comment, user });
      }
    }
    
    return commentsWithUser;
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const createdAt = new Date();
    const comment: Comment = { 
      ...insertComment, 
      id, 
      createdAt,
      isInternal: insertComment.isInternal || null
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  // FAQ operations
  async getFaq(id: number): Promise<Faq | undefined> {
    return this.faqs.get(id);
  }
  
  async getAllFaqs(): Promise<Faq[]> {
    return Array.from(this.faqs.values());
  }
  
  async getFaqsByCategory(categoryId: number): Promise<Faq[]> {
    return Array.from(this.faqs.values()).filter(
      (faq) => faq.categoryId === categoryId
    );
  }
  
  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const id = this.faqIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const viewCount = 0;
    const faq: Faq = { 
      ...insertFaq, 
      id, 
      viewCount, 
      createdAt, 
      updatedAt,
      categoryId: insertFaq.categoryId || null
    };
    this.faqs.set(id, faq);
    return faq;
  }
  
  async updateFaq(id: number, data: Partial<InsertFaq>): Promise<Faq | undefined> {
    const faq = await this.getFaq(id);
    if (!faq) return undefined;
    
    const updatedFaq: Faq = { 
      ...faq, 
      ...data,
      updatedAt: new Date()
    };
    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }
  
  // Chat operations
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.userId === userId
    );
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const createdAt = new Date();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      createdAt,
      isFromBot: insertMessage.isFromBot || null
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`${users.username} = ${username} OR ${users.email} = ${email}`
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`${users.username} = ${username} OR ${users.email} = ${email}`
    );
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return await this.getUser(id);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getSubcategories(parentId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.parentId, parentId));
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    // Check if category exists
    const category = await this.getCategory(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has subcategories
    const subcategories = await this.getSubcategories(id);
    if (subcategories.length > 0) {
      throw new Error("Cannot delete category with subcategories. Please delete subcategories first.");
    }

    // Check if category is used by any tickets
    const ticketsUsingCategory = await db.select()
      .from(tickets)
      .where(sql`${tickets.categoryId} = ${id} OR ${tickets.subcategoryId} = ${id}`);
    
    if (ticketsUsingCategory.length > 0) {
      throw new Error(`Cannot delete category. It is being used by ${ticketsUsingCategory.length} ticket(s).`);
    }

    // Safe to delete
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketWithRelations(id: number): Promise<TicketWithRelations | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) return undefined;
    
    const category = await this.getCategory(ticket.categoryId);
    if (!category) return undefined;
    
    let subcategory = undefined;
    if (ticket.subcategoryId) {
      subcategory = await this.getCategory(ticket.subcategoryId);
    }
    
    const createdBy = await this.getUser(ticket.createdById);
    if (!createdBy) return undefined;
    
    let assignedTo = undefined;
    if (ticket.assignedToId) {
      assignedTo = await this.getUser(ticket.assignedToId);
    }
    
    const ticketComments = await this.getTicketComments(ticket.id);
    
    return {
      ...ticket,
      category,
      subcategory,
      createdBy,
      assignedTo,
      comments: ticketComments
    };
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    try {
      const [ticket] = await db.insert(tickets).values({
        title: insertTicket.title,
        description: insertTicket.description,
        status: insertTicket.status || 'open',
        priority: insertTicket.priority || 'medium',
        supportType: insertTicket.supportType || 'remote',
        contactEmail: insertTicket.contactEmail || null,
        contactName: insertTicket.contactName || null,
        contactPhone: insertTicket.contactPhone || null,
        contactDepartment: insertTicket.contactDepartment || null,
        categoryId: insertTicket.categoryId,
        subcategoryId: insertTicket.subcategoryId || null,
        assignedToId: insertTicket.assignedToId || null,
        createdById: insertTicket.createdById,
        dueDate: insertTicket.dueDate || null,
        attachmentUrl: insertTicket.attachmentUrl || null,
        attachmentName: insertTicket.attachmentName || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return ticket;
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  }

  async updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updatedTicket] = await db.update(tickets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async getUserTickets(userId: number): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.createdById, userId));
  }

  async getAssignedTickets(userId: number): Promise<TicketWithRelations[]> {
    try {
      const assignedTickets = await db.select().from(tickets).where(eq(tickets.assignedToId, userId));
      const ticketsWithRelations = [];
      
      for (const ticket of assignedTickets) {
        const category = await this.getCategory(ticket.categoryId);
        let subcategory = null;
        if (ticket.subcategoryId) {
          subcategory = await this.getCategory(ticket.subcategoryId);
        }
        
        const createdBy = await this.getUser(ticket.createdById);
        const assignedTo = await this.getUser(ticket.assignedToId!);
        
        const ticketComments = await this.getTicketComments(ticket.id);
        
        ticketsWithRelations.push({
          ...ticket,
          category: category || null,
          subcategory,
          createdBy: createdBy || null,
          assignedTo,
          comments: ticketComments
        });
      }
      
      return ticketsWithRelations;
    } catch (error) {
      console.error("Error getting assigned tickets:", error);
      throw error;
    }
  }

  async getAllTickets(): Promise<Ticket[]> {
    try {
      return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  }


  async getAllTicketsWithRelations(): Promise<any[]> {
    try {
      const allTickets = await this.getAllTickets();
      const ticketsWithRelations = [];
      
      for (const ticket of allTickets) {
        const category = await this.getCategory(ticket.categoryId);
        let subcategory = null;
        if (ticket.subcategoryId) {
          subcategory = await this.getCategory(ticket.subcategoryId);
        }
        
        const createdBy = await this.getUser(ticket.createdById);
        let assignedTo = null;
        if (ticket.assignedToId) {
          assignedTo = await this.getUser(ticket.assignedToId);
        }
        
        // Get comment count
        const ticketComments = await this.getTicketComments(ticket.id);
        const commentCount = ticketComments.length;
        
        ticketsWithRelations.push({
          ...ticket,
          category: category || null,
          subcategory,
          createdBy: createdBy || null,
          assignedTo,
          commentCount
        });
      }
      
      return ticketsWithRelations;
    } catch (error) {
      console.error("Error in getAllTicketsWithRelations:", error);
      throw error;
    }
  }

  async getFilteredTickets(filters: { status?: string, priority?: string, categoryId?: number }): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    if (filters.status) {
      query = query.where(eq(tickets.status, filters.status));
    }
    
    if (filters.priority) {
      query = query.where(eq(tickets.priority, filters.priority));
    }
    
    if (filters.categoryId) {
      // This handles both category and subcategory
      query = query.where(
        sql`${tickets.categoryId} = ${filters.categoryId} OR 
            ${tickets.subcategoryId} = ${filters.categoryId}`
      );
    }
    
    return await query;
  }

  async getTicketsCount(): Promise<{ [key: string]: number }> {
    const allTickets = await this.getAllTickets();
    
    return {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      inProgress: allTickets.filter(t => t.status === 'in-progress').length,
      resolved: allTickets.filter(t => t.status === 'resolved').length,
      closed: allTickets.filter(t => t.status === 'closed').length,
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const counts = await this.getTicketsCount();
    
    return {
      openTickets: counts.open,
      inProgressTickets: counts.inProgress,
      resolvedTickets: counts.resolved,
      closedTickets: counts.closed,
      avgResponseTime: "4.2 hours", // This could be calculated from actual data
      slaComplianceRate: "94%" // This could be calculated from actual data
    };
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getTicketComments(ticketId: number): Promise<(Comment & { user: User })[]> {
    const commentsResult = await db.select().from(comments).where(eq(comments.ticketId, ticketId));
    
    const commentsWithUser = [];
    for (const comment of commentsResult) {
      const user = await this.getUser(comment.userId);
      if (user) {
        commentsWithUser.push({ ...comment, user });
      }
    }
    
    return commentsWithUser;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values({
      ...insertComment,
      createdAt: new Date()
    }).returning();
    return comment;
  }

  // FAQ operations
  async getFaq(id: number): Promise<Faq | undefined> {
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq;
  }

  async getAllFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs);
  }

  async getFaqsByCategory(categoryId: number): Promise<Faq[]> {
    return await db.select().from(faqs).where(eq(faqs.categoryId, categoryId));
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const [faq] = await db.insert(faqs).values({
      ...insertFaq,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return faq;
  }

  async updateFaq(id: number, data: Partial<InsertFaq>): Promise<Faq | undefined> {
    const [updatedFaq] = await db.update(faqs)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(faqs.id, id))
      .returning();
    return updatedFaq;
  }

  // Chat operations
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values({
      ...insertMessage,
      createdAt: new Date()
    }).returning();
    return message;
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();