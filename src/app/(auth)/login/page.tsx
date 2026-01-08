"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <Card className="shadow-2xl border-0">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                    <span className="text-primary-foreground font-bold text-xl">L</span>
                </div>
                <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
                <CardDescription>LINE OA Admin Panel</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={dispatch} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            อีเมล
                        </label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="admin@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                            รหัสผ่าน
                        </label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>จดจำฉัน</span>
                        </label>
                        <Link href="#" className="text-primary hover:underline">
                            ลืมรหัสผ่าน?
                        </Link>
                    </div>
                    <LoginButton />
                </form>
            </CardContent>
        </Card>
    );
}
