import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DashboardStats } from "@shared/schema";


function exportToCSV(data: any[], filename = 'report.csv') {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// Sample data for charts
const ticketVolumeData = [
  { name: 'Jan', tickets: 65 },
  { name: 'Feb', tickets: 72 },
  { name: 'Mar', tickets: 89 },
  { name: 'Apr', tickets: 78 },
  { name: 'May', tickets: 95 },
  { name: 'Jun', tickets: 102 },
  { name: 'Jul', tickets: 110 },
];

const resolutionTimeData = [
  { name: 'Network', time: 4.2 },
  { name: 'Hardware', time: 6.8 },
  { name: 'Email', time: 3.5 },
  { name: 'Software', time: 5.2 },
  { name: 'Access', time: 2.9 },
];

const categoryData = [
  { name: 'Network Issues', value: 42 },
  { name: 'Hardware', value: 28 },
  { name: 'Email Services', value: 18 },
  { name: 'Other', value: 12 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const agentPerformanceData = [
  { 
    name: 'Alex Turner',
    tickets: 87,
    avgTime: 3.8,
    slaMet: 96
  },
  { 
    name: 'Sarah Parker',
    tickets: 64,
    avgTime: 4.2,
    slaMet: 92
  },
  { 
    name: 'Michael Lee',
    tickets: 52,
    avgTime: 4.5,
    slaMet: 89
  },
];

const slaComplianceData = [
  { name: 'Jan', compliance: 92 },
  { name: 'Feb', compliance: 93 },
  { name: 'Mar', compliance: 95 },
  { name: 'Apr', compliance: 94 },
  { name: 'May', compliance: 96 },
  { name: 'Jun', compliance: 95 },
  { name: 'Jul', compliance: 97 },
];

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("30days");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [createdDateFrom, setCreatedDateFrom] = useState("");
  const [createdDateTo, setCreatedDateTo] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
    enabled: !!user && user.role === "admin",
  });

  // Simulate date range filtering (last N months)
  const rangeMap = {
    "7days": 3,
    "30days": 5,
    "90days": 7,
  };

  const filteredTicketVolumeData = ticketVolumeData.slice(-((rangeMap as any)[dateRange] || 6));

  // Fix category filtering logic
  const filteredCategoryData = categoryFilter === "all"
    ? categoryData
    : categoryData.filter(item => {
        const categoryMap = {
          "network": "Network Issues",
          "hardware": "Hardware", 
          "email": "Email Services"
        };
        return item.name === (categoryMap as any)[categoryFilter];
      });

  // Filter other data based on category
  const filteredResolutionTimeData = categoryFilter === "all"
    ? resolutionTimeData
    : resolutionTimeData.filter(item => {
        const categoryMap = {
          "network": "Network",
          "hardware": "Hardware",
          "email": "Email"
        };
        return item.name === (categoryMap as any)[categoryFilter];
      });

  // Enhanced export function that includes all filtered data
  const handleExportReport = () => {
    const reportData = [
      ...filteredTicketVolumeData.map(item => ({
        type: 'Volume',
        period: item.name,
        value: item.tickets,
        category: categoryFilter
      })),
      ...filteredCategoryData.map(item => ({
        type: 'Category',
        period: 'Current',
        value: item.value,
        category: item.name
      })),
      ...agentPerformanceData.map(item => ({
        type: 'Agent Performance',
        agent: item.name,
        tickets: item.tickets,
        avgTime: item.avgTime,
        slaMet: item.slaMet
      }))
    ];
    
    exportToCSV(reportData, `report_${dateRange}_${categoryFilter}.csv`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Reports" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Support Analytics</h2>
            <p className="text-sm text-gray-500">Monitor performance metrics and support trends</p>
          </div>

          {/* Enhanced Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      <SelectItem value="company1">Tech Corp</SelectItem>
                      <SelectItem value="company2">Business Inc</SelectItem>
                      <SelectItem value="company3">Startup Ltd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Wise</label>
                  <Select value={agentFilter} onValueChange={setAgentFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      <SelectItem value="agent1">John Doe</SelectItem>
                      <SelectItem value="agent2">Jane Smith</SelectItem>
                      <SelectItem value="agent3">Bob Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="admin">Admin User</SelectItem>
                      <SelectItem value="agent">Support Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Creators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      <SelectItem value="user1">Alice Brown</SelectItem>
                      <SelectItem value="user2">Charlie Wilson</SelectItem>
                      <SelectItem value="user3">Diana Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="network">Network Issues</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="email">Email Services</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="access">Access Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Date Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date From</label>
                    <Input
                      type="date"
                      value={createdDateFrom}
                      onChange={(e) => setCreatedDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date To</label>
                    <Input
                      type="date"
                      value={createdDateTo}
                      onChange={(e) => setCreatedDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date From</label>
                    <Input
                      type="date"
                      value={dueDateFrom}
                      onChange={(e) => setDueDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date To</label>
                    <Input
                      type="date"
                      value={dueDateTo}
                      onChange={(e) => setDueDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Use filters above to customize your report data
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setDateRange('30days');
                    setCompanyFilter('all');
                    setAgentFilter('all');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setAssignedToFilter('all');
                    setCreatedByFilter('all');
                    setCategoryFilter('all');
                    setCreatedDateFrom('');
                    setCreatedDateTo('');
                    setDueDateFrom('');
                    setDueDateTo('');
                  }}>
                    Reset Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportReport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Tickets Volume Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ticket Volume Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredTicketVolumeData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="#1976d2" 
                        activeDot={{ r: 8 }} 
                        name="Tickets"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-500 text-sm">Total Tickets</p>
                    <p className="text-xl font-semibold text-gray-800">245</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Avg. Daily</p>
                    <p className="text-xl font-semibold text-gray-800">8.2</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Trend</p>
                    <p className="text-xl font-semibold text-green-600">↓ 4%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Resolution Time Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resolution Time</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredResolutionTimeData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="time" 
                        fill="#1976d2" 
                        name="Hours"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-500 text-sm">Avg. Resolution</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.avgResponseTime || "4.2h"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">SLA Met</p>
                    <p className="text-xl font-semibold text-green-600">
                      {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.slaComplianceRate || "94%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Trend</p>
                    <p className="text-xl font-semibold text-green-600">↑ 2%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Category Distribution and Team Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ticket Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {filteredCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Network Issues</span>
                    <span className="text-sm font-medium text-gray-800">42%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "42%" }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2 mt-3">
                    <span className="text-sm text-gray-600">Hardware</span>
                    <span className="text-sm font-medium text-gray-800">28%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "28%" }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2 mt-3">
                    <span className="text-sm text-gray-600">Email Services</span>
                    <span className="text-sm font-medium text-gray-800">18%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "18%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Agent Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Agent Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Met</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentPerformanceData.map((agent, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 mr-2">
                                {agent.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{agent.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-sm">{agent.tickets}</td>
                          <td className="py-3 px-3 whitespace-nowrap text-sm">{agent.avgTime}h</td>
                          <td className="py-3 px-3 whitespace-nowrap text-sm">
                            <span className={agent.slaMet >= 95 ? "text-green-600" : agent.slaMet >= 90 ? "text-yellow-600" : "text-red-600"}>
                              {agent.slaMet}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* SLA Compliance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">SLA Compliance</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={slaComplianceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="compliance" 
                      stroke="#43a047" 
                      activeDot={{ r: 8 }} 
                      name="Compliance %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-500 text-sm">High Priority</p>
                    <p className="text-xl font-semibold text-green-600">98%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Medium Priority</p>
                    <p className="text-xl font-semibold text-green-600">94%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Low Priority</p>
                    <p className="text-xl font-semibold text-green-600">97%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
