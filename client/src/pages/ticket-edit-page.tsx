import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { TicketWithRelations, Category, User } from "@shared/schema";

// Form validation schema
const ticketEditSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["open", "in-progress", "resolved", "closed"]),
  categoryId: z.string().min(1, "Please select a category"),
  assignedToId: z.string().optional(),
});

type TicketEditFormValues = z.infer<typeof ticketEditSchema>;

export default function TicketEditPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = window.innerWidth < 768;

  // Extract ticket ID from URL
  const ticketId = location.split("/")[2]; // /tickets/{id}/edit

  // Initialize form
  const form = useForm<TicketEditFormValues>({
    resolver: zodResolver(ticketEditSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "open",
      categoryId: "",
      assignedToId: "",
    },
  });

  // Fetch ticket details
  const { 
    data: ticket, 
    isLoading: isLoadingTicket,
    error 
  } = useQuery<TicketWithRelations>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: !!user && !!ticketId,
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Fetch users (for assignment)
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && (user.role === "admin" || user.role === "agent"),
  });

  // Populate form when ticket data is loaded
  useEffect(() => {
    if (ticket) {
      form.setValue("title", ticket.title);
      form.setValue("description", ticket.description);
      form.setValue("priority", ticket.priority);
      form.setValue("status", ticket.status);
      form.setValue("categoryId", ticket.categoryId?.toString() || "");
      form.setValue("assignedToId", ticket.assignedToId?.toString() || "unassigned");
    }
  }, [ticket, form]);

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/tickets/${ticketId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully.",
      });
      navigate(`/tickets/${ticketId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update ticket",
        description: error.message || "An error occurred while updating the ticket.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: TicketEditFormValues) => {
    const formData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      categoryId: parseInt(data.categoryId),
    };

    // Only allow admins and agents to update status
    if (user?.role === "admin" || user?.role === "agent") {
      formData.status = data.status;
    }

    // Assignment rules:
    // - Admin: can assign to anyone
    // - Agent: can only assign tickets they created, and only to themselves
    // - User: cannot modify assignment
    if (user?.role === "admin") {
      formData.assignedToId = data.assignedToId && data.assignedToId !== "unassigned" ? parseInt(data.assignedToId) : null;
    } else if (user?.role === "agent" && ticket?.createdById === user.id) {
      formData.assignedToId = data.assignedToId && data.assignedToId !== "unassigned" ? parseInt(data.assignedToId) : null;
    }
    // Users cannot modify assignment, so we don't include it in formData

    updateTicketMutation.mutate(formData);
  };

  const handleBack = () => {
    navigate(`/tickets/${ticketId}`);
  };

  // Check permissions
  const canEdit = () => {
    if (!user || !ticket) return false;
    return (
      user.role === "admin" ||
      user.role === "agent" ||
      ticket.createdById === user.id
    );
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Edit Ticket" />
          <main className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
                <p className="text-gray-500 mb-6">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button onClick={() => navigate("/tickets")}>
                  Back to Tickets
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!canEdit() && ticket) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Edit Ticket" />
          <main className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-500 mb-6">You don't have permission to edit this ticket.</p>
                <Button onClick={() => navigate(`/tickets/${ticketId}`)}>
                  View Ticket
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Edit Ticket" />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBack} className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ticket
              </Button>
            </div>

            {isLoadingTicket ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-48" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Ticket #{ticket?.id}</CardTitle>
                  <CardDescription>
                    Update the ticket details below. Changes will be reflected immediately.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Brief description of the issue" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Priority */}
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Status - Only editable by Admin and Agent */}
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={user?.role === "user"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                              {user?.role === "user" && (
                                <p className="text-sm text-muted-foreground">
                                  Only agents and admins can change ticket status
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Category */}
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories?.map((category) => (
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

                        {/* Assigned To */}
                        <FormField
                          control={form.control}
                          name="assignedToId"
                          render={({ field }) => {
                            // Determine if the field should be disabled
                            const isDisabled = () => {
                              if (user?.role === "user") return true;
                              if (user?.role === "agent") {
                                // Agent can only edit assignment for tickets they created
                                return ticket?.createdById !== user.id;
                              }
                              return false; // Admin has full access
                            };

                            // Get available assignees based on user role
                            const getAvailableAssignees = () => {
                              if (user?.role === "admin") {
                                return users?.filter(u => u.role === "admin" || u.role === "agent") || [];
                              }
                              if (user?.role === "agent" && ticket?.createdById === user.id) {
                                return [user]; // Agent can only assign to themselves
                              }
                              return [];
                            };

                            const availableAssignees = getAvailableAssignees();
                            const isFieldDisabled = isDisabled();

                            return (
                              <FormItem>
                                <FormLabel>
                                  Assigned To
                                  {isFieldDisabled && user?.role === "user" && " (View Only)"}
                                  {isFieldDisabled && user?.role === "agent" && " (Admin Assignment)"}
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                  disabled={isFieldDisabled}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select assignee" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {availableAssignees.map((assignUser) => (
                                      <SelectItem key={assignUser.id} value={assignUser.id.toString()}>
                                        {assignUser.name || assignUser.username}
                                        {assignUser.id === user?.id && " (myself)"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {isFieldDisabled && (
                                  <p className="text-sm text-muted-foreground">
                                    {user?.role === "user" 
                                      ? "You can view assignment but cannot modify it"
                                      : user?.role === "agent" 
                                      ? "Only admins can modify assignment for tickets not created by you"
                                      : ""
                                    }
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed description of the issue, steps to reproduce, error messages, etc."
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleBack}
                          disabled={updateTicketMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateTicketMutation.isPending}
                          data-testid="button-save-ticket"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateTicketMutation.isPending ? "Updating..." : "Update Ticket"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}