
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
import { useToast } from "@/hooks/use-toast";
import { resetPasswordForEmail } from "@/services/authService";
import { KioskIcon } from "@/components/icons/KioskIcon";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    const { error } = await resetPasswordForEmail(values.email);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, you will receive instructions to reset your password shortly.",
      });
      form.reset();
    }
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
            Secure account recovery.
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Instant password reset instructions</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Secure and encrypted process</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">24/7 support assistance</p>
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
            <h1 className="text-4xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-muted-foreground text-lg">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="name@example.com" {...field} disabled={isLoading} className="h-12 pl-10 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                      Sending Link...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Reset Link <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
