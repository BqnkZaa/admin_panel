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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { createKeyword, deleteKeyword, toggleKeywordStatus } from "@/actions/automation.actions";
import { toast } from "@/hooks/use-toast";

interface KeywordSettingsProps {
    // We roughly know the shape, but to avoid strict type hell with Prisma Json, we can allow 'any' safely here or define a partial type is better.
    // However, the error 'Unexpected any' means we should be specific or disable the rule if we really need it.
    // Let's rely on inferred types or 'Record<string, unknown>'.
    // Or just suppress it cleanly if it's complex.
    // Given the previous code used any[], let's try to be a bit more specific or suppress properly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keywords: any[];
}

interface QuickReplyItem {
    label: string;
    type: 'message' | 'uri' | 'postback';
    value: string; // text for message, link for uri, data for postback
}

export function KeywordSettings({ keywords }: KeywordSettingsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [keyword, setKeyword] = useState("");
    const [matchType, setMatchType] = useState<"EXACT" | "REGEX">("EXACT");
    const [description, setDescription] = useState("");

    const [replyType, setReplyType] = useState<"TEXT" | "FLEX">("TEXT");
    const [replyContent, setReplyContent] = useState("");
    const [altText, setAltText] = useState("");

    const [senderName, setSenderName] = useState("");
    const [senderIconUrl, setSenderIconUrl] = useState("");

    const [tagsToAdd, setTagsToAdd] = useState(""); // Comma separated

    // Quick Replies State
    const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>([]);
    const [newQrLabel, setNewQrLabel] = useState("");
    const [newQrType, setNewQrType] = useState<"message" | "uri" | "postback">("message");
    const [newQrValue, setNewQrValue] = useState("");

    const addQuickReply = () => {
        if (!newQrLabel || !newQrValue) return;
        if (quickReplies.length >= 13) {
            toast({ title: "สร้าง Quick Replies ได้สูงสุด 13 รายการ", variant: "destructive" });
            return;
        }
        setQuickReplies([...quickReplies, { label: newQrLabel, type: newQrType, value: newQrValue }]);
        setNewQrLabel("");
        setNewQrValue("");
    };

    const removeQuickReply = (index: number) => {
        setQuickReplies(quickReplies.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setKeyword("");
        setMatchType("EXACT");
        setDescription("");
        setReplyType("TEXT");
        setReplyContent("");
        setAltText("");
        setSenderName("");
        setSenderIconUrl("");
        setTagsToAdd("");
        setQuickReplies([]);
        setNewQrLabel("");
        setNewQrValue("");
    };

    const handleCreate = () => {
        if (!keyword || !replyContent) {
            toast({ title: "กรุณาระบุ Keyword และข้อความตอบกลับ", variant: "destructive" });
            return;
        }

        let parsedContent = replyContent;
        if (replyType === "FLEX") {
            try {
                parsedContent = JSON.parse(replyContent); // Ensure valid JSON
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                toast({ title: "รูปแบบ JSON ไม่ถูกต้อง", variant: "destructive" });
                return;
            }
        }

        // Format Quick Replies for LINE
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedQr: any[] = quickReplies.map(qr => {
            if (qr.type === 'uri') return { type: 'action', action: { type: 'uri', label: qr.label, uri: qr.value } };
            if (qr.type === 'postback') return { type: 'action', action: { type: 'postback', label: qr.label, data: qr.value } };
            return { type: 'action', action: { type: 'message', label: qr.label, text: qr.value } };
        });

        startTransition(async () => {
            const result = await createKeyword({
                keyword,
                matchType,
                replyType,
                replyContent: replyType === "TEXT" ? { type: "text", text: replyContent } : parsedContent,
                altText: replyType === "FLEX" ? altText : undefined,
                senderName: senderName || undefined,
                senderIconUrl: senderIconUrl || undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                quickReplies: formattedQr.length > 0 ? { items: formattedQr } as any : undefined,
                tagsToAdd: tagsToAdd ? tagsToAdd.split(",").map(t => t.trim()).filter(Boolean) : [],
                description: description || undefined,
                isActive: true,
            });

            if (result.success) {
                toast({ title: "สร้างกฎเรียบร้อยแล้ว" });
                setIsDialogOpen(false);
                resetForm();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("คุณแน่ใจว่าต้องการลบกฎนี้?")) return;
        startTransition(async () => {
            const result = await deleteKeyword(id);
            if (result.success) {
                toast({ title: "ลบกฎเรียบร้อยแล้ว" });
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
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> เพิ่มกฎการตอบกลับ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>สร้างกฎการตอบกลับ</DialogTitle>
                            <DialogDescription>
                                ตั้งค่าคีย์เวิร์ด การตอบกลับ และการกระทำ (Actions)
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="trigger" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="trigger">1. เงื่อนไข (Trigger)</TabsTrigger>
                                <TabsTrigger value="response">2. การตอบกลับ</TabsTrigger>
                                <TabsTrigger value="actions">3. การกระทำ (Actions)</TabsTrigger>
                            </TabsList>

                            {/* === TAB 1: TRIGGER === */}
                            <TabsContent value="trigger" className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>คีย์เวิร์ด หรือ รูปแบบ (Pattern)</Label>
                                        <Input
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder={matchType === "REGEX" ? "^สวัสดี.*" : "เช่น ราคา"}
                                        />
                                        {matchType === "REGEX" && (
                                            <p className="text-xs text-muted-foreground">รองรับ JavaScript RegExp</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ประเภทการจับคู่</Label>
                                        <Select value={matchType} onValueChange={(val: "EXACT" | "REGEX") => setMatchType(val)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EXACT">ตรงกันทุกตัวอักษร (Exact)</SelectItem>
                                                <SelectItem value="REGEX">Regular Expression</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>คำอธิบาย <span className="text-xs text-muted-foreground">(สำหรับแอดมิน)</span></Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="เช่น กฏสำหรับทักทายลูกค้าใหม่"
                                    />
                                </div>
                            </TabsContent>

                            {/* === TAB 2: RESPONSE === */}
                            <TabsContent value="response" className="space-y-6 py-4">
                                {/* Reply Settings */}
                                <div className="space-y-4 border p-4 rounded-md">
                                    <h4 className="font-semibold text-sm">เนื้อหาข้อความ</h4>
                                    <div className="space-y-2">
                                        <Label>ประเภทการตอบกลับ</Label>
                                        <Select value={replyType} onValueChange={(val: "TEXT" | "FLEX") => setReplyType(val)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEXT">ข้อความ (Text)</SelectItem>
                                                <SelectItem value="FLEX">Flex Message (JSON)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {replyType === "TEXT" ? (
                                        <div className="space-y-2">
                                            <Label>ข้อความ</Label>
                                            <Textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="พิมพ์ข้อความที่ต้องการตอบกลับ..."
                                                rows={4}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Alt Text <span className="text-red-500">*</span></Label>
                                                <Input
                                                    value={altText}
                                                    onChange={(e) => setAltText(e.target.value)}
                                                    placeholder="แสดงในรายการแชท"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Flex JSON Payload</Label>
                                                <Textarea
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    placeholder='{"type": "bubble", "body": { ... }}'
                                                    className="font-mono text-xs"
                                                    rows={8}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Custom Sender */}
                                <div className="space-y-4 border p-4 rounded-md">
                                    <h4 className="font-semibold text-sm">ผู้ส่งแบบกำหนดเอง (Optional)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>ชื่อผู้ส่ง</Label>
                                            <Input
                                                value={senderName}
                                                onChange={(e) => setSenderName(e.target.value)}
                                                placeholder="ระบุเพื่อเปลี่ยนชื่อผู้ส่ง"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ลิงก์รูปไอคอน</Label>
                                            <Input
                                                value={senderIconUrl}
                                                onChange={(e) => setSenderIconUrl(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Replies */}
                                <div className="space-y-4 border p-4 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">Quick Replies ({quickReplies.length}/13)</h4>
                                    </div>

                                    <div className="flex gap-2 items-end">
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-xs">ป้าย (Label)</Label>
                                            <Input value={newQrLabel} onChange={e => setNewQrLabel(e.target.value)} placeholder="เช่น ได้เลย!" />
                                        </div>
                                        <div className="space-y-1 w-[120px]">
                                            <Label className="text-xs">ประเภท</Label>
                                            <Select value={newQrType} onValueChange={(val: "message" | "uri" | "postback") => setNewQrType(val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="message">ข้อความ (Message)</SelectItem>
                                                    <SelectItem value="uri">ลิงก์ (Link)</SelectItem>
                                                    <SelectItem value="postback">Postback</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-xs">ค่า (Text/URL/Data)</Label>
                                            <Input value={newQrValue} onChange={e => setNewQrValue(e.target.value)} placeholder="Action value" />
                                        </div>
                                        <Button size="icon" onClick={addQuickReply}><Plus className="h-4 w-4" /></Button>
                                    </div>

                                    {quickReplies.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {quickReplies.map((qr, i) => (
                                                <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1">
                                                    {qr.label}
                                                    <button onClick={() => removeQuickReply(i)} className="text-muted-foreground hover:text-red-500">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* === TAB 3: ACTIONS === */}
                            <TabsContent value="actions" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>เพิ่มแท็กให้ลูกค้า</Label>
                                    <Input
                                        value={tagsToAdd}
                                        onChange={(e) => setTagsToAdd(e.target.value)}
                                        placeholder="เช่น VIP, สนใจสินค้า (คั่นด้วยจุลภาค)"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        แท็กเหล่านี้จะถูกเพิ่มให้อัตโนมัติเมื่อลูกค้าพิมพ์ตรงตามเงื่อนไข
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                            <Button onClick={handleCreate} disabled={isPending || !keyword}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                สร้างกฎ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>คีย์เวิร์ด</TableHead>
                            <TableHead>ประเภท</TableHead>
                            <TableHead>คำอธิบาย</TableHead>
                            <TableHead>ตอบกลับ</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {keywords.map((k) => (
                            <TableRow key={k.id}>
                                <TableCell className="font-medium">
                                    <div>{k.keyword}</div>
                                    {k.tagsToAdd && k.tagsToAdd.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {k.tagsToAdd.slice(0, 2).map((t: string) => (
                                                <span key={t} className="text-[10px] bg-slate-100 px-1 rounded">{t}</span>
                                            ))}
                                            {k.tagsToAdd.length > 2 && <span className="text-[10px] text-muted-foreground">+{k.tagsToAdd.length - 2}</span>}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell><Badge variant="outline">{k.matchType}</Badge></TableCell>
                                <TableCell className="text-xs text-muted-foreground">{k.description || "-"}</TableCell>
                                <TableCell className="max-w-[200px] truncate text-xs">
                                    {k.replyType === "TEXT"
                                        ? (typeof k.replyContent === 'string' ? k.replyContent : k.replyContent?.text)
                                        : "[Flex Message]"}
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
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    ไม่พบกฎการตอบกลับ คลิกปุ่ม &quot;เพิ่มกฎการตอบกลับ&quot; เพื่อเริ่มใช้งาน
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
