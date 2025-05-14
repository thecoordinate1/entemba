
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";
// import { createClient } from '@/lib/supabase/client'; // Would be needed for actual password update

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // const supabase = createClient(); // Would be needed for actual password update

  // The access_token and refresh_token are not directly available here for client-side update
  // Supabase handles setting the session after clicking the link.
  // If the user is redirected here, they should already have a session that allows password update.
  // However, typically the email link from Supabase takes the user to a Supabase hosted page
  // or requires you to handle the recovery token.
  // For simplicity, this page assumes the user is already in a state where Supabase allows password update.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both password fields are identical.",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }
    setIsLoading(true);
    
    // Placeholder for actual Supabase password update logic
    // const { error } = await supabase.auth.updateUser({ password });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    const error = { message: "Password update functionality not yet fully implemented in this demo." }; // Placeholder

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Password Update Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Password Updated Successfully",
        description: "You can now log in with your new password.",
      });
      router.push("/login");
    }
  };
  
  // Check for error from Supabase redirect (e.g. invalid token)
  React.useEffect(() => {
    const errorDescription = searchParams.get('error_description');
    if (errorDescription) {
        toast({
            variant: 'destructive',
            title: 'Password Reset Error',
            description: decodeURIComponent(errorDescription)
        });
    }
  }, [searchParams, toast]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-8 text-2xl font-semibold text-primary">
        <Gem className="h-8 w-8" />
        <span>E-Ntemba</span>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Update Your Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
         <CardContent className="mt-4 text-center text-sm">
            Changed your mind?{" "}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
                Back to Sign In
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
