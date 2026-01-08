"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateRichMenuDialog } from "@/components/rich-menu/create-rich-menu-dialog";
import { RichMenuList } from "@/components/rich-menu/rich-menu-list";

interface RichMenuPageClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    richMenus: any[];
    defaultRichMenuId: string | null;
}

export default function RichMenuPageClient({ richMenus, defaultRichMenuId }: RichMenuPageClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Rich Menu</h2>
                    <p className="text-muted-foreground">Manage your LINE Official Account rich menus.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Rich Menu
                    </Button>
                </div>
            </div>

            <RichMenuList richMenus={richMenus} defaultRichMenuId={defaultRichMenuId} />

            <CreateRichMenuDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
