"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Info, X, Plus, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RichMenuSelector } from "./rich-menu-selector";
import { RichMenuResponse } from "@line/bot-sdk";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { addTag, removeTag } from "@/actions/tag.actions";
import { useToast } from "@/hooks/use-toast";

interface CustomerProfileSheetProps {
    customer: {
        id: string; // Added id for tagging actions
        displayName: string | null;
        pictureUrl: string | null;
        statusMessage: string | null;
        lineUserId: string;
        isFollowing: boolean;
        createdAt: Date;
        lastActiveAt: Date | null;
        tags: string[]; // Added tags
    };
    currentRichMenuId: string | null;
    availableRichMenus: RichMenuResponse[];
}

export function CustomerProfileSheet({
    customer,
    currentRichMenuId,
    availableRichMenus
}: CustomerProfileSheetProps) {
    const [newTag, setNewTag] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAddTag = () => {
        if (!newTag.trim()) return;

        startTransition(async () => {
            const result = await addTag(customer.id, newTag);
            if (result.success) {
                setNewTag("");
                toast({ title: "Tag added" });
            } else {
                toast({ title: "Failed to add tag", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleRemoveTag = (tag: string) => {
        startTransition(async () => {
            const result = await removeTag(customer.id, tag);
            if (!result.success) {
                toast({ title: "Failed to remove tag", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Customer Profile</SheetTitle>
                    <SheetDescription>
                        Details and settings for this customer.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col items-center gap-4 py-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={customer.pictureUrl || ""} />
                        <AvatarFallback>{customer.displayName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">{customer.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{customer.statusMessage}</p>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-medium mb-2">Customer Info</h4>
                        <div className="text-sm space-y-1 text-muted-foreground">
                            <p>Status: <span className={customer.isFollowing ? "text-green-600" : "text-red-600"}>{customer.isFollowing ? "Following" : "Unfollowed"}</span></p>
                            <p>Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
                            <p>Last Active: {customer.lastActiveAt ? new Date(customer.lastActiveAt).toLocaleString() : "-"}</p>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4" /> Tags
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {customer.tags && customer.tags.length > 0 ? (
                                customer.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        {tag}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-500"
                                            onClick={() => handleRemoveTag(tag)}
                                        />
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">No tags assigned</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add tag..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                className="h-8 text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={handleAddTag} disabled={isPending} className="h-8">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="text-sm font-medium mb-3">Settings</h4>
                        <RichMenuSelector
                            userId={customer.lineUserId}
                            currentRichMenuId={currentRichMenuId}
                            availableRichMenus={availableRichMenus}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
