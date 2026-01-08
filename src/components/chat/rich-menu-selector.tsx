"use client";

import { useTransition } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { linkRichMenuToUser, unlinkRichMenuFromUser } from "@/actions/rich-menu.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RichMenuResponse } from "@line/bot-sdk";

interface RichMenuSelectorProps {
    userId: string;
    currentRichMenuId: string | null;
    availableRichMenus: RichMenuResponse[];
}

export function RichMenuSelector({
    userId,
    currentRichMenuId,
    availableRichMenus,
    variant = "card"
}: RichMenuSelectorProps & { variant?: "card" | "minimal" }) {
    const [isPending, startTransition] = useTransition();

    const handleValueChange = (value: string) => {
        startTransition(async () => {
            let result;
            if (value === "none") {
                result = await unlinkRichMenuFromUser(userId);
            } else {
                result = await linkRichMenuToUser(userId, value);
            }

            if (result.success) {
                toast({ title: "Updated", description: "User's Rich Menu updated." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const content = (
        <div className="flex items-center gap-2">
            <Select
                disabled={isPending}
                onValueChange={handleValueChange}
                defaultValue={currentRichMenuId || "none"}
            >
                <SelectTrigger className={variant === "minimal" ? "w-[180px]" : "w-full"}>
                    <SelectValue placeholder="Inherit Default" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Inherit Default (None Linked)</SelectItem>
                    {availableRichMenus.map((menu) => (
                        <SelectItem key={menu.richMenuId} value={menu.richMenuId}>
                            {menu.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
    );

    if (variant === "minimal") {
        return content;
    }

    return (
        <div className="space-y-2 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <Label className="text-sm font-medium">Rich Menu Override</Label>
            {content}
        </div>
    );
}
