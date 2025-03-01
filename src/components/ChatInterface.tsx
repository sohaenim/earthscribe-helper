import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CornerDownLeft, Bot, Sparkles, RefreshCw } from "lucide-react";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";
import ModelSettings from "./ModelSettings";
import DocumentUpload from "./DocumentUpload";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/ai-service";
import { useToast } from "@/components/ui/use-toast";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessageProps['message'][]>([]);
  const [loadedDocuments, setLoadedDocuments] = useState<{name: string; content: string}[]>([]);
  const [modelSettings, setModelSettings] = useState<ModelSettingsState>({
    model: 'claude-3-sonnet-20240229',
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDocumentsLoaded = useCallback((documents: {name: string; content: string}[]) => {
    setLoadedDocuments(prev => [...prev, ...documents]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    const currentInput = input;
    setInput('');
    
    try {
      const response = await aiService.getCompletion({
        prompt: currentInput,
        settings: {
          selectedModel: modelSettings.model,
          temperature: modelSettings.temperature,
          maxTokens: modelSettings.maxTokens,
          role: modelSettings.role
        },
        documents: loadedDocuments.map(doc => ({
          name: doc.name,
          content: doc.content
        }))
      });

      setMessages(prev => [
        ...prev,
        { role: 'user', content: currentInput, timestamp: new Date() },
        { role: 'assistant', content: response.text, timestamp: new Date() }
      ]);
      
      // Focus back on textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);

    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to get response',
        variant: "destructive",
      });
      // Restore input on error
      setInput(currentInput);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <DocumentUpload onDocumentsLoaded={handleDocumentsLoaded} />
          <ModelSettings onSettingsChange={setModelSettings} />
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground h-8 w-8"
            onClick={() => setMessages([])}
            title="Clear conversation"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loadedDocuments.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2 text-sm text-green-700 dark:text-green-300">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            <span>{loadedDocuments.length} document{loadedDocuments.length > 1 ? 's' : ''} loaded: {loadedDocuments.map(d => d.name).join(', ')}</span>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <ChatMessage 
            key={`${message.role}-${index}`}
            message={{
              role: message.role,
              content: message.content,
              timestamp: message.timestamp
            }} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isProcessing || !input.trim()}
            className="h-[60px] px-6"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
