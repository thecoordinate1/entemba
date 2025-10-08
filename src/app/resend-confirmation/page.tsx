
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resendConfirmationEmail } from "@/services/authService";
import { KioskIcon } from "@/components/icons/KioskIcon";
import { MailCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const resendSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ResendFormValues = z.infer<typeof resendSchema>;

function ResendConfirmationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const emailFromQuery = searchParams.get("email");

  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: emailFromQuery || "",
    },
  });

  React.useEffect(() => {
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, form]);

  async function onSubmit(values: ResendFormValues) {
    setIsLoading(true);
    const { error } = await resendConfirmationEmail(values.email);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to Resend",
        description: error.message || "Could not resend confirmation email. Please try again.",
      });
    } else {
      toast({
        title: "Confirmation Email Sent",
        description: "If an account exists for this email, a new confirmation link has been sent. Please check your inbox.",
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl pt-2">Confirm Your Email</CardTitle>
          <CardDescription>
            Your email address needs to be confirmed before you can sign in.
            Enter your email below to resend the confirmation link.
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
                {isLoading ? "Sending..." : "Resend Confirmation Email"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardContent className="mt-4 text-center text-sm">
          <Link href="/login" className="underline text-primary hover:text-primary/80">
            Back to Sign In
          </Link>
        </CardContent>
      </Card>
  )
}

function ResendConfirmationSkeleton() {
  return (
     <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl pt-2">Confirm Your Email</CardTitle>
          <CardDescription>
            Loading...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardContent className="mt-4 text-center text-sm">
          <Skeleton className="h-4 w-32 mx-auto" />
        </CardContent>
      </Card>
  )
}


export default function ResendConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-8 text-2xl font-semibold text-primary">
        <KioskIcon className="h-8 w-8" />
        <span>E-Ntemba</span>
      </div>
      <React.Suspense fallback={<ResendConfirmationSkeleton />}>
        <ResendConfirmationForm />
      </React.Suspense>
    </div>
  );
}
