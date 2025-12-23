
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmail, resendConfirmationEmail } from "@/services/authService";
import { KioskIcon } from "@/components/icons/KioskIcon";
import { MailWarning, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [showVerificationNeeded, setShowVerificationNeeded] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleResendVerification() {
    setIsLoading(true);
    const email = form.getValues("email");
    const { error } = await resendConfirmationEmail(email);
    setIsLoading(false);

    if (error) {
      toast({ variant: "destructive", title: "Failed to Resend", description: error.message });
    } else {
      toast({ title: "Verification Email Sent", description: "Please check your inbox." });
      setShowVerificationNeeded(false); // Go back to login form
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setShowVerificationNeeded(false);
    const { error } = await signInWithEmail(values.email, values.password);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setShowVerificationNeeded(true);
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "You must verify your email before you can sign in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
      }
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    }
  }

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
        <div className="flex items-center gap-2 mb-8 text-2xl font-semibold text-primary">
          <KioskIcon className="h-8 w-8" />
          <span>E-Ntemba</span>
        </div>
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

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
            Welcome back to your <span className="text-primary">command center</span>.
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Track your daily sales performance</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Manage orders and inventory</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Connect with your customers</p>
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

        <div className="w-full max-w-[400px] lg:max-w-md space-y-8 animate-slide-in-from-right relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-lg">
              Enter your credentials to access your account.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
            {showVerificationNeeded ? (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <MailWarning className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Email Verification Required</h3>
                  <p className="text-sm text-muted-foreground">
                    A verification link was sent to <strong>{form.getValues("email")}</strong>. Please check your inbox (and spam folder) to continue.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Before resending, please wait a few minutes as email delivery may be delayed.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full h-12 text-base"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowVerificationNeeded(false)}
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-foreground/80">Password</FormLabel>
                          <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isLoading} className="h-12 pr-10 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Signing In...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
