"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { sendBroadcast, calculateRecipientCount } from "@/actions/broadcast.actions";
import { getRichMenus } from "@/actions/rich-menu.actions";
import { getAllUniqueTags } from "@/actions/tag.actions";
import { Loader2, Send, CheckCircle, AlertCircle, Code, Calendar as CalendarIcon, Clock, Users, Tag, Image as ImageIcon, Database, Hash, Layers, Users2, UserPlus, User, Sparkles } from "lucide-react";
import { ProductPickerDialog } from "@/components/broadcast/product-picker-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BroadcastTarget } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export default function BroadcastForm() {
    // Core State
    const [broadcastName, setBroadcastName] = useState("");
    const [messageType, setMessageType] = useState("text");

    // Message Content State
    const [textMessage, setTextMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [flexJson, setFlexJson] = useState("");
    const [altText, setAltText] = useState("ท่านได้รับข้อความใหม่");
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Targeting State
    const [targetType, setTargetType] = useState<BroadcastTarget>("ALL");
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [richMenus, setRichMenus] = useState<{ richMenuId: string, name: string, aliasId: string }[]>([]);
    const [selectedRichMenuAliasId, setSelectedRichMenuAliasId] = useState("");
    const [specificUserIds, setSpecificUserIds] = useState("");

    // Recipient Count State
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [isCounting, setIsCounting] = useState(false);

    // Scheduling State
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
    const [scheduledTime, setScheduledTime] = useState("09:00");

    // Form Submission State
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // --- Load Initial Data ---
    useEffect(() => {
        // Fetch Rich Menus
        getRichMenus().then(menus => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRichMenus(menus.map((m: any) => ({
                richMenuId: m.richMenuId,
                name: m.name,
                aliasId: m.richMenuId
            })));
        });

        // Fetch Tags
        getAllUniqueTags().then(result => {
            if (result.success) setAvailableTags(result.tags);
        });
    }, []);

    // --- Recipient Counting Effect ---
    useEffect(() => {
        const fetchCount = async () => {
            setIsCounting(true);
            let targetIds: string[] = [];

            if (targetType === "TAG") {
                targetIds = selectedTags;
            } else if (targetType === "RICH_MENU") {
                targetIds = selectedRichMenuAliasId ? [selectedRichMenuAliasId] : [];
            } else if (targetType === "SPECIFIC_USERS") {
                targetIds = specificUserIds.split(",").map(id => id.trim()).filter(id => id);
            } else if (targetType === "LIMIT" || targetType === "SEGMENT" || targetType === "SINGLE") {
                targetIds = [specificUserIds];
            } else if (targetType === "ALL_FRIENDS") {
                setRecipientCount(null);
                setIsCounting(false);
                return;
            }

            if (targetType === "TAG" && targetIds.length === 0) {
                setRecipientCount(0);
                setIsCounting(false);
                return;
            }
            if (targetType === "RICH_MENU" && targetIds.length === 0) {
                setRecipientCount(0);
                setIsCounting(false);
                return;
            }
            if ((targetType === "LIMIT" || targetType === "SEGMENT" || targetType === "SINGLE") && !specificUserIds) {
                setRecipientCount(0);
                setIsCounting(false);
                return;
            }

            const result = await calculateRecipientCount(targetType, targetIds);
            if (result.success) {
                setRecipientCount(result.count);
            } else {
                setRecipientCount(null);
            }
            setIsCounting(false);
        };

        const timer = setTimeout(fetchCount, 500);
        return () => clearTimeout(timer);
    }, [targetType, selectedTags, selectedRichMenuAliasId, specificUserIds]);


    // --- Helpers ---
    const handleProductSelect = (json: string) => {
        setFlexJson(json);
        setJsonError(null);
    };

    const validateJson = () => {
        try {
            const parsed = JSON.parse(flexJson);
            setJsonError(null);
            return parsed;
        } catch (e) {
            setJsonError((e as Error).message);
            return null;
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const getMessageContent = () => {
        if (messageType === "text") return { type: "text", text: textMessage };
        if (messageType === "image") return { type: "image", originalContentUrl: imageUrl, previewImageUrl: imageUrl };
        if (messageType === "flex") {
            const parsed = validateJson();
            if (!parsed) return null;
            return { type: "flex", altText: altText, contents: parsed };
        }
        return null;
    };

    // --- Handlers ---
    const handleSend = () => {
        const content = getMessageContent();
        if (!content) return;

        if (!broadcastName.trim()) {
            toast({ title: "กรุณาระบุชื่อการบรอดแคสต์", variant: "destructive" });
            return;
        }

        let scheduledAt: Date | undefined = undefined;
        if (isScheduled && scheduledDate) {
            const [hours, minutes] = scheduledTime.split(":").map(Number);
            scheduledAt = new Date(scheduledDate);
            scheduledAt.setHours(hours, minutes, 0, 0);
        }

        let targetIds: string[] = [];
        if (targetType === "TAG") targetIds = selectedTags;
        else if (targetType === "RICH_MENU") targetIds = selectedRichMenuAliasId ? [selectedRichMenuAliasId] : [];
        else if (targetType === "SPECIFIC_USERS") targetIds = specificUserIds.split(",").map(id => id.trim()).filter(id => id);
        else if (targetType === "LIMIT" || targetType === "SEGMENT" || targetType === "SINGLE") targetIds = [specificUserIds];

        startTransition(async () => {
            const result = await sendBroadcast({
                name: broadcastName,
                messageContent: content,
                targetType: targetType,
                targetIds: targetIds,
                scheduledAt: scheduledAt,
            });

            if (result.success) {
                toast({ title: "สร้างบรอดแคสต์สำเร็จ!" });
                setTextMessage("");
                setImageUrl("");
                setBroadcastName("");
            } else {
                toast({ title: "เกิดข้อผิดพลาด", description: result.error, variant: "destructive" });
            }
        });
    };

    // Validation
    const isContentValid =
        (messageType === "text" && textMessage.trim().length > 0) ||
        (messageType === "image" && imageUrl.trim().length > 0) ||
        (messageType === "flex" && flexJson.length > 0 && !jsonError);

    const isTargetValid =
        targetType === "ALL" ||
        targetType === "ALL_FRIENDS" ||
        (targetType === "TAG" && selectedTags.length > 0) ||
        (targetType === "RICH_MENU" && selectedRichMenuAliasId !== "") ||
        (targetType === "SPECIFIC_USERS" && specificUserIds.trim().length > 0) ||
        (targetType === "LIMIT" && Number(specificUserIds) > 0) ||
        (targetType === "SEGMENT" && specificUserIds !== "") ||
        (targetType === "SINGLE" && specificUserIds.trim().length > 0);

    const isValid = broadcastName.trim().length > 0 && isContentValid && isTargetValid;


    return (
        <Card className="h-full border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-900">ชื่อแคมเปญ</Label>
                        <Input
                            placeholder="ระบุชื่อแคมเปญ (เช่น โปรโมชั่นปีใหม่)"
                            value={broadcastName}
                            onChange={(e) => setBroadcastName(e.target.value)}
                            className="text-base py-5 bg-white border-slate-200 focus-visible:ring-purple-600 rounded-xl"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-6">

                {/* 1. Message Type Selector */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-900">รูปแบบข้อความ</Label>
                    <div className="flex flex-wrap gap-3">
                        <MessageTypeOption
                            active={messageType === "text"}
                            onClick={() => setMessageType("text")}
                            icon={<span className="font-serif font-bold text-lg">A</span>}
                            label="ข้อความ"
                        />
                        <MessageTypeOption
                            active={messageType === "image"}
                            onClick={() => setMessageType("image")}
                            icon={<ImageIcon className="w-5 h-5" />}
                            label="รูปภาพ"
                        />
                        <MessageTypeOption
                            active={messageType === "flex"}
                            onClick={() => setMessageType("flex")}
                            icon={<Code className="w-5 h-5" />}
                            label="Flex Message"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                    {messageType === "text" && (
                        <div className="p-3 space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-slate-700 font-medium">เนื้อหาข้อความ</Label>
                                <div className="text-xs text-purple-600 cursor-pointer flex items-center gap-1 hover:text-purple-700 transition-colors">
                                    <Sparkles className="w-3 h-3" /> ให้ AI ช่วยเขียน
                                </div>
                            </div>
                            <Textarea
                                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                                className="min-h-[200px] text-base resize-none border-0 focus-visible:ring-0 p-3 shadow-none bg-slate-50 rounded-lg"
                                value={textMessage}
                                onChange={(e) => setTextMessage(e.target.value)}
                            />
                            <div className="pt-2 flex justify-between text-xs text-muted-foreground px-1">
                                <span>รองรับ Emoji และข้อความยาวสูงสุด 2,000 ตัวอักษร</span>
                                <span>{textMessage.length}/2000</span>
                            </div>
                        </div>
                    )}

                    {messageType === "image" && (
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>ลิงก์รูปภาพ (URL)</Label>
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="bg-slate-50"
                                />
                                <p className="text-xs text-muted-foreground">แนะนำให้ใช้รูปสี่เหลี่ยมจัตุรัส หรือ 16:9 ขนาดไม่เกิน 10MB</p>
                            </div>
                            {imageUrl && (
                                <div className="flex justify-center bg-slate-100 rounded-lg p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-h-[300px] object-contain rounded shadow-sm"
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {messageType === "flex" && (
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>โค้ด Flex Message (JSON)</Label>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600" onClick={() => {
                                        const parsed = validateJson();
                                        if (parsed) setFlexJson(JSON.stringify(parsed, null, 2));
                                    }}>
                                        จัดรูปแบบ
                                    </Button>
                                    <ProductPickerDialog onProductSelect={handleProductSelect} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">ข้อความแทนรูปภาพ (Alt Text)</Label>
                                <Input
                                    value={altText}
                                    onChange={(e) => setAltText(e.target.value)}
                                    placeholder="ท่านได้รับข้อความใหม่"
                                    className="bg-slate-50"
                                />
                            </div>
                            <Textarea
                                placeholder='{ "type": "bubble", ... }'
                                className="min-h-[200px] font-mono text-xs bg-slate-50 border-slate-200"
                                value={flexJson}
                                onChange={(e) => {
                                    setFlexJson(e.target.value);
                                    setJsonError(null);
                                }}
                            />
                            {jsonError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{jsonError}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Targeting Section */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-900">เลือกกลุ่มเป้าหมาย</Label>

                    <div className="space-y-3">
                        {/* Row 1 */}
                        <div className="flex flex-wrap gap-2">
                            <TargetOption
                                active={targetType === "ALL"}
                                onClick={() => setTargetType("ALL")}
                                icon={<Database className="w-4 h-4" />}
                                label="ลูกค้าทั้งหมด"
                            />
                            <TargetOption
                                active={targetType === "ALL_FRIENDS"}
                                onClick={() => setTargetType("ALL_FRIENDS")}
                                icon={<Users className="w-4 h-4" />}
                                label="เพื่อนทุกคน"
                            />
                            <TargetOption
                                active={targetType === "LIMIT"}
                                onClick={() => setTargetType("LIMIT")}
                                icon={<Hash className="w-4 h-4" />}
                                label="สุ่มตามจำนวน"
                            />
                            <TargetOption
                                active={targetType === "SEGMENT"}
                                onClick={() => setTargetType("SEGMENT")}
                                icon={<Layers className="w-4 h-4" />}
                                label="แบ่งกลุ่ม (Segment)"
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="flex flex-wrap gap-2">
                            <TargetOption
                                active={targetType === "TAG"}
                                onClick={() => setTargetType("TAG")}
                                icon={<Tag className="w-4 h-4" />}
                                label="ติดแท็ก (Tags)"
                            />
                            <TargetOption
                                active={targetType === "RICH_MENU"}
                                onClick={() => setTargetType("RICH_MENU")}
                                icon={<Users2 className="w-4 h-4" />}
                                label="ตาม Rich Menu"
                            />
                            <TargetOption
                                active={targetType === "SPECIFIC_USERS"}
                                onClick={() => setTargetType("SPECIFIC_USERS")}
                                icon={<UserPlus className="w-4 h-4" />}
                                label="ระบุ User ID"
                            />
                            <TargetOption
                                active={targetType === "SINGLE"}
                                onClick={() => setTargetType("SINGLE")}
                                icon={<User className="w-4 h-4" />}
                                label="รายบุคคล"
                            />
                        </div>
                    </div>

                    {/* Target Specific Settings Area */}
                    <div className="custom-target-settings mt-2">
                        {targetType === "TAG" && (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <Label>เลือก Tags ที่ต้องการส่ง</Label>
                                {availableTags.length === 0 ? (
                                    <div className="text-sm text-yellow-600">ไม่พบ Tags ในระบบ</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map(tag => (
                                            <Badge
                                                key={tag}
                                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                                className={cn(
                                                    "cursor-pointer text-sm py-1.5 px-3 transition-colors rounded-lg",
                                                    selectedTags.includes(tag) ? "bg-purple-600 hover:bg-purple-700 border-transparent" : "hover:bg-slate-100"
                                                )}
                                                onClick={() => toggleTag(tag)}
                                            >
                                                {tag} {selectedTags.includes(tag) && <CheckCircle className="ml-1 w-3 h-3 inline" />}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {targetType === "RICH_MENU" && (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <Label>เลือกกลุ่มตาม Rich Menu</Label>
                                <Select value={selectedRichMenuAliasId} onValueChange={setSelectedRichMenuAliasId}>
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue placeholder="เลือกเมนู..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {richMenus.map(m => (
                                            <SelectItem key={m.richMenuId} value={m.aliasId}>
                                                {m.name} ({m.aliasId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {targetType === "SPECIFIC_USERS" && (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <Label>ระบุ Line User IDs (คั่นด้วยคอมม่า)</Label>
                                <Textarea
                                    placeholder="U1234..., U5678..."
                                    value={specificUserIds}
                                    onChange={(e) => setSpecificUserIds(e.target.value)}
                                    className="bg-slate-50 font-mono text-xs"
                                />
                            </div>
                        )}

                        {targetType === "LIMIT" && (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <Label>จำนวนคนที่ต้องการส่ง (คน)</Label>
                                <Input
                                    type="number"
                                    placeholder="เช่น 100"
                                    value={specificUserIds}
                                    onChange={(e) => setSpecificUserIds(e.target.value)}
                                    className="bg-slate-50"
                                    min={1}
                                />
                                <p className="text-xs text-muted-foreground">ระบบจะสุ่มลูกค้าให้ครบตามจำนวนที่ระบุ</p>
                            </div>
                        )}

                        {targetType === "SEGMENT" && (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <Label>เลือกเกณฑ์ (Segment)</Label>
                                <Select value={specificUserIds} onValueChange={setSpecificUserIds}>
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue placeholder="เลือกเงื่อนไข..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE_7_DAYS">ใช้งานใน 7 วันล่าสุด</SelectItem>
                                        <SelectItem value="ACTIVE_30_DAYS">ใช้งานใน 30 วันล่าสุด</SelectItem>
                                        <SelectItem value="NEW_USER_30_DAYS">เป็นเพื่อนใหม่ใน 30 วันล่าสุด</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {targetType === "SINGLE" && (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <Label>ระบุ Line User ID</Label>
                                <Input
                                    placeholder="U1234..."
                                    value={specificUserIds}
                                    onChange={(e) => setSpecificUserIds(e.target.value)}
                                    className="bg-slate-50 font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">สำหรับส่งหาลูกค้าคนเดียวเท่านั้น</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Counter & Action */}
                <div className="space-y-4 pt-4">
                    {/* Info Bar */}
                    <div className="bg-purple-50 text-purple-900 px-4 py-4 rounded-xl flex items-center gap-3 border border-purple-100">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">จำนวนผู้รับโดยประมาณ</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-purple-700">
                                    {isCounting ? "..." : (recipientCount !== null ? recipientCount.toLocaleString() : "-")}
                                </span>
                                <span className="text-sm text-purple-600">คน</span>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Toggle */}
                    <div className="flex items-center space-x-2 py-2">
                        <Switch
                            id="schedule-mode"
                            checked={isScheduled}
                            onCheckedChange={setIsScheduled}
                            className="data-[state=checked]:bg-purple-600"
                        />
                        <Label htmlFor="schedule-mode" className="cursor-pointer text-slate-700 font-medium">ตั้งเวลาส่งล่วงหน้า</Label>
                    </div>

                    {isScheduled && (
                        <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl bg-slate-50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 space-y-2">
                                <Label>วันที่</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white h-11", !scheduledDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {scheduledDate ? format(scheduledDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={scheduledDate}
                                            onSelect={setScheduledDate}
                                            initialFocus
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="w-full sm:w-[150px] space-y-2">
                                <Label>เวลา</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        className="pl-9 bg-white h-11"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        className="w-full h-14 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                        onClick={handleSend}
                        disabled={isPending || !isValid || (isScheduled && !scheduledDate)}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                กำลังส่งข้อความ...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" /> ยืนยันการส่งข้อความ
                            </>
                        )}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}

// UI Components to match the reference

function MessageTypeOption({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-medium min-w-[140px] shadow-sm",
                active
                    ? "bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-full border flex items-center justify-center transition-colors",
                active ? "bg-white border-purple-200 text-purple-600" : "bg-slate-50 border-slate-200 text-slate-400"
            )}>
                {icon}
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5">
                <span className={active ? "text-purple-900 font-semibold" : "text-slate-700"}>{label}</span>
                {active && <span className="text-[10px] text-purple-500">เลือกแล้ว</span>}
            </div>
        </button>
    );
}

function TargetOption({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm min-w-[120px]",
                active
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
        >
            <div className={cn(
                "p-1.5 rounded-md flex items-center justify-center transition-colors",
                active ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
            )}>
                {icon}
            </div>
            <span className="font-medium">{label}</span>
        </button>
    );
}
