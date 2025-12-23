
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KioskIcon } from "@/components/icons/KioskIcon";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const supabase = createClient();

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

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "Your session may have expired. Please try the password reset process again.",
      });
      setIsLoading(false);
      router.push('/login');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

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
    <div className="w-full max-w-[400px] lg:max-w-md space-y-8 animate-slide-in-from-right relative z-10">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-4xl font-bold tracking-tight">Update Password</h1>
        <p className="text-muted-foreground text-lg">
          Enter your new password below.
        </p>
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="h-12 pr-10 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="h-12 pr-10 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Update Password <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Changed your mind?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}


function UpdatePasswordSkeleton() {
  return (
    <div className="w-full max-w-md space-y-8 animate-pulse">
      <div className="space-y-2 text-center lg:text-left">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-full max-w-xs" />
      </div>
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Left Side - Visuals */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-muted text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/signup-bg.png"
            alt="Background"
            fill
            className="object-cover opacity-90 scale-105 animate-pulse-primary"
            style={{ animationDuration: '20s' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-2xl font-bold animate-slide-in-from-left">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
            <KioskIcon className="h-8 w-8 text-white" />
          </div>
          <span className="tracking-tight">E-Ntemba</span>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg animate-slide-in-from-bottom delay-300">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Secure your account.
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Choose a strong, unique password</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Protect your business data</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in delay-600">
          <p className="text-sm text-white/60">
            &copy; {new Date().getFullYear()} E-Ntemba. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-4 lg:p-8 bg-background relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <React.Suspense fallback={<UpdatePasswordSkeleton />}>
          <UpdatePasswordForm />
        </React.Suspense>
      </div>
    </div>
  );
}
