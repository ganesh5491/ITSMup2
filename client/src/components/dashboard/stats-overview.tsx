import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStats } from "@shared/schema";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  BarChart
} from "lucide-react";

interface StatsOverviewProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Open Tickets */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Open Tickets</p>
              {isLoading ? (
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
              {isLoading ? (
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
              {isLoading ? (
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
              {isLoading ? (
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
  );
}
