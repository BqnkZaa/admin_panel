"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageSquare, Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { toggleBlockStatus } from "@/actions/customer.actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

interface CustomerActionsProps {
    customer: {
        id: string;
        isBlocked: boolean;
    };
}

export function CustomerActions({ customer }: CustomerActionsProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggleBlock = () => {
        startTransition(async () => {
            const res = await toggleBlockStatus(customer.id);
            if (res.success) {
                toast({
                    title: res.isBlocked ? "Customer Blocked" : "Customer Unblocked",
                    variant: res.isBlocked ? "destructive" : "default"
                });
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/chat/${customer.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" /> View Chat
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleBlock} disabled={isPending} className={customer.isBlocked ? "text-green-600" : "text-red-600"}>
                    {customer.isBlocked ? (
                        <>
                            <Shield className="mr-2 h-4 w-4" /> Unblock User
                        </>
                    ) : (
                        <>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Block User
                        </>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
