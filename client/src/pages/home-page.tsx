import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  BarChart,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from "lucide-react";
import { DashboardStats, Faq, Ticket, User } from "@shared/schema";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
    enabled: !!user,
  });

  // Fetch recent tickets
  const { data: tickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  // Fetch popular FAQs
  const { data: faqs, isLoading: isLoadingFaqs } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
    enabled: !!user,
  });

  // Get status color based on ticket status
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Dashboard" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Open Tickets */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Open Tickets</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-semibold mt-1">{stats?.openTickets || 0}</p>
                    )}
                  </div>
                  <div className="bg-red-100 p-2 rounded-full text-red-600">
                    <AlertCircle size={20} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="text-red-600">+5%</span> from last week
                </div>
              </CardContent>
            </Card>

            {/* In Progress Tickets */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">In Progress</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-semibold mt-1">{stats?.inProgressTickets || 0}</p>
                    )}
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                    <Clock size={20} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="text-yellow-600">2 tickets</span> pending response
                </div>
              </CardContent>
            </Card>

            {/* Recently Resolved */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Recently Resolved</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-semibold mt-1">{stats?.resolvedTickets || 0}</p>
                    )}
                  </div>
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle size={20} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="text-green-600">-10%</span> from last week
                </div>
              </CardContent>
            </Card>

            {/* Average Response Time */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Avg. Response Time</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-semibold mt-1">{stats?.avgResponseTime || "N/A"}</p>
                    )}
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <BarChart size={20} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="text-green-600">+15%</span> improvement
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tickets */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Recent Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTickets ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.slice(0, 5).map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/tickets/${ticket.id}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-900">TKT-{ticket.id.toString().padStart(4, '0')}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">{ticket.title}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm capitalize ${
                              ticket.priority === 'high' ? 'text-red-600' : 
                              ticket.priority === 'medium' ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>{ticket.priority}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(ticket.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tickets found</p>
                  <Button asChild className="mt-4">
                    <Link href="/tickets/new">Create your first ticket</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-end py-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tickets">
                  View all tickets
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Additional Dashboard Elements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FAQ Most Viewed */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Popular FAQs</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFaqs ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : faqs && faqs.length > 0 ? (
                  <ul className="space-y-3">
                    {faqs.slice(0, 3).map((faq) => (
                      <li key={faq.id} className="pb-3 border-b border-gray-100">
                        <Link href={`/knowledge-base?faq=${faq.id}`} className="block hover:text-primary">
                          <h3 className="text-sm font-medium">{faq.question}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {/* Category name would come from a join query, we're simplifying here */}
                            {faq.categoryId ? `Category #${faq.categoryId}` : 'General'}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No FAQs available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 flex justify-end py-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/knowledge-base">
                    View knowledge base
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* SLA Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Overall SLA Compliance</span>
                      <span className="text-sm font-semibold text-green-600">{stats?.slaComplianceRate || "N/A"}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: stats?.slaComplianceRate || "0%" }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Response Time</span>
                        <p className="text-lg font-semibold">30 min</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-green-600">96% met</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Resolution Time</span>
                        <p className="text-lg font-semibold">4 hours</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-yellow-600">87% met</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
