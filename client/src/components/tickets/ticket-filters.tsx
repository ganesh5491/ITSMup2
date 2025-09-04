import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { Category, User } from "@shared/schema";

interface FilterState {
  status?: string;
  priority?: string;
  categoryId?: number;
  assignedToId?: number;
  companyName?: string;
}

interface TicketFiltersProps {
  categories: Category[];
  users?: User[];
  tickets?: any[];
  showAssigneeFilter?: boolean;
  onFilterChange: (filters: FilterState) => void;
}

export default function TicketFilters({
  categories,
  users = [],
  tickets = [],
  showAssigneeFilter = false,
  onFilterChange,
}: TicketFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    assignedToId: showAssigneeFilter ? 0 : undefined  // Default to unassigned when showing assignee filter
  });

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      status: undefined,
      priority: undefined,
      categoryId: undefined,
      assignedToId: showAssigneeFilter ? 0 : undefined  // Keep unassigned default when resetting
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Update parent when filters change (dynamic filtering)
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Get parent categories (no parentId)
  const parentCategories = categories.filter(c => !c.parentId);

  // Get unique company names from tickets
  const uniqueCompanies = Array.from(new Set(tickets.map(t => t.createdBy?.companyName).filter(Boolean)));

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select 
              value={filters.status || "all-statuses"} 
              onValueChange={(value) => setFilters({...filters, status: value !== "all-statuses" ? value : undefined})}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select 
              value={filters.priority || "all-priorities"} 
              onValueChange={(value) => setFilters({...filters, priority: value !== "all-priorities" ? value : undefined})}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select 
              value={filters.categoryId?.toString() || "all-categories"} 
              onValueChange={(value) => setFilters({
                ...filters, 
                categoryId: value !== "all-categories" ? parseInt(value) : undefined
              })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                {parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAssigneeFilter && (
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <Select 
                value={filters.assignedToId === 0 ? "unassigned" : (filters.assignedToId?.toString() || "all-agents")} 
                onValueChange={(value) => {
                  if (value === "unassigned") {
                    setFilters({...filters, assignedToId: 0});
                  } else if (value === "all-agents") {
                    setFilters({...filters, assignedToId: undefined});
                  } else {
                    setFilters({...filters, assignedToId: parseInt(value)});
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-agents">All Agents</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.filter(u => u.role === "agent" || u.role === "admin").map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Company Name Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <Select 
              value={filters.companyName || "all-companies"} 
              onValueChange={(value) => setFilters({
                ...filters, 
                companyName: value !== "all-companies" ? value : undefined
              })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-companies">All Companies</SelectItem>
                {uniqueCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto ml-auto flex items-end gap-2">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
