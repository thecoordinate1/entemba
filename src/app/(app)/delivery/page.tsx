
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";

export default function DeliveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Truck className="h-7 w-7"/>Delivery Management</h1>
        <Button variant="outline" onClick={() => router.push(`/orders?${searchParams.toString()}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Overview</CardTitle>
          <CardDescription>
            This is the central hub for managing all your deliveries. This feature is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Delivery tracking, route optimization, and driver assignment will be available here soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
