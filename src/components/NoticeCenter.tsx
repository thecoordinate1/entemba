"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Zap, MapPin, CreditCard, ChevronRight, Store, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StoreFromSupabase } from "@/services/storeService";
import { getCurrentVendorProfile, VendorProfile } from "@/services/userService";

export interface NoticeCenterProps {
    store: StoreFromSupabase | null;
    userId: string;
}

export function NoticeCenter({ store, userId }: NoticeCenterProps) {
    const [vendorProfile, setVendorProfile] = React.useState<VendorProfile | null>(null);

    React.useEffect(() => {
        let isMounted = true;
        if (userId) {
            getCurrentVendorProfile(userId).then(({ profile }) => {
                if (isMounted) setVendorProfile(profile);
            });
        }
        return () => { isMounted = false; };
    }, [userId]);

    if (!store && !vendorProfile) return null;

    const notices = [];

    // 1. Store Location Check
    if (store) {
        const hasLocation = store.location && store.location.trim().length > 0;
        const hasCoordinates = store.pickup_latitude && store.pickup_longitude;

        if (!hasLocation || !hasCoordinates) {
            notices.push({
                id: "missing-store-location",
                title: "Store Location Incomplete",
                description: "Your store is missing location details. Pin your store on the map to help customers find you.",
                icon: MapPin,
                actionLabel: "Update Location",
                actionLink: `/settings?storeId=${store.id}&tab=store`,
                variant: "warning",
            });
        }

        // 2. Missing Logo Check
        if (!store.logo_url) {
            notices.push({
                id: "missing-store-logo",
                title: "Add Store Logo",
                description: "Your store doesn't have a logo. Upload one to build your brand identity and trust.",
                icon: Store,
                actionLabel: "Upload Logo",
                actionLink: `/settings?storeId=${store.id}&tab=store`,
                variant: "info",
            });
        }

        // 3. Short/Missing Description
        if (!store.description || store.description.length < 10) {
            notices.push({
                id: "missing-store-desc",
                title: " enhance Store Description",
                description: "A good description helps customers understand what you sell. Add more details about your business.",
                icon: FileText,
                actionLabel: "Edit Details",
                actionLink: `/settings?storeId=${store.id}&tab=store`,
                variant: "info",
            });
        }
    }

    // 4. Payment/Payout Method Check
    if (vendorProfile) {
        const hasBank = vendorProfile.bank_name && vendorProfile.bank_account_number;
        const hasMomo = vendorProfile.mobile_money_provider && vendorProfile.mobile_money_number;

        if (!hasBank && !hasMomo) {
            notices.push({
                id: "missing-payout-method",
                title: "Payout Method Missing",
                description: "You haven't set up a payout method yet. Add a bank account or mobile money to receive your earnings.",
                icon: CreditCard,
                actionLabel: "Setup Payouts",
                actionLink: `/settings?tab=billing${store ? `&storeId=${store.id}` : ""}`,
                variant: "destructive",
            });
        }
    }

    if (notices.length === 0) return null;

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                        <Zap className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">Action Center</h3>
                </div>
                <Badge variant="secondary" className="px-2.5 py-0.5 h-6 text-xs font-medium">
                    {notices.length} Pending
                </Badge>
            </div>

            <div className="grid gap-3">
                {notices.map((notice) => (
                    <Alert
                        key={notice.id}
                        className={`
                            border-l-4 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md
                            ${notice.variant === 'warning'
                                ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10'
                                : notice.variant === 'destructive'
                                    ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10'
                                    : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10' // info variant
                            }
                        `}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`
                                p-2.5 rounded-xl shrink-0 shadow-sm
                                ${notice.variant === 'warning'
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                                    : notice.variant === 'destructive'
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                }
                            `}>
                                <notice.icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 space-y-1.5 py-0.5">
                                <AlertTitle className={`
                                    text-base font-semibold tracking-tight
                                    ${notice.variant === 'warning'
                                        ? 'text-amber-900 dark:text-amber-100'
                                        : notice.variant === 'destructive'
                                            ? 'text-red-900 dark:text-red-100'
                                            : 'text-blue-900 dark:text-blue-100'
                                    }
                                `}>
                                    {notice.title}
                                </AlertTitle>
                                <AlertDescription className={`
                                    text-sm leading-relaxed
                                    ${notice.variant === 'warning'
                                        ? 'text-amber-800/80 dark:text-amber-200/80'
                                        : notice.variant === 'destructive'
                                            ? 'text-red-800/80 dark:text-red-200/80'
                                            : 'text-blue-800/80 dark:text-blue-200/80'
                                    }
                                `}>
                                    {notice.description}
                                </AlertDescription>

                                <div className="pt-3">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="ghost"
                                        className={`
                                            h-8 text-xs font-semibold px-0 hover:bg-transparent p-0
                                            ${notice.variant === 'warning'
                                                ? 'text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300'
                                                : notice.variant === 'destructive'
                                                    ? 'text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                                                    : 'text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                                            }
                                        `}
                                    >
                                        <Link href={notice.actionLink} className="flex items-center gap-1 group/btn">
                                            {notice.actionLabel}
                                            <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Decorative background element */}
                        <div className={`
                            absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-5 pointer-events-none
                            ${notice.variant === 'warning'
                                ? 'bg-amber-500'
                                : notice.variant === 'destructive'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                            }
                        `} />
                    </Alert>
                ))}
            </div>
        </div>
    );
}
