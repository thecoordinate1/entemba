"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck } from "lucide-react"

interface VerificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onVerify: (code: string) => Promise<void>
    isVerifying: boolean
}

export function VerificationDialog({ open, onOpenChange, onVerify, isVerifying }: VerificationDialogProps) {
    const [code, setCode] = React.useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onVerify(code)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        Secure Delivery Verification
                    </DialogTitle>
                    <DialogDescription>
                        Ask the customer for the 6-digit verification code sent to their app/email to complete this delivery.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid w-full items-center gap-2">
                        <Label htmlFor="code" className="text-left">Verification Code</Label>
                        <Input
                            id="code"
                            placeholder="e.g. 123456"
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={isVerifying}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isVerifying}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!code || code.length < 4 || isVerifying}>
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Complete
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
