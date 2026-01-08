"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveWelcomeMessage } from "@/actions/automation.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WelcomeSettingsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: any | null;
}

export function WelcomeSettings({ initialData }: WelcomeSettingsProps) {
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [content, setContent] = useState(
        initialData?.content?.text ?? "ยินดีต้อนรับสู่ LINE OA ของเรา!"
    );
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveWelcomeMessage(content, isActive);
            if (result.success) {
                toast({ title: "Settings saved", description: "Welcome message updated." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Welcome Message</CardTitle>
                        <CardDescription>
                            ข้อความที่จะส่งหาลูกค้าอัตโนมัติเมื่อกดติดตาม (Follow)
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="welcome-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="welcome-active">{isActive ? "On" : "Off"}</Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={!isActive}
                        className="min-h-[150px]"
                        placeholder="พิมพ์ข้อความต้อนรับ..."
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isPending || !isActive}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    );
}
