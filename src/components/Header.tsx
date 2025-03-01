
import React from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import UserMenu from "@/components/UserMenu";

const Header = () => {
  return (
    <header className="border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Flame className="h-5 w-5 text-primary" /> 
          <span>Earth Science Paper Assistant</span>
        </Link>
        <div className="flex-1"></div>
        <nav className="flex items-center gap-2">
          <UserMenu />
        </nav>
      </div>
    </header>
  );
};

export default Header;
