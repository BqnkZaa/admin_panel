"use client";

import { useState, useTransition } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createKeyword, deleteKeyword, toggleKeywordStatus } from "@/actions/automation.actions";
import { toast } from "@/hooks/use-toast";

interface KeywordSettingsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keywords: any[];
}

export function KeywordSettings({ keywords }: KeywordSettingsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newKeyword, setNewKeyword] = useState("");
    const [newReply, setNewReply] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleCreate = () => {
        if (!newKeyword || !newReply) return;

        startTransition(async () => {
            const result = await createKeyword({
                keyword: newKeyword,
                replyContent: newReply,
                matchType: "EXACT", // Defaulting to EXACT for simplicity in UI
                isActive: true,
            });

            if (result.success) {
                toast({ title: "Keyword created" });
                setIsDialogOpen(false);
                setNewKeyword("");
                setNewReply("");
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteKeyword(id);
            if (result.success) {
                toast({ title: "Keyword deleted" });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleToggle = (id: string, currentStatus: boolean) => {
        startTransition(async () => {
            await toggleKeywordStatus(id, !currentStatus);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Keyword Rule
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Auto-Reply Rule</DialogTitle>
                            <DialogDescription>
                                When a user sends this keyword, the bot will reply automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Keyword (Precise Match)</Label>
                                <Input
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="e.g. ราคา"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reply Message</Label>
                                <Textarea
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                    placeholder="Reply content..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isPending || !newKeyword || !newReply}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Rule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead>Match Type</TableHead>
                            <TableHead>Reply</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {keywords.map((k) => (
                            <TableRow key={k.id}>
                                <TableCell className="font-medium">{k.keyword}</TableCell>
                                <TableCell><Badge variant="outline">{k.matchType}</Badge></TableCell>
                                <TableCell className="max-w-[300px] truncate">
                                    {k.replyContent?.text}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={k.isActive}
                                        onCheckedChange={() => handleToggle(k.id, k.isActive)}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(k.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {keywords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No rules found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
