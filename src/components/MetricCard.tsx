
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const MetricCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendType,
    ctaLink,
    ctaText,
    isLoading,
    secondaryValue,
    secondaryLabel,
    className
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    description?: string;
    trend?: string;
    trendType?: "positive" | "negative" | "neutral";
    ctaLink?: string;
    ctaText?: string;
    isLoading?: boolean;
    secondaryValue?: string;
    secondaryLabel?: string;
    className?: string;
}) => {
    if (isLoading) {
        return (
            <Card className="h-full border-none shadow-sm bg-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-[120px] mb-2" />
                    <Skeleton className="h-3 w-[150px]" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "overflow-hidden relative group hover:shadow-md transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{title}</CardTitle>
                <div className={cn("p-2 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground")}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative pb-3">
                <div className="flex items-baseline justify-between">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</div>
                    {trend && (
                        <Badge variant={trendType === "negative" ? "destructive" : "secondary"} className={cn("ml-2 font-normal", trendType === "positive" && "text-emerald-600 bg-emerald-500/10 border-emerald-200")}>
                            {trendType === "positive" ? <TrendingUp className="w-3 h-3 mr-1" /> : null}
                            {trend}
                        </Badge>
                    )}
                </div>

                {secondaryValue && (
                    <div className="mt-1 flex items-center text-sm font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">{secondaryValue}</span>
                        <span className="ml-1 text-muted-foreground text-xs">{secondaryLabel}</span>
                    </div>
                )}

                {description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{description}</p>
                )}

                {ctaLink && (
                    <Link href={ctaLink} className="absolute inset-0 z-20" aria-label={ctaText}>
                        <span className="sr-only">{ctaText}</span>
                    </Link>
                )}
            </CardContent>

            {/* Decorative gradient blob */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        </Card>
    );
};
