"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProfileButton } from "./ProfileButton";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-50">
        <ProfileButton />
      </div>
      {children}
    </div>
  );
} 