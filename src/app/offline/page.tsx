import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
    title: "Offline - Entemba",
};

export default function OfflinePage() {
    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
                <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">You are offline</h1>
            <p className="mb-6 max-w-md text-muted-foreground">
                It seems you have lost your internet connection. Some features may not be unavailable until you reconnect.
            </p>
            <Button asChild>
                <Link href="/dashboard">Try Reloading</Link>
            </Button>
        </div>
    );
}
