import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MessageSquare, Send, User, Bot } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

type Message = {
  id: number;
  userId: number;
  message: string;
  isFromBot: boolean;
  createdAt: string;
};

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatMessages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/chat"],
    queryFn: undefined, // Uses the default fetcher
    enabled: isOpen && !!user, // Only fetch when chatbot is open and user is logged in
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: string) => {
      const res = await apiRequest("POST", "/api/chat", { message: newMessage });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/chat"], (oldData: Message[] = []) => [...oldData, ...data]);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    sendMessageMutation.mutate(message);
    setMessage("");
  };

  // Chatbot toggle button (fixed position)
  const ChatbotToggle = () => (
    <Button
      className="fixed bottom-4 right-4 z-40 rounded-full w-14 h-14 shadow-lg p-0"
      onClick={isOpen ? onClose : undefined}
    >
      <MessageSquare size={24} />
    </Button>
  );

  if (!isOpen) {
    return <ChatbotToggle />;
  }

  return (
    <>
      <ChatbotToggle />

      <div className="fixed bottom-20 right-4 z-40 w-80 shadow-lg">
        <Card className="flex flex-col h-96 max-h-96">
          <CardHeader className="bg-primary text-white py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              IT Support Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary-foreground/10 h-8 w-8"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            ) : !chatMessages || chatMessages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-center space-y-2">
                <Bot className="h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-500">Hello! I'm your IT support assistant.</p>
                <p className="text-sm text-gray-500">How can I help you today?</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.isFromBot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.isFromBot
                        ? "bg-gray-100 text-gray-800"
                        : "bg-primary text-white"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {msg.isFromBot ? (
                        <Bot className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-xs">
                        {msg.isFromBot ? "Assistant" : "You"}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="border-t p-3">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
                disabled={sendMessageMutation.isPending || !user}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMessageMutation.isPending || !message.trim() || !user}
              >
                <Send size={16} />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {!user && (
          <div className="mt-2 text-xs text-center p-2 bg-white rounded shadow-md">
            <p className="text-gray-700">
              Please <Link href="/auth"><a className="text-primary hover:underline">login</a></Link> to chat with support
            </p>
          </div>
        )}
      </div>
    </>
  );
}
