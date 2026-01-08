"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { createRichMenu } from "@/actions/rich-menu.actions";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const richMenuSchema = z.object({
    name: z.string().min(1, "Name is required"),
    chatBarText: z.string().min(1, "Chat bar text is required"),
    imageUrl: z.string().url("Must be a valid URL"),
    areas: z.string().min(1, "Areas JSON is required").refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, "Invalid JSON string"),
});

type RichMenuFormValues = z.infer<typeof richMenuSchema>;

const DEFAULT_AREAS_TEMPLATE = `[
  {
    "bounds": { "x": 0, "y": 0, "width": 2500, "height": 1686 },
    "action": { "type": "message", "text": "Hello" }
  }
]`;

interface CreateRichMenuDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateRichMenuDialog({ open, onOpenChange }: CreateRichMenuDialogProps) {
    const [isPending, startTransition] = useTransition();
    // Using explicit Generic can sometimes cause typed resolver issues if versions mismatch,
    // but let's try standard approach. If it fails like before, we remove generic.
    const form = useForm<RichMenuFormValues>({
        resolver: zodResolver(richMenuSchema),
        defaultValues: {
            name: "",
            chatBarText: "Menu",
            imageUrl: "",
            areas: DEFAULT_AREAS_TEMPLATE,
        },
    });

    const onSubmit = (data: RichMenuFormValues) => {
        startTransition(async () => {
            const result = await createRichMenu(data);
            if (result.success) {
                toast({ title: "Success", description: "Rich Menu created successfully." });
                onOpenChange(false);
                form.reset();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Rich Menu</DialogTitle>
                    <DialogDescription>
                        Configure the rich menu layout and actions. Standard size: 2500x1686.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        Must be a JPEG or PNG. <span className="font-bold text-red-500">REQUIRED SIZE: 2500 x 1686 pixels exactly.</span>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="areas"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between">
                                        <FormLabel>Areas JSON Definition</FormLabel>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => field.onChange(DEFAULT_AREAS_TEMPLATE)}
                                        >
                                            Reset to Template
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            className="font-mono text-xs min-h-[200px]"
                                            placeholder="[...] JSON Array"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Define clickable areas: bounds (x,y,w,h) and action.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create & Upload
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
