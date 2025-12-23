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
import { signUpWithEmail } from "@/services/authService";
import { KioskIcon } from "@/components/icons/KioskIcon";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Landmark, Smartphone, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const signUpSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email address." })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: "Please enter a valid email address with a domain (e.g., .com)." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm Password must be at least 6 characters." }),
  // Optional vendor profile fields
  bank_name: z.string().optional(),
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().regex(/^\d+$/, { message: "Account number must contain only digits." }).optional().or(z.literal("")),
  bank_branch_name: z.string().optional(),
  mobile_money_provider: z.string().optional(),
  mobile_money_number: z.string().regex(/^\+?[\d\s]+$/, { message: "Invalid phone number format." }).optional().or(z.literal("")),
  mobile_money_name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<"bank" | "mobile_money">("bank");

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      bank_name: "",
      bank_account_name: "",
      bank_account_number: "",
      bank_branch_name: "",
      mobile_money_provider: "",
      mobile_money_number: "",
      mobile_money_name: "",
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);
    try {
      // Prepare vendor details based on selected payment method
      const vendorDetails = paymentMethod === "bank"
        ? {
          bank_name: values.bank_name || null,
          bank_account_name: values.bank_account_name || null,
          bank_account_number: values.bank_account_number || null,
          bank_branch_name: values.bank_branch_name || null,
          mobile_money_provider: null,
          mobile_money_number: null,
          mobile_money_name: null,
        }
        : {
          bank_name: null,
          bank_account_name: null,
          bank_account_number: null,
          bank_branch_name: null,
          mobile_money_provider: values.mobile_money_provider || null,
          mobile_money_number: values.mobile_money_number || null,
          mobile_money_name: values.mobile_money_name || null,
        };

      const { error } = await signUpWithEmail(
        values.email,
        values.password,
        values.displayName,
        vendorDetails
      );

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Sign Up Successful",
          description: "Please check your email to confirm your registration. Redirecting to login...",
          duration: 2000,
        });
        form.reset();
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
            Start building your <span className="text-primary">e-commerce empire</span> today.
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Manage multiple stores from one dashboard</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Real-time analytics and reporting</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg text-white/90 font-medium">Seamless inventory management</p>
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
            <h1 className="text-4xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground text-lg">
              Enter your details below to create your account and get started.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chanda Mulenga" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="chanda@example.com" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Password</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isLoading} className="h-12 pr-10 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-lg font-semibold text-primary/80">
                        {paymentMethod === "bank" ? <Landmark className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                        <h3>Payment Details</h3>
                      </div>
                      <div className="flex bg-muted/50 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("bank")}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${paymentMethod === "bank" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Bank
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("mobile_money")}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${paymentMethod === "mobile_money" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Mobile Money
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "bank" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <FormField
                          control={form.control}
                          name="bank_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Zanaco" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_account_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Account Holder Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Chanda Mulenga" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_account_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="1234567890" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_branch_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Branch Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Manda Hill" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <FormField
                          control={form.control}
                          name="mobile_money_provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Provider</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-background/50 border-input/50 focus:ring-primary transition-all duration-300">
                                    <SelectValue placeholder="Select Provider" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                                  <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                                  <SelectItem value="Zamtel Kwacha">Zamtel Kwacha</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mobile_money_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Mobile Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+260..." {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mobile_money_name"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-foreground/80">Registered Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Chanda Mulenga" {...field} disabled={isLoading} className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary transition-all duration-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
              Sign In
            </Link>
          </div>

          <p className="px-8 text-center text-xs text-muted-foreground/80">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
