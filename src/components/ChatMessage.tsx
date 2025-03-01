
import React from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: Date;
  };
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";
  
  return (
    <div 
      className={cn(
        "chat-message group py-4 flex items-start gap-4", 
        isUser ? "border-t border-border/30" : "bg-secondary/50"
      )}
    >
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-accent" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      
      <div className="flex-1 prose prose-slate prose-p:leading-relaxed prose-pre:bg-muted/50 max-w-full text-foreground">
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={line.trim() === "" ? "h-4" : ""}>
            {line}
          </p>
        ))}
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 text-muted-foreground"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatMessage;
