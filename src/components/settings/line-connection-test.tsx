"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Wifi } from "lucide-react";
import { testLineConnection } from "@/actions/settings.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LineConnectionTest() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; bot?: { userId: string; basicId: string; displayName: string; pictureUrl?: string }; error?: string } | null>(null);

    const handleTest = () => {
        setResult(null);
        startTransition(async () => {
            const res = await testLineConnection();
            setResult(res);
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    คลิกเพื่อตรวจสอบ Channel Access Token และดึงข้อมูล Bot
                </p>
                <Button onClick={handleTest} disabled={isPending} size="sm">
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
                    ทดสอบการเชื่อมต่อ
                </Button>
            </div>

            {result?.success && result.bot && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={result.bot.pictureUrl} />
                        <AvatarFallback>BOT</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h4 className="font-semibold text-green-900">{result.bot.displayName}</h4>
                        <p className="text-xs text-green-700">Basic ID: {result.bot.basicId}</p>
                        <p className="text-xs text-green-700">User ID: {result.bot.userId.substring(0, 10)}...</p>
                    </div>
                    <CheckCircle className="text-green-600 w-5 h-5" />
                </div>
            )}

            {result?.success === false && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                    <AlertTitle>การเชื่อมต่อล้มเหลว</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
