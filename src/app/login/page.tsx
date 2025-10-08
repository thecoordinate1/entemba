
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { MailWarning } from "lucide-react";

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
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full mt-2" />
               <div className="h-4"></div> 
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardContent className="mt-4 text-center text-sm">
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-8 text-2xl font-semibold text-primary">
        <KioskIcon className="h-8 w-8" />
        <span>E-Ntemba</span>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showVerificationNeeded ? (
            <div className="space-y-4 text-center">
                <MailWarning className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Email Verification Required</h3>
                <p className="text-sm text-muted-foreground">
                    A verification link was sent to <strong>{form.getValues("email")}</strong>. Please check your inbox (and spam folder) to continue.
                </p>
                <Button
                    type="button"
                    className="w-full"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Resend Verification Email"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowVerificationNeeded(false)}
                    disabled={isLoading}
                >
                    Back to Login
                </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} disabled={isLoading} />
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
                          <FormLabel>Password</FormLabel>
                          <Link href="/forgot-password" passHref legacyBehavior>
                              <a className="text-sm text-primary hover:underline">Forgot password?</a>
                          </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardContent className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline text-primary hover:text-primary/80">
            Sign Up
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
