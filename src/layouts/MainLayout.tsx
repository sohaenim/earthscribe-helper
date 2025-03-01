
import React from "react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MainLayout = ({ children, className }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col paper-texture">
      <Header />
      <main className={cn("flex-1 container py-6", className)}>
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        <div className="container">
          Earth Science Paper Assistant &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
