import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import FAQItem from "@/components/knowledge-base/faq-item";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Wifi, 
  Monitor, 
  Mail, 
  Lock, 
  HelpCircle, 
  ArrowRight, 
  Share2,
  ThumbsUp
} from "lucide-react";
import { Category, Faq } from "@shared/schema";

export default function KnowledgeBasePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;

  // Parse query params for initial search or FAQ highlight
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    const faqId = urlParams.get("faq");
    
    if (q) {
      setSearchQuery(q);
    }
    
    if (faqId) {
      // Logic to scroll to specific FAQ would go here
      const element = document.getElementById(`faq-${faqId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch FAQs
  const { data: faqs, isLoading: isLoadingFaqs } = useQuery<Faq[]>({
    queryKey: ["/api/faqs", selectedCategory],
    queryFn: async ({ queryKey }) => {
      const categoryId = queryKey[1];
      if (categoryId) {
        const res = await fetch(`/api/faqs?categoryId=${categoryId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch FAQs");
        return res.json();
      } else {
        const res = await fetch("/api/faqs", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch FAQs");
        return res.json();
      }
    },
  });

  // Filter FAQs by search query
  const filteredFaqs = faqs?.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get parent categories
  const parentCategories = categories?.filter(c => !c.parentId);

  // Get category name by ID
  const getCategoryNameById = (id: number | null) => {
    if (!id) return "General";
    const category = categories?.find(c => c.id === id);
    return category ? category.name : "Unknown";
  };

  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "network issues":
        return <Wifi className="h-6 w-6" />;
      case "hardware":
        return <Monitor className="h-6 w-6" />;
      case "email services":
        return <Mail className="h-6 w-6" />;
      case "account & password":
        return <Lock className="h-6 w-6" />;
      default:
        return <HelpCircle className="h-6 w-6" />;
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Knowledge Base" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Search and Categories */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Knowledge Base & FAQs</h2>
                <p className="text-gray-500">Find answers to common questions and issues</p>
              </div>
              <div className="relative max-w-2xl mx-auto mb-8">
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-base"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {isLoadingCategories ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className={`h-24 flex flex-col items-center justify-center text-center ${selectedCategory === "" ? "border-primary border-2" : ""}`}
                      onClick={() => handleCategorySelect("")}
                    >
                      <HelpCircle className={`h-8 w-8 mb-2 ${selectedCategory === "" ? "text-primary" : "text-gray-500"}`} />
                      <span className="font-medium">All Categories</span>
                    </Button>

                    {parentCategories?.map((category) => (
                      <Button
                        key={category.id}
                        variant="outline"
                        className={`h-24 flex flex-col items-center justify-center text-center ${selectedCategory === category.id.toString() ? "border-primary border-2" : ""}`}
                        onClick={() => handleCategorySelect(category.id.toString())}
                      >
                        <div className={`mb-2 ${selectedCategory === category.id.toString() ? "text-primary" : "text-gray-500"}`}>
                          {getCategoryIcon(category.name)}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Articles */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory
                  ? `${getCategoryNameById(parseInt(selectedCategory))} FAQs`
                  : searchQuery
                  ? "Search Results"
                  : "Popular Articles"}
              </CardTitle>
              {searchQuery && (
                <CardDescription>
                  {filteredFaqs?.length === 0
                    ? "No results found"
                    : `Found ${filteredFaqs?.length} results for "${searchQuery}"`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingFaqs ? (
                <div className="space-y-6">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : filteredFaqs && filteredFaqs.length > 0 ? (
                <div className="space-y-6">
                  {filteredFaqs.map((faq) => (
                    <FAQItem
                      key={faq.id}
                      faq={faq}
                      categoryName={getCategoryNameById(faq.categoryId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No FAQs found</h3>
                  <p className="mt-1 text-gray-500">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : selectedCategory
                      ? "No FAQs available in this category yet"
                      : "No FAQs available"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Can't find what you're looking for? */}
          <div className="bg-blue-50 rounded-lg p-6 text-center mt-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Can't find what you're looking for?</h3>
            <p className="text-gray-700 mb-4">Our support team is ready to help with your specific issue</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild>
                <Link href="/tickets/new">Create a Support Ticket</Link>
              </Button>
              <Button variant="outline" onClick={() => {
                // Open chatbot (this would be implemented with a global state or context)
                const chatbotToggle = document.querySelector('[aria-label="Chat with support"]');
                if (chatbotToggle && chatbotToggle instanceof HTMLElement) {
                  chatbotToggle.click();
                }
              }}>
                Chat with Support Bot
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
