"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    // CardDescription, CardTitle removed
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendBroadcast, sendTestBroadcast, calculateRecipientCount } from "@/actions/broadcast.actions";
import { getRichMenus } from "@/actions/rich-menu.actions";
import { getAllUniqueTags } from "@/actions/tag.actions";
import { Loader2, Send, CheckCircle, AlertCircle, Code, Calendar as CalendarIcon, Clock, Users, Tag, Image as ImageIcon, MessageSquare, Menu, UserCircle } from "lucide-react";
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

    // Test Dialog State
    const [testUserId, setTestUserId] = useState("");
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [isTestPending, startTestTransition] = useTransition();

    // Form Submission State
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // --- Load Initial Data ---
    useEffect(() => {
        // Fetch Rich Menus
        getRichMenus().then(menus => {
            // Adapt to expected format. LINE SDK returns { richMenuId, name, ... }
            // We use richMenuId for both ID and aliasId since that's what we store in Customer.richMenuAliasId
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
            }

            // Optimize: unnecessary calls
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

            // Debounce could be added here if this causes too many requests, 
            // but for now relying on react effects isn't too spammy unless user types furiously in specificUserIds

            const result = await calculateRecipientCount(targetType, targetIds);
            if (result.success) {
                setRecipientCount(result.count);
            } else {
                setRecipientCount(null); // Error state
            }
            setIsCounting(false);
        };

        const timer = setTimeout(fetchCount, 500); // 500ms debounce
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
            toast({ title: "กรุณาระบุชื่อ Broadcast", variant: "destructive" });
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

        startTransition(async () => {
            const result = await sendBroadcast({
                name: broadcastName,
                messageContent: content,
                targetType: targetType,
                targetIds: targetIds,
                scheduledAt: scheduledAt,
                // Passing full config not strictly needed if we just use targetIds for now as per action logic
            });

            if (result.success) {
                toast({ title: "Broadcast saved/queued!" });
                // Reset form slightly
                setTextMessage("");
                setImageUrl("");
                setBroadcastName("");
            } else {
                toast({ title: "Failed", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleTestSend = () => {
        if (!testUserId.trim()) return;
        const content = getMessageContent();
        if (!content) return;

        startTestTransition(async () => {
            const result = await sendTestBroadcast({
                messageContent: content,
                targetUserId: testUserId.trim(),
            });

            if (result.success) {
                toast({ title: "Test sent successfully" });
                setIsTestDialogOpen(false);
            } else {
                toast({ title: "Failed to send test", description: result.error, variant: "destructive" });
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
        (targetType === "TAG" && selectedTags.length > 0) ||
        (targetType === "RICH_MENU" && selectedRichMenuAliasId !== "") ||
        (targetType === "SPECIFIC_USERS" && specificUserIds.trim().length > 0);

    const isValid = broadcastName.trim().length > 0 && isContentValid && isTargetValid;


    return (
        <Card className="h-full border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-base font-semibold">ชื่อ Broadcast (สำหรับการจัดการภายใน)</Label>
                        <Input
                            placeholder="ตัวอย่าง: โปรโมชั่นปีใหม่ 2026 #1"
                            value={broadcastName}
                            onChange={(e) => setBroadcastName(e.target.value)}
                            className="text-lg py-6"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-6">

                {/* 1. Message Content Section */}
                <div className="space-y-4 border rounded-xl p-4 bg-white/50">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">เนื้อหาข้อความ</h3>
                    </div>

                    <Tabs value={messageType} onValueChange={setMessageType} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="text" className="gap-2"><span className="font-serif font-bold">A</span> ข้อความ</TabsTrigger>
                            <TabsTrigger value="image" className="gap-2"><ImageIcon className="w-4 h-4" /> รูปภาพ</TabsTrigger>
                            <TabsTrigger value="flex" className="gap-2"><Code className="w-4 h-4" /> Flex Message</TabsTrigger>
                        </TabsList>

                        <TabsContent value="text" className="space-y-2 mt-0">
                            <Textarea
                                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                                className="min-h-[200px] text-base resize-none"
                                value={textMessage}
                                onChange={(e) => setTextMessage(e.target.value)}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>สามารถใส่ Emoji ได้</span>
                                <span>{textMessage.length}/2000</span>
                            </div>
                        </TabsContent>

                        <TabsContent value="image" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label>Image URL (ต้องเป็น HTTPS)</Label>
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">ขนาดไฟล์สูงสุด 10MB, รองรับ JPEG และ PNG</p>
                            </div>

                            {imageUrl && (
                                <div className="border rounded-lg p-2 bg-slate-50 flex justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-h-[300px] object-contain rounded shadow-sm"
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="flex" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label>Alt Text</Label>
                                <Input
                                    value={altText}
                                    onChange={(e) => setAltText(e.target.value)}
                                    placeholder="ข้อความที่จะแสดงในการแจ้งเตือน"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                    const parsed = validateJson();
                                    if (parsed) setFlexJson(JSON.stringify(parsed, null, 2));
                                }}>
                                    <Code className="w-4 h-4 mr-1" /> Reformat
                                </Button>
                                <ProductPickerDialog onProductSelect={handleProductSelect} />
                            </div>
                            <Textarea
                                placeholder='{ "type": "bubble", ... }'
                                className="min-h-[200px] font-mono text-xs"
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
                        </TabsContent>
                    </Tabs>
                </div>


                {/* 2. Targeting Section */}
                <div className="space-y-4 border rounded-xl p-4 bg-white/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-lg">กลุ่มเป้าหมาย</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <TargetOption
                            active={targetType === "ALL"}
                            onClick={() => setTargetType("ALL")}
                            icon={<Users className="w-6 h-6" />}
                            label="ลูกค้าทั้งหมด"
                        />
                        <TargetOption
                            active={targetType === "TAG"}
                            onClick={() => setTargetType("TAG")}
                            icon={<Tag className="w-6 h-6" />}
                            label="ตาม Tags"
                        />
                        <TargetOption
                            active={targetType === "RICH_MENU"}
                            onClick={() => setTargetType("RICH_MENU")}
                            icon={<Menu className="w-6 h-6" />}
                            label="กลุ่ม Rich Menu"
                        />
                        <TargetOption
                            active={targetType === "SPECIFIC_USERS"}
                            onClick={() => setTargetType("SPECIFIC_USERS")}
                            icon={<UserCircle className="w-6 h-6" />}
                            label="ระบุ User ID"
                        />
                    </div>

                    {/* Target Specific Settings */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                        {targetType === "ALL" && (
                            <p className="text-sm text-slate-600">ส่งข้อความหาลูกค้าทั้งหมดที่ติดตามบัญชีไลน์นี้</p>
                        )}

                        {targetType === "TAG" && (
                            <div className="space-y-3">
                                <Label>เลือก Tags (ส่งหาคนที่มี Tag ใด Tag หนึ่ง)</Label>
                                {availableTags.length === 0 ? (
                                    <div className="text-sm text-yellow-600">ไม่พบ Tags ในระบบ</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map(tag => (
                                            <Badge
                                                key={tag}
                                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                                className="cursor-pointer text-sm py-1 px-3 hover:bg-primary/90 hover:text-white transition-colors"
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
                            <div className="space-y-3">
                                <Label>เลือก Rich Menu Group</Label>
                                <Select value={selectedRichMenuAliasId} onValueChange={setSelectedRichMenuAliasId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="เลือก Rich Menu" />
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
                            <div className="space-y-3">
                                <Label>Line User IDs (คั่นด้วยเครื่องหมายคอมม่า)</Label>
                                <Textarea
                                    placeholder="U1234..., U5678..."
                                    value={specificUserIds}
                                    onChange={(e) => setSpecificUserIds(e.target.value)}
                                    className="bg-white font-mono text-xs"
                                />
                                <p className="text-xs text-muted-foreground">เหมาะสำหรับการเทสกลุ่มเล็กๆเฉพาะเจาะจง</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Scheduling & Actions */}
                <div className="flex items-center space-x-2 p-3">
                    <Switch
                        id="schedule-mode"
                        checked={isScheduled}
                        onCheckedChange={setIsScheduled}
                    />
                    <Label htmlFor="schedule-mode" className="cursor-pointer">ตั้งเวลาส่ง (Schedule)</Label>
                </div>

                {isScheduled && (
                    <div className="flex gap-4 p-4 border rounded-xl bg-slate-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-2">
                            <Label>วันที่</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white", !scheduledDate && "text-muted-foreground")}>
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
                        <div className="w-[150px] space-y-2">
                            <Label>เวลา</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="time"
                                    className="pl-8 bg-white"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}


                {/* Recipient Counter Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10 shadow-lg md:relative md:shadow-none md:border-0 md:bg-transparent md:p-0 md:static">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">

                        {/* Blue Info Bar */}
                        <div className="hidden md:flex flex-1 bg-blue-50 text-blue-900 px-4 py-3 rounded-lg border border-blue-200 items-center gap-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">
                                {isCounting ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> กำลังคำนวณ...</span>
                                ) : (
                                    <>กำลังส่งหา <span className="text-blue-700 font-bold text-lg">{recipientCount !== null ? recipientCount.toLocaleString() : "-"}</span> คน</>
                                )}
                            </span>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            {/* Test Button */}
                            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex-1 md:flex-none" disabled={!isContentValid}>
                                        <Send className="mr-2 h-4 w-4" /> Test Send
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Send Test Message</DialogTitle>
                                        <DialogDescription>
                                            Enter a LINE User ID to receive this message immediately.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Target User ID</Label>
                                            <Input
                                                placeholder="U1234..."
                                                value={testUserId}
                                                onChange={(e) => setTestUserId(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleTestSend} disabled={isTestPending || !testUserId.trim()}>
                                            {isTestPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Now"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button
                                className="flex-[2] md:w-[200px]"
                                onClick={handleSend}
                                disabled={isPending || !isValid || (isScheduled && !scheduledDate)}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {isScheduled ? (
                                            <>
                                                <Clock className="mr-2 h-4 w-4" /> Schedule Broadcast
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" /> Send Broadcast
                                            </>
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}

function TargetOption({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:bg-slate-50 text-center gap-2",
                active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 bg-white text-slate-600"
            )}
        >
            <div className={cn("p-2 rounded-full", active ? "bg-blue-200" : "bg-slate-100")}>
                {icon}
            </div>
            <span className="font-medium text-sm">{label}</span>
        </div>
    );
}
