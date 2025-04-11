"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  LogIn,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export function ProfileButton() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Successfully logged out!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Button
        className="flex items-center space-x-2"
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            Signing in...
          </div>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            <span>Sign in</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
            ) : (
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/startup-profile">
          <DropdownMenuItem>
            <Building2 className="mr-2 h-4 w-4" />
            <span>My Startup Profile</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 