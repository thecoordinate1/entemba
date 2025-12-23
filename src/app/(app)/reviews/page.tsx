"use client";

import * as React from "react";
import { Star, MessageSquare, ThumbsUp, ShoppingBag, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { getStoreReviews, replyToReview, type Review } from "@/services/reviewService";
import { getStoresByUserId } from "@/services/storeService";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

export default function ReviewsPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const storeIdFromUrl = searchParams.get('storeId');
    const supabase = createClient();

    const [isLoading, setIsLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [storeId, setStoreId] = React.useState<string | null>(null);

    // Reply State
    const [replyText, setReplyText] = React.useState<{ [key: string]: string }>({});
    const [isReplying, setIsReplying] = React.useState<{ [key: string]: boolean }>({});

    React.useEffect(() => {
        async function init() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let targetStoreId = storeIdFromUrl;

            if (!targetStoreId) {
                const { data: stores } = await getStoresByUserId(user.id);
                if (stores && stores.length > 0) targetStoreId = stores[0].id;
            }

            setStoreId(targetStoreId);

            if (targetStoreId) {
                const { data, error } = await getStoreReviews(targetStoreId);
                if (data) setReviews(data);
                else console.error(error);
            }
            setIsLoading(false);
        }
        init();
    }, [storeIdFromUrl, supabase]);

    const handleReplySubmit = async (reviewId: string) => {
        const text = replyText[reviewId];
        if (!text) return;

        setIsReplying({ ...isReplying, [reviewId]: true });
        const { error } = await replyToReview(reviewId, text);
        setIsReplying({ ...isReplying, [reviewId]: false });

        if (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } else {
            setReviews(reviews.map(r => r.id === reviewId ? { ...r, vendor_reply: text } : r));
            toast({ title: "Reply Sent", description: "Your response is now visible to the customer." });
        }
    };

    // Metrics
    const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
    const fiveStars = reviews.filter(r => r.rating === 5).length;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
                <p className="text-muted-foreground mt-1">Listen to your customers and build trust.</p>
            </div>

            {/* Metrics */}
            <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Average Rating"
                    value={avgRating}
                    icon={Star}
                    description={`Based on ${reviews.length} reviews`}
                />
                <MetricCard
                    title="5-Star Reviews"
                    value={fiveStars.toString()}
                    icon={ThumbsUp}
                    description="Happy customers"
                />
                <MetricCard
                    title="Total Reviews"
                    value={reviews.length.toString()}
                    icon={MessageSquare}
                    description="Lifetime feedback"
                />
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <Card className="border-dashed py-12 text-center text-muted-foreground">
                        <CardContent className="flex flex-col items-center gap-3">
                            <MessageSquare className="h-10 w-10 opacity-20" />
                            <p>No reviews yet. Keep selling to get feedback!</p>
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map(review => (
                        <Card key={review.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/10 pb-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarFallback>{review.customer_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-semibold">{review.customer_name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {review.is_verified_purchase && <Badge variant="secondary" className="h-5 text-[10px] px-1.5 gap-0.5"><ShoppingBag className="h-3 w-3" /> Verified</Badge>}
                                                <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/30"}`} />
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 grid gap-4">
                                {review.products && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded-md w-fit">
                                        <ShoppingBag className="h-3 w-3" /> Product: <span className="font-medium text-foreground">{review.products.name}</span>
                                    </div>
                                )}

                                <p className="text-sm leading-relaxed">{review.comment || <span className="italic text-muted-foreground">No written review</span>}</p>

                                {/* Reply Section */}
                                <div className="ml-0 md:ml-8 border-l-2 pl-4 space-y-3">
                                    {review.vendor_reply ? (
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-r-lg">
                                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><CornerDownRight className="h-3 w-3" /> Your Reply</div>
                                            <p className="text-sm text-muted-foreground">{review.vendor_reply}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Textarea
                                                placeholder="Write a public reply..."
                                                className="min-h-[60px] text-sm resize-none"
                                                value={replyText[review.id] || ""}
                                                onChange={e => setReplyText({ ...replyText, [review.id]: e.target.value })}
                                            />
                                            <div className="flex justify-end">
                                                <Button size="sm" onClick={() => handleReplySubmit(review.id)} disabled={isReplying[review.id] || !replyText[review.id]}>
                                                    {isReplying[review.id] ? "Posting..." : "Post Reply"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
