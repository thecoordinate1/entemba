
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
import { useToast } from "@/hooks/use-toast";
// import { resetPasswordForEmail } from "@/services/authService"; // To be implemented
import { Gem } from "lucide-react";

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
    // const { error } = await resetPasswordForEmail(values.email); // To be implemented
    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    const error = null; // Placeholder
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        // description: error.message,
        description: "This feature is not yet implemented.",
      });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, you will receive instructions to reset your password.",
      });
      form.reset();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
        <div className="flex items-center gap-2 mb-8 text-2xl font-semibold text-primary">
            <Gem className="h-8 w-8" />
            <span>E-Ntemba</span>
        </div>
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
                Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
            </CardHeader>
            <CardContent>
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                </form>
            </Form>
            </CardContent>
            <CardContent className="mt-4 text-center text-sm">
                Remembered your password?{" "}
                <Link href="/login" className="underline text-primary hover:text-primary/80">
                    Sign In
                </Link>
            </CardContent>
        </Card>
    </div>
  );
}
