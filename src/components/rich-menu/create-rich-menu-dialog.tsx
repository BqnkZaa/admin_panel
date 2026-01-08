"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createRichMenu } from "@/actions/rich-menu.actions";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RICH_MENU_TEMPLATES, RichMenuTemplate } from "@/lib/rich-menu-templates";
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

// --- Types & Schemas ---

const baseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    chatBarText: z.string().min(1, "Chat bar text is required"),
    imageUrl: z.string().url("Must be a valid URL"),
});

const actionSchema = z.object({
    type: z.enum(["message", "uri", "postback"]),
    label: z.string().optional(),
    text: z.string().optional(),
    uri: z.string().optional(),
    data: z.string().optional(),
}).refine(data => {
    if (data.type === 'message' && !data.text) return false;
    if (data.type === 'uri' && !data.uri) return false;
    if (data.type === 'postback' && !data.data) return false;
    return true;
}, { message: "Missing required field for selected action type" });

type ActionValues = z.infer<typeof actionSchema>;



// --- Main Component ---

interface CreateRichMenuDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateRichMenuDialog({ open, onOpenChange }: CreateRichMenuDialogProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedTemplate, setSelectedTemplate] = useState<RichMenuTemplate | null>(null);
    const [configuredActions, setConfiguredActions] = useState<Record<number, ActionValues>>({});
    const [activeAreaIndex, setActiveAreaIndex] = useState<number | null>(null);

    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof baseSchema>>({
        resolver: zodResolver(baseSchema),
        defaultValues: {
            name: "",
            chatBarText: "Menu",
            imageUrl: "",
        },
    });

    const handleBasicInfoSubmit = async () => {
        const result = await form.trigger();
        if (result) {
            setStep(2);
        }
    };

    const handleTemplateSelect = (template: RichMenuTemplate) => {
        setSelectedTemplate(template);
        setConfiguredActions({}); // Reset actions on template change
        setStep(3);
    };

    const handleSaveAction = (index: number, action: ActionValues) => {
        setConfiguredActions(prev => ({ ...prev, [index]: action }));
        setActiveAreaIndex(null);
    };

    const handleDeleteAction = (index: number) => {
        setConfiguredActions(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
        setActiveAreaIndex(null);
    };

    const onSubmit = () => {
        if (!selectedTemplate) return;

        // Construct final 'areas' array
        const areas = Object.entries(configuredActions).map(([index, action]) => {
            const idx = parseInt(index);
            const templateArea = selectedTemplate.areas[idx];
            return {
                bounds: templateArea,
                action: action
            };
        });

        if (areas.length === 0) {
            toast({ title: "Error", description: "Please configure at least one button.", variant: "destructive" });
            return;
        }

        const formData = form.getValues();
        const finalPayload = {
            ...formData,
            areas: JSON.stringify(areas), // API expects JSON string
            size: selectedTemplate.type === 'compact'
                ? { width: 2500, height: 843 }
                : { width: 2500, height: 1686 }
        };

        startTransition(async () => {
            const result = await createRichMenu(finalPayload);
            if (result.success) {
                toast({ title: "Success", description: "Rich Menu created successfully." });
                onOpenChange(false);
                resetDialog();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const resetDialog = () => {
        setStep(1);
        form.reset();
        setSelectedTemplate(null);
        setConfiguredActions({});
        setActiveAreaIndex(null);
    };

    // --- Render Helpers ---

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetDialog();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Create Rich Menu</DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Step 1: Basic Information"}
                        {step === 2 && "Step 2: Select Layout Template"}
                        {step === 3 && "Step 3: Configure Actions"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {step === 1 && (
                        <Form {...form}>
                            <form className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name (Internal)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Main Menu v1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="chatBarText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Chat Bar Text</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tap to open menu" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Image URL (Public)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/menu_bg.jpg" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Ensure image matches the template size (usually 2500x1686 or 2500x843).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {RICH_MENU_TEMPLATES.map((tpl) => (
                                <Card
                                    key={tpl.id}
                                    className="cursor-pointer hover:border-black transition-all p-4 flex flex-col items-center gap-2"
                                    onClick={() => handleTemplateSelect(tpl)}
                                >
                                    <div className={cn(
                                        "w-full bg-slate-100 border border-slate-200 rounded-sm relative",
                                        tpl.type === 'compact' ? 'aspect-[2500/843]' : 'aspect-[2500/1686]'
                                    )}>
                                        {/* Mini Grid Preview */}
                                        {tpl.areas.map((area, idx) => (
                                            <div
                                                key={idx}
                                                className="absolute border border-slate-300 bg-white/50"
                                                style={{
                                                    left: `${(area.x / 2500) * 100}%`,
                                                    top: `${(area.y / (tpl.type === 'compact' ? 843 : 1686)) * 100}%`,
                                                    width: `${(area.width / 2500) * 100}%`,
                                                    height: `${(area.height / (tpl.type === 'compact' ? 843 : 1686)) * 100}%`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium">{tpl.name}</span>
                                </Card>
                            ))}
                        </div>
                    )}

                    {step === 3 && selectedTemplate && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-center bg-slate-100 p-4 border rounded-md overflow-hidden relative">
                                <div className={cn("relative w-full max-w-[600px] shadow-lg",
                                    selectedTemplate.type === 'compact' ? 'aspect-[2500/843]' : 'aspect-[2500/1686]'
                                )}>
                                    {/* Background Image */}
                                    {form.getValues("imageUrl") ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={form.getValues("imageUrl")}
                                            alt="Rich Menu Background"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                                            No Image
                                        </div>
                                    )}

                                    {/* Grid Overlay */}
                                    {selectedTemplate.areas.map((area, idx) => {
                                        const action = configuredActions[idx];
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveAreaIndex(idx)}
                                                className={cn(
                                                    "absolute border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-xs text-center font-semibold select-none group",
                                                    action
                                                        ? "border-green-500 bg-green-500/30 text-white hover:bg-green-500/40"
                                                        : "border-slate-400/50 hover:bg-white/30 text-transparent hover:text-black"
                                                )}
                                                style={{
                                                    left: `${(area.x / 2500) * 100}%`,
                                                    top: `${(area.y / (selectedTemplate.type === 'compact' ? 843 : 1686)) * 100}%`,
                                                    width: `${(area.width / 2500) * 100}%`,
                                                    height: `${(area.height / (selectedTemplate.type === 'compact' ? 843 : 1686)) * 100}%`,
                                                }}
                                            >
                                                {action ? (
                                                    <>
                                                        <span className="bg-black/50 px-2 py-1 rounded mb-1">{idx + 1}</span>
                                                        <span className="bg-black/50 px-2 py-1 rounded truncate max-w-[90%]">
                                                            {action.type === 'message' ? action.text : action.type === 'uri' ? 'Link' : 'Postback'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="bg-white/80 px-2 py-1 rounded text-black opacity-0 group-hover:opacity-100">
                                                        Set Action {idx + 1}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(configuredActions).map(([idx, action]) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded text-sm">
                                        <span className="bg-slate-200 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                            {parseInt(idx) + 1}
                                        </span>
                                        <div className="flex-1 truncate">
                                            <span className="font-semibold capitalize">{action.type}:</span>{" "}
                                            {action.text || action.uri || action.data}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500"
                                            onClick={() => handleDeleteAction(parseInt(idx))}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                {Object.keys(configuredActions).length === 0 && (
                                    <p className="text-sm text-slate-500 italic col-span-3 text-center py-4">
                                        Click on the areas in the image above to configure actions.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-2 border-t bg-slate-50">
                    <div className="w-full flex justify-between">
                        {step > 1 ? (
                            <Button
                                variant="outline"
                                onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
                                disabled={isPending}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        ) : (
                            <div /> // Spacer
                        )}

                        {step === 1 && (
                            <Button onClick={handleBasicInfoSubmit}>
                                Next: Select Template
                            </Button>
                        )}
                        {step === 2 && (
                            <div className="text-sm text-slate-500 flex items-center">
                                Select a layout to continue
                            </div>
                        )}
                        {step === 3 && (
                            <Button onClick={onSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Rich Menu
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Action Configuration Dialog (Nested/Overlay) */}
            {activeAreaIndex !== null && (
                <ActionConfigDialog
                    open={true}
                    onOpenChange={(val) => !val && setActiveAreaIndex(null)}
                    onSave={(action) => handleSaveAction(activeAreaIndex, action)}
                    initialValue={configuredActions[activeAreaIndex]}
                    title={`Configure Action for Area ${activeAreaIndex + 1}`}
                />
            )}
        </Dialog>
    );
}

// --- Sub-Component: Action Configuration ---

function ActionConfigDialog({ open, onOpenChange, onSave, initialValue, title }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (action: ActionValues) => void;
    initialValue?: ActionValues;
    title: string;
}) {
    const defaultVals = initialValue || { type: "message", text: "", uri: "", data: "" };

    // We need a separate form instance for this dialog
    const actionForm = useForm<ActionValues>({
        resolver: zodResolver(actionSchema),
        defaultValues: defaultVals as ActionValues,
    });

    const onSubmit = (data: ActionValues) => {
        onSave(data);
        // onOpenChange(false) handles closing via prop update
    };

    const type = actionForm.watch("type");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] z-50">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <Form {...actionForm}>
                    <form onSubmit={actionForm.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={actionForm.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Action Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select action type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="message">Message (Text)</SelectItem>
                                            <SelectItem value="uri">Open Link (URI)</SelectItem>
                                            <SelectItem value="postback">Postback (Data)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        {type === 'message' && (
                            <FormField
                                control={actionForm.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message Text</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Hello World" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {type === 'uri' && (
                            <FormField
                                control={actionForm.control}
                                name="uri"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {type === 'postback' && (
                            <FormField
                                control={actionForm.control}
                                name="data"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Postback Data</FormLabel>
                                        <FormControl>
                                            <Input placeholder="action=buy&item=1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="submit">Save Action</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
