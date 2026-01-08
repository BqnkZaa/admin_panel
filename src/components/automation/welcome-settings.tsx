"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveWelcomeMessage } from "@/actions/automation.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquareText, FileJson, LayoutTemplate } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlexTemplatePicker } from "@/components/flex/flex-template-picker";

interface WelcomeSettingsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: any | null;
}

export function WelcomeSettings({ initialData }: WelcomeSettingsProps) {
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [messageType, setMessageType] = useState<"TEXT" | "FLEX">(initialData?.messageType ?? "TEXT");

    // Text Content
    const [textContent, setTextContent] = useState(
        initialData?.messageType === "TEXT" && initialData?.content?.text
            ? initialData.content.text
            : "ยินดีต้อนรับสู่ LINE OA ของเรา!"
    );

    // Flex Content
    const [altText, setAltText] = useState(initialData?.altText ?? "ยินดีต้อนรับ!");
    const [flexContent, setFlexContent] = useState(
        initialData?.messageType === "FLEX"
            ? JSON.stringify(initialData.content, null, 2)
            : '{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": [\n      {\n        "type": "text",\n        "text": "Welcome!"\n      }\n    ]\n  }\n}'
    );

    const [pickerOpen, setPickerOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTemplateSelect = (template: { name: string; content: any }) => {
        setFlexContent(JSON.stringify(template.content, null, 2));
        toast({ title: "Template Loaded", description: `Loaded "${template.name}"` });
    };

    const handleSave = () => {
        let finalContent;

        if (messageType === "TEXT") {
            if (!textContent.trim()) {
                toast({ title: "Error", description: "Text message cannot be empty", variant: "destructive" });
                return;
            }
            finalContent = { type: "text", text: textContent };
        } else {
            if (!altText.trim()) {
                toast({ title: "Error", description: "Alt Text is required for Flex messages", variant: "destructive" });
                return;
            }
            try {
                finalContent = JSON.parse(flexContent);
            } catch {
                toast({ title: "Error", description: "Invalid JSON format in Flex Message", variant: "destructive" });
                return;
            }
        }

        startTransition(async () => {
            const result = await saveWelcomeMessage({
                messageType,
                content: finalContent,
                altText: messageType === "FLEX" ? altText : undefined,
                isActive
            });

            if (result.success) {
                toast({ title: "Settings saved", description: "Welcome message updated." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Welcome Message</CardTitle>
                        <CardDescription>
                            ข้อความที่จะส่งหาลูกค้าอัตโนมัติเมื่อกดติดตาม (Follow)
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="welcome-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="welcome-active">{isActive ? "On" : "Off"}</Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Message Type Selection */}
                <div className="space-y-3">
                    <Label className="text-base">Message Type</Label>
                    <RadioGroup
                        value={messageType}
                        onValueChange={(val: string) => setMessageType(val as "TEXT" | "FLEX")}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <RadioGroupItem value="TEXT" id="type-text" className="peer sr-only" />
                            <Label
                                htmlFor="type-text"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <MessageSquareText className="mb-2 h-6 w-6" />
                                <span className="font-semibold">Text Message</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="FLEX" id="type-flex" className="peer sr-only" />
                            <Label
                                htmlFor="type-flex"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <FileJson className="mb-2 h-6 w-6" />
                                <span className="font-semibold">Flex Message</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Editor Area */}
                <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900/50">
                    {messageType === "TEXT" ? (
                        <div className="space-y-2">
                            <Label>Message Text</Label>
                            <Textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                disabled={!isActive}
                                className="min-h-[150px]"
                                placeholder="พิมพ์ข้อความต้อนรับ..."
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Alt Text (Notification Text)</Label>
                                <Input
                                    value={altText}
                                    onChange={(e) => setAltText(e.target.value)}
                                    placeholder="e.g. You have a new message!"
                                />
                                <p className="text-xs text-muted-foreground">ข้อความที่จะแสดงใน Notification เมื่อลูกค้าได้รับ Flex Message</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Flex JSON Code</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPickerOpen(true)}
                                        className="h-8"
                                    >
                                        <LayoutTemplate className="mr-2 h-3.5 w-3.5" />
                                        Load Template
                                    </Button>
                                </div>
                                <Textarea
                                    value={flexContent}
                                    onChange={(e) => setFlexContent(e.target.value)}
                                    disabled={!isActive}
                                    className="min-h-[300px] font-mono text-sm"
                                    placeholder='{ "type": "bubble", ... }'
                                />
                            </div>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isPending || !isActive}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>

            <FlexTemplatePicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onSelect={handleTemplateSelect}
            />
        </Card>
    );
}
