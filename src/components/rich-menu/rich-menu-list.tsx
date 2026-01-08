"use client";

import { useTransition } from "react";
import { RichMenuResponse } from "@line/bot-sdk";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, Star } from "lucide-react";
import { deleteRichMenu, setDefaultRichMenu } from "@/actions/rich-menu.actions";
import { toast } from "@/hooks/use-toast";

interface RichMenuListProps {
    richMenus: RichMenuResponse[];
    defaultRichMenuId: string | null;
}

export function RichMenuList({ richMenus, defaultRichMenuId }: RichMenuListProps) {
    const [isPending, startTransition] = useTransition();

    const handleSetDefault = (id: string) => {
        startTransition(async () => {
            const result = await setDefaultRichMenu(id);
            if (result.success) {
                toast({ title: "Updated", description: "Default rich menu set." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;

        startTransition(async () => {
            const result = await deleteRichMenu(id);
            if (result.success) {
                toast({ title: "Deleted", description: "Rich menu deleted." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    if (!richMenus.length) {
        return (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                No Rich Menus found. Create one to get started.
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {richMenus.map((menu) => {
                const isDefault = menu.richMenuId === defaultRichMenuId;
                return (
                    <Card key={menu.richMenuId} className={isDefault ? "border-primary" : ""}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg truncate">{menu.name}</CardTitle>
                                    <CardDescription>{menu.chatBarText}</CardDescription>
                                </div>
                                {isDefault && <Badge>Default</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent className="h-[200px] bg-muted/20 relative flex items-center justify-center overflow-hidden">
                            {/* 
                  Since we don't have the image URL directly from list API (only ID), 
                  we'd typically need to fetch content blob. 
                  BUT, for this admin panel, we might skip previewing the actual image 
                  OR use a proxy if we really needed it. 
                  LINE API doesn't return a public URL for the image in the response object.
                  We'll use a placeholder or icon.
                */}
                            <div className="text-center text-muted-foreground text-sm p-4">
                                <p>ID: {menu.richMenuId}</p>
                                <p className="text-xs mt-2 opacity-50">Image preview not available via API</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-4">
                            <Button
                                variant={isDefault ? "secondary" : "outline"}
                                size="sm"
                                disabled={isPending || isDefault}
                                onClick={() => handleSetDefault(menu.richMenuId)}
                            >
                                {isDefault ? <Check className="w-4 h-4 mr-1" /> : <Star className="w-4 h-4 mr-1" />}
                                {isDefault ? "Active" : "Set Default"}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                disabled={isPending}
                                onClick={() => handleDelete(menu.richMenuId)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
