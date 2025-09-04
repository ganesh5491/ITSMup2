import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import Chatbot from "@/components/chatbot/chatbot";

interface HeaderProps {
  toggleSidebar: () => void;
  title: string;
}

export default function Header({ toggleSidebar, title }: HeaderProps) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [location] = useLocation();

  // Helper to determine page title from URL (if not provided)
  const getPageTitle = (): string => {
    if (title) return title;

    if (location === "/") return "Dashboard";
    if (location.startsWith("/tickets")) {
      if (location === "/tickets") return "My Tickets";
      if (location.includes("/new")) return "Create Ticket";
      return "Ticket Details";
    }
    if (location === "/knowledge-base") return "Knowledge Base";
    if (location === "/all-tickets") return "All Tickets";
    if (location === "/admin/users") return "User Management";
    if (location === "/admin/categories") return "Categories";
    if (location === "/admin/reports") return "Reports";
    if (location === "/admin/settings") return "Settings";

    return "IT Helpdesk";
  };

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <>
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-gray-600"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </Button>
          <div className="ml-2 md:ml-0">
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            aria-label="Search"
          >
            <Search size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900 relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 bg-red-400 rounded-full w-2 h-2"></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            onClick={toggleChatbot}
            aria-label="Chat with support"
          >
            <MessageSquare size={20} />
          </Button>
        </div>
      </header>

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </>
  );
}
