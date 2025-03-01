
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Settings, User } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 glass-panel">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Earth Science <span className="text-primary">Paper Assistant</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
