import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CornerDownLeft, Bot, Sparkles, RefreshCw } from "lucide-react";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";
import ModelSettings from "./ModelSettings";
import DocumentUpload from "./DocumentUpload";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/ai-service";

interface ChatInterfaceProps {
  className?: string;
}

const initialMessages: ChatMessageProps['message'][] = [
  {
    id: "1",
    role: "assistant",
    content: "Welcome to Earth Science Paper Assistant. I'm here to help you write, edit, and polish your scientific papers with a focus on Earth Science. What would you like to work on today?\n\nI can help with:\n- Drafting new sections\n- Polishing existing text\n- Suggesting citations\n- Checking grammar and style\n- Explaining complex Earth Science concepts\n- Formatting references in APA style",
    timestamp: new Date(),
  },
];

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessageProps['message'][]>(initialMessages);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedDocuments, setLoadedDocuments] = useState<string[]>([]);
  const [modelSettings, setModelSettings] = useState<ModelSettingsState>({
    model: 'default',
    temperature: 0.7,
    maxTokens: 2000,
    role: "assistant",
    preset: "default",
    factChecking: {
      enabled: true,
      autoVerify: true,
      minConfidence: 0.7,
      strictMode: false,
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || isProcessing) return;

    // Add user message
    const userMessage: ChatMessageProps['message'] = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    // Focus back on textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    try {
      // Get response from AI service
      const contextPrompt = loadedDocuments.length > 0 
        ? `Context: The user has loaded the following documents: ${loadedDocuments.join(", ")}.\n\nUser request: ${input}`
        : input;

      const response = await aiService.getCompletion({
        prompt: contextPrompt,
        settings: modelSettings
      });

      const assistantMessage: ChatMessageProps['message'] = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting completion:', error);
      const errorMessage: ChatMessageProps['message'] = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("flex flex-col h-[calc(100vh-12rem)]", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-medium">Earth Science Assistant</h2>
          <div className="flex items-center gap-1 bg-secondary/80 text-xs px-2 py-0.5 rounded-full">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-primary-foreground font-medium">APA Style</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DocumentUpload 
            className="shrink-0" 
            onDocumentsLoaded={setLoadedDocuments}
          />
          <ModelSettings onSettingsChange={setModelSettings} />
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground h-8 w-8"
            title="New Conversation"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto glass-panel rounded-lg mb-4">
        <div className="px-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isProcessing && (
            <div className="py-4 flex items-start gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="typing-indicator mt-3">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Earth Science paper writing, editing, citations..."
          className="resize-none pr-16 glass-panel min-h-[60px]"
          rows={2}
        />
        <div className="absolute right-3 bottom-3 flex gap-2 items-center">
          <div className="text-xs text-muted-foreground hidden sm:block">
            <CornerDownLeft className="h-3 w-3 inline mr-1" />
            to send
          </div>
          <Button 
            size="icon" 
            type="submit" 
            disabled={input.trim() === "" || isProcessing}
            className="h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
