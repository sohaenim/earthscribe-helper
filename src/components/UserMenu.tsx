
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Settings } from "lucide-react";

const UserMenu = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initials, setInitials] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Fetch profile data from the profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && profileData) {
          setProfile(profileData);
          
          // Set initials based on profile data or user metadata
          const firstName = profileData.first_name || user.user_metadata?.first_name || "";
          const lastName = profileData.last_name || user.user_metadata?.last_name || "";
          
          if (firstName && lastName) {
            setInitials(`${firstName[0]}${lastName[0]}`.toUpperCase());
          } else if (user.email) {
            setInitials(user.email[0].toUpperCase());
          } else {
            setInitials("U");
          }
        } else {
          // Fallback to user metadata if profile is not available
          const firstName = user.user_metadata?.first_name || "";
          const lastName = user.user_metadata?.last_name || "";
          
          if (firstName && lastName) {
            setInitials(`${firstName[0]}${lastName[0]}`.toUpperCase());
          } else if (user.email) {
            setInitials(user.email[0].toUpperCase());
          } else {
            setInitials("U");
          }
        }
      }
      
      setLoading(false);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // Fetch updated profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          
          const firstName = profileData.first_name || session.user.user_metadata?.first_name || "";
          const lastName = profileData.last_name || session.user.user_metadata?.last_name || "";
          
          if (firstName && lastName) {
            setInitials(`${firstName[0]}${lastName[0]}`.toUpperCase());
          } else if (session.user.email) {
            setInitials(session.user.email[0].toUpperCase());
          }
        } else {
          // Fallback to user metadata
          const firstName = session.user.user_metadata?.first_name || "";
          const lastName = session.user.user_metadata?.last_name || "";
          
          if (firstName && lastName) {
            setInitials(`${firstName[0]}${lastName[0]}`.toUpperCase());
          } else if (session.user.email) {
            setInitials(session.user.email[0].toUpperCase());
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        navigate('/auth');
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user);
        
        // Refresh profile data when user is updated
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          
          const firstName = profileData.first_name || session.user.user_metadata?.first_name || "";
          const lastName = profileData.last_name || session.user.user_metadata?.last_name || "";
          
          if (firstName && lastName) {
            setInitials(`${firstName[0]}${lastName[0]}`.toUpperCase());
          }
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message || "An unknown error occurred",
      });
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')} variant="secondary" size="sm">
        <User className="h-4 w-4 mr-2" />
        Sign In
      </Button>
    );
  }

  // Get display name from profile or user metadata
  const firstName = profile?.first_name || user.user_metadata?.first_name || "";
  const lastName = profile?.last_name || user.user_metadata?.last_name || "";
  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : user.email?.split('@')[0] || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
