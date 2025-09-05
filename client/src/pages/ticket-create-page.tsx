import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, FilePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Category, User } from "@shared/schema";

// Form validation schema
const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  subcategoryId: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  supportType: z.enum(["remote", "telephonic", "onsite_visit", "other"]).default("remote"),
  assignedToId: z.string().optional(),
  contactEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Please enter a valid email address"
  }),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactDepartment: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export default function TicketCreatePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [searchAgent, setSearchAgent] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = window.innerWidth < 768;

  // Initialize form
  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      priority: "medium",
      supportType: "remote",
      assignedToId: "",
      contactEmail: "",
      contactName: "",
      contactPhone: "",
      contactDepartment: "",
      dueDate: "",
    },
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Get subcategories for selected category
  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery<Category[]>({
    queryKey: [`/api/categories/${selectedCategoryId}/subcategories`],
    enabled: !!selectedCategoryId && selectedCategoryId !== "",
  });

  // Fetch all users (agents and admins)
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Filter agents and admins for contact field
  const agentUsers = allUsers?.filter(u => u.role === "agent" || u.role === "admin") || [];
  
  // Filter agents based on search
  const filteredAgents = agentUsers.filter(agent => 
    agent.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchAgent.toLowerCase())
  );

  // Auto-fetch user details by agent id
  const handleAgentSelection = async (id: string) => {
    const selectedAgent = agentUsers.find(agent => agent.id.toString() === id);
    if (selectedAgent) {
      form.setValue("contactEmail", selectedAgent.email);
      form.setValue("contactName", selectedAgent.name);
      form.setValue("contactPhone", selectedAgent.contactNumber || "");
      form.setValue("contactDepartment", selectedAgent.department || "");
    }
  };

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormValues) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('categoryId', data.categoryId);
      if (data.subcategoryId) formData.append('subcategoryId', data.subcategoryId);
      formData.append('priority', data.priority);
      formData.append('supportType', data.supportType);
      if (data.assignedToId) formData.append('assignedToId', data.assignedToId);
      if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
      if (data.contactName) formData.append('contactName', data.contactName);
      if (data.contactPhone) formData.append('contactPhone', data.contactPhone);
      if (data.contactDepartment) formData.append('contactDepartment', data.contactDepartment);
      if (data.dueDate) formData.append('dueDate', new Date(data.dueDate).toISOString());
      formData.append('status', 'open');

      if (file) {
        formData.append('attachment', file);
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        let details = 'Failed to create ticket';
        try {
          const errorData = await res.json();
          if (errorData.details) {
            details = typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details);
          } else if (errorData.message) {
            details = errorData.message;
          }
        } catch {}
        throw new Error(details);
      }

      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket created successfully",
        description: `Ticket #${data.id} has been submitted.`,
      });
      navigate(`/tickets/${data.id}`);
    },
    onError: async (error) => {
      let details = "";
      if (error instanceof Error && error.message) {
        details = error.message;
        // Try to extract backend details if available
        try {
          const res = (error as any).response;
          if (res && typeof res.json === "function") {
            const data = await res.json();
            if (data.details) {
              details += `\n${typeof data.details === "string" ? data.details : JSON.stringify(data.details)}`;
            }
          }
        } catch {}
      } else {
        details = String(error);
      }
      toast({
        title: "Failed to create ticket",
        description: details || "An error occurred while creating the ticket.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CreateTicketFormValues) => {
    createTicketMutation.mutate(data);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    form.setValue("categoryId", value);
    form.setValue("subcategoryId", "");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Create Ticket" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate("/tickets")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800">Create New Support Ticket</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New Support Request</CardTitle>
              <CardDescription>
                Provide detailed information about your issue for faster resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief summary of the issue" {...field} />
                        </FormControl>
                        <FormDescription>
                          Be concise and specific about the problem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={(value) => handleCategoryChange(value)}
                            value={field.value || ""}
                            disabled={isLoadingCategories}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.filter(c => !c.parentId).map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={isLoadingSubcategories || !selectedCategoryId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subcategories?.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Priority moved to Contact Information section for admin/agent, show here for users */}
                    {user?.role === "user" && (
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField
                      control={form.control}
                      name="supportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Support Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="remote">Remote</SelectItem>
                              <SelectItem value="telephonic">Telephonic</SelectItem>
                              <SelectItem value="onsite_visit">Onsite Visit</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {(user?.role === "admin" || user?.role === "agent") && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Contact To (Agent Names... Jane Smith) 
                                <span className="text-xs text-gray-500 ml-1">
                                  → In this field fetch all the agents data from logged in supabase db → 
                                  (in this field admin can select or search users name and email both attached in this input field)
                                </span>
                              </FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  handleAgentSelection(value);
                                  // Also set the assignedToId for the ticket assignment
                                  form.setValue("assignedToId", value);
                                }}
                                value={agentUsers.find(a => a.email === field.value)?.id.toString() || ""}
                                disabled={isLoadingUsers}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Agent/Admin - Search by name or email" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <div className="p-2">
                                    <Input
                                      placeholder="Search by name or email..."
                                      value={searchAgent}
                                      onChange={(e) => setSearchAgent(e.target.value)}
                                      className="mb-2"
                                    />
                                  </div>
                                  {filteredAgents.length > 0 ? (
                                    filteredAgents.map((agent) => (
                                      <SelectItem key={agent.id} value={agent.id.toString()}>
                                        {agent.name} - {agent.email} ({agent.role})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-agents" disabled>
                                      No agents found
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select the agent who will be the main contact and assignee for this ticket
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name 
                                <span className="text-xs text-gray-500 ml-1">
                                  → (when admin select agent name or email from contact to field then that fetch contact name automatically here)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled when agent selected" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone (Optional) 
                                <span className="text-xs text-gray-500 ml-1">
                                  → (it also fetch from Contact To field)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled when agent selected" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactDepartment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Department (Optional) 
                                <span className="text-xs text-gray-500 ml-1">
                                  → (it also fetch from Contact To field)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled when agent selected" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority (High, medium, low)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Detailed description of the issue you're experiencing..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include relevant details like error messages, when it started, and what you've tried
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border border-dashed border-gray-300 rounded-md p-6">
                    <div className="text-center">
                      <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setFile(e.target.files[0]);
                              }
                            }}
                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                          />
                        </label>
                        <p className="pl-1 text-sm text-gray-500">or drag and drop</p>
                        {file && (
                          <p className="text-xs text-green-600 mt-2">
                            Selected file: {file.name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, PDF, DOC up to 10MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/tickets")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
