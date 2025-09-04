import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole = [],
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Role-based access control
  if (requiredRole.length > 0 && !requiredRole.includes(user.role)) {
    const AccessDeniedComponent = () => {
      const [sidebarOpen, setSidebarOpen] = useState(false);
      const isMobile = window.innerWidth < 768;
      
      return (
        <div className="min-h-screen bg-gray-50">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex">
            <Sidebar 
              isMobile={isMobile} 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
            <main className="flex-1 ml-0 md:ml-64 p-8">
              <div className="container mx-auto">
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>
                      You don't have permission to access this page.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Your current role ({user.role}) doesn't have access to this resource.
                      Please contact your administrator if you believe this is an error.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      );
    };
    
    return <Route path={path} component={AccessDeniedComponent} />;
  }

  return <Route path={path} component={Component} />;
}