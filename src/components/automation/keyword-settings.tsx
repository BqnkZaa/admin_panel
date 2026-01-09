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
import { Plus, Trash2, Loader2, X, Edit, MessageSquareText, Zap } from "lucide-react";
import { createKeyword, deleteKeyword, toggleKeywordStatus, updateKeyword } from "@/actions/automation.actions";
import { toast } from "@/hooks/use-toast";


interface KeywordSettingsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keywords: any[];
}

interface QuickReplyItem {
    label: string;
    type: 'message' | 'uri' | 'postback';
    value: string;
}

export function KeywordSettings({ keywords }: KeywordSettingsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Edit Mode State
    const [editingId, setEditingId] = useState<string | null>(null);

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
        setEditingId(null);
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

    // Populate form for editing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (k: any) => {
        setEditingId(k.id);
        setKeyword(k.keyword);
        setMatchType(k.matchType);
        setDescription(k.description || "");
        setReplyType(k.replyType);

        if (k.replyType === "TEXT") {
            setReplyContent(typeof k.replyContent === 'string' ? k.replyContent : (k.replyContent?.text || ""));
        } else {
            setReplyContent(JSON.stringify(k.replyContent, null, 2));
            setAltText(k.altText || "");
        }

        setSenderName(k.senderName || "");
        setSenderIconUrl(k.senderIconUrl || "");
        setTagsToAdd(k.tagsToAdd ? k.tagsToAdd.join(", ") : "");

        // Parse Quick Replies
        if (k.quickReplies && k.quickReplies.items) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = k.quickReplies.items.map((item: any) => {
                const action = item.action;
                return {
                    label: action.label,
                    type: action.type,
                    value: action.type === 'uri' ? action.uri : (action.type === 'postback' ? action.data : action.text)
                };
            });
            setQuickReplies(items);
        } else {
            setQuickReplies([]);
        }

        setIsDialogOpen(true);
    };

    const handleSave = () => {
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

        const payload = {
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
        };

        startTransition(async () => {
            let result;
            if (editingId) {
                result = await updateKeyword(editingId, payload);
            } else {
                result = await createKeyword(payload);
            }

            if (result.success) {
                toast({ title: editingId ? "บันทึกการแก้ไขแล้ว" : "สร้างกฎเรียบร้อยแล้ว" });
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Keyword Auto-Reply
                    </h3>
                    <p className="text-slate-500 text-sm">ตอบกลับลูกค้าอัตโนมัติด้วยคีย์เวิร์ด</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-all hover:-translate-y-0.5 rounded-lg">
                            <Plus className="mr-2 h-4 w-4" /> เพิ่มกฎใหม่
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-blue-700">{editingId ? "แก้ไขกฎการตอบกลับ" : "สร้างกฎการตอบกลับใหม่"}</DialogTitle>
                            <DialogDescription>
                                ตั้งค่าคีย์เวิร์ด เงื่อนไข และข้อความตอบกลับ
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="trigger" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-blue-50">
                                <TabsTrigger value="trigger" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">1. เงื่อนไข</TabsTrigger>
                                <TabsTrigger value="response" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">2. การตอบกลับ</TabsTrigger>
                                <TabsTrigger value="actions" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">3. Action และ Tag</TabsTrigger>
                            </TabsList>

                            {/* === TAB 1: TRIGGER === */}
                            <TabsContent value="trigger" className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>คีย์เวิร์ด (Keyword)</Label>
                                        <Input
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder={matchType === "REGEX" ? "^สวัสดี.*" : "เช่น ราคา, โปรโมชั่น"}
                                            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-muted-foreground">คำที่ลูกค้าพิมพ์มาเพื่อเรียกใช้งานกฎนี้</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>รูปแบบการจับคู่</Label>
                                        <Select value={matchType} onValueChange={(val: "EXACT" | "REGEX") => setMatchType(val)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EXACT">ตรงกันทุกตัวอักษร (Exact Match)</SelectItem>
                                                <SelectItem value="REGEX">Regular Expression</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>คำอธิบาย (Description)</Label>
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
                                <div className="space-y-4 border border-blue-100 bg-blue-50/30 p-4 rounded-xl">
                                    <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                                        <MessageSquareText className="h-4 w-4" /> เนื้อหาข้อความ
                                    </h4>
                                    <div className="space-y-2">
                                        <Label>ประเภทข้อความ</Label>
                                        <Select value={replyType} onValueChange={(val: "TEXT" | "FLEX") => setReplyType(val)}>
                                            <SelectTrigger className="bg-white">
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
                                                className="bg-white"
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
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Flex JSON Payload</Label>
                                                <Textarea
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    placeholder='{"type": "bubble", "body": { ... }}'
                                                    className="font-mono text-xs bg-white"
                                                    rows={8}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Custom Sender */}
                                <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
                                    <h4 className="font-semibold text-sm text-slate-700">ผู้ส่งแบบกำหนดเอง (Optional)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>ชื่อผู้ส่ง</Label>
                                            <Input
                                                value={senderName}
                                                onChange={(e) => setSenderName(e.target.value)}
                                                placeholder="ระบุเพื่อเปลี่ยนชื่อผู้ส่ง"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ลิงก์รูปไอคอน</Label>
                                            <Input
                                                value={senderIconUrl}
                                                onChange={(e) => setSenderIconUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Replies */}
                                <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm text-slate-700">Quick Replies ({quickReplies.length}/13)</h4>
                                    </div>

                                    <div className="flex gap-2 items-end">
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-xs">ป้าย (Label)</Label>
                                            <Input value={newQrLabel} onChange={e => setNewQrLabel(e.target.value)} placeholder="เช่น ได้เลย!" className="bg-white" />
                                        </div>
                                        <div className="space-y-1 w-[120px]">
                                            <Label className="text-xs">ประเภท</Label>
                                            <Select value={newQrType} onValueChange={(val: "message" | "uri" | "postback") => setNewQrType(val)}>
                                                <SelectTrigger className="bg-white">
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
                                            <Input value={newQrValue} onChange={e => setNewQrValue(e.target.value)} placeholder="Action value" className="bg-white" />
                                        </div>
                                        <Button size="icon" onClick={addQuickReply} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /></Button>
                                    </div>

                                    {quickReplies.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {quickReplies.map((qr, i) => (
                                                <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1 bg-white border border-slate-200">
                                                    {qr.label}
                                                    <button onClick={() => removeQuickReply(i)} className="text-slate-400 hover:text-red-500">
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
                                    <Label>เพิ่มแท็กให้ลูกค้า (Auto-tagging)</Label>
                                    <Input
                                        value={tagsToAdd}
                                        onChange={(e) => setTagsToAdd(e.target.value)}
                                        placeholder="เช่น VIP, สนใจสินค้า, โปรโมชั่น (คั่นด้วยจุลภาค)"
                                        className="border-slate-200"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        ระบบจะติดแท็กเหล่านี้ให้กับลูกค้าอัตโนมัติเมื่อพิมพ์คีย์เวิร์ดนี้เข้ามา
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                            <Button onClick={handleSave} disabled={isPending || !keyword} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? "บันทึกการแก้ไข" : "สร้างกฎใหม่"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-100">
                            <TableHead>คีย์เวิร์ด</TableHead>
                            <TableHead>เงื่อนไข</TableHead>
                            <TableHead>คำอธิบาย</TableHead>
                            <TableHead>การปรับ</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {keywords.map((k) => (
                            <TableRow key={k.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                <TableCell className="font-medium text-slate-700">
                                    <div className="text-base font-semibold">{k.keyword}</div>
                                    {k.tagsToAdd && k.tagsToAdd.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {k.tagsToAdd.slice(0, 2).map((t: string) => (
                                                <span key={t} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md font-medium">{t}</span>
                                            ))}
                                            {k.tagsToAdd.length > 2 && <span className="text-[10px] text-muted-foreground flex items-center">+{k.tagsToAdd.length - 2}</span>}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={k.matchType === "REGEX" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-600"}>
                                        {k.matchType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{k.description || "-"}</TableCell>
                                <TableCell className="max-w-[200px] truncate text-xs text-slate-600">
                                    {k.replyType === "TEXT"
                                        ? (typeof k.replyContent === 'string' ? k.replyContent : k.replyContent?.text)
                                        : <span className="flex items-center gap-1 text-slate-500"><Zap className="h-3 w-3" /> Flex Message</span>}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={k.isActive}
                                        onCheckedChange={() => handleToggle(k.id, k.isActive)}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => handleEdit(k)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(k.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {keywords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-10 w-10 text-slate-300"><MessageSquareText className="h-full w-full" /></div>
                                        <p>ไม่พบกฎการตอบกลับ</p>
                                        <p className="text-xs">คลิกปุ่ม &quot;เพิ่มกฎใหม่&quot; เพื่อเริ่มสร้างระบบตอบกลับอัตโนมัติ</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
