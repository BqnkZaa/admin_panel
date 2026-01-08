"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import { sendBroadcast } from "@/actions/broadcast.actions";
import { sendTestBroadcast } from "@/actions/broadcast.actions";
import { Loader2, Send, CheckCircle, AlertCircle, Code, Calendar as CalendarIcon, Clock } from "lucide-react";
import { ProductPickerDialog } from "@/components/broadcast/product-picker-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function BroadcastForm() {
    const [messageType, setMessageType] = useState("text");
    const [textMessage, setTextMessage] = useState("");
    const [flexJson, setFlexJson] = useState("");
    const [altText, setAltText] = useState("ท่านได้รับข้อความใหม่");
    const [isPending, startTransition] = useTransition();
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Scheduling State
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
    const [scheduledTime, setScheduledTime] = useState("09:00");

    const [testUserId, setTestUserId] = useState("");
    const [isTestPending, startTestTransition] = useTransition();
    const { toast } = useToast();
    interface RichMenu {
        richMenuId: string;
        name: string;
    }

    const [targetType, setTargetType] = useState("all");
    const [richMenus, setRichMenus] = useState<RichMenu[]>([]);
    const [selectedRichMenuId, setSelectedRichMenuId] = useState("");
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

    useEffect(() => {
        // Fetch Rich Menus on load
        import("@/actions/rich-menu.actions").then(({ getRichMenus }) => {
            getRichMenus().then(setRichMenus);
        });
    }, []);

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

    const handleSend = () => {
        let content;

        if (messageType === "text") {
            if (!textMessage.trim()) return;
            content = { type: "text", text: textMessage };
        } else {
            const parsed = validateJson();
            if (!parsed) return;
            content = {
                type: "flex",
                altText: altText,
                contents: parsed
            };
        }

        let scheduledAt: Date | undefined = undefined;
        if (isScheduled && scheduledDate) {
            const [hours, minutes] = scheduledTime.split(":").map(Number);
            scheduledAt = new Date(scheduledDate);
            scheduledAt.setHours(hours, minutes, 0, 0);
        }

        startTransition(async () => {
            await sendBroadcast({
                name: `Broadcast ${new Date().toLocaleString('th-TH')}`,
                messageContent: content,
                targetType: targetType === "rich_menu" ? "RICH_MENU" : "ALL",
                targetIds: targetType === "rich_menu" ? [selectedRichMenuId] : [],
                scheduledAt: scheduledAt,
            });

            // Reset form
            setTextMessage("");
            setFlexJson("");
            setIsScheduled(false);
            setScheduledDate(undefined);
        });
    };

    const handleTestSend = () => {
        if (!testUserId.trim()) return;

        let content;
        if (messageType === "text") {
            if (!textMessage.trim()) return;
            content = { type: "text", text: textMessage };
        } else {
            const parsed = validateJson();
            if (!parsed) return;
            content = {
                type: "flex",
                altText: altText,
                contents: parsed
            };
        }

        startTestTransition(async () => {
            const result = await sendTestBroadcast({
                messageContent: content,
                targetUserId: testUserId.trim(),
            });

            if (result.success) {
                toast({ title: "Test message sent", description: "Please check your LINE app." });
                setIsTestDialogOpen(false);
            } else {
                toast({ title: "Failed to send test", description: result.error, variant: "destructive" });
            }
        });
    };

    const isContentValid = messageType === "text" ? textMessage.trim().length > 0 : (flexJson.length > 0 && !jsonError);
    const isTargetValid = targetType === "all" || (targetType === "rich_menu" && selectedRichMenuId);
    const isValid = isContentValid && isTargetValid;
    const isScheduleValid = !isScheduled || (isScheduled && scheduledDate);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>สร้างข้อความใหม่</CardTitle>
                <CardDescription>
                    ส่งข้อความหาลูกค้าทั้งหมดในระบบ
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>ผู้รับ</Label>
                        <Select
                            value={targetType}
                            onValueChange={(val) => {
                                setTargetType(val);
                                // Reset selection if switching away
                                if (val !== "rich_menu") setSelectedRichMenuId("");
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกกลุ่มเป้าหมาย" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ลูกค้าทั้งหมด (All)</SelectItem>
                                <SelectItem value="rich_menu">กลุ่ม Rich Menu</SelectItem>
                                <SelectItem value="selected" disabled>เลือกเอง (Coming Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {targetType === "rich_menu" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>เลือก Rich Menu</Label>
                            <Select
                                value={selectedRichMenuId}
                                onValueChange={setSelectedRichMenuId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือก Rich Menu ที่ต้องการส่งหา" />
                                </SelectTrigger>
                                <SelectContent>
                                    {richMenus.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">ไม่มี Rich Menu</div>
                                    ) : (
                                        richMenus.map((menu) => (
                                            <SelectItem key={menu.richMenuId} value={menu.richMenuId}>
                                                {menu.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-slate-50">
                    <Switch
                        id="schedule-mode"
                        checked={isScheduled}
                        onCheckedChange={setIsScheduled}
                    />
                    <Label htmlFor="schedule-mode">ตั้งเวลาส่ง (Schedule for later)</Label>
                </div>

                {isScheduled && (
                    <div className="flex gap-4 p-3 border rounded-lg bg-white animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-2">
                            <Label>วันที่</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !scheduledDate && "text-muted-foreground"
                                        )}
                                    >
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
                        <div className="w-[120px] space-y-2">
                            <Label>เวลา</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="time"
                                    className="pl-8"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <Tabs value={messageType} onValueChange={setMessageType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">Text Message</TabsTrigger>
                        <TabsTrigger value="flex">Flex Message</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>ข้อความ</Label>
                            <Textarea
                                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                                className="min-h-[150px]"
                                value={textMessage}
                                onChange={(e) => setTextMessage(e.target.value)}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="flex" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Alt Text (ข้อความแทนในแจ้งเตือน)</Label>
                            <Input
                                value={altText}
                                onChange={(e) => setAltText(e.target.value)}
                                placeholder="ท่านได้รับข้อความใหม่"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <Label>Flex JSON Content</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const parsed = validateJson();
                                        if (parsed) {
                                            setFlexJson(JSON.stringify(parsed, null, 2));
                                        }
                                    }}
                                >
                                    <Code className="w-4 h-4 mr-1" /> Format
                                </Button>
                                <ProductPickerDialog onProductSelect={handleProductSelect} />
                            </div>
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
                                <AlertTitle>Invalid JSON</AlertTitle>
                                <AlertDescription>{jsonError}</AlertDescription>
                            </Alert>
                        )}

                        {!jsonError && flexJson && (
                            <Alert className="bg-green-50 text-green-900 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle>JSON Valid</AlertTitle>
                                <AlertDescription>พร้อมส่ง Flex Message</AlertDescription>
                            </Alert>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                    <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-[150px]" disabled={!isValid}>
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
                                    <p className="text-xs text-muted-foreground">
                                        You can find your User ID in the Chat or under your profile in the database.
                                    </p>
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
                        className="flex-1"
                        onClick={handleSend}
                        disabled={isPending || !isValid || !isScheduleValid}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังประมวลผล...
                            </>
                        ) : (
                            <>
                                {isScheduled && scheduledDate ? (
                                    <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        ตั้งเวลาส่ง ({format(scheduledDate, "d MMM", { locale: th })} {scheduledTime})
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        ส่งข้อความ Broadcast (จริง)
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
