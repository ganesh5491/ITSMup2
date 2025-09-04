import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Faq } from "@shared/schema";
import { ThumbsUp, Share2 } from "lucide-react";

interface FAQItemProps {
  faq: Faq;
  categoryName: string;
}

export default function FAQItem({ faq, categoryName }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [helpful, setHelpful] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const markHelpful = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpful(true);
  };

  const shareItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a shareable URL for this FAQ
    const shareUrl = `${window.location.origin}/knowledge-base?faq=${faq.id}`;
    
    // Check if the browser supports the Web Share API
    if (navigator.share) {
      navigator.share({
        title: faq.question,
        text: `Check out this FAQ: ${faq.question}`,
        url: shareUrl,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback to copying the URL to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard');
      }).catch(err => {
        console.error('Error copying to clipboard:', err);
      });
    }
  };

  return (
    <Card 
      id={`faq-${faq.id}`}
      className={`transition-all duration-200 ${expanded ? "border-blue-200" : ""}`}
      onClick={toggleExpand}
    >
      <CardHeader className="py-4 px-6 cursor-pointer">
        <CardTitle className="text-lg flex justify-between items-start">
          <span>{faq.question}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-7 w-7 p-0 rotate-0 transform transition-transform duration-200"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 15 15" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
            >
              <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className={`px-6 overflow-hidden transition-all duration-300 ${expanded ? "pb-4" : "max-h-0 p-0"}`}>
        <div className={`transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{faq.answer}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              {categoryName}
            </Badge>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center gap-1 ${helpful ? 'text-green-600' : 'text-gray-600'}`}
                onClick={markHelpful}
                disabled={helpful}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{helpful ? 'Helpful' : 'Mark as helpful'}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 text-blue-600"
                onClick={shareItem}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
