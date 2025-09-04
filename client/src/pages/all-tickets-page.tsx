import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TicketList from "@/components/tickets/ticket-list";
import TicketFilters from "@/components/tickets/ticket-filters";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { Category, Ticket, User } from "@shared/schema";

interface FilterState {
  status?: string;
  priority?: string;
  categoryId?: number;
  assignedToId?: number;
  companyName?: string;
}

export default function AllTicketsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    assignedToId: 0  // Default to unassigned tickets
  });
  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;

  // Fetch all tickets (for admins and agents)
  const { data: tickets, isLoading: isLoadingTickets } = useQuery<any[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  // Fetch ticket categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Fetch users (for assignment filter)
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "admin",
  });

  // Get ticket counts by status
  const getTicketCounts = () => {
    if (!tickets) return { total: 0, open: 0, inProgress: 0, closed: 0 };
    
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  };

  const counts = getTicketCounts();

  // Filter tickets based on search query and filters
  const filteredTickets = tickets?.filter(ticket => {
    let matchesSearch = true;
    let matchesFilters = true;

    // Apply search query
    if (searchQuery) {
      matchesSearch = 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `TKT-${ticket.id.toString().padStart(4, '0')}`.includes(searchQuery);
    }

    // Apply status filter
    if (filters.status && ticket.status !== filters.status) {
      matchesFilters = false;
    }

    // Apply priority filter
    if (filters.priority && ticket.priority !== filters.priority) {
      matchesFilters = false;
    }

    // Apply category filter
    if (filters.categoryId && ticket.categoryId !== filters.categoryId) {
      matchesFilters = false;
    }

    // Apply assigned filter
    if (filters.assignedToId !== undefined) {
      // If filter is for unassigned tickets
      if (filters.assignedToId === 0 && ticket.assignedToId !== null) {
        matchesFilters = false;
      } 
      // If filter is for tickets assigned to specific agent
      else if (filters.assignedToId > 0 && ticket.assignedToId !== filters.assignedToId) {
        matchesFilters = false;
      }
    }

    // Apply company name filter
    if (filters.companyName && ticket.createdBy.companyName !== filters.companyName) {
      matchesFilters = false;
    }

    return matchesSearch && matchesFilters;
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="All Tickets" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Actions Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-gray-800">All Support Tickets</h2>
              <p className="text-sm text-gray-500">Manage and resolve tickets from all users</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filter
              </Button>
            </div>
          </div>

          {/* Tickets Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total</p>
                  <p className="text-2xl font-semibold mt-1">{isLoadingTickets ? <Skeleton className="h-8 w-8" /> : counts.total}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-full text-gray-700">
                  <Filter className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Open</p>
                  <p className="text-2xl font-semibold mt-1">{isLoadingTickets ? <Skeleton className="h-8 w-8" /> : counts.open}</p>
                </div>
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                  <div className="h-5 w-5 flex items-center justify-center font-bold">!</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-medium">In Progress</p>
                  <p className="text-2xl font-semibold mt-1">{isLoadingTickets ? <Skeleton className="h-8 w-8" /> : counts.inProgress}</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                  <div className="h-5 w-5 flex items-center justify-center">⏱️</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Closed</p>
                  <p className="text-2xl font-semibold mt-1">{isLoadingTickets ? <Skeleton className="h-8 w-8" /> : counts.closed}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <div className="h-5 w-5 flex items-center justify-center">✓</div>
                </div>
              </CardContent>
            </Card>
            

          </div>

          {/* Filters */}
          <TicketFilters 
            categories={categories || []} 
            users={users || []} 
            tickets={tickets || []}
            showAssigneeFilter={true}
            onFilterChange={handleFilterChange}
          />

          {/* Tickets List */}
          <Card>
            {isLoadingTickets ? (
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            ) : filteredTickets && filteredTickets.length > 0 ? (
              <TicketList 
                tickets={filteredTickets} 
                showCreatedBy={true}
                showAssignedTo={true}
              />
            ) : (
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-500 mb-6">
                  {Object.keys(filters).length > 0 || searchQuery
                    ? "Try adjusting your filters or search query"
                    : "There are no tickets in the system yet"}
                </p>
              </CardContent>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
