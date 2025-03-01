
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CornerDownLeft, Bot, Sparkles, RefreshCw } from "lucide-react";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";
import ModelSettings from "./ModelSettings";
import DocumentUpload from "./DocumentUpload";
import { cn } from "@/lib/utils";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
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

    // Simulate AI response after a delay
    setTimeout(() => {
      // This would be replaced with an actual API call to your backend
      const assistantMessage: ChatMessageProps['message'] = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(input),
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 2000);
  };

  const getSimulatedResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes("introduction") || lowerInput.includes("start")) {
      return "For an Earth Science paper introduction, you should:\n\n1. Begin with a broad statement about the research area\n2. Narrow down to the specific problem or question\n3. Explain why this research is important and relevant\n4. Briefly mention existing literature\n5. Clearly state your research objectives\n6. Outline your approach\n7. Provide a roadmap for the rest of the paper\n\nWould you like me to help draft an introduction for a specific topic?";
    } else if (lowerInput.includes("climate") || lowerInput.includes("change")) {
      return "Climate change is a significant focus in Earth Science research. When writing about climate change, consider:\n\n- Using precise terminology (e.g., \"global warming\" vs \"climate change\")\n- Citing the latest IPCC reports for authoritative information\n- Distinguishing between observed data and projections\n- Addressing uncertainty appropriately\n- Connecting climate processes to your specific research area\n\nWhich aspect of climate science are you focusing on in your paper?";
    } else if (lowerInput.includes("citation") || lowerInput.includes("reference")) {
      return "For APA style citations in Earth Science papers:\n\n**In-text citation:**\nRecent glacial retreats have accelerated due to rising temperatures (Thompson et al., 2021).\n\n**Reference list entry:**\nThompson, J. K., Ramirez, A. L., & Chen, H. (2021). Accelerated glacial retreat in the Greater Himalayan region. *Journal of Climate Change*, 15(3), 245-267. https://doi.org/10.1234/jcc.2021.15.3.245\n\nWould you like me to format a specific citation for you?";
    } else if (lowerInput.includes("method") || lowerInput.includes("methodology")) {
      return "A strong methodology section in Earth Science should:\n\n1. Describe the study area/sample collection in detail\n2. Explain equipment specifications and measurement procedures\n3. Detail laboratory techniques or computational methods\n4. Address limitations and assumptions\n5. Include quality control measures\n6. Provide enough detail for replication\n\nWhich specific methodological approach are you using in your research?";
    } else if (lowerInput.includes("conclusion")) {
      return "For an effective conclusion in your Earth Science paper:\n\n1. Summarize your key findings without simply repeating results\n2. Interpret results in the context of existing literature\n3. Acknowledge limitations of your study\n4. Suggest implications for theory or practice\n5. Recommend directions for future research\n\nAvoid introducing completely new information in the conclusion. Would you like help drafting a conclusion for your specific research?";
    } else {
      return "Thank you for your query. As your Earth Science Paper Assistant, I'd be happy to help you with this topic. To provide the most accurate and helpful guidance:\n\n1. Could you share more specific details about your research question or the section you're working on?\n\n2. What geological, atmospheric, oceanographic, or other Earth Science subdiscipline does your paper focus on?\n\n3. Are you looking for help with content development, citation formatting, or language refinement?\n\nThe more context you provide, the better I can tailor my assistance to your specific needs.";
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
          <DocumentUpload />
          <ModelSettings />
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
