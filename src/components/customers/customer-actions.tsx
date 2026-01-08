"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, MessageSquare, Shield, ShieldAlert, Tag } from "lucide-react";
import Link from "next/link";
import { toggleBlockStatus, addTag } from "@/actions/customer.actions";
import { useToast } from "@/hooks/use-toast";

interface CustomerActionsProps {
    customer: {
        id: string;
        isBlocked: boolean;
    };
}

export function CustomerActions({ customer }: CustomerActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [newTag, setNewTag] = useState("");
    const { toast } = useToast();

    const handleToggleBlock = () => {
        startTransition(async () => {
            const res = await toggleBlockStatus(customer.id);
            if (res.success) {
                toast({
                    title: res.isBlocked ? "บล็อกลูกค้าแล้ว" : "ปลดบล็อกลูกค้าแล้ว",
                    variant: res.isBlocked ? "destructive" : "default"
                });
            } else {
                toast({ title: "เกิดข้อผิดพลาด", description: res.error, variant: "destructive" });
            }
        });
    };

    const handleAddTag = () => {
        if (!newTag.trim()) return;

        startTransition(async () => {
            const res = await addTag(customer.id, newTag);
            if (res.success) {
                toast({ title: "เพิ่มแท็กเรียบร้อย" });
                setIsTagDialogOpen(false);
                setNewTag("");
            } else {
                toast({ title: "เกิดข้อผิดพลาด", description: res.error, variant: "destructive" });
            }
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/chat/${customer.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" /> ดูแชท
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsTagDialogOpen(true)}>
                        <Tag className="mr-2 h-4 w-4" /> เพิ่มแท็กลูกค้า
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleToggleBlock} disabled={isPending} className={customer.isBlocked ? "text-green-600" : "text-red-600"}>
                        {customer.isBlocked ? (
                            <>
                                <Shield className="mr-2 h-4 w-4" /> ปลดบล็อก
                            </>
                        ) : (
                            <>
                                <ShieldAlert className="mr-2 h-4 w-4" /> บล็อก
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>เพิ่มแท็กลูกค้า</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>ชื่อแท็ก</Label>
                            <Input
                                placeholder="เช่น VIP, ลูกค้าประจำ..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleAddTag} disabled={isPending || !newTag.trim()}>
                            {isPending ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
