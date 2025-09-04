import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CommentThread from "@/components/tickets/comment-thread";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Clock,
  CheckCircle,
  ExternalLink,
  Paperclip,
  Download
} from "lucide-react";
import { TicketWithRelations } from "@shared/schema";

export default function TicketDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = window.innerWidth < 768;

  // Extract ticket ID from URL
  const ticketId = location.split("/").pop();
  
  // Fetch ticket details with relations
  const { 
    data: ticket, 
    isLoading: isLoadingTicket,
    error 
  } = useQuery<TicketWithRelations>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: !!user && !!ticketId,
  });

  // Fetch users for assignment dropdown
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Mutation for updating ticket status
  const updateTicketMutation = useMutation({
    mutationFn: async ({ status, assignedToId, priority }: { status?: string; assignedToId?: number | null; priority?: string }) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}`, {
        status,
        assignedToId,
        priority
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update ticket",
        description: error.message || "An error occurred while updating the ticket.",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, content, isInternal }: { ticketId: number; content: string; isInternal: boolean }) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/comments`, {
        content,
        isInternal
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      setCommentText("");
      setIsInternalNote(false);
      toast({
        title: "Comment added",
        description: "Your comment has been added to the ticket.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error.message || "An error occurred while adding your comment.",
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateTicketMutation.mutate({ status });
  };

  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    updateTicketMutation.mutate({ priority });
  };

  // Handle assignment change
  const handleAssignmentChange = (agentId: string) => {
    updateTicketMutation.mutate({ 
      assignedToId: agentId === "unassigned" ? null : parseInt(agentId)
    });
  };

  // Handle comment submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !ticket) return;

    addCommentMutation.mutate({
      ticketId: ticket.id,
      content: commentText,
      isInternal: isInternalNote
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle error state
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load ticket details. Please try again.",
        variant: "destructive",
      });
      navigate("/tickets");
    }
  }, [error, navigate, toast]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Ticket Details" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Ticket header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center mb-1">
                <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate("/tickets")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {isLoadingTicket ? (
                    <Skeleton className="h-7 w-48" />
                  ) : (
                    <>
                      <span className="font-mono text-gray-500 text-base mr-2">TKT-{ticket?.id.toString().padStart(4, '0')}</span>
                      <span>{ticket?.title}</span>
                    </>
                  )}
                </h2>
              </div>
              <div className="flex items-center flex-wrap text-sm text-gray-500 ml-9">
                {isLoadingTicket ? (
                  <Skeleton className="h-5 w-64" />
                ) : (
                  <>
                    <span className="mr-3">Created {formatDate(ticket?.createdAt || "")}</span>
                    <span className="mr-3">By {ticket?.createdBy.name}</span>
                    <Badge variant="outline" className={getStatusColor(ticket?.status || "")}>
                      {ticket?.status.charAt(0).toUpperCase() + ticket?.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className={`ml-2 capitalize ${getPriorityColor(ticket?.priority || "")}`}>
                      {ticket?.priority} Priority
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ticket content and metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Comments and updates */}
            <div className="md:col-span-2 space-y-6">
              {/* Ticket description */}
              <Card>
                <CardContent className="p-6">
                  {isLoadingTicket ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start">
                          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{ticket?.createdBy.name}</h3>
                            <p className="text-sm text-gray-500">{formatDate(ticket?.createdAt || "")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-700 mb-4">{ticket?.description}</div>
                      
                      {/* Display attachment if exists */}
                      {ticket?.attachmentUrl && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <Paperclip className="h-5 w-5 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {ticket.attachmentName}
                              </p>
                              <p className="text-xs text-gray-500">Attached file</p>
                            </div>
                            <a
                              href={ticket.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              <span className="text-sm">Download</span>
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Badge variant="outline" className="mr-2">{ticket?.category.name}</Badge>
                        {ticket?.subcategory && (
                          <Badge variant="outline">{ticket?.subcategory.name}</Badge>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              {isLoadingTicket ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : ticket?.comments && ticket.comments.length > 0 ? (
                <CommentThread 
                  comments={ticket.comments} 
                  currentUserRole={user?.role || "user"} 
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No comments yet.
                  </CardContent>
                </Card>
              )}

              {/* Add comment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add a Comment</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitComment}>
                    <Textarea
                      rows={4}
                      placeholder="Type your message here..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="mb-4"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {(user?.role === "admin" || user?.role === "agent") && (
                          <div className="flex items-center">
                            <Checkbox 
                              id="internal-note" 
                              checked={isInternalNote} 
                              onCheckedChange={(checked) => setIsInternalNote(checked === true)}
                              className="mr-2" 
                            />
                            <label htmlFor="internal-note" className="text-sm text-gray-700 cursor-pointer">
                              Make this an internal note
                            </label>
                          </div>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? "Sending..." : "Send Comment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Ticket metadata */}
            <div className="space-y-6">
              {/* Status panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ticket Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                    <Select 
                      value={ticket?.status || "open"} 
                      onValueChange={handleStatusChange}
                      disabled={isLoadingTicket || updateTicketMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(user?.role === "admin" || user?.role === "agent") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <Select 
                        value={ticket?.assignedToId?.toString() || "unassigned"} 
                        onValueChange={handleAssignmentChange}
                        disabled={isLoadingTicket || updateTicketMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users?.filter(u => u.role === "agent" || u.role === "admin").map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <Select 
                      value={ticket?.priority || "medium"} 
                      onValueChange={handlePriorityChange}
                      disabled={isLoadingTicket || updateTicketMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Details panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoadingTicket ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" /> Created
                        </span>
                        <span className="text-sm text-gray-800">{formatDate(ticket?.createdAt || "")}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Tag className="h-4 w-4 mr-2" /> Category
                        </span>
                        <span className="text-sm text-gray-800">{ticket?.category.name}</span>
                      </li>
                      {ticket?.subcategory && (
                        <li className="flex justify-between">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Tag className="h-4 w-4 mr-2" /> Subcategory
                          </span>
                          <span className="text-sm text-gray-800">{ticket.subcategory.name}</span>
                        </li>
                      )}
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-2" /> Last Updated
                        </span>
                        <span className="text-sm text-gray-800">
                          {ticket?.comments && ticket.comments.length > 0
                            ? formatDate(ticket.comments[ticket.comments.length - 1].createdAt)
                            : formatDate(ticket?.updatedAt || "")}
                        </span>
                      </li>
                      {ticket?.assignedTo && (
                        <li className="flex justify-between">
                          <span className="text-sm text-gray-500 flex items-center">
                            <User className="h-4 w-4 mr-2" /> Assigned To
                          </span>
                          <span className="text-sm text-gray-800">{ticket.assignedTo.name}</span>
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Related articles */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoadingTicket ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {ticket?.category.name === "Network Issues" && (
                        <li>
                          <Link href="/knowledge-base?q=wifi">
                            <a className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <ExternalLink className="h-3 w-3 mr-2" /> 
                              How to troubleshoot WiFi connectivity issues
                            </a>
                          </Link>
                        </li>
                      )}
                      {ticket?.category.name === "Email Services" && (
                        <li>
                          <Link href="/knowledge-base?q=outlook">
                            <a className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <ExternalLink className="h-3 w-3 mr-2" /> 
                              Common Outlook syncing problems and solutions
                            </a>
                          </Link>
                        </li>
                      )}
                      {ticket?.category.name === "Hardware" && ticket?.subcategory?.name === "Printer" && (
                        <li>
                          <Link href="/knowledge-base?q=printer">
                            <a className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <ExternalLink className="h-3 w-3 mr-2" /> 
                              Resolving printer error messages and paper jams
                            </a>
                          </Link>
                        </li>
                      )}
                      {!((ticket?.category.name === "Network Issues") || 
                         (ticket?.category.name === "Email Services") || 
                         (ticket?.category.name === "Hardware" && ticket?.subcategory?.name === "Printer")) && (
                        <li className="text-gray-500 text-sm">
                          No related articles found.
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
