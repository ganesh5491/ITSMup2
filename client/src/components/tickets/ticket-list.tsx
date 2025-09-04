import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Paperclip
} from "lucide-react";
import { Ticket, User } from "@shared/schema";

interface TicketWithExtras extends Ticket {
  category?: any;
  subcategory?: any;
  createdBy?: User;
  assignedTo?: User;
  commentCount?: number;
}

interface TicketListProps {
  tickets: TicketWithExtras[];
  showCreatedBy?: boolean;
  showAssignedTo?: boolean;
  isOwner?: boolean;
}

export default function TicketList({
  tickets,
  showCreatedBy = false,
  showAssignedTo = false,
  isOwner = false
}: TicketListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketWithExtras | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      await apiRequest("DELETE", `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket deleted",
        description: "The ticket has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setTicketToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket updated",
        description: "The ticket status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign ticket to self mutation
  const assignTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      await apiRequest("PATCH", `/api/tickets/${ticketId}`, {
        assignedToId: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket assigned",
        description: "The ticket has been assigned to you.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTicketId = (id: number) => {
    return `TKT-${id.toString().padStart(4, '0')}`;
  };

  const handleViewTicket = (ticketId: number) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: number) => {
    navigate(`/tickets/${ticketId}/edit`);
  };

  const handleDeleteTicket = (ticket: TicketWithExtras) => {
    setTicketToDelete(ticket);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTicket = () => {
    if (ticketToDelete) {
      deleteTicketMutation.mutate(ticketToDelete.id);
    }
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({ id: ticketId, status: newStatus });
  };

  const handleAssignToSelf = (ticketId: number) => {
    assignTicketMutation.mutate(ticketId);
  };

  const canEditTicket = (ticket: TicketWithExtras) => {
    return (
      user?.role === "admin" ||
      user?.role === "agent" ||
      (isOwner && ticket.createdById === user?.id)
    );
  };

  const canDeleteTicket = (ticket: TicketWithExtras) => {
    return (
      user?.role === "admin" ||
      (isOwner && ticket.createdById === user?.id)
    );
  };

  const canAssignTicket = (ticket: TicketWithExtras) => {
    return (
      (user?.role === "admin" || user?.role === "agent") &&
      ticket.assignedToId !== user?.id
    );
  };

  return (
    <>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Ticket Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm font-medium text-gray-900">
                        {formatTicketId(ticket.id)}
                      </span>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  {/* Ticket Title */}
                  <h3 className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => handleViewTicket(ticket.id)}>
                    {ticket.title}
                  </h3>

                  {/* Ticket Description */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {ticket.description}
                  </p>

                  {/* Ticket Meta Information */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'No date'}
                      </span>
                    </div>

                    {showCreatedBy && ticket.createdBy && (
                      <div className="flex items-center space-x-2">
                        <span>Created by:</span>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {ticket.createdBy.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{ticket.createdBy.name}</span>
                      </div>
                    )}

                    {showAssignedTo && (
                      <div className="flex items-center space-x-2">
                        {ticket.assignedTo ? (
                          <>
                            <span>Assigned to:</span>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {ticket.assignedTo.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{ticket.assignedTo.name}</span>
                          </>
                        ) : (
                          <span className="text-orange-600">Unassigned</span>
                        )}
                      </div>
                    )}

                    {ticket.category && (
                      <div className="flex items-center space-x-1">
                        <span>Category:</span>
                        <Badge variant="secondary" className="text-xs">
                          {ticket.category.name}
                        </Badge>
                      </div>
                    )}

                    {ticket.attachmentUrl && (
                      <div className="flex items-center space-x-1">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-xs">Attachment</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Comment Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTicket(ticket.id)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {ticket.commentCount || 0}
                    </span>
                  </Button>

                  {/* More Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewTicket(ticket.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      {/* EDIT FUNCTIONALITY */}
                      {canEditTicket(ticket) && (
                        <DropdownMenuItem onClick={() => handleEditTicket(ticket.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Ticket
                        </DropdownMenuItem>
                      )}

                      {canAssignTicket(ticket) && (
                        <DropdownMenuItem onClick={() => handleAssignToSelf(ticket.id)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign to Me
                        </DropdownMenuItem>
                      )}

                      {(user?.role === "admin" || user?.role === "agent") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(ticket.id, "in-progress")}
                            disabled={ticket.status === "in-progress"}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(ticket.id, "resolved")}
                            disabled={ticket.status === "resolved" || ticket.status === "closed"}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(ticket.id, "closed")}
                            disabled={ticket.status === "closed"}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Close Ticket
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* DELETE FUNCTIONALITY */}
                      {canDeleteTicket(ticket) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTicket(ticket)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Ticket
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ticket "{ticketToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTicket}
              disabled={deleteTicketMutation.isPending}
            >
              {deleteTicketMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
